// Auditar el artefacto exportado: los originales y sus alternativas estáticas llegan intactos a Pages.
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve, join } from "node:path";
import { CAMPANAS } from "../../lib/publicidad.ts";

const mode = process.argv[2] || "preview";
assert.ok(["preview", "consent-test", "production-audit"].includes(mode));
const artifact = resolve(".artifacts/pages", mode);
const inventory = JSON.parse(await readFile("docs/pr21/inventario.json", "utf8"));
assert.deepEqual((await readdir(join(artifact, "publicidad"))).sort(), inventory.flatMap(c => c.derivados.map(i => i.src.split("/").at(-1))).sort(), "Solo recursos de campaña declarados, sin archivos auxiliares");
const routes = {
  "portada-tras-hero": "index.html",
  "actividades-antes-explorador": "actividades.html",
  "escapadas-antes-guias": "escapadas.html",
  "santa-fe-tras-encabezado": "provincias/santa_fe.html",
  "seguridad-antes-consejos": "seguridad.html",
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
    for (const image of [campana.imagen, campana.movimientoReducido].filter(Boolean)) assert.ok(html.includes(image.src), image.src);
  }
}
console.log(JSON.stringify({ mode, campanas: CAMPANAS.length, recursos: resources, originalesServidos: CAMPANAS.length, errors: 0 }));
