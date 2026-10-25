// Entirely synthetic. Never read Work/Drive here, never use real original IDs or tourist prose.
import { MASTER_ID, SHEETS } from './import-core.mjs';
export function syntheticWorkSnapshot() {
  const tables = Object.fromEntries(SHEETS.map(sheet => [sheet, []]));
  tables.Jurisdicciones.push({ id: 'SYNTH-JUR-01', nombre: 'Jurisdicción de prueba' });
  tables.Fuentes.push({ id: 'SYNTH-SRC-01', titulo: 'Institución ficticia de pruebas', institucion: 'Organismo sintético', url: 'https://example.org/work-fixture', fecha_consulta: '2026-10-24', fecha_publicacion: '2026-10-23' });
  for (let i = 0; i < 84; i++) {
    const sheet = i < 23 ? 'Destinos' : 'Atractivos';
    const id = `SYNTH-${i < 23 ? 'DEST' : 'ATTR'}-${String(i + 1).padStart(3, '0')}`;
    const row = { id, nombre: `Ficha sintética ${i + 1}`, slug: `ficha-sintetica-${i + 1}`, fuente_ids: 'SYNTH-SRC-01', estado_verificacion: 'parcial', estado_editorial: 'borrador', fecha_revision: '2026-10-24', dictamen_publicacion: 'aprobable_acotado', privateNote: 'AUS_PRIVATE_WORK_CANARY: notas sintéticas retenidas' };
    if (sheet === 'Destinos') Object.assign(row, { jurisdiccion_id: 'SYNTH-JUR-01', perfil: 'Descripción ficticia para probar la presentación. No es información turística.' });
    else Object.assign(row, { destino_id: `SYNTH-DEST-${String((i - 23) % 23 + 1).padStart(3, '0')}`, categoria: 'naturaleza', descripcion_original: 'Atractivo sintético: permite probar fuentes, relaciones y mapas sin publicar una ficha real.' });
    tables[sheet].push(row);
    const evidenceId = `SYNTH-EVID-${i + 1}`;
    tables.Evidencias.push({ id: evidenceId, entidad_id: id, fuente_id: 'SYNTH-SRC-01', url: 'https://example.org/work-fixture', fecha_consulta: '2026-10-24', campo: sheet === 'Destinos' ? 'perfil' : 'descripcion_original', estado_verificacion: 'parcial', afirmacion_o_hallazgo: 'Hallazgo ficticio de prueba' });
    const numeric = i >= 55 && i < 58;
    if (numeric) tables.Datos_variables.push({ id: `SYNTH-NUM-${i}`, entidad_id: id, campo: 'importe', importe: 123, moneda: 'ARS', url: 'https://example.org/work-fixture', fuente_id: 'SYNTH-SRC-01', fecha_consulta: '2026-10-24', estado_verificacion: 'parcial', publicable: 'si' });
    tables.Exportacion_piloto.push({ lote_id: 'SYNTH-BATCH', tabla: sheet, registro_id: id, version_propuesta: 'SYNTH-V1', clasificacion_integracion: i < 55 ? 'candidata_acotada' : numeric ? 'decision_numerica_independiente' : 'borrador_retenido', aprobacion_humana: 'pendiente', permiso_publicacion: 'no_autorizado', componentes_condicionados_ids: numeric ? `SYNTH-NUM-${i}` : '', fuente_ids_propuesta: 'SYNTH-SRC-01', evidencia_ids_propuesta: evidenceId });
  }
  return { schemaVersion: 1, source: { spreadsheetId: MASTER_ID, kind: 'synthetic', revision: 'SYNTH-REV-1', proposalVersion: 'SYNTH-V1', capturedAt: '2026-10-25T12:00:00.000Z' }, tables, selection: ['Destinos', 'Atractivos'].flatMap(sheet => tables[sheet].map(row => ({ sheet, id: row.id }))) };
}

export function syntheticPresentationMapping() {
  return {
    jurisdictionSlugs: { 'SYNTH-JUR-01': 'santa_fe' }, validProvinceSlugs: ['santa_fe'], attractionTypes: { naturaleza: 'naturaleza' },
    practical: [{ id: 'synthetic-practical', etiqueta: 'Ejemplo práctico', valor: 'Información ficticia para revisar la plantilla; consultar la fuente de prueba.', fuenteIds: ['SYNTH-SRC-01'], verificadoEl: '2026-10-24' }],
    locations: [{ id: 'synthetic-location', etiqueta: 'Ubicación ficticia', descripcion: 'Enlace de mapa de prueba: no describe un atractivo real.', mapaUrl: 'https://www.openstreetmap.org/', fuenteIds: ['SYNTH-SRC-01'] }],
    photos: [{ rightsReviewed: true, foto: { src: '/synthetic-800.webp', alt: 'Ilustración geométrica sintética para pruebas', ancho: 800, alto: 450, variantes: [{ src: '/synthetic-400.webp', ancho: 400 }, { src: '/synthetic-800.webp', ancho: 800 }], leyenda: 'Ilustración de prueba, sin fotografía turística', credito: { titular: 'Fixture sintético local', licencia: 'Ilustración creada por código para esta prueba', urlLicencia: 'https://example.org/synthetic-rights' } } }],
  };
}
