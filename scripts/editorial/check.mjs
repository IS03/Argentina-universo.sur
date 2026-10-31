import sharp from "sharp";
import { readFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { readEditorialTrips } from "../pages/editorial-security.mjs";
import { planPdfRetirement } from "../../lib/pages/pdf-retirement.ts";
import { publishedPdfStatus } from "../../lib/pages/published-pdf.ts";
import { tripPublishable, buildDate } from "../../lib/pages/trips.ts";
import { REGION_POR_PROVINCIA } from "../../lib/catalog.ts";
const root = new URL("../../", import.meta.url);
const read = async path => JSON.parse(await readFile(new URL(path, root), "utf8"));
const rows = await read("docs/pr12/pdf-replacements.json");
const matrix = await read("docs/pr10/pdf-matrix.json");
const legacy = await read("public/data/escapadas.json");
const derivatives = await read("docs/pdf-optimizacion/derivados.json");
const trips = await readEditorialTrips(root.pathname);
const errors = [];
// content/escapadas/index.ts lists its imports explicitly; a JSON missing there would skip Next's build gate.
const indexSource = await readFile(new URL("content/escapadas/index.ts", root), "utf8");
const imported = new Set([...indexSource.matchAll(/from "\.\/([^"]+)\.json"/g)].map(m => m[1]));
for (const trip of trips) if (!imported.has(trip.slug)) errors.push("Trip JSON not gated by content/escapadas/index.ts: " + trip.slug);
if (rows.length !== 23 || new Set(rows.map(r => r.legacyGuideId)).size !== 23) errors.push("Inventory must cover 23 unique guides");
for (const key of ["id", "slug"])
  if (new Set(trips.map(trip => trip[key])).size !== trips.length) errors.push("Duplicate trip " + key);
const provinces = await read("public/data/provincias.json");
const activities = await read("public/data/actividades.json");
const { createSitemap } = await import("../../lib/seo.ts");
const { normalizarProvincia, normalizarActividad } = await import("../../lib/catalog.ts");
const known = new Set(createSitemap(provinces.map(normalizarProvincia), activities.map(normalizarActividad)).map(row => new URL(row.url).pathname));
known.add("/privacidad");
for (const trip of trips.filter(tripPublishable)) known.add("/escapadas/" + trip.slug);
for (const trip of trips) {
  for (const link of trip.related)
    if (!known.has(new URL(link.href, "https://www.argentinauniversosur.com").pathname)) errors.push("Unresolved related URL in " + trip.slug);
  if (trip.schemaVersion !== 2) continue;
  for (const id of trip.editorial.origin.legacyGuideIds)
    if (!rows.some(row => row.legacyGuideId === id)) errors.push("Unknown legacy guide relation in " + trip.slug);
  for (const photo of trip.photos)
    for (const src of new Set([photo.src, ...photo.variants.map(v => v.src)])) {
      try {
        const path = new URL("public" + src, root);
        if (!(await stat(path)).isFile()) throw Error();
        const actual = await sharp(await readFile(path)).metadata();
        const expectedWidth = src === photo.src ? photo.width : photo.variants.find(v => v.src === src).width;
        if (actual.width !== expectedWidth || Math.abs(actual.height / actual.width - photo.height / photo.width) > 1 / actual.width) errors.push("Incorrect photo dimensions/aspect ratio in " + trip.slug);
      }
      catch { errors.push("Missing or invalid prebuilt photo variant in " + trip.slug); }
    }
}
for (const row of rows) {
  const original = matrix.find(r => r.id === row.legacyGuideId);
  const item = legacy.find(r => r.ID === row.legacyGuideId);
  if (!original || !item || item.PDF !== row.pdf.path || original.path !== row.pdf.path || original.sha256 !== row.pdf.sha256 || original.bytes !== row.pdf.bytes) errors.push("Legacy PDF identity changed: " + row.legacyGuideId);
  const bytes = await readFile(new URL("public" + row.pdf.path, root));
  const actual = { bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") };
  if (publishedPdfStatus(row.pdf.path, row.pdf, actual, derivatives) === "changed") errors.push("PDF original changed: " + row.legacyGuideId);
  if (!row.provinceSlugs.length || row.provinceSlugs.some(p => !Object.hasOwn(REGION_POR_PROVINCIA, p)) || !row.research.sources.length || !row.research.pending.length) errors.push("Incomplete editorial inventory: " + row.legacyGuideId);
  const trip = trips.find(t => "/escapadas/" + t.slug === row.proposedHtml);
  if (row.draftSlug && trip?.slug !== row.draftSlug) errors.push("Draft/target mismatch: " + row.legacyGuideId);
  const plan = planPdfRetirement(row, trip);
  if (row.redirect.enabled && plan.blockers.length) errors.push("Unsafe PDF redirect: " + row.legacyGuideId);
  if (row.humanApproved && (!trip?.review || trip.status !== "approved")) errors.push("Human approval claim does not match trip: " + row.legacyGuideId);
  if (row.publicationPermitted && (!trip || !tripPublishable(trip))) errors.push("Publication claim does not match trip: " + row.legacyGuideId);
}
const security = await read("docs/pr12/security-document.json");
const originalSecurity = matrix.find(r => r.id === security.id);
if (security.path !== originalSecurity.path || security.sha256 !== originalSecurity.sha256 || security.replacementApproved || security.redirect || security.backup) errors.push("Security document must remain a separate pending review");
// Informational: expiry never fails a build (it only drops the observation), it signals a re-verification.
const asOf = buildDate();
const operationalNotices = trips.flatMap(trip => (trip.operationalNotices ?? []).map(n => ({trip: trip.slug, id: n.id, verifiedAt: n.verifiedAt, expiresAt: n.expiresAt, observation: asOf > n.expiresAt ? "expired: guidance only" : "within validity"})));
console.log(JSON.stringify({asOf, operationalNotices, guides: rows.length, separateSecurityDocument: 1, drafts: trips.length, publishable: trips.filter(tripPublishable).length, tourismPdfBytes: rows.reduce((n,r) => n+r.pdf.bytes,0), publicPdfBytesRetired: 0, activePdfRedirects: 0, errors}, null, 2));
if (errors.length) process.exitCode = 1;
