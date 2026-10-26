import { approvedDestinationUrls, readPublication } from "./editorial/publication.mjs";
import { approvedTripUrls } from "./editorial/public-urls.mjs";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { get as httpGet } from "node:http";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readCatalog, projectRoot } from "./validate-data.mjs";
import { normalizarProvincia, normalizarActividad } from "../lib/catalog.ts";
import { SITE_URL, createSitemap } from "../lib/seo.ts";

export function decodeHtml(value) {
  return value.replace(/&(#x[0-9a-f]+|#\d+|amp|quot|apos|lt|gt|nbsp);/gi, (entity, code) => {
    if (code[0] === "#") return String.fromCodePoint(parseInt(code.slice(code[1].toLowerCase() === "x" ? 2 : 1), code[1].toLowerCase() === "x" ? 16 : 10));
    return { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " " }[code.toLowerCase()] ?? entity;
  });
}

export function readMetadata(html) {
  // Leer HTML real, sin ejecutar scripts ni confundir la serialización RSC con etiquetas.
  const document = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  const values = (tag, predicate, attribute) => [...document.matchAll(new RegExp(`<${tag}\\b[^>]*>`, "gi"))].flatMap(([node]) => {
    const attrs = Object.fromEntries([...node.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)].map(m => [m[1].toLowerCase(), decodeHtml(m[2] ?? m[3])]));
    return predicate(attrs) ? [attrs[attribute] ?? ""] : [];
  });
  const meta = (key, attribute = "name") => values("meta", a => a[attribute] === key, "content");
  return {
    title: [...document.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)].map(m => decodeHtml(m[1]).replace(/\s+/g, " ").trim()),
    description: meta("description"),
    canonical: values("link", a => a.rel === "canonical", "href"),
    ogUrl: meta("og:url", "property"), ogTitle: meta("og:title", "property"),
    ogDescription: meta("og:description", "property"), ogImages: meta("og:image", "property"),
    robots: meta("robots"),
  };
}

export function auditMetadata(records, preview = false, destinationImages = new Map()) {
  const errors = [];
  for (const row of records) {
    const label = row.path;
    if (row.status !== 200) errors.push(`${label}: HTTP ${row.status}`);
    for (const key of ["title", "description", "canonical", "ogUrl", "ogTitle", "ogDescription"]) {
      if (row[key].length !== 1 || !row[key][0].trim()) errors.push(`${label}: ${key} ausente, vacío o repetido`);
    }
    const expected = SITE_URL + (row.path === "/" ? "/" : row.path);
    // Next.js omite la barra final en el origen raíz; ambas representaciones son la misma URL.
    const matches = value => {
      try { return new URL(value).href === expected; } catch { return false; }
    };
    if (!matches(row.canonical[0]) || !matches(row.ogUrl[0])) errors.push(`${label}: canonical/OG URL incorrectos`);
    if (row.ogTitle[0] !== row.title[0] || row.ogDescription[0] !== row.description[0]) errors.push(`${label}: OG no coincide con title/description`);
    if (!row.ogImages.length || row.ogImages.some(url => destinationImages.has(row.path) ? url !== destinationImages.get(row.path) : !url.startsWith(SITE_URL + "/img/"))) errors.push(`${label}: OG image ausente o con origen incorrecto`);
    if (!row.robots.length || row.robots.some(value => /\bnoindex\b/.test(value)) !== preview) errors.push(`${label}: política robots incorrecta`);
    if (row.title[0]?.startsWith("...") || /[\r\n]/.test(row.description[0])) errors.push(`${label}: metadata mal formada`);
  }
  for (const key of ["title", "description", "canonical"]) {
    const seen = new Map();
    for (const row of records) {
      const value = row[key][0];
      if (!value) continue;
      if (seen.has(value)) errors.push(`${key} duplicado: ${seen.get(value)} y ${row.path}`);
      else seen.set(value, row.path);
    }
  }
  return errors;
}

export function auditSitemap(xml, expectedUrls) {
  const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => decodeHtml(m[1]));
  const errors = [];
  if (urls.length !== expectedUrls.length || new Set(urls).size !== urls.length || expectedUrls.some(url => !urls.includes(url))) errors.push("Sitemap: faltan URLs canónicas, hay duplicados o URLs inesperadas");
  if (/<lastmod>/.test(xml)) errors.push("Sitemap: lastmod sin fechas editoriales verificables");
  return errors;
}

export function auditRobots(text, preview = false) {
  const errors = [];
  if (preview) {
    if (!/^Disallow: \/\s*$/m.test(text)) errors.push("Robots Preview: debe bloquear el rastreo");
  } else {
    if (!/^Allow: \/\s*$/m.test(text) || /^Disallow: \/\s*$/m.test(text)) errors.push("Robots: producción debe poder rastrearse");
    if (!text.includes(`Sitemap: ${SITE_URL}/sitemap.xml`)) errors.push("Robots: sitemap oficial ausente");
    if (/Disallow: \/_next\//.test(text)) errors.push("Robots: bloquea recursos de renderizado");
  }
  if (/argentina-universo-sur\.vercel\.app/.test(text)) errors.push("Robots: dominio antiguo");
  return errors;
}

async function localServer() {
  const reservation = createServer();
  await new Promise(resolve => reservation.listen(0, "127.0.0.1", resolve));
  const port = reservation.address().port;
  await new Promise(resolve => reservation.close(resolve));
  const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)], {
    cwd: projectRoot, stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
  });
  let output = "";
  child.stdout.on("data", data => { output += data; });
  child.stderr.on("data", data => { output += data; });
  const base = `http://127.0.0.1:${port}`;
  try {
    for (let i = 0; i < 100; i++) {
      if (child.exitCode !== null) throw new Error(output);
      try { const response = await fetch(base); if (response.ok) return { base, stop: () => child.kill("SIGTERM") }; } catch { /* servidor arrancando */ }
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    throw new Error(`No arrancó next start: ${output}`);
  } catch (error) { child.kill("SIGTERM"); throw error; }
}

