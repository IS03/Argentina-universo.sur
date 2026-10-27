import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { CAMPANAS, urlAnuncio } from "../../lib/publicidad";

const PAGINAS = [
  { ruta: "/", ids: ["juegos-suramericanos"], antes: "#provincias-destacadas" },
  { ruta: "/actividades", ids: ["proteccion-ingresos"], antes: "#provincia-filtro" },
  { ruta: "/escapadas", ids: ["obras-hidricas", "mil-aulas"], antes: "#guias-escapadas-heading" },
  { ruta: "/provincias/santa_fe", ids: ["mamografia"], antes: 'nav[aria-label="Secciones de Santa Fe"]' },
  { ruta: "/seguridad", ids: ["seguridad-vial"], antes: "#emergencias" },
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
    for (const { ruta, ids: configuradas, antes } of PAGINAS) {
      const ids = activas(configuradas);
      expect((await page.goto(ruta))?.status()).toBe(200);
      const espacio = page.locator("[data-espacio-publicitario]");
      expect(await page.locator("[data-campana]").evaluateAll(es => es.map(e => e.getAttribute("data-campana")))).toEqual(ids);
      if (!ids.length) continue;
      await expect(espacio).toHaveText("");
      await expect(espacio.locator("p, details, summary, h2, h3, figcaption")).toHaveCount(0);
      const posicion = await espacio.evaluate((e, selector) => {
        const header = document.querySelector('main h1')?.closest('header, section');
        const contenido = document.querySelector(selector);
        return { despuesDelEncabezado: !!header && !!(header.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING), antesDelContenido: !!contenido && !!(e.compareDocumentPosition(contenido) & Node.DOCUMENT_POSITION_FOLLOWING), top: e.getBoundingClientRect().top + scrollY };
      }, antes);
      expect(posicion.despuesDelEncabezado).toBe(true);
      expect(posicion.antesDelContenido).toBe(true);
      expect(posicion.top).toBeLessThan(page.viewportSize()!.height + 100);
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
        if (ruta.includes("santa_fe") && process.env.AUS_PUBLICIDAD_CAPTURAS === "1") await page.waitForTimeout(7000);
        await espacio.evaluate(e => e.scrollIntoView({ block: "center", behavior: "instant" }));
        const dispositivo = testInfo.project.name.includes("iphone") ? "iphone-safari" : isMobile ? "pixel7" : ancho;
        const nombre = `${dispositivo}-${ruta === "/" ? "inicio" : ruta.slice(1).replaceAll("/", "-")}.jpg`;
        const carpeta = process.env.AUS_PUBLICIDAD_CAPTURAS === "1" ? (testInfo.project.metadata.publicExport ? ".artifacts/pr21/capturas-pages" : "docs/pr21/capturas") : testInfo.outputPath("capturas");
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
