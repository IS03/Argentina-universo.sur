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

for (const data of [santaFe, altaGracia]) {
  test(`${data.nombre}: selección local por teclado, copia y compartir sin almacenamiento ni red externa`, async ({ page, context }) => {
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (text: string) => { (window as unknown as { copied: string }).copied = text; } } });
      Object.defineProperty(navigator, 'share', { configurable: true, value: async (value: unknown) => { (window as unknown as { shared: unknown }).shared = value; } });
    });
    const external: string[] = [];
    page.on('request', r => { if (new URL(r.url()).hostname !== '127.0.0.1') external.push(new URL(r.url()).hostname); });
    await page.goto('/destinos/' + data.slug);
    const state = () => page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage }, cookies: document.cookie }));
    const initial = await state();
    await expect(page.getByRole('button', { name: 'Copiar lista', exact: true })).toBeDisabled();
    const first = page.getByRole('checkbox', { name: data.attractions[0].nombre, exact: true });
    await first.focus(); await page.keyboard.press('Space');
    await page.getByRole('checkbox', { name: data.attractions[2].nombre, exact: true }).check();
    await expect(page.locator('.destination-plan-count')).toHaveText('2 de 3 lugares seleccionados');
    await page.getByRole('button', { name: 'Copiar lista', exact: true }).click();
    const list = await page.locator('#lista-de-visita').inputValue();
    expect(await page.evaluate(() => (window as unknown as { copied: string }).copied)).toBe(list);
    expect(list).toContain(data.attractions[0].nombre); expect(list).toContain(data.attractions[2].nombre);
    expect(list).not.toContain(data.attractions[1].nombre);
    await page.getByRole('button', { name: 'Compartir lista', exact: true }).click();
    expect(await page.evaluate(() => (window as unknown as { shared: unknown }).shared)).toEqual({ title: data.nombre, text: list, url: data.seo.proposedCanonical });
    expect(await state()).toEqual(initial);
    expect(external).toEqual([]);
    await page.getByRole('button', { name: 'Vaciar selección', exact: true }).click();
    await expect(first).not.toBeChecked();
    await expect(page.getByRole('button', { name: 'Copiar lista', exact: true })).toBeDisabled();
    await first.check(); await page.reload(); await expect(first).not.toBeChecked();
  });
  test(`${data.nombre}: alternativas al portapapeles y compartir, cancelación e impresión legible`, async ({ page, context }) => {
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw Error('Permission denied'); } } });
      Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
      window.print = () => { (window as unknown as { printed: boolean }).printed = true; };
    });
    await page.goto('/destinos/' + data.slug);
    await page.getByRole('checkbox', { name: data.attractions[1].nombre, exact: true }).check();
    await page.getByRole('button', { name: 'Compartir lista', exact: true }).click();
    await expect(page.locator('.destination-plan-status')).toContainText('El navegador no pudo copiar');
    await expect(page.locator('#lista-de-visita')).toBeFocused();
    expect(await page.locator('#lista-de-visita').evaluate((e: HTMLTextAreaElement) => e.selectionEnd - e.selectionStart)).toBeGreaterThan(0);
    await page.evaluate(() => { Object.defineProperty(navigator, 'share', { configurable: true, value: async () => { throw new DOMException('Cancelled', 'AbortError'); } }); });
    await page.getByRole('button', { name: 'Compartir lista', exact: true }).click();
    await expect(page.locator('.destination-plan-status')).toHaveText('Se canceló la acción de compartir.');
    await page.getByRole('button', { name: 'Imprimir ficha', exact: true }).click();
    expect(await page.evaluate(() => (window as unknown as { printed: boolean }).printed)).toBe(true);
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('.destination-print-list')).toBeVisible();
    await expect(page.locator('.destination-print-list')).toContainText(data.attractions[1].nombre);
    await expect(page.locator('.destination-index')).not.toBeVisible();
    await expect(page.locator('.destination-plan-choices')).not.toBeVisible();
    await expect(page.locator('figcaption')).toBeVisible();
    await expect(page.locator('#fuentes')).toBeVisible();
    expect(await page.locator('[data-editorial-text]').count()).toBeGreaterThan(10);
  });
  test(`${data.nombre}: ficha compartida como enlace sin servicio externo`, async ({ page, context }) => {
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (text: string) => { (window as unknown as { copied: string }).copied = text; } } });
    });
    await page.goto('/destinos/' + data.slug);
    await page.getByRole('button', { name: 'Compartir ficha', exact: true }).click();
    expect(await page.evaluate(() => (window as unknown as { copied: string }).copied)).toBe(data.seo.proposedCanonical);
    await expect(page.locator('.destination-plan-status')).toHaveText('Enlace de la ficha copiado.');
  });
  test(`${data.nombre}: 320px sin JS, lectura de 18px e índice accesible sin pastillas`, async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, viewport: { width: 320, height: 800 }, javaScriptEnabled: false, reducedMotion: 'reduce' });
    const page = await context.newPage(); await page.goto('/destinos/' + data.slug);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await page.locator('[data-editorial-text]').evaluateAll(elements => elements.every(e => parseFloat(getComputedStyle(e).fontSize) >= 17))).toBe(true);
    const index = page.getByRole('navigation', { name: 'En esta ficha', exact: true });
    await expect(index.getByRole('link')).toHaveCount(6);
    for (const link of await index.getByRole('link').all()) {
      await link.focus(); await page.keyboard.press('Enter');
      expect(await page.locator(':target').evaluate(e => e.getBoundingClientRect().top)).toBeGreaterThanOrEqual(64);
    }
    await expect(page.getByRole('button', { name: 'Copiar lista', exact: true })).toBeDisabled();
    await expect(page.locator('noscript p')).toContainText('Todo el contenido y sus enlaces están disponibles');
    await context.close();
  });
}
