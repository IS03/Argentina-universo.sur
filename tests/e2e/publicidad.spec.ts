import { test, expect, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { CAMPANAS, urlAnuncio } from "../../lib/publicidad";

// Pauta de octubre de 2026. La primera campaña de cada página va antes de «antes»; las rutas sin ids
// tuvieron campañas hasta septiembre y ya no deben mostrar ninguna.
const PAGINAS = [
  { ruta: "/", ids: ["juegos-suramericanos", "seguridad-vial", "mil-aulas"], antes: "#provincias-destacadas", primeraPantalla: true },
  { ruta: "/actividades", ids: ["obras-hidricas"], antes: "#provincia-filtro", primeraPantalla: true },
  { ruta: "/escapadas", ids: ["mamografia"], antes: "#guias-escapadas-heading", primeraPantalla: true },
  { ruta: "/provincias", ids: ["proteccion-ingresos"], antes: "#region-norte", primeraPantalla: false },
  { ruta: "/provincias/santa_fe", ids: [], antes: "", primeraPantalla: false },
  { ruta: "/seguridad", ids: [], antes: "", primeraPantalla: false },
];
const activas = (ids: string[]) => ids.filter(id => CAMPANAS.some(c => c.id === id && c.activa));

// Comparar píxeles con tolerancia al redondeo subpíxel, no bytes PNG de capturas móviles.
async function diferenciaVisual(a: Buffer, b: Buffer) {
  const pixels = await Promise.all([a, b].map(bytes => sharp(bytes).resize(120, 120, { fit: "fill" }).removeAlpha().raw().toBuffer()));
  return pixels[0].reduce((total, value, i) => total + Math.abs(value - pixels[1][i]), 0) / pixels[0].length;
}

test.beforeEach(async ({ context, page }) => {
  await context.route(/tile\.openstreetmap\.org/, route => route.abort());
  await page.emulateMedia({ reducedMotion: "no-preference" });
});

test("banners originales antes del contenido: sin tarjetas, textos añadidos ni desbordamiento", async ({ page, isMobile }, testInfo) => {
  test.setTimeout(120_000);
  const errores: string[] = [];
  page.on("pageerror", error => errores.push(error.message));
  page.on("console", message => { if (message.type() === "error" && /hydration|hydrating|didn't match/i.test(message.text())) errores.push(message.text()); });
  const evidencias = [];
  for (const ancho of isMobile ? [null] : [320, 768, 1440]) {
    if (ancho) await page.setViewportSize({ width: ancho, height: 1000 });
    for (const { ruta, ids: configuradas, antes, primeraPantalla } of PAGINAS) {
      const ids = activas(configuradas);
      expect((await page.goto(ruta))?.status()).toBe(200);
      const espacios = page.locator("[data-espacio-publicitario]");
      expect(await page.locator("[data-campana]").evaluateAll(es => es.map(e => e.getAttribute("data-campana")))).toEqual(ids);
      if (!ids.length) { await expect(espacios).toHaveCount(0); continue; }
      for (const espacio of await espacios.all()) {
        await expect(espacio).toHaveText("");
        await expect(espacio.locator("p, details, summary, h2, h3, figcaption")).toHaveCount(0);
      }
      const espacio = espacios.first();
      const posicion = await espacio.evaluate((e, selector) => {
        const header = document.querySelector('main h1')?.closest('header, section');
        const contenido = document.querySelector(selector);
        return { despuesDelEncabezado: !!header && !!(header.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING), antesDelContenido: !!contenido && !!(e.compareDocumentPosition(contenido) & Node.DOCUMENT_POSITION_FOLLOWING), top: e.getBoundingClientRect().top + scrollY };
      }, antes);
      expect(posicion.despuesDelEncabezado).toBe(true);
      expect(posicion.antesDelContenido).toBe(true);
      if (primeraPantalla) expect(posicion.top).toBeLessThan(page.viewportSize()!.height + 100);
      for (const id of ids) {
        const anuncio = page.locator(`[data-campana="${id}"]`), campana = CAMPANAS.find(c => c.id === id)!;
        const destino = urlAnuncio(campana.url);
        if (destino) {
          await expect(anuncio.locator("a")).toHaveAttribute("href", destino);
          await expect(anuncio.locator("a")).toHaveAttribute("rel", "sponsored noopener noreferrer");
        } else await expect(anuncio.locator("a")).toHaveCount(0);
        const img = anuncio.locator("img");
        await expect(img).toBeVisible();
        const datos = await img.evaluate(async element => {
          const image = element as HTMLImageElement;
          await image.decode();
          const rect = image.getBoundingClientRect(), style = getComputedStyle(image), wrapper = getComputedStyle(image.closest('[data-campana]')!);
          return { proporcion: rect.width / rect.height, original: image.naturalWidth / image.naturalHeight, ajuste: style.objectFit, src: new URL(image.currentSrc).pathname, borde: wrapper.borderWidth, fondo: wrapper.backgroundColor };
        });
        expect(datos.proporcion).toBeCloseTo(datos.original, 1);
        expect(datos.ajuste).toBe("contain");
        expect(datos.src).toBe(campana.imagen.src);
        expect(datos.borde).toBe("0px");
        expect(datos.fondo).toBe("rgba(0, 0, 0, 0)");
        const recurso = await page.request.get(datos.src);
        expect(recurso.status()).toBe(200);
        expect(recurso.headers()["content-type"]).toContain(campana.original.endsWith(".gif") ? "image/gif" : "image/jpeg");
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (isMobile || ancho === 1440 || ancho === 320) {
        if (ids.includes("mamografia") && process.env.AUS_PUBLICIDAD_CAPTURAS === "1") await page.waitForTimeout(7000);
        await espacio.evaluate(e => e.scrollIntoView({ block: "center", behavior: "instant" }));
        const dispositivo = testInfo.project.name.includes("iphone") ? "iphone-safari" : isMobile ? "pixel7" : ancho;
        const nombre = `${dispositivo}-${ruta === "/" ? "inicio" : ruta.slice(1).replaceAll("/", "-")}.jpg`;
        const carpeta = process.env.AUS_PUBLICIDAD_CAPTURAS === "1" ? (testInfo.project.metadata.publicExport ? ".artifacts/publicidad-octubre-2026/capturas-pages" : "docs/publicidad-octubre-2026/capturas") : testInfo.outputPath("capturas");
        await mkdir(carpeta, { recursive: true });
        await page.screenshot({ path: join(carpeta, nombre), type: "jpeg", quality: 85, animations: "allow" });
      }
      evidencias.push({ ruta, ancho: page.viewportSize()?.width, ids, ...posicion });
    }
  }
  expect(errores).toEqual([]);
  await testInfo.attach("ubicaciones-y-pantallas", { body: JSON.stringify(evidencias, null, 2), contentType: "application/json" });
});

test("los cinco GIF se animan automáticamente y el JPEG permanece estático", async ({ page }) => {
  test.setTimeout(60_000);
  for (const { ruta, ids } of PAGINAS) {
    for (const id of activas(ids)) {
      await page.goto(ruta);
      const image = page.locator(`[data-campana="${id}"] img`);
      await image.evaluate(img => (img as HTMLImageElement).decode());
      await image.evaluate(img => img.scrollIntoView({ block: "center", behavior: "instant" }));
      const primera = await image.screenshot({ animations: "allow", scale: "css" });
      if (CAMPANAS.find(c => c.id === id)!.original.endsWith(".gif")) {
        await expect.poll(async () => diferenciaVisual(primera, await image.screenshot({ animations: "allow", scale: "css" })), { timeout: 10_000, intervals: [500, 750, 1000], message: id }).toBeGreaterThan(2);
      } else {
        await page.waitForTimeout(2700);
        expect(await diferenciaVisual(primera, await image.screenshot({ scale: "css" })), id).toBeLessThan(1);
      }
    }
  }
});

test("movimiento reducido selecciona imágenes estáticas sin cambiar la geometría", async ({ page }) => {
  test.setTimeout(60_000);
  for (const { ruta, ids } of PAGINAS) {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto(ruta);
    const antes = await page.locator("[data-campana] img").evaluateAll(imgs => imgs.map(img => ({ ancho: img.getBoundingClientRect().width, alto: img.getBoundingClientRect().height })));
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const id of activas(ids)) {
      const campana = CAMPANAS.find(c => c.id === id)!, image = page.locator(`[data-campana="${id}"] img`);
      await expect.poll(() => image.evaluate(img => (img as HTMLImageElement).currentSrc ? new URL((img as HTMLImageElement).currentSrc).pathname : null)).toBe(campana.movimientoReducido?.src || campana.imagen.src);
      await image.evaluate(img => (img as HTMLImageElement).decode());
      await image.evaluate(img => img.scrollIntoView({ block: "center", behavior: "instant" }));
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const primera = await image.screenshot({ scale: "css" });
      await page.waitForTimeout(2700);
      expect(await diferenciaVisual(primera, await image.screenshot({ scale: "css" })), id).toBeLessThan(1);
    }
    const despues = await page.locator("[data-campana] img").evaluateAll(imgs => imgs.map(img => ({ ancho: img.getBoundingClientRect().width, alto: img.getBoundingClientRect().height })));
    expect(despues).toEqual(antes);
  }
});

test("imágenes demoradas: reserva de espacio estable y CLS sin desplazamientos de publicidad", async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  await page.addInitScript(() => {
    const shifts: { value: number; publicidad: boolean }[] = [];
    const soportado = PerformanceObserver.supportedEntryTypes.includes("layout-shift");
    Object.assign(window, { publicidadShifts: shifts, clsSoportado: soportado });
    if (soportado) new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        const shift = entry as PerformanceEntry & { hadRecentInput: boolean; value: number; sources?: { node: Element | null }[] };
        if (!shift.hadRecentInput) shifts.push({ value: shift.value, publicidad: !!shift.sources?.some(s => s.node?.closest?.("[data-espacio-publicitario]")) });
      }
    }).observe({ type: "layout-shift", buffered: true });
  });
  const mediciones = [];
  for (const { ruta, ids } of PAGINAS) {
    if (!activas(ids).length) continue;
    let liberar!: () => void;
    const bloqueado = new Promise<void>(resolve => { liberar = resolve; });
    await page.route("**/publicidad/*", async route => { await bloqueado; await route.continue(); });
    try {
      await page.goto(ruta, { waitUntil: "domcontentloaded" });
      // WebKit fonts.ready espera también las imágenes bloqueadas. Cargamos las fuentes web,
      // excluyendo solo los ajustes métricos Fallback de next/font: usan local(Arial/Times),
      // que puede no existir en Linux y no representa una descarga fallida del sitio.
      const fuentesWeb = await page.evaluate(async () => {
        const fonts = [...document.fonts].filter(font => !font.family.includes("Fallback"));
        await Promise.all(fonts.map(font => font.load()));
        return fonts.length;
      });
      expect(fuentesWeb).toBeGreaterThan(0);
      const imagenes = page.locator("[data-campana] img");
      const geometria = () => imagenes.evaluateAll(imgs => imgs.map(img => ({ ancho: img.getBoundingClientRect().width, alto: img.getBoundingClientRect().height, top: img.getBoundingClientRect().top + scrollY })));
      const antes = await geometria();
      for (const rect of antes) { expect(rect.ancho).toBeGreaterThan(0); expect(rect.alto).toBeGreaterThan(0); }
      liberar();
      for (const img of await imagenes.all()) await img.evaluate(img => (img as HTMLImageElement).decode());
      expect(await geometria()).toEqual(antes);
      const datos = await page.evaluate(() => {
        const state = window as unknown as { publicidadShifts: { value: number; publicidad: boolean }[]; clsSoportado: boolean };
        return { soportado: state.clsSoportado, cls: state.publicidadShifts.reduce((n, s) => n + s.value, 0), publicidad: state.publicidadShifts.filter(s => s.publicidad).reduce((n, s) => n + s.value, 0) };
      });
      if (datos.soportado) { expect(datos.cls).toBeLessThan(0.1); expect(datos.publicidad).toBe(0); }
      mediciones.push({ ruta, geometriaEstable: true, cls: datos.soportado ? datos.cls : null, clsPublicidad: datos.soportado ? datos.publicidad : null });
    } finally { liberar(); await page.unrouteAll({ behavior: "wait" }); }
  }
  await testInfo.attach("CLS-y-reserva", { body: JSON.stringify(mediciones, null, 2), contentType: "application/json" });
});

