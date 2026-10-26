import { test, expect } from '@playwright/test';

test('solo dos destinos autorizados; Work retenido no se expone en HTML/RSC o sitemap', async ({ request }) => {
  for (const path of ['/destinos', '/destinos/rosario', '/destinos/ficha-sintetica-1', '/destinos/ficha-sintetica-1.txt']) {
    expect((await request.get(path)).status()).toBe(404);
  }
  for (const path of ['/', '/escapadas', '/provincias/santa_fe', '/sitemap.xml']) {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    expect(await response.text()).not.toMatch(/AUS_PRIVATE_WORK_CANARY|SYNTH-DEST-|originalPayload|normalizedPayload|ficha_practica_propuesta/);
  }
  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(sitemap.match(/<loc>/g)).toHaveLength(108);
});
