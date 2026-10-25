import { approvedTripUrls } from "../editorial/public-urls.mjs";
import { assertPublicArtifact, readEditorialTrips } from "./editorial-security.mjs";
import { readFile, stat, readdir, mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import {
  readMetadata,
  auditMetadata,
  auditRobots,
  auditSitemap,
} from "../audit-seo.mjs";
import { readCatalog } from "../validate-data.mjs";
import { normalizarProvincia, normalizarActividad } from "../../lib/catalog.ts";
import { createSitemap } from "../../lib/seo.ts";
const mode = process.argv[2] || "preview",
  base = resolve(".artifacts/pages/" + mode),
  preview = mode === "preview";
const editorialSecurity = await assertPublicArtifact(base, await readEditorialTrips(resolve(".")));
await mkdir(".artifacts/pages/reports", {recursive: true});
await writeFile(".artifacts/pages/reports/editorial-security-" + mode + ".json", JSON.stringify(editorialSecurity, null, 2) + "\n");
const catalog = await readCatalog();
const urls = [...createSitemap(
  catalog.provincias.map(normalizarProvincia),
  catalog.actividades.map(normalizarActividad),
).map((r) => r.url), ...await approvedTripUrls(resolve("."))];
const records = [];
for (const url of urls) {
  const path = new URL(url).pathname;
  const html = await readFile(
    join(base, path === "/" ? "index.html" : path.slice(1) + ".html"),
    "utf8",
  );
  records.push({ path, status: 200, ...readMetadata(html) });
}
const errors = auditMetadata(records, preview);
errors.push(
  ...auditSitemap(await readFile(join(base, "sitemap.xml"), "utf8"), urls),
  ...auditRobots(await readFile(join(base, "robots.txt"), "utf8"), preview),
);
const redirects = new Map(
  (await readFile(join(base, "_redirects"), "utf8"))
    .trim()
    .split("\n")
    .map((l) => l.split(/\s+/))
    .map(([from, to]) => [from, to]),
);
const resources = new Set();
async function walk(dir) {
  for (const d of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, d.name);
    if (d.isDirectory()) await walk(p);
    else if (d.name.endsWith(".html")) {
      const text = (await readFile(p, "utf8")).replace(
        /<script\b[^>]*>[\s\S]*?<\/script>/gi,
        "",
      );
      for (const m of text.matchAll(
        /(?:src|href)="(\/[^"#?]*)(?:[?#][^"]*)?"/g,
      ))
        if (/^\/(media|img|_next|pdf)\//.test(m[1]))
          resources.add(decodeURIComponent(m[1]));
    }
  }
}
await walk(base);
for (let resource of resources) {
  const seen = new Set();
  while (redirects.has(resource)) {
    if (seen.has(resource)) {
      errors.push("Redirect loop: " + resource);
      break;
    }
    seen.add(resource);
    resource = redirects.get(resource);
  }
  try {
    if (!(await stat(join(base, resource))).isFile())
      errors.push("Resource is not a file: " + resource);
  } catch {
    errors.push("Missing resource: " + resource);
  }
}
const report = {
  mode,
  pages: records.length,
  resources: resources.size,
  errors,
  canonicalUrls: records.map((r) => ({ path: r.path, canonical: r.canonical })),
  notTested: [
    "Remote Cloudflare host rules/TLS",
    "Encoded query parity in Rules engine",
    "External PDF availability; originals verified by validate:pages",
  ],
};
await mkdir(".artifacts/pages/reports", { recursive: true });
await writeFile(
  ".artifacts/pages/reports/seo-" + mode + ".json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(
  `Static ${mode}: ${records.length} canonical pages, ${resources.size} media/script resources, ${errors.length} errors.`,
);
if (errors.length) {
  console.error(errors);
  process.exitCode = 1;
}
