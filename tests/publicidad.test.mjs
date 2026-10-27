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
  .replace('"react"', JSON.stringify(import.meta.resolve("react")))
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

test("pauta de octubre de 2026: cada creatividad en su ubicación contratada, una sola vez", async () => {
  const contratadas = {
    "juegos-suramericanos": ["portada-central", "components/HomeContent.tsx", 800],
    "seguridad-vial": ["portada-lateral-izquierda", "components/HomeContent.tsx", 200],
    "mil-aulas": ["portada-lateral-derecha", "components/HomeContent.tsx", 300],
    "obras-hidricas": ["actividades-antes-explorador", "components/ActividadesContent.tsx", 600],
    "mamografia": ["escapadas-antes-guias", "app/escapadas/page.tsx", 1140],
    "proteccion-ingresos": ["provincias-lateral-mapa", "components/ViajeArgentina.tsx", 250],
  };
  assert.deepEqual(CAMPANAS.map(c => c.id).sort(), Object.keys(contratadas).sort());
  for (const campana of CAMPANAS) {
    const [espacio, archivo, ancho] = contratadas[campana.id];
    assert.equal(campana.ubicacion, espacio, campana.id);
    // Tamaño natural de la creatividad: se escala hacia abajo en pantallas chicas, nunca se estira.
    assert.equal(campana.anchoMaximo, ancho, campana.id);
    assert.equal(campana.imagen.ancho, ancho, campana.id);
    assert.equal(inventory.find(r => r.id === campana.id).ubicacion, espacio, `inventario de ${campana.id}`);
    const fuente = (await read(archivo)).toString();
    assert.equal(fuente.split(`id="${espacio}"`).length - 1, 1, `${archivo} tiene una sola ranura ${espacio}`);
    assert.doesNotMatch(archivo, /content\/escapadas/);
  }
  // Una ranura por campaña: sin creatividades duplicadas en el mismo espacio.
  assert.equal(new Set(CAMPANAS.map(c => c.ubicacion)).size, CAMPANAS.length);
  // Las ubicaciones anteriores quedan sin campañas (Santa Fe y Seguridad no muestran publicidad).
  for (const vacio of ["santa-fe-tras-encabezado", "seguridad-antes-consejos", "escapada-lateral", "footer-patrocinio"]) {
    assert.ok(ESPACIOS[vacio], vacio);
    assert.deepEqual(anunciosDelEspacio(vacio), [], vacio);
  }
  // Sin vencimientos inventados: el pedido solo dice «octubre» y la baja es manual con activa: false.
  assert.match((await read("lib/publicidad.ts")).toString(), /sin fecha de inicio ni de fin/);
  for (const campana of CAMPANAS) assert.deepEqual(Object.keys(campana).filter(k => /fecha|vence|desde|hasta/i.test(k)), []);
});

test("Escapadas ya no muestra el aviso «Antes de descargar» y conserva las guías en PDF", async () => {
  const pagina = (await read("app/escapadas/page.tsx")).toString();
  assert.doesNotMatch(pagina, /Antes de descargar|<Aviso\b|datos móviles/);
  assert.match(pagina, /<EscapadasContent escapadas=\{escapadas\} \/>/);
  // Octubre Rosa va inmediatamente después del encabezado, antes de las guías.
  assert.match(pagina, /\/>\n\s*<div className="contenedor[^"]*">\n\s*<EspacioPublicitario id="escapadas-antes-guias"/);
  assert.ok(pagina.indexOf('id="escapadas-antes-guias"') < pagina.indexOf("<PublishedTrips"));
});

test("las columnas laterales solo existen con una campaña activa y se fijan únicamente en escritorio", async () => {
  const portada = (await read("components/HomeContent.tsx")).toString();
  assert.match(portada, /anunciosDelEspacio\("portada-lateral-izquierda"\)\.length > 0/);
  assert.match(portada, /anunciosDelEspacio\("portada-lateral-derecha"\)\.length > 0/);
  assert.match(portada, /\{columnas\.izquierda && \(/);
  assert.match(portada, /\{columnas\.derecha && \(/);
  assert.match(portada, /id="portada-lateral-izquierda" className="xl:sticky xl:top-\[calc\(var\(--alto-encabezado\)\+1\.5rem\)\]"/);
  const mapa = (await read("components/ViajeArgentina.tsx")).toString();
  assert.match(mapa, /const conAnuncio = anunciosDelEspacio\("provincias-lateral-mapa"\)\.length > 0/);
  for (const fuente of [portada, mapa]) assert.doesNotMatch(fuente, /(?<![\w-])fixed(?![\w-])/);
});

test("la privacidad declara publicidad directa sin seguimiento", async () => {
  const privacy = (await read("app/privacidad/page.tsx")).toString();
  assert.doesNotMatch(privacy, /ni publicidad/);
  assert.match(privacy, /Publicidad directa/);
  assert.match(privacy, /sin seguimiento|ni seguimiento individual/);
});

test("el footer no muestra el logo fijo ni deja espacio vacío sin campañas, pero permite asignarlas", async () => {
  assert.ok(ESPACIOS["footer-patrocinio"]);
  assert.deepEqual(anunciosDelEspacio("footer-patrocinio"), []);
  assert.equal(renderToStaticMarkup(createElement(Espacio, { id: "footer-patrocinio" })), "");

  const footer = (await read("components/Footer.tsx")).toString();
  assert.match(footer, /<EspacioPublicitario id="footer-patrocinio" className="mt-6" \/>/);
  assert.doesNotMatch(footer, /logo-santa-fe-turismo-color-1\.svg|<Image\b/);
  assert.match(footer, /redes\.map/);
  assert.match(footer, /enlacesRapidos\.map/);

  const asignada = { ...CAMPANAS[0], id: "fixture-footer", ubicacion: "footer-patrocinio", activa: true };
  const campanas = [...CAMPANAS, asignada];
  assert.deepEqual(anunciosDelEspacio("footer-patrocinio", campanas).map(c => c.id), ["fixture-footer"]);
  assert.deepEqual(anunciosDelEspacio("footer-patrocinio", [...CAMPANAS, { ...asignada, activa: false }]), []);
});
