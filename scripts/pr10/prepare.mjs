// Copies tracked application inputs only. Never copies .env, publicidad, credentials or .git.
import { cp, mkdir, symlink, rm, readdir } from "node:fs/promises";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { constants } from "node:fs";
export const root = fileURLToPath(new URL("../../", import.meta.url));
export const scratch = join(root, ".artifacts/pr10");
export async function prepare(name, { isolatedDependencies = false } = {}) {
  if (!["static", "vinext", "baseline"].includes(name))
    throw Error("Unknown isolated prototype");
  const target = join(scratch, name);
  await mkdir(target, { recursive: true });
  for (const entry of await readdir(target))
    if (entry !== "node_modules")
      await rm(join(target, entry), { recursive: true, force: true });
  const files = execFileSync("git", ["ls-files", "-z"], {
    cwd: root,
    encoding: "utf8",
  })
    .split("\0")
    .filter((p) =>
      /^(app\/|components\/|lib\/|public\/|package(-lock)?\.json$|tsconfig\.json$|next.config.ts$|postcss.config.mjs$)/.test(
        p,
      ),
    );
  for (const file of files) {
    await mkdir(resolve(target, file, ".."), { recursive: true });
    await cp(join(root, file), join(target, file), {
      mode: constants.COPYFILE_FICLONE,
    });
  }
  if (!isolatedDependencies) {
    await rm(join(target, "node_modules"), { recursive: true, force: true });
    await symlink(
      join(root, "node_modules"),
      join(target, "node_modules"),
      "dir",
    );
  }
  return target;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const name = process.argv[2];
  console.log(await prepare(name, { isolatedDependencies: name === "vinext" }));
}
