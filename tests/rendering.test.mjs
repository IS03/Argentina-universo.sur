import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { readCatalog, projectRoot } from "../scripts/validate-data.mjs";
import { normalizarProvincia, normalizarActividad, resumirProvincia, resumirActividad, filtrarActividades, resolveProvinciaSlug, TODAS_LAS_PROVINCIAS } from "../lib/catalog.ts";
import { getHeroScrollState } from "../lib/home-images.ts";
import { resolverVisitasRecientes, MAX_VISITAS_INICIO } from "../lib/recent-visits.ts";
import { teselasVistaPrevia, ANCHOS_MINIMOS, TAMANO_TESELA, ALTO_MAPA } from "../lib/mapa-teselas.ts";

const raw = await readCatalog();
const provincias = raw.provincias.map(normalizarProvincia).map(resumirProvincia);
const actividades = raw.actividades.map(normalizarActividad).map(resumirActividad);
const source = path => readFile(join(projectRoot, path), "utf8");

test("los resúmenes que viajan al navegador solo llevan los campos de las tarjetas", () => {
  assert.deepEqual(Object.keys(actividades[0]).sort(), ["actividad", "actividadSlug", "fotos", "localizacion", "provincia", "slug"]);
  assert.deepEqual(Object.keys(provincias[0]).sort(), ["fotos", "provincia", "slug"]);
  assert.ok([...actividades, ...provincias].every(item => item.fotos.length === 1));
});

test("el filtro de /actividades conserva el listado completo, el máximo por provincia y el alias de Catamarca", () => {
  assert.equal(filtrarActividades(actividades, TODAS_LAS_PROVINCIAS).length, 72);
  const catamarca = filtrarActividades(actividades, resolveProvinciaSlug("catarmaca"));
  assert.equal(catamarca.length, 3);
  assert.ok(catamarca.every(a => a.slug === "catamarca"));
  assert.equal(filtrarActividades(actividades, "inexistente").length, 0);
  const muchas = Array.from({ length: 6 }, (_, i) => ({ slug: "santa_fe", i }));
  assert.equal(filtrarActividades(muchas, "santa_fe").length, 4);
});

test("el estado del hero parte de los valores del HTML y llega al máximo a media pantalla", () => {
  assert.deepEqual(getHeroScrollState(0, 1000), { opacity: 1, blur: 0, overlay: 0, overlayOpacity: 0, contenidoY: 50 });
  const medio = getHeroScrollState(250, 1000);
  assert.equal(medio.blur, 6);
  assert.ok(Math.abs(medio.opacity - 0.4) < 1e-9);
  const final = getHeroScrollState(5000, 1000);
  assert.deepEqual(final, { opacity: 0, blur: 12, overlay: 0.4, overlayOpacity: 1, contenidoY: 0 });
});

test("Continuar explorando ordena por fecha, admite el formato antiguo, el alias y JSON inválido", () => {
  const visitasProvincias = JSON.stringify([{ slug: "catarmaca", timestamp: 30 }, { slug: "no-existe", timestamp: 99 }, { slug: "cordoba", timestamp: 10 }]);
  const visitasActividades = JSON.stringify([{ slug: "vivir-la-magia-del-teatro-colon", timestamp: 20 }]);
  const items = resolverVisitasRecientes(visitasProvincias, visitasActividades, provincias, actividades);
  assert.deepEqual(items.map(i => i.tipo === "provincia" ? i.data.slug : i.data.actividadSlug), ["catamarca", "vivir-la-magia-del-teatro-colon", "cordoba"]);
  assert.deepEqual(resolverVisitasRecientes('["santa_fe"]', null, provincias, actividades, 1).map(i => i.data.slug), ["santa_fe"]);
  const original = console.error;
  console.error = () => {};
  try {
    assert.deepEqual(resolverVisitasRecientes("{roto", "null", provincias, actividades), []);
  } finally {
    console.error = original;
  }
  const muchas = JSON.stringify(actividades.slice(0, 12).map((a, i) => ({ slug: a.actividadSlug, timestamp: i })));
  assert.equal(resolverVisitasRecientes(null, muchas, provincias, actividades).length, MAX_VISITAS_INICIO);
});

