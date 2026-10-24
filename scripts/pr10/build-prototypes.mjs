// Local builds only. No Cloudflare login, resource creation, upload, domain or deploy step.
import { prepare, root, scratch } from "./prepare.mjs";
import { optimize } from "./images.mjs";
import { cp, readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { createWriteStream, constants } from "node:fs";
if (process.argv.slice(2).some((a) => a !== "--reuse-installed"))
  throw Error(
    "Only local --reuse-installed is supported; no remote/deploy mode.",
  );
const logDir = join(scratch, "logs");
await mkdir(logDir, { recursive: true });
const env = {
  ...process.env,
  NEXT_TELEMETRY_DISABLED: "1",
  WRANGLER_SEND_METRICS: "false",
  VERCEL_ENV: "production",
  NEXT_PUBLIC_GA_ID: "G-PRUEBA0001",
};
async function run(label, command, args, cwd = root, extra = {}) {
  console.log("Local build:", label);
  const log = createWriteStream(join(logDir, label + ".log"));
  const child = spawn(command, args, {
    cwd,
    env: { ...env, ...extra },
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout.pipe(log);
  child.stderr.pipe(log);
  const code = await new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("exit", resolve);
  });
  log.end();
  if (code !== 0)
    throw Error(
      `${label} failed (${code}); inspect .artifacts/pr10/logs/${label}.log`,
    );
}
const baseline = await prepare("baseline");
const bc = join(baseline, "next.config.ts");
await writeFile(
  bc,
  (await readFile(bc, "utf8")).replace(
    "root: process.cwd()",
    `root: ${JSON.stringify(root)}`,
  ),
);
await run(
  "baseline",
  process.execPath,
  [join(root, "node_modules/next/dist/bin/next"), "build"],
  baseline,
  { NEXT_PUBLIC_GA_ID: "" },
);
await optimize({ full: true });
const stat = await prepare("static");
await run("adapt-static", process.execPath, [
  "--experimental-strip-types",
  join(root, "scripts/pr10/adapt-static.mjs"),
]);
await run(
  "static-external",
  process.execPath,
  [join(root, "node_modules/next/dist/bin/next"), "build"],
  stat,
  { NEXT_PUBLIC_PR10_IMAGE_ORIGIN: "http://127.0.0.1:4302" },
);
await cp(join(stat, "out"), join(stat, "out-external"), {
  recursive: true,
  mode: constants.COPYFILE_FICLONE,
});
await run(
  "static-colocated",
  process.execPath,
  [join(root, "node_modules/next/dist/bin/next"), "build"],
  stat,
  { NEXT_PUBLIC_PR10_IMAGE_ORIGIN: "" },
);
await run(
  "static-typecheck",
  process.execPath,
  [join(root, "node_modules/typescript/bin/tsc"), "--noEmit"],
  stat,
);
await run("asset-audit-static", process.execPath, [
  join(root, "scripts/pr10/asset-guard.mjs"),
  "static",
]);
const worker = await prepare("vinext", { isolatedDependencies: true });
for (const [source, destination] of [
  ["vinext-package.json", "package.json"],
  ["vinext-package-lock.json", "package-lock.json"],
  ["overrides/worker.vite.config.ts.template", "vite.config.ts"],
  ["overrides/wrangler.json.template", "wrangler.jsonc"],
])
  await cp(join(root, "scripts/pr10", source), join(worker, destination));
if (!process.argv.includes("--reuse-installed"))
  await run("vinext-install", "npm", ["ci"], worker);
await run("adapt-worker", process.execPath, [
  join(root, "scripts/pr10/adapt-worker.mjs"),
]);
await run("worker", join(worker, "node_modules/.bin/vite"), ["build"], worker);
await run(
  "worker-typecheck",
  process.execPath,
  [join(worker, "node_modules/typescript/bin/tsc"), "--noEmit"],
  worker,
);
await run("asset-audit-worker", process.execPath, [
  join(root, "scripts/pr10/asset-guard.mjs"),
  "worker",
  "--quarantine-pdf-copies",
]);
await run(
  "worker-dry-run",
  join(worker, "node_modules/.bin/wrangler"),
  [
    "deploy",
    "--dry-run",
    "--config",
    "dist/server/wrangler.json",
    "--outdir",
    join(scratch, "worker-bundle"),
  ],
  worker,
);
console.log(
  "Local prototypes built. PDF/hosting/legal gates remain unresolved; NOT authorized for deployment.",
);
