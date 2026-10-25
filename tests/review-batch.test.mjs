import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { request } from 'node:http';
import sharp from 'sharp';
import { syntheticWorkSnapshot } from '../scripts/editorial/work-fixtures.mjs';
import { planWorkImport } from '../scripts/editorial/work-import.mjs';
import { fingerprint } from '../scripts/editorial/import-core.mjs';
import { sealReviewPage, publicAnchor, validateReviewBatch, auditReviewExclusion } from '../scripts/editorial/review-batch.mjs';
import { prepareReviewPhoto } from '../scripts/editorial/review-assets.mjs';
import { startReviewServer } from '../scripts/editorial/review-server.mjs';
import { writePrivateJson } from '../scripts/editorial/private-io.mjs';
import { renderWorkDestination } from '../scripts/editorial/render-work.mjs';

function fixture() {
  const master = syntheticWorkSnapshot(), plan = planWorkImport(master, null, { asOf: '2026-10-25' });
  const paragraphs = [{ text: 'Contenido de prueba suficientemente extenso para comprobar la atribución, la integridad y la protección del paquete privado.', sourceIds: ['source-fixture'] }];
  const pages = plan.records.filter(r => r.originalIdentity.sheet === 'Destinos').slice(0, 3).map(record => {
    const a = plan.records.find(r => r.originalIdentity.sheet === 'Atractivos' && r.originalPayload.destino_id === record.originalIdentity.originalId);
    const payload = { id: publicAnchor(record.internalId), slug: record.originalPayload.slug, nombre: 'Destino sintético', title: 'Destino ficticio para revisar la presentación', provinceLabel: 'Santa Fe', provinceSlugs: ['santa_fe'], resumen: 'Introducción de prueba para el paquete de revisión privado.', leadSourceIds: ['source-fixture'], introduction: structuredClone(paragraphs), sections: [{ id: 'elegir', title: 'Una selección ficticia', paragraphs: structuredClone(paragraphs) }], attractions: [{ id: publicAnchor(a.internalId), nombre: 'Atractivo de prueba', tipo: 'cultura', paragraphs: structuredClone(paragraphs) }], practical: [{ id: 'practical', etiqueta: 'Orientación', valor: 'Consejo ficticio de revisión.', fuenteIds: ['source-fixture'], verificadoEl: '2026-10-25' }], locations: [{ id: 'location', etiqueta: 'Ubicación ficticia', descripcion: 'Referencia sintética, sin localización real.', mapaUrl: 'https://www.openstreetmap.org/', fuenteIds: ['source-fixture'] }], photos: [], sources: [{ id: 'source-fixture', titulo: 'Institución sintética', url: 'https://example.org/synthetic', consultadaEl: '2026-10-25' }], related: [{ href: '/escapadas', label: 'Escapadas' }], checkedAt: '2026-10-25', seo: { title: 'Destino ficticio para revisar la presentación', description: 'Descripción sintética con la longitud necesaria para comprobar SEO y preparar una versión revisable sin datos reales.', proposedCanonical: 'https://www.argentinauniversosur.com/destinos/' + record.originalPayload.slug } };
    const brief = r => ({ originalId: r.originalIdentity.originalId, sourceHash: r.sourceHash });
    return sealReviewPage({ status: 'draft', review: null, publicationAuthorized: false, decisions: { scope: null, text: null, media: null, practical: null, publication: null }, basis: { destination: brief(record), attractions: [brief(a)], jurisdiction: { originalId: master.tables.Jurisdicciones[0].id, slug: 'santa_fe', sourceHash: fingerprint(master.tables.Jurisdicciones[0]) } }, payload, evidence: [{ publicSourceId: 'source-fixture', url: 'https://example.org/synthetic', checkedAt: '2026-10-25', contentRead: true, bodySha256: 'a'.repeat(64), supports: ['Afirmación sintética.'], limitations: ['Sin información real.'] }], mediaEvidence: [], exclusions: ['Información operativa no verificada.'], corrections: ['Ejemplo sintético, sin registro del maestro.'] });
  });
  return { master, batch: { reviewBundleVersion: 1, kind: 'synthetic', checkedAt: '2026-10-25', masterBasisSha256: plan.checksum, pages } };
}