export async function auditSite(base, preview = false) {
  const catalog = await readCatalog();
  const urls = [...createSitemap(catalog.provincias.map(normalizarProvincia), catalog.actividades.map(normalizarActividad)).map(row => row.url), ...await approvedTripUrls(projectRoot), ...await approvedDestinationUrls(projectRoot)];
  const paths = urls.map(url => new URL(url).pathname);
  const headers = { "user-agent": "Twitterbot" }; // metadata completa en HTML, incluso sin JavaScript.
  if (process.env.VERCEL_OIDC_TOKEN) headers["x-vercel-trusted-oidc-idp-token"] = process.env.VERCEL_OIDC_TOKEN;
  // El token solo se envía al origen exacto solicitado, nunca siguiendo redirecciones externas.
  const request = path => fetch(new URL(path, base), { headers, redirect: "manual", signal: AbortSignal.timeout(30_000) });
  const records = [];
  for (let i = 0; i < paths.length; i += 6) {
    await Promise.all(paths.slice(i, i + 6).map(async path => {
      const response = await request(path);
      records.push({ path, status: response.status, ...readMetadata(await response.text()) });
    }));
  }
  const destinationImages = new Map((await readPublication()).pages.map(p => ["/destinos/" + p.slug, SITE_URL + p.photos[0].foto.src]));
  const errors = auditMetadata(records, preview, destinationImages);
  const sitemap = await request("/sitemap.xml");
  if (!sitemap.ok) errors.push(`Sitemap: HTTP ${sitemap.status}`);
  errors.push(...auditSitemap(await sitemap.text(), urls));
  const robots = await request("/robots.txt");
  if (!robots.ok) errors.push(`Robots: HTTP ${robots.status}`);
  errors.push(...auditRobots(await robots.text(), preview));
  const redirect = await request("/provincias/catarmaca?origen=legado");
  const destination = redirect.headers.get("location");
  if (redirect.status !== 308 || !destination || new URL(destination, base).pathname !== "/provincias/catamarca" || new URL(destination, base).search !== "?origen=legado") errors.push("Catamarca: redirección permanente incorrecta o pierde query string");
  const canonical = await request("/provincias/catamarca");
  if (canonical.status !== 200 || canonical.headers.get("location")) errors.push("Catamarca: destino no responde 200 o vuelve a redirigir");
  const filtered = await request("/actividades?provincia=catarmaca");
  if (readMetadata(await filtered.text()).canonical[0] !== SITE_URL + "/actividades") errors.push("Listado filtrado: canonical incorrecto");
  for (const path of ["/ruta-inexistente-pr02", "/provincias/no-existe", "/actividades/no-existe"]) {
    const response = await request(path);
    const metadata = readMetadata(await response.text());
    if (response.status !== 404 || !metadata.robots.some(value => /\bnoindex\b/.test(value)) || metadata.canonical.length) errors.push(`${path}: 404 debe responder noindex sin canonical heredado`);
  }
  if (preview && !/\bnoindex\b/.test(canonical.headers.get("x-robots-tag") ?? "")) errors.push("Preview: falta X-Robots-Tag noindex");
  if (["127.0.0.1", "localhost"].includes(new URL(base).hostname)) {
    for (const host of ["argentinauniversosur.com", "argentina-universosur.vercel.app"]) {
      // fetch puede reemplazar Host; node:http permite comprobar el encabezado real.
      const response = await new Promise((resolve, reject) => {
        const request = httpGet(new URL("/escapadas?origen=legado", base), { headers: { Host: host } }, response => {
          response.resume();
          resolve({ status: response.statusCode, location: response.headers.location });
        });
        request.on("error", reject);
        request.setTimeout(10_000, () => request.destroy(new Error("Timeout del redirect de host")));
      });
      if (response.status !== 308 || response.location !== SITE_URL + "/escapadas?origen=legado") errors.push(`${host}: redirect al origen oficial incorrecto`);
    }
  }
  return { base, preview, pages: records.length, errors, records };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = process.env.SEO_AUDIT_BASE_URL ? null : await localServer();
  try {
    const result = await auditSite(process.env.SEO_AUDIT_BASE_URL || server.base, process.env.SEO_AUDIT_PREVIEW === "1");
    if (process.env.SEO_AUDIT_REPORT) await writeFile(process.env.SEO_AUDIT_REPORT, JSON.stringify(result, null, 2));
    console.log(`SEO: ${result.pages} páginas auditadas; ${result.errors.length} errores. Preview: ${result.preview}.`);
    if (result.errors.length) { console.error(result.errors.join("\n")); process.exitCode = 1; }
  } finally { server?.stop(); }
}
