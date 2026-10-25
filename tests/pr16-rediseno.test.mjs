import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { projectRoot } from "../scripts/validate-data.mjs";
import { SECCIONES_SANTA_FE } from "../components/santa-fe/secciones.ts";
import { STATIC_PAGES } from "../lib/seo.ts";

const source = path => readFile(join(projectRoot, path), "utf8");
const archivos = async (...dirs) => {
  const lista = [];
  for (const dir of dirs) for (const entry of await readdir(join(projectRoot, dir), { recursive: true })) {
    if (/\.(tsx?|jsx?|css)$/.test(entry)) lista.push(join(dir, entry));
  }
  return lista;
};

test("las secciones de Santa Fe apuntan a páginas indexables existentes o a un ancla de la provincia", async () => {
  const indexables = new Set(STATIC_PAGES.map(p => p.path));
  assert.equal(SECCIONES_SANTA_FE.length, 7);
  assert.equal(new Set(SECCIONES_SANTA_FE.map(s => s.id)).size, 7);
  for (const seccion of SECCIONES_SANTA_FE) {
    const [ruta, ancla] = seccion.href.split("#");
    if (ruta === "/provincias/santa_fe") {
      if (ancla) assert.match(await source("components/santa-fe/PreguntasFrecuentesSection.tsx"), new RegExp(`id="${ancla}"`));
      continue;
    }
    assert.ok(indexables.has(ruta), `${seccion.href} no está entre las URL indexables`);
  }
  // Las subpáginas ya no usan la barra lateral ni migas propias: un solo marco para las cinco.
  for (const pagina of ["planes", "eventos", "oficinas", "agencias", "noticias"]) {
    const codigo = await source(`app/provincias/santa_fe/${pagina}/page.tsx`);
    assert.match(codigo, new RegExp(`<PaginaSantaFe\\s+actual="${pagina}"`), pagina);
  }
});

test("la agenda estática de Pages reemplaza exactamente el componente de la agenda de Vercel", async () => {
  const pagina = await source("app/provincias/santa_fe/eventos/page.tsx");
  const build = await source("scripts/pages/build.mjs");
  for (const literal of [
    'import AgendaSantaFe from "@/components/santa-fe/AgendaSantaFe";',
    "const { vigentes, anteriores } = await getAgendaSantaFe();",
    "<AgendaSantaFe vigentes={vigentes} anteriores={anteriores} />",
  ]) {
    assert.ok(pagina.includes(literal), `la página debe contener ${literal}`);
    assert.ok(build.includes(literal) || build.includes(literal.replaceAll("getAgendaSantaFe", "getEventosSantaFe")), `build.mjs debe reemplazar ${literal}`);
  }
  assert.match(await source("components/santa-fe/EventosSection.tsx"), /No hay próximos eventos confirmados por el momento\./);
});

test("Seguridad muestra los números de emergencia como enlaces de llamada con nombre accesible", async () => {
  const codigo = await source("app/seguridad/page.tsx");
  assert.match(codigo, /numero: "911", etiqueta: "Emergencias", aria: "Llamar a emergencias 911"/);
  assert.match(codigo, /numero: "134", etiqueta: "Denuncias", aria: "Llamar a denuncias 134"/);
  assert.match(codigo, /href=\{`tel:\$\{e\.numero\}`\}/);
  assert.match(codigo, /id="emergencias"/);
});

test("sin emojis como íconos ni estilos heredados del diseño anterior", async () => {
  const emoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
  const heredado = /#(5A4E3D|6B5D47|8B7355|A68B5B|C9B99B|D4C4B0|E8DDD0|F5F1E8|FAF8F3)|tracking-widest|text-gray-\d|from-red-|bg-white\/50/;
  for (const archivo of await archivos("app", "components")) {
    const codigo = await source(archivo);
    assert.doesNotMatch(codigo, emoji, `${archivo} usa emojis como íconos`);
    assert.doesNotMatch(codigo, heredado, `${archivo} conserva estilos del diseño anterior`);
  }
});

test("el consentimiento conserva sus textos, el banner y el mismo estilo para Aceptar y Rechazar", async () => {
  const banner = await source("components/consentimiento/MedicionConConsentimiento.tsx");
  assert.match(banner, /id="aviso-cookies"/);
  assert.match(banner, /aria-label="Aviso de cookies"/);
  assert.match(banner, /Con tu permiso usamos cookies de Google Analytics para conocer, de forma agregada, cómo se usa el sitio y\s+mejorarlo\./);
  const estilos = await source("components/consentimiento/estilos.ts");
  // Un único estilo para las dos decisiones; aria-pressed cambia igual para ambas.
  assert.equal((estilos.match(/export const /g) ?? []).length, 1);
  assert.match(estilos, /min-h-11/);
});
