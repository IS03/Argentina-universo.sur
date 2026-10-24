import { test as base, expect, type Page } from "@playwright/test";

// Corre sobre la build de producción simulada (playwright.config.ts) con un ID ficticio. gtag.js se
// reemplaza por un sustituto local y cualquier envío a Google se intercepta: nada sale a internet.
const GA_ID = "G-PRUEBA0001";
const CLAVE = "consentimientoCookies";
const DETALLE = "/actividades/vivir-la-magia-del-teatro-colon";
const TESELA = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==", "base64");

type Google = { gtagJs: number; envios: string[] };

const test = base.extend<{ errores: string[]; google: Google }>({
  google: async ({ context }, usar) => {
    const google: Google = { gtagJs: 0, envios: [] };
    await context.route(/^https:\/\/tile\.openstreetmap\.org\//, r => r.fulfill({ contentType: "image/png", body: TESELA }));
    await context.route(/googletagmanager\.com\/gtag\/js/, r => {
      google.gtagJs++;
      return r.fulfill({ contentType: "text/javascript", body: "window.__gtagCargado = (window.__gtagCargado || 0) + 1;" });
    });
    await context.route(/google-analytics\.com|analytics\.google\.com|doubleclick\.net/, r => {
      google.envios.push(r.request().url());
      return r.fulfill({ status: 204, body: "" });
    });
    await usar(google);
    expect(google.envios, "ningún envío a Google en estas pruebas").toEqual([]);
  },
  errores: async ({ page }, usar) => {
    const errores: string[] = [];
    page.on("pageerror", e => errores.push(String(e)));
    page.on("console", m => { if (m.type() === "error" && !m.location().url.includes("/_vercel/")) errores.push(m.text()); });
    await usar(errores);
    expect(errores, "errores de consola o hidratación").toEqual([]);
  },
});

type VentanaGA = { dataLayer?: ArrayLike<unknown>[] } & Record<string, unknown>;
const desactivado = (page: Page) => page.evaluate(id => (window as unknown as VentanaGA)[`ga-disable-${id}`], GA_ID);
const banner = (page: Page) => page.getByRole("region", { name: "Aviso de cookies" });
const comandos = (page: Page) => page.evaluate(() => ((window as unknown as VentanaGA).dataLayer ?? []).map(args => {
  const [tipo, segundo, tercero] = Array.from(args);
  return { tipo, segundo: segundo instanceof Date ? "Date" : segundo, tercero };
}));
const decisionGuardada = (page: Page) => page.evaluate(clave => JSON.parse(localStorage.getItem(clave) ?? "null")?.analitica ?? null, CLAVE);
const cookiesGA = async (page: Page) => (await page.context().cookies()).map(c => c.name).filter(n => n.startsWith("_ga"));
// Una pulsación antes de hidratar no hace nada: se espera a que el banner (solo cliente) exista.
const decidir = async (page: Page, opcion: "Aceptar" | "Rechazar") => {
  await banner(page).getByRole("button", { name: opcion }).click();
  await expect(banner(page)).toHaveCount(0);
};

test("el HTML trae el banner y el script que lo oculta a quien ya decidió, sin scripts de Google", async ({ request }) => {
  for (const ruta of ["/", DETALLE, "/privacidad"]) {
    const html = await (await request.get(ruta)).text();
    expect(html).toContain('id="aviso-cookies"');
    expect(html).toContain('<script id="decision-cookies">');
    expect(html.indexOf('id="decision-cookies"')).toBeLessThan(html.indexOf("<body"));
    expect(html).not.toMatch(/googletagmanager|gtag\/js|_next-ga/);
  }
});

// Con el JavaScript de la página demorado: lo que se ve es lo que pinta el HTML.
const demorarJs = (page: Page) => page.route(/\/_next\/static\/chunks\/.*\.js/, async r => { await new Promise(listo => setTimeout(listo, 2500)); await r.continue(); });

test("antes de hidratar: el banner se ve si no hay decisión y nunca aparece si ya la hay", async ({ page, errores, google }) => {
  void errores;
  await demorarJs(page);
  await page.goto("/provincias", { waitUntil: "domcontentloaded" });
  await expect(banner(page)).toBeVisible();
  for (const decision of ["aceptada", "rechazada"]) {
    await page.evaluate(([clave, valor]) => localStorage.setItem(clave, JSON.stringify({ analitica: valor, version: 1, fecha: new Date().toISOString() })), [CLAVE, decision]);
    // Registra cualquier cuadro en que el banner llegue a verse durante la carga.
    await page.addInitScript(() => {
      const w = window as unknown as { __bannerVisible: boolean };
      w.__bannerVisible = false;
      const mirar = () => {
        const b = document.getElementById("aviso-cookies");
        if (b && getComputedStyle(b).display !== "none") w.__bannerVisible = true;
        if (performance.now() < 6000) requestAnimationFrame(mirar);
      };
      requestAnimationFrame(mirar);
    });
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator("html")).toHaveAttribute("data-consentimiento", decision);
    await page.waitForLoadState("load");
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => (window as unknown as { __bannerVisible: boolean }).__bannerVisible), decision).toBe(false);
  }
  expect(google.gtagJs).toBe(1); // solo la carga con la decisión "aceptada"
});