test("portada y /actividades se renderizan en el servidor y el navegador no descarga los catálogos", async () => {
  for (const path of ["components/HomeContent.tsx", "components/ActividadesContent.tsx", "app/page.tsx", "app/actividades/page.tsx"]) {
    assert.doesNotMatch(await source(path), /^["']use client["']/m, `${path} debe ser Server Component`);
  }
  const archivos = [];
  for (const dir of ["app", "components"]) {
    for (const entry of await readdir(join(projectRoot, dir), { recursive: true })) {
      if (/\.(tsx?|jsx?)$/.test(entry)) archivos.push(join(dir, entry));
    }
  }
  for (const path of archivos) {
    assert.doesNotMatch(await source(path), /fetch\(\s*["'`]\/data\//, `${path} no debe pedir /data/*.json desde el navegador`);
  }
});

test("el layout mantiene montados Analytics y Speed Insights", async () => {
  const layout = await source("app/layout.tsx");
  assert.match(layout, /from "@vercel\/analytics\/next"/);
  assert.match(layout, /from "@vercel\/speed-insights\/next"/);
  assert.match(layout, /<Analytics \/>/);
  assert.match(layout, /<SpeedInsights \/>/);
});

test("los rewrites del filtro y el navegador resuelven igual cada valor de ?provincia", async () => {
  const { ACTIVIDADES_FILTRO_REWRITES, ACTIVIDADES_FILTRO_REDIRECTS, SLUGS_PROVINCIAS, RUTA_INTERNA_FILTRO, FILTRO_SIN_RESULTADOS, seleccionDesdeParametro } = await import("../lib/site-links.ts");
  const nextConfig = (await import("../next.config.ts")).default;
  assert.deepEqual([...SLUGS_PROVINCIAS].sort(), raw.provincias.map(p => p.SLUG).sort());
  assert.deepEqual((await nextConfig.rewrites()).beforeFiles, ACTIVIDADES_FILTRO_REWRITES);
  assert.ok((await nextConfig.redirects()).some(r => r.source === `${RUTA_INTERNA_FILTRO}/:provincia`));
  // Misma comparación que Next: primera regla cuyo valor coincide completo (^…$).
  const servidor = valor => {
    for (const regla of ACTIVIDADES_FILTRO_REWRITES) {
      const m = valor ? valor.match(new RegExp(`^${regla.has[0].value}$`)) : null;
      if (m) return regla.destination.replace(":provincia", m.groups?.provincia ?? "").slice(RUTA_INTERNA_FILTRO.length + 1);
    }
    return TODAS_LAS_PROVINCIAS; // sin rewrite: /actividades estática
  };
  const valores = [...SLUGS_PROVINCIAS, "catarmaca", "", null, "no-existe", "Santa_Fe", "santa_fe ", "santa_fe|cordoba", ".*", "sin-resultados", "todas"];
  for (const valor of valores) assert.equal(seleccionDesdeParametro(valor), servidor(valor), `?provincia=${valor}`);
  assert.equal(seleccionDesdeParametro("catarmaca"), "catamarca");
  assert.equal(seleccionDesdeParametro("no-existe"), FILTRO_SIN_RESULTADOS);
  assert.ok(ACTIVIDADES_FILTRO_REDIRECTS.every(r => r.permanent && r.destination.startsWith("/actividades?")));
});

// Fórmula de teselas de OpenStreetMap (wiki "Slippy map tilenames"), independiente de lib/mapa-teselas.
const teselaOsm = (lat, lon, z) => {
  const n = 2 ** z, r = lat * Math.PI / 180;
  return [Math.floor((lon + 180) / 360 * n), Math.floor((1 - Math.asinh(Math.tan(r)) / Math.PI) / 2 * n)];
};
const coordenadasDeMapas = () => [
  ...raw.actividades.map(normalizarActividad).map(a => [a.lat, a.lon]),
  ...raw.provincias.map(normalizarProvincia).map(p => [p.lat_capital, p.lon_capital]),
].filter(([lat, lon]) => lat && lon);

test("la vista previa del mapa usa la tesela de OSM que contiene el centro, en la posición de Leaflet", () => {
  for (const [lat, lon] of coordenadasDeMapas()) {
    const [x, y] = teselaOsm(lat, lon, 13);
    const central = teselasVistaPrevia(lat, lon).find(t => t.dx <= 0 && t.dx > -TAMANO_TESELA && t.dy <= 0 && t.dy > -TAMANO_TESELA);
    assert.equal(central?.url, `https://tile.openstreetmap.org/13/${x}/${y}.png`, `${lat},${lon}`);
  }
});

test("la vista previa cubre el mapa en cualquier ancho y un móvil no descarga teselas de escritorio", () => {
  for (const [lat, lon] of coordenadasDeMapas()) {
    const teselas = teselasVistaPrevia(lat, lon);
    assert.equal(new Set(teselas.map(t => t.url)).size, teselas.length);
    // Ventana de vw px con un contenedor del mismo ancho (cota superior: el real es más angosto).
    for (const vw of [320, 375, 412, 600, 768, 1024, 1280]) {
      const ancho = Math.min(vw, 1216);
      const visibles = teselas.filter(t => t.anchoMinimo <= vw);
      for (const px of [-ancho / 2, 0, ancho / 2 - 1]) for (const py of [-ALTO_MAPA / 2, 0, ALTO_MAPA / 2 - 1]) {
        assert.ok(visibles.some(t => px >= t.dx && px < t.dx + TAMANO_TESELA && py >= t.dy && py < t.dy + TAMANO_TESELA), `${lat},${lon} sin cubrir en ${vw}px (${px},${py})`);
      }
    }
    assert.ok(teselas.filter(t => t.anchoMinimo === 0).length <= 9);
    assert.ok(teselas.every(t => ANCHOS_MINIMOS.includes(t.anchoMinimo)));
  }
});

// Next 16.3+ predice el segmento de /actividades?provincia=… (rewrite por query) a partir de
// /actividades y su prefetch responde 404 (vercel/next.js#97244). Ningún enlace a esa URL debe
// precargarse; el clic sigue navegando en el cliente.
test("los enlaces a /actividades?provincia=… no se precargan", async () => {
  const archivos = [];
  for (const dir of ["app", "components"]) {
    for (const entry of await readdir(join(projectRoot, dir), { recursive: true })) {
      if (/\.(tsx|jsx)$/.test(entry)) archivos.push(join(dir, entry));
    }
  }
  let enlaces = 0;
  for (const path of archivos) {
    for (const [link] of (await source(path)).matchAll(/<Link\b[^>]*?(?:actividadesPorProvincia|\?provincia=)[\s\S]*?>/g)) {
      enlaces++;
      assert.match(link, /prefetch=\{false\}/, `${path}: ${link.slice(0, 80)}`);
    }
  }
  assert.ok(enlaces >= 1);
});

test("el aviso de privacidad tiene un contacto válido y declara todo el almacenamiento local", async () => {
  const { CONTACTO_PRIVACIDAD, ALMACENAMIENTO_LOCAL, RESPONSABLE } = await import("../lib/privacidad.ts");
  assert.match(CONTACTO_PRIVACIDAD, /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i, "falta el correo para ejercer los derechos (lib/privacidad.ts)");
  assert.ok(RESPONSABLE.trim());
  const declaradas = new Set(ALMACENAMIENTO_LOCAL.map(item => item.nombre));
  for (const dir of ["app", "components", "lib"]) {
    for (const entry of await readdir(join(projectRoot, dir), { recursive: true })) {
      if (!/\.(tsx?|jsx?)$/.test(entry)) continue;
      for (const [, clave] of (await source(join(dir, entry))).matchAll(/(?:local|session)Storage\.setItem\(\s*["'`]([^"'`]+)/g)) {
        assert.ok(declaradas.has(clave), `${dir}/${entry} guarda "${clave}" y el aviso no lo declara`);
      }
      assert.doesNotMatch(await source(join(dir, entry)), /document\.cookie\s*=/, `${dir}/${entry} escribe cookies propias no declaradas`);
    }
  }
});

test("/privacidad no se indexa ni entra al sitemap", async () => {
  const pagina = await source("app/privacidad/page.tsx");
  assert.match(pagina, /robots: \{ index: false, follow: true \}/);
  const { STATIC_PAGES } = await import("../lib/seo.ts");
  assert.ok(!STATIC_PAGES.some(p => p.path === "/privacidad"));
});
