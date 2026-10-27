// The public CI check needs no credentials/snapshot. Locally it can additionally scan real private IDs.
import { readFile, lstat, mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { assertPublicArtifact } from '../pages/editorial-security.mjs';
import { readPrivateJson } from './private-io.mjs';
import { readPublication } from './publication.mjs';

export async function assertWorkIsolation(root = process.cwd()) {
  const errors = [];
  const destinationRoute = 'app/destinos/[slug]/page.tsx';
  let publicationCount = 0;
  const tracked = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);
  for (const file of tracked) {
    if (file.startsWith('.artifacts/') || /(?:^|\/)(?:master-snapshot|previous-snapshot|import-plan)\b/i.test(file)) errors.push('PRIVATE_TRACKED_INPUT');
    if (/^(?:app|components|lib)\/.*\.[cm]?[jt]sx?$/.test(file) && /work-review|review-batch|review-server|review-assets|editorial-import|work-import|integral-import|supabase\/(?:import-transport|stage-import|import-state|prepare-local|reconcile|verify-local)|\.artifacts\//.test(await readFile(join(root, file), 'utf8'))) errors.push('WORK_APP_IMPORT_NOT_ENABLED');
    if (file.startsWith('app/')) {
      if (/^app\/destinos(?:\/|$)/.test(file) && file !== destinationRoute) errors.push('WORK_PUBLIC_ROUTE_NOT_ENABLED');
      if (/\.[cm]?[jt]sx?$/.test(file) && /work-review|DestinoArticle|review-batch|editorial-import|work-import|integral-import|supabase\/(?:import-transport|stage-import|import-state|prepare-local|reconcile|verify-local)|\.artifacts\//.test(await readFile(join(root, file), 'utf8'))) errors.push('WORK_APP_IMPORT_NOT_ENABLED');
    }
  }
  if (!errors.length && tracked.includes(destinationRoute)) publicationCount = (await readPublication(root)).pages.length;
  if (errors.length) throw Error('Work isolation check failed: ' + [...new Set(errors)].join(','));
  return { workPublicRoutes: publicationCount, privateTrackedInputs: 0 };
}

export function privateWorkNeedles(snapshot) {
  const values = [];
  const textFields = new Set(['perfil', 'descripcion_original', 'ficha_practica_propuesta', 'practica_trazabilidad', 'practica_exclusiones', 'previsualizacion_privada', 'afirmacion_o_hallazgo', 'texto_practico_propuesto', 'plan_editorial']);
  for (const [sheet, rows] of Object.entries(snapshot.tables ?? {})) {
    if (!Array.isArray(rows) || ['Inicio', 'Gobernanza', 'Diccionario'].includes(sheet)) continue;
    for (const row of rows) {
      if (typeof row?.id === 'string') values.push(row.id);
      for (const [key, value] of Object.entries(row ?? {})) if (textFields.has(key) && typeof value === 'string')
        values.push(...value.split(/\n+/).map(v => v.trim()).filter(v => v.length >= 80));
    }
  }
  return [...new Set(values)];
}

export async function auditWorkBuilds(snapshotPath) {
  const isolation = await assertWorkIsolation();
  const snapshot = snapshotPath ? await readPrivateJson(snapshotPath) : null;
  const privateNeedles = snapshot ? privateWorkNeedles(snapshot) : [];
  const reports = [];
  const next = resolve('.next');
  if (await lstat(join(next, 'BUILD_ID')).catch(() => null)) {
    reports.push({ target: 'next-static', ...await assertPublicArtifact(join(next, 'static'), [], { privateNeedles }) });
    reports.push({ target: 'next-prerendered', ...await assertPublicArtifact(join(next, 'server/app'), [], { privateNeedles, include: n => /\.(html|rsc|meta|body|txt|json|xml)$/i.test(n) && !n.endsWith('.nft.json') }) });
  }
  const pages = resolve('.artifacts/pages');
  if (await lstat(pages).catch(() => null)) for (const mode of ['preview', 'consent-test', 'production-audit']) {
    const path = join(pages, mode);
    if (await lstat(path).catch(() => null)) reports.push({ target: 'pages-' + mode, ...await assertPublicArtifact(path, [], { privateNeedles }) });
  }
  if (!reports.length) throw Error('NO_BUILDS_TO_AUDIT');
  // No needles, record IDs, private content or detailed error excerpts in reports/logs.
  const result = { ...isolation, snapshotUsed: !!snapshot, targets: reports, errors: 0 };
  await mkdir('.artifacts/pr17/reports', { recursive: true });
  await writeFile('.artifacts/pr17/reports/work-security.json', JSON.stringify(result, null, 2) + '\n');
  return result;
}

if (process.argv[1] && resolve(process.argv[1]) === new URL(import.meta.url).pathname) {
  const args = process.argv.slice(2);
  if (args.length === 1 && args[0] === '--check-inputs') console.log(JSON.stringify(await assertWorkIsolation()));
  else {
    if (args.length > 1 || args[0] && !args[0].startsWith('--private-snapshot=')) throw Error('PRIVATE_SNAPSHOT_FLAG_ONLY');
    const result = await auditWorkBuilds(args[0]?.slice('--private-snapshot='.length));
    console.log(JSON.stringify({ workPublicRoutes: result.workPublicRoutes, targets: result.targets.map(r => ({ target: r.target, files: r.files })), errors: 0 }));
  }
}
