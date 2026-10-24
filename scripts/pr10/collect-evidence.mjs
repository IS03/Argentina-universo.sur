// Copies compact, non-secret local measurements into the reviewable report; no media binaries.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { root, scratch } from "./prepare.mjs";
import { estimateTraffic } from "./traffic.mjs";
const target = join(root, "docs/pr10/evidence");
await mkdir(target, { recursive: true });
const read = async (path) => JSON.parse(await readFile(path, "utf8"));
const save = async (name, value) =>
  writeFile(join(target, name), JSON.stringify(value, null, 2) + "\n");
const inventory = await read(join(root, "docs/supabase/media-inventory.json"));
const photos = inventory.files.filter((f) => f.category === "tourism-images");
const formats = Object.entries(Object.groupBy(photos, (p) => p.mime)).map(
  ([mime, rows]) => ({
    mime,
    files: rows.length,
    bytes: rows.reduce((n, r) => n + r.bytes, 0),
  }),
);
const manifest = await read(join(scratch, "images/manifest.json"));
const unique = [
  ...new Map(Object.values(manifest.assets).map((v) => [v.sha256, v])).values(),
];
const selectedWebpBytes = unique.reduce(
  (n, v) => n + v.variants.filter((r) => r.format === "webp").at(-1).bytes,
  0,
);
const mismatches = [];
for (const file of photos) {
  const hash = createHash("sha256")
    .update(await readFile(join(root, file.originalPath)))
    .digest("hex");
  if (hash !== file.sha256) mismatches.push(file.originalPath);
}
await save("media-summary.json", {
  source:
    "PR9 versioned inventory, freshly SHA-256 verified against all 306 files classified tourism-images (304 images plus README and shortcut)",
  originalsChanged: mismatches,
  formats,
  originalPhotoBytes: photos.reduce((n, f) => n + f.bytes, 0),
  duplicateGroups: inventory.duplicates,
  possibleUnreferenced: photos
    .filter((p) => p.possiblyUnreferenced)
    .map((p) => p.originalPath),
  referenceCaveat:
    "Static references cannot prove non-use or rights; do not delete by this list.",
  transformedFiles: manifest.assetCount,
  uniqueTransformedImages: manifest.uniqueImages,
  allVariantBytes: manifest.variantBytes,
  selectedLargestWebpBytes: selectedWebpBytes,
  untransformedBytes: photos
    .filter((p) => !manifest.assets[p.url])
    .reduce((n, f) => n + f.bytes, 0),
  samples: manifest.samples.map((url) => ({ url, ...manifest.assets[url] })),
  rights:
    "No photo license verified; local derivatives only, metadata and existing JSX alt retained.",
});
const pdfs = inventory.files.filter((f) => f.mime === "application/pdf");
const changedPdfs = [];
for (const file of pdfs)
  if (
    createHash("sha256")
      .update(await readFile(join(root, file.originalPath)))
      .digest("hex") !== file.sha256
  )
    changedPdfs.push(file.originalPath);
await save("pdf-integrity.json", {
  files: pdfs.length,
  totalBytes: pdfs.reduce((n, f) => n + f.bytes, 0),
  changedOriginals: changedPdfs,
});
const budget = [1000, 10000, 100000].map((v) => estimateTraffic(v));
let measured = [];
try {
  const report = await read(join(scratch, "reports/performance.json"));
  const rows = report.summary.filter(
    (r) => r.target === "staticLocal" && r.profile === "mobile",
  );
  if (rows.length === 3)
    measured = [1000, 10000, 100000].map((v) =>
      estimateTraffic(v, {
        bytesPerPage:
          rows.reduce((n, r) => n + r.encodedTransferredBytes, 0) / 3,
        requestsPerPage: rows.reduce((n, r) => n + r.requests, 0) / 3,
      }),
    );
} catch (e) {
  if (e.code !== "ENOENT") throw e;
}
await save("traffic-scenarios.json", {
  scope:
    "Planning only, 3 pages/visit, 30 days, peak 10x average; measured rows extrapolate equal mix of 3 cold mobile pages, not real traffic.",
  budget,
  measured,
});
for (const name of [
  "assets-static.json",
  "assets-worker.json",
  "seo-static.json",
  "seo-worker.json",
  "http-probes.json",
  "performance.json",
]) {
  try {
    await save(name, await read(join(scratch, "reports", name)));
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
  }
}
const browser = await read(join(scratch, "reports/browser.json"));
const cases = [];
function walk(suites, project) {
  for (const s of suites) {
    for (const spec of s.specs || [])
      for (const t of spec.tests || [])
        cases.push({
          title: spec.title,
          project: t.projectName || project,
          status: t.status,
          results: t.results.map((r) => ({
            status: r.status,
            error: r.error?.message?.replace(/\u001b\[[0-9;]*m/g, ""),
          })),
        });
    walk(s.suites || [], project);
  }
}
walk(browser.suites);
await save("browser-summary.json", {
  stats: browser.stats,
  cases,
  scope:
    "Complete prototype suite; known failures retained. Any isolated follow-up is separately reported.",
});
for (const toolchain of ["main", "vinext"]) {
  const report = await read(
    join(scratch, "reports", `audit-${toolchain}.json`),
  );
  await save(`dependency-audit-${toolchain}.json`, {
    counts: report.metadata?.vulnerabilities,
    packages: Object.entries(report.vulnerabilities || {}).map(([name, v]) => ({
      name,
      severity: v.severity,
      isDirect: v.isDirect,
      fixAvailable: v.fixAvailable,
      via: v.via.map((a) =>
        typeof a === "string"
          ? a
          : { title: a.title, url: a.url, severity: a.severity },
      ),
    })),
    scope:
      toolchain === "main"
        ? "Existing root lock unchanged"
        : "Isolated experimental lock only; not part of the production application",
  });
}
console.log(
  "Reviewable JSON saved. Missing optional performance report must be generated before final delivery.",
);
