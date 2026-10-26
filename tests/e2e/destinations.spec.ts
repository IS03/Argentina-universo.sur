import { test, expect } from '@playwright/test';
import santaFe from '../../content/destinos/santa-fe-capital.json' with { type: 'json' };
import altaGracia from '../../content/destinos/alta-gracia.json' with { type: 'json' };
for (const data of [santaFe, altaGracia]) {
  test(`${data.nombre}: contenido exacto, fotografía aprobada, fuentes, mapas y teclado`, async ({ page, context }) => {
    await context.route(/commons\.wikimedia|openstreetmap|creativecommons/, route => route.abort());
    await page.goto('/destinos/' + data.slug);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(data.title);
    const expected = [data.resumen, ...data.introduction.map(p => p.text), ...data.sections.flatMap(s => s.paragraphs.map(p => p.text)), ...data.attractions.flatMap(a => a.paragraphs.map(p => p.text)), ...data.practical.map(p => p.valor)];
    expect(await page.locator('[data-editorial-text]').allTextContents()).toEqual(expected);
    expect(await page.locator('[data-editorial-location]').allTextContents()).toEqual(data.locations.map(l => l.descripcion));
    await expect(page.getByAltText(data.photos[0].foto.alt)).toBeVisible();
    await expect(page.locator('article figure')).toContainText(data.photos[0].foto.credito.titular);
    await expect(page.locator('article figure')).toContainText(data.photos[0].modifications);
    await expect(page.getByRole('link', { name: /Ver en el mapa:.*OpenStreetMap/ })).toHaveCount(3);
    const citation = page.locator('a[href^="#fuente-"]').first(); await citation.focus(); await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#fuente-/);
    await page.locator(':target').getByRole('link', { name: 'Volver a la primera cita' }).click();
    await expect(page).toHaveURL(/#cita-/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', data.seo.proposedCanonical);
    await expect(page).toHaveTitle(data.seo.title);
    expect(await page.locator('a[href^="#"]').evaluateAll(links => links.every(a => !!document.getElementById((a as HTMLAnchorElement).hash.slice(1))))).toBe(true);
  });
  test(`${data.nombre}: HTML completo sin JavaScript y entrada desde su provincia`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false }); const page = await context.newPage();
    await page.goto('http://127.0.0.1:3200/provincias/' + data.provinceSlugs[0]);
    await page.getByRole('link', { name: data.title, exact: true }).first().click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(data.title);
    await expect(page.locator('#atractivos article')).toHaveCount(3);
    await context.close();
  });
}
