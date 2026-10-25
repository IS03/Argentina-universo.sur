import { readFile, readdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import {
  validateTripAsOf,
  buildDate,
  tripPublishable,
  tripContentHash,
} from "../../lib/pages/trips.ts";
const dir = new URL("../../content/escapadas/", import.meta.url);
const trips = [];
for (const name of await readdir(dir))
  if (name.endsWith(".json")) {
    const trip = JSON.parse(await readFile(new URL(name, dir), "utf8"));
    const errors = validateTripAsOf(trip, buildDate());
    if (errors.length) throw Error(name + ": " + errors.join("; "));
    trips.push(trip);
  }
for (const key of ["id", "slug"])
  if (new Set(trips.map((t) => t[key])).size !== trips.length)
    throw Error("Duplicate trip " + key);
const matrix = JSON.parse(
  await readFile(
    new URL("../../docs/pr10/pdf-matrix.json", import.meta.url),
    "utf8",
  ),
);
const rows = [];
for (const row of matrix) {
  const raw = await readFile(
    new URL("../../public" + row.path, import.meta.url),
  );
  if (createHash("sha256").update(raw).digest("hex") !== row.sha256)
    throw Error("Original PDF changed: " + row.path);
  rows.push({
    id: row.id,
    pdf: row.path,
    bytes: row.bytes,
    sha256: row.sha256,
    suggestedHtml: row.suggestedUrl,
    replacementApproved: false,
    backupVerified: false,
    redirectApproved: false,
    status: "pending-human-review",
  });
}
const report = {
  master:
    "Existing Google Sheets remains authoritative; no researched record imported or approved.",
  drafts: trips.map((t) => ({
    id: t.id,
    slug: t.slug,
    contentSha256: tripContentHash(t),
    publishable: tripPublishable(t),
    sourceIds: t.sources.map((s) => s.id),
  })),
  pdfs: rows,
  note: "El Palmar is an additional destination draft, not an equivalent replacement for the entire Entre Ríos PDF.",
};
if (process.argv.includes("--report"))
  await writeFile(
    new URL("../../docs/pr11/content-plan.json", import.meta.url),
    JSON.stringify(report, null, 2) + "\n",
  );
console.log(
  `Trips valid: ${trips.length}; publishable: ${trips.filter(tripPublishable).length}. Original PDFs intact: ${rows.length}. No retirement or redirect authorized.`,
);