test("picture y la alternativa estática funcionan sin JavaScript a 320 px", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false, viewport: { width: 320, height: 800 }, reducedMotion: "reduce" });
  await context.route(/tile\.openstreetmap\.org/, route => route.abort());
  const page = await context.newPage();
  try {
    for (const { ruta, ids } of PAGINAS) {
      await page.goto(ruta);
      for (const id of activas(ids)) {
        const campana = CAMPANAS.find(c => c.id === id)!, image = page.locator(`[data-campana="${id}"] img`);
        await expect(image).toBeVisible();
        expect(await image.evaluate(img => new URL((img as HTMLImageElement).currentSrc).pathname)).toBe(campana.movimientoReducido?.src || campana.imagen.src);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  } finally { await context.close(); }
});

// Pantallas de referencia del pedido de octubre de 2026: iPhone chico, iPhone actual, Android,
// tablet vertical y horizontal, escritorio de 1366 y escritorio ancho.
const PANTALLAS = [
  { width: 320, height: 568 },
  { width: 375, height: 667 },
  { width: 393, height: 852 },
  { width: 412, height: 915 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1366, height: 768 },
  { width: 1920, height: 1080 },
];
const COLUMNAS_DESDE = 1280; // breakpoint xl: columnas laterales en la portada y junto al mapa

