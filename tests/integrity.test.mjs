import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readCatalog, validateAsset, validateCatalog, validateRepository, sourceAssetReferences } from "../scripts/validate-data.mjs";
import { partitionEvents, parseEventDate } from "../lib/events.ts";
import { getHeroOpacity, imagenesHome } from "../lib/home-images.ts";
import { normalizarActividad, resolveProvinciaSlug } from "../lib/catalog.ts";

const catalog = await readCatalog();
const clone = () => structuredClone(catalog);

test("el repositorio completo cumple integridad de datos y assets", async () => {
  assert.deepEqual((await validateRepository()).errors, []);
});

test("el validador de archivos rechaza JSON no estricto, como el NaN preexistente", async () => {
  const root = await mkdtemp(join(tmpdir(), "universo-sur-integrity-"));
  try {
    for (const dir of ["public/data", "public/santa-fe/json", "app", "components", "lib"]) {
      await mkdir(join(root, dir), { recursive: true });
    }
    await writeFile(join(root, "public/data/provincias.json"), '[{"ZONA": NaN}]');
    const { errors } = await validateRepository(root);
    assert.ok(errors.some(error => error.includes("provincias.json: JSON inválido")));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("la resolución compartida conserva las fotografías JPEG y el slug público de Catamarca", () => {
  const mendoza = catalog.actividades.find(a => a.FOTO_3 === "/img/actividades/mendoza/3.jpeg");
  assert.ok(mendoza);
  assert.ok(normalizarActividad(mendoza).fotos.includes("/img/actividades/mendoza/3.jpeg"));
  assert.equal(resolveProvinciaSlug("catamarca"), "catamarca");
  assert.equal(resolveProvinciaSlug("catarmaca"), "catamarca");
  assert.equal(resolveProvinciaSlug("santa_fe"), "santa_fe");
});

test("detecta imágenes y PDF inexistentes, query strings y mayúsculas", async () => {
  assert.equal(await validateAsset("/img/home/1.jpg?v=3"), null);
  assert.match(await validateAsset("/img/home/10.jpg"), /inexistente/);
  assert.match(await validateAsset("/pdf/no-existe.pdf"), /inexistente/);
  assert.match(await validateAsset("/img/home/1.JPG"), /capitalización/);
  assert.match(await validateAsset("/../package.json"), /fuera de public/);
});

test("detecta referencias literales en código, incluido el carrusel", () => {
  assert.deepEqual(sourceAssetReferences('const x = "/img/home/10.jpg?v=3"; const y = `/pdf/falta.pdf`; <img src="/img/home/1.jpg" />', "page.tsx"),
    ["/img/home/10.jpg?v=3", "/pdf/falta.pdf", "/img/home/1.jpg"]);
  assert.equal(imagenesHome.length, 9);
});

test("rechaza slugs de provincias y actividades duplicados e IDs repetidos", () => {
  const data = clone();
  data.provincias.push(data.provincias[0]);
  data.actividades.push({ ...data.actividades[0], ACTIVIDAD: data.actividades[0].ACTIVIDAD.toUpperCase() });
  data.escapadas.push(data.escapadas[0]);
  const errors = validateCatalog(data).join("\n");
  assert.match(errors, /slug de provincia: duplicado/);
  assert.match(errors, /slug de actividad: duplicado/);
  assert.match(errors, /ID de escapada: duplicado/);
});

test("rechaza provincias desconocidas, regiones ausentes o inconsistentes y coordenadas inválidas", () => {
  const data = clone();
  data.provincias.find(p => p.SLUG === "la_pampa").ZONA = null;
  data.actividades[0].SLUG = "inexistente";
  data.actividades[1].LATITUD = 100;
  data.escapadas[0].ZONA = "Norte";
  const errors = validateCatalog(data).join("\n");
  assert.match(errors, /ZONA requerido/);
  assert.match(errors, /provincia inexistente/);
  assert.match(errors, /coordenadas inválidas/);
  assert.match(errors, /región inconsistente/);
});

test("rechaza registros mal formados, campos faltantes y provincias eliminadas", () => {
  const data = clone();
  data.provincias.pop();
  data.actividades[0].ACTIVIDAD = "!!!";
  delete data.escapadas[0].PDF;
  data.eventos.push(null);
  const errors = validateCatalog(data).join("\n");
  assert.match(errors, /Falta provincia/);
  assert.match(errors, /slug vacío/);
  assert.match(errors, /PDF requerido/);
  assert.match(errors, /registro inválido/);
});

test("rechaza eventos con fechas inválidas, duplicados o fin anterior al inicio", () => {
  const data = clone();
  data.eventos.push(data.eventos[0]);
  data.eventos[1].Fin = "2025-01-01 00:00";
  data.eventos[2].Inicio = "2026-02-30 00:00";
  const errors = validateCatalog(data).join("\n");
  assert.match(errors, /evento: duplicado/);
  assert.match(errors, /Fin anterior/);
  assert.match(errors, /fecha inválida/);
});

test("fechas de eventos se interpretan en Argentina sin depender de TZ del host", () => {
  assert.equal(parseEventDate("2026-01-01 00:00").toISOString(), "2026-01-01T03:00:00.000Z");
  for (const value of ["2026-02-30 12:00", "2026-01-01 25:00", "2026-13-01 00:00", "mañana"]) {
    assert.throws(() => parseEventDate(value), /inválida/);
  }
});

test("separa próximos, en curso y vencidos por el fin, incluyendo el último minuto", () => {
  const events = [
    { Inicio: "2026-10-22 10:00", Fin: "2026-10-22 23:59" },
    { Inicio: "2026-10-23 10:00", Fin: "2026-10-23 12:00" },
    { Inicio: "2026-10-24 10:00", Fin: "2026-10-24 12:00" },
  ];
  const result = partitionEvents(events, new Date("2026-10-23T12:00:59-03:00"));
  assert.deepEqual(result.vigentes, events.slice(1));
  assert.deepEqual(result.anteriores, events.slice(0, 1));
  assert.equal(partitionEvents(events, new Date("2026-10-23T12:01:00-03:00")).anteriores.length, 2);
  assert.equal(events.length, 3);
});

test("la agenda real vencida se conserva íntegra en el archivo", () => {
  const now = new Date("2026-10-23T00:00:00-03:00");
  const { vigentes, anteriores } = partitionEvents(catalog.eventos, now);
  const expired = catalog.eventos.filter(e => parseEventDate(e.Fin).getTime() + 60_000 <= now.getTime());
  assert.equal(anteriores.length, expired.length);
  assert.ok(expired.every(e => anteriores.includes(e)));
  assert.equal(vigentes.length + anteriores.length, catalog.eventos.length);
});

test("la opacidad del hero disminuye y permanece entre cero y uno", () => {
  assert.equal(getHeroOpacity(0), 1);
  assert.equal(getHeroOpacity(0.5), 0.4);
  assert.equal(getHeroOpacity(1), 0);
  assert.equal(getHeroOpacity(-1), 1);
  assert.equal(getHeroOpacity(2), 0);
});
