import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';

// Read-only browser verification of the owner's existing Pages Preview; never production.
const origin = new URL(process.env.AUS_PAGES_PREVIEW_URL ?? 'https://argentina-universo-sur-preview.pages.dev');
const project = 'argentina-universo-sur-preview.pages.dev';
const root = path.resolve(import.meta.dirname, '../..');
if (origin.protocol !== 'https:' || origin.username || origin.password || origin.port ||
    origin.pathname !== '/' || origin.search || origin.hash ||
    (origin.hostname !== project && !origin.hostname.endsWith('.' + project))) {
  throw Error('INSTITUTIONAL_PAGES_PREVIEW_REQUIRED');
}

export default defineConfig({
  testDir: path.join(root, 'tests/e2e'),
  testMatch: ['publicidad.spec.ts', 'destinations.spec.ts', 'supabase.spec.ts'],
  // Exclude tests whose fixtures deliberately assume a localhost origin or clipboard behavior.
  grep: /banners originales|cinco GIF|movimiento reducido|imágenes demoradas|picture y|contenido exacto|320px sin JS|Supabase bloqueado/,
  retries: 0, workers: 3, timeout: 60_000,
  reporter: [['list'], ['json', { outputFile: path.join(root, '.artifacts/pages/reports/remote-browser.json') }]],
  outputDir: path.join(root, '.artifacts/pages/remote-traces'),
  use: { baseURL: origin.origin, trace: 'retain-on-failure' },
  projects: [
    { name: 'cf-remoto-escritorio', metadata: { publicExport: true }, use: { ...devices['Desktop Chrome'], channel: 'chrome' } },
    { name: 'cf-remoto-pixel7', metadata: { publicExport: true }, use: { ...devices['Pixel 7'], channel: 'chrome' } },
    { name: 'cf-remoto-iphone', metadata: { publicExport: true }, use: { ...devices['iPhone 13'], browserName: 'webkit' } },
  ],
});
