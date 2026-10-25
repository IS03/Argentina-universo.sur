// Local build only. A future remote Preview requires the owner's verified account and authorization.
import {
  cp,
  mkdir,
  rm,
  readFile,
  writeFile,
  readdir,
  stat,
  symlink,
} from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync, spawn } from "node:child_process";
import { constants } from "node:fs";
import sharp from "sharp";
import { createHash } from "node:crypto";
import { copyTrackedInputs, readEditorialTrips, preparePublicTripInputs, assertPublicArtifact } from "./editorial-security.mjs";
import { imageWidths } from "../../lib/pages/image-policy.ts";
const root = fileURLToPath(new URL("../../", import.meta.url));
const base = join(root, ".artifacts/pages");
const source = join(base, "source");
if (
  process.argv
    .slice(2)
    .some((a) => !["--consent-test", "--production-audit"].includes(a))
)
  throw Error(
    "Only local Preview, --consent-test and --production-audit builds are supported",
  );
const mode = process.argv.includes("--consent-test")
  ? "consent-test"
  : process.argv.includes("--production-audit")
    ? "production-audit"
    : "preview";
const out = join(base, mode);
const slim = join(base, "slim-size-estimate");
// Failed builds must not leave a stale upload candidate or a stale passing report for this mode.
await rm(out, {recursive: true, force: true});
await rm(slim, {recursive: true, force: true});
const reports = join(base, "reports");
for (const name of [`build-${mode}.json`, `editorial-security-${mode}.json`])
  await rm(join(reports, name), {force: true});
await mkdir(reports, { recursive: true });
await rm(source, { recursive: true, force: true });
await mkdir(source, { recursive: true });
const files = execFileSync("git", ["ls-files", "-z"], {
  cwd: root,
  encoding: "utf8",
})
  .split("\0")
  .filter((p) =>
    /^(app\/|components\/|lib\/|content\/|public\/|package(-lock)?\.json$|tsconfig.json$|postcss.config.mjs$)/.test(
      p,
    ) && !/^public\/.*\.(?:xlsx?|csv|tsv)$/i.test(p),
  );
await copyTrackedInputs(root, source, files);
const editorialTrips = await readEditorialTrips(source);
await preparePublicTripInputs(source, editorialTrips);
await symlink(join(root, "node_modules"), join(source, "node_modules"), "dir");
const edit = async (p, fn) => {
  const previous = await readFile(join(source, p), "utf8");
  const next = fn(previous);
  if (next === previous)
    throw Error("Static adaptation needs review after source change: " + p);
  await writeFile(join(source, p), next);
};
const inv = JSON.parse(
  await readFile(join(root, "docs/supabase/media-inventory.json"), "utf8"),
);
const rasters = inv.files.filter(
  (f) =>
    f.category === "tourism-images" &&
    ["image/jpeg", "image/png"].includes(f.mime),
);
for (const file of rasters) {
  const actual = createHash("sha256")
    .update(await readFile(join(root, file.originalPath)))
    .digest("hex");
  if (actual !== file.sha256)
    throw Error(
      "Media inventory is stale; review the changed original before building: " +
        file.originalPath,
    );
}
await cp(
  join(source, "components/pages/ActivitiesExplorer.tsx"),
  join(source, "components/actividades/ActividadesExplorer.tsx"),
);
// Progressive enhancement of old query links. Zone Redirect Rules provide HTTP/no-JS compatibility.
const bootstrap = `try{if(location.pathname==='/actividades'){const p=new URLSearchParams(location.search).get('provincia');if(p){const slug=p==='catarmaca'?'catamarca':p;const known=${JSON.stringify(Object.keys((await import("../../lib/catalog.ts")).REGION_POR_PROVINCIA))};location.replace('/actividades/por-provincia/'+(known.includes(slug)?slug:'sin-resultados')+location.search+location.hash)}}}catch{}`;
await edit("app/layout.tsx", (s) =>
  s
    .replace('<html lang="es"', '<html lang="es"')
    .replace(
      "{gaId && (\n        <head>",
      '<head><script id="legacy-filter" dangerouslySetInnerHTML={{__html:' +
        JSON.stringify(bootstrap) +
        "}} />{gaId && <>",
    )
    .replace("        </head>\n      )}", "</>}</head>"),
);
await edit("lib/site-links.ts", (s) =>
  s.replace(
    "`/actividades?provincia=${resolveProvinciaSlug(slug)}`",
    "`/actividades/por-provincia/${resolveProvinciaSlug(slug)}`",
  ),
);
for (const p of ["app/robots.ts", "app/sitemap.ts"])
  await edit(p, (s) => "export const dynamic='force-static';\n" + s);
