import { defineConfig, devices } from "@playwright/test";
import path from "node:path";
const root = path.resolve(import.meta.dirname, "../..");
export default defineConfig({
  testDir: path.join(root, ".artifacts/pages/e2e"),
  workers: 3,
  retries: 0,
  timeout: 30000,
  reporter: [
    ["list"],
    [
      "json",
      { outputFile: path.join(root, ".artifacts/pages/reports/browser.json") },
    ],
  ],
  outputDir: path.join(root, ".artifacts/pages/traces"),
  use: { trace: "retain-on-failure" },
  projects: [...["escritorio", "movil"].flatMap((d) => [
    {
      name: "static-" + d,
      metadata: { publicExport: true },
      testMatch: ["legacy.spec.ts", "static.spec.ts", "destinations.spec.ts", "publicidad.spec.ts"],
      use: {
        ...(d === "movil" ? devices["Pixel 7"] : devices["Desktop Chrome"]),
        channel: "chrome",
        baseURL: "http://127.0.0.1:4401",
      },
    },
    {
      name: "wrangler-" + d,
      testMatch: "cloudflare-local.spec.ts",
      use: {
        ...(d === "movil" ? devices["Pixel 7"] : devices["Desktop Chrome"]),
        channel: "chrome",
        baseURL: "http://127.0.0.1:4410",
      },
    },
    {
      name: "consent-" + d,
      testMatch: "consent.spec.ts",
      use: {
        ...(d === "movil" ? devices["Pixel 7"] : devices["Desktop Chrome"]),
        channel: "chrome",
        baseURL: "https://www.argentinauniversosur.com",
      },
    },
  ]), ...(process.env.AUS_WEBKIT === "1" ? [{
    name: "static-iphone-safari", metadata: { publicExport: true }, testMatch: "publicidad.spec.ts",
    use: { ...devices["iPhone 13"], browserName: "webkit" as const, baseURL: "http://127.0.0.1:4401" },
  }] : [])],
});
