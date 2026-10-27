import { test, expect } from '@playwright/test';
import { readBuildPublication } from '../../scripts/editorial/publication.mjs';

test('solo versiones autorizadas; Work retenido no se expone en HTML/RSC o sitemap', async ({ request }) => {
  const approved = (await readBuildPublication()).pages;
  const approvedPaths = new Set(approved.map(p=>'/destinos/'+p.slug));
  for (const path of ['/destinos', '/destinos/rosario', '/destinos/ficha-sintetica-1', '/destinos/ficha-sintetica-1.txt']) {
    if (approvedPaths.has(path.replace(/\.txt$/, ''))) continue;
    expect((await request.get(path)).status()).toBe(404);
  }
  for (const path of ['/', '/escapadas', '/provincias/santa_fe', '/sitemap.xml']) {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    expect(await response.text()).not.toMatch(/AUS_PRIVATE_WORK_CANARY|SYNTH-DEST-|originalPayload|normalizedPayload|ficha_practica_propuesta/);
  }
  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(sitemap.match(/<loc>/g)).toHaveLength(106 + approved.length);
  const destinations = [...sitemap.matchAll(/<loc>https:\/\/www\.argentinauniversosur\.com(\/destinos\/[^<]+)<\/loc>/g)].map(m=>m[1]);
  expect(destinations.sort()).toEqual([...approvedPaths].sort());
});
