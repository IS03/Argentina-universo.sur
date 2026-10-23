import test from "node:test";
import assert from "node:assert/strict";
import { readCatalog } from "../scripts/validate-data.mjs";
import { normalizarProvincia, normalizarActividad } from "../lib/catalog.ts";
import { ROUTES } from "../lib/site-links.ts";
import { SITE_URL, STATIC_PAGES, canonicalUrl, staticPageMetadata, provinciaMetadata, actividadMetadata, createSitemap, createRobots } from "../lib/seo.ts";
import nextConfig from "../next.config.ts";
import { readMetadata, auditMetadata, auditSitemap, auditRobots } from "../scripts/audit-seo.mjs";

const raw = await readCatalog();
const provincias = raw.provincias.map(normalizarProvincia);
const actividades = raw.actividades.map(normalizarActividad);
const allMetadata = [
  ...STATIC_PAGES.map(page => staticPageMetadata(page.path)),
  ...provincias.map(provinciaMetadata), ...actividades.map(actividadMetadata),
];

test("el origen oficial no depende del host de Preview ni de variables antiguas", () => {
  assert.equal(SITE_URL, "https://www.argentinauniversosur.com");
  assert.equal(canonicalUrl("/"), SITE_URL + "/");
  assert.equal(canonicalUrl("/actividades/?provincia=catarmaca#mapa"), SITE_URL + "/actividades");
  assert.throws(() => canonicalUrl("https://preview.vercel.app/"), /inválida/);
  assert.throws(() => canonicalUrl("//otro-dominio.com/"), /inválida/);
  assert.throws(() => canonicalUrl("/\\otro-dominio.com/"), /inválido/);
});

test("las 106 páginas tienen metadata única, completa y coherente con Open Graph", () => {
  assert.equal(allMetadata.length, 106);
  for (const metadata of allMetadata) {
    assert.ok(metadata.title.absolute.trim());
    assert.ok(metadata.description.length > 20 && metadata.description.length <= 160);
    assert.ok(metadata.alternates.canonical.startsWith(SITE_URL + "/"));
    assert.equal(metadata.openGraph.url, metadata.alternates.canonical);
    assert.equal(metadata.openGraph.title, metadata.title.absolute);
    assert.equal(metadata.openGraph.description, metadata.description);
    assert.ok(metadata.openGraph.images[0].url.startsWith(SITE_URL + "/img/"));
  }
  for (const get of [m => m.title.absolute, m => m.description, m => m.alternates.canonical]) {
    assert.equal(new Set(allMetadata.map(get)).size, allMetadata.length);
  }
});

test("una ubicación larga no elimina el título de la actividad ni introduce saltos", () => {
  const activity = actividades.find(a => a.actividadSlug === "vivir-la-magia-del-teatro-colon");
  const metadata = actividadMetadata({ ...activity, localizacion: "Una ubicación muy larga ".repeat(20) });
  assert.ok(metadata.title.absolute.startsWith(activity.actividad));
  assert.doesNotMatch(metadata.description, /[\r\n]/);
});

test("Catamarca usa el slug correcto en enlaces y conserva el filtro legado", () => {
  assert.equal(ROUTES.provincia("catarmaca"), "/provincias/catamarca");
  assert.equal(ROUTES.actividadesPorProvincia("catarmaca"), "/actividades?provincia=catamarca");
  assert.equal(provincias.filter(p => p.slug === "catamarca").length, 1);
  assert.equal(actividades.filter(a => a.slug === "catamarca").length, 3);
});

