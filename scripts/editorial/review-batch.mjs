import { AUTHORIZED_DESTINATIONS } from "../../lib/destinos/authorized.ts";
// Private editorial packages, not a publication pipeline. The master is never changed.
import { mkdir, readFile, writeFile, readdir, chmod } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { fingerprint, validDate } from './import-core.mjs';
import { planWorkImport } from './work-import.mjs';
import { privatePath, readPrivateJson, writePrivateJson } from './private-io.mjs';
import { renderWorkDestination } from './render-work.mjs';
import { auditPublicArtifact } from '../pages/editorial-security.mjs';
import { REGION_POR_PROVINCIA } from '../../lib/catalog.ts';
import { REVIEW_LICENSES } from './review-assets.mjs';

export const pageHashes = page => ({ payload: fingerprint(page.payload), scope: fingerprint(page.basis), evidence: fingerprint(page.evidence), media: fingerprint(page.mediaEvidence) });
export function sealReviewPage(page) { return { ...page, hashes: pageHashes(page) }; }
export const publicAnchor = internalId => 'work-' + createHash('sha256').update(internalId).digest('hex').slice(0, 16);
const https = v => { try { const u = new URL(v); return u.protocol === 'https:' && !u.username && !u.password; } catch { return false; } };
const assetName = v => typeof v === 'string' && /^review-[a-f0-9]{16}-(320|640|960|1280)\.webp$/.test(v);
const hash = v => typeof v === 'string' && /^[a-f0-9]{64}$/.test(v);
export function reviewTextFragments(payload) {
  return [payload.title, payload.seo?.description, payload.resumen, ...(payload.introduction ?? []).map(p => p.text), ...(payload.sections ?? []).flatMap(s => s.paragraphs.map(p => p.text)), ...(payload.attractions ?? []).flatMap(a => a.paragraphs.map(p => p.text)), ...(payload.practical ?? []).map(p => p.valor)].filter(v => typeof v === 'string' && v.length >= 30);
}