for (const p of [
  "app/provincias/[slug]/page.tsx",
  "app/actividades/[slug]/page.tsx",
])
  await edit(p, (s) => "export const dynamicParams=false;\n" + s);
await edit("lib/data.ts", (s) =>
  s
    .replace('import { connection } from "next/server";', "")
    .replace("  await connection();", ""),
);
await cp(
  join(root, "scripts/pr10/overrides/StaticAgenda.tsx.template"),
  join(source, "components/santa-fe/StaticAgenda.tsx"),
);
await edit("app/provincias/santa_fe/eventos/page.tsx", (s) =>
  s
    .replaceAll("getAgendaSantaFe", "getEventosSantaFe")
    .replace(
      'import AgendaSantaFe from "@/components/santa-fe/AgendaSantaFe";',
      'import StaticAgenda from "@/components/santa-fe/StaticAgenda";',
    )
    .replace(
      "const { vigentes, anteriores } = await getEventosSantaFe();",
      "const events = await getEventosSantaFe();",
    )
    .replace(
      "<AgendaSantaFe vigentes={vigentes} anteriores={anteriores} />",
      "<StaticAgenda events={events} />",
    ),
);
// Image sizes and prefetch={false} on cards live in the source since PR15 (components/ui/grillas.ts),
// so Vercel and Pages share them; no layout-specific patch is needed here.
await writeFile(
  join(source, "next.config.ts"),
  `import type {NextConfig} from 'next';const c:NextConfig={output:'export',turbopack:{root:${JSON.stringify(root)}},images:{unoptimized:true}};export default c;`,
);
// PR10 review templates stay in research source; no review route is injected into public builds.
async function adaptImages(path) {
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const p = join(path, entry.name);
    if (entry.isDirectory()) await adaptImages(p);
    else if (/\.[jt]sx$/.test(p)) {
      const text = await readFile(p, "utf8");
      await writeFile(
        p,
        text.replace(
          /import Image from ["']next\/image["'];/g,
          'import Image from "@/components/pages/StaticImage";',
        ),
      );
    }
  }
}
await adaptImages(join(source, "components"));
if (mode === "preview") {
  await edit("lib/data.ts", (s) =>
    s.replace(
      "pdf: item.PDF,",
      'pdf: "https://www.argentinauniversosur.com" + item.PDF,',
    ),
  );
  await rm(join(source, "public/pdf"), { recursive: true, force: true });
}
// Build test-only GA on its real approved hostname through Playwright's local HTTP transport.
const production = mode !== "preview";
const env = {
  ...process.env,
  AUS_STATIC_EXPORT: "1",
  SITE_ENV: production ? "production" : "preview",
  CF_PAGES: "1",
  CF_PAGES_BRANCH: production ? "main" : "pr11-preview",
  SITE_PRODUCTION_BRANCH: "main",
  VERCEL_ENV: "",
  NEXT_PUBLIC_GA_ID: mode === "consent-test" ? "G-PRUEBA0001" : "",
  NEXT_TELEMETRY_DISABLED: "1",
};
await new Promise((resolve, reject) => {
  const child = spawn(
    process.execPath,
    [join(root, "node_modules/next/dist/bin/next"), "build"],
    { cwd: source, env, stdio: "inherit" },
  );
  child.on("exit", (code) =>
    code ? reject(Error("Static build failed")) : resolve(),
  );
  child.on("error", reject);
});
await new Promise((resolve, reject) => {
  const child = spawn(
    process.execPath,
    [join(root, "node_modules/typescript/bin/tsc"), "--noEmit"],
    { cwd: source, env, stdio: "inherit" },
  );
  child.on("exit", (code) =>
    code ? reject(Error("Static TypeScript failed")) : resolve(),
  );
  child.on("error", reject);
});
// Fail before copying any newly generated public output, including RSC and JS.
await assertPublicArtifact(join(source, "out"), editorialTrips);
await rm(out, { recursive: true, force: true });
await cp(join(source, "out"), out, {
  recursive: true,
  mode: constants.COPYFILE_FICLONE,
});
// Only policy-supported widths for referenced raster content; no AVIF or duplicate native widths.
const cache = join(base, "image-cache");
await mkdir(cache, { recursive: true });
const used = new Set();
async function walk(dir, fn) {
  for (const d of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, d.name);
    if (d.isDirectory()) await walk(p, fn);
    else await fn(p);
  }
}
for (const f of rasters)
  for (const w of imageWidths(f.url, f.dimensions.width))
    used.add(`${f.sha256.slice(0, 16)}-${w}.webp`);
