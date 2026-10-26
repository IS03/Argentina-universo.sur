import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { CAMPANAS, urlAnuncio } from "../../lib/publicidad";

const PAGINAS = [
  { ruta: "/", ids: ["juegos-suramericanos"] },
  { ruta: "/actividades", ids: ["proteccion-ingresos"] },
  { ruta: "/escapadas", ids: ["obras-hidricas", "mil-aulas"] },
  { ruta: "/provincias/santa_fe", ids: ["mamografia"] },
  { ruta: "/seguridad", ids: ["seguridad-vial"] },
];
const activas = (ids: string[]) => ids.filter(id => CAMPANAS.some(c => c.id === id && c.activa));

test.beforeEach(async ({ context }) => {
  await context.route(/tile\.openstreetmap\.org/, route => route.abort());
});

test("publicidad real: seis campañas, proporciones completas, secuencias y pantallas sin desbordamiento", async ({ page, isMobile }, testInfo) => {
  test.setTimeout(120_000);
  const errores: string[] = [];
  page.on("pageerror", error => errores.push(error.message));
  page.on("console", message => { if (message.type() === "error" && /hydration|hydrating|didn't match/i.test(message.text())) errores.push(message.text()); });
  const evidencias = [];
  // El proyecto móvil usa Pixel 7. El de escritorio comprueba además tablet y el mínimo de 320 px.
  for (const ancho of isMobile ? [null] : [320, 768, 1440]) {
    if (ancho) await page.setViewportSize({ width: ancho, height: 1000 });
    for (const pagina of PAGINAS) {
      const { ruta } = pagina, ids = activas(pagina.ids);
      const response = await page.goto(ruta);
      expect(response?.status()).toBe(200);
      expect(await page.locator("[data-campana]").evaluateAll(elements => elements.map(e => e.getAttribute("data-campana")))).toEqual(ids);
      for (const id of ids) {
        const anuncio = page.locator(`[data-campana="${id}"]`);
        await anuncio.scrollIntoViewIfNeeded();
        await expect(anuncio.getByText("Publicidad", { exact: true })).toBeVisible();
        const destino = urlAnuncio(CAMPANAS.find(c => c.id === id)?.url);
        if (destino) {
          await expect(anuncio.locator("a")).toHaveAttribute("href", destino);
          await expect(anuncio.locator("a")).toHaveAttribute("rel", "sponsored noopener noreferrer");
        } else await expect(anuncio.locator("a")).toHaveCount(0);
        const principal = anuncio.locator("img").first();
        await expect(principal).toBeVisible();
        await expect(async () => expect(await principal.evaluate(img => (img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth > 0)).toBe(true)).toPass();
        const geometria = await principal.evaluate(element => {
          const img = element as HTMLImageElement, rect = img.getBoundingClientRect();
          return { proporcion: rect.width / rect.height, original: img.naturalWidth / img.naturalHeight, ajuste: getComputedStyle(img).objectFit, src: img.getAttribute("src") };
        });
        expect(geometria.proporcion).toBeCloseTo(geometria.original, 1);
        expect(geometria.ajuste).toBe("contain");
        expect(geometria.src).toMatch(/^\/publicidad\/.+\.webp$/);
        const recurso = await page.request.get(geometria.src!);
        expect(recurso.status()).toBe(200);
        expect(recurso.headers()["content-type"]).toContain("image/webp");
        const detalles = anuncio.locator("details");
        if (await detalles.count()) {
          await expect(detalles).not.toHaveAttribute("open");
          await detalles.locator("summary").click();
          await expect(detalles).toHaveAttribute("open", "");
          for (const image of await detalles.locator("img").all()) {
            await image.scrollIntoViewIfNeeded();
            await expect(async () => expect(await image.evaluate(img => (img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth > 0)).toBe(true)).toPass();
          }
          await detalles.locator("summary").click();
        }
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      await expect(page.locator("h1")).toHaveCount(1);
      // Capturas reales con el anuncio en contexto y la secuencia cerrada.
      if (ids.length && (isMobile || ancho === 1440 || ancho === 320)) {
        await page.locator("[data-espacio-publicitario]").scrollIntoViewIfNeeded();
        const nombre = `${isMobile ? "pixel7" : ancho}-${ruta === "/" ? "inicio" : ruta.slice(1).replaceAll("/", "-")}.jpg`;
        const carpeta = process.env.AUS_PUBLICIDAD_CAPTURAS === "1"
          ? (testInfo.project.metadata.publicExport ? ".artifacts/pr21/capturas-pages" : "docs/pr21/capturas")
          : testInfo.outputPath("capturas");
        await mkdir(carpeta, { recursive: true });
        await page.screenshot({ path: join(carpeta, nombre), type: "jpeg", quality: 85, animations: "disabled" });
      }
      evidencias.push({ ruta, ancho: page.viewportSize()?.width, ids });
    }
  }
  expect(errores).toEqual([]);
  await testInfo.attach("campañas-y-pantallas", { body: JSON.stringify(evidencias, null, 2), contentType: "application/json" });
});

test("con imágenes demoradas se reserva el espacio y la publicidad no produce CLS", async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  await page.addInitScript(() => {
    const shifts: { value: number; publicidad: boolean }[] = [];
    Object.assign(window, { publicidadShifts: shifts });
    new PerformanceObserver(list => {
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
    await page.route("**/publicidad/*.webp", async route => { await bloqueado; await route.continue(); });
    try {
      await page.goto(ruta, { waitUntil: "domcontentloaded" });
      const imagenes = page.locator("[data-campana] > div > img");
      await imagenes.first().scrollIntoViewIfNeeded();
      const antes = await imagenes.evaluateAll(imgs => imgs.map(img => ({ ancho: img.getBoundingClientRect().width, alto: img.getBoundingClientRect().height })));
      for (const rect of antes) { expect(rect.ancho).toBeGreaterThan(0); expect(rect.alto).toBeGreaterThan(0); }
      liberar();
      for (const image of await imagenes.all()) {
        await image.scrollIntoViewIfNeeded();
        await expect(async () => expect(await image.evaluate(img => (img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth > 0)).toBe(true)).toPass();
      }
      const despues = await imagenes.evaluateAll(imgs => imgs.map(img => ({ ancho: img.getBoundingClientRect().width, alto: img.getBoundingClientRect().height })));
      expect(despues).toEqual(antes);
      const shifts = await page.evaluate(() => (window as unknown as { publicidadShifts: { value: number; publicidad: boolean }[] }).publicidadShifts);
      const cls = shifts.reduce((sum, shift) => sum + shift.value, 0);
      const clsPublicidad = shifts.filter(s => s.publicidad).reduce((sum, shift) => sum + shift.value, 0);
      expect(cls).toBeLessThan(0.1);
      expect(clsPublicidad).toBe(0);
      mediciones.push({ ruta, cls, clsPublicidad });
    } finally {
      liberar();
      await page.unrouteAll({ behavior: "wait" });
    }
  }
  await testInfo.attach("CLS-imágenes-demoradas", { body: JSON.stringify(mediciones, null, 2), contentType: "application/json" });
});

test("las campañas y sus secuencias están disponibles sin JavaScript", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  await context.route(/tile\.openstreetmap\.org/, route => route.abort());
  const page = await context.newPage();
  try {
    for (const { ruta, ids } of PAGINAS) {
      await page.goto(baseURL + ruta);
      for (const id of activas(ids)) {
        const anuncio = page.locator(`[data-campana="${id}"]`);
        await expect(anuncio.getByText("Publicidad", { exact: true })).toBeVisible();
        const details = anuncio.locator("details");
        if (await details.count()) {
          await details.locator("summary").click();
          await expect(details).toHaveAttribute("open", "");
          await expect(details.locator("img").last()).toBeVisible();
        }
      }
    }
  } finally { await context.close(); }
});
