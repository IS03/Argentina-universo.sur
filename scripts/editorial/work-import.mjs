// Offline preparation of Work's PRIVATE snapshot. No DB/network clients, no apply/publication mode.
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateImport, fingerprint, stableId, MASTER_ID, validDate, rowKey } from './import-core.mjs';
import { readPrivateJson, writePrivateJson } from './private-io.mjs';
import { decodeSheetDates } from './sheet-dates.mjs';

export const WORK_SHEETS = ['Destinos', 'Atractivos'];
const CLASSES = ['candidata_acotada', 'decision_numerica_independiente', 'borrador_retenido'];
const present = v => v !== undefined && v !== null && v !== '';
const list = value => typeof value === 'string' ? value.split(';').map(s => s.trim()).filter(Boolean) : [];
const isoTime = v => typeof v === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z$/.test(v) && !Number.isNaN(Date.parse(v)) && validDate(v.slice(0, 10));
const safeUrl = v => {
  try { const u = new URL(v); return u.protocol === 'https:' && !u.username && !u.password && !!u.hostname; } catch { return false; }
};

export function planWorkImport(snapshot, previous = null, { expectedCount = 84, asOf = new Date().toISOString().slice(0, 10) } = {}) {
  const original = snapshot;
  const decoded = decodeSheetDates(snapshot);
  snapshot = decoded.normalized;
  const base = validateImport(snapshot, { expectedCount });
  const issues = [...decoded.issues, ...base.errors.map(message => ({ code: 'CONTRACT', message }))];
  const add = (code, sheet, id, field) => issues.push({ code, sheet, originalId: id, field });
  if (!snapshot?.tables || !Array.isArray(snapshot.selection) || base.errors.some(e => e.startsWith('Invalid envelope'))) return { mode: 'dry-run', canStage: false, issues, records: [], publicWrites: 0, remoteWrites: 0 };
  const source = snapshot.source;
  if (!['work', 'synthetic'].includes(source.kind)) add('SOURCE_KIND', null, null, 'kind');
  if (!isoTime(source.capturedAt) || !validDate(asOf) || source.capturedAt?.slice(0, 10) > asOf) add('CAPTURE_DATE', null, null, 'capturedAt');
  if (!source.proposalVersion || typeof source.proposalVersion !== 'string') add('PROPOSAL_VERSION', null, null, 'proposalVersion');
  if (source.kind === 'work' && (!isoTime(source.modifiedBefore) || source.modifiedBefore !== source.modifiedAfter || source.revision !== source.modifiedAfter || source.modifiedAfter > source.capturedAt)) add('INCOHERENT_READ', null, null, 'modifiedAfter');
  const rows = sheet => Array.isArray(snapshot.tables[sheet]) ? snapshot.tables[sheet].filter(r => r && typeof r === 'object' && !Array.isArray(r)) : [];
  const byId = new Map(Object.entries(snapshot.tables).flatMap(([sheet]) => rows(sheet).filter(r => typeof r.id === 'string').map(row => [row.id, { sheet, row }])));
  const selected = new Set(snapshot.selection.filter(Boolean).map(r => r.sheet + '/' + r.id));
  for (const item of snapshot.selection) if (!item || !WORK_SHEETS.includes(item.sheet)) add('WORK_SELECTION_KIND', item?.sheet, item?.id, 'selection');
  if (expectedCount === 84 && (snapshot.selection.filter(r => r?.sheet === 'Destinos').length !== 23 || snapshot.selection.filter(r => r?.sheet === 'Atractivos').length !== 61)) add('WORK_SCOPE', null, null, 'selection');
  // Evidence also documents source quality and pending tasks, not only public tourism entities.
  const validEntity = id => byId.has(id);
  for (const [sheet] of Object.entries(snapshot.tables)) for (const row of rows(sheet)) {
    for (const [field, value] of Object.entries(row)) {
      if (/^(?:fecha_(?:consulta|revision|revision_practica|auditoria_f8|verificacion_canal|envio|respuesta|objetivo)|practica_fecha_revision|proxima_revision)$/.test(field) && present(value) && !validDate(value)) add('DATE', sheet, row.id, field);
      if (field === 'fecha_publicacion' && present(value) && !validDate(value) && !isoTime(value)) add('DATE', sheet, row.id, field);
      if (/_ids(?:_propuesta)?$/.test(field) && typeof value === 'string' && new Set(list(value)).size !== list(value).length) add('DUPLICATE_REFERENCE', sheet, row.id, field);
      if (/_ids(?:_propuesta)?$/.test(field) && present(value) && typeof value !== 'string') add('REFERENCE_LIST_FORMAT', sheet, row.id, field);
    }
    const extraRefs = { fuente_canal_ids: 'Fuentes', respuesta_evidencia_ids: 'Evidencias', evidencia_auditoria_ids: 'Evidencias' };
    for (const [field, target] of Object.entries(extraRefs)) for (const id of list(row[field])) if (byId.get(id)?.sheet !== target) add('REFERENCE', sheet, row.id, field);
    if (present(row.entidad_id) && !validEntity(row.entidad_id)) add('ENTITY_REFERENCE', sheet, row.id, 'entidad_id');
    if (sheet === 'Fuentes' || sheet === 'Evidencias' || sheet === 'Datos_variables') {
      if (!safeUrl(row.url)) add('SOURCE_URL', sheet, row.id, 'url');
      if (!validDate(row.fecha_consulta) || row.fecha_consulta > asOf) add('SOURCE_DATE', sheet, row.id, 'fecha_consulta');
      if (row.fecha_publicacion && String(row.fecha_publicacion).slice(0, 10) > row.fecha_consulta) add('SOURCE_DATE_ORDER', sheet, row.id, 'fecha_publicacion');
    }
    if (sheet === 'Datos_variables') {
      if (present(row.importe) && (typeof row.importe !== 'number' || !Number.isFinite(row.importe) || row.importe < 0)) add('NUMERIC_VALUE', sheet, row.id, 'importe');
      if (present(row.importe) && !/^[A-Z]{3}$/.test(row.moneda)) add('CURRENCY', sheet, row.id, 'moneda');
      if (row.valido_desde && row.valido_hasta && row.valido_hasta < row.valido_desde) add('VALIDITY_ORDER', sheet, row.id, 'valido_hasta');
    }
    if (sheet === 'Relaciones') {
      const origin = byId.get(row.origen_id)?.sheet, target = byId.get(row.destino_id)?.sheet;
      const allowed = { parada: ['Circuitos', 'Atractivos'], se_realiza_en: ['Experiencias', 'Atractivos'], incluye_destino: ['Circuitos', 'Destinos'], relevamiento_piloto: ['Expansion_Santa_Fe', 'Destinos'] }[row.tipo];
      if (!allowed || origin !== allowed[0] || target !== allowed[1]) add('RELATION_KIND', sheet, row.id, 'tipo');
      if (present(row.orden) && (!Number.isInteger(Number(row.orden)) || Number(row.orden) < 1)) add('RELATION_ORDER', sheet, row.id, 'orden');
    }
    if (WORK_SHEETS.includes(sheet)) {
      for (const f of ['id', 'slug', 'nombre', 'estado_verificacion', 'estado_editorial', 'fecha_revision', 'fuente_ids', sheet === 'Destinos' ? 'jurisdiccion_id' : 'destino_id']) if (!present(row[f])) add('REQUIRED', sheet, row.id, f);
      if (row.fecha_revision && row.fecha_revision > asOf) add('FUTURE_REVIEW', sheet, row.id, 'fecha_revision');
      for (const f of ['slug', 'nombre', 'estado_verificacion', 'estado_editorial', 'fuente_ids', sheet === 'Destinos' ? 'jurisdiccion_id' : 'destino_id']) if (typeof row[f] !== 'string' || !row[f].trim()) add('TEXT_FIELD', sheet, row.id, f);
    }
  }
  const proposals = rows('Exportacion_piloto').filter(p => p.version_propuesta === source.proposalVersion);
  for (const p of proposals) if (!selected.has(p.tabla + '/' + p.registro_id)) add('PROPOSAL_OUTSIDE_SELECTION', 'Exportacion_piloto', p.registro_id, 'registro_id');
  const oldRows = new Map(Object.entries(previous?.tables ?? {}).flatMap(([sheet, values]) => Array.isArray(values) ? values.filter(Boolean).map((r, i) => [sheet + '/' + rowKey(sheet, r, i), r]) : []));
  const originalRows = new Map(Object.entries(original.tables).flatMap(([sheet, values]) => Array.isArray(values) ? values.filter(Boolean).map(r => [sheet + '/' + r.id, r]) : []));
  const dateIndexes = new WeakMap();
  const rowHash = (s, sheet, row) => {
    if (!dateIndexes.has(s)) {
      const index = new Map();
      for (const [key, value] of Object.entries(s.dateCells ?? {})) {
        const prefix = key.slice(0, key.lastIndexOf('/'));
        if (!index.has(prefix)) index.set(prefix, {});
        index.get(prefix)[key] = value;
      }
      dateIndexes.set(s, index);
    }
    return fingerprint({ row, dateCells: dateIndexes.get(s).get(sheet + '/' + row.id) ?? {} });
  };
  if (previous) {
    // A quarantined previous snapshot is still useful for differences; never apply either snapshot.
    if (previous.schemaVersion !== 1 || previous.source?.spreadsheetId !== MASTER_ID || previous.source.kind !== source.kind || previous.source.capturedAt > source.capturedAt) add('PREVIOUS_SNAPSHOT', null, null, 'previous');
  }
  const records = snapshot.selection.flatMap(item => {
    const found = byId.get(item?.id);
    if (!found || found.sheet !== item.sheet || !WORK_SHEETS.includes(item.sheet)) return [];
    const { sheet, row } = found;
    const matches = proposals.filter(p => p.tabla === sheet && p.registro_id === row.id);
    const proposal = matches.length === 1 ? matches[0] : null;
    if (!proposal) add('PROPOSAL_AMBIGUOUS_OR_MISSING', sheet, row.id, 'version_propuesta');
    if (proposal && !CLASSES.includes(proposal.clasificacion_integracion)) add('CLASSIFICATION', sheet, row.id, 'clasificacion_integracion');
    // Even an isolated "approved" cell cannot supply a human review of an exact projected version.
    const numericIds = list(proposal?.componentes_condicionados_ids);
    if (proposal?.clasificacion_integracion === 'decision_numerica_independiente' && !numericIds.length) add('NUMERIC_COMPONENT_MISSING', sheet, row.id, 'componentes_condicionados_ids');
    for (const id of numericIds) if (byId.get(id)?.sheet !== 'Datos_variables' || byId.get(id)?.row.entidad_id !== row.id) add('NUMERIC_COMPONENT_OWNER', sheet, row.id, 'componentes_condicionados_ids');
    const evidence = rows('Evidencias').filter(r => r.entidad_id === row.id);
    if (!evidence.length) add('ENTITY_EVIDENCE_MISSING', sheet, row.id, 'Evidencias');
    const sourceIds = list(row.fuente_ids);
    // Staging retains all evidence, including conflicting/stale findings; it never treats them as approved claims.
    const previousRow = oldRows.get(sheet + '/' + row.id);
    const rawRow = originalRows.get(sheet + '/' + row.id);
    const hash = rowHash(original, sheet, rawRow);
    const dependencies = [row.jurisdiccion_id || row.destino_id, ...sourceIds, ...evidence.map(e => e.id), ...numericIds].filter(Boolean);
    const variableFacts = rows('Datos_variables').filter(r => r.entidad_id === row.id);
    const linkedRelations = rows('Relaciones').filter(r => r.origen_id === row.id || r.destino_id === row.id);
    const reviewFindings = [
      ...evidence.filter(e => e.estado_verificacion !== 'verificado_documental').map(e => ({ code: 'EVIDENCE_REVIEW_REQUIRED', originalId: e.id, originalState: e.estado_verificacion })),
      ...variableFacts.map(v => ({ code: 'VARIABLE_FACT_HELD', originalId: v.id, originalState: v.estado_verificacion })),
      { code: 'HUMAN_REVIEW_REQUIRED' }, { code: 'PUBLICATION_NOT_AUTHORIZED' },
    ];
    return [{
      originalIdentity: { origin: MASTER_ID, sheet, originalId: row.id },
      internalId: stableId(MASTER_ID, sheet, row.id), sourceHash: hash,
      operation: previousRow ? rowHash(previous, sheet, previousRow) === hash ? 'unchanged' : 'update' : 'insert',
      changedFields: previousRow ? [...new Set([...Object.keys(previousRow), ...Object.keys(rawRow)])].filter(k => fingerprint(previousRow[k] ?? null) !== fingerprint(rawRow[k] ?? null)).concat(rowHash(previous, sheet, previousRow) !== hash ? ['@row-or-cell-metadata'] : []) : Object.keys(rawRow),
      originalPayload: structuredClone(rawRow), normalizedPayload: structuredClone(row),
      reviewHash: fingerprint({ row, sourceHash: hash, evidence, sources: sourceIds.map(id => byId.get(id)?.row), variableFacts, linkedRelations, proposal }),
      documentary: { verification: row.estado_verificacion, editorial: row.estado_editorial, opinion: row.dictamen_publicacion, classification: proposal?.clasificacion_integracion ?? null, originalProposal: proposal ? structuredClone(proposal) : null },
      dependencies, evidenceIds: evidence.map(e => e.id), sourceIds, reviewFindings,
      numericComponents: numericIds.map(id => ({ originalId: id, originalPayload: structuredClone(byId.get(id)?.row ?? null), decision: 'pending' })),
      status: 'draft', review: null, publicationAuthorized: false,
      approvalStatus: 'pending', publicationPermitted: false,
    }];
  });
  const currentIds = new Set(Object.entries(snapshot.tables).flatMap(([sheet]) => rows(sheet).map((r, i) => sheet + '/' + rowKey(sheet, r, i))));
  const supportChanges = Object.entries(original.tables).filter(([sheet]) => !WORK_SHEETS.includes(sheet)).flatMap(([sheet, values]) => Array.isArray(values) ? values.filter(Boolean).map((row, i) => {
    const diagnosticKey = sheet + '/' + rowKey(sheet, row, i), old = oldRows.get(diagnosticKey);
    const sourceHash = rowHash(original, sheet, row);
    return { diagnosticKey, sourceHash, operation: old ? rowHash(previous, sheet, old) === sourceHash ? 'unchanged' : 'update' : 'insert' };
  }) : []);
  const classifications = Object.fromEntries(CLASSES.map(c => [c, records.filter(r => r.documentary.classification === c).length]));
  // Preserve support payloads and their hashes too. A changed source/evidence invalidates a previous review plan.
  const support = Object.fromEntries(Object.entries(snapshot.tables).filter(([sheet]) => !WORK_SHEETS.includes(sheet)).map(([sheet, values]) => [sheet, structuredClone(values)]));
  const counts = { selected: snapshot.selection.length, processed: records.length, real: source.kind === 'work' ? records.length : 0, synthetic: source.kind === 'synthetic' ? records.length : 0, classifications, numericRecords: records.filter(r => r.numericComponents.length).length, numericComponents: records.reduce((n, r) => n + r.numericComponents.length, 0), issues: issues.length, publishable: 0 };
  return { schemaVersion: 1, mode: 'dry-run', source: structuredClone(source), checksum: fingerprint({ source, tables: original.tables, dateCells: original.dateCells ?? {}, selection: snapshot.selection }), canStage: issues.length === 0, counts, issues, records, support, supportChanges, originalSupport: Object.fromEntries(Object.entries(original.tables).filter(([sheet]) => !WORK_SHEETS.includes(sheet))), dateConversions: decoded.conversions, retainedMissing: [...oldRows.keys()].filter(k => !currentIds.has(k)), publicWrites: 0, remoteWrites: 0, warnings: ['Private preparation only. Documentary classification, source publicable and proposal cells are not human approval or publication permission. No routes or public export exist.'] };
}

