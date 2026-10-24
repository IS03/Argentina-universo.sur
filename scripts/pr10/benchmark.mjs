// Lab comparison only. Local ports do not measure Cloudflare CDN or billed Workers CPU.
import { chromium, devices } from "@playwright/test";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { scratch } from "./prepare.mjs";
const targets = {
  nextLocal: "http://127.0.0.1:4300",
  staticLocal: "http://127.0.0.1:4301",
  staticExternalImages: "http://127.0.0.1:4305",
  workerLocal: "http://127.0.0.1:4304",
};
const paths = [
  "/",
  "/provincias/santa_fe",
  "/actividades/vivir-la-magia-del-teatro-colon",
];
const browser = await chromium.launch({ channel: "chrome" });
const samples = [];
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
  "base64",
);
async function measure(name, base, path, profile, run) {
  const mobile = profile === "mobile";
  const context = await browser.newContext({
    ...(mobile ? devices["Pixel 7"] : devices["Desktop Chrome"]),
    reducedMotion: "reduce",
  });
  await context.route(/^https:\/\/tile\.openstreetmap\.org\//, (r) =>
    r.fulfill({ contentType: "image/png", body: png }),
  );
  await context.route(
    /googletagmanager\.com|google-analytics\.com|analytics\.google\.com|doubleclick\.net|\/_vercel\//,
    (r) => r.abort(),
  );
  const page = await context.newPage(),
    client = await context.newCDPSession(page);
  let bytes = 0;
  const requests = [],
    errors = [];
  await client.send("Network.enable");
  await client.send("Network.setCacheDisabled", { cacheDisabled: true });
  await client.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: mobile ? 150 : 40,
    downloadThroughput: mobile ? 200000 : 2500000,
    uploadThroughput: mobile ? 93750 : 1250000,
  });
  await client.send("Emulation.setCPUThrottlingRate", { rate: mobile ? 4 : 1 });
  client.on("Network.loadingFinished", (e) => {
    bytes += e.encodedDataLength;
  });
  client.on("Network.requestWillBeSent", (e) => {
    if (
      /^https?:/.test(e.request.url) &&
      !/_vercel|googletag|google-analytics/.test(e.request.url)
    )
      requests.push(e.request.url);
  });
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.addInitScript(() => {
    window.__pr10 = { lcp: 0, cls: 0, lcpUrl: null };
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        window.__pr10.lcp = e.startTime;
        window.__pr10.lcpUrl = e.url || null;
      }
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((list) => {
      for (const e of list.getEntries())
        if (!e.hadRecentInput) window.__pr10.cls += e.value;
    }).observe({ type: "layout-shift", buffered: true });
  });
  const began = Date.now();
  try {
    const response = await page.goto(base + path, {
      waitUntil: "load",
      timeout: 90000,
    });
    await page.waitForTimeout(1800);
    const metrics = await page.evaluate(() => ({
      ...window.__pr10,
      ttfb: performance.getEntriesByType("navigation")[0]?.responseStart,
      domContentLoaded:
        performance.getEntriesByType("navigation")[0]?.domContentLoadedEventEnd,
    }));
    const record = {
      target: name,
      path,
      profile,
      run,
      status: response.status(),
      ...metrics,
      encodedTransferredBytes: bytes,
      requests: requests.length,
      imageOptimizerRequests: requests.filter((u) => u.includes("/_next/image"))
        .length,
      externalImageRequests: requests.filter((u) =>
        u.startsWith("http://127.0.0.1:4302"),
      ).length,
      errors,
      elapsedMs: Date.now() - began,
    };
    samples.push(record);
    console.log(JSON.stringify(record));
    if (run === 1)
      await page.screenshot({
        path: join(
          scratch,
          "reports",
          `${name}-${profile}-${path === "/" ? "home" : path.includes("provincias") ? "province" : "activity"}.png`,
        ),
      });
  } catch (e) {
    samples.push({ target: name, path, profile, run, error: e.message });
    console.log("Measurement failed:", name, profile, path, e.message);
  } finally {
    await context.close();
  }
}
await mkdir(join(scratch, "reports"), { recursive: true });
try {
  for (const profile of ["mobile", "desktop"])
    for (const path of paths)
      for (let run = 1; run <= 3; run++)
        for (const [name, base] of Object.entries(targets))
          await measure(name, base, path, profile, run);
  if (process.argv.includes("--live-vercel"))
    for (let run = 1; run <= 3; run++)
      await measure(
        "vercelProductionObserved",
        "https://www.argentinauniversosur.com",
        "/",
        "mobile",
        run,
      );
} finally {
  await browser.close();
}
const median = (values) => {
  const v = values.filter(Number.isFinite).sort((a, b) => a - b);
  return v.length ? v[Math.floor(v.length / 2)] : null;
};
const groups = Map.groupBy(samples, (s) =>
  [s.target, s.path, s.profile].join("|"),
);
const summary = [...groups.values()].map((rows) => ({
  target: rows[0].target,
  path: rows[0].path,
  profile: rows[0].profile,
  runs: rows.length,
  failed: rows.filter((r) => r.error || r.errors?.length).length,
  ...Object.fromEntries(
    [
      "lcp",
      "cls",
      "ttfb",
      "encodedTransferredBytes",
      "requests",
      "imageOptimizerRequests",
      "externalImageRequests",
    ].map((k) => [k, median(rows.map((r) => r[k]))]),
  ),
}));
const report = {
  measuredAt: new Date().toISOString(),
  method: {
    repetitions: 3,
    network: {
      mobile: {
        latencyMs: 150,
        downloadBytesPerSecond: 200000,
        browserCpuThrottle: 4,
      },
      desktop: {
        latencyMs: 40,
        downloadBytesPerSecond: 2500000,
        browserCpuThrottle: 1,
      },
    },
    cache: "cold browser contexts; servers may be warm",
    motion: "reduced to stabilize hero/LCP",
    tiles: "local 1px mock in every scenario",
    analytics: "network blocked in every scenario; no consent granted",
    scope:
      "Local lab, not remote Cloudflare performance, real-user CWV or billed Worker CPU. Live Vercel is a separate geographic observation.",
    clsWindow: "initial navigation through load + 1.8 seconds",
  },
  summary,
  samples,
};
await writeFile(
  join(scratch, "reports/performance.json"),
  JSON.stringify(report, null, 2) + "\n",
);
