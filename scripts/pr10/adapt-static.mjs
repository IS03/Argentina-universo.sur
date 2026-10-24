import { readFile, writeFile, cp, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { root, scratch } from "./prepare.mjs";
import { SLUGS_PROVINCIAS } from "../../lib/site-links.ts";
const dir = join(scratch, "static");
const edit = async (file, fn) => {
  const p = join(dir, file);
  await writeFile(p, fn(await readFile(p, "utf8")));
};
const manifest = JSON.parse(
  await readFile(join(scratch, "images/manifest.json"), "utf8"),
);
await cp(join(scratch, "images/optimized"), join(dir, "public/optimized"), {
  recursive: true,
});
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
await writeFile(
  join(dir, "lib/prototype-image-loader.ts"),
  `'use client';\nimport assets from './prototype-images.json';\nexport default function loader({src,width}:{src:string;width:number}){const original=src.split(/[?#]/)[0];const found=(assets as Record<string,{variants:{url:string;width:number;format:string}[]}>)[original];if(!found)return src;const variants=found.variants.filter(v=>v.format==='webp');const chosen=variants.find(v=>v.width>=width)||variants[variants.length-1];return (process.env.NEXT_PUBLIC_PR10_IMAGE_ORIGIN||'')+chosen.url;}\n`,
);
await writeFile(
  join(dir, "next.config.ts"),
  `import type {NextConfig} from 'next';\nconst config:NextConfig={output:'export',turbopack:{root:${JSON.stringify(root)}},images:{loader:'custom',loaderFile:'./lib/prototype-image-loader.ts'}};export default config;\n`,
);
for (const file of ["app/sitemap.ts", "app/robots.ts"])
  await edit(file, (s) => "export const dynamic = 'force-static';\n" + s);
for (const file of [
  "app/provincias/[slug]/page.tsx",
  "app/actividades/[slug]/page.tsx",
])
  await edit(file, (s) => "export const dynamicParams = false;\n" + s);
await edit("lib/data.ts", (s) =>
  s
    .replace('import { connection } from "next/server";', "")
    .replace("  await connection();", ""),
);
await cp(
  join(root, "scripts/pr10/overrides/StaticActivities.tsx.template"),
  join(dir, "components/actividades/ActividadesExplorer.tsx"),
);
await cp(
  join(root, "scripts/pr10/overrides/StaticAgenda.tsx.template"),
  join(dir, "components/santa-fe/StaticAgenda.tsx"),
);
await edit("app/provincias/santa_fe/eventos/page.tsx", (s) =>
  s
    .replaceAll("getAgendaSantaFe", "getEventosSantaFe")
    .replace(
      'import EventosSection from "@/components/santa-fe/EventosSection";',
      'import StaticAgenda from "@/components/santa-fe/StaticAgenda";',
    )
    .replace(
      "const { vigentes, anteriores } = await getEventosSantaFe();",
      "const events = await getEventosSantaFe();",
    )
    .replace(
      /<EventosSection eventos=\{vigentes\} \/>[\s\S]*?\n              \)\}/,
      "<StaticAgenda events={events} />",
    ),
);
const bootstrap = `try{const p=new URLSearchParams(location.search).get('provincia');const slug=p==='catarmaca'?'catamarca':p;document.documentElement.dataset.pr10Province=!p?'todas':${JSON.stringify(SLUGS_PROVINCIAS)}.includes(slug)?slug:'sin-resultados'}catch{}`;
await edit("app/layout.tsx", (s) =>
  s
    .replace('import { Analytics } from "@vercel/analytics/next";', "")
    .replace('import { SpeedInsights } from "@vercel/speed-insights/next";', "")
    .replace("<Analytics />", "")
    .replace("<SpeedInsights />", "")
    .replace(
      "suppressHydrationWarning={gaId ? true : undefined}",
      "suppressHydrationWarning",
    )
    .replace(
      "{gaId && (\n        <head>",
      '<head><script id="pr10-static-filter" dangerouslySetInnerHTML={{__html:' +
        JSON.stringify(bootstrap) +
        "}} />{gaId && <>",
    )
    .replace("        </head>\n      )}", "</>}</head>"),
);
// A local demo only: not in the production tree or in the 106-entry sitemap.
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
await writeFile(
  join(dir, "public/_redirects"),
  "/provincias/catarmaca /provincias/catamarca 308\n/actividades/por-provincia/:provincia /actividades?provincia=:provincia 308\n",
);
await writeFile(
  join(dir, "public/_headers"),
  "/*\n  X-Content-Type-Options: nosniff\n/prototipo-pr10/*\n  X-Robots-Tag: noindex, nofollow\n",
);
console.log("Static overrides applied only under .artifacts/pr10/static.");
