import { test, expect } from "@playwright/test";
import { readFileSync, readdirSync } from "node:fs";
test("24 páginas filtradas entregan exactamente su provincia sin JavaScript", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  const summary = await (
    await context.request.get(baseURL + "/api/catalogo-resumen")
  ).json();
  expect(summary.provincias).toHaveLength(24);
  for (const { slug } of summary.provincias as Array<{ slug: string }>) {
    const response = await page.goto(
      baseURL + "/actividades/por-provincia/" + slug,
    );
    expect(response?.status()).toBe(200);
    await expect(
      page.locator(
        'section[aria-labelledby="actividades-por-provincia-heading"] a[href^="/actividades/"]',
      ),
    ).toHaveCount(3);
    await expect(page.locator("#provincia-filtro")).toHaveValue(slug);
  }
  await page
    .getByRole("navigation", { name: "Actividades por provincia", exact: true })
    .getByRole("link", { name: "Santa Fe", exact: true })
    .click();
  await expect(page).toHaveURL(/por-provincia\/santa_fe/);
  await context.close();
});
test("modelo de reglas de zona conserva query y entrega 3 actividades sin JS", async ({
  request,
}) => {
  const redirected = await request.get(
    "http://127.0.0.1:4403/actividades?provincia=catarmaca&origen=legado",
    { maxRedirects: 0 },
  );
  expect(redirected.status()).toBe(308);
  expect(redirected.headers().location).toBe(
    "/actividades/por-provincia/catamarca?provincia=catarmaca&origen=legado",
  );
  const followed = await request.get(
    "http://127.0.0.1:4403" + redirected.headers().location,
  );
  expect(followed.status()).toBe(200);
  const html = (await followed.text()).replace(
    /<script\b[^>]*>[\s\S]*?<\/script>/gi,
    "",
  );
  const section =
    html.match(
      /<section aria-labelledby="actividades-por-provincia-heading"[\s\S]*?<\/section>/,
    )?.[0] || "";
  expect(section.match(/href="\/actividades\//g)).toHaveLength(3);
});
test("Preview no monta GA incluso con aceptación guardada", async ({
  page,
}) => {
  const google: string[] = [];
  await page.route(/googletagmanager|google-analytics/, (r) => {
    google.push(r.request().url());
    return r.abort();
  });
  await page.goto("http://127.0.0.1:4404/");
  await page.evaluate(() =>
    localStorage.setItem(
      "consentimientoCookies",
      JSON.stringify({
        analitica: "aceptada",
        version: 1,
        fecha: new Date().toISOString(),
      }),
    ),
  );
  await page.reload();
  await page.waitForTimeout(500);
  expect(google).toEqual([]);
  expect(await page.evaluate(() => "dataLayer" in window)).toBe(false);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/,
  );
});
test("alias pages.dev/local de un artefacto production tampoco carga GA", async ({
  page,
}) => {
  const google: string[] = [];
  await page.route(/googletagmanager|google-analytics/, (r) => {
    google.push(r.request().url());
    return r.abort();
  });
  await page.goto("http://127.0.0.1:4402/");
  await page.evaluate(() =>
    localStorage.setItem(
      "consentimientoCookies",
      JSON.stringify({
        analitica: "aceptada",
        version: 1,
        fecha: new Date().toISOString(),
      }),
    ),
  );
  await page.reload();
  await page.waitForTimeout(500);
  expect(google).toEqual([]);
  expect(await page.evaluate(() => "dataLayer" in window)).toBe(false);
});
test("PDFs y URLs de fotos heredadas siguen accesibles; ningún optimizer Vercel", async ({
  page,
  request,
}) => {
  const urls: string[] = [];
  page.on("request", (r) => urls.push(r.url()));
  await page.goto("/");
  await page.waitForLoadState("load");
  expect(
    urls.some((u) => u.includes("/_next/image") || u.includes("/_vercel/")),
  ).toBe(false);
  const response = await request.get("/img/home/1.jpg", { maxRedirects: 0 });
  expect(response.status()).toBe(308);
  expect(
    (await request.get(response.headers().location)).headers()["content-type"],
  ).toContain("image/webp");
  const pdf = await request.head("/pdf/entrerios.pdf");
  expect(pdf.status()).toBe(200);
  expect(pdf.headers()["content-type"]).toContain("application/pdf");
});
test("las 24 fichas pendientes no tienen HTML ni datos RSC públicos", async ({ request }) => {
  const withheld = readdirSync("content/escapadas").filter(name => name.endsWith(".json")).map(name => {
    const trip = JSON.parse(readFileSync("content/escapadas/" + name, "utf8"));
    expect(trip.status).toBe("draft");
    return trip.slug as string;
  });
  for (const host of [4401, 4402, 4404, 4410]) {
    const index = await (await request.get(`http://127.0.0.1:${host}/escapadas`)).text();
    const sitemap = await (await request.get(`http://127.0.0.1:${host}/sitemap.xml`)).text();
    for (const slug of withheld) {
      for (const suffix of ["", ".html", ".txt"]) {
        const response = await request.get(`http://127.0.0.1:${host}/escapadas/${slug}${suffix}`);
        expect(response.status(), `${host}/${slug}${suffix}`).toBe(404);
        expect(await response.text()).not.toContain("AUS-ESC-");
      }
      expect(sitemap).not.toContain(`/escapadas/${slug}`);
      expect(index).not.toContain(`AUS-ESC-${slug.toUpperCase()}`);
    }
    expect((await request.get(`http://127.0.0.1:${host}/prototipo-pr10/escapadas/el-palmar`)).status()).toBe(404);
  }
});

test("Preview conserva las 23 guías mediante sus URLs vigentes de producción", async ({ browser }) => {
  const context = await browser.newContext({javaScriptEnabled: false});
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4404/escapadas");
  const links = page.getByRole("link", {name: "Ver PDF", exact: true});
  await expect(links).toHaveCount(23);
  const hrefs = await links.evaluateAll(nodes => nodes.map(n => n.getAttribute("href")));
  expect(hrefs.every(href => href?.startsWith("https://www.argentinauniversosur.com/pdf/"))).toBe(true);
  await expect(page.locator('a[href^="/escapadas/"]')).toHaveCount(0);
  await context.close();
});
test('Work permanece fuera de las rutas, HTML, JSON y sitemap estáticos', async ({ request }) => {
  for (const path of ['/destinos', '/destinos/ficha-sintetica-1.html', '/destinos/ficha-sintetica-1.txt'])
    expect((await request.get(path)).status()).toBe(404);
  for (const path of ['/', '/escapadas', '/sitemap.xml']) {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    expect(await response.text()).not.toMatch(/AUS_PRIVATE_WORK_CANARY|SYNTH-DEST-|originalPayload|normalizedPayload|ficha_practica_propuesta/);
  }
});
