import { defineConfig, devices } from "@playwright/test";

const PORT = 3200;
// Build aparte que simula producción con un ID de GA4 ficticio (nunca el real): permite probar el
// banner de cookies y la carga de GA4 tras el consentimiento. gtag.js se reemplaza en las pruebas.
const PORT_CONSENTIMIENTO = 3201;
const GA_ID_PRUEBA = "G-PRUEBA0001"; // Mismo valor en tests/e2e/consentimiento.spec.ts.
const ENTORNO_CONSENTIMIENTO = {
  NEXT_TELEMETRY_DISABLED: "1",
  NEXT_DIST_DIR: ".next-consentimiento",
  VERCEL_ENV: "production",
  NEXT_PUBLIC_GA_ID: GA_ID_PRUEBA,
};
const SPEC_CONSENTIMIENTO = /consentimiento\.spec\.ts/;
const next = "node node_modules/next/dist/bin/next";

// E2E sobre la build de producción (npm run build antes). Usa el Chrome instalado en el
// sistema, presente en los runners de GitHub, para no descargar navegadores en cada CI.
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [["list"], ["github"]] : "list",
  timeout: 30_000,
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    channel: "chrome",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "escritorio", testIgnore: SPEC_CONSENTIMIENTO, use: { ...devices["Desktop Chrome"], channel: "chrome" } },
    { name: "movil", testIgnore: SPEC_CONSENTIMIENTO, use: { ...devices["Pixel 7"], channel: "chrome" } },
    {
      name: "consentimiento-escritorio",
      testMatch: SPEC_CONSENTIMIENTO,
      use: { ...devices["Desktop Chrome"], channel: "chrome", baseURL: `http://127.0.0.1:${PORT_CONSENTIMIENTO}` },
    },
    {
      name: "consentimiento-movil",
      testMatch: SPEC_CONSENTIMIENTO,
      use: { ...devices["Pixel 7"], channel: "chrome", baseURL: `http://127.0.0.1:${PORT_CONSENTIMIENTO}` },
    },
  ],
  webServer: [
    {
      command: `${next} start --hostname 127.0.0.1 --port ${PORT}`,
      url: `http://127.0.0.1:${PORT}`,
      reuseExistingServer: !process.env.CI,
      env: { NEXT_TELEMETRY_DISABLED: "1" },
    },
    {
      command: `${next} build && ${next} start --hostname 127.0.0.1 --port ${PORT_CONSENTIMIENTO}`,
      url: `http://127.0.0.1:${PORT_CONSENTIMIENTO}`,
      reuseExistingServer: !process.env.CI,
      timeout: 300_000,
      env: ENTORNO_CONSENTIMIENTO,
    },
  ],
});
