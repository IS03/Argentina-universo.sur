import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { projectRoot } from "../scripts/validate-data.mjs";
import { publishedPdfStatus } from "../lib/pages/published-pdf.ts";

const json = async path => JSON.parse(await readFile(join(projectRoot, path), "utf8"));

test("cada guía publicada es su original de PR10 o un derivado registrado de ese original", async () => {
  const matriz = await json("docs/pr10/pdf-matrix.json");
  const derivados = await json("docs/pdf-optimizacion/derivados.json");
  assert.equal(new Set(derivados.map(d => d.path)).size, derivados.length);
  for (const d of derivados) assert.ok(matriz.some(r => r.path === d.path), d.path);
  for (const fila of matriz) {
    const bytes = await readFile(join(projectRoot, "public", fila.path));
    const actual = { bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") };
    assert.notEqual(publishedPdfStatus(fila.path, fila, actual, derivados), "changed", fila.path);
  }
});

test("un PDF cambiado sin registro, o registrado sobre otro original, se rechaza", () => {
  const original = { bytes: 10, sha256: "a".repeat(64) }, publicado = { bytes: 4, sha256: "b".repeat(64) };
  const derivado = { path: "/pdf/x.pdf", original, published: publicado, method: "m", date: "2026-10-31" };
  assert.equal(publishedPdfStatus("/pdf/x.pdf", original, original, []), "original");
  assert.equal(publishedPdfStatus("/pdf/x.pdf", original, publicado, [derivado]), "derivative");
  assert.equal(publishedPdfStatus("/pdf/x.pdf", original, publicado, []), "changed");
  assert.equal(publishedPdfStatus("/pdf/x.pdf", { bytes: 11, sha256: "c".repeat(64) }, publicado, [derivado]), "changed");
  assert.equal(publishedPdfStatus("/pdf/y.pdf", original, publicado, [derivado]), "changed");
});
