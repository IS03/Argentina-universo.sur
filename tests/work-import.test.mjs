import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm, stat, chmod, symlink } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync, execFileSync } from 'node:child_process';
import { gzipSync, brotliCompressSync } from 'node:zlib';
import { syntheticWorkSnapshot, syntheticPresentationMapping } from '../scripts/editorial/work-fixtures.mjs';
import { planWorkImport, publicSummary } from '../scripts/editorial/work-import.mjs';
import { stableId, MASTER_ID } from '../scripts/editorial-import.mjs';
import { decodeSheetDates } from '../scripts/editorial/sheet-dates.mjs';
import { readPrivateJson, writePrivateJson } from '../scripts/editorial/private-io.mjs';
import { prepareWorkReview } from '../lib/destinos/work-review.ts';
import { renderWorkDestination } from '../scripts/editorial/render-work.mjs';
import { auditPublicArtifact } from '../scripts/pages/editorial-security.mjs';
import { assertWorkIsolation, privateWorkNeedles } from '../scripts/editorial/work-audit.mjs';

const options = { asOf: '2026-10-25' };
const plan = (s = syntheticWorkSnapshot(), previous = null) => planWorkImport(s, previous, options);
const codes = s => plan(s).issues.map(i => i.code);

test('84 synthetic records preserve original IDs, all unknown fields and 55/3/26 classifications without publication', () => {
  const s = syntheticWorkSnapshot(), before = structuredClone(s), p = plan(s);
  assert.equal(p.canStage, true);
  assert.deepEqual(p.counts, { selected: 84, processed: 84, real: 0, synthetic: 84, classifications: { candidata_acotada: 55, decision_numerica_independiente: 3, borrador_retenido: 26 }, numericRecords: 3, numericComponents: 3, issues: 0, publishable: 0 });
  for (const r of p.records) {
    assert.equal(r.internalId, stableId(MASTER_ID, r.originalIdentity.sheet, r.originalIdentity.originalId));
    assert.notEqual(r.internalId, r.originalIdentity.originalId);
    assert.deepEqual(r.originalPayload, s.tables[r.originalIdentity.sheet].find(row => row.id === r.originalIdentity.originalId));
    assert.equal(r.status, 'draft'); assert.equal(r.review, null); assert.equal(r.publicationAuthorized, false);
    assert.equal(r.approvalStatus, 'pending'); assert.equal(r.publicationPermitted, false);
    assert.match(r.sourceHash, /^[a-f0-9]{64}$/); assert.match(r.reviewHash, /^[a-f0-9]{64}$/);
  }
  assert.equal(p.publicWrites, 0); assert.equal(p.remoteWrites, 0); assert.deepEqual(s, before);
});

test('proposal cells, documentary status and historical publicable never become a human decision', () => {
  const s = syntheticWorkSnapshot();
  s.tables.Exportacion_piloto.forEach(p => { p.aprobacion_humana = 'aprobada'; p.permiso_publicacion = 'autorizado'; });
  s.tables.Destinos[0].estado_editorial = 'publicado';
  const p = plan(s);
  assert.ok(p.records.every(r => r.review === null && !r.publicationAuthorized && !r.publicationPermitted));
  assert.equal(p.records[0].documentary.originalProposal.aprobacion_humana, 'aprobada');
});

test('idempotent retry and title/slug changes retain identity; missing support rows are retained, never deleted', () => {
  const s = syntheticWorkSnapshot(), repeated = plan(s, s);
  assert.ok(repeated.records.every(r => r.operation === 'unchanged' && r.changedFields.length === 0));
  assert.ok(repeated.supportChanges.every(r => r.operation === 'unchanged'));
  assert.deepEqual(repeated.retainedMissing, []);
  const newer = structuredClone(s); newer.tables.Destinos[0].nombre = 'Nuevo título de prueba'; newer.tables.Destinos[0].slug = 'nuevo-slug';
  const changed = plan(newer, s).records[0];
  assert.equal(changed.internalId, repeated.records[0].internalId);
  assert.equal(changed.operation, 'update'); assert.ok(changed.changedFields.includes('nombre')); assert.notEqual(changed.sourceHash, repeated.records[0].sourceHash);
  const old = structuredClone(s); old.tables.Pendientes.push({ id: 'SYNTH-OLD-TASK', entidad_id: s.selection[0].id });
  assert.ok(plan(s, old).retainedMissing.includes('Pendientes/SYNTH-OLD-TASK'));
});

