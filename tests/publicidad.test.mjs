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

test("los seis recursos públicos son idénticos al cliente; los GIF conservan cuadros, tiempos y bucles", async () => {
  assert.equal(CAMPANAS.length, 6);
  assert.equal(new Set(CAMPANAS.map(c => c.id)).size, 6);
  const originals = (await readdir(new URL("publicidad/", root))).filter(n => !n.startsWith(".")).sort();
  assert.equal(new Set(CAMPANAS.map(c => c.original)).size, 6);
  for (const campana of CAMPANAS) assert.ok(originals.includes(campana.original.slice("publicidad/".length)));
  for (const campana of CAMPANAS) {
    const row = inventory.find(r => r.id === campana.id);
    assert.ok(row, campana.id);
    const original = await read(campana.original);
    assert.equal(hash(original), row.sha256);
    assert.equal(row.url, campana.url || null);
    assert.deepEqual(await read("public" + campana.imagen.src), original);
    const originalMetadata = await sharp(original, { animated: true }).metadata();
    const images = [campana.imagen, campana.movimientoReducido].filter(Boolean);
    assert.equal(row.derivados.length, images.length);
    for (const image of images) {
      assert.match(image.src, /^\/publicidad\/[a-z0-9-]+\.(gif|jpg|webp)$/);
      assert.ok(image.alt.trim().length > 5);
      const bytes = await read("public" + image.src);
      const actual = await sharp(bytes, { animated: true }).metadata();
      if (image === campana.imagen) {
        assert.equal(actual.pages || 1, originalMetadata.pages || 1);
        assert.deepEqual(actual.delay, originalMetadata.delay);
        assert.equal(actual.loop, originalMetadata.loop);
      } else {
        assert.equal(actual.format, "webp");
        assert.equal(actual.pages || 1, 1, "Movimiento reducido usa solo un cuadro");
      }
      assert.equal(actual.width, image.ancho);
      assert.equal(actual.pageHeight || actual.height, image.alto);
      assert.equal(actual.width / (actual.pageHeight || actual.height), row.ancho / row.alto);
      assert.equal(hash(bytes), row.derivados.find(d => d.src === image.src).sha256);
    }
    assert.equal(!!campana.movimientoReducido, originalMetadata.format === "gif");
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

test("HTML con banners directos y picture accesible: sin rótulos visibles, tarjetas, párrafos ni desplegables", () => {
  for (const campana of CAMPANAS) {
    if (!campana.activa) continue;
    const html = renderToStaticMarkup(createElement(Espacio, { id: campana.ubicacion }));
    assert.ok(html.includes(`data-campana="${campana.id}"`));
    assert.match(html, /aria-label="Publicidad"/);
    assert.ok(html.includes(`width="${campana.imagen.ancho}" height="${campana.imagen.alto}"`));
    assert.match(html, /object-contain/);
    assert.doesNotMatch(html, /<script|<iframe|<p[\s>]|<details|<summary|<h[1-6]|bg-white|border-arena|rounded-control|object-cover|onClick/);
    assert.match(html, /<picture/);
    if (campana.movimientoReducido) {
      assert.match(html, /media="\(prefers-reduced-motion: reduce\)"/);
      assert.ok(html.includes(campana.movimientoReducido.src));
    }
  }
});

test("los seis anuncios tienen ranuras en cinco páginas públicas; no requieren fichas en borrador", async () => {
  const placements = {
    "portada-tras-hero": "components/HomeContent.tsx",
    "actividades-antes-explorador": "components/ActividadesContent.tsx",
    "escapadas-antes-guias": "app/escapadas/page.tsx",
    "santa-fe-tras-encabezado": "app/provincias/[slug]/page.tsx",
    "seguridad-antes-consejos": "app/seguridad/page.tsx",
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
