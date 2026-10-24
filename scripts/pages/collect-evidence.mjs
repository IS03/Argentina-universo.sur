import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
const target = new URL("../../docs/pr11/evidence/", import.meta.url),
  reports = new URL("../../.artifacts/pages/reports/", import.meta.url);
await mkdir(target, { recursive: true });
for (const name of [
  "build-preview.json",
  "editorial-security-preview.json",
  "editorial-security-production-audit.json",
  "editorial-security-consent-test.json",
  "build-production-audit.json",
  "build-consent-test.json",
  "seo-preview.json",
  "seo-production-audit.json",
  "performance.json",
  "visual-quality.json",
])
  await writeFile(
    new URL(name, target),
    await readFile(new URL(name, reports)),
  );
const browser = JSON.parse(
  await readFile(new URL("browser.json", reports), "utf8"),
);
const cases = [];
function walk(suites) {
  for (const s of suites) {
    for (const spec of s.specs || [])
      for (const t of spec.tests || [])
        cases.push({
          title: spec.title,
          project: t.projectName,
          status: t.status,
          results: t.results.map((r) => ({
            status: r.status,
            error: r.error?.message,
          })),
        });
    walk(s.suites || []);
  }
}
walk(browser.suites);
await writeFile(
  new URL("browser-summary.json", target),
  JSON.stringify({ stats: browser.stats, cases }, null, 2) + "\n",
);
const inventory = JSON.parse(
  await readFile(
    new URL("../../docs/supabase/media-inventory.json", import.meta.url),
    "utf8",
  ),
);
const originals = inventory.files.filter((f) =>
  ["tourism-images", "tourism-pdf"].includes(f.category),
);
const changed = [];
for (const f of originals)
  if (
    createHash("sha256")
      .update(
        await readFile(new URL("../../" + f.originalPath, import.meta.url)),
      )
      .digest("hex") !== f.sha256
  )
    changed.push(f.originalPath);
await writeFile(
  new URL("original-integrity.json", target),
  JSON.stringify(
    {
      files: originals.length,
      imagesCategoryFiles: originals.filter(
        (f) => f.category === "tourism-images",
      ).length,
      pdfs: originals.filter((f) => f.category === "tourism-pdf").length,
      changed,
    },
    null,
    2,
  ) + "\n",
);
console.log("Local evidence copied; original hash mismatches:", changed.length);
if (changed.length) process.exitCode = 1;
