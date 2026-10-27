import { test, expect } from '@playwright/test';

test('la web compilada funciona con Supabase bloqueado y nunca consulta DB desde el navegador', async ({ page, context }) => {
  const requests: string[] = [];
  await context.route('**/*.supabase.co/**', route => { requests.push(new URL(route.request().url()).hostname); return route.abort(); });
  await context.route(/tile\.openstreetmap\.org/, route => route.abort());
  for (const path of ['/', '/actividades', '/provincias/santa_fe', '/destinos/santa-fe-capital', '/destinos/alta-gracia']) {
    expect((await page.goto(path))?.status()).toBe(200);
    await expect(page.locator('h1')).toBeVisible();
    expect(await page.locator('body').innerText()).not.toMatch(/originalPayload|masterRefs|docs\.google\.com\/spreadsheets/);
  }
  expect(requests).toEqual([]);
});
