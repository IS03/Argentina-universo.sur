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
source += `\n// Only transport differs: browser hostname is production; every application request stays local.\ntest.beforeEach(async({context})=>{await context.route('https://www.argentinauniversosur.com/**',async route=>{const url=new URL(route.request().url());const response=await fetch('http://127.0.0.1:4402'+url.pathname+url.search,{headers:{'accept-encoding':'identity'}});const body=Buffer.from(await response.arrayBuffer());await route.fulfill({status:response.status,contentType:response.headers.get('content-type')||'application/octet-stream',body});});});\n`;
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
