import { readFile, writeFile, mkdir, cp } from "node:fs/promises";
const dir = new URL("../../.artifacts/pages/e2e/", import.meta.url);
await mkdir(dir, { recursive: true });
let source = await readFile(
  new URL("../../tests/e2e/consentimiento.spec.ts", import.meta.url),
  "utf8",
);
source = source.replace(
  "  google: async",
  `  request: async ({playwright},usar) => {const request=await playwright.request.newContext({baseURL:'http://127.0.0.1:4402'});await usar(request);await request.dispose();},\n  google: async`,
);
// A delayed page-level request must continue through the local host transport, not the Internet.
source = source.replace("await r.continue();", "await r.fallback();");
source += `
// Only transport differs: approved hostname, bytes from the isolated local artifact, never Internet.
// Synchronous file reads start fulfillment before teardown can unroute an in-flight HTTP fetch.
import { readFileSync, statSync } from 'node:fs';
import { resolve, join, extname, sep } from 'node:path';
const artifact = resolve('.artifacts/pages/consent-test');
const types: Record<string,string> = {'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.txt':'text/plain','.xml':'application/xml','.webp':'image/webp','.gif':'image/gif','.svg':'image/svg+xml','.ico':'image/x-icon','.woff2':'font/woff2','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.pdf':'application/pdf'};
test.beforeEach(async({context})=>{
  await context.route('https://www.argentinauniversosur.com/**', route=>{
    const pathname=decodeURIComponent(new URL(route.request().url()).pathname);
    const wanted=resolve(artifact,'.'+pathname);
    if(wanted!==artifact && !wanted.startsWith(artifact+sep)) return route.fulfill({status:403,body:''});
    const file=[wanted,wanted+'.html',join(wanted,'index.html')].find(p=>{try{return statSync(p).isFile();}catch{return false;}});
    return route.fulfill({status:file?200:404,contentType:pathname==='/api/catalogo-resumen'?'application/json':types[extname(file||'404.html')]||'application/octet-stream',body:readFileSync(file||join(artifact,'404.html'))});
  });
});
`;
source += `\ntest.afterEach(async({context})=>{await context.unrouteAll({behavior:'wait'});});\n`;
await writeFile(new URL("consent.spec.ts", dir), source);
await cp(
  new URL("../../tests/pr10/compatibility.spec.ts", import.meta.url),
  new URL("legacy.spec.ts", dir),
);
await cp(
  new URL("../../tests/pages/static.spec.ts", import.meta.url),
  new URL("static.spec.ts", dir),
);

await cp(
  new URL("../../tests/pages/cloudflare-local.spec.ts", import.meta.url),
  new URL("cloudflare-local.spec.ts", dir),
);

const destinations = (await readFile(new URL("../../tests/e2e/destinations.spec.ts", import.meta.url), "utf8")).replaceAll("../../content/", "../../../content/").replaceAll("127.0.0.1:3200", "127.0.0.1:4401");
await writeFile(new URL("destinations.spec.ts", dir), destinations);
const publicidad = (await readFile(new URL("../../tests/e2e/publicidad.spec.ts", import.meta.url), "utf8")).replace('"../../lib/publicidad"', '"../../../lib/publicidad"');
await writeFile(new URL("publicidad.spec.ts", dir), publicidad);

await cp(new URL("../../tests/e2e/supabase.spec.ts", import.meta.url),new URL("supabase.spec.ts",dir));
