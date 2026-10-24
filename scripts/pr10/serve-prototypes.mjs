import { spawn } from "node:child_process";
import { join } from "node:path";
import { createServer } from "node:net";
import { root, scratch } from "./prepare.mjs";
const definitions = [
  {
    port: 4300,
    cwd: root,
    cmd: process.execPath,
    args: [
      join(root, "node_modules/next/dist/bin/next"),
      "start",
      join(scratch, "baseline"),
      "--hostname",
      "127.0.0.1",
      "--port",
      "4300",
    ],
  },
  {
    port: 4301,
    cwd: root,
    cmd: process.execPath,
    args: [
      join(root, "scripts/pr10/serve-static.mjs"),
      join(scratch, "static/out"),
      "4301",
    ],
  },
  {
    port: 4302,
    cwd: root,
    cmd: process.execPath,
    args: [
      join(root, "scripts/pr10/serve-static.mjs"),
      join(scratch, "images"),
      "4302",
    ],
  },
  {
    port: 4305,
    cwd: root,
    cmd: process.execPath,
    args: [
      join(root, "scripts/pr10/serve-static.mjs"),
      join(scratch, "static/out-external"),
      "4305",
    ],
  },
  {
    port: 4304,
    cwd: join(scratch, "vinext"),
    cmd: join(scratch, "vinext/node_modules/.bin/wrangler"),
    args: [
      "dev",
      "--local",
      "--config",
      "dist/server/wrangler.json",
      "--port",
      "4304",
      "--ip",
      "127.0.0.1",
      "--inspector-port",
      "9234",
      "--show-interactive-dev-session=false",
      "--log-level",
      "error",
    ],
  },
];
// Fail rather than attaching to an unrelated application occupying a local port.
for (const d of definitions)
  await new Promise((resolve, reject) => {
    const s = createServer();
    s.once("error", reject);
    s.listen(d.port, "127.0.0.1", () => s.close(resolve));
  });
const children = definitions.map((d) =>
  spawn(d.cmd, d.args, {
    cwd: d.cwd,
    env: {
      ...process.env,
      WRANGLER_SEND_METRICS: "false",
      NEXT_TELEMETRY_DISABLED: "1",
    },
    stdio: ["pipe", "inherit", "inherit"],
  }),
);
const stop = () => {
  for (const c of children) c.kill("SIGTERM");
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
for (const c of children)
  c.on("exit", (code) => {
    if (code) {
      stop();
      process.exitCode = code;
    }
  });
console.log(
  "Only local servers: 4300 Next, 4301 static, 4302 image-origin simulation, 4304 workerd, 4305 static+external images. No tunnels or remote mode.",
);