type Caja = { x: number; y: number; ancho: number; alto: number; derecha: number; abajo: number };
const caja = (page: Page, selector: string): Promise<Caja> => page.locator(selector).first().evaluate(e => {
  const r = e.getBoundingClientRect();
  return { x: r.left, y: r.top + scrollY, ancho: r.width, alto: r.height, derecha: r.right, abajo: r.bottom + scrollY };
});
const img = (id: string) => `[data-campana="${id}"] img`;
const centrada = (c: Caja, ancho: number) => expect(Math.abs(c.x + c.ancho / 2 - ancho / 2)).toBeLessThan(2);

// Nada tapa al anuncio y el anuncio no tapa enlaces ni controles visibles (debajo del encabezado fijo).
async function sinSuperposiciones(page: Page) {
  return page.evaluate(() => {
    const encabezado = document.querySelector("body > header, header")?.getBoundingClientRect().bottom ?? 0;
    const problemas: string[] = [];
    for (const anuncio of document.querySelectorAll<HTMLImageElement>("[data-campana] img")) {
      const r = anuncio.getBoundingClientRect();
      const y = r.top + r.height / 2, x = r.left + r.width / 2;
      if (y > encabezado && y < innerHeight && document.elementFromPoint(x, y) !== anuncio) problemas.push(`tapado: ${anuncio.closest("[data-campana]")!.getAttribute("data-campana")}`);
    }
    for (const control of document.querySelectorAll<HTMLElement>("main a, main button, main select, main input")) {
      if (control.closest("[data-espacio-publicitario]")) continue;
      const r = control.getBoundingClientRect();
      const y = r.top + r.height / 2, x = r.left + r.width / 2;
      if (!r.width || y <= encabezado || y >= innerHeight || x < 0 || x >= innerWidth) continue;
      if (document.elementFromPoint(x, y)?.closest("[data-espacio-publicitario]")) problemas.push(`control tapado: ${control.textContent?.trim().slice(0, 40)}`);
    }
    return problemas;
  });
}

