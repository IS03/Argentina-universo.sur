import { test, expect } from "@playwright/test";

const SUBSECCIONES = [
  ["planes", "Planes e ideas"],
  ["eventos", "Eventos"],
  ["oficinas", "Oficinas de información"],
  ["agencias", "Agencias de viajes"],
  ["noticias", "Noticias"],
] as const;

test("las preguntas frecuentes de Santa Fe se abren sin JavaScript y sus respuestas están en el HTML", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(baseURL + "/provincias/santa_fe");
  const seccion = page.locator("#preguntas-frecuentes");
  const primera = seccion.locator("details").first();
  await expect(primera).not.toHaveAttribute("open");
  await primera.locator("summary").click();
  await expect(primera).toHaveAttribute("open", "");
  await expect(primera.locator("p")).toBeVisible();
  await context.close();
});

test("Seguridad: los números de emergencia son enlaces de llamada y en móvil aparecen antes de los consejos", async ({ page, isMobile }) => {
  await page.goto("/seguridad");
  await expect(page.getByRole("link", { name: "Llamar a emergencias 911" })).toHaveAttribute("href", "tel:911");
  await expect(page.getByRole("link", { name: "Llamar a denuncias 134" })).toHaveAttribute("href", "tel:134");
  const emergencias = (await page.locator("#emergencias").boundingBox())!;
  const introduccion = (await page.locator(".prosa").first().boundingBox())!;
  if (isMobile) expect(emergencias.y).toBeLessThan(introduccion.y);
  // El índice de temas lleva a cada sección.
  await page.getByRole("navigation", { name: "Temas de la guía" }).getByRole("link", { name: "En la ruta" }).click();
  await expect(page).toHaveURL(/#en-la-ruta$/);
  await expect(page.locator("#en-la-ruta")).toBeInViewport();
});

test("las cinco subsecciones de Santa Fe marcan su sección y la dejan visible en la fila de chips", async ({ page }) => {
  for (const [slug, etiqueta] of SUBSECCIONES) {
    await page.goto(`/provincias/santa_fe/${slug}`);
    const actual = page.getByRole("navigation", { name: "Secciones de Santa Fe" }).locator('[aria-current="page"]');
    await expect(actual).toHaveCount(1);
    await expect(actual).toHaveText(etiqueta);
    await expect(actual).toBeInViewport();
    await expect(page.getByRole("navigation", { name: "Ruta de navegación" }).getByRole("link", { name: "Santa Fe" })).toHaveAttribute("href", "/provincias/santa_fe");
  }
});

test("Agencias filtra por ciudad con chips y anuncia el resultado", async ({ page }) => {
  await page.goto("/provincias/santa_fe/agencias");
  const filtro = page.getByRole("group", { name: "Filtrar agencias por ciudad" });
  const ciudad = filtro.getByRole("button").nth(1);
  const nombre = (await ciudad.textContent())!.trim();
  await expect(async () => {
    await ciudad.click();
    await expect(ciudad).toHaveAttribute("aria-pressed", "true", { timeout: 1000 });
  }).toPass();
  const tarjetas = page.locator("#agencias article");
  const ciudades = await tarjetas.locator("p.antetitulo").allTextContents();
  expect(ciudades.length).toBeGreaterThan(0);
  expect(new Set(ciudades.map(c => c.trim()))).toEqual(new Set([nombre]));
  await expect(page.getByText(new RegExp(`^${ciudades.length} agencias?$`))).toBeVisible();
});

test("la página 404 responde 404, orienta y no nombra borradores", async ({ page, request }) => {
  const respuesta = await request.get("/escapadas/el-palmar");
  expect(respuesta.status()).toBe(404);
  const html = await respuesta.text();
  expect(html).not.toContain("El Palmar");
  await page.goto("/pagina-inexistente");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("No encontramos esta página");
  await page.getByRole("main").getByRole("link", { name: "Qué hacer: actividades turísticas por provincia" }).click();
  await expect(page).toHaveURL(/\/actividades$/);
});
