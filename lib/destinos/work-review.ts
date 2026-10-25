// PRIVATE adapter for offline human review, never an application loader or publication exporter.
// Input keeps original IDs. The UUID belongs to staging, not to the visual model's identity.
import type { Destino, FuenteOficial, TipoAtractivo, Foto } from './modelo.ts';

export interface WorkReviewRecord {
  originalIdentity: { sheet: string; originalId: string };
  internalId: string;
  sourceHash: string;
  originalPayload: Record<string, unknown>;
  normalizedPayload: Record<string, unknown>;
  sourceIds: string[];
  status: 'draft';
  review: null;
  publicationAuthorized: false;
}
export interface WorkReviewPlan {
  canStage: boolean;
  records: WorkReviewRecord[];
  support: { Fuentes?: Record<string, unknown>[] };
}
export interface WorkPresentationMapping {
  // Explicit reconciliation; never match master jurisdictions to website slugs by name.
  jurisdictionSlugs: Record<string, string>;
  validProvinceSlugs: readonly string[];
  attractionTypes: Record<string, TipoAtractivo>;
  // Reviewed presentation inputs, not automatically parsed from private practical proposals.
  practical: Destino['practicos'];
  locations: Destino['ubicaciones'];
  photos: { foto: Foto; rightsReviewed: boolean }[];
}

const text = (row: Record<string, unknown>, key: string) => typeof row[key] === 'string' ? row[key] as string : '';
const validUrl = (value: string, map = false) => {
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password && (!map || url.hostname === 'www.openstreetmap.org'); } catch { return false; }
};
const date = (v: string) => /^\d{4}-\d\d-\d\d$/.test(v) && !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v;
const types: readonly TipoAtractivo[] = ['naturaleza', 'cultura', 'patrimonio', 'actividad', 'gastronomia'];

export function prepareWorkReview(plan: WorkReviewPlan, originalDestinationId: string, mapping: WorkPresentationMapping): { destino: Destino | null; issues: string[] } {
  const issues: string[] = [];
  if (!plan.canStage) return { destino: null, issues: ['VALID_PRIVATE_PLAN_REQUIRED'] };
  const record = plan.records.find(r => r.originalIdentity.sheet === 'Destinos' && r.originalIdentity.originalId === originalDestinationId);
  if (!record || record.status !== 'draft' || record.review !== null || record.publicationAuthorized !== false) return { destino: null, issues: ['PRIVATE_DRAFT_REQUIRED'] };
  const row = record.normalizedPayload;
  const province = mapping.jurisdictionSlugs[text(row, 'jurisdiccion_id')];
  if (!province || !mapping.validProvinceSlugs.includes(province)) return { destino: null, issues: ['JURISDICTION_MAPPING_REQUIRED'] };
  const sources = new Map((plan.support.Fuentes ?? []).map(s => [text(s, 'id'), s]));
  const children = plan.records.filter(r => r.originalIdentity.sheet === 'Atractivos' && text(r.normalizedPayload, 'destino_id') === originalDestinationId);
  const sourceIds = new Set([...record.sourceIds, ...children.flatMap(r => r.sourceIds), ...mapping.practical.flatMap(p => p.fuenteIds), ...mapping.locations.flatMap(p => p.fuenteIds)]);
  const fuentes: FuenteOficial[] = [];
  for (const id of sourceIds) {
    const s = sources.get(id);
    if (!s || !text(s, 'titulo') || !validUrl(text(s, 'url')) || !date(text(s, 'fecha_consulta')) || text(s, 'fecha_publicacion') && !date(text(s, 'fecha_publicacion'))) { issues.push('SOURCE_REVIEW_REQUIRED'); continue; }
    fuentes.push({ id, titulo: text(s, 'titulo'), url: text(s, 'url'), organismo: text(s, 'institucion'), consultadaEl: text(s, 'fecha_consulta'), ...(text(s, 'fecha_publicacion') ? { publicadaEl: text(s, 'fecha_publicacion') } : {}) });
  }
  const known = new Set(fuentes.map(s => s.id));
  const refs = (ids: string[]) => ids.length > 0 && ids.every(id => known.has(id));
  const nombre = text(row, 'nombre'), slug = text(row, 'slug'), resumen = text(row, 'perfil');
  if (!nombre || !/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/.test(slug) || !resumen || !refs(record.sourceIds)) issues.push('DESTINATION_CONTENT_REQUIRED');
  const atractivos: Destino['atractivos'] = [];
  for (const child of children) {
    const raw = child.normalizedPayload;
    const tipo = mapping.attractionTypes[text(raw, 'categoria')];
    if (!types.includes(tipo) || !text(raw, 'nombre') || !text(raw, 'descripcion_original') || !refs(child.sourceIds) || child.status !== 'draft' || child.review !== null || child.publicationAuthorized !== false) { issues.push('ATTRACTION_REVIEW_REQUIRED'); continue; }
    atractivos.push({ id: child.originalIdentity.originalId, nombre: text(raw, 'nombre'), tipo, descripcion: text(raw, 'descripcion_original'), fuenteIds: [...child.sourceIds] });
  }
  for (const practical of mapping.practical) if (!practical.id || !practical.etiqueta || !practical.valor || !refs(practical.fuenteIds) || practical.verificadoEl && !date(practical.verificadoEl)) issues.push('PRACTICAL_REVIEW_REQUIRED');
  for (const location of mapping.locations) if (!location.id || !location.etiqueta || !location.descripcion || !validUrl(location.mapaUrl, true) || !refs(location.fuenteIds)) issues.push('LOCATION_REVIEW_REQUIRED');
  const fotos: Foto[] = [];
  for (const { foto, rightsReviewed } of mapping.photos) {
    if (!rightsReviewed) continue;
    const asset = (v: string) => /^\/(?!\/)[a-z0-9/_.-]+\.(?:webp|avif)$/i.test(v) && !/[\s%\\]/.test(v) && !v.split('/').some(part => part === '..' || part === '.');
    if (!asset(foto.src) || !foto.alt || !Number.isInteger(foto.ancho) || foto.ancho <= 0 || !Number.isInteger(foto.alto) || foto.alto <= 0 || !foto.variantes.length || foto.variantes.some(v => !asset(v.src) || !Number.isInteger(v.ancho) || v.ancho <= 0) || !foto.credito.titular || !foto.credito.licencia || !validUrl(foto.credito.urlLicencia)) { issues.push('PHOTO_REVIEW_REQUIRED'); continue; }
    fotos.push(structuredClone(foto));
  }
  if (issues.length) return { destino: null, issues: [...new Set(issues)] };
  return { issues, destino: {
    id: record.originalIdentity.originalId, slug, nombre, provinciaSlugs: [province], resumen,
    // A destination is not implicitly an administrative locality. No locality IDs are invented.
    localidades: [], atractivos, practicos: structuredClone(mapping.practical), ubicaciones: structuredClone(mapping.locations), fotos, fuentes,
    referenciasMaestro: [record, ...children].map(r => ({ hoja: r.originalIdentity.sheet, idOriginal: r.originalIdentity.originalId })),
  } };
}
