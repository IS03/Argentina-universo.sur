import { readdir, stat, writeFile, mkdir, rename } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { scratch } from "./prepare.mjs";
export async function inspectAssets(directory) {
  const files = [];
  async function walk(dir) {
    for (const d of await readdir(dir, { withFileTypes: true })) {
      const p = join(dir, d.name);
      if (d.isDirectory()) await walk(p);
      else if (d.isFile())
        files.push({
          path: relative(directory, p),
          bytes: (await stat(p)).size,
        });
    }
  }
  await walk(directory);
  return {
    files: files.length,
    totalBytes: files.reduce((n, f) => n + f.bytes, 0),
    maxAssetBytes: 25 * 1024 * 1024,
    oversized: files.filter((f) => f.bytes > 25 * 1024 * 1024),
    withinFileCount: files.length <= 20000,
    deploymentAuthorized: false,
  };
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  if (
    !["static", "worker"].includes(process.argv[2]) ||
    process.argv.slice(3).some((a) => a !== "--quarantine-pdf-copies")
  )
    throw Error(
      "Use static or worker, with optional --quarantine-pdf-copies for worker only",
    );
  const directory = join(
    scratch,
    process.argv[2] === "worker" ? "vinext/dist/client" : "static/out",
  );
  const report = await inspectAssets(directory);
  await mkdir(join(scratch, "reports"), { recursive: true });
  await writeFile(
    join(scratch, "reports", `assets-${process.argv[2] || "static"}.json`),
    JSON.stringify(report, null, 2) + "\n",
  );
  if (process.argv.includes("--quarantine-pdf-copies")) {
    if (
      !directory.startsWith(resolve(scratch)) ||
      !directory.endsWith("vinext/dist/client")
    )
      throw Error("Refusing a non-prototype path");
    const target = join(scratch, "quarantine", "worker-" + Date.now());
    await mkdir(target, { recursive: true });
    await rename(join(directory, "pdf"), join(target, "pdf"));
    console.log(
      JSON.stringify({
        quarantinedCopies: target,
        reason: "Local execution only. Missing PDF URLs block any migration.",
        deploymentAuthorized: false,
      }),
    );
  }
  console.log(JSON.stringify(report, null, 2));
}
