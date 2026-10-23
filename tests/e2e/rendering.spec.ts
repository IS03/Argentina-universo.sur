import { test as base, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { createSlug } from "../../lib/catalog.ts";

const actividadesJson: Array<{ SLUG: string; ACTIVIDAD: string }> = JSON.parse(readFileSync("public/data/actividades.json", "utf8"));
const slugsDe = (provincia: string) => actividadesJson.filter(a => a.SLUG === provincia).map(a => `/actividades/${createSlug(a.ACTIVIDAD)}`).sort();

// Cada prueba falla ante errores de consola (incluidos los de hidratación) o pedidos a /data/*.json.
// Los scripts /_vercel/* solo existen desplegados en Vercel y responden 404 en local.
const test = base.extend<{ errores: string[]; pedidosJson: string[] }>({
  errores: async ({ page }, usar) => {
    const errores: string[] = [];
    page.on("pageerror", e => errores.push(String(e)));
    page.on("console", m => {
      if (m.type() === "error" && !m.location().url.includes("/_vercel/")) errores.push(m.text());
    });
    await usar(errores);
    expect(errores, "errores de consola o hidratación").toEqual([]);
  },
  pedidosJson: async ({ page }, usar) => {
    const pedidos: string[] = [];
    page.on("request", r => { if (/\/data\/.*\.json/.test(r.url())) pedidos.push(r.url()); });
    await usar(pedidos);
    expect(pedidos, "el navegador no debe descargar los catálogos").toEqual([]);
  },
});

const tarjetasActividad = (page: Page) => page.locator('section[aria-labelledby="actividades-por-provincia-heading"] a[href^="/actividades/"]');

test.describe("HTML inicial (sin JavaScript)", () => {
  test("la portada incluye hero, provincias destacadas y enlaces internos", async ({ request }) => {
    const html = await (await request.get("/")).text();
    expect(html).toContain("Provincias destacadas");
    for (const slug of ["santa_fe", "cordoba", "buenos_aires"]) expect(html).toContain(`href="/provincias/${slug}"`);
    for (const href of ["/provincias", "/actividades", "/escapadas", "/seguridad"]) expect(html).toContain(`href="${href}"`);
    expect(html).not.toContain("Cargando");
    // El catálogo no viaja en el HTML: solo se pide si hay historial de visitas.
    expect(html).not.toContain("actividadSlug");
    // Solo la primera foto del hero es prioritaria y se precarga la versión optimizada.
    expect(html).toMatch(/<img[^>]*fetchPriority="high"[^>]*imagen 1"|<img[^>]*alt="[^"]*imagen 1"[^>]*fetchPriority="high"/);
    expect(html).toMatch(/<link rel="preload"[^>]*as="image"[^>]*%2Fimg%2Fhome%2F1\.jpg/);
    expect(html.match(/%2Fimg%2Fhome%2F\d\.jpg/g)?.every(src => src.includes("%2F1.jpg"))).toBe(true);
  });

  test("/actividades incluye las 72 actividades y el filtro completo", async ({ request }) => {
    const html = await (await request.get("/actividades")).text();
    const visible = html.replace(/<script\b[\s\S]*?<\/script>/gi, "");
    expect(new Set(visible.match(/href="\/actividades\/[a-z0-9-]+"/g)).size).toBe(72);
    expect(visible.match(/<option value="[a-z_]+"/g)?.length).toBe(25);
    expect(visible).not.toContain("Cargando");
  });
});

test.describe("portada", () => {
  test("hidrata sin errores, sin fetch de catálogos y con la imagen LCP cargada", async ({ page, errores, pedidosJson }) => {
    void errores; void pedidosJson;
    const resumen: string[] = [];
    page.on("request", r => { if (r.url().includes("/api/catalogo-resumen")) resumen.push(r.url()); });
    await page.goto("/");
    const hero = page.locator('img[alt$="imagen 1"]');
    await expect(hero).toBeVisible();
    await expect.poll(() => hero.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
    await expect(page.locator("#provincias-destacadas a")).toHaveCount(3);
    // Analytics y Speed Insights siguen montados.
    await expect(page.locator('script[src*="/_vercel/insights/script.js"]')).toHaveCount(1);
    await expect(page.locator('script[src*="/_vercel/speed-insights/script.js"]')).toHaveCount(1);
    await page.waitForLoadState("load");
    expect(resumen, "sin historial no se pide el catálogo").toEqual([]);
  });

  test("el scroll difumina el hero, sube el contenido y el CTA lleva a destacadas", async ({ page, errores }) => {
    void errores;
    await page.goto("/");
    const hero = page.locator("section.sticky");
    await expect(hero).toHaveCSS("opacity", "1");
    await page.getByRole("button", { name: "Explorar destinos" }).click();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(300);
    await expect.poll(async () => Number(await hero.evaluate(el => getComputedStyle(el).opacity))).toBe(0);
    await expect(page.locator("#provincias-destacadas")).toBeInViewport();
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect.poll(async () => Number(await hero.evaluate(el => getComputedStyle(el).opacity))).toBe(1);
  });

  test("el carrusel avanza solo cuando la siguiente imagen ya cargó", async ({ page, errores }) => {
    void errores;
    await page.clock.install();
    await page.goto("/");
    await expect.poll(() => page.locator('img[alt$="imagen 2"]').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
    await page.clock.runFor(5000);
    const visible = page.locator('div[aria-hidden="false"] > img');
    await expect(visible).toHaveAttribute("alt", /imagen 2$/);
    await page.clock.runFor(1600);
    await expect(page.locator('img[alt$="imagen 3"]')).toHaveCount(1);
  });

  test("con movimiento reducido el carrusel no rota ni precarga", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.clock.install();
    await page.goto("/");
    await page.clock.runFor(16_000);
    await expect(page.locator('img[alt*="imagen"]')).toHaveCount(1);
    await context.close();
  });

  test("Continuar explorando muestra el historial guardado y enlaza bien", async ({ page, errores, pedidosJson }) => {
    void errores; void pedidosJson;
    // Los trackers escriben en un efecto posterior a la hidratación, no en el evento load.
    const visitaGuardada = (clave: string, slug: string) => page.waitForFunction(
      ([c, s]) => (localStorage.getItem(c) ?? "").includes(`"${s}"`), [clave, slug]);
    await page.goto("/provincias/catamarca");
    await visitaGuardada("provinciasVisitadas", "catamarca");
    await page.goto("/actividades/vivir-la-magia-del-teatro-colon");
    await visitaGuardada("actividadesVisitadas", "vivir-la-magia-del-teatro-colon");
    const resumen = page.waitForResponse(r => r.url().endsWith("/api/catalogo-resumen") && r.ok());
    await page.goto("/");
    await resumen;
    const seccion = page.locator("section", { has: page.getByRole("heading", { name: "Continuar explorando" }) });
    await expect(seccion.locator("a")).toHaveCount(2);
    await expect(seccion.locator("a").first()).toHaveAttribute("href", "/actividades/vivir-la-magia-del-teatro-colon");
    await seccion.locator('a[href="/provincias/catamarca"]').click();
    await expect(page).toHaveURL(/\/provincias\/catamarca$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Catamarca");
  });

  test("las tarjetas destacadas navegan a la provincia", async ({ page, errores }) => {
    void errores;
    await page.goto("/");
    await page.locator('#provincias-destacadas a[href="/provincias/santa_fe"]').click();
    await expect(page).toHaveURL(/\/provincias\/santa_fe$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Santa Fe");
  });
});

test.describe("/actividades", () => {
  test("filtra en el navegador, actualiza la URL y vuelve a todas", async ({ page, errores, pedidosJson }) => {
    void errores; void pedidosJson;
    await page.goto("/actividades");
    await expect(tarjetasActividad(page)).toHaveCount(72);
    // El select del HTML estático se reemplaza al hidratar: elegir antes perdería la selección.
    await page.locator("#provincia-filtro[data-hidratado]").waitFor();
    await page.selectOption("#provincia-filtro", "santa_fe");
    await expect(tarjetasActividad(page)).toHaveCount(3);
    expect((await tarjetasActividad(page).evaluateAll(as => as.map(a => a.getAttribute("href")))).sort()).toEqual(slugsDe("santa_fe"));
    await expect(page).toHaveURL(/\?provincia=santa_fe$/);
    await page.selectOption("#provincia-filtro", "todas");
    await expect(tarjetasActividad(page)).toHaveCount(72);
    await expect(page).toHaveURL(/\/actividades$/);
  });

  test("respeta el alias histórico de Catamarca en la URL", async ({ page, errores }) => {
    void errores;
    await page.goto("/actividades?provincia=catarmaca");
    await expect(page.locator("#provincia-filtro")).toHaveValue("catamarca");
    await expect(tarjetasActividad(page)).toHaveCount(3);
    expect((await tarjetasActividad(page).evaluateAll(as => as.map(a => a.getAttribute("href")))).sort()).toEqual(slugsDe("catamarca"));
  });

  test("una provincia desconocida muestra el mensaje vacío", async ({ page, errores }) => {
    void errores;
    await page.goto("/actividades?provincia=no-existe");
    await expect(page.getByText("No se encontraron actividades para la provincia seleccionada.")).toBeVisible();
  });

  test("el enlace desde una provincia llega filtrado y la tarjeta abre el detalle", async ({ page, errores }) => {
    void errores;
    await page.goto("/provincias/mendoza");
    await page.locator('a[href="/actividades?provincia=mendoza"]').first().click();
    await expect(page).toHaveURL(/\/actividades\?provincia=mendoza$/);
    await expect(tarjetasActividad(page)).toHaveCount(3);
    const destino = await tarjetasActividad(page).first().getAttribute("href");
    await tarjetasActividad(page).first().click();
    await expect(page).toHaveURL(new RegExp(`${destino}$`));
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});

test("el carrusel del detalle de actividad cambia de imagen", async ({ page, errores }) => {
  void errores;
  await page.goto("/actividades/vivir-la-magia-del-teatro-colon");
  const imagen = page.locator('img[alt*=" - Imagen "]');
  await expect(imagen).toHaveAttribute("alt", /Imagen 1 de/);
  await page.getByRole("button", { name: "Imagen siguiente" }).click();
  await expect(imagen).toHaveAttribute("alt", /Imagen 2 de/);
  await page.getByRole("button", { name: "Imagen anterior" }).click();
  await expect(imagen).toHaveAttribute("alt", /Imagen 1 de/);
});

test("navbar: menú móvil o enlaces de escritorio", async ({ page, errores, isMobile }) => {
  void errores;
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Navegación principal" });
  if (isMobile) {
    const menu = nav.locator("div.fixed[aria-hidden]");
    await expect(menu).toHaveAttribute("aria-hidden", "true");
    await nav.getByRole("button", { name: "Toggle menu" }).click();
    await expect(menu).toHaveAttribute("aria-hidden", "false");
    // "Guía de seguridad" es la única opción interna cuyo toque no tapa la siguiente (ver fixme).
    await menu.getByRole("link", { name: "Guía de seguridad para viajeros" }).click();
    await expect(page).toHaveURL(/\/seguridad$/);
    await expect(menu).toHaveAttribute("aria-hidden", "true");
  } else {
    await nav.getByRole("link", { name: "Qué hacer: actividades turísticas por provincia" }).click();
    await expect(page).toHaveURL(/\/actividades$/);
    await expect(tarjetasActividad(page)).toHaveCount(72);
  }
});

// Bug preexistente en main (no introducido por PR 03): los enlaces del menú móvil son inline
// con py-6 y el relleno de cada uno tapa el texto del anterior, así que tocar "Qué hacer" abre
// "Escapadas". Corregirlo cambia el espaciado del menú: queda para el PR de navegación.
test.fixme("cada opción del menú móvil recibe su propio toque", async ({ page, isMobile }) => {
  test.skip(!isMobile, "solo móvil");
  await page.goto("/");
  await page.getByRole("button", { name: "Toggle menu" }).click();
  const solapados = await page.evaluate(() => [...document.querySelectorAll("nav div.fixed a")].filter(a => {
    const r = a.getBoundingClientRect();
    return document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)?.closest("a") !== a;
  }).map(a => a.textContent));
  expect(solapados).toEqual([]);
});

test("la metadata canónica no cambia y el sitemap mantiene 106 URLs", async ({ request }) => {
  const canonical = async (path: string) => (await (await request.get(path)).text()).match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  expect(await canonical("/")).toBe("https://www.argentinauniversosur.com");
  expect(await canonical("/actividades?provincia=catarmaca")).toBe("https://www.argentinauniversosur.com/actividades");
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap.match(/<loc>/g)).toHaveLength(106);
});
