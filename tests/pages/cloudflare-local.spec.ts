import { test, expect } from "@playwright/test";
test("Wrangler Pages local: rutas, headers, imágenes y navegación cliente", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  for (const route of [
    "/",
    "/provincias",
    "/provincias/santa_fe",
    "/actividades",
    "/escapadas",
    "/actividades/vivir-la-magia-del-teatro-colon",
    "/privacidad",
  ]) {
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
    expect(response?.headers()["x-robots-tag"]).toContain("noindex");
    await expect(page.locator("h1")).toBeVisible();
  }
  await page.goto("/actividades");
  await expect(page.locator("#provincia-filtro")).toHaveAttribute(
    "data-hidratado",
    "",
  );
  const docs: string[] = [];
  page.on("request", (r) => {
    if (r.resourceType() === "document") docs.push(r.url());
  });
  await page.selectOption("#provincia-filtro", "santa_fe");
  await expect(page).toHaveURL(/por-provincia\/santa_fe/);
  await expect(
    page.locator(
      'section[aria-labelledby="actividades-por-provincia-heading"] a',
    ),
  ).toHaveCount(3);
  expect(docs).toEqual([]);
  expect(errors).toEqual([]);
});
test("Wrangler interpreta _redirects y preserva la query", async ({
  request,
}) => {
  const alias = await request.get("/provincias/catarmaca?origen=legado", {
    maxRedirects: 0,
  });
  expect(alias.status()).toBe(308);
  expect(alias.headers().location).toBe("/provincias/catamarca?origen=legado");
  expect((await request.get(alias.headers().location)).status()).toBe(200);
  const photo = await request.get("/img/home/1.jpg", { maxRedirects: 0 });
  expect(photo.status()).toBe(308);
  expect(
    (await request.get(photo.headers().location)).headers()["content-type"],
  ).toContain("image/webp");
});
test("Wrangler sin JS: página provincial correcta, query legacy requiere regla de zona", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(baseURL + "/actividades/por-provincia/santa_fe");
  await expect(
    page.locator(
      'section[aria-labelledby="actividades-por-provincia-heading"] a',
    ),
  ).toHaveCount(3);
  await page.goto(baseURL + "/actividades?provincia=santa_fe");
  await expect(
    page.locator(
      'section[aria-labelledby="actividades-por-provincia-heading"] a',
    ),
  ).toHaveCount(72);
  await expect(
    page
      .getByRole("navigation", {
        name: "Actividades por provincia",
        exact: true,
      })
      .getByRole("link", { name: "Santa Fe", exact: true }),
  ).toHaveAttribute("href", "/actividades/por-provincia/santa_fe");
  await context.close();
});
