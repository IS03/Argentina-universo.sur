// Manual, network-dependent check (not part of CI): one HEAD per PDF against production, never a download.
// It also confirms the published Cloudflare Preview withholds every draft route. Read-only on both hosts.
import { readFile, writeFile } from "node:fs/promises";
import { readEditorialTrips } from "../pages/editorial-security.mjs";
import { tripPublishable } from "../../lib/pages/trips.ts";
if (process.argv.slice(2).some(arg => arg !== "--pr13")) throw Error("Only --pr13 is supported");
const pr13 = process.argv.includes("--pr13");
const root = new URL("../../", import.meta.url);
const read = async path => JSON.parse(await readFile(new URL(path, root), "utf8"));
const production = "https://www.argentinauniversosur.com";
const preview = "https://argentina-universo-sur-preview.pages.dev";
const rows = await read("docs/pr12/pdf-replacements.json");
const security = await read("docs/pr12/security-document.json");
const drafts = (await readEditorialTrips(root.pathname)).filter(trip => !tripPublishable(trip)).map(trip => trip.slug);
const targets = [...rows.map(r => ({id: r.legacyGuideId, ...r.pdf})), {id: security.id, path: security.path, bytes: security.bytes, sha256: security.sha256}];
async function head(url) {
  const response = await fetch(url, {method: "HEAD", redirect: "manual", signal: AbortSignal.timeout(15000), headers: {"user-agent": pr13 ? "AUS-pr13-link-check" : "AUS-pr12-link-check"}});
  return {status: response.status, contentType: response.headers.get("content-type"), contentLength: Number(response.headers.get("content-length")) || null, location: response.headers.get("location")};
}
const pdfs = [];
for (const target of targets) {
  // Paths are kept exactly (including "cañafate"); only percent-encoded for the request line.
  const result = await head(production + encodeURI(target.path));
  const ok = result.status === 200 && /application\/pdf/.test(result.contentType ?? "") && result.contentLength === target.bytes;
  pdfs.push({id: target.id, path: target.path, expectedBytes: target.bytes, ...result, ok});
}
const previewRoutes = [];
for (const slug of drafts) {
  const result = await head(preview + "/escapadas/" + slug);
  previewRoutes.push({path: "/escapadas/" + slug, status: result.status, ok: result.status === 404});
}
const report = {
  checkedAt: new Date().toISOString(), method: "HEAD", bodiesDownloaded: 0, production, preview,
  pdfs: {total: pdfs.length, ok: pdfs.filter(p => p.ok).length, results: pdfs},
  previewDraftRoutes: {total: previewRoutes.length, withheld: previewRoutes.filter(r => r.ok).length, results: previewRoutes},
};
await writeFile(new URL(pr13 ? "docs/pr13/pdf-link-check.json" : "docs/pr12/pdf-link-check.json", root), JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({pdfsOk: `${report.pdfs.ok}/${report.pdfs.total}`, previewDraftsWithheld: `${report.previewDraftRoutes.withheld}/${report.previewDraftRoutes.total}`, failures: [...pdfs, ...previewRoutes].filter(r => !r.ok)}, null, 2));
if (report.pdfs.ok !== report.pdfs.total || report.previewDraftRoutes.withheld !== report.previewDraftRoutes.total) process.exitCode = 1;
