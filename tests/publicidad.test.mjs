import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import sharp from "sharp";
import { CAMPANAS, ESPACIOS, anunciosDelEspacio, urlAnuncio } from "../lib/publicidad.ts";

const root = new URL("../", import.meta.url);
const read = path => readFile(new URL(path, root));
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const inventory = JSON.parse(await read("docs/pr21/inventario.json"));
// Renderizar el componente real, con sus funciones de selección y URL reales.
const code = ts.transpileModule((await read("components/publicidad/EspacioPublicitario.tsx")).toString(), {
  compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText.replace('"react/jsx-runtime"', JSON.stringify(import.meta.resolve("react/jsx-runtime")))
  .replace('"@/lib/publicidad"', JSON.stringify(new URL("lib/publicidad.ts", root).href));
const { default: Espacio, AnuncioDirecto } = await import("data:text/javascript;base64," + Buffer.from(code).toString("base64"));

test("seis originales reales, trazables y distintos de los fixtures; todos los WebP son estáticos y completos", async () => {
  assert.equal(CAMPANAS.length, 6);
  assert.equal(new Set(CAMPANAS.map(c => c.id)).size, 6);
  const originals = (await readdir(new URL("publicidad/", root))).filter(n => !n.startsWith(".")).sort();
  assert.equal(new Set(CAMPANAS.map(c => c.original)).size, 6);
  for (const campana of CAMPANAS) assert.ok(originals.includes(campana.original.slice("publicidad/".length)));
  for (const campana of CAMPANAS) {
    const row = inventory.find(r => r.id === campana.id);
    assert.ok(row, campana.id);
    assert.equal(hash(await read(campana.original)), row.sha256);
    assert.equal(row.url, campana.url || null);
    const images = [campana.imagen, ...campana.secuencia ?? []];
    assert.equal(row.derivados.length, images.length);
    for (const image of images) {
      assert.match(image.src, /^\/publicidad\/[a-z0-9-]+\.webp$/);
      assert.ok(image.alt.trim().length > 5);
      const bytes = await read("public" + image.src);
      const actual = await sharp(bytes).metadata();
      assert.equal(actual.format, "webp");
      assert.equal(actual.pages || 1, 1, "Sin reproducción automática");
      assert.equal(actual.width, image.ancho);
      assert.equal(actual.height, image.alto);
      assert.equal(actual.width / actual.height, row.ancho / row.alto);
      assert.equal(hash(bytes), row.derivados.find(d => d.src === image.src).sha256);
      assert.ok(bytes.length < 150_000, "Peso por imagen limitado");
    }
  }
});

test("cada campaña se desactiva y reactiva por separado sin mutar las demás", () => {
  const baseline = CAMPANAS.map(c => ({ ...c, activa: true }));
  for (const campana of CAMPANAS) {
    assert.ok(ESPACIOS[campana.ubicacion]);
    assert.ok(anunciosDelEspacio(campana.ubicacion, baseline).some(c => c.id === campana.id));
    const disabled = baseline.map(c => c.id === campana.id ? { ...c, activa: false } : c);
    const selected = Object.keys(ESPACIOS).flatMap(id => anunciosDelEspacio(id, disabled));
    assert.deepEqual(selected.map(c => c.id).sort(), CAMPANAS.filter(c => c.id !== campana.id).map(c => c.id).sort());
    const enabled = disabled.map(c => c.id === campana.id ? { ...c, activa: true } : c);
    assert.deepEqual(anunciosDelEspacio(campana.ubicacion, enabled), anunciosDelEspacio(campana.ubicacion, baseline));
  }
  assert.equal(renderToStaticMarkup(createElement(Espacio, { id: "escapada-lateral" })), "");
});

test("URL opcional: ausente o inválida no crea enlace; web válido lleva atributos patrocinados", () => {
  for (const url of [undefined, "", " ", "/", "javascript:alert(1)", "data:text/html,algo", "mailto:alguien@example.com", "https://user:pass@example.com/"]) {
    assert.equal(urlAnuncio(url), null);
    const html = renderToStaticMarkup(createElement(AnuncioDirecto, { anuncio: { ...CAMPANAS[0], url } }));
    assert.doesNotMatch(html, /<a\s/);
    assert.match(html, /<img/);
  }
  // Únicamente un fixture de prueba; nunca se publica como campaña.
  for (const url of ["https://example.com/campana", "http://example.com/"]) {
    const html = renderToStaticMarkup(createElement(AnuncioDirecto, { anuncio: { ...CAMPANAS[0], url } }));
    assert.match(html, /target="_blank"/);
    assert.match(html, /rel="sponsored noopener noreferrer"/);
    assert.ok(html.includes(`href="${url}"`));
  }
});

test("HTML inicial con rótulo, dimensiones, imágenes locales y secuencia sin JS; sin reserva ficticia", () => {
  for (const campana of CAMPANAS) {
    if (!campana.activa) continue;
    const html = renderToStaticMarkup(createElement(Espacio, { id: campana.ubicacion }));
    assert.ok(html.includes(`data-campana="${campana.id}"`));
    assert.match(html, /aria-label="Publicidad"/);
    assert.match(html, />Publicidad<\/p>/);
    assert.ok(html.includes(`width="${campana.imagen.ancho}" height="${campana.imagen.alto}"`));
    assert.match(html, /object-contain/);
    assert.doesNotMatch(html, /<script|<iframe|Negocio turístico de ejemplo|object-cover|onClick|<details[^>]+open/);
  }
});

test("los seis anuncios tienen ranuras en cinco páginas públicas; no requieren fichas en borrador", async () => {
  const placements = {
    "portada-entre-secciones": "components/HomeContent.tsx",
    "actividades-tras-listado": "components/ActividadesContent.tsx",
    "escapadas-tras-guias": "app/escapadas/page.tsx",
    "santa-fe-tras-contenido": "app/provincias/[slug]/page.tsx",
    "seguridad-tras-contenido": "app/seguridad/page.tsx",
  };
  for (const campana of CAMPANAS) {
    assert.ok(placements[campana.ubicacion]);
    assert.ok((await read(placements[campana.ubicacion])).toString().includes(`id="${campana.ubicacion}"`));
  }
  const privacy = (await read("app/privacidad/page.tsx")).toString();
  assert.doesNotMatch(privacy, /ni publicidad/);
  assert.match(privacy, /Publicidad directa/);
  assert.match(privacy, /sin seguimiento|ni seguimiento individual/);
});
