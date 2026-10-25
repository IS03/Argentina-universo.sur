// Audits the Vercel-style `next build` output after it runs. Server chunks legitimately hold the private
// editorial catalog (server-only), so only what Next serves to browsers is scanned: client assets and
// prerendered HTML/RSC/metadata. A withheld trip or private editorial key there fails the pipeline.
import { stat, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { assertPublicArtifact, readEditorialTrips } from "../pages/editorial-security.mjs";
const root = process.cwd();
const trips = await readEditorialTrips(root);
const next = join(root, ".next");
if (!(await stat(join(next, "BUILD_ID")).catch(() => null))) throw Error("Run `npm run build` before auditing .next");
const prerendered = /\.(?:html|rsc|meta|body|txt|json|xml)$/i;
const reports = {
  static: await assertPublicArtifact(join(next, "static"), trips),
  prerendered: await assertPublicArtifact(join(next, "server/app"), trips, {include: name => prerendered.test(name) && !name.endsWith(".nft.json")}),
};
if (!reports.prerendered.html || !reports.static.javascript) throw Error("Unexpected .next layout: nothing was scanned");
await mkdir(".artifacts/pr12", {recursive: true});
await writeFile(".artifacts/pr12/editorial-security-next.json", JSON.stringify(reports, null, 2) + "\n");
console.log(JSON.stringify({withheldRecords: reports.static.withheldRecords, scanned: {static: reports.static.textFiles, prerendered: reports.prerendered.textFiles, html: reports.prerendered.html, javascript: reports.static.javascript}, errors: 0}));
