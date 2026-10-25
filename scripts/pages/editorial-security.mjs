import { cp, lstat, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { brotliDecompressSync, gunzipSync } from "node:zlib";
import { tripPublishable, publishedTripProjection, validateTrip } from "../../lib/pages/trips.ts";

export async function readEditorialTrips(root) {
  const directory = join(root, "content/escapadas");
  const trips = [];
  for (const name of (await readdir(directory)).sort())
    if (name.endsWith(".json"))
      {
        const trip = JSON.parse(await readFile(join(directory, name), "utf8"));
        const errors = validateTrip(trip);
        if (errors.length) throw Error("Invalid editorial input " + name + ": " + errors.join("; "));
        trips.push(trip);
      }
  return trips;
}

// Operates only on the isolated build clone, never the repository content or approval records.
export async function preparePublicTripInputs(source, trips) {
  const published = trips.filter(tripPublishable).map(publishedTripProjection);
  const directory = join(source, "content/escapadas");
  await rm(directory, {recursive: true, force: true});
  await mkdir(directory, {recursive: true});
  await writeFile(join(directory, "index.ts"),
    'import "server-only";\nimport type {PublishedTrip} from "@/lib/pages/trips";\n' +
    'export const publishedTrips: PublishedTrip[] = ' + JSON.stringify(published) + ';\n');
  // Next export requires >=1 param per dynamic route. Zero approved trips means no detail route.
  if (!published.length)
    await rm(join(source, "app/escapadas/[slug]"), {recursive: true, force: true});
  return published.length;
}

// git's explicit input list prevents untracked snapshots, local reviews and credentials being copied.
export async function copyTrackedInputs(root, destination, files) {
  for (const file of files) {
    if (file.startsWith("/") || file.split("/").includes(".."))
      throw Error("Invalid build input path");
    if (!(await lstat(join(root, file))).isFile())
      throw Error("Build inputs must be regular tracked files: " + file);
    await mkdir(dirname(join(destination, file)), { recursive: true });
    await cp(join(root, file), join(destination, file));
  }
}

function normalize(value) {
  // Cover HTML entities, embedded JSON/RSC escapes and URL-encoded copies, without evaluating code.
  for (let i = 0; i < 3; i++) {
    value = value
      .replace(/\\u([\da-f]{4})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
      .replace(/\\x([\da-f]{2})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
      .replace(/\\\//g, "/")
      .replace(/&#(x[\da-f]+|\d+);/gi, (entity, code) => {
        const n = code[0].toLowerCase() === "x" ? parseInt(code.slice(1), 16) : Number(code);
        return n <= 0x10ffff ? String.fromCodePoint(n) : entity;
      })
      .replace(/&(quot|apos|amp|lt|gt|nbsp);/g, (_, key) => ({quot:'"',apos:"'",amp:"&",lt:"<",gt:">",nbsp:" "})[key]);
    value = value.replace(/(?:%[\da-f]{2})+/gi, (encoded) => {
      try { return decodeURIComponent(encoded); } catch { return encoded; }
    });
  }
  return value.normalize("NFC");
}
const privateMarkers = /1fwed8poUbIaLBnMLJta5WkyAnYg_SFc453m-wl3aB1w|spreadsheetId|original_payload|originalPayload|dictamen_publicacion|aprobacion_humana|permiso_publicacion|practica_trazabilidad|practica_campos_permitidos|practica_exclusiones|componentes_condicionados_ids|AUS_PRIVATE_MASTER_CANARY|masterRefs|pendingReviews|documentaryStatus|retirementApproval|scopeReview|restorationVerified/i;
const privatePath = /(?:^|\/)(?:\.env(?:\.|$)|master[-_]snapshot|previous[-_]snapshot|import[-_]plan|original_payload|content\/escapadas|\.artifacts\/)|\.(?:xlsx?|csv|tsv)$/i;
// Scan every non-media file, including extensionless static API responses and unknown auxiliaries.
const binaryMedia = /\.(?:avif|gif|ico|jpe?g|png|webp|woff2?|ttf|otf|pdf|mp3|mp4|mov|webm)$/i;

// `include` narrows a mixed build directory (Next's .next) to the files it serves publicly.
export async function auditPublicArtifact(directory, trips, {include = () => true} = {}) {
  const withheld = trips.filter((trip) => !tripPublishable(trip));
  const needles = withheld.flatMap((trip, index) => [
    { label: `withheld-route-${index + 1}`, value: "/escapadas/" + trip.slug },
    ...[trip.id, trip.title, trip.description, ...trip.sections.flatMap((s) => s.paragraphs)]
      .filter((value) => typeof value === "string" && value.length >= 20)
      .map((value) => ({label: `withheld-content-${index + 1}`, value: normalize(value)})),
  ]);
  const errors = [];
  const counts = {files: 0, textFiles: 0, html: 0, rsc: 0, javascript: 0};
  async function walk(dir) {
    for (const entry of await readdir(dir, {withFileTypes: true})) {
      const path = join(dir, entry.name), name = relative(directory, path).replaceAll("\\", "/");
      if (entry.isSymbolicLink()) {
        errors.push({file: name, rule: "public-symlink"});
        continue;
      }
      if (entry.isDirectory()) { await walk(path); continue; }
      if (!include(name)) continue;
      counts.files++;
      const normalizedPath = normalize("/" + name);
      if (privatePath.test(name)) errors.push({file: name, rule: "private-input-path"});
      // PR10's review prototype must never become a public review environment.
      if (normalizedPath.includes("/prototipo-pr10/")) errors.push({file: name, rule: "review-prototype"});
      for (const needle of needles.filter((n) => n.label.startsWith("withheld-route")))
        if (normalizedPath === needle.value || normalizedPath.startsWith(needle.value + ".") || normalizedPath.startsWith(needle.value + "/"))
          errors.push({file: name, rule: needle.label});
      const plainName = name.replace(/\.(?:gz|br)$/i, "");
      if (binaryMedia.test(plainName)) continue;
      counts.textFiles++;
      if (/\.html?$/.test(plainName)) counts.html++;
      if (/\.txt$/.test(plainName)) counts.rsc++;
      if (/\.[cm]?js$/.test(plainName)) counts.javascript++;
      let bytes = await readFile(path);
      if (name.endsWith(".gz")) bytes = gunzipSync(bytes);
      if (name.endsWith(".br")) bytes = brotliDecompressSync(bytes);
      const text = normalize(bytes.toString("utf8"));
      if (privateMarkers.test(text)) errors.push({file: name, rule: "private-master-data"});
      if (text.includes("/prototipo-pr10/escapadas/")) errors.push({file: name, rule: "review-prototype"});
      for (const needle of needles)
        if (text.includes(needle.value)) errors.push({file: name, rule: needle.label});
    }
  }
  await walk(directory);
  // Findings deliberately contain no excerpts, private payloads or record IDs.
  return { ...counts, withheldRecords: withheld.length, errors, remoteMasterAccessed: false };
}

export async function assertPublicArtifact(directory, trips, options) {
  const report = await auditPublicArtifact(directory, trips, options);
  if (report.errors.length) throw Error("Editorial security audit failed: " + JSON.stringify(report.errors));
  return report;
}