test('three synthetic pages use original identities privately and public opaque IDs in presentation, with all decisions null', () => {
  const { master, batch } = fixture();
  assert.deepEqual(validateReviewBatch(batch, master), []);
  assert.ok(batch.pages.every(p => Object.values(p.decisions).every(v => v === null) && p.status === 'draft' && !p.publicationAuthorized));
  assert.ok(batch.pages.every(p => !JSON.stringify(p.payload).includes(p.basis.destination.originalId)));
});

test('held, numeric and incorrectly related attractions are blocked even when a payload is sealed', () => {
  for (const classification of ['borrador_retenido', 'decision_numerica_independiente']) {
    const { master, batch } = fixture(), id = batch.pages[0].basis.attractions[0].originalId;
    master.tables.Exportacion_piloto.find(r => r.registro_id === id).clasificacion_integracion = classification;
    assert.ok(validateReviewBatch(batch, master).some(e => e.includes('CLASSIFICATION') || e === 'MASTER_BASIS_INVALID'));
  }
  const { master, batch } = fixture(); batch.pages[0].basis.attractions[0] = batch.pages[1].basis.attractions[0]; batch.pages[0] = sealReviewPage(batch.pages[0]);
  assert.ok(validateReviewBatch(batch, master).some(e => e.includes('RELATION')));
});

test('text, scope, evidence, media and practical decisions never imply permission; preparation rejects supplied approvals', () => {
  for (const field of ['scope', 'text', 'media', 'practical', 'publication']) {
    const { master, batch } = fixture(); batch.pages[0].decisions[field] = { decision: 'approved' };
    assert.ok(validateReviewBatch(batch, master).some(e => e.includes('HUMAN_DECISION')));
  }
});

test('changed text, evidence or scope invalidates exact hashes; source URL status alone is insufficient', () => {
  const { master, batch } = fixture(); batch.pages[0].payload.introduction[0].text += ' Cambiado.';
  assert.ok(validateReviewBatch(batch, master).some(e => e.includes('STALE_HASH')));
  const other = fixture(); other.batch.pages[0].evidence[0].contentRead = false; other.batch.pages[0] = sealReviewPage(other.batch.pages[0]);
  assert.ok(validateReviewBatch(other.batch, other.master).some(e => e.includes('CONTENT_EVIDENCE')));
});

test('private IDs, wrong jurisdiction and duplicate slugs cannot enter the final projection', () => {
  const { master, batch } = fixture(); batch.pages[0].payload.introduction[0].text += ' ' + batch.pages[0].basis.destination.originalId; batch.pages[0] = sealReviewPage(batch.pages[0]);
  assert.ok(validateReviewBatch(batch, master).some(e => e.includes('PRIVATE_PROJECTION')));
  const wrong = fixture(); wrong.batch.pages[0].payload.provinceSlugs = ['another-province']; wrong.batch.pages[0] = sealReviewPage(wrong.batch.pages[0]);
  assert.ok(validateReviewBatch(wrong.batch, wrong.master).some(e => e.includes('JURISDICTION')));
  const duplicate = fixture(); duplicate.batch.pages[1].payload.slug = duplicate.batch.pages[0].payload.slug;
  assert.ok(validateReviewBatch(duplicate.batch, duplicate.master).some(e => e.includes('DUPLICATE')));
});

test('offline editorial article renders exact text, usable anchor navigation, maps and visible sources without research metadata', async () => {
  const { batch } = fixture(); const html = await renderWorkDestination(null, batch.pages[0].payload);
  for (const label of ['En esta ficha', 'Qué conocer', 'Organizar la visita', 'Fuentes de esta ficha', 'Contenido relacionado']) assert.ok(html.includes(label));
  assert.ok(html.includes(batch.pages[0].payload.introduction[0].text));
  assert.match(html, /href="#atractivos"/); assert.match(html, /https:\/\/www.openstreetmap.org/);
  assert.doesNotMatch(html, /SYNTH-DEST-|originalPayload|masterBasisSha256|publicationAuthorized|<script/);
});

