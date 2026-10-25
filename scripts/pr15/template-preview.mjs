// Vista previa local de la plantilla de ficha turística (TripArticle) y de components/destinos.
// Usa una ficha FICTICIA escrita aquí: no lee content/escapadas, no publica nada y no crea rutas.
// Renderiza el HTML en el servidor (React) y lo muestra con el CSS de una build local en marcha.
// Uso: node --experimental-strip-types scripts/pr15/template-preview.mjs http://127.0.0.1:3300
import { chromium, devices } from "@playwright/test";
import { mkdir, mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createElement, Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const origin = process.argv[2];
if (!origin) throw Error("Uso: template-preview.mjs <origen de una build local>");
const root = new URL("../../", import.meta.url);
const work = await mkdtemp(join(tmpdir(), "aus-pr15-plantilla-"));
const compiled = new Map();
async function compile(relative) {
  if (compiled.has(relative)) return compiled.get(relative);
  const out = join(work, relative.replace(/\.tsx$/, ".mjs"));
  compiled.set(relative, out);
  let code = ts.transpileModule(await readFile(new URL(relative, root), "utf8"), {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText.replace('"react/jsx-runtime"', JSON.stringify(import.meta.resolve("react/jsx-runtime")));
  for (const [, specifier] of code.matchAll(/from "(@\/[^"]+)"/g)) {
    const path = specifier.slice(2);
    const target = path.startsWith("components/") ? pathToFileURL(await compile(path + ".tsx")).href : new URL(path + ".ts", root).href;
    code = code.replaceAll(JSON.stringify(specifier), JSON.stringify(target));
  }
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, code);
  return out;
}
const load = async relative => import(pathToFileURL(await compile(relative)).href);

const fuente = (id, titulo) => ({ id, title: titulo, url: "https://example.org/" + id, checkedAt: "2026-10-24" });
const foto = (src, alt, leyenda) => ({
  src, alt, caption: leyenda, width: 1920, height: 1080, variants: [{ src, width: 1920 }],
  attribution: { holder: "Titular de ejemplo", licenseName: "Licencia de ejemplo", licenseUrl: "https://example.org/licencia" },
});
// Ficha ficticia con la forma de PublishedTrip (lib/pages/trips.ts). Ningún dato es real.
const trip = {
  id: "EJEMPLO-PR15", slug: "ficha-de-ejemplo", title: "Ficha de ejemplo: valle y laguna",
  destination: "Destino ficticio", province: "Provincia de ejemplo",
  description: "Contenido ficticio para revisar la plantilla. Así se presentaría una escapada aprobada: introducción breve, localidades, secciones con fuentes, avisos operativos, mapas como enlaces y fotos con crédito.",
  introductionSourceIds: ["ente"],
  geography: { provinceSlugs: ["mendoza"], localities: [{ id: "L1", name: "Pueblo del Valle", provinceSlug: "mendoza", sourceIds: ["ente"] }, { id: "L2", name: "Villa Laguna", provinceSlug: "mendoza", sourceIds: ["ente"] }] },
  sources: [fuente("ente", "Ente de turismo (ejemplo)"), fuente("parque", "Administración del área protegida (ejemplo)"), { ...fuente("estado", "Estado de caminos (ejemplo)"), publishedAt: "2026-10-23T17:00-03:00" }],
  sections: [
    { id: "imperdibles", kind: "highlights", title: "Lo imperdible", paragraphs: ["Párrafo de ejemplo con la medida de lectura del sistema: unos 68 caracteres por línea, interlineado amplio y color de texto con contraste AA.", "Un segundo párrafo muestra la separación entre bloques."], sourceIds: ["ente"] },
    { id: "que-hacer", kind: "activities", title: "Qué hacer", paragraphs: ["Las actividades se describen con su fuente oficial. Los datos variables se consultan en los canales oficiales antes de viajar."], sourceIds: ["parque"] },
    { id: "practico", kind: "practical", title: "Organizar la visita", paragraphs: ["Información práctica permanente: cómo llegar, qué llevar y dónde consultar el estado del lugar."], sourceIds: ["ente", "estado"] },
  ],
  operationalNotices: [{ id: "aviso", sectionId: "practico", guidance: "Antes de salir, consultá el estado de los caminos en la fuente oficial:", officialStatusSourceId: "estado", observation: { text: "Observación pasada de ejemplo: un tramo estuvo cerrado por mantenimiento.", sourceIds: ["estado"], verifiedAt: "2026-10-23", publishedAt: "2026-10-24", expiresAt: "2026-11-06" } }],
  locations: [
    { id: "valle", label: "Pueblo del Valle", description: "Ubicación aproximada del centro del pueblo.", mapUrl: "https://www.openstreetmap.org/", sourceIds: ["ente"] },
    { id: "laguna", label: "Mirador de la laguna", description: "Acceso por camino de ripio desde la ruta.", mapUrl: "https://www.openstreetmap.org/", sourceIds: ["parque"] },
  ],
  photos: [foto("/img/home/2.jpg", "Paisaje de montaña usado como foto de ejemplo", "Foto de ejemplo")],
  address: "Dirección de ejemplo", mapUrl: "https://www.openstreetmap.org/",
  related: [{ href: "/provincias/mendoza", label: "Turismo en Mendoza" }, { href: "/actividades?provincia=mendoza", label: "Qué hacer en Mendoza" }],
};

const { default: TripArticle } = await load("components/escapadas/TripArticle.tsx");
const { TarjetaAtractivo, InfoPractica } = await load("components/destinos/Lugares.tsx");
const fuentes = trip.sources.map(s => ({ id: s.id, titulo: s.title, url: s.url, consultadaEl: s.checkedAt }));
const extra = createElement("section", { className: "contenedor pb-16", "aria-label": "Componentes para fichas del maestro" },
  createElement("p", { className: "antetitulo text-terracota-600" }, "Componentes para las fichas del maestro (ejemplo)"),
  createElement("div", { className: "mt-4 grid gap-4 md:grid-cols-3" },
    createElement(TarjetaAtractivo, { atractivo: { id: "A1", nombre: "Atractivo natural de ejemplo", tipo: "naturaleza", descripcion: "Descripción breve con su fuente y un enlace al mapa.", mapaUrl: "https://www.openstreetmap.org/", fuenteIds: ["parque"] }, localidad: { nombre: "Villa Laguna" }, fuentes }),
    createElement(TarjetaAtractivo, { atractivo: { id: "A2", nombre: "Patrimonio de ejemplo", tipo: "patrimonio", descripcion: "Sin foto con licencia aprobada, la tarjeta queda solo con texto.", fuenteIds: ["ente"] }, fuentes }),
    createElement(TarjetaAtractivo, { atractivo: { id: "A3", nombre: "Actividad de ejemplo", tipo: "actividad", descripcion: "Las relaciones se expresan por ID estable: localidad, provincia y fuentes.", fuenteIds: ["ente"] }, localidad: { nombre: "Pueblo del Valle" }, fuentes }),
  ),
  createElement("div", { className: "mt-6" }, createElement(InfoPractica, { fuentes, datos: [
    { id: "P1", etiqueta: "Cómo llegar", valor: "Dato práctico de ejemplo con su fuente.", fuenteIds: ["ente"] },
    { id: "P2", etiqueta: "Estado del acceso", valor: "Se consulta en la fuente oficial antes de salir.", fuenteIds: ["estado"], verificadoEl: "2026-10-23" },
  ] })),
);
const body = renderToStaticMarkup(createElement(Fragment, null,
  createElement("div", { className: "bg-aviso-50 py-2 text-center text-sm font-semibold text-aviso-700" }, "Vista previa local con contenido ficticio — no es una página del sitio"),
  createElement(TripArticle, { trip }),
  extra,
));

// CSS y variables de fuente de la build en marcha (las mismas hojas que sirve el sitio).
const home = await (await fetch(origin + "/")).text();
const styles = [...home.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map(m => `<link rel="stylesheet" href="${m[1]}">`).join("");
const bodyClass = home.match(/<body class="([^"]+)"/)?.[1] ?? "";
const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><base href="${origin}/">${styles}</head><body class="${bodyClass}">${body}</body></html>`;

const out = resolve(".artifacts/pr15/screens/plantilla");
await mkdir(out, { recursive: true });
await writeFile(join(out, "plantilla.html"), html);
const browser = await chromium.launch({ channel: "chrome" });
try {
  for (const [perfil, device] of [["escritorio", { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } }], ["movil", devices["Pixel 7"]]]) {
    const context = await browser.newContext(device);
    const page = await context.newPage();
    await page.goto(origin + "/robots.txt");
    await page.setContent(html, { waitUntil: "networkidle" });
    await page.screenshot({ path: join(out, `${perfil}-plantilla-completa.png`), fullPage: true });
    await context.close();
  }
} finally {
  await browser.close();
  await rm(work, { recursive: true, force: true });
}
console.log("Capturas en", out);