export function validateReviewBatch(batch, masterSnapshot) {
  const errors = [];
  if (!batch || batch.reviewBundleVersion !== 1 || !['work', 'synthetic'].includes(batch.kind) || !validDate(batch.checkedAt) || !Array.isArray(batch.pages) || batch.pages.length < 3 || batch.pages.length > 5) return ['BATCH_SHAPE'];
  const master = planWorkImport(masterSnapshot, null, { asOf: batch.checkedAt });
  if (!master.canStage || master.source.kind !== batch.kind) return ['MASTER_BASIS_INVALID'];
  if (batch.masterBasisSha256 !== master.checksum) errors.push('MASTER_BASIS_CHANGED');
  const byId = new Map(master.records.map(r => [r.originalIdentity.originalId, r]));
  const originalIds = Object.values(masterSnapshot.tables).flatMap(rows => Array.isArray(rows) ? rows.flatMap(row => typeof row?.id === 'string' && row.id.length >= 4 ? [row.id] : []) : []);
  const ids = new Set(), slugs = new Set();
  for (const [index, page] of batch.pages.entries()) {
    const add = code => errors.push(`PAGE_${index + 1}_${code}`);
    if (!page || page.status !== 'draft' || page.review !== null || page.publicationAuthorized !== false || !page.decisions || Object.values(page.decisions).some(v => v !== null) || Object.keys(page.decisions).sort().join() !== 'media,practical,publication,scope,text') { add('HUMAN_DECISION_NOT_ALLOWED'); continue; }
    const p = page.payload, basis = page.basis;
    if (!p || !basis || !Array.isArray(basis.attractions) || !Array.isArray(p.attractions)) { add('PAYLOAD_SHAPE'); continue; }
    const destination = byId.get(basis.destination?.originalId);
    if (!destination || destination.originalIdentity.sheet !== 'Destinos' || destination.documentary.classification !== 'candidata_acotada' || destination.sourceHash !== basis.destination.sourceHash || p.id !== publicAnchor(destination.internalId) || p.slug !== destination.originalPayload.slug) add('DESTINATION_IDENTITY_OR_CLASSIFICATION');
    const jurisdiction = masterSnapshot.tables.Jurisdicciones.find(j => j.id === basis.jurisdiction?.originalId);
    if (!jurisdiction || destination?.originalPayload.jurisdiccion_id !== jurisdiction.id || fingerprint(jurisdiction) !== basis.jurisdiction.sourceHash || !Object.hasOwn(REGION_POR_PROVINCIA, basis.jurisdiction.slug) || fingerprint(p.provinceSlugs) !== fingerprint([basis.jurisdiction.slug])) add('JURISDICTION_RECONCILIATION');
    if (ids.has(p.id) || slugs.has(p.slug)) add('DUPLICATE_ID_OR_SLUG'); ids.add(p.id); slugs.add(p.slug);
    if (basis.attractions.length !== p.attractions.length || !p.attractions.length) add('ATTRACTION_SCOPE');
    const seenAttractions = new Set();
    for (const item of basis.attractions) {
      const record = byId.get(item.originalId);
      if (!record || record.originalIdentity.sheet !== 'Atractivos' || record.originalPayload.destino_id !== basis.destination.originalId || record.documentary.classification !== 'candidata_acotada' || record.numericComponents.length || record.sourceHash !== item.sourceHash || !p.attractions.some(a => a.id === publicAnchor(record.internalId)) || seenAttractions.has(item.originalId)) add('ATTRACTION_RELATION_OR_CLASSIFICATION');
      seenAttractions.add(item.originalId);
    }
    const expectedKeys = ['id','slug','nombre','title','provinceLabel','provinceSlugs','resumen','leadSourceIds','introduction','sections','attractions','practical','locations','photos','sources','related','checkedAt','seo'];
    if (Object.keys(p).some(k => !expectedKeys.includes(k)) || expectedKeys.some(k => !(k in p))) add('PAYLOAD_ALLOWLIST');
    if (typeof p.title !== 'string' || p.title.length < 15 || !p.seo || p.seo.title !== p.title || typeof p.seo.description !== 'string' || p.seo.description.length < 80 || p.seo.description.length > 160 || p.seo.proposedCanonical !== 'https://www.argentinauniversosur.com/destinos/' + p.slug || !validDate(p.checkedAt) || p.checkedAt !== batch.checkedAt) add('SEO_OR_DATE');
    if (!Array.isArray(p.sources) || !Array.isArray(p.introduction) || !Array.isArray(p.sections) || !Array.isArray(p.practical) || !Array.isArray(p.locations) || !Array.isArray(p.photos)) { add('COLLECTION_SHAPE'); continue; }
    const sources = new Set(p.sources.map(s => s.id));
    if (sources.size !== p.sources.length || p.sources.some(s => !s.titulo || !https(s.url) || !validDate(s.consultadaEl) || s.consultadaEl > batch.checkedAt)) add('SOURCES');
    const cite = refs => Array.isArray(refs) && refs.length > 0 && new Set(refs).size === refs.length && refs.every(id => sources.has(id));
    const paragraphs = [...p.introduction, ...p.sections.flatMap(s => s.paragraphs ?? []), ...p.attractions.flatMap(a => a.paragraphs ?? [])];
    if (!cite(p.leadSourceIds) || paragraphs.some(r => !r || typeof r.text !== 'string' || r.text.length < 20 || !cite(r.sourceIds)) || p.practical.some(r => !r.id || !r.etiqueta || !r.valor || !cite(r.fuenteIds) || r.verificadoEl !== batch.checkedAt) || p.locations.some(r => !r.id || !r.etiqueta || !r.descripcion || !https(r.mapaUrl) || new URL(r.mapaUrl).hostname !== 'www.openstreetmap.org' || !cite(r.fuenteIds))) add('CLAIM_OR_LOCATION_REFERENCES');
    if (!Array.isArray(page.evidence) || p.sources.some(s => !page.evidence.some(e => e.publicSourceId === s.id && e.url === s.url && e.contentRead === true && hash(e.bodySha256) && e.checkedAt === batch.checkedAt && e.supports?.length && e.limitations?.length))) add('SOURCE_CONTENT_EVIDENCE');
    if (!Array.isArray(page.mediaEvidence) || p.photos.length !== page.mediaEvidence.length) add('MEDIA_SCOPE');
    for (const photo of p.photos) {
      const evidence = page.mediaEvidence?.find(e => e.sourcePage === photo.sourcePage), f = photo.foto;
      if (!evidence || evidence.technicalPermission !== 'license-verified' || evidence.commercialUseAllowed !== true || evidence.editorialApproval !== null || !REVIEW_LICENSES.has(evidence.licenseUrl) || !Array.isArray(evidence.unresolvedRights) || evidence.unresolvedRights.length || !evidence.privacyAssessment || !evidence.depictedWorkAssessment || !hash(evidence.originalSha256) || !hash(evidence.metadataSha256) || !f?.alt || f.credito?.titular !== evidence.author || f.credito?.urlLicencia !== evidence.licenseUrl || f.credito?.licencia !== evidence.licenseName || photo.originalTitle !== evidence.originalTitle || !photo.modifications || !https(photo.sourcePage) || !evidence.derivatives?.length) { add('MEDIA_RIGHTS'); continue; }
      const variants = evidence.derivatives;
      if (variants.some(v => !assetName(v.name) || v.src !== '/media/review/' + v.name || !hash(v.sha256) || !Number.isInteger(v.width) || v.width > evidence.nativeWidth) || f.variantes.length !== variants.length || f.variantes.some(v => !variants.some(a => a.src === v.src && a.width === v.ancho)) || !variants.some(v => v.src === f.src && v.width === f.ancho && v.height === f.alto)) add('MEDIA_VARIANTS');
    }
    const serialized = JSON.stringify(p);
    if (/originalPayload|masterRefs|referenciasMaestro|dictamen_publicacion|previsualizacion_privada|docs\.google\.com\/(?:spreadsheets|document)\/d\//.test(serialized) || originalIds.some(id => serialized.includes(id))) add('PRIVATE_PROJECTION');
    if (!page.hashes || fingerprint(page.hashes) !== fingerprint(pageHashes(page))) add('STALE_HASH');
    if (!Array.isArray(page.exclusions) || !page.exclusions.length || !Array.isArray(page.corrections) || !page.corrections.length) add('REVIEW_NOTES');
  }
  return [...new Set(errors)];
}

const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export async function writeReviewBatch(batch, masterSnapshot, { output, assetDirectory }) {
  const errors = validateReviewBatch(batch, masterSnapshot);
  if (errors.length) throw Error('REVIEW_BATCH_INVALID: ' + errors.join(','));
  await privatePath(join(output, 'manifest.json'), { createParents: true });
  const existing = await readPrivateJson(join(output, 'approval-package.json')).catch(e => { if (e.code !== 'ENOENT') throw e; return null; });
  if (existing?.pages?.some(p => p.status !== 'draft' || p.review !== null || p.publicationAuthorized || Object.values(p.decisions ?? {}).some(d => d !== null))) throw Error('EXISTING_HUMAN_DECISIONS_REQUIRE_NEW_OUTPUT');
  await mkdir(output, { recursive: true, mode: 0o700 });
  const files = [];
  const emit = async (name, data) => {
    const path = await privatePath(join(output, name), { createParents: true });
    await writeFile(path, data, { mode: 0o600 }); await chmod(path, 0o600);
    files.push({ name, sha256: createHash('sha256').update(data).digest('hex') });
  };
  const css = (await readdir('.next/static', { recursive: true })).filter(p => p.endsWith('.css'));
  if (!css.length) throw Error('BUILD_CSS_REQUIRED');
  await emit('styles.css', (await Promise.all(css.map(p => readFile(join('.next/static', p), 'utf8')))).join('\n').replaceAll('../media/', 'fonts/'));
  for (const name of await readdir('.next/static/media')) if (/\.woff2?$/.test(name)) await emit('fonts/' + name, await readFile(join('.next/static/media', name)));
  const shell = (title, body, description = '', canonical = '') => '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>' + escape(title) + '</title><meta name="description" content="' + escape(description) + '">' + (canonical ? '<link rel="canonical" href="' + escape(canonical) + '">' : '') + '<link rel="stylesheet" href="styles.css"></head><body><a href="#contenido" class="sr-only focus:not-sr-only">Saltar al contenido</a><div class="border-b border-arena-400 bg-arena-200"><div class="contenedor py-3 text-sm font-semibold">REVISIÓN PRIVADA · Borrador · Sin aprobación ni permiso de publicación</div></div><header class="border-b border-arena-300 bg-white"><nav class="contenedor flex flex-wrap items-center justify-between gap-4 py-4" aria-label="Navegación de revisión"><a href="index.html" class="font-display text-xl text-lago-600">Argentina Universo Sur</a><details class="rounded-control border border-arena-400 p-2"><summary class="min-h-11 cursor-pointer px-3 py-2 font-semibold">Fichas del lote</summary><ul class="list-none p-2">' + batch.pages.map(page => '<li><a class="inline-flex min-h-11 items-center px-3 text-lago-600 underline" href="' + escape(page.payload.slug) + '.html">' + escape(page.payload.nombre) + '</a></li>').join('') + '</ul></details></nav></header><main id="contenido">' + body + '</main></body></html>';
  for (const page of batch.pages) {
    for (const media of page.mediaEvidence) for (const variant of media.derivatives) {
      const bytes = await readFile(await privatePath(join(assetDirectory, variant.name)));
      const dimensions = await sharp(bytes).metadata();
      if (createHash('sha256').update(bytes).digest('hex') !== variant.sha256 || dimensions.width !== variant.width || dimensions.height !== variant.height) throw Error('PHOTO_DERIVATIVE_CHANGED');
      if (!files.some(f => f.name === 'media/review/' + variant.name)) await emit('media/review/' + variant.name, bytes);
    }
    const article = (await renderWorkDestination(null, page.payload)).replaceAll('/media/review/', 'media/review/').replaceAll('href="/provincias/', 'href="https://www.argentinauniversosur.com/provincias/').replaceAll('href="/actividades/', 'href="https://www.argentinauniversosur.com/actividades/').replaceAll('href="/actividades?', 'href="https://www.argentinauniversosur.com/actividades?').replaceAll('href="/escapadas"', 'href="https://www.argentinauniversosur.com/escapadas"');
    await emit(page.payload.slug + '.html', shell(page.payload.seo.title, article, page.payload.seo.description, page.payload.seo.proposedCanonical));
  }
  await emit('index.html', shell('Lote editorial privado — Argentina Universo Sur', '<section class="contenedor py-12"><h1 class="font-display text-titulo">Tres destinos para revisar</h1><p class="mt-5 max-w-3xl leading-8">Textos preparados para decisión humana. Este entorno no registra aprobaciones ni publica fichas. Los textos completos, las pruebas de fuentes y los hashes están en los documentos locales del paquete.</p><ul class="mt-8 grid list-none gap-5 sm:grid-cols-3">' + batch.pages.map(page => '<li class="rounded-tarjeta border border-arena-300 bg-white p-6"><h2 class="font-display text-2xl">' + escape(page.payload.nombre) + '</h2><p class="mt-3 leading-7">' + escape(page.payload.resumen) + '</p><a class="mt-4 inline-flex min-h-11 items-center font-semibold text-lago-600 underline" href="' + escape(page.payload.slug) + '.html">Leer la ficha</a></li>').join('') + '</ul></section>'));
  await writePrivateJson(join(output, 'manifest.json'), { privateReviewBundle: true, kind: batch.kind, pages: batch.pages.length, files });
  // Full metadata is for the responsible person's local review, never in the server's allowlist.
  await writePrivateJson(join(output, 'approval-package.json'), batch);
  await writeHumanReview(batch, output);
  return { pages: batch.pages.length, publicWrites: 0, remoteWrites: 0, assets: files.filter(f => f.name.endsWith('.webp')).length };
}

export async function writeHumanReview(batch, output) {
  const index = ['# Lote privado de revisión — PR18', '', '**Borradores sin aprobación ni permiso de publicación.**', '', 'El maestro original sigue siendo la referencia editorial. Este paquete es una versión de trabajo acotada, sin escritura al maestro ni publicación. Revisar cada dimensión por separado; completar una decisión de texto no habilita rutas.', '', '## Fichas', ''];
  for (const page of batch.pages) {
    const p = page.payload;
    const sources = new Map(p.sources.map(s => [s.id, s]));
    const citations = ids => ids.map(id => { const s = sources.get(id); return `[${s.titulo}](${s.url})`; }).join(' · ');
    const paragraph = r => [r.text, '', 'Fuentes: ' + citations(r.sourceIds) + '.', ''];
    const lines = ['# ' + p.title, '', '**Estado:** draft · **Revisión humana:** pendiente · **Publicación:** no autorizada.', '', '## Versión que se propone aprobar', '', ...Object.entries(page.hashes).map(([key, value]) => `- ${key}: \`${value}\``), '', 'Los hashes usan JSON canónico de PR17 (claves ordenadas, arrays con su orden). El hash de payload incluye texto, SEO, mapas, fuentes, créditos e imágenes referenciadas. La evidencia y la matriz de derechos tienen hashes independientes.', '', '## Alcance e identidades', '', page.basis.selectionReason, '', '- Destino original: `' + page.basis.destination.originalId + '`.', ...page.basis.attractions.map(a => '- Atractivo original: `' + a.originalId + '` (candidata acotada; no aprobado).'), '', 'Ruta propuesta, **inactiva**: ' + p.seo.proposedCanonical, '', '## SEO', '', '- Título: ' + p.seo.title, '- Descripción: ' + p.seo.description, '', '## Texto turístico exacto', '', ...paragraph({ text: p.resumen, sourceIds: p.leadSourceIds }), ...p.introduction.flatMap(paragraph)];
    for (const section of p.sections) lines.push('### ' + section.title, '', ...section.paragraphs.flatMap(paragraph));
    lines.push('### Qué conocer', '');
    for (const attraction of p.attractions) lines.push('#### ' + attraction.nombre, '', ...attraction.paragraphs.flatMap(paragraph));
    lines.push('### Ubicaciones', '');
    for (const location of p.locations) lines.push('#### ' + location.etiqueta, '', location.descripcion, '', '[Buscar ubicación](' + location.mapaUrl + ')', '', 'Fuentes: ' + citations(location.fuenteIds) + '.', '');
    lines.push('### Organizar la visita', '');
    for (const practical of p.practical) lines.push('#### ' + practical.etiqueta, '', practical.valor, '', 'Comprobación: ' + practical.verificadoEl + '. Fuentes: ' + citations(practical.fuenteIds) + '.', '');
    lines.push('### Contenido relacionado', '', ...p.related.map(l => '- [' + l.label + '](https://www.argentinauniversosur.com' + l.href + ')'), '', '## Fuentes, comprobación y límites', '');
    for (const e of page.evidence) lines.push('### ' + sources.get(e.publicSourceId).titulo, '', e.url, '', '- Consulta: ' + e.checkedAt + '. Fecha de publicación: ' + (e.publishedAt ?? 'no se utiliza una fecha inequívoca') + '.', '- Modificación declarada: ' + (e.modifiedAtAsStated ?? 'no observada') + '. ' + (e.publicationDateNote ?? ''), '- Cuerpo guardado SHA-256: `' + e.bodySha256 + '`.', '- Alcance: ' + e.supports.join(' '), '- Límites: ' + e.limitations.join(' '), '- Identidades de origen: ' + (e.masterReferences.length ? e.masterReferences.map(r => '`' + r.originalId + '`').join(', ') : 'investigación adicional PR18; no se inventó un ID del maestro') + '.', '');
    if (page.basis.originalEvidenceReferences?.length) lines.push('## Trazabilidad del maestro original', '', 'Se conservan estos IDs y estados de evidencia del maestro, sin modificarlos ni convertirlos en aprobación. Las comprobaciones nuevas de PR18 están separadas en las fuentes anteriores.', '', '| ID original | Entidad original | Estado original | Hash de fila |', '| --- | --- | --- | --- |', ...page.basis.originalEvidenceReferences.map(e => `| ${e.originalId} | ${e.entityOriginalId} | ${e.originalState} | \`${e.sourceHash}\` |`), '');
    lines.push('## Fotografías y derechos', '');
    for (const photo of p.photos) {
      const media = page.mediaEvidence.find(m => m.sourcePage === photo.sourcePage);
      lines.push('### ' + photo.originalTitle, '', '- Autor: ' + media.author, '- Procedencia: ' + media.sourcePage, '- Licencia: [' + media.licenseName + '](' + media.licenseUrl + '), permite uso comercial bajo sus condiciones.', '- Verificación técnica de licencia: documentada. Aprobación editorial de la foto: **pendiente**.', '- Original SHA-256: `' + media.originalSha256 + '`.', '- Evidencia de licencia SHA-256: `' + media.metadataSha256 + '`.', '- Privacidad: ' + media.privacyAssessment, '- Obra representada: ' + media.depictedWorkAssessment, '- Cambios: ' + photo.modifications, '- Pie exacto: ' + photo.foto.leyenda, '- Texto alternativo: ' + photo.foto.alt, '', '| Variante | Bytes | SHA-256 |', '| --- | ---: | --- |', ...media.derivatives.map(v => `| ${v.width} × ${v.height} WebP | ${v.bytes} | \`${v.sha256}\` |`), '');
    }
    lines.push('## Correcciones', '', ...page.corrections.map(t => '- ' + t), '', '## Exclusiones', '', ...page.exclusions.map(t => '- ' + t), '', '## Decisiones del responsable — sin completar', '', '- [ ] Alcance: aceptar o indicar cambios; hash scope anterior.', '- [ ] Texto y SEO exactos: aceptar o indicar cambios; hash payload anterior.', '- [ ] Fotografías, atribución, licencia y recortes: aceptar, sustituir o excluir; hash media anterior.', '- [ ] Información práctica y mapas: aceptar el alcance documental o indicar cambios.', '- [ ] Permiso independiente de publicación de esta versión y canal: otorgar o denegar expresamente.', '', 'Responsable: ____________________ · Fecha: ____________________', '', 'No existe un script que convierta estas casillas en publicación. Un cambio de texto, alcance, evidencia o imagen requiere nuevos hashes y revisión de la versión resultante. Las licencias de las fotografías conservan los derechos que conceden; la restricción del entorno protege el trabajo editorial, no impone DRM a las imágenes.');
    const md = lines.join('\n') + '\n';
    const path = await privatePath(join(output, p.slug + '.md'), { createParents: true });
    await writeFile(path, md, { mode: 0o600 }); await chmod(path, 0o600);
    index.push('- [' + p.nombre + '](' + p.slug + '.md): payload `' + page.hashes.payload + '`; texto turístico y evidencias completas.');
  }
  index.push('', '## Acceso al diseño', '', 'El archivo access.json (0600) contiene la URL local con clave del servidor, cuando está en marcha. Solo escucha en 127.0.0.1. Sin clave, Host válido y archivo permitido no sirve el contenido. Los JSON, Markdown, originales y evidencias no son rutas del servidor.', '', '## Precaución de entrega', '', 'No subir este directorio a GitHub, Cloudflare, Vercel ni un almacenamiento público. Conservarlo como paquete privado del responsable. Los originales y las copias de lectura quedan fuera de la carpeta servida.');
  const path = await privatePath(join(output, 'REVISAR.md'), { createParents: true });
  await writeFile(path, index.join('\n') + '\n', { mode: 0o600 }); await chmod(path, 0o600);
}

export async function auditReviewExclusion(directory, batch, { include = () => true } = {}) {
  const withheldPages = batch.pages.filter(page => {
    const pin = AUTHORIZED_DESTINATIONS[page.payload.slug];
    return !pin || fingerprint(pageHashes(page)) !== fingerprint(pin.hashes);
  });
  const privateNeedles = withheldPages.flatMap(page => [...reviewTextFragments(page.payload), '/destinos/' + page.payload.slug]);
  const report = await auditPublicArtifact(directory, [], { privateNeedles, include });
  const forbidden = new Set([...batch.pages.flatMap(p => p.mediaEvidence.map(m => m.originalSha256)), ...withheldPages.flatMap(p => p.mediaEvidence.flatMap(m => m.derivatives.map(v => v.sha256)))]);
  async function walk(dir) { for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name), name = path.slice(resolve(directory).length + 1);
    if (entry.isDirectory()) await walk(path);
    else if (include(name) && /\.(?:webp|avif|jpe?g|png)$/i.test(name) && forbidden.has(createHash('sha256').update(await readFile(path)).digest('hex'))) report.errors.push({ file: name, rule: 'withheld-review-media' });
  } }
  await walk(resolve(directory)); return report;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [input, master, output, assets, ...extra] = process.argv.slice(2);
  try {
    if (!input || !master || !output || !assets || extra.length) throw Error('PRIVATE_REVIEW_ARGUMENTS');
    const result = await writeReviewBatch(await readPrivateJson(input), await readPrivateJson(master), { output, assetDirectory: assets });
    console.log(JSON.stringify(result));
  } catch { console.error('PRIVATE_REVIEW_FAILED: inspect local inputs, evidence and hashes. No payload logged.'); process.exitCode = 1; }
}
