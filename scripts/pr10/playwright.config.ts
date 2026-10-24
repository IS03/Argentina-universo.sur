import { defineConfig, devices } from "@playwright/test";
import path from "node:path";
const root = path.resolve(import.meta.dirname, "../..");
const consent = path.join(root, "tests/e2e/consentimiento.spec.ts");
const compatibility = path.join(root, "tests/pr10/compatibility.spec.ts");
export default defineConfig({
  testDir: path.join(root, "tests"),
  fullyParallel: true,
  workers: 3,
  retries: 0,
  timeout: 20000,
  reporter: [
    ["list"],
    [
      "json",
      { outputFile: path.join(root, ".artifacts/pr10/reports/browser.json") },
    ],
  ],
  use: {
    channel: "chrome",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  outputDir: path.join(root, ".artifacts/pr10/browser-results"),
  projects: [
    ...["escritorio", "movil"].flatMap((device) => [
      {
        name: "baseline-" + device,
        testMatch: compatibility,
        use: {
          ...(device === "movil"
            ? devices["Pixel 7"]
            : devices["Desktop Chrome"]),
          channel: "chrome",
          baseURL: "http://127.0.0.1:4300",
        },
      },
      {
        name: "static-" + device,
        testMatch: [compatibility, consent],
        use: {
          ...(device === "movil"
            ? devices["Pixel 7"]
            : devices["Desktop Chrome"]),
          channel: "chrome",
          baseURL: "http://127.0.0.1:4301",
        },
      },
      {
        name: "worker-" + device,
        testMatch: [compatibility, consent],
        use: {
          ...(device === "movil"
            ? devices["Pixel 7"]
            : devices["Desktop Chrome"]),
          channel: "chrome",
          baseURL: "http://127.0.0.1:4304",
        },
      },
    ]),
  ],
});
