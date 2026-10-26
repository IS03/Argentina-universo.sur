// Auditar el artefacto exportado, no solo public/: los 18 recursos deben llegar intactos a Pages.
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve, join } from "node:path";
import { CAMPANAS } from "../../lib/publicidad.ts";

const mode = process.argv[2] || "preview";
assert.ok(["preview", "consent-test", "production-audit"].includes(mode));
const artifact = resolve(".artifacts/pages", mode);
const inventory = JSON.parse(await readFile("docs/pr21/inventario.json", "utf8"));
assert.deepEqual((await readdir(join(artifact, "publicidad"))).sort(), inventory.flatMap(c => c.derivados.map(i => i.src.split("/").at(-1))).sort(), "Solo derivados web: no publicar originales ni archivos auxiliares");
const routes = {
  "portada-entre-secciones": "index.html",
  "actividades-tras-listado": "actividades.html",
  "escapadas-tras-guias": "escapadas.html",
  "santa-fe-tras-contenido": "provincias/santa_fe.html",
  "seguridad-tras-contenido": "seguridad.html",
};
let resources = 0;
for (const campana of CAMPANAS) {
  for (const image of inventory.find(c => c.id === campana.id).derivados) {
    const bytes = await readFile(join(artifact, image.src));
    assert.equal(createHash("sha256").update(bytes).digest("hex"), image.sha256, image.src);
    resources++;
  }
  const html = await readFile(join(artifact, routes[campana.ubicacion]), "utf8");
  assert.equal(html.includes(`data-campana="${campana.id}"`), campana.activa);
  if (campana.activa) {
    for (const image of [campana.imagen, ...campana.secuencia ?? []]) assert.ok(html.includes(`src="${image.src}"`), image.src);
  }
}
console.log(JSON.stringify({ mode, campanas: CAMPANAS.length, recursos: resources, originalesPublicados: false, errors: 0 }));