const originals = new Map(rasters.map((f) => [f.sha256.slice(0, 16), f]));
await mkdir(join(out, "media"), { recursive: true });
for (const name of used) {
  const [hash, width] = name.replace(".webp", "").split("-");
  const f = originals.get(hash);
  if (!f) throw Error("Unknown image hash");
  const cached = join(cache, name);
  try {
    await stat(cached);
  } catch {
    await sharp(join(root, f.originalPath))
      .rotate()
      .resize({ width: Number(width), withoutEnlargement: true })
      .withMetadata()
      .webp({ quality: 72 })
      .toFile(cached);
  }
  await cp(cached, join(out, "media", name), {
    mode: constants.COPYFILE_FICLONE,
  });
}
// Preserve historical image URLs with explicit redirects; remove only redundant build copies.
const redirects = [
  "/provincias/catarmaca /provincias/catamarca 308",
  "/actividades/por-provincia/catarmaca /actividades/por-provincia/catamarca 308",
];
for (const f of rasters) {
  const widths = imageWidths(f.url, f.dimensions.width);
  const w = widths.at(-1);
  redirects.push(`${f.url} /media/${f.sha256.slice(0, 16)}-${w}.webp 308`);
  await rm(join(out, f.originalPath.replace(/^public\//, "")), { force: true });
}
await writeFile(join(out, "_redirects"), redirects.join("\n") + "\n");
// Auxiliary source documents never belong to the runtime artifact; originals remain in Git.
await walk(join(out, "img"), async (p) => {
  if (/\.(md|lnk)$/i.test(p)) await rm(p);
});
// Inputs are not runtime endpoints; /api/catalogo-resumen remains an exported static JSON response.
await rm(join(out, "data"), { recursive: true, force: true });
await rm(join(out, "santa-fe/json"), { recursive: true, force: true });
await writeFile(
  join(out, "_headers"),
  `/*\n  X-Content-Type-Options: nosniff\n${mode === "preview" ? "  X-Robots-Tag: noindex, nofollow\n" : ""}`,
);
const security = await assertPublicArtifact(out, editorialTrips);
await writeFile(join(reports, `editorial-security-${mode}.json`), JSON.stringify(security, null, 2) + "\n");
const full = [];
await walk(out, async (p) =>
  full.push({ path: relative(out, p), bytes: (await stat(p)).size }),
);
await rm(slim, { recursive: true, force: true });
await cp(out, slim, { recursive: true, mode: constants.COPYFILE_FICLONE });
await rm(join(slim, "pdf"), { recursive: true, force: true });
// This estimate deliberately cannot be uploaded; a real release needs all PDF replacements approved.
await writeFile(
  join(slim, "NOT-DEPLOYABLE.txt"),
  "Size estimate only: PDF compatibility is unresolved. Do not deploy.\n",
);
await assertPublicArtifact(slim, editorialTrips);
const report = {
  mode,
  editorialSecurity: {withheldRecords: security.withheldRecords, errors: security.errors.length},
  files: full.length,
  bytes: full.reduce((n, f) => n + f.bytes, 0),
  mediaBytes: full
    .filter((f) => f.path.startsWith("media/"))
    .reduce((n, f) => n + f.bytes, 0),
  fallbackBytes: full
    .filter((f) => f.path.startsWith("img/"))
    .reduce((n, f) => n + f.bytes, 0),
  pdfBytes: full
    .filter((f) => f.path.startsWith("pdf/"))
    .reduce((n, f) => n + f.bytes, 0),
  withoutPdfsBytes: full
    .filter((f) => !f.path.startsWith("pdf/"))
    .reduce((n, f) => n + f.bytes, 0),
  oversized: full.filter((f) => f.bytes > 25 * 1024 * 1024),
  deploymentAuthorized: false,
  releaseBlocked: [
    "PDF replacements pending human approval",
    "Image rights review",
    "Cloudflare account and zone rules not authorized/tested",
    "Privacy provider update pending",
  ],
};
await writeFile(
  join(reports, `build-${mode}.json`),
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify(report, null, 2));