export function publicSummary(plan) {
  const codes = {};
  for (const issue of plan.issues) codes[issue.code] = (codes[issue.code] ?? 0) + 1;
  return { mode: 'dry-run', canStage: plan.canStage, counts: plan.counts ?? { processed: 0, issues: plan.issues.length }, issueCodes: codes, publicWrites: 0, remoteWrites: 0 };
}

export async function runWorkImport(args) {
  const [input, ...flags] = args;
  if (!input || input.startsWith('--') || flags.some(a => !/^--(?:previous|output)=.+$/.test(a)) || new Set(flags.map(a => a.split('=')[0])).size !== flags.length) throw Error('USAGE_PRIVATE_DRY_RUN_ONLY');
  const flag = name => flags.find(a => a.startsWith('--' + name + '='))?.slice(name.length + 3);
  const snapshot = await readPrivateJson(input);
  const previous = flag('previous') ? await readPrivateJson(flag('previous')) : null;
  const result = planWorkImport(snapshot, previous);
  await writePrivateJson(flag('output') ?? '.artifacts/pr17/private/import-plan.json', result);
  console.log(JSON.stringify(publicSummary(result)));
  return result.canStage ? 0 : 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { process.exitCode = await runWorkImport(process.argv.slice(2)); }
  catch { console.error('PRIVATE_IMPORT_FAILED: check local input, permissions and CLI arguments. No payload logged.'); process.exitCode = 1; }
}
