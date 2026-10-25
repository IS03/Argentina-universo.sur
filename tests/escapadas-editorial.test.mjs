import test from "node:test";
import assert from "node:assert/strict";
import { readFile, mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { validateTrip, tripContentHash, tripPublishable, publishedTripProjection } from "../lib/pages/trips.ts";
import { planPdfRetirement } from "../lib/pages/pdf-retirement.ts";
import { readEditorialTrips, auditPublicArtifact } from "../scripts/pages/editorial-security.mjs";
const synthetic = () => ({
  schemaVersion: 2, id: "SYNTHETIC-NOT-AN-EDITORIAL-RECORD", slug: "synthetic-trip", title: "Synthetic tourist page",
  destination: "Synthetic destination", province: "Santa Fe", description: "Synthetic introduction", status: "draft", publicationAuthorized: false, review: null,
  introductionSourceIds: ["source"], sources: [{id: "source", title: "Synthetic source", url: "https://example.org/source", checkedAt: "2026-10-24"}],
  geography: {provinceSlugs: ["santa_fe"], localities: [{id: "SYNTHETIC-LOCALITY", name: "Synthetic locality", provinceSlug: "santa_fe", sourceIds: ["source"]}]},
  sections: ["highlights", "activities", "practical"].map(kind => ({id: kind, kind, title: kind, paragraphs: ["Synthetic paragraph for " + kind], sourceIds: ["source"]})),
  address: "Synthetic location", mapUrl: "https://www.openstreetmap.org/search?query=synthetic",
  locations: [{id: "synthetic", label: "Synthetic location", description: "Approximate location", mapUrl: "https://www.openstreetmap.org/search?query=synthetic", sourceIds: ["source"]}],
  photos: [], related: [{href: "/provincias/santa_fe", label: "Santa Fe"}],
  editorial: {documentaryStatus: "sources-checked", updatedAt: "2026-10-24", origin: {kind: "git-editorial", legacyGuideIds: ["SYNTHETIC-GUIDE"], masterRefs: []}, pendingReviews: ["Synthetic pending review"]},
});
function approveSynthetic(record) {
  assert.equal(record.id, "SYNTHETIC-NOT-AN-EDITORIAL-RECORD");
  return {...record, status: "approved", publicationAuthorized: true, review: {reviewer: "synthetic-test-only", date: "2026-10-24", contentSha256: tripContentHash(record)}};
}
const fixturePhoto = () => ({src: "/media/synthetic-960.webp", width: 960, height: 640, alt: "Synthetic accessible description", caption: "Synthetic caption", variants: [{src: "/media/synthetic-320.webp", width: 320}, {src: "/media/synthetic-960.webp", width: 960}], rights: {status: "approved", holder: "Synthetic holder", licenseName: "Synthetic license", licenseUrl: "https://example.org/license", evidenceUrl: "https://example.org/private-evidence", reviewer: "synthetic-test-only", reviewedAt: "2026-10-24"}});

test("structured model validates jurisdictions, localities, evidence, locations and semantic sections", () => {
  assert.deepEqual(validateTrip(synthetic()), []);
  for (const mutate of [
    t => t.geography.provinceSlugs.push("catarmaca"),
    t => t.geography.localities[0].provinceSlug = "misiones",
    t => t.introductionSourceIds = ["missing"],
    t => t.locations[0].sourceIds = ["missing"],
    t => t.sections.pop(),
    t => t.sections[1].id = t.sections[0].id,
    t => t.locations[0].mapUrl = "javascript:alert(1)",
    t => t.related[0].href = "//other.example.org",
    t => t.editorial.updatedAt = "2026-02-30",
  ]) { const t = synthetic(); mutate(t); assert.ok(validateTrip(t).length); }
});

test("photographs require prebuilt variants, alt text and an independent rights decision", () => {
  const t = synthetic(); t.photos = [fixturePhoto()];
  assert.deepEqual(validateTrip(t), []);
  for (const mutate of [
    t => t.photos[0].rights.status = "pending", t => t.photos[0].rights.reviewer = "",
    t => t.photos[0].rights.evidenceUrl = "", t => t.photos[0].alt = "",
    t => t.photos[0].width = 0, t => t.photos[0].variants[0].src = "/img/original.jpg",
  ]) { const invalid = structuredClone(t); mutate(invalid); assert.ok(validateTrip(invalid).length); assert.throws(() => publishedTripProjection(approveSynthetic(invalid))); }
});

test("public projection excludes Work reconciliation, editorial notes and private image evidence", () => {
  const t = synthetic(); t.photos = [fixturePhoto()];
  t.editorial.origin.masterRefs = [{sheet: "synthetic", originalId: "PRIVATE-SYNTHETIC-REFERENCE"}];
  t.geography.localities[0].privateNote = "PRIVATE-SYNTHETIC-REFERENCE";
  t.locations[0].privateEvidence = "PRIVATE-SYNTHETIC-REFERENCE";
  const projected = publishedTripProjection(approveSynthetic(t));
  assert.doesNotMatch(JSON.stringify(projected), /PRIVATE-SYNTHETIC|masterRefs|pendingReviews|editorial|reviewer|private-evidence|evidenceUrl/);
  assert.equal(projected.photos[0].attribution.holder, "Synthetic holder");
});

test("source-checked is never approval; every real prepared trip remains withheld", async () => {
  const trips = await readEditorialTrips(new URL("../", import.meta.url).pathname);
  assert.equal(trips.length, 4);
  for (const trip of trips) { assert.equal(trip.status, "draft"); assert.equal(trip.review, null); assert.equal(tripPublishable(trip), false); }
  for (const trip of trips.filter(t => t.slug !== "el-palmar")) { assert.equal(trip.publicationAuthorized, false); assert.deepEqual(trip.editorial.origin.masterRefs, []); }
  const palmar = trips.find(t => t.slug === "el-palmar");
  assert.equal(palmar.publicationAuthorized, true);
});

function rowFor(trip) {
  const hash = tripContentHash(trip), pdfHash = "a".repeat(64);
  return {legacyGuideId: "SYNTHETIC-GUIDE", pdf: {path: "/pdf/synthetic.pdf", bytes: 1234, sha256: pdfHash}, proposedHtml: "/escapadas/" + trip.slug, replacement: {
    scopeReview: {equivalent: true, reviewer: "synthetic-test-only", date: "2026-10-24", pdfSha256: pdfHash, tripContentSha256: hash},
    backup: {access: "private", outsidePublicDeployments: true, restorationVerified: true, sha256: pdfHash, bytes: 1234, verifiedBy: "synthetic-test-only", verifiedAt: "2026-10-24"},
    retirementApproval: {reviewer: "synthetic-test-only", date: "2026-10-24", pdfSha256: pdfHash, tripContentSha256: hash},
  }};
}
test("retirement planner requires equivalent approved HTML, independent backup and explicit retirement approval", () => {
  const trip = approveSynthetic(synthetic()), row = rowFor(trip);
  assert.deepEqual(planPdfRetirement(row, trip).proposedRedirect, {source: "/pdf/synthetic.pdf", destination: "/escapadas/synthetic-trip", status: 308});
  for (const mutate of [r => r.replacement.scopeReview = null, r => r.replacement.scopeReview.equivalent = false, r => r.replacement.backup = null, r => r.replacement.backup.outsidePublicDeployments = false, r => r.replacement.backup.restorationVerified = false, r => r.replacement.backup.sha256 = "b".repeat(64), r => r.replacement.backup.bytes++, r => r.replacement.retirementApproval = null, r => r.replacement.scopeReview.tripContentSha256 = "stale", r => r.proposedHtml = "/", r => r.pdf.path = "/pdf/../file.pdf"]) {
    const invalid = structuredClone(row); mutate(invalid);
    const plan = planPdfRetirement(invalid, trip); assert.equal(plan.proposedRedirect, null); assert.ok(plan.blockers.length); assert.equal(plan.publicWrites, 0);
  }
  assert.equal(planPdfRetirement(row, {...trip, status: "draft"}).proposedRedirect, null);
  assert.equal(planPdfRetirement(row, {...trip, description: "unreviewed edit"}).proposedRedirect, null);
});

test("legacy matrix retains all 23 identities and every retirement stays blocked; security is separate", async () => {
  const rows = JSON.parse(await readFile(new URL("../docs/pr12/pdf-replacements.json", import.meta.url), "utf8"));
  const legacy = JSON.parse(await readFile(new URL("../docs/pr10/pdf-matrix.json", import.meta.url), "utf8"));
  const trips = await readEditorialTrips(new URL("../", import.meta.url).pathname);
  assert.equal(rows.length, 23);
  assert.equal(rows.reduce((n,r) => n+r.pdf.bytes, 0), 632210942);
  for (const row of rows) {
    const before = legacy.find(r => r.id === row.legacyGuideId);
    assert.deepEqual(row.pdf, {path: before.path, bytes: before.bytes, sha256: before.sha256});
    const trip = trips.find(t => "/escapadas/" + t.slug === row.proposedHtml);
    assert.equal(planPdfRetirement(row, trip).proposedRedirect, null);
    assert.equal(row.redirect.enabled, false); assert.equal(row.humanApproved, false); assert.equal(row.publicationPermitted, false);
  }
  const entreRios = rows.find(r => r.legacyGuideId === "esc_11");
  assert.notEqual(entreRios.proposedHtml, "/escapadas/el-palmar");
});

test("new editorial-only payloads are rejected even without any tourist text", async t => {
  const dir = await mkdtemp(join(tmpdir(), "aus-editorial-payload-")); t.after(() => rm(dir,{recursive: true, force: true}));
  await writeFile(join(dir,"leak.js"), 'const leak={masterRefs:[],pendingReviews:["synthetic"],documentaryStatus:"sources-checked"}');
  assert.ok((await auditPublicArtifact(dir, [])).errors.some(e => e.rule === "private-master-data"));
});

test("tourist article renders semantic HTML, evidence anchors, map links and responsive licensed photos without JS", async t => {
  const dir = await mkdtemp(join(tmpdir(), "aus-trip-render-")); t.after(() => rm(dir,{recursive: true, force: true}));
  const source = await readFile(new URL("../components/escapadas/TripArticle.tsx", import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {compilerOptions: {jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022}}).outputText.replace('"react/jsx-runtime"', JSON.stringify(import.meta.resolve("react/jsx-runtime"))).replace('"@/lib/site-links"', JSON.stringify(new URL("../lib/site-links.ts", import.meta.url).href));
  const path = join(dir, "article.mjs"); await writeFile(path, compiled);
  const Article = (await import(pathToFileURL(path).href)).default;
  const fixture = withNotice("2026-10-22"); fixture.photos = [fixturePhoto()];
  fixture.related.push({href: "/actividades?provincia=catarmaca&origen=synthetic#lista", label: "Synthetic activities"});
  const html = renderToStaticMarkup(createElement(Article, {trip: publishedTripProjection(approveSynthetic(fixture))}));
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.match(html, /<article aria-labelledby="escapada-titulo"/);
  assert.match(html, /srcSet="[^"]*320w[^"]*960w"/i);
  assert.match(html, /width="960" height="640" alt="Synthetic accessible description"/);
  assert.match(html, /href="\/actividades\?provincia=catamarca&amp;origen=synthetic#lista"/);
  assert.match(html, /Synthetic holder/); assert.match(html, /datetime="2026-10-24"/i);
  assert.match(html, /<aside aria-label="Estado operativo"[^>]*><p[^>]*>Estado verificado el <time dateTime="2026-10-22">2026-10-22<\/time>/i);
  for (const [,id] of html.matchAll(/href="#([^"]+)"/g)) assert.ok(html.includes(`id="${id}"`), id);
  assert.doesNotMatch(html, /<script|<iframe|_next\/image|adsbygoogle|googletagmanager|private-evidence/);
});

test("an approved status without a review bound to the exact hash is an error, not a silent omission", async () => {
  const trips = await readEditorialTrips(new URL("../", import.meta.url).pathname);
  for (const trip of trips) {
    assert.ok(validateTrip({...trip, status: "approved", publicationAuthorized: true}).includes("Approval lacks human review/publication permission"), trip.slug);
    const stale = {...trip, status: "approved", publicationAuthorized: true, review: {reviewer: "synthetic-test-only", date: "2026-10-24", contentSha256: "0".repeat(64)}};
    assert.equal(tripPublishable(stale), false);
    assert.ok(validateTrip(stale).length, trip.slug);
  }
  const gate = await readFile(new URL("../content/escapadas/index.ts", import.meta.url), "utf8");
  assert.match(gate, /validateTrip\(trip\)[\s\S]*throw new Error/);
});

test("the .next audit scope reports withheld text in served files and ignores private server chunks", async t => {
  const dir = await mkdtemp(join(tmpdir(), "aus-next-audit-")); t.after(() => rm(dir,{recursive: true, force: true}));
  const trips = await readEditorialTrips(new URL("../", import.meta.url).pathname);
  const paragraph = trips.find(trip => trip.slug === "caba").sections[0].paragraphs[0];
  await writeFile(join(dir, "page.js"), JSON.stringify(paragraph));
  await writeFile(join(dir, "escapadas.html"), "<p>" + paragraph.replaceAll("é", "&#233;").replaceAll("ó", "&#xf3;") + "</p>");
  const include = name => /\.(?:html|rsc)$/.test(name);
  const report = await auditPublicArtifact(dir, trips, {include});
  assert.deepEqual(report.errors.map(e => e.file), ["escapadas.html"]);
  assert.equal(report.javascript, 0);
});

const withNotice = (verifiedAt = "2026-10-20") => {
  const t = synthetic();
  t.operationalNotices = [{id: "synthetic-closure", sectionId: "activities", text: "Synthetic temporary closure notice", sourceIds: ["source"], verifiedAt}];
  return t;
};
test("operational notices are dated, sourced, tied to a section and must be re-verified close to the review", () => {
  assert.deepEqual(validateTrip(withNotice()), []);
  for (const mutate of [n => n.sectionId = "missing", n => n.sourceIds = ["missing"], n => n.sourceIds = [], n => n.verifiedAt = "2026-02-30", n => n.text = " ", n => n.id = "Bad Id"]) {
    const t = withNotice(); mutate(t.operationalNotices[0]); assert.ok(validateTrip(t).includes("Invalid operational notice"));
  }
  // Review on 2026-10-24: a notice checked 4 days earlier is current; one from 8 days earlier or after the review is not.
  assert.equal(publishedTripProjection(approveSynthetic(withNotice("2026-10-20"))).operationalNotices[0].verifiedAt, "2026-10-20");
  for (const stale of ["2026-10-16", "2026-10-25"]) assert.throws(() => publishedTripProjection(approveSynthetic(withNotice(stale))), /re-verified before publication/);
});

test("the Garganta del Diablo closure is a dated notice, not part of the permanent description", async () => {
  const trips = await readEditorialTrips(new URL("../", import.meta.url).pathname);
  const iguazu = trips.find(t => t.slug === "puerto-iguazu");
  const [notice] = iguazu.operationalNotices;
  assert.equal(notice.sectionId, "elegir-los-paseos");
  assert.equal(notice.verifiedAt, "2026-10-24");
  assert.deepEqual(notice.sourceIds, ["IGU-ESTADO-APN", "IGU-ESTADO-CONCESION"]);
  const garganta = iguazu.sections.flatMap(s => s.paragraphs).filter(p => /Garganta del Diablo/.test(p));
  assert.equal(garganta.length, 1);
  assert.doesNotMatch(garganta[0], /cerrad|retirad|reapertura|disponible/i);
  assert.ok(iguazu.editorial.pendingReviews.some(p => /Reverificar.*Garganta del Diablo/.test(p)));
  assert.equal(tripPublishable(iguazu), false);
  assert.ok(validateTrip({...iguazu, status: "approved", publicationAuthorized: true, review: {reviewer: "synthetic-test-only", date: "2026-12-01", contentSha256: tripContentHash(iguazu)}}).some(e => /re-verified/.test(e)));
});

test("withheld operational notice text is caught by the public artifact audit", async t => {
  const dir = await mkdtemp(join(tmpdir(), "aus-notice-audit-")); t.after(() => rm(dir,{recursive: true, force: true}));
  const trips = await readEditorialTrips(new URL("../", import.meta.url).pathname);
  await writeFile(join(dir, "chunk.js"), JSON.stringify({text: trips.find(t => t.slug === "puerto-iguazu").operationalNotices[0].text}));
  assert.ok((await auditPublicArtifact(dir, trips)).errors.some(e => e.rule.startsWith("withheld-content")));
});