test('source, evidence and proposal changes alter the review hash and snapshot checksum independently of entity text', () => {
  const s = syntheticWorkSnapshot(), before = plan(s);
  for (const edit of [x => { x.tables.Fuentes[0].titulo += ' actualizado'; }, x => { x.tables.Evidencias[0].afirmacion_o_hallazgo += ' actualizado'; }, x => { x.tables.Exportacion_piloto[0].alcance_revision = 'nuevo alcance'; }]) {
    const newer = structuredClone(s); edit(newer); const after = plan(newer, s);
    assert.notEqual(after.checksum, before.checksum); assert.notEqual(after.records[0].reviewHash, before.records[0].reviewHash);
    assert.equal(after.records[0].operation, 'unchanged');
    assert.ok(after.supportChanges.some(r => r.operation === 'update'));
  }
});

test('84 unique F8 proposals are selected by explicit version, never by row order or historical proposal count', () => {
  const s = syntheticWorkSnapshot();
  for (let i = 0; i < 35; i++) s.tables.Exportacion_piloto.push({ ...s.tables.Exportacion_piloto[i], lote_id: 'SYNTH-OLD', version_propuesta: 'SYNTH-OLD' });
  assert.equal(plan(s).records.length, 84); assert.equal(plan(s).canStage, true);
  s.tables.Exportacion_piloto.push({ ...s.tables.Exportacion_piloto[0], lote_id: 'SYNTH-CONFLICT' });
  assert.ok(codes(s).includes('PROPOSAL_AMBIGUOUS_OR_MISSING'));
  const missing = syntheticWorkSnapshot(); missing.source.proposalVersion = 'SYNTH-NONEXISTENT';
  assert.equal(plan(missing).canStage, false);
});

test('invalid IDs, duplicate selection/slugs, unknown parents and wrong master block staging', () => {
  for (const edit of [s => { s.source.spreadsheetId = 'another-master'; }, s => { s.tables.Atractivos[0].destino_id = 'SYNTH-MISSING'; }, s => { s.tables.Destinos[0].id += ' '; }, s => { s.selection[1] = s.selection[0]; }, s => { s.tables.Atractivos[1].slug = s.tables.Atractivos[0].slug; }]) {
    const s = syntheticWorkSnapshot(); edit(s); assert.equal(plan(s).canStage, false);
  }
});

test('specific evidence, references and circuit relation types are checked without equating province and destination', () => {
  const s = syntheticWorkSnapshot(); s.tables.Evidencias[0].fuente_id = 'SYNTH-MISSING';
  assert.equal(plan(s).canStage, false);
  const e = syntheticWorkSnapshot(); e.tables.Evidencias = e.tables.Evidencias.filter(r => r.entidad_id !== e.selection[0].id);
  assert.ok(codes(e).includes('ENTITY_EVIDENCE_MISSING'));
  const r = syntheticWorkSnapshot(); r.tables.Relaciones.push({ id: 'SYNTH-REL-1', origen_id: r.selection[0].id, tipo: 'parada', destino_id: r.selection[1].id, orden: 0 });
  assert.ok(codes(r).includes('RELATION_KIND')); assert.ok(codes(r).includes('RELATION_ORDER'));
  const x = syntheticWorkSnapshot(); x.tables.Expansion_Santa_Fe.push({ id: 'SYNTH-EXP-1' });
  x.tables.Relaciones.push({ id: 'SYNTH-REL-1', origen_id: 'SYNTH-EXP-1', tipo: 'relevamiento_piloto', destino_id: x.selection[0].id, orden: 1 });
  assert.equal(plan(x).canStage, true);
});

