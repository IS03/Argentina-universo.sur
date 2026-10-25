import test from "node:test";
import assert from "node:assert/strict";
import { readFile, mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { validateTrip, validateTripAsOf, buildDate, tripContentHash, tripPublishable, publishedTripProjection } from "../lib/pages/trips.ts";
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
  assert.ok(trips.length >= 4); // PR13 adds drafts; exact batch coverage has its own test.
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

async function loadArticle(t) {
  const dir = await mkdtemp(join(tmpdir(), "aus-trip-render-")); t.after(() => rm(dir,{recursive: true, force: true}));
  const source = await readFile(new URL("../components/escapadas/TripArticle.tsx", import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {compilerOptions: {jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022}}).outputText.replace('"react/jsx-runtime"', JSON.stringify(import.meta.resolve("react/jsx-runtime"))).replace('"@/lib/site-links"', JSON.stringify(new URL("../lib/site-links.ts", import.meta.url).href));
  const path = join(dir, "article.mjs"); await writeFile(path, compiled);
  return (await import(pathToFileURL(path).href)).default;
}
// Synthetic notice: verified on the 22nd, approved (approveSynthetic) on the 24th, observation valid until 2026-11-05.
const withNotice = (verifiedAt = "2026-10-22", expiresAt = "2026-11-05") => {
  const t = synthetic();
  // Base evidence dated on the verification day, so builds simulated on earlier/later dates stay coherent.
  t.sources[0].checkedAt = verifiedAt; t.editorial.updatedAt = verifiedAt;
  t.sources.push({id: "status", title: "Synthetic official status", url: "https://example.org/status", checkedAt: verifiedAt, publishedAt: verifiedAt + "T17:00-03:00"});
  t.operationalNotices = [{id: "synthetic-closure", sectionId: "activities", guidance: "Synthetic permanent guidance to check the official status.", officialStatusSourceId: "status", observation: "Synthetic past-tense observation of a temporary closure.", sourceIds: ["status"], verifiedAt, expiresAt}];
  return t;
};
test("tourist article renders semantic HTML, evidence anchors, map links and responsive licensed photos without JS", async t => {
  const Article = await loadArticle(t);
  const fixture = withNotice(); fixture.photos = [fixturePhoto()];
  fixture.related.push({href: "/actividades?provincia=catarmaca&origen=synthetic#lista", label: "Synthetic activities"});
  const html = renderToStaticMarkup(createElement(Article, {trip: publishedTripProjection(approveSynthetic(fixture), {asOf: "2026-10-25"})}));
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.match(html, /<article aria-labelledby="escapada-titulo"/);
  assert.match(html, /srcSet="[^"]*320w[^"]*960w"/i);
  assert.match(html, /width="960" height="640" alt="Synthetic accessible description"/);
  assert.match(html, /href="\/actividades\?provincia=catamarca&amp;origen=synthetic#lista"/);
  assert.match(html, /Synthetic holder/); assert.match(html, /datetime="2026-10-24"/i);
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
  assert.match(gate, /validateTripAsOf\(trip, asOf\)[\s\S]*throw new Error/);
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

const projectAt = (trip, asOf) => publishedTripProjection(trip, {asOf});
const approveAt = (record, date) => ({...approveSynthetic(record), review: {reviewer: "synthetic-test-only", date, contentSha256: tripContentHash(record)}});

test("notices separate permanent guidance from a dated observation and validate their date windows", () => {
  assert.deepEqual(validateTrip(withNotice()), []);
  for (const mutate of [n => n.sectionId = "missing", n => n.sourceIds = ["missing"], n => n.sourceIds = [], n => n.officialStatusSourceId = "missing", n => n.verifiedAt = "2026-02-30", n => n.expiresAt = "", n => n.guidance = " ", n => n.observation = "", n => n.id = "Bad Id"]) {
    const t = withNotice(); mutate(t.operationalNotices[0]); assert.ok(validateTrip(t).includes("Invalid operational notice"));
  }
  // Validity: 1 to 14 days after verification.
  assert.ok(validateTrip(withNotice("2026-10-22", "2026-10-22")).some(e => /validity/.test(e)));
  assert.ok(validateTrip(withNotice("2026-10-22", "2026-11-06")).some(e => /validity/.test(e)));
  assert.deepEqual(validateTrip(withNotice("2026-10-22", "2026-11-05")), []);
  // A source cannot be consulted after the verification it supports, nor published after it was consulted.
  const late = withNotice(); late.sources[1].checkedAt = "2026-10-23"; assert.ok(validateTrip(late).some(e => /consulted after/.test(e)));
  const backdated = withNotice(); backdated.sources[1].publishedAt = "2026-10-23"; assert.ok(validateTrip(backdated).includes("Invalid source"));
  const badTime = withNotice(); badTime.sources[1].publishedAt = "2026-10-22 17:00"; assert.ok(validateTrip(badTime).includes("Invalid source"));
});

test("approval must follow a fresh verification and precede expiry", () => {
  // Reviewed 2 days after verification: valid. 8 days after, before verification, or after expiry: rejected.
  assert.doesNotThrow(() => projectAt(approveAt(withNotice(), "2026-10-24"), "2026-10-24"));
  for (const date of ["2026-10-30", "2026-10-21"]) assert.throws(() => projectAt(approveAt(withNotice(), date), "2026-11-01"), /re-verified before publication/);
  assert.throws(() => projectAt(approveAt(withNotice("2026-10-22", "2026-10-23"), "2026-10-24"), "2026-10-24"), /re-verified before publication/);
});

test("an old review keeps building after expiry: the observation is dropped, the permanent guidance stays", () => {
  // Approved in January, rebuilt in June: no failure (a failing build would keep the old deployment online).
  const old = approveAt(withNotice("2026-01-08", "2026-01-20"), "2026-01-10");
  const notice = projectAt(old, "2026-06-01").operationalNotices[0];
  assert.equal(notice.observation, null);
  assert.equal(notice.guidance, "Synthetic permanent guidance to check the official status.");
  assert.equal(notice.officialStatusSourceId, "status");
});

test("builds before, on and after the expiry date", () => {
  const approved = approveAt(withNotice(), "2026-10-24");
  const before = projectAt(approved, "2026-10-30").operationalNotices[0].observation;
  assert.deepEqual(before, {text: "Synthetic past-tense observation of a temporary closure.", sourceIds: ["status"], verifiedAt: "2026-10-22", publishedAt: "2026-10-24", expiresAt: "2026-11-05"});
  assert.notEqual(projectAt(approved, "2026-11-05").operationalNotices[0].observation, null);
  assert.equal(projectAt(approved, "2026-11-06").operationalNotices[0].observation, null);
});

test("dates after the build date fail validation and projection", () => {
  const approved = approveAt(withNotice(), "2026-10-24");
  assert.throws(() => projectAt(approved, "2026-10-23"), /after the build date/); // review in the future
  assert.ok(validateTripAsOf(withNotice(), "2026-10-21").some(e => /after the build date/.test(e))); // verification in the future
  const futureSource = synthetic(); futureSource.sources[0].checkedAt = "2026-12-01";
  assert.ok(validateTripAsOf(futureSource, "2026-10-25").some(e => /after the build date/.test(e)));
  assert.deepEqual(validateTripAsOf(withNotice(), "2026-10-22"), []);
  assert.throws(() => buildDate({AUS_BUILD_DATE: "25/10/2026"}), /YYYY-MM-DD/);
  assert.equal(buildDate({AUS_BUILD_DATE: "2026-10-25"}), "2026-10-25");
  assert.match(buildDate({}), /^\d{4}-\d{2}-\d{2}$/);
});

test("static HTML stays truthful without JS: guidance always, observation in the past with visible dates only until expiry", async t => {
  const Article = await loadArticle(t);
  const approved = approveAt(withNotice(), "2026-10-24");
  const current = renderToStaticMarkup(createElement(Article, {trip: projectAt(approved, "2026-10-25")}));
  assert.match(current, /<aside aria-label="Estado operativo"[^>]*><p>Synthetic permanent guidance to check the official status\. <a class="underline" href="https:\/\/example\.org\/status"/);
  assert.match(current, /verificado el <time dateTime="2026-10-22">2026-10-22<\/time>,\s*publicado el <time dateTime="2026-10-24">2026-10-24<\/time>/);
  assert.match(current, /referencia hasta el <time dateTime="2026-11-05">2026-11-05<\/time>; después puede no reflejar el estado actual/);
  assert.match(current, /comunicado del <time dateTime="2026-10-22T17:00-03:00">2026-10-22 17:00-03:00<\/time>/);
  const expired = renderToStaticMarkup(createElement(Article, {trip: projectAt(approved, "2026-11-06")}));
  assert.match(expired, /Synthetic permanent guidance/);
  assert.doesNotMatch(expired, /Synthetic past-tense observation|Registro verificado/);
  assert.doesNotMatch(current + expired, /<script/);
});

test("the Garganta del Diablo closure is a dated, past-tense observation, not part of the permanent description", async () => {
  const trips = await readEditorialTrips(new URL("../", import.meta.url).pathname);
  const iguazu = trips.find(t => t.slug === "puerto-iguazu");
  const [notice] = iguazu.operationalNotices;
  assert.equal(notice.sectionId, "elegir-los-paseos");
  assert.equal(notice.verifiedAt, "2026-10-24");
  assert.equal(notice.expiresAt, "2026-11-07");
  assert.equal(notice.officialStatusSourceId, "IGU-ESTADO-CIRCUITO");
  assert.deepEqual(notice.sourceIds, ["IGU-ESTADO-CIRCUITO", "IGU-ESTADO-APN", "IGU-ESTADO-CONCESION"]);
  // Communiqué dates are distinct from consultation dates; a page without a visible date records none.
  const source = id => iguazu.sources.find(s => s.id === id);
  assert.equal(source("IGU-ESTADO-APN").publishedAt, "2026-09-17");
  assert.equal(source("IGU-ESTADO-CONCESION").publishedAt, "2026-08-03T19:45-03:00");
  assert.equal(source("IGU-ESTADO-CIRCUITO").publishedAt, undefined);
  for (const id of notice.sourceIds) assert.equal(source(id).checkedAt, "2026-10-24");
  // Guidance is timeless; the observation is written in the past and dated.
  assert.doesNotMatch(notice.guidance, /cerrad|2026|está/i);
  assert.match(notice.observation, /^En la consulta del 24 de octubre de 2026, /);
  assert.doesNotMatch(notice.observation, /\b(está|permanece|no está disponible)\b/i);
  const garganta = iguazu.sections.flatMap(s => s.paragraphs).filter(p => /Garganta del Diablo/.test(p));
  assert.equal(garganta.length, 1);
  assert.doesNotMatch(garganta[0], /cerrad|retirad|reapertura|disponible/i);
  assert.ok(iguazu.editorial.pendingReviews.some(p => /Reverificar.*Garganta del Diablo/.test(p)));
  assert.equal(tripPublishable(iguazu), false);
  assert.ok(validateTrip({...iguazu, status: "approved", publicationAuthorized: true, review: {reviewer: "synthetic-test-only", date: "2026-12-01", contentSha256: tripContentHash(iguazu)}}).some(e => /re-verified/.test(e)));
});

test("withheld notice guidance and observation are caught by the public artifact audit", async t => {
  const dir = await mkdtemp(join(tmpdir(), "aus-notice-audit-")); t.after(() => rm(dir,{recursive: true, force: true}));
  const trips = await readEditorialTrips(new URL("../", import.meta.url).pathname);
  const [notice] = trips.find(t => t.slug === "puerto-iguazu").operationalNotices;
  await writeFile(join(dir, "a.js"), JSON.stringify({text: notice.observation}));
  await writeFile(join(dir, "b.html"), "<p>" + notice.guidance + "</p>");
  const files = (await auditPublicArtifact(dir, trips)).errors.filter(e => e.rule.startsWith("withheld-content")).map(e => e.file).sort();
  assert.deepEqual(files, ["a.js", "b.html"]);
});