test("sin decisión: banner visible y GA4 sin cargar, sin cookies ni envíos", async ({ page, errores, google }) => {
  void errores;
  await page.goto("/");
  await expect(banner(page)).toBeVisible();
  await expect(banner(page).getByRole("link", { name: "Privacidad y cookies" })).toHaveAttribute("href", "/privacidad");
  await page.waitForLoadState("load");
  await page.waitForTimeout(800);
  expect(google.gtagJs).toBe(0);
  expect(await page.evaluate(() => "dataLayer" in window)).toBe(false);
  expect(await cookiesGA(page)).toEqual([]);
  // Navegación interna sin decidir: el banner sigue y GA4 tampoco se carga.
  await banner(page).getByRole("link", { name: "Privacidad y cookies" }).click();
  await expect(page).toHaveURL(/\/privacidad$/);
  await expect(banner(page)).toBeVisible();
  await expect(page.getByRole("status")).toHaveText(/Todavía no elegiste/);
  expect(google.gtagJs).toBe(0);
});

test("aceptar carga GA4 una vez, con los permisos antes del config, y se recuerda", async ({ page, errores, google }) => {
  void errores;
  await page.goto("/");
  await decidir(page, "Aceptar");
  await expect.poll(() => google.gtagJs).toBe(1);
  expect(await decisionGuardada(page)).toBe("aceptada");
  expect((await comandos(page)).map(c => `${c.tipo}:${c.segundo}`)).toEqual(["consent:default", "set:[object Object]", "js:Date", `config:${GA_ID}`]);
  const [consent, set] = await comandos(page);
  expect(consent.tercero).toEqual({ analytics_storage: "granted", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
  expect(set.segundo).toEqual({ allow_google_signals: false, allow_ad_personalization_signals: false, ads_data_redaction: true });
  expect(await desactivado(page)).toBe(false);
  // Navegación interna: ni banner ni una segunda carga de gtag.js (las visitas las mide el historial).
  await page.getByRole("contentinfo").getByRole("link", { name: "Privacidad y cookies" }).click();
  await expect(page).toHaveURL(/\/privacidad$/);
  await expect(banner(page)).toHaveCount(0);
  expect(google.gtagJs).toBe(1);
  expect((await comandos(page)).filter(c => c.tipo === "config")).toHaveLength(1);
  // Recarga: sin banner y GA4 se carga solo con la decisión guardada.
  await page.reload();
  await expect.poll(() => google.gtagJs).toBe(2);
  await expect(banner(page)).toHaveCount(0);
  expect((await comandos(page)).map(c => `${c.tipo}:${c.segundo}`)).toEqual(["consent:default", "set:[object Object]", "js:Date", `config:${GA_ID}`]);
});

test("rechazar no carga GA4 en ninguna página y se recuerda", async ({ page, errores, google }) => {
  void errores;
  await page.goto(DETALLE);
  await decidir(page, "Rechazar");
  expect(await decisionGuardada(page)).toBe("rechazada");
  expect(await desactivado(page)).toBe(true);
  await page.getByRole("contentinfo").getByRole("link", { name: "Privacidad y cookies" }).click();
  await expect(page).toHaveURL(/\/privacidad$/);
  await expect(page.getByRole("status")).toHaveText(/Rechazaste/);
  await page.goto("/");
  await page.reload();
  await page.waitForLoadState("load");
  await page.waitForTimeout(800);
  await expect(banner(page)).toHaveCount(0);
  expect(google.gtagJs).toBe(0);
  expect(await page.evaluate(() => "dataLayer" in window)).toBe(false);
  expect(await cookiesGA(page)).toEqual([]);
});

test("la decisión se cambia desde «Privacidad y cookies»: rechazar borra las cookies y aceptar vuelve a medir", async ({ page, errores, google }) => {
  void errores;
  await page.goto("/");
  await decidir(page, "Aceptar");
  await expect.poll(() => google.gtagJs).toBe(1);
  // Cookies como las que crea GA4 en el dominio del sitio.
  const host = new URL(page.url()).hostname;
  await page.context().addCookies(["_ga", "_ga_PRUEBA0001"].map(name => ({ name, value: "GA1.1.123.456", domain: host, path: "/" })));
  await page.getByRole("contentinfo").getByRole("link", { name: "Privacidad y cookies" }).click();
  await expect(page).toHaveURL(/\/privacidad$/);
  const panel = page.getByRole("region", { name: "Tu decisión sobre las cookies" });
  await expect(page.getByRole("status")).toHaveText(/Aceptaste/);
  await expect(panel.getByRole("button", { name: "Aceptar" })).toHaveAttribute("aria-pressed", "true");

  await panel.getByRole("button", { name: "Rechazar" }).click();
  await expect(page.getByRole("status")).toHaveText(/Rechazaste/);
  await expect(panel.getByRole("button", { name: "Rechazar" })).toHaveAttribute("aria-pressed", "true");
  expect(await decisionGuardada(page)).toBe("rechazada");
  expect(await desactivado(page)).toBe(true);
  expect((await comandos(page)).at(-1)).toEqual({ tipo: "consent", segundo: "update", tercero: { analytics_storage: "denied" } });
  await expect.poll(() => cookiesGA(page)).toEqual([]);
  await page.reload();
  await page.waitForLoadState("load");
  await page.waitForTimeout(800);
  expect(google.gtagJs).toBe(1);
  await expect(banner(page)).toHaveCount(0);

  await page.getByRole("region", { name: "Tu decisión sobre las cookies" }).getByRole("button", { name: "Aceptar" }).click();
  await expect(page.getByRole("status")).toHaveText(/Aceptaste/);
  await expect.poll(() => google.gtagJs).toBe(2);
  expect(await desactivado(page)).toBe(false);
});

test("una decisión vencida o de una versión anterior vuelve a mostrar el banner sin cargar GA4", async ({ page, errores, google }) => {
  void errores;
  const haceTreceMeses = new Date(Date.now() - 400 * 86_400_000).toISOString();
  for (const guardado of [
    { analitica: "aceptada", version: 1, fecha: haceTreceMeses },
    { analitica: "aceptada", version: 0, fecha: new Date().toISOString() },
    "esto no es JSON",
  ]) {
    await page.goto("/privacidad");
    await page.evaluate(([clave, valor]) => localStorage.setItem(clave, valor), [CLAVE, typeof guardado === "string" ? guardado : JSON.stringify(guardado)]);
    await page.reload();
    await expect(banner(page)).toBeVisible();
    await page.evaluate(clave => localStorage.removeItem(clave), CLAVE);
  }
  expect(google.gtagJs).toBe(0);
});

test("«Aceptar» y «Rechazar» tienen el mismo peso visual, se usan con teclado y el banner no desplaza contenido", async ({ page, errores, isMobile }) => {
  void errores;
  await page.goto(DETALLE);
  await expect(banner(page)).toBeVisible();
  const estilo = (nombre: string) => banner(page).getByRole("button", { name: nombre }).evaluate(b => {
    const s = getComputedStyle(b);
    const r = b.getBoundingClientRect();
    return { fondo: s.backgroundColor, color: s.color, borde: s.borderColor, peso: s.fontWeight, letra: s.fontSize, alto: r.height, ancho: r.width };
  });
  const [rechazar, aceptar] = [await estilo("Rechazar"), await estilo("Aceptar")];
  expect(aceptar).toEqual(rechazar);
  expect(rechazar.alto).toBeGreaterThanOrEqual(44);
  // Sin desborde horizontal y dentro de la pantalla en móvil.
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const caja = (await banner(page).locator("> div").boundingBox())!;
  expect(caja.y + caja.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  if (isMobile) expect(caja.width).toBeGreaterThan(page.viewportSize()!.width - 40);
  // El banner es fijo: aparecer después de hidratar no cuenta como salto de diseño.
  const cls = await page.evaluate(() => new Promise<number>(resolver => {
    let total = 0;
    new PerformanceObserver(lista => {
      for (const e of lista.getEntries() as Array<PerformanceEntry & { value: number; hadRecentInput: boolean }>) if (!e.hadRecentInput) total += e.value;
    }).observe({ type: "layout-shift", buffered: true });
    setTimeout(() => resolver(total), 1000);
  }));
  expect(cls).toBeLessThan(0.01);
  // Teclado: ambos botones son alcanzables y Enter decide.
  const rechazarBoton = banner(page).getByRole("button", { name: "Rechazar" });
  await rechazarBoton.focus();
  await page.keyboard.press("Tab");
  await expect(banner(page).getByRole("button", { name: "Aceptar" })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(rechazarBoton).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(banner(page)).toHaveCount(0);
  expect(await decisionGuardada(page)).toBe("rechazada");
});

test("la decisión tomada en otra pestaña se aplica sin recargar", async ({ context, errores, google }) => {
  void errores;
  const [a, b] = [await context.newPage(), await context.newPage()];
  await a.goto("/");
  await b.goto("/escapadas");
  await expect(banner(b)).toBeVisible();
  await decidir(a, "Rechazar");
  await expect(banner(b)).toHaveCount(0);
  expect(google.gtagJs).toBe(0);
});