test('numeric dependencies must exist, belong to that exact entity and keep an independent pending decision', () => {
  const s = syntheticWorkSnapshot(); const p = plan(s);
  assert.ok(p.records.filter(r => r.numericComponents.length).every(r => r.numericComponents.every(c => c.decision === 'pending')));
  s.tables.Datos_variables[0].entidad_id = s.selection[0].id;
  assert.ok(codes(s).includes('NUMERIC_COMPONENT_OWNER'));
  for (const edit of [s => { s.tables.Datos_variables[0].importe = '123'; }, s => { s.tables.Datos_variables[0].moneda = 'pesos'; }, s => { s.tables.Exportacion_piloto[55].componentes_condicionados_ids = ''; }]) {
    const s = syntheticWorkSnapshot(); edit(s); assert.equal(plan(s).canStage, false);
  }
});

test('source URLs, calendar dates, capture coherence and coordinate pairs fail closed', () => {
  for (const edit of [s => { s.tables.Fuentes[0].url = 'javascript:alert(1)'; }, s => { s.tables.Fuentes[0].url = 'https://user:password@example.org'; }, s => { s.tables.Fuentes[0].fecha_consulta = '2026-02-31'; }, s => { s.tables.Fuentes[0].fecha_publicacion = '2026-10-25'; }, s => { s.tables.Atractivos[0].latitud = 0; }, s => { s.source.kind = 'work'; s.source.modifiedBefore = '2026-10-23T00:00:00Z'; s.source.modifiedAfter = '2026-10-24T00:00:00Z'; }]) {
    const s = syntheticWorkSnapshot(); edit(s); assert.equal(plan(s).canStage, false);
  }
});

test('only observed DATE cells are decoded; raw values/formulas are preserved and affect hashes', () => {
  const s = syntheticWorkSnapshot(), id = s.selection[0].id, key = `Destinos/${id}/fecha_revision`;
  s.tables.Destinos[0].fecha_revision = 46318;
  s.dateCells = { [key]: { type: 'DATE', serial: 46318, display: '23/10/2026', formula: '=DATE(2026;10;23)' } };
  const p = plan(s);
  assert.equal(p.canStage, true); assert.equal(p.records[0].originalPayload.fecha_revision, 46318);
  assert.equal(p.records[0].normalizedPayload.fecha_revision, '2026-10-23');
  assert.equal(s.tables.Destinos[0].fecha_revision, 46318);
  assert.equal(plan(s, s).records[0].operation, 'unchanged');
  const changed = structuredClone(s); changed.dateCells[key].formula = '=46318';
  assert.notEqual(plan(changed, s).records[0].sourceHash, p.records[0].sourceHash);
  for (const edit of [s => { delete s.dateCells; }, s => { s.dateCells[key].type = 'NUMBER'; }, s => { s.dateCells[key].serial = 46319; }, s => { s.tables.Destinos[0].fecha_revision = 46318.5; }]) {
    const bad = structuredClone(s); edit(bad); assert.equal(plan(bad).canStage, false);
  }
  assert.equal(decodeSheetDates(s).conversions.length, 1);
});

test('private summary distinguishes real/synthetic counts without leaking identities, errors or content', () => {
  const s = syntheticWorkSnapshot(); s.tables.Atractivos[0].destino_id = 'SECRET-MISSING-ID';
  const p = plan(s), summary = JSON.stringify(publicSummary(p));
  assert.ok(p.issues.length > 0); assert.doesNotMatch(summary, /SECRET|SYNTH-|example\.org|AUS_PRIVATE|originalPayload|privateNote/);
  assert.equal(publicSummary(p).counts.real, 0);
});