async function recorrerYVerificar(page: Page, problemas: string[], etiqueta: string) {
  const alto = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < alto; y += Math.round(page.viewportSize()!.height * 0.7)) {
    await page.evaluate(destino => scrollTo({ top: destino, behavior: "instant" }), y);
    problemas.push(...(await sinSuperposiciones(page)).map(p => `${etiqueta} y=${y}: ${p}`));
  }
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
}

test("cada creatividad ocupa su ubicación contratada en todos los tamaños de pantalla", async ({ page, isMobile }, testInfo) => {
  test.setTimeout(240_000);
  const errores: string[] = [];
  page.on("pageerror", error => errores.push(error.message));
  const problemas: string[] = [];
  const evidencias: Record<string, unknown>[] = [];
  const activa = (id: string) => CAMPANAS.some(c => c.id === id && c.activa);
  for (const pantalla of isMobile ? [page.viewportSize()!] : PANTALLAS) {
    if (!isMobile) await page.setViewportSize(pantalla);
    const { width, height } = pantalla, columnas = width >= COLUMNAS_DESDE;
    const encabezado = async () => page.evaluate(() => document.querySelector("header")!.getBoundingClientRect().bottom);
    const etiqueta = `${width}x${height}`;

    // Inicio: JJSS al centro y entre lo primero visible; APSV a la izquierda (fija en escritorio); Mil Aulas a la derecha.
    await page.goto("/");
    const destacadas = await caja(page, "#provincias-destacadas");
    const regiones = await caja(page, 'section[aria-labelledby="titulo-regiones"]');
    if (activa("juegos-suramericanos")) {
      const jjss = await caja(page, img("juegos-suramericanos"));
      expect(jjss.y, `${etiqueta} JJSS en la primera pantalla`).toBeLessThan(height);
      expect(jjss.ancho).toBeLessThanOrEqual(800);
      expect(jjss.abajo).toBeLessThan(destacadas.y);
      if (!columnas) centrada(jjss, width);
      evidencias.push({ etiqueta, campana: "juegos-suramericanos", ...jjss });
    }
    if (activa("seguridad-vial")) {
      const apsv = await caja(page, img("seguridad-vial"));
      expect(apsv.ancho, "APSV conserva 200 × 200 sin estirarse").toBe(200);
      expect(apsv.alto).toBe(200);
      const posicion = await page.locator('[data-espacio-publicitario="portada-lateral-izquierda"]').evaluate(e => getComputedStyle(e).position);
      if (columnas) {
        expect(posicion).toBe("sticky");
        expect(apsv.derecha).toBeLessThan(destacadas.x);
        expect(apsv.y).toBeLessThan(destacadas.y);
        // Al desplazar queda fija debajo del encabezado, sin superponerse con él.
        await page.evaluate(y => scrollTo({ top: y, behavior: "instant" }), destacadas.y);
        const fija = await page.locator(img("seguridad-vial")).evaluate(e => e.getBoundingClientRect().top);
        expect(Math.abs(fija - ((await encabezado()) + 24))).toBeLessThan(2);
        // Al final de la página se suelta dentro de su columna y no invade el pie.
        await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
        const final = await page.evaluate(() => ({ anuncio: document.querySelector('[data-campana="seguridad-vial"]')!.getBoundingClientRect().bottom, pie: document.querySelector("footer")!.getBoundingClientRect().top }));
        expect(final.anuncio).toBeLessThanOrEqual(final.pie);
        await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
      } else {
        expect(posicion, "en móvil va en el flujo, nunca fija").toBe("static");
        expect(apsv.y).toBeGreaterThan(destacadas.abajo);
        expect(apsv.abajo).toBeLessThan(regiones.y);
        centrada(apsv, width);
      }
      evidencias.push({ etiqueta, campana: "seguridad-vial", posicion, ...apsv });
    }
    if (activa("mil-aulas")) {
      const aulas = await caja(page, img("mil-aulas"));
      expect(aulas.ancho / aulas.alto).toBeCloseTo(0.5, 2);
      if (columnas) {
        expect(aulas.ancho).toBe(300);
        expect(aulas.x, "columna derecha, opuesta a APSV").toBeGreaterThan(regiones.derecha);
        expect(Math.abs(aulas.y - regiones.y)).toBeLessThan(2);
        expect(aulas.derecha).toBeLessThanOrEqual(width);
      } else {
        expect(aulas.ancho).toBeCloseTo(Math.min(300, width - 32), 0);
        expect(aulas.y).toBeGreaterThan(regiones.abajo);
        centrada(aulas, width);
      }
      evidencias.push({ etiqueta, campana: "mil-aulas", ...aulas });
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${etiqueta} / sin desborde`).toBe(true);
    await recorrerYVerificar(page, problemas, `${etiqueta} /`);

    // Qué hacer: Obras Hídricas centrada, arriba del explorador.
    await page.goto("/actividades");
    if (activa("obras-hidricas")) {
      const obras = await caja(page, img("obras-hidricas"));
      expect(obras.ancho).toBeLessThanOrEqual(600);
      expect(obras.ancho / obras.alto).toBeCloseTo(2, 2);
      expect(obras.abajo).toBeLessThan((await caja(page, "#provincia-filtro")).y);
      expect(obras.y).toBeLessThan(height);
      centrada(obras, width);
      evidencias.push({ etiqueta, campana: "obras-hidricas", ...obras });
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${etiqueta} /actividades sin desborde`).toBe(true);
    await recorrerYVerificar(page, problemas, `${etiqueta} /actividades`);

    // Escapadas: Octubre Rosa inmediatamente después del encabezado; sin «Antes de descargar».
    await page.goto("/escapadas");
    await expect(page.getByText("Antes de descargar")).toHaveCount(0);
    const guias = page.locator('section[aria-labelledby="guias-escapadas-heading"]');
    const cantidad = Number((await guias.getByText(/^\d+ guías?$/).first().textContent())!.match(/\d+/)![0]);
    expect(cantidad).toBeGreaterThan(0);
    await expect(guias.locator('a[href*=".pdf"]')).toHaveCount(cantidad);
    if (activa("mamografia")) {
      const rosa = await caja(page, img("mamografia"));
      expect(rosa.ancho).toBeLessThanOrEqual(1140);
      expect(rosa.ancho / rosa.alto).toBeCloseTo(11.4, 1);
      expect(rosa.abajo).toBeLessThan((await caja(page, "#guias-escapadas-heading")).y);
      expect(rosa.y).toBeLessThan(height);
      centrada(rosa, width);
      expect(await page.locator('[data-espacio-publicitario="escapadas-antes-guias"]').evaluate(e => e.previousElementSibling === null)).toBe(true);
      evidencias.push({ etiqueta, campana: "mamografia", ...rosa });
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${etiqueta} /escapadas sin desborde`).toBe(true);
    await recorrerYVerificar(page, problemas, `${etiqueta} /escapadas`);

    // Viajar por Argentina: Economía al costado del mapa en escritorio, después de la tarjeta en móvil.
    await page.goto("/provincias");
    if (activa("proteccion-ingresos")) {
      const economia = await caja(page, img("proteccion-ingresos"));
      const mapa = await caja(page, "#mapa-provincias");
      const dibujo = await caja(page, "#mapa-provincias figure > div");
      expect(economia.ancho).toBe(250);
      expect(economia.alto).toBe(250);
      if (columnas) {
        expect(economia.x).toBeGreaterThan(mapa.derecha);
        expect(Math.abs(economia.y - mapa.y)).toBeLessThan(2);
        // El mapa se dibuja a su tamaño máximo (36rem de alto): la columna del anuncio no lo achica.
        const maximo = await page.locator("#mapa-provincias figure > div").evaluate(e => parseFloat(getComputedStyle(e).maxWidth));
        expect(dibujo.ancho, "el mapa conserva su ancho").toBeCloseTo(maximo, 0);
        await page.evaluate(y => scrollTo({ top: y + 300, behavior: "instant" }), mapa.y);
        const fija = await page.locator(img("proteccion-ingresos")).evaluate(e => e.getBoundingClientRect().top);
        expect(Math.abs(fija - ((await encabezado()) + 24))).toBeLessThan(2);
        await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
      } else {
        expect(economia.y).toBeGreaterThan(mapa.abajo);
        expect(economia.abajo).toBeLessThan((await caja(page, "#region-norte")).y);
        centrada(economia, width);
      }
      evidencias.push({ etiqueta, campana: "proteccion-ingresos", mapa: dibujo.ancho, ...economia });
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${etiqueta} /provincias sin desborde`).toBe(true);
    await recorrerYVerificar(page, problemas, `${etiqueta} /provincias`);
  }
  expect(problemas).toEqual([]);
  expect(errores).toEqual([]);
  await testInfo.attach("ubicaciones-por-pantalla", { body: JSON.stringify(evidencias, null, 2), contentType: "application/json" });
});