test("sitemap solo incluye URLs canónicas, sin duplicados, filtros ni lastModified ficticio", () => {
  const rows = createSitemap(provincias, actividades);
  assert.equal(rows.length, 106);
  assert.equal(new Set(rows.map(row => row.url)).size, rows.length);
  assert.ok(rows.some(row => row.url === SITE_URL + "/provincias/catamarca"));
  for (const row of rows) {
    assert.ok(row.url.startsWith(SITE_URL + "/"));
    assert.doesNotMatch(row.url, /catarmaca|\?|#/);
    assert.equal(Object.hasOwn(row, "lastModified"), false);
  }
  assert.deepEqual(rows, createSitemap(provincias, actividades));
});

test("robots permite recursos en producción y bloquea el rastreo del Preview", () => {
  const production = createRobots();
  assert.equal(production.sitemap, SITE_URL + "/sitemap.xml");
  assert.equal(production.rules.allow, "/");
  assert.ok(!production.rules.disallow.includes("/_next/"));
  assert.equal(createRobots(true).rules.disallow, "/");
  assert.equal(createRobots(true).sitemap, undefined);
});

test("los redirects de Next son permanentes, unidireccionales y no capturan Preview", async () => {
  const rules = await nextConfig.redirects();
  const catamarca = rules.filter(rule => rule.source.includes("catarmaca"));
  assert.deepEqual(catamarca, [{ source: "/provincias/catarmaca", destination: "/provincias/catamarca", permanent: true }]);
  assert.equal(rules.some(rule => rule.source === "/provincias/catamarca"), false);
  for (const rule of rules.filter(rule => rule.has)) {
    assert.ok(["argentinauniversosur.com", "argentina-universosur.vercel.app"].includes(rule.has[0].value));
    assert.equal(rule.destination, SITE_URL + "/:path*");
    assert.equal(rule.permanent, true);
  }
});

test("Preview añade noindex al header y producción no lo añade", async () => {
  const previous = process.env.VERCEL_ENV;
  try {
    process.env.VERCEL_ENV = "preview";
    assert.match((await nextConfig.headers())[0].headers[0].value, /noindex/);
    process.env.VERCEL_ENV = "production";
    assert.deepEqual(await nextConfig.headers(), []);
  } finally {
    if (previous === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = previous;
  }
});

const html = '<html><head><title>Viajar &amp; descubrir\nArgentina</title><meta name="description" content="Una descripción única"/><link rel="canonical" href="https://www.argentinauniversosur.com/"/><meta property="og:url" content="https://www.argentinauniversosur.com/"/><meta property="og:title" content="Viajar &amp; descubrir Argentina"/><meta property="og:description" content="Una descripción única"/><meta property="og:image" content="https://www.argentinauniversosur.com/img/home/1.jpg"/><meta name="robots" content="index, follow"/></head></html>';

test("el auditor detecta metadata ausente, duplicada, canonicals erróneos y políticas robots", () => {
  const row = { path: "/", status: 200, ...readMetadata(html) };
  assert.deepEqual(auditMetadata([row]), []);
  const bad = { ...row, path: "/otra", title: [], canonical: ["https://preview.vercel.app/"] };
  const errors = auditMetadata([row, bad]).join("\n");
  assert.match(errors, /title ausente/);
  assert.match(errors, /canonical\/OG URL incorrectos/);
  assert.match(errors, /description duplicado/);
  assert.match(auditMetadata([{ ...row, canonical: [row.canonical[0], row.canonical[0]] }]).join(), /repetido/);
  assert.match(auditMetadata([{ ...row, robots: ["noindex"] }]).join(), /robots incorrecta/);
});

test("el auditor rechaza sitemap y robots que regresan al comportamiento anterior", () => {
  assert.deepEqual(auditSitemap(`<urlset><url><loc>${SITE_URL}/</loc></url></urlset>`, [SITE_URL + "/"]), []);
  assert.match(auditSitemap('<urlset><url><loc>https://viejo.example/</loc><lastmod>2026-10-23</lastmod></url></urlset>', [SITE_URL + "/"]).join(), /lastmod/);
  assert.match(auditRobots('Allow: /\nDisallow: /_next/\nSitemap: https://argentina-universo-sur.vercel.app/sitemap.xml').join(), /renderizado/);
  assert.deepEqual(auditRobots(`User-Agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml`), []);
});
