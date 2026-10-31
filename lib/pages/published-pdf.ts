// Legacy lineage (docs/pr10, docs/pr12, docs/pr13, docs/pr14) keeps each guide's original PDF identity.
// A guide may instead be served as a registered derivative (docs/pdf-optimizacion/derivados.json): same
// pages, text and fonts, only its photos recompressed. No I/O here; callers hash the file they read.
export type PdfIdentity = { bytes: number; sha256: string };
export type PdfDerivative = { path: string; original: PdfIdentity; published: PdfIdentity; method: string; date: string };

const same = (a: PdfIdentity, b: PdfIdentity) => a.bytes === b.bytes && a.sha256 === b.sha256;

export function publishedPdfStatus(path: string, legacy: PdfIdentity, actual: PdfIdentity, derivatives: PdfDerivative[]): "original" | "derivative" | "changed" {
  if (same(actual, legacy)) return "original";
  const derivative = derivatives.find(d => d.path === path);
  return derivative && same(derivative.original, legacy) && same(derivative.published, actual) ? "derivative" : "changed";
}
