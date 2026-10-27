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
  "portada-central": "index.html",
  "portada-lateral-izquierda": "index.html",
  "portada-lateral-derecha": "index.html",
  "actividades-antes-explorador": "actividades.html",
  "escapadas-antes-guias": "escapadas.html",
  "provincias-lateral-mapa": "provincias.html",
};
// Páginas que tuvieron campañas hasta septiembre de 2026: no deben conservar ninguna.
const sinCampanas = ["provincias/santa_fe.html", "seguridad.html"];
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
for (const page of sinCampanas) assert.doesNotMatch(await readFile(join(artifact, page), "utf8"), /data-campana=/, page);
// Cada creatividad aparece una sola vez en todo el sitio exportado: ni duplicados ni restos en ubicaciones viejas.
const paginas = (await readdir(artifact, { recursive: true })).filter(f => f.endsWith(".html"));
const apariciones = Object.fromEntries(CAMPANAS.map(c => [c.id, []]));
for (const page of paginas) {
  const html = await readFile(join(artifact, page), "utf8");
  for (const campana of CAMPANAS) {
    const veces = html.split(`data-campana="${campana.id}"`).length - 1;
    for (let i = 0; i < veces; i++) apariciones[campana.id].push(page);
  }
}
// Qué hacer se exporta una vez por filtro (actividades/por-provincia/*): es la misma página.
const pagina = file => file.replace(/^actividades\/por-provincia\/[^/]+\.html$/, "actividades.html");
for (const campana of CAMPANAS) {
  const lista = apariciones[campana.id];
  assert.equal(new Set(lista).size, lista.length, `${campana.id} aparece dos veces en la misma página`);
  assert.deepEqual([...new Set(lista.map(pagina))], campana.activa ? [routes[campana.ubicacion]] : [], campana.id);
}
console.log(JSON.stringify({ mode, campanas: CAMPANAS.length, recursos: resources, originalesServidos: CAMPANAS.length, errors: 0 }));
