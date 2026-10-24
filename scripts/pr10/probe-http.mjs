// Raw local HTTP probes: do not mistake a prerendered Suspense response for runtime streaming.
import http from "node:http";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { scratch } from "./prepare.mjs";
const samples = [];
for (let run = 1; run <= 3; run++) {
  const began = performance.now(),
    chunks = [];
  let html = "",
    headersAtMs;
  await new Promise((resolve, reject) => {
    http
      .get(
        "http://127.0.0.1:4304/prototipo-pr10/stream",
        { headers: { "accept-encoding": "identity" } },
        (response) => {
          headersAtMs = performance.now() - began;
          response.on("data", (value) => {
            html += value;
            chunks.push({
              atMs: performance.now() - began,
              bytes: value.length,
              hasFallback: html.includes("Esperando RSC"),
              hasCompletedMarkup: />Contenido RSC completado<\//.test(html),
            });
          });
          response.on("end", resolve);
        },
      )
      .on("error", reject);
  });
  samples.push({ run, headersAtMs, chunks });
}
const filtering = [];
for (const [target, port] of Object.entries({
  baseline: 4300,
  static: 4301,
  worker: 4304,
})) {
  const html = await (
    await fetch(`http://127.0.0.1:${port}/actividades?provincia=santa_fe`)
  ).text();
  filtering.push({
    target,
    query: "provincia=santa_fe",
    activityLinksInInitialHtml: (
      html
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
        .match(/href="\/actividades\//g) || []
    ).length,
  });
}
const report = {
  scope:
    "Local workerd, 200ms async RSC with connection(); raw node:http. No billed CPU or remote edge claim.",
  streaming: samples,
  filtering,
};
await writeFile(
  join(scratch, "reports/http-probes.json"),
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify(report, null, 2));