test('private files enforce ignored paths, permissions, atomic overwrite and symlink rejection', async () => {
  await mkdir('.artifacts/pr17', { recursive: true });
  const dir = await mkdtemp('.artifacts/pr17/io-test-'), outside = await mkdtemp(join(tmpdir(), 'aus-private-'));
  try {
    const path = join(dir, 'snapshot.json'); await writePrivateJson(path, { synthetic: true });
    assert.deepEqual(await readPrivateJson(path), { synthetic: true }); assert.equal((await stat(path)).mode & 0o777, 0o600);
    await chmod(path, 0o644); await assert.rejects(readPrivateJson(path), /MODE/);
    await writePrivateJson(path, { replacement: true }); assert.equal((await stat(path)).mode & 0o777, 0o600);
    await assert.rejects(writePrivateJson('public/data/private.json', {}), /PRIVATE_PATH/);
    await symlink(outside, join(dir, 'link')); await assert.rejects(writePrivateJson(join(dir, 'link', 'plan.json'), {}), /PRIVATE_PATH/);
    await writeFile(join(outside, 'target.json'), 'untouched'); await symlink(join(outside, 'target.json'), join(dir, 'linked.json'));
    await assert.rejects(writePrivateJson(join(dir, 'linked.json'), {}), /PRIVATE_PATH/);
    assert.equal(await readFile(join(outside, 'target.json'), 'utf8'), 'untouched');
  } finally { await rm(dir, { recursive: true, force: true }); await rm(outside, { recursive: true, force: true }); }
});

