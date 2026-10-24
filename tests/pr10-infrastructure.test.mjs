import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, truncate, writeFile, rm, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { inspectAssets } from "../scripts/pr10/asset-guard.mjs";
import { estimateTraffic } from "../scripts/pr10/traffic.mjs";
import { prepare } from "../scripts/pr10/prepare.mjs";
import { staticServer } from "../scripts/pr10/serve-static.mjs";

test("Cloudflare asset gate catches an oversized PDF while allowing exactly 25 MiB", async () => {
  const dir = await mkdtemp(join(tmpdir(), "aus-pr10-assets-"));
  try {
    for (const name of ["limit.pdf", "oversized.pdf"])
      await writeFile(join(dir, name), "");
    await truncate(join(dir, "limit.pdf"), 25 * 1024 * 1024);
    await truncate(join(dir, "oversized.pdf"), 25 * 1024 * 1024 + 1);
    const report = await inspectAssets(dir);
    assert.deepEqual(
      report.oversized.map((f) => f.path),
      ["oversized.pdf"],
    );
    assert.equal(report.deploymentAuthorized, false);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
test("request accounting distinguishes static delivery, daily bursts and unknown CPU", () => {
  const normal = estimateTraffic(10000);
  assert.equal(normal.staticArchitecture.dynamicRequests, 0);
  assert.equal(normal.workersArchitecture.dynamicRequests, 60000);
  const burst = estimateTraffic(100000);
  assert.equal(burst.workersArchitecture.peakDynamicPerDay, 200000);
  assert.equal(burst.workersArchitecture.dailyRequestLimitExceeded, true);
  assert.equal(normal.workersArchitecture.cpuAndMemoryFit, "UNVERIFIED");
  assert.throws(() => estimateTraffic(100, { pdfDownloadRate: 2 }));
  assert.throws(() => estimateTraffic(100, { dynamicRequestsPerPage: 26 }));
});
test("prototype preparation refuses an arbitrary target before accessing the filesystem", async () => {
  await assert.rejects(prepare("../../"), /Unknown isolated prototype/);
});
test("static host preserves alias query and does not fake server filtering or successful missing PDFs", async () => {
  const dir = await mkdtemp(join(tmpdir(), "aus-pr10-static-"));
  let server;
  try {
    await mkdir(join(dir, "actividades"));
    await writeFile(
      join(dir, "actividades/index.html"),
      "<h1>All approved static content</h1>",
    );
    await writeFile(
      join(dir, "404.html"),
      '<meta name="robots" content="noindex">',
    );
    server = staticServer(dir);
    await new Promise((r) => server.listen(0, "127.0.0.1", r));
    const origin = `http://127.0.0.1:${server.address().port}`;
    const alias = await fetch(origin + "/provincias/catarmaca?origen=legado", {
      redirect: "manual",
    });
    assert.equal(alias.status, 308);
    assert.equal(
      alias.headers.get("location"),
      "/provincias/catamarca?origen=legado",
    );
    assert.equal(
      await (await fetch(origin + "/actividades?provincia=santa_fe")).text(),
      await (await fetch(origin + "/actividades")).text(),
    );
    assert.equal((await fetch(origin + "/pdf/missing.pdf")).status, 404);
  } finally {
    if (server) await new Promise((r) => server.close(r));
    await rm(dir, { recursive: true, force: true });
  }
});
