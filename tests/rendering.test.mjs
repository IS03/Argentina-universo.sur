import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { readCatalog, projectRoot } from "../scripts/validate-data.mjs";
import { normalizarProvincia, normalizarActividad, resumirProvincia, resumirActividad, filtrarActividades, resolveProvinciaSlug, TODAS_LAS_PROVINCIAS } from "../lib/catalog.ts";
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
      const codigo = await source(join(dir, entry));
      if (join(dir, entry) === join("components", "consentimiento", "gtag.ts")) {
        // Única escritura permitida: expirar cookies de GA4 al rechazar.
        for (const [asignacion] of codigo.matchAll(/document\.cookie\s*=[^;]*;[^\n]*/g)) assert.match(asignacion, /Max-Age=0/);
        continue;
      }
      assert.doesNotMatch(codigo, /document\.cookie\s*=/, `${dir}/${entry} escribe cookies propias no declaradas`);
    }
  }
});

test("/privacidad no se indexa ni entra al sitemap", async () => {
  const pagina = await source("app/privacidad/page.tsx");
  assert.match(pagina, /robots: \{ index: false, follow: true \}/);
  const { STATIC_PAGES } = await import("../lib/seo.ts");
  assert.ok(!STATIC_PAGES.some(p => p.path === "/privacidad"));
});

test("GA4 solo se activa en producción de Vercel y con un ID válido", async () => {
  const { idMedicionGA } = await import("../lib/analytics.ts");
  assert.equal(idMedicionGA({}), null);
  assert.equal(idMedicionGA({ NEXT_PUBLIC_GA_ID: "G-0DQ0YWHJNZ" }), null);
  assert.equal(idMedicionGA({ VERCEL_ENV: "preview", NEXT_PUBLIC_GA_ID: "G-0DQ0YWHJNZ" }), null);
  assert.equal(idMedicionGA({ VERCEL_ENV: "development", NEXT_PUBLIC_GA_ID: "G-0DQ0YWHJNZ" }), null);
  assert.equal(idMedicionGA({ VERCEL_ENV: "production" }), null);
  assert.equal(idMedicionGA({ VERCEL_ENV: "production", NEXT_PUBLIC_GA_ID: " G-0DQ0YWHJNZ " }), "G-0DQ0YWHJNZ");
  assert.throws(() => idMedicionGA({ VERCEL_ENV: "production", NEXT_PUBLIC_GA_ID: "UA-123-1" }));
});

test("al aceptar, GA4 recibe analítica concedida y publicidad y señales de Google desactivadas", async () => {
  const { COMANDOS_CONSENTIMIENTO, COMANDO_REVOCAR, cookiesGA } = await import("../lib/analytics.ts");
  const [consent, set] = COMANDOS_CONSENTIMIENTO;
  assert.deepEqual(consent.slice(0, 2), ["consent", "default"]);
  assert.equal(consent[2].analytics_storage, "granted");
  for (const k of ["ad_storage", "ad_user_data", "ad_personalization"]) assert.equal(consent[2][k], "denied");
  assert.equal(consent[2].region, undefined);
  assert.deepEqual(set, ["set", { allow_google_signals: false, allow_ad_personalization_signals: false, ads_data_redaction: true }]);
  assert.deepEqual(COMANDO_REVOCAR, ["consent", "update", { analytics_storage: "denied" }]);
  assert.deepEqual(cookiesGA("G-0DQ0YWHJNZ"), ["_ga", "_ga_0DQ0YWHJNZ"]);
  // Sin config ni page_view manual: las visitas las registra la medición mejorada.
  assert.doesNotMatch(JSON.stringify(COMANDOS_CONSENTIMIENTO), /config|page_view|user_id/);
});