test("cada campaña aparece una sola vez en todo el sitio recorrido", async ({ page }) => {
  const vistas: Record<string, string[]> = {};
  for (const { ruta } of PAGINAS) {
    await page.goto(ruta);
    for (const id of await page.locator("[data-campana]").evaluateAll(es => es.map(e => e.getAttribute("data-campana")!))) (vistas[id] ??= []).push(ruta);
  }
  for (const campana of CAMPANAS.filter(c => c.activa)) expect(vistas[campana.id], campana.id).toHaveLength(1);
});

test("con un bloqueador de anuncios el sitio sigue funcionando", async ({ page }) => {
  test.setTimeout(90_000);
  const errores: string[] = [];
  page.on("pageerror", error => errores.push(error.message));
  for (const modo of ["red", "red-y-ocultos"] as const) {
    // Como un bloqueador: corta las descargas de /publicidad/ y, en el segundo modo, oculta los bloques.
    await page.route("**/publicidad/**", route => route.abort("blockedbyclient"));
    for (const { ruta, antes, ids } of PAGINAS.filter(p => p.ids.length)) {
      expect((await page.goto(ruta))?.status()).toBe(200);
      if (modo === "red-y-ocultos") await page.addStyleTag({ content: '[aria-label="Publicidad"]{display:none!important}' });
      await expect(page.locator("main h1")).toBeVisible();
      await expect(page.locator(antes)).toBeVisible();
      if (modo === "red") for (const id of activas(ids)) {
        // La reserva de espacio no colapsa ni se deforma aunque la imagen no llegue.
        const c = await caja(page, img(id));
        expect(c.ancho).toBeGreaterThan(0);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${modo} ${ruta}`).toBe(true);
      // WebKit informa como error de página el prefetch RSC que una navegación de la prueba cancela.
      await page.waitForLoadState("networkidle");
    }
    await page.goto("/");
    await page.getByRole("link", { name: "Explorar destinos" }).click();
    await expect(page.locator("#provincias-destacadas")).toBeInViewport();
    await expect(page.locator("#provincias-destacadas a")).toHaveCount(3);
    await page.waitForLoadState("networkidle");
    await page.goto("/escapadas");
    expect(await page.locator('section[aria-labelledby="guias-escapadas-heading"] a[href*=".pdf"]').count()).toBeGreaterThan(0);
    await page.waitForLoadState("networkidle");
    await page.goto("/provincias");
    await expect(page.getByRole("navigation", { name: "Regiones de Argentina" }).getByRole("link")).toHaveCount(6);
    await page.unrouteAll({ behavior: "wait" });
  }
  expect(errores).toEqual([]);
});
