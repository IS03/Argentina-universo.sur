import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gzipSync, brotliCompressSync } from "node:zlib";
import { auditPublicArtifact, assertPublicArtifact, copyTrackedInputs, readEditorialTrips, preparePublicTripInputs } from "../scripts/pages/editorial-security.mjs";
import { tripContentHash, publishedTripProjection } from "../lib/pages/trips.ts";
const draft = {
  id: "TEST-WITHHELD-EDITORIAL-RECORD", slug: "withheld-trip", title: "Título confidencial de una ficha de prueba",
  destination: "Destino de prueba", province: "Provincia de prueba", description: "Descripción inédita de la ficha sintética, nunca autorizada.",
  status: "draft", publicationAuthorized: false, review: null,
  sections: [{title: "Sección", paragraphs: ["Párrafo privado sintético que jamás debe viajar en un artefacto público."], sourceIds: ["source"]}],
  sources: [{id: "source", title: "Fuente pública", url: "https://example.org", checkedAt: "2026-10-24"}],
  address: "", mapUrl: "https://example.org", related: [],
};
async function temporary(t) {
  const dir = await mkdtemp(join(tmpdir(), "aus-editorial-security-"));
  t.after(() => rm(dir, {recursive: true, force: true}));
  return dir;
}

test("publication projection rejects drafts, missing review, stale approval and denied permission", () => {
  const approved = {...draft, status: "approved", publicationAuthorized: true,
    review: {reviewer: "synthetic-test-only", date: "2026-10-24", contentSha256: tripContentHash(draft)}};
  for (const invalid of [draft, {...approved, review: null}, {...approved, publicationAuthorized: false}, {...approved, title: "Unreviewed change"}])
    assert.throws(() => publishedTripProjection(invalid), /approval/);
  assert.equal(publishedTripProjection(approved).title, draft.title);
});

test("approved projection strips private import and review fields recursively", () => {
  const record = structuredClone(draft);
  record.original_payload = {private: "AUS_PRIVATE_MASTER_CANARY"};
  record.authorization = {contact: "private@example.org"};
  record.sources[0].privateEvidence = "AUS_PRIVATE_MASTER_CANARY";
  record.sections[0].internalNote = "AUS_PRIVATE_MASTER_CANARY";
  record.related = [{href: "/provincias", label: "Provincias", privateNote: "AUS_PRIVATE_MASTER_CANARY"}];
  record.status = "approved"; record.publicationAuthorized = true;
  record.review = {reviewer: "synthetic-test-only", date: "2026-10-24", contentSha256: tripContentHash(record)};
  const projected = publishedTripProjection(record);
  assert.deepEqual(Object.keys(projected).sort(), ["id","slug","title","destination","province","description","sources","sections","address","mapUrl","related"].sort());
  assert.doesNotMatch(JSON.stringify(projected), /CANARY|original_payload|authorization|private|reviewer|contentSha256/);
});

test("all unpublished records are rejected in exported HTML, RSC, JS, maps and compressed assets", async (t) => {
  const root = await temporary(t);
  const encoded = draft.title.split("").map(c => "&#" + c.charCodeAt(0) + ";").join("");
  const fixtures = {
    "index.html": `<html>${encoded}</html>`,
    "index.txt": JSON.stringify({description: draft.description}),
    "chunk.js": `const id=${JSON.stringify(draft.id)};`,
    "chunk.js.map": JSON.stringify({sourcesContent: [draft.sections[0].paragraphs[0]]}),
    "index.html.gz": gzipSync(draft.description),
    "chunk.js.br": brotliCompressSync(draft.id),
    "route.json": JSON.stringify({url: "/escapadas/withheld-trip"}).replaceAll("/", "\\u002f"),
  };
  for (const [name, text] of Object.entries(fixtures)) {
    const dir = join(root, name); await mkdir(dir); await writeFile(join(dir, name), text);
    const report = await auditPublicArtifact(dir, [draft]);
    assert.ok(report.errors.some(e => e.rule.startsWith("withheld-")), name);
    await assert.rejects(assertPublicArtifact(dir, [draft]), /security audit failed/);
    // Error reports identify rules/files only, never dump private text.
    assert.ok(!JSON.stringify(report).includes(draft.title));
  }
});