test("GA4 se monta solo después de aceptar, con los permisos fijados antes del config", async () => {
  const layout = await source("app/layout.tsx");
  assert.match(layout, /\{!isPages && gaId && <MedicionConConsentimiento gaId=\{gaId\} \/>\}/);
  assert.match(layout, /\{isPages && gaId && <PagesConsent gaId=\{gaId\} \/>\}/);
  assert.doesNotMatch(layout, /GoogleAnalytics|beforeInteractive|next\/script/);
  const medicion = await source("components/consentimiento/MedicionConConsentimiento.tsx");
  // Único punto que monta GA4: la rama "aceptada", con PermisosGA (useLayoutEffect) antes.
  for (const dir of ["app", "components"]) {
    for (const entry of await readdir(join(projectRoot, dir), { recursive: true })) {
      if (!/\.(tsx|jsx)$/.test(entry) || join(dir, entry) === join("components", "consentimiento", "MedicionConConsentimiento.tsx")) continue;
      assert.doesNotMatch(await source(join(dir, entry)), /<GoogleAnalytics\b/, `${dir}/${entry} no debe montar GA4 sin consentimiento`);
    }
  }
  const rama = medicion.slice(medicion.indexOf('if (decision === "rechazada")'));
  assert.ok(rama.indexOf("<PermisosGA") < rama.indexOf("<GoogleAnalytics"), "permisos antes de GA4");
  // El banner se renderiza también en el servidor ("pendiente"): se pinta con la página, no después.
  assert.match(medicion, /if \(decision === "pendiente" \|\| decision === null\) return <BannerCookies \/>;/);
  assert.match(medicion, /id="aviso-cookies"/);
  assert.match(layout, /<script id="decision-cookies" dangerouslySetInnerHTML=\{\{ __html: SCRIPT_DECISION_INICIAL \}\} \/>/);
  assert.match(await source("app/globals.css"), /html\[data-consentimiento\] #aviso-cookies \{\s*display: none;/);
  assert.match(medicion, /function PermisosGA[\s\S]*?useLayoutEffect/);
  // «Aceptar» y «Rechazar» con el mismo estilo en el banner y en el panel.
  const preferencias = await source("components/consentimiento/PreferenciasCookies.tsx");
  for (const codigo of [medicion, preferencias]) {
    const botones = [...codigo.matchAll(/<button[^>]*className=\{([A-Z_]+)\}/g)].map(m => m[1]);
    assert.deepEqual(botones, ["BOTON_DECISION", "BOTON_DECISION"]);
  }
});

test("la decisión guardada respeta versión y vigencia, y tolera datos inválidos", async () => {
  const { interpretarConsentimiento, serializarConsentimiento, VERSION_CONSENTIMIENTO, VIGENCIA_DIAS } = await import("../lib/consentimiento.ts");
  const ahora = Date.parse("2026-10-24T12:00:00Z");
  const dia = 86_400_000;
  assert.equal(interpretarConsentimiento(serializarConsentimiento("aceptada", ahora), ahora), "aceptada");
  assert.equal(interpretarConsentimiento(serializarConsentimiento("rechazada", ahora), ahora + 30 * dia), "rechazada");
  assert.equal(interpretarConsentimiento(serializarConsentimiento("aceptada", ahora), ahora + (VIGENCIA_DIAS + 1) * dia), null);
  assert.equal(interpretarConsentimiento(serializarConsentimiento("aceptada", ahora + 5 * dia), ahora), null);
  for (const invalido of [null, "", "{", "null", "[]", '{"analitica":"aceptada"}', JSON.stringify({ analitica: "quizas", version: VERSION_CONSENTIMIENTO, fecha: new Date(ahora).toISOString() }), JSON.stringify({ analitica: "aceptada", version: VERSION_CONSENTIMIENTO + 1, fecha: new Date(ahora).toISOString() }), JSON.stringify({ analitica: "aceptada", version: VERSION_CONSENTIMIENTO, fecha: "ayer" })]) {
    assert.equal(interpretarConsentimiento(invalido, ahora), null, String(invalido));
  }
  // El aviso promete 12 meses de vigencia.
  assert.equal(VIGENCIA_DIAS, 365);
  assert.match(await source("app/privacidad/page.tsx"), /durante 12 meses/);
  const { ALMACENAMIENTO_LOCAL } = await import("../lib/privacidad.ts");
  const { CLAVE_CONSENTIMIENTO } = await import("../lib/consentimiento.ts");
  assert.ok(ALMACENAMIENTO_LOCAL.some(item => item.nombre === CLAVE_CONSENTIMIENTO && /12 meses/.test(item.finalidad)));
});

test("el ID de GA4 no está escrito en el código ni se envían eventos manuales", async () => {
  for (const dir of ["app", "components", "lib"]) {
    for (const entry of await readdir(join(projectRoot, dir), { recursive: true })) {
      if (!/\.(tsx?|jsx?|mjs)$/.test(entry)) continue;
      const codigo = await source(join(dir, entry));
      assert.doesNotMatch(codigo, /G-0DQ0YWHJNZ/, `${dir}/${entry}`);
      assert.doesNotMatch(codigo, /sendGAEvent|gtag\(\s*["']event["']/, `${dir}/${entry}`);
    }
  }
});

test("el script del <head> decide igual que interpretarConsentimiento (versión, vigencia, datos inválidos)", async () => {
  const { SCRIPT_DECISION_INICIAL, interpretarConsentimiento, serializarConsentimiento, CLAVE_CONSENTIMIENTO, ATRIBUTO_DECISION, VERSION_CONSENTIMIENTO } = await import("../lib/consentimiento.ts");
  const { runInNewContext } = await import("node:vm");
  const ahora = Date.now();
  const dia = 86_400_000;
  const casos = [
    null, "", "{", "null", "[]", "esto no es JSON",
    serializarConsentimiento("aceptada", ahora), serializarConsentimiento("rechazada", ahora - 100 * dia),
    serializarConsentimiento("aceptada", ahora - 364 * dia), serializarConsentimiento("aceptada", ahora - 366 * dia),
    serializarConsentimiento("aceptada", ahora + 3 * dia),
    JSON.stringify({ analitica: "aceptada", version: VERSION_CONSENTIMIENTO - 1, fecha: new Date(ahora).toISOString() }),
    JSON.stringify({ analitica: "talvez", version: VERSION_CONSENTIMIENTO, fecha: new Date(ahora).toISOString() }),
    JSON.stringify({ analitica: "aceptada", version: VERSION_CONSENTIMIENTO, fecha: "ayer" }),
  ];
  for (const guardado of casos) {
    const atributos = {};
    runInNewContext(SCRIPT_DECISION_INICIAL, {
      localStorage: { getItem: clave => (clave === CLAVE_CONSENTIMIENTO ? guardado : null) },
      document: { documentElement: { setAttribute: (nombre, valor) => { atributos[nombre] = valor; } } },
    });
    assert.equal(atributos[ATRIBUTO_DECISION] ?? null, interpretarConsentimiento(guardado, Date.now()), String(guardado));
  }
  // Sin acceso al almacenamiento (modo privado estricto) no rompe la página.
  assert.doesNotThrow(() => runInNewContext(SCRIPT_DECISION_INICIAL, { localStorage: { getItem() { throw new Error("bloqueado"); } }, document: {} }));
});
