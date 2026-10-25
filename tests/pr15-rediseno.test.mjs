import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { projectRoot } from "../scripts/validate-data.mjs";
import { REGIONES, REGION_POR_PROVINCIA } from "../lib/catalog.ts";
import { REGIONES_VISUALES, agruparPorRegion, regionDeProvincia } from "../lib/regiones.ts";
import { ESPACIOS, FORMATOS, modoEspacio } from "../lib/publicidad.ts";
import { NAV_ANCHORS } from "../lib/site-links.ts";
import { GRILLA_TARJETAS, SIZES_TARJETAS, GRILLA_DESTACADAS, ITEM_DESTACADA, SIZES_DESTACADAS, SIZES_ANCHO_COMPLETO } from "../components/ui/grillas.ts";

const source = path => readFile(join(projectRoot, path), "utf8");
const json = async path => JSON.parse(await source(path));

test("las seis regiones tienen presentación propia, anclas únicas y cubren las 24 provincias", async () => {
  assert.deepEqual(REGIONES_VISUALES.map(r => r.nombre), REGIONES);
  assert.equal(new Set(REGIONES_VISUALES.map(r => r.ancla)).size, REGIONES.length);
  for (const region of REGIONES_VISUALES) {
    assert.match(region.ancla, /^region-[a-z-]+$/);
    for (const clase of [region.texto, region.fondo, region.borde, region.relleno]) assert.match(clase, /region-[a-z-]+$/);
  }
  const provincias = await json("public/data/provincias.json");
  assert.equal(provincias.length, 24);
  for (const p of provincias) {
    assert.equal(regionDeProvincia(p.SLUG)?.nombre, p.ZONA, p.SLUG);
  }
  const grupos = agruparPorRegion(provincias, p => p.ZONA);
  assert.equal(grupos.reduce((n, g) => n + g.items.length, 0), 24);
  assert.deepEqual(grupos.map(g => g.region.nombre), REGIONES);
});

test("cada color de región existe como token del tema", async () => {
  const css = await source("app/globals.css");
  for (const region of REGIONES_VISUALES) {
    const token = region.fondo.replace("bg-", "--color-");
    assert.match(css, new RegExp(`${token}: #[0-9A-F]{6};`, "i"), token);
  }
  assert.equal(Object.keys(REGION_POR_PROVINCIA).length, 24);
});

test("cada grilla declara un sizes con sus mismas columnas y breakpoints", () => {
  // GRILLA_TARJETAS: 2 / sm:3 / lg:4 columnas → sizes divide por 2, 3 y 4 en < 640, ≥ 640 y ≥ 1024 px.
  assert.match(GRILLA_TARJETAS, /grid-cols-2 .*sm:grid-cols-3 .*lg:grid-cols-4/);
  assert.match(SIZES_TARJETAS, /\(min-width: 1024px\) calc\(\(100vw - \d+px\) \/ 4\)/);
  assert.match(SIZES_TARJETAS, /\(min-width: 640px\) calc\(\(100vw - \d+px\) \/ 3\)/);
  assert.match(SIZES_TARJETAS, /, calc\(\(100vw - \d+px\) \/ 2\)$/);
  // PR16: destacadas en fila desplazable en teléfonos (tarjetas del 78 %), tres columnas desde 640 px.
  assert.match(GRILLA_DESTACADAS, /fila-desplazable .*sm:grid sm:grid-cols-3/);
  assert.match(ITEM_DESTACADA, /^w-\[78%\] sm:w-auto$/);
  assert.match(SIZES_DESTACADAS, /\(min-width: 640px\) calc\(\(100vw - \d+px\) \/ 3\)/);
  assert.match(SIZES_DESTACADAS, /, calc\(\(100vw - 32px\) \* 0\.78\)$/);
  // Carruseles: techo de 320 px de referencia en teléfonos (variante de 960 px con densidad ≤ 3×).
  assert.match(SIZES_ANCHO_COMPLETO, /, min\(calc\(100vw - 32px\), 320px\)$/);
});

test("la publicidad está desactivada: sin proveedor, scripts ni IDs, y solo la vista previa local dibuja reservas", async () => {
  assert.equal(modoEspacio({}), "oculto");
  assert.equal(modoEspacio({ AUS_PUBLICIDAD_VISTA_PREVIA: "true" }), "oculto");
  assert.equal(modoEspacio({ AUS_PUBLICIDAD_VISTA_PREVIA: "1" }), "vista-previa");
  for (const [id, espacio] of Object.entries(ESPACIOS)) {
    const formato = FORMATOS[espacio.formato];
    assert.ok(formato, id);
    // Reserva fija: alto y ancho máximos explícitos, para que un anuncio futuro no desplace el contenido.
    assert.match(formato.claseAlto, /^h-\[\d+px\]/);
    assert.match(formato.claseAncho, /^max-w-\[\d+px\]/);
  }
  for (const dir of ["app", "components", "lib"]) {
    for (const entry of await readdir(join(projectRoot, dir), { recursive: true })) {
      if (!/\.(tsx?|jsx?|css)$/.test(entry)) continue;
      assert.doesNotMatch(await source(join(dir, entry)), /adsbygoogle|googlesyndication|ca-pub-\d|doubleclick|googletagservices/, `${dir}/${entry}`);
    }
  }
  const anuncio = await source("components/publicidad/EspacioPublicitario.tsx");
  assert.match(anuncio, /rel="sponsored noopener noreferrer"/);
  assert.match(anuncio, /aria-label="Publicidad"/);
});

test("el peso mostrado de cada guía PDF es el del archivo original y el inventario de PR12", async () => {
  const pesos = await json("lib/pdf-pesos.json");
  const guias = await json("public/data/escapadas.json");
  const inventario = await json("docs/pr12/pdf-replacements.json");
  assert.deepEqual(Object.keys(pesos).sort(), guias.map(g => g.PDF).sort());
  for (const [ruta, bytes] of Object.entries(pesos)) {
    assert.equal((await stat(join(projectRoot, "public", ruta))).size, bytes, ruta);
    const fila = inventario.find(f => f.pdf.path === ruta);
    if (fila) assert.equal(fila.pdf.bytes, bytes, ruta);
  }
});

test("el nombre accesible de cada enlace del menú contiene su texto visible (WCAG 2.5.3)", async () => {
  const navbar = await source("components/Navbar.tsx");
  const enlaces = [...navbar.matchAll(/label: "([^"]+)", descripcion: "[^"]+", aria: NAV_ANCHORS\.(\w+)/g)];
  assert.equal(enlaces.length, 4);
  for (const [, visible, clave] of enlaces) assert.ok(NAV_ANCHORS[clave].startsWith(visible), `${visible} → ${NAV_ANCHORS[clave]}`);
});
