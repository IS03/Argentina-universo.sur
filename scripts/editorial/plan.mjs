import { readFile } from "node:fs/promises";
import { planPdfRetirement } from "../../lib/pages/pdf-retirement.ts";
import { readEditorialTrips } from "../pages/editorial-security.mjs";
const rows = JSON.parse(await readFile(new URL("../../docs/pr12/pdf-replacements.json", import.meta.url), "utf8"));
const trips = await readEditorialTrips(process.cwd());
const plans = rows.map(row => planPdfRetirement(row, trips.find(trip => row.proposedHtml === "/escapadas/" + trip.slug)));
console.log(JSON.stringify({mode: "dry-run", publicWrites: 0, activeRedirects: [], plans}, null, 2));
