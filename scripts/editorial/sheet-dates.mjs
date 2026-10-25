import { validDate, fingerprint } from './import-core.mjs';

// Sheets UNFORMATTED_VALUE returns dates as serial numbers. Decode only with observed CellData.
// Never interpret an arbitrary number or a localized string as a date. Keep the original untouched.
export function decodeSheetDates(snapshot) {
  const normalized = structuredClone(snapshot);
  const issues = [];
  const conversions = [];
  for (const [sheet, rows] of Object.entries(normalized?.tables ?? {})) {
    if (!Array.isArray(rows)) continue;
    rows.forEach((row, index) => {
      if (!row || typeof row !== 'object') return;
      for (const [field, value] of Object.entries(row)) {
        if (!/^(?:fecha_|proxima_revision$|valido_|practica_fecha_revision$)/.test(field) || typeof value !== 'number') continue;
        const key = [sheet, row.id ?? String(index), field].join('/');
        const cell = snapshot.dateCells?.[key];
        const expected = Number.isInteger(value) && value >= 0 && value < 2958466 ? new Date(Date.UTC(1899, 11, 30) + value * 86400000).toISOString().slice(0, 10) : null;
        // DATE is the authoritative cell type. A localized display (e.g. es_AR dd/mm/yyyy)
        // need not be ISO; no string parsing or inference is used to convert the serial.
        if (cell?.type !== 'DATE' || cell.serial !== value || !expected || validDate(cell.display) && cell.display !== expected) {
          issues.push({ code: 'CELL_DATE_METADATA', sheet, originalId: row.id, field });
          continue;
        }
        row[field] = expected;
        conversions.push({ sheet, originalId: row.id, field, originalValue: value, normalizedValue: expected, cellHash: fingerprint(cell) });
      }
    });
  }
  return { normalized, issues, conversions };
}
