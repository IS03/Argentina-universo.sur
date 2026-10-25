// Capturas comparativas y auditoría visual de PR15. Solo lectura: no envía formularios ni acepta cookies.
// Uso: node scripts/pr15/capture.mjs <etiqueta> <origen> [--pages-routes]
// RUTAS="nombre=/ruta,otra=/otra" reemplaza la lista de páginas capturadas.
//   --pages-routes usa /actividades/por-provincia/<slug> (export estático) en lugar de ?provincia=.
import { chromium, devices } from "@playwright/test";
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const [label, origin] = process.argv.slice(2);
if (!label || !origin) throw Error("Uso: capture.mjs <etiqueta> <origen> [--pages-routes]");
const pagesRoutes = process.argv.includes("--pages-routes");
const out = resolve(".artifacts/pr15/screens", label);
await mkdir(out, { recursive: true });

const filtered = pagesRoutes ? "/actividades/por-provincia/salta" : "/actividades?provincia=salta";
const routes = process.env.RUTAS ? process.env.RUTAS.split(",").map(r => r.split("=")) : [
  ["portada", "/"],
  ["provincias", "/provincias"],
  ["provincia", "/provincias/mendoza"],
  ["actividades", "/actividades"],
  ["actividades-filtro", filtered],
  ["actividad", "/actividades/vivir-la-magia-del-teatro-colon"],
  ["escapadas", "/escapadas"],
  ["seguridad", "/seguridad"],
];
const profiles = {
  escritorio: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
  movil: devices["Pixel 7"],
};
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==", "base64");

// Chrome repite tramos en capturas de más de 16.384 px de alto (límite de textura). Se captura por
// segmentos de la página completa y se unen con sharp.
async function capturaCompleta(page, path) {
  const { alto, ancho, dpr } = await page.evaluate(() => ({ alto: document.documentElement.scrollHeight, ancho: innerWidth, dpr: devicePixelRatio }));
  const tramo = Math.floor(8000 / dpr);
  const partes = [];
  for (let y = 0; y < alto; y += tramo) {
    const height = Math.min(tramo, alto - y);
    partes.push({ input: await page.screenshot({ fullPage: true, clip: { x: 0, y, width: ancho, height } }), top: Math.round(y * dpr), left: 0 });
  }
  await sharp({ create: { width: Math.round(ancho * dpr), height: Math.round(alto * dpr), channels: 3, background: "#ffffff" }, limitInputPixels: false })
    .composite(partes).png().toFile(path);
}

const browser = await chromium.launch({ channel: "chrome" });
const report = [];
try {
  for (const [profile, device] of Object.entries(profiles)) {
    const context = await browser.newContext({ ...device, reducedMotion: "reduce" });
    // Sin Google ni telemetría: las capturas no generan visitas medidas.
    await context.route(/googletagmanager\.com|google-analytics\.com|analytics\.google\.com|doubleclick\.net|\/_vercel\//, r => r.abort());
    await context.route(/^https:\/\/tile\.openstreetmap\.org\//, r => r.fulfill({ contentType: "image/png", body: png }));
    for (const [name, path] of routes) {
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", e => errors.push(String(e)));
      const response = await page.goto(origin + path, { waitUntil: "load", timeout: 90_000 });
      await page.waitForTimeout(1200);
      const facts = await page.evaluate(() => {
        const visible = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden"; };
        const targets = [...document.querySelectorAll("a[href], button, select, input")].filter(visible);
        const small = targets.filter(el => { const r = el.getBoundingClientRect(); return r.height < 24 || r.width < 24; });
        return {
          title: document.title,
          h1: [...document.querySelectorAll("h1")].map(h => h.textContent.trim()),
          headings: [...document.querySelectorAll("h1,h2,h3")].map(h => `${h.tagName}:${h.textContent.trim().slice(0, 60)}`),
          hasMain: Boolean(document.querySelector("main")),
          skipLink: Boolean(document.querySelector('a[href="#contenido"], a[href="#main"], a[href="#contenido-principal"]')),
          scrollWidth: document.documentElement.scrollWidth,
          viewportWidth: innerWidth,
          documentHeight: document.documentElement.scrollHeight,
          interactive: targets.length,
          smallTargets: small.length,
          smallTargetSamples: small.slice(0, 5).map(el => el.outerHTML.slice(0, 90)),
          imagesWithoutAlt: [...document.images].filter(i => !i.hasAttribute("alt")).length,
          fontFamilies: [...new Set([...document.querySelectorAll("h1,h2,p,a")].slice(0, 40).map(el => getComputedStyle(el).fontFamily.split(",")[0]))],
        };
      });
      await page.screenshot({ path: join(out, `${profile}-${name}.png`) });
      // Recorre la página para que las imágenes diferidas (loading=lazy) aparezcan en la captura completa.
      await page.evaluate(async () => {
        for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight / 2) {
          scrollTo(0, y);
          await new Promise(r => setTimeout(r, 120));
        }
        scrollTo(0, 0);
      });
      await page.waitForLoadState("networkidle").catch(() => {});
      await capturaCompleta(page, join(out, `${profile}-${name}-completa.png`));
      if (profile === "movil" && name === "portada") {
        const button = page.locator('button[aria-controls="menu-movil"]');
        if (await button.count()) {
          await button.click();
          await page.waitForTimeout(500);
          await page.screenshot({ path: join(out, `${profile}-menu.png`) });
        }
      }
      report.push({ profile, name, path, status: response?.status(), errors, ...facts });
      await page.close();
    }
    await context.close();
  }
} finally {
  await browser.close();
}
await writeFile(join(out, "audit.json"), JSON.stringify({ origin, capturedAt: new Date().toISOString(), report }, null, 2) + "\n");
console.log(JSON.stringify(report.map(r => ({ p: r.profile, n: r.name, s: r.status, overflow: r.scrollWidth > r.viewportWidth, small: r.smallTargets, h: Math.round(r.documentHeight), err: r.errors.length })), null, 0));
