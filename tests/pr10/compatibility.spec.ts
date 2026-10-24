import { test, expect } from "@playwright/test";
const detail = "/actividades/vivir-la-magia-del-teatro-colon";
const routes = [
  "/",
  "/provincias",
  "/provincias/santa_fe",
  "/actividades",
  "/actividades?provincia=santa_fe",
  "/actividades?provincia=catarmaca",
  "/escapadas",
  detail,
  "/privacidad",
  "/provincias/santa_fe/eventos",
];
const tile = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
  "base64",
);
test.beforeEach(async ({ context }) => {
  await context.route(/^https:\/\/tile\.openstreetmap\.org\//, (r) =>
    r.fulfill({ contentType: "image/png", body: tile }),
  );
  await context.route(
    /google-analytics\.com|analytics\.google\.com|doubleclick\.net|googletagmanager\.com/,
    (r) => r.abort(),
  );
});
for (const route of routes)
  test("SSR e hidratación " + route, async ({ page }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toBeVisible();
    await expect
      .poll(() =>
        page
          .locator("img")
          .first()
          .evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0),
      )
      .toBe(true);
    if (route.includes("?provincia=")) {
      const select = page.locator("#provincia-filtro");
      await expect(select).toHaveAttribute("data-hidratado", "");
      await expect(select).toHaveValue(
        route.includes("catarmaca") ? "catamarca" : "santa_fe",
      );
      await expect(
        page.locator(
          'section[aria-labelledby="actividades-por-provincia-heading"] a[href^="/actividades/"]:visible',
        ),
      ).toHaveCount(3);
    }
    if (!info.project.name.startsWith("baseline")) {
      expect(
        await page
          .locator("img")
          .evaluateAll((images) =>
            images.some((i) =>
              (i as HTMLImageElement).currentSrc.includes("/_next/image"),
            ),
          ),
      ).toBe(false);
    }
    expect(errors).toEqual([]);
  });
test("filtro, recarga, navegación cliente y atrás", async ({ page }) => {
  await page.goto("/actividades");
  await expect(page.locator("#provincia-filtro")).toHaveAttribute(
    "data-hidratado",
    "",
  );
  await page.selectOption("#provincia-filtro", "santa_fe");
  await expect(page).toHaveURL(/provincia=santa_fe/);
  await page.reload();
  await expect(page.locator("#provincia-filtro")).toHaveValue("santa_fe");
  await page.selectOption("#provincia-filtro", "todas");
  const docs: string[] = [];
  page.on("request", (r) => {
    if (r.isNavigationRequest() && r.resourceType() === "document")
      docs.push(r.url());
  });
  await page.locator(`a[href="${detail}"]`).click();
  await expect(page).toHaveURL(new RegExp(detail));
  await expect(page.locator("h1")).toContainText("Teatro");
  expect(docs, "navigation must use the client router").toEqual([]);
  await page.goBack();
  await expect(page.locator("#provincia-filtro")).toHaveValue("todas");
});
test("historial local y resumen estático", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto("/provincias/santa_fe");
  await expect
    .poll(() =>
      page.evaluate(() => localStorage.getItem("provinciasVisitadas")),
    )
    .toContain("santa_fe");
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Continuar explorando" }),
  ).toBeVisible();
  const summary = await page.request.get("/api/catalogo-resumen");
  expect(summary.status()).toBe(200);
  expect((await summary.json()).actividades).toHaveLength(72);
  expect(errors).toEqual([]);
});
test("Leaflet se activa y mantiene controles", async ({ page }) => {
  await page.goto(detail);
  await page.getByRole("button", { name: /Explorar mapa interactivo/ }).click();
  await expect(page.locator(".leaflet-container")).toBeVisible();
  await expect(page.locator(".leaflet-control-zoom-in")).toBeVisible();
});
test("redirect permanente Catamarca y metadatos estáticos", async ({
  request,
}) => {
  const response = await request.get("/provincias/catarmaca", {
    maxRedirects: 0,
  });
  expect(response.status()).toBe(308);
  expect(response.headers().location).toContain("/provincias/catamarca");
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  expect((await sitemap.text()).match(/<loc>/g)).toHaveLength(106);
  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain(
    "Sitemap: https://www.argentinauniversosur.com/sitemap.xml",
  );
});
test("agenda nunca presenta los eventos de enero/febrero como próximos", async ({
  page,
}) => {
  await page.goto("/provincias/santa_fe/eventos");
  await expect(
    page.getByText("No hay próximos eventos confirmados por el momento."),
  ).toBeVisible();
});
test("demo local y fuentes, fuera del sitemap", async ({
  page,
  request,
}, info) => {
  test.skip(info.project.name.startsWith("baseline"));
  const response = await page.goto("/prototipo-pr10/escapadas/el-palmar");
  expect(response?.status()).toBe(200);
  await expect(page.locator("h1")).toContainText("El Palmar");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/,
  );
  expect(await (await request.get("/sitemap.xml")).text()).not.toContain(
    "prototipo-pr10",
  );
});
test("Workers: Suspense y Client Component", async ({ page }, info) => {
  test.skip(!info.project.name.startsWith("worker"));
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto("/prototipo-pr10/stream");
  await expect(page.getByText("Contenido RSC completado")).toBeVisible();
  await page.getByRole("button", { name: "Contador 0" }).click();
  await expect(page.getByRole("button", { name: "Contador 1" })).toBeVisible();
  expect(errors).toEqual([]);
});
