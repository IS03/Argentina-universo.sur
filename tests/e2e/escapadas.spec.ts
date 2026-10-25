import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
const legacy = JSON.parse(readFileSync("public/data/escapadas.json", "utf8")) as {ID: string; PDF: string; ZONA: string}[];
const withheld = ["el-palmar", "caba", "puerto-iguazu", "talampaya-e-ischigualasto"];

test("Escapadas conserva las 23 guías en el HTML sin JavaScript y no anuncia borradores", async ({ browser, baseURL }) => {
  const context = await browser.newContext({javaScriptEnabled: false});
  const page = await context.newPage();
  await page.goto(baseURL + "/escapadas");
  await expect(page.getByRole("heading", {level: 1})).toHaveText("Escapadas en Argentina");
  const links = page.getByRole("link", {name: "Ver PDF", exact: true});
  await expect(links).toHaveCount(23);
  for (const row of legacy) await expect(page.locator(`a[href="${row.PDF}"]`)).toHaveCount(1);
  for (const slug of withheld) await expect(page.locator(`a[href="/escapadas/${slug}"]`)).toHaveCount(0);
  await expect(page.getByRole("heading", {name: "Destinos para descubrir"})).toHaveCount(0);
  await context.close();
});

test("las cuatro fichas pendientes responden 404 y quedan fuera del sitemap y del HTML/RSC", async ({ request }) => {
  const index = await (await request.get("/escapadas")).text();
  const sitemap = await (await request.get("/sitemap.xml")).text();
  for (const slug of withheld) {
    for (const suffix of ["", ".html", ".txt"]) {
      const response = await request.get(`/escapadas/${slug}${suffix}`);
      expect(response.status()).toBe(404);
      expect(await response.text()).not.toContain("AUS-ESC-");
    }
    expect(sitemap).not.toContain(`/escapadas/${slug}`);
    expect(index).not.toContain(`AUS-ESC-${slug.toUpperCase()}`);
  }
});

test("el filtro regional y los enlaces PDF heredados siguen funcionando", async ({ page, request, isMobile }) => {
  await page.goto("/escapadas");
  if (isMobile) await page.getByRole("combobox", {name: "Filtrar escapadas por región"}).selectOption("Litoral");
  else await page.getByRole("button", {name: "Litoral", exact: true}).click();
  await expect(page.getByRole("link", {name: "Ver PDF", exact: true})).toHaveCount(legacy.filter(r => r.ZONA === "Litoral").length);
  if (isMobile) await page.getByRole("combobox", {name: "Filtrar escapadas por región"}).selectOption("Todas");
  else await page.getByRole("button", {name: "Todas", exact: true}).click();
  await expect(page.getByRole("link", {name: "Ver PDF", exact: true})).toHaveCount(23);
  for (const row of legacy) {
    const response = await request.head(row.PDF);
    expect(response.status(), row.PDF).toBe(200);
    expect(response.headers()["content-type"]).toContain("application/pdf");
  }
});