test("draft route files and historical review prototypes fail even without any draft text", async (t) => {
  const root = await temporary(t);
  for (const path of ["escapadas/withheld-trip.html", "escapadas/withheld-trip/index.html", "escapadas/withheld-trip.txt", "prototipo-pr10/escapadas/el-palmar.html"]) {
    await mkdir(join(root, path, ".."), {recursive: true}); await writeFile(join(root, path), "empty");
  }
  assert.equal((await auditPublicArtifact(root, [draft])).errors.length, 4);
});

test("Google Sheets snapshots, original payloads and source workbooks cannot ship", async (t) => {
  const root = await temporary(t);
  for (const [name, content] of Object.entries({
    "api-payload": '{"original_payload":{"private":"canary"}}',
    "payload.json": '{"original_payload":{"aprobacion_humana":"pending"}}',
    "index.html": '<script>{"spreadsheetId":"private","tables":{}}</script>',
    "import.js": "AUS_PRIVATE_MASTER_CANARY_TEST_ONLY",
    "master-snapshot.json": "{}", "private.xlsx": "binary-test-only",
  })) await writeFile(join(root, name), content);
  assert.equal(new Set((await auditPublicArtifact(root, [])).errors.map(e => e.file)).size, 6);
});

test("tracked-only build inputs leave untracked public snapshots and local files out", async (t) => {
  const root = await temporary(t), out = await temporary(t);
  await mkdir(join(root, "public"));
  await writeFile(join(root, "public/index.html"), "public");
  await writeFile(join(root, "public/master-snapshot.json"), "AUS_PRIVATE_MASTER_CANARY");
  await mkdir(join(root, "content/escapadas"), {recursive: true});
  await writeFile(join(root, "content/escapadas/index.ts"), "// tracked catalog");
  await writeFile(join(root, "content/escapadas/untracked.json"), JSON.stringify(draft));
  await copyTrackedInputs(root, out, ["public/index.html", "content/escapadas/index.ts"]);
  assert.deepEqual(await readEditorialTrips(out), []);
  // Only the public subtree is an upload candidate; server-only catalog code is not one.

  assert.equal(await readFile(join(out, "public/index.html"), "utf8"), "public");
  await assert.rejects(readFile(join(out, "public/master-snapshot.json")), {code: "ENOENT"});
  assert.deepEqual((await assertPublicArtifact(join(out, "public"), [])).errors, []);
});

test("safe public HTML passes while actual editorial drafts remain unapproved", async (t) => {
  const root = await temporary(t);
  await writeFile(join(root, "index.html"), "<h1>Actividades de Argentina</h1>");
  const trips = await readEditorialTrips(new URL("../", import.meta.url).pathname);
  assert.ok(trips.length);
  assert.deepEqual((await assertPublicArtifact(root, trips)).errors, []);
  const palmar = trips.find(t => t.slug === "el-palmar");
  assert.equal(palmar.status, "draft"); assert.equal(palmar.review, null);
});


test("zero approved trips removes the isolated dynamic route; approved synthetic content keeps it", async (t) => {
  for (const approved of [false, true]) {
    const source = await temporary(t);
    await mkdir(join(source, "app/escapadas/[slug]"), {recursive: true});
    await mkdir(join(source, "content/escapadas"), {recursive: true});
    await writeFile(join(source, "app/escapadas/[slug]/page.tsx"), "original route");
    await writeFile(join(source, "content/escapadas/draft.json"), JSON.stringify(draft));
    const candidate = {...draft, status: "approved", publicationAuthorized: true,
      review: {reviewer: "synthetic-test-only", date: "2026-10-24", contentSha256: tripContentHash(draft)}};
    assert.equal(await preparePublicTripInputs(source, [approved ? candidate : draft]), approved ? 1 : 0);
    const index = await readFile(join(source, "content/escapadas/index.ts"), "utf8");
    assert.equal(index.includes(draft.id), approved);
    assert.doesNotMatch(index, /reviewer|contentSha256|publicationAuthorized/);
    await assert.rejects(readFile(join(source, "content/escapadas/draft.json")), {code: "ENOENT"});
    if (approved) assert.equal(await readFile(join(source, "app/escapadas/[slug]/page.tsx"), "utf8"), "original route");
    else await assert.rejects(readFile(join(source, "app/escapadas/[slug]/page.tsx")), {code: "ENOENT"});
  }
});