test('CLI is dry-run only and never prints raw errors, paths or secrets', async () => {
  await mkdir('.artifacts/pr17', { recursive: true }); const dir = await mkdtemp('.artifacts/pr17/cli-test-');
  try {
    const s = syntheticWorkSnapshot(); s.tables.Atractivos[0].destino_id = 'SECRET-CLI-ID';
    const path = join(dir, 'input.json'); await writePrivateJson(path, s);
    const run = args => spawnSync(process.execPath, ['scripts/editorial-import.mjs', ...args], { encoding: 'utf8' });
    const p = run([path, '--output=' + join(dir, 'report.json')]);
    assert.equal(p.status, 1); assert.doesNotMatch(p.stdout + p.stderr, /SECRET-CLI-ID|AUS_PRIVATE|SYNTH-|originalPayload/);
    assert.ok((await readPrivateJson(join(dir, 'report.json'))).issues.length);
    for (const args of [[path, '--apply'], [path, '--output=public/leak.json'], [path, '--output=x', '--output=y']]) assert.equal(run(args).status, 1);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('visual adapter preserves original relationships and demands an explicit jurisdiction/category mapping', () => {
  const p = plan(), mapping = syntheticPresentationMapping(), id = 'SYNTH-DEST-001';
  const review = prepareWorkReview(p, id, mapping); assert.equal(review.issues.length, 0);
  assert.equal(review.destino.id, id); assert.equal(review.destino.localidades.length, 0);
  const expected = p.records.filter(r => r.originalIdentity.sheet === 'Atractivos' && r.originalPayload.destino_id === id).map(r => r.originalIdentity.originalId);
  assert.deepEqual(review.destino.atractivos.map(a => a.id), expected);
  const noMapping = structuredClone(mapping); noMapping.jurisdictionSlugs = {};
  assert.equal(prepareWorkReview(p, id, noMapping).destino, null);
  const noType = structuredClone(mapping); noType.attractionTypes = {};
  assert.equal(prepareWorkReview(p, id, noType).destino, null);
  const noRights = structuredClone(mapping); noRights.photos[0].rightsReviewed = false;
  assert.equal(prepareWorkReview(p, id, noRights).destino.fotos.length, 0);
  const badMap = structuredClone(mapping); badMap.locations[0].mapaUrl = 'https://example.org/unreviewed-map';
  assert.equal(prepareWorkReview(p, id, badMap).destino, null);
  const badPhoto = structuredClone(mapping); badPhoto.photos[0].foto.src = '/%2e%2e/private.webp';
  assert.equal(prepareWorkReview(p, id, badPhoto).destino, null);
});

test('synthetic SSR exercises destinations, attractions, sources, maps, practical facts, responsive photos and credits', async () => {
  const { destino } = prepareWorkReview(plan(), 'SYNTH-DEST-001', syntheticPresentationMapping());
  const html = await renderWorkDestination(destino);
  for (const text of ['Qué conocer', 'Organizar la visita', 'Ubicación', 'Fuentes', 'Institución ficticia', 'Fixture sintético local']) assert.ok(html.includes(text));
  assert.match(html, /srcSet=.*400w.*800w/); assert.match(html, /width="800" height="450"/);
  assert.match(html, /href="https:\/\/www.openstreetmap.org\//);
  assert.match(html, /dateTime="2026-10-24"/); assert.doesNotMatch(html, /AUS_PRIVATE|referenciasMaestro|originalPayload|numericComponents|dictamen_publicacion/);
});

test('artifact security rejects withheld Work data in HTML, RSC, JS, JSON, sitemap, compressed and auxiliary files', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'aus-work-audit-'));
  try {
    const secret = 'SYNTH-PRIVATE-UNIQUE-RECORD';
    for (const name of ['index.html', 'route.txt', 'app.js', 'data.json', 'sitemap.xml', 'auxiliary', 'data.js.gz', 'data.txt.br']) {
      let bytes = Buffer.from('prefix ' + encodeURIComponent(secret) + ' suffix');
      if (name.endsWith('.gz')) bytes = gzipSync(bytes); if (name.endsWith('.br')) bytes = brotliCompressSync(bytes);
      await writeFile(join(dir, name), bytes);
      const r = await auditPublicArtifact(dir, [], { privateNeedles: [secret] }); assert.ok(r.errors.length, name);
      assert.doesNotMatch(JSON.stringify(r.errors), /SYNTH-PRIVATE-UNIQUE-RECORD/);
      await rm(join(dir, name));
    }
    for (const marker of ['normalizedPayload', 'numericComponents', 'AUS_PRIVATE_WORK_CANARY', 'aprobacion_humana']) {
      await writeFile(join(dir, 'aux'), marker); assert.ok((await auditPublicArtifact(dir, [])).errors.length);
    }
    const s = syntheticWorkSnapshot();
    const privateText = 'Texto privado sintético suficientemente largo para detectar una copia que omite todos los identificadores y las claves editoriales.';
    s.tables.Destinos[0].perfil = privateText;
    await writeFile(join(dir, 'aux'), privateText);
    assert.ok((await auditPublicArtifact(dir, [], { privateNeedles: privateWorkNeedles(s) })).errors.length);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('build inputs block public Work routes/imports and tracked master snapshots', async () => {
  const root = await mkdtemp(join(tmpdir(), 'aus-work-inputs-'));
  try {
    execFileSync('git', ['init', '-q', root]); await mkdir(join(root, 'app'), { recursive: true });
    await writeFile(join(root, 'app/page.tsx'), 'export default function Page() {return null}');
    execFileSync('git', ['add', '.'], { cwd: root }); assert.equal((await assertWorkIsolation(root)).workPublicRoutes, 0);
    await writeFile(join(root, 'app/page.tsx'), 'import article from "@/lib/destinos/work-review";');
    await assert.rejects(assertWorkIsolation(root), /WORK_APP_IMPORT/);
    await writeFile(join(root, 'app/page.tsx'), ''); await mkdir(join(root, 'app/destinos'), { recursive: true });
    await writeFile(join(root, 'app/destinos/page.tsx'), ''); execFileSync('git', ['add', '.'], { cwd: root });
    await assert.rejects(assertWorkIsolation(root), /WORK_PUBLIC_ROUTE/);
    await rm(join(root, 'app/destinos'), { recursive: true }); execFileSync('git', ['add', '-A'], { cwd: root });
    await writeFile(join(root, 'master-snapshot.json'), '{}'); execFileSync('git', ['add', '.'], { cwd: root });
    await assert.rejects(assertWorkIsolation(root), /PRIVATE_TRACKED_INPUT/);
    assert.ok(relative(process.cwd(), root));
  } finally { await rm(root, { recursive: true, force: true }); }
});
