import { test as base, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { createSlug } from "../../lib/catalog.ts";

const actividadesJson: Array<{ SLUG: string; ACTIVIDAD: string }> = JSON.parse(readFileSync("public/data/actividades.json", "utf8"));
const slugsDe = (provincia: string) => actividadesJson.filter(a => a.SLUG === provincia).map(a => `/actividades/${createSlug(a.ACTIVIDAD)}`).sort();

// Las pruebas no salen a internet: las teselas de OpenStreetMap se responden con un PNG local.
const TESELA = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==", "base64");

// Cada prueba falla ante errores de consola (incluidos los de hidratación) o pedidos a /data/*.json.
// Los scripts /_vercel/* solo existen desplegados en Vercel y responden 404 en local.
const test = base.extend<{ errores: string[]; pedidosJson: string[] }>({
  context: async ({ context }, usar) => {
    await context.route(/^https:\/\/tile\.openstreetmap\.org\//, r => r.fulfill({ contentType: "image/png", body: TESELA }));
    await usar(context);
  },
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
    // Tras hidratar, el cambio filtra en el acto (antes de hidratar se cubre en el bloque de regresión).
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

// Regresión del filtro por URL: el HTML ya llega filtrado (rewrite a variantes estáticas) y el
// navegador nunca muestra otra provincia, ni antes de hidratar ni al volver atrás.
test.describe("/actividades?provincia=… (regresión del filtro)", () => {
  const SELECTOR_TARJETAS = 'section[aria-labelledby="actividades-por-provincia-heading"] a[href^="/actividades/"]';
  const hrefs = (page: Page) => tarjetasActividad(page).evaluateAll(as => as.map(a => a.getAttribute("href")).sort());
  // Registra, frame a frame durante 30 s, cada estado distinto de la grilla.
  const grabarFrames = (page: Page) => page.evaluate(sel => {
    const w = window as unknown as { __frames: string[] };
    w.__frames = [];
    const fin = performance.now() + 30_000;
    const tick = () => {
      const actual = [...document.querySelectorAll(sel)].map(a => a.getAttribute("href")).sort().join(",");
      if (w.__frames.at(-1) !== actual) w.__frames.push(actual);
      if (performance.now() < fin) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, SELECTOR_TARJETAS);
  const framesDistintos = (page: Page) => page.evaluate(() => [...new Set((window as unknown as { __frames: string[] }).__frames)]);
  const retrasarJs = (page: Page, ms: number) => page.route(/\/_next\/static\/chunks\/.*\.js/, async route => {
    await new Promise(r => setTimeout(r, ms));
    await route.continue();
  });

  test("el HTML sin JavaScript ya trae la provincia pedida, el alias y el vacío", async ({ request }) => {
    const leer = async (query: string) => {
      const html = (await (await request.get(`/actividades${query}`)).text()).replace(/<script\b[\s\S]*?<\/script>/gi, "");
      return {
        hrefs: [...new Set(html.match(/\/actividades\/[a-z0-9-]+(?=")/g))].sort(),
        seleccionada: html.match(/<option value="([a-z_]+)"[^>]*selected/)?.[1],
        vacio: html.includes("No se encontraron actividades"),
      };
    };
    expect(await leer("?provincia=santa_fe")).toEqual({ hrefs: slugsDe("santa_fe"), seleccionada: "santa_fe", vacio: false });
    expect(await leer("?provincia=catarmaca")).toEqual({ hrefs: slugsDe("catamarca"), seleccionada: "catamarca", vacio: false });
    expect(await leer("?provincia=santa_fe&utm_source=boletin")).toMatchObject({ hrefs: slugsDe("santa_fe") });
    expect(await leer("?provincia=no-existe")).toMatchObject({ hrefs: [], vacio: true });
    expect((await leer("?provincia=")).hrefs).toHaveLength(72);
  });

  test("la ruta interna no es pública: redirige a la URL con el parámetro", async ({ request }) => {
    const res = await request.get("/actividades/por-provincia/santa_fe", { maxRedirects: 0 });
    expect(res.status()).toBe(308);
    expect(res.headers().location).toBe("/actividades?provincia=santa_fe");
  });

  test("una carga directa filtrada nunca pinta otra provincia mientras hidrata", async ({ page, errores }) => {
    void errores;
    await retrasarJs(page, 1500);
    await page.goto("/actividades?provincia=santa_fe", { waitUntil: "commit" });
    await page.locator(SELECTOR_TARJETAS).first().waitFor();
    await grabarFrames(page);
    await expect(page.locator("#provincia-filtro")).not.toHaveAttribute("data-hidratado");
    await expect(page.locator("#provincia-filtro")).toHaveValue("santa_fe");
    await page.locator("#provincia-filtro[data-hidratado]").waitFor();
    await page.waitForTimeout(300);
    expect(await framesDistintos(page)).toEqual([slugsDe("santa_fe").join(",")]);
  });

  test("una elección hecha antes de hidratar se conserva y se aplica", async ({ page, errores }) => {
    void errores;
    await retrasarJs(page, 1500);
    await page.goto("/actividades", { waitUntil: "commit" });
    await page.locator("#provincia-filtro").waitFor();
    await expect(page.locator("#provincia-filtro")).not.toHaveAttribute("data-hidratado");
    await page.selectOption("#provincia-filtro", "catamarca");
    await page.locator("#provincia-filtro[data-hidratado]").waitFor();
    await expect(tarjetasActividad(page)).toHaveCount(3);
    await expect(page.locator("#provincia-filtro")).toHaveValue("catamarca");
    expect(await hrefs(page)).toEqual(slugsDe("catamarca"));
    await expect(page).toHaveURL(/\/actividades\?provincia=catamarca$/);
  });

  test("atrás y adelante conservan el filtro elegido sin mostrar otro", async ({ page, errores }) => {
    void errores;
    for (const [inicio, eleccion] of [["/actividades", "salta"], ["/actividades?provincia=mendoza", "cordoba"]]) {
      await page.goto(inicio);
      await page.locator("#provincia-filtro[data-hidratado]").waitFor();
      await page.selectOption("#provincia-filtro", eleccion);
      await expect(page).toHaveURL(new RegExp(`\\?provincia=${eleccion}$`));
      await tarjetasActividad(page).first().click();
      await expect(page).toHaveURL(/\/actividades\/[a-z0-9-]+$/, { timeout: 15_000 });
      await grabarFrames(page);
      await page.goBack();
      await expect(page).toHaveURL(new RegExp(`\\?provincia=${eleccion}$`), { timeout: 15_000 });
      await expect(page.locator("#provincia-filtro")).toHaveValue(eleccion);
      expect(await hrefs(page)).toEqual(slugsDe(eleccion));
      // Ningún frame de la grilla mostró otra provincia (solo el detalle previo, sin grilla).
      expect((await framesDistintos(page)).filter(Boolean)).toEqual([slugsDe(eleccion).join(",")]);
      await page.goForward();
      await page.goBack();
      await expect(page.locator("#provincia-filtro")).toHaveValue(eleccion);
      await page.reload();
      await expect(page.locator("#provincia-filtro")).toHaveValue(eleccion);
      expect(await hrefs(page)).toEqual(slugsDe(eleccion));
    }
  });

  test("cambios rápidos sucesivos terminan en el último sin rebotes", async ({ page, errores }) => {
    void errores;
    await page.goto("/actividades");
    await page.locator("#provincia-filtro[data-hidratado]").waitFor();
    for (const slug of ["mendoza", "salta", "jujuy", "chubut"]) await page.selectOption("#provincia-filtro", slug);
    await grabarFrames(page);
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/\?provincia=chubut$/);
    await expect(page.locator("#provincia-filtro")).toHaveValue("chubut");
    expect(await framesDistintos(page)).toEqual([slugsDe("chubut").join(",")]);
  });

  test("los enlaces de cada página provincial llegan filtrados, incluida Catamarca", async ({ page, errores }) => {
    void errores;
    // santa_fe vuelve a la lista: su error de hidratación intermitente se corrigió en PR 05.
    for (const slug of ["santa_fe", "catamarca", "mendoza", "tierra_del_fuego"]) {
      await page.goto(`/provincias/${slug}`);
      await grabarFrames(page);
      await page.locator(`a[href="/actividades?provincia=${slug}"]`).first().click();
      await expect(page).toHaveURL(new RegExp(`/actividades\\?provincia=${slug}$`));
      await expect(page.locator("#provincia-filtro")).toHaveValue(slug);
      expect(await hrefs(page)).toEqual(slugsDe(slug));
      expect((await framesDistintos(page)).filter(Boolean)).toEqual([slugsDe(slug).join(",")]);
    }
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

test.describe("navbar", () => {
  const menu = (page: Page) => page.locator("#menu-movil");
  const boton = (page: Page) => page.locator('button[aria-controls="menu-movil"]');
  // Un toque antes de hidratar no hace nada: se reintenta hasta que el menú responde.
  // Termina cuando concluyó la transición de apertura y el menú quedó en su lugar.
  const abrir = async (page: Page, accion = () => boton(page).click()) => {
    await expect(async () => {
      await accion();
      await expect(boton(page)).toHaveAttribute("aria-expanded", "true", { timeout: 1000 });
    }).toPass();
    await expect.poll(() => menu(page).evaluate(el => el.getBoundingClientRect().top)).toBe(0);
  };

  test("escritorio: los enlaces navegan", async ({ page, errores, isMobile }) => {
    void errores;
    test.skip(isMobile, "solo escritorio");
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Navegación principal" });
    await nav.getByRole("link", { name: "Qué hacer: actividades turísticas por provincia" }).click();
    await expect(page).toHaveURL(/\/actividades$/);
    await expect(tarjetasActividad(page)).toHaveCount(72);
  });

  test("móvil: abre y cierra con estados accesibles y foco gestionado", async ({ page, errores, isMobile }) => {
    void errores;
    test.skip(!isMobile, "solo móvil");
    await page.goto("/");
    await expect(boton(page)).toHaveAttribute("aria-expanded", "false");
    await expect(boton(page)).toHaveAccessibleName("Abrir menú");
    // Cerrado, el menú es inert: ni foco ni lectores de pantalla.
    await expect(menu(page)).toHaveAttribute("inert", "");
    await abrir(page);
    await expect(boton(page)).toHaveAccessibleName("Cerrar menú");
    await expect(menu(page)).not.toHaveAttribute("inert");
    await expect(menu(page).getByRole("link").first()).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe("hidden");
    await boton(page).click();
    await expect(boton(page)).toHaveAttribute("aria-expanded", "false");
    await expect(menu(page)).toHaveAttribute("inert", "");
    expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe("");
  });

  test("móvil: Escape cierra, devuelve el foco y Tab no sale del menú abierto", async ({ page, errores, isMobile }) => {
    void errores;
    test.skip(!isMobile, "solo móvil");
    await page.goto("/");
    await abrir(page, async () => { await boton(page).focus(); await page.keyboard.press("Enter"); });
    await expect(menu(page).getByRole("link").first()).toBeFocused();
    // Recorre las 5 opciones; Tab desde la última vuelve al logo, dentro del navbar.
    for (let i = 0; i < 4; i++) await page.keyboard.press("Tab");
    await expect(menu(page).getByRole("link", { name: /Noticias/ })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("navigation", { name: "Navegación principal" }).getByRole("link", { name: "Inicio - Argentina Universo Sur" })).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(menu(page).getByRole("link", { name: /Noticias/ })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(boton(page)).toHaveAttribute("aria-expanded", "false");
    await expect(boton(page)).toBeFocused();
  });

  // Antes de PR 05 los enlaces eran inline con py-6: el relleno de cada uno tapaba el texto del
  // anterior y tocar "Qué hacer" abría "Escapadas". Cada toque real cae ahora en su enlace.
  test("móvil: cada opción recibe su propio toque y el menú se cierra al navegar", async ({ page, errores, isMobile }) => {
    void errores;
    test.skip(!isMobile, "solo móvil");
    await page.goto("/");
    await abrir(page);
    const solapados = await page.evaluate(() => [...document.querySelectorAll("#menu-movil a")].filter(a => {
      const r = a.getBoundingClientRect();
      return r.height < 44 || document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)?.closest("a") !== a;
    }).map(a => a.textContent));
    expect(solapados).toEqual([]);
    for (const [nombre, ruta] of [["Viaja por Argentina", "/provincias"], ["Qué hacer", "/actividades"], ["Escapadas", "/escapadas"], ["Guía de seguridad", "/seguridad"]]) {
      if ((await boton(page).getAttribute("aria-expanded")) !== "true") await abrir(page);
      const enlace = menu(page).getByRole("link").filter({ hasText: nombre });
      await expect(enlace).toBeVisible();
      const caja = (await enlace.boundingBox())!;
      // Toque en la mitad superior del enlace: donde antes caía el relleno del siguiente.
      await page.touchscreen.tap(caja.x + caja.width - 20, caja.y + caja.height * 0.3);
      await expect(page).toHaveURL(new RegExp(`${ruta}$`));
      await expect(boton(page)).toHaveAttribute("aria-expanded", "false");
      await expect(menu(page)).toHaveAttribute("inert", "");
    }
  });

  test("móvil: pasar a escritorio cierra el menú y libera el scroll", async ({ page, errores, isMobile }) => {
    void errores;
    test.skip(!isMobile, "solo móvil");
    await page.goto("/");
    await abrir(page);
    await page.setViewportSize({ width: 1024, height: 800 });
    await expect(boton(page)).toHaveAttribute("aria-expanded", "false");
    expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe("");
    await page.setViewportSize({ width: 412, height: 839 });
    await expect(menu(page)).toHaveAttribute("inert", "");
  });

  test("móvil: volver atrás con el menú abierto lo cierra", async ({ page, errores, isMobile }) => {
    void errores;
    test.skip(!isMobile, "solo móvil");
    await page.goto("/seguridad");
    await page.goto("/escapadas");
    await abrir(page);
    await page.goBack();
    await expect(page).toHaveURL(/\/seguridad$/);
    await expect(boton(page)).toHaveAttribute("aria-expanded", "false");
  });
});

const DETALLE = "/actividades/vivir-la-magia-del-teatro-colon";

// Suma de layout-shift sin interacción previa, como la métrica CLS.
const medirCLS = (page: Page) => page.evaluate(() => new Promise<number>(resolver => {
  let cls = 0;
  new PerformanceObserver(lista => {
    for (const e of lista.getEntries() as Array<PerformanceEntry & { value: number; hadRecentInput: boolean }>) if (!e.hadRecentInput) cls += e.value;
  }).observe({ type: "layout-shift", buffered: true });
  setTimeout(() => resolver(cls), 1500);
}));

test.describe("mapas", () => {
  test("el HTML del detalle trae la vista previa del mapa con alto reservado, teselas y marcador", async ({ request }) => {
    const html = await (await request.get(DETALLE)).text();
    const region = html.match(/<div role="region" aria-label="Mapa de ubicación: [^"]+" class="([^"]+)"/);
    expect(region?.[1]).toContain("h-96");
    expect(html.match(/<img[^>]+src="https:\/\/tile\.openstreetmap\.org\/13\/\d+\/\d+\.png"/g)?.length).toBeGreaterThanOrEqual(6);
    // Diferidas: en móvil, sobre el pliegue, quedan en display: none y no se descargan.
    const teselas = html.match(/<img[^>]+src="https:\/\/tile\.openstreetmap\.org\/[^>]+>/g) ?? [];
    expect(teselas.every(img => img.includes('loading="lazy"'))).toBe(true);
    expect(html).toMatch(/src="\/_next\/static\/media\/marker-icon\.[^"]+\.png"/);
    expect(html).not.toContain("unpkg.com");
  });

  for (const ruta of [DETALLE, "/provincias/catamarca", "/provincias/santa_fe", "/provincias"]) {
    test(`${ruta}: el mapa no desplaza el contenido (CLS)`, async ({ page, errores }) => {
      void errores;
      await page.goto(ruta);
      if (ruta === "/provincias") await page.locator('svg[aria-label="Mapa de provincias de Argentina"] path').first().waitFor();
      await page.waitForLoadState("load");
      expect(await medirCLS(page)).toBeLessThan(0.01);
    });
  }

  // Sobre el pliegue en móvil, ~150 KB de teselas pasarían a ser el LCP: se muestra un fondo liviano
  // hasta activar el mapa. Debajo del pliegue (capital) la vista previa trae solo las teselas visibles.
  test("móvil: el mapa del detalle no descarga teselas y el de la capital solo las visibles", async ({ page, errores, isMobile }) => {
    void errores;
    test.skip(!isMobile, "solo móvil");
    const teselas = new Set<string>();
    page.on("request", r => { if (r.url().startsWith("https://tile.openstreetmap.org/")) teselas.add(r.url()); });
    await page.goto(DETALLE);
    await page.waitForLoadState("load");
    await page.waitForTimeout(500);
    expect(teselas.size).toBe(0);
    await expect(page.getByRole("button", { name: /^Explorar mapa interactivo: / })).toBeVisible();
    await page.goto("/provincias/catamarca");
    await page.locator('[role="region"]').scrollIntoViewIfNeeded();
    await expect.poll(() => teselas.size).toBeGreaterThan(0);
    await page.waitForTimeout(500);
    const visibles = await page.locator('[role="region"] button img[src*="tile.openstreetmap.org"]').evaluateAll(imgs => imgs.filter(i => getComputedStyle(i).display !== "none").length);
    expect(teselas.size).toBe(visibles);
    expect(teselas.size).toBeLessThanOrEqual(9);
  });

  test("escritorio: el detalle muestra las teselas reales en la vista previa", async ({ page, errores, isMobile }) => {
    void errores;
    test.skip(isMobile, "solo escritorio");
    await page.goto(DETALLE);
    const teselas = page.locator('[role="region"] button img[src*="tile.openstreetmap.org"]');
    await expect.poll(() => teselas.evaluateAll(imgs => (imgs as HTMLImageElement[]).filter(i => i.complete && i.naturalWidth > 0 && getComputedStyle(i).display !== "none").length)).toBeGreaterThanOrEqual(6);
  });

  test("Leaflet se carga al activar el mapa (toque o teclado) y responde a + y flechas", async ({ page, errores }) => {
    void errores;
    await page.goto(DETALLE);
    await page.waitForLoadState("load");
    const mapa = page.locator(".leaflet-container");
    await expect(mapa).toHaveCount(0);
    const activar = page.getByRole("button", { name: /^Explorar mapa interactivo: / });
    await expect(async () => {
      if (await activar.count()) { await activar.focus(); await page.keyboard.press("Enter"); }
      await expect(mapa).toBeVisible({ timeout: 2000 });
    }).toPass();
    // La vista previa se retira cuando cargaron las teselas y el foco queda en el mapa.
    await expect(activar).toHaveCount(0);
    await expect(mapa).toBeFocused();
    await expect(mapa).toHaveAttribute("aria-label", /^Mapa interactivo: Vivir la magia del Teatro Colón\./);
    await expect(page.getByRole("button", { name: "Acercar" })).toBeVisible();
    await expect(page.locator(".leaflet-marker-icon")).toHaveAttribute("alt", "Vivir la magia del Teatro Colón");
    const pane = page.locator(".leaflet-map-pane");
    const posicion = await pane.getAttribute("style");
    await page.keyboard.press("ArrowRight");
    await expect.poll(() => pane.getAttribute("style")).not.toBe(posicion);
    await page.keyboard.press("Equal");
    await expect(page.locator('img.leaflet-tile[src*="/14/"]').first()).toBeAttached();
  });

  test("/provincias: el mapa SVG se recorre con teclado y Enter abre la provincia", async ({ page, errores }) => {
    void errores;
    await page.goto("/provincias");
    const santaFe = page.locator('svg[aria-label="Mapa de provincias de Argentina"] path#AR-S');
    await expect(santaFe).toHaveAttribute("aria-label", "Ver turismo en Santa Fe");
    await santaFe.focus();
    await expect(santaFe).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/provincias\/santa_fe$/);
  });
});

// React #418 intermitente en /provincias/santa_fe (y en cualquier página bajo streaming lento): un
// bug de React al reanudar la hidratación cuando una fila diferida de Flight llega tarde
// (react/react#37584, corregido en el React que incluye Next 16.2+). Este proxy entrega cada fila
// por separado, como un render dinámico en frío. Con Next 16.1 fallaban entre 1 de cada 25 y 1
// de cada 4 cargas según perfil y provincia: con 25 cargas, cada combinación falló al menos una vez.
test.describe("hidratación con streaming lento", () => {
  const CARGAS = 25;
  let proxy: http.Server;
  let origen = "";

  test.beforeAll(async () => {
    const upstream = test.info().project.use.baseURL!;
    proxy = http.createServer(async (req, res) => {
      try {
        const r = await fetch(upstream + req.url, { headers: { accept: req.headers.accept ?? "*/*", "accept-encoding": "identity" }, redirect: "manual" });
        const headers = Object.fromEntries([...r.headers].filter(([k]) => !["content-length", "content-encoding", "transfer-encoding"].includes(k)));
        res.writeHead(r.status, headers);
        if (!(r.headers.get("content-type") ?? "").includes("text/html")) { res.end(Buffer.from(await r.arrayBuffer())); return; }
        const html = await r.text();
        let desde = 0;
        for (const { index } of html.matchAll(/<script>self\.__next_f\.push/g)) {
          res.write(html.slice(desde, index));
          desde = index;
          await new Promise(listo => setTimeout(listo, 35));
        }
        res.end(html.slice(desde));
      } catch {
        res.destroy();
      }
    });
    await new Promise<void>(listo => proxy.listen(0, "127.0.0.1", listo));
    origen = `http://127.0.0.1:${(proxy.address() as AddressInfo).port}`;
  });

  test.afterAll(() => new Promise<void>(listo => proxy.close(() => listo())));

  for (const slug of ["santa_fe", "catamarca"]) {
    test(`/provincias/${slug}: ${CARGAS} cargas seguidas sin errores de hidratación`, async ({ page, errores }) => {
      test.setTimeout(120_000);
      for (let i = 1; i <= CARGAS; i++) {
        await page.goto(`${origen}/provincias/${slug}`);
        // El tracker escribe en un efecto: la raíz ya terminó de hidratar (o de recuperarse).
        await page.waitForFunction(s => (localStorage.getItem("provinciasVisitadas") ?? "").includes(`"${s}"`), slug);
        expect(errores, `carga ${i} de ${CARGAS}`).toEqual([]);
        await page.evaluate(() => localStorage.clear());
      }
    });
  }
});

test.describe("accesibilidad", () => {
  for (const ruta of ["/", "/provincias", "/provincias/santa_fe", DETALLE, "/privacidad"]) {
    test(`${ruta}: todos los controles tienen nombre accesible`, async ({ page, errores }) => {
      void errores;
      await page.goto(ruta);
      if (ruta === "/provincias") await page.locator('svg[aria-label="Mapa de provincias de Argentina"] path').first().waitFor();
      const sinNombre = await page.evaluate(() => [...document.querySelectorAll("a[href], button, select, input, [role=button], [role=link]")]
        .filter(el => !(el.getAttribute("aria-label")?.trim() || el.getAttribute("aria-labelledby") || el.textContent?.trim()
          || el.querySelector("img[alt]:not([alt=''])") || (el.id && document.querySelector(`label[for="${el.id}"]`))))
        .map(el => el.outerHTML.slice(0, 120)));
      expect(sinNombre).toEqual([]);
    });
  }

  test("áreas táctiles mínimas en móvil: menú 44 px, puntos del carrusel 24 px", async ({ page, errores, isMobile }) => {
    void errores;
    test.skip(!isMobile, "solo móvil");
    await page.goto(DETALLE);
    const menu = (await page.locator('button[aria-controls="menu-movil"]').boundingBox())!;
    expect(Math.min(menu.width, menu.height)).toBeGreaterThanOrEqual(44);
    const puntos = await page.getByRole("button", { name: /^Ir a imagen \d+$/ }).evaluateAll(bs => bs.map(b => b.getBoundingClientRect()).map(r => Math.min(r.width, r.height)));
    expect(puntos.length).toBeGreaterThan(1);
    expect(Math.min(...puntos)).toBeGreaterThanOrEqual(24);
  });

  test("el carrusel del detalle rota solo, salvo con movimiento reducido", async ({ page, errores }) => {
    void errores;
    const imagen = page.locator('img[alt*=" - Imagen "]');
    await page.clock.install();
    await page.goto(DETALLE);
    await page.clock.runFor(3500);
    await expect(imagen).toHaveAttribute("alt", /Imagen 2 de/);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.reload();
    await page.clock.runFor(10_000);
    await expect(imagen).toHaveAttribute("alt", /Imagen 1 de/);
  });
});

test("el pie enlaza al aviso de privacidad, que no se indexa y tiene su canonical", async ({ page, errores, request }) => {
  void errores;
  const html = await (await request.get("/privacidad")).text();
  expect(html).toContain('<link rel="canonical" href="https://www.argentinauniversosur.com/privacidad"/>');
  expect(html).toMatch(/<meta name="robots" content="noindex, follow"\/>/);
  expect(html).toContain("Ley N° 25.326");
  expect(html).toContain("Google Analytics no está activo en este momento");
  await page.goto("/");
  await page.getByRole("contentinfo").getByRole("link", { name: "Privacidad y cookies" }).click();
  await expect(page).toHaveURL(/\/privacidad$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Privacidad y cookies/i);
  await expect(page.locator('a[href^="mailto:"]').first()).toHaveAttribute("href", /^mailto:[^@\s]+@[^@\s]+\.[a-z]{2,}$/i);
});

// La build de CI y la local no son producción de Vercel: GA4 no debe cargarse ni enviar datos.
test("fuera de producción no se carga Google Analytics ni se envían datos a Google", async ({ page, errores }) => {
  void errores;
  const pedidos: string[] = [];
  page.on("request", r => { if (/googletagmanager\.com|google-analytics\.com|doubleclick\.net/.test(r.url())) pedidos.push(r.url()); });
  for (const ruta of ["/", "/provincias/santa_fe", DETALLE]) {
    await page.goto(ruta);
    await page.waitForLoadState("load");
    await expect(page.locator('script[src*="googletagmanager.com"], script#_next-ga-init')).toHaveCount(0);
    // Sin GA4 configurado tampoco hay banner de cookies: no se pide permiso para algo inactivo.
    await expect(page.getByRole("region", { name: "Aviso de cookies" })).toHaveCount(0);
    expect(await page.evaluate(() => "dataLayer" in window)).toBe(false);
  }
  expect(pedidos).toEqual([]);
});

test("la metadata canónica no cambia y el sitemap mantiene 106 URLs", async ({ request }) => {
  const canonical = async (path: string) => (await (await request.get(path)).text()).match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  expect(await canonical("/")).toBe("https://www.argentinauniversosur.com");
  expect(await canonical("/actividades?provincia=catarmaca")).toBe("https://www.argentinauniversosur.com/actividades");
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap.match(/<loc>/g)).toHaveLength(106);
});
