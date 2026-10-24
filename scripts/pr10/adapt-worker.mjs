import { readFile, writeFile, cp, mkdir, readdir } from "node:fs/promises";
import { join } from "node:path";
import { root, scratch } from "./prepare.mjs";
const dir = join(scratch, "vinext");
const edit = async (file, fn) => {
  const p = join(dir, file);
  await writeFile(p, fn(await readFile(p, "utf8")));
};
// Replace the Node filesystem dependency with static server-side imports. No data fetch per visitor.
const files = [
  "data/provincias.json",
  "data/actividades.json",
  "data/escapadas.json",
  ...[
    "agencias",
    "events_enero_febrero",
    "noticias",
    "oficinas_informes",
    "planes",
    "preguntas_frecuentes",
  ].map((f) => "santa-fe/json/" + f + ".json"),
];
const imports = files
  .map((p, i) => `import dataset${i} from '../public/${p}';`)
  .join("\n");
const reader = `const datasets:Record<string,unknown>={${files.map((p, i) => JSON.stringify(p) + ":dataset" + i).join(",")}};\nasync function readFile(path:string,encoding:string){void encoding;const key=path.split('/public/')[1];if(!(key in datasets))throw Error('Unknown bundled dataset');return JSON.stringify(datasets[key]);}\n`;
await edit("lib/data.ts", (s) =>
  s.replace('import { readFile } from "fs/promises";', imports + "\n" + reader),
);
const manifest = JSON.parse(
  await readFile(join(scratch, "images/manifest.json"), "utf8"),
);
await writeFile(
  join(dir, "lib/prototype-images.json"),
  JSON.stringify(
    Object.fromEntries(
      Object.entries(manifest.assets).map(([path, value]) => [
        path,
        {
          variants: value.variants
            .filter((v) => v.format === "webp")
            .map(({ url, width, format }) => ({ url, width, format })),
        },
      ]),
    ),
  ),
);
await cp(join(scratch, "images/optimized"), join(dir, "public/optimized"), {
  recursive: true,
});
await cp(
  join(root, "scripts/pr10/overrides/PrototypeImage.tsx.template"),
  join(dir, "components/PrototypeImage.tsx"),
);
async function walk(path) {
  const files = [];
  for (const d of await readdir(path, { withFileTypes: true })) {
    const f = join(path, d.name);
    if (d.isDirectory()) files.push(...(await walk(f)));
    else if (/\.[jt]sx$/.test(f)) files.push(f);
  }
  return files;
}
for (const file of await walk(join(dir, "components"))) {
  const s = await readFile(file, "utf8");
  await writeFile(
    file,
    s.replace(
      'import Image from "next/image";',
      'import Image from "@/components/PrototypeImage";',
    ),
  );
}
// vinext's next/font shim uses Google's CDN. Reuse self-hosted font files from the Next baseline.
const cssDir = join(scratch, "baseline/.next/static/chunks");
let faces = [];
for (const f of await readdir(cssDir))
  if (f.endsWith(".css")) {
    const css = await readFile(join(cssDir, f), "utf8");
    faces.push(
      ...(css.match(/@font-face\{[^}]*\}/g) || []).filter(
        (v) => /font-family:Geist/.test(v) && !v.includes("Fallback"),
      ),
    );
  }
const fonts = join(dir, "public/prototype-fonts");
await mkdir(fonts, { recursive: true });
let fontCss = faces.join("\n");
const media = join(scratch, "baseline/.next/static/media");
for (const f of await readdir(media))
  if (/\.woff2$/.test(f)) await cp(join(media, f), join(fonts, f));
fontCss = fontCss.replace(
  /url\([^)]*\/([^/()]+\.woff2)\)/g,
  (_, file) => `url('/prototype-fonts/${file}')`,
);
if (!faces.length)
  throw Error(
    "Baseline font-face CSS not found; do not silently add a Google-font request.",
  );
await writeFile(
  join(dir, "app/prototype-fonts.css"),
  fontCss +
    "\n.prototype-fonts{--font-geist-sans:Geist;--font-geist-mono:Geist Mono}\n",
);
await edit("app/layout.tsx", (s) =>
  s
    .replace(
      'import { Geist, Geist_Mono } from "next/font/google";',
      'import "./prototype-fonts.css";',
    )
    .replace(/const geistSans = Geist\([\s\S]*?\n\}\);/, "")
    .replace(/const geistMono = Geist_Mono\([\s\S]*?\n\}\);/, "")
    .replace("${geistSans.variable}", "prototype-fonts")
    .replace("${geistMono.variable}", "")
    .replace('import { Analytics } from "@vercel/analytics/next";', "")
    .replace('import { SpeedInsights } from "@vercel/speed-insights/next";', "")
    .replace("<Analytics />", "")
    .replace("<SpeedInsights />", ""),
);
await cp(
  join(root, "scripts/pr10/overrides/TripTemplate.tsx.template"),
  join(dir, "components/TripTemplate.tsx"),
);
const demo = join(dir, "app/prototipo-pr10/escapadas/el-palmar");
await mkdir(demo, { recursive: true });
await cp(
  join(root, "scripts/pr10/overrides/TripPage.tsx.template"),
  join(demo, "page.tsx"),
);
const stream = join(dir, "app/prototipo-pr10/stream");
await mkdir(stream, { recursive: true });
await writeFile(
  join(stream, "Counter.tsx"),
  `'use client';import {useState} from 'react';export default function Counter(){const [n,setN]=useState(0);return <button onClick={()=>setN(n+1)}>Contador {n}</button>}`,
);
await writeFile(
  join(stream, "page.tsx"),
  `import {connection} from 'next/server';import {Suspense} from 'react';import Counter from './Counter';export const metadata={robots:{index:false,follow:false}};async function Later(){await new Promise(r=>setTimeout(r,200));return <p>Contenido RSC completado</p>}export default async function Page(){await connection();return <main><h1>Streaming local PR10</h1><Suspense fallback={<p>Esperando RSC</p>}><Later/></Suspense><Counter/></main>}`,
);
await cp(join(dir, "app/favicon.ico"), join(dir, "public/favicon.ico"));
await edit("components/TripTemplate.tsx", (s) =>
  s.replace(
    /import Image from ['"]next\/image['"];?/,
    "import Image from '@/components/PrototypeImage';",
  ),
);
const config = JSON.parse(await readFile(join(dir, "wrangler.jsonc"), "utf8"));
config.vars = { VERCEL_ENV: "production", NEXT_PUBLIC_GA_ID: "G-PRUEBA0001" };
config.name = "aus-pr10-local-only";
config.workers_dev = false;
config.preview_urls = false;
config.assets.run_worker_first = [
  "/*",
  "!/_next/static/*",
  "!/optimized/*",
  "!/img/*",
  "!/pdf/*",
  "!/prototype-fonts/*",
  "!/argentina.svg",
  "!/favicon.ico",
  "!/santa-fe/*",
  "!/data/*",
];
await writeFile(
  join(dir, "wrangler.jsonc"),
  JSON.stringify(config, null, 2) + "\n",
);
const pkg = JSON.parse(await readFile(join(dir, "package.json"), "utf8"));
delete pkg.scripts["deploy:vinext"];
await writeFile(join(dir, "package.json"), JSON.stringify(pkg, null, 2) + "\n");
console.log(
  "Worker adaptations applied only to isolated copy; no remote resources.",
);