test('photo derivatives require an actual original hash, documented license and bounded crop; no remote transformation', async () => {
  await mkdir('.artifacts/pr18', { recursive: true }); const dir = await mkdtemp('.artifacts/pr18/photo-test-');
  try {
    const bytes = await sharp({ create: { width: 640, height: 480, channels: 3, background: '#176d7a' } }).jpeg().toBuffer();
    const original = join(dir, 'original.jpg'); await writeFile(original, bytes, { mode: 0o600 });
    const metadata = { query: { pages: { 1: { title: 'File:Synthetic fixture.jpg', imageinfo: [{ url: 'https://example.org/synthetic.jpg', width: 640, height: 480, size: bytes.length, sha1: createHash('sha1').update(bytes).digest('hex'), extmetadata: { LicenseUrl: { value: 'https://creativecommons.org/licenses/by-sa/4.0' }, LicenseShortName: { value: 'CC BY-SA 4.0' }, Credit: { value: 'Own work' }, Artist: { value: 'Synthetic fixture only' } } }] } } } };
    const path = join(dir, 'metadata.json'); await writePrivateJson(path, metadata);
    const args = { originalPath: original, metadataPath: path, outputDirectory: join(dir, 'processed') };
    const result = await prepareReviewPhoto(args);
    assert.deepEqual(result.derivatives.map(d => d.width), [320, 640]); assert.equal(result.editorialApproval, null); assert.equal(result.commercialUseAllowed, true);
    const repeat = await prepareReviewPhoto(args); assert.deepEqual(repeat.derivatives, result.derivatives);
    await assert.rejects(prepareReviewPhoto({ ...args, crop: { left: 500, top: 0, width: 640, height: 480 } }), /CROP/);
    metadata.query.pages[1].imageinfo[0].extmetadata.LicenseUrl.value = 'https://example.org/all-rights-reserved'; await writePrivateJson(path, metadata);
    await assert.rejects(prepareReviewPhoto(args), /LICENSE/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('private review transport requires loopback Host and unpredictable path; JSON, source originals and traversal stay inaccessible', async () => {
  await mkdir('.artifacts/pr18', { recursive: true }); const dir = await mkdtemp('.artifacts/pr18/server-test-');
  let service;
  try {
    const body = '<!doctype html><h1>AUS_PRIVATE_REVIEW_CANARY</h1>'; await writeFile(join(dir, 'index.html'), body, { mode: 0o600 });
    await writePrivateJson(join(dir, 'manifest.json'), { privateReviewBundle: true, files: [{ name: 'index.html', sha256: createHash('sha256').update(body).digest('hex') }] });
    await writePrivateJson(join(dir, 'approval-package.json'), { secret: 'not served' });
    service = await startReviewServer(dir, { port: 0 });
    const base = new URL(service.url).origin;
    assert.equal((await fetch(base + '/')).status, 404);
    assert.equal((await fetch(base + '/review/wrong/index.html')).status, 404);
    assert.equal((await fetch(service.url + 'approval-package.json')).status, 404);
    assert.equal((await fetch(service.url + '../approval-package.json')).status, 404);
    assert.equal((await fetch(service.url, { headers: { Origin: 'https://untrusted.example' } })).status, 403);
    assert.equal((await fetch(service.url, { method: 'POST' })).status, 405);
    const wrongHost = await new Promise(resolve => { const r = request(service.url, { headers: { Host: 'untrusted.example' } }, response => { response.resume(); resolve(response.statusCode); }); r.end(); }); assert.equal(wrongHost, 403);
    const response = await fetch(service.url); assert.equal(response.status, 200); assert.equal(await response.text(), body);
    assert.equal(response.headers.get('cache-control'), 'private, no-store'); assert.equal(response.headers.get('referrer-policy'), 'no-referrer'); assert.match(response.headers.get('content-security-policy'), /default-src 'none'/);
    await writeFile(join(dir, 'index.html'), 'modified'); assert.equal((await fetch(service.url)).status, 409);
  } finally { if (service) await new Promise(resolve => service.server.close(resolve)); await rm(dir, { recursive: true, force: true }); }
});

test('withheld edited copy and unreferenced renamed images are detected in public artifacts', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'aus-review-exclusion-'));
  try {
    const { batch } = fixture(); await writeFile(join(dir, 'index.html'), batch.pages[0].payload.introduction[0].text);
    assert.ok((await auditReviewExclusion(dir, batch)).errors.length);
    await rm(join(dir, 'index.html')); const bytes = Buffer.from('synthetic-private-photo'); const sha = createHash('sha256').update(bytes).digest('hex');
    batch.pages[0].mediaEvidence.push({ originalSha256: sha, derivatives: [] }); await writeFile(join(dir, 'renamed.jpg'), bytes);
    assert.ok((await auditReviewExclusion(dir, batch)).errors.some(e => e.rule === 'withheld-review-media'));
  } finally { await rm(dir, { recursive: true, force: true }); }
});
