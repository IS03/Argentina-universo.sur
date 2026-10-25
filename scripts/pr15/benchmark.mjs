// Medición de laboratorio de PR15 con la metodología de scripts/pages/benchmark.mjs (PR11):
// contextos fríos, red y CPU emuladas por CDP, movimiento reducido, teselas simuladas y Google bloqueado.
// No es CrUX, Lighthouse ni medición del CDN de Cloudflare.
// Uso: node scripts/pr15/benchmark.mjs <etiqueta> <origen> [repeticiones]
// RUTAS="/a,/b" reemplaza la lista de rutas medidas.
import { chromium, devices } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const [label, origin, runsArg] = process.argv.slice(2);
if (!label || !origin) throw Error("Uso: benchmark.mjs <etiqueta> <origen> [repeticiones]");
const runs = Number(runsArg || 3);
const paths = process.env.RUTAS ? process.env.RUTAS.split(",") : [
  "/",
  "/provincias",
  "/provincias/santa_fe",
  "/actividades",
  "/actividades/vivir-la-magia-del-teatro-colon",
  "/escapadas",
];
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==", "base64");
const browser = await chromium.launch({ channel: "chrome" });
const samples = [];

async function measure(path, profile, run) {
  const mobile = profile === "movil";
  const context = await browser.newContext({ ...(mobile ? devices["Pixel 7"] : devices["Desktop Chrome"]), reducedMotion: "reduce" });
  await context.route(/^https:\/\/tile\.openstreetmap\.org\//, r => r.fulfill({ contentType: "image/png", body: png }));
  await context.route(/googletagmanager\.com|google-analytics\.com|analytics\.google\.com|doubleclick\.net|\/_vercel\//, r => r.abort());
  const page = await context.newPage();
  const client = await context.newCDPSession(page);
  let bytes = 0, requests = 0, jsBytes = 0;
  const errors = [];
  await client.send("Network.enable");
  await client.send("Network.setCacheDisabled", { cacheDisabled: true });
  await client.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: mobile ? 150 : 40,
    downloadThroughput: mobile ? 200000 : 2500000,
    uploadThroughput: mobile ? 93750 : 1250000,
  });
  await client.send("Emulation.setCPUThrottlingRate", { rate: mobile ? 4 : 1 });
  const types = new Map();
  client.on("Network.responseReceived", e => types.set(e.requestId, e.type));
  client.on("Network.loadingFinished", e => {
    bytes += e.encodedDataLength;
    if (types.get(e.requestId) === "Script") jsBytes += e.encodedDataLength;
  });
  client.on("Network.requestWillBeSent", e => { if (/^https?:/.test(e.request.url)) requests++; });
  page.on("pageerror", e => errors.push(String(e)));
  await page.addInitScript(() => {
    window.__pr15 = { lcp: 0, cls: 0, lcpElement: null };
    new PerformanceObserver(list => {
      for (const e of list.getEntries()) {
        window.__pr15.lcp = e.startTime;
        window.__pr15.lcpElement = e.element ? e.element.tagName + (e.url ? " " + e.url.split("/").pop() : "") : null;
      }
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver(list => {
      for (const e of list.getEntries()) if (!e.hadRecentInput) window.__pr15.cls += e.value;
    }).observe({ type: "layout-shift", buffered: true });
  });
  try {
    const response = await page.goto(origin + path, { waitUntil: "load", timeout: 120_000 });
    await page.waitForTimeout(1800);
    const metrics = await page.evaluate(() => ({
      ...window.__pr15,
      fcp: performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? null,
      domContentLoaded: performance.getEntriesByType("navigation")[0]?.domContentLoadedEventEnd,
      load: performance.getEntriesByType("navigation")[0]?.loadEventEnd,
    }));
    const record = { path, profile, run, status: response.status(), ...metrics, encodedTransferredBytes: bytes, jsBytes, requests, errors };
    samples.push(record);
    console.log(JSON.stringify(record));
  } catch (e) {
    samples.push({ path, profile, run, error: e.message });
    console.log("Falló:", profile, path, e.message);
  } finally {
    await context.close();
  }
}

try {
  for (const profile of ["movil", "escritorio"])
    for (const path of paths)
      for (let run = 1; run <= runs; run++) await measure(path, profile, run);
} finally {
  await browser.close();
}
const median = values => {
  const v = values.filter(Number.isFinite).sort((a, b) => a - b);
  return v.length ? v[Math.floor(v.length / 2)] : null;
};
const summary = [...Map.groupBy(samples, s => s.profile + "|" + s.path).values()].map(rows => ({
  path: rows[0].path,
  profile: rows[0].profile,
  runs: rows.length,
  failed: rows.filter(r => r.error || r.errors?.length).length,
  lcpElement: rows.find(r => r.lcpElement)?.lcpElement ?? null,
  ...Object.fromEntries(["fcp", "lcp", "cls", "load", "encodedTransferredBytes", "jsBytes", "requests"].map(k => [k, median(rows.map(r => r[k]))])),
}));
const dir = resolve(".artifacts/pr15");
await mkdir(dir, { recursive: true });
await writeFile(join(dir, `perf-${label}.json`), JSON.stringify({
  label, origin, measuredAt: new Date().toISOString(),
  method: { runs, mobile: "Pixel 7, 1,6 Mbps, 150 ms, CPU x4", desktop: "20 Mbps, 40 ms, CPU x1", cache: "contexto frío", motion: "reducido", clsWindow: "load + 1,8 s" },
  summary, samples,
}, null, 2) + "\n");
console.table(summary.map(s => ({ perfil: s.profile, ruta: s.path, kb: Math.round(s.encodedTransferredBytes / 1024), js: Math.round(s.jsBytes / 1024), fcp: Math.round(s.fcp), lcp: Math.round(s.lcp), cls: s.cls?.toFixed(4), req: s.requests, fallos: s.failed })));
