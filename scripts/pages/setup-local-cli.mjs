// Installs pinned local verification tooling only. Never logs in or creates Cloudflare resources.
import { mkdir, cp } from "node:fs/promises";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
const root = fileURLToPath(new URL("../../", import.meta.url)),
  dir = join(root, ".artifacts/pages/tooling");
await mkdir(dir, { recursive: true });
for (const [from, to] of [
  ["tooling-package.json", "package.json"],
  ["tooling-package-lock.json", "package-lock.json"],
  ["wrangler.template.jsonc", "wrangler.jsonc"],
])
  await cp(join(root, "scripts/pages", from), join(dir, to));
await new Promise((resolve, reject) => {
  const p = spawn("npm", ["ci"], { cwd: dir, stdio: "inherit" });
  p.on("error", reject);
  p.on("exit", (c) =>
    c ? reject(Error("Local CLI install failed")) : resolve(),
  );
});
console.log(
  "Local CLI ready. Run from .artifacts/pages/tooling: WRANGLER_SEND_METRICS=false npx wrangler pages dev --port 4410. No remote operation was performed.",
);
