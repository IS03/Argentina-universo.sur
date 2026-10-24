import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  legacyFilterDestination,
  cloudflareFilterRules,
} from "../lib/pages/legacy-filter.ts";
import { idMedicionGA } from "../lib/analytics.ts";
import {
  validateTrip,
  tripPublishable,
  tripContentHash,
} from "../lib/pages/trips.ts";
test("Pages production opt-in never enables GA in a preview or without the configured production branch", () => {
  const prod = {
    AUS_STATIC_EXPORT: "1",
    SITE_ENV: "production",
    CF_PAGES: "1",
    CF_PAGES_BRANCH: "main",
    SITE_PRODUCTION_BRANCH: "main",
    NEXT_PUBLIC_GA_ID: "G-PRUEBA0001",
  };
  assert.equal(idMedicionGA(prod), "G-PRUEBA0001");
  for (const env of [
    { ...prod, SITE_ENV: "preview" },
    { ...prod, CF_PAGES_BRANCH: "feature" },
    { ...prod, SITE_PRODUCTION_BRANCH: "" },
    { ...prod, VERCEL_ENV: "preview" },
    {},
  ])
    assert.equal(idMedicionGA(env), null);
});
test("legacy redirects preserve query, aliases, first parameter and never loop", () => {
  for (const [url, expected] of [
    [
      "/actividades?provincia=santa_fe",
      "/actividades/por-provincia/santa_fe?provincia=santa_fe",
    ],
    [
      "/actividades?provincia=catarmaca",
      "/actividades/por-provincia/catamarca?provincia=catarmaca",
    ],
    [
      "/actividades?provincia=no-existe",
      "/actividades/por-provincia/sin-resultados?provincia=no-existe",
    ],
  ]) {
    assert.equal(legacyFilterDestination(url), expected);
    assert.equal(legacyFilterDestination(expected), null);
  }
  assert.equal(legacyFilterDestination("/actividades?provincia="), null);
  assert.equal(
    legacyFilterDestination(
      "/actividades?provincia=santa_fe&provincia=cordoba",
    ),
    "/actividades/por-provincia/santa_fe?provincia=santa_fe&provincia=cordoba",
  );
  assert.equal(cloudflareFilterRules().length, 3);
});
test("trip evidence is linked and a researched draft cannot publish by changing one flag", async () => {
  const trip = JSON.parse(
    await readFile(
      new URL("../content/escapadas/el-palmar.json", import.meta.url),
    ),
  );
  assert.deepEqual(validateTrip(trip), []);
  assert.equal(tripPublishable(trip), false);
  assert.equal(
    tripPublishable({ ...trip, publicationAuthorized: true }),
    false,
  );
  assert.ok(
    validateTrip({ ...trip, sections: [{ sourceIds: ["MISSING"] }] }).length,
  );
});

test("an approval is bound to the exact reviewed content, not reusable after an edit", async () => {
  const trip = JSON.parse(
    await readFile(
      new URL("../content/escapadas/el-palmar.json", import.meta.url),
    ),
  );
  const approved = {
    ...trip,
    status: "approved",
    publicationAuthorized: true,
    review: {
      reviewer: "human-test-fixture",
      date: "2026-10-24",
      contentSha256: tripContentHash(trip),
    },
  };
  assert.equal(tripPublishable(approved), true);
  assert.equal(
    tripPublishable({ ...approved, title: approved.title + " changed" }),
    false,
  );
});
