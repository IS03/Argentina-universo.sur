// Metadata/inventory only. Never extracts PDF text for publication or changes an original.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { root } from "./prepare.mjs";
import { createSlug } from "../../lib/catalog.ts";
const officials = {
  esc_01: [
    "https://www.argentina.gob.ar/parquesnacionales/losglaciares",
    "Parques Nacionales: cobertura parcial, no valida la guía completa",
  ],
  esc_02: [
    "https://www.argentina.gob.ar/parquesnacionales/iguazu",
    "Parques Nacionales: cobertura parcial",
  ],
  esc_03: [
    "https://pinamar.gob.ar/turismo/",
    "Municipalidad: comprobar cada afirmación",
  ],
  esc_04: [
    "https://www.madryn.gob.ar/turismo/",
    "Municipalidad: revisar además la errata del título actual",
  ],
  esc_05: [
    "https://www.turismo.jujuy.gob.ar/",
    "Portal provincial: necesita fuentes por atractivo",
  ],
  esc_06: [
    "https://turismo.buenosaires.gob.ar/",
    "Portal oficial de turismo de la Ciudad",
  ],
  esc_07: [
    "https://www.tornquist.gov.ar/turismo/",
    "Municipalidad: cobertura de Sierra de la Ventana a revisar",
  ],
  esc_08: ["https://barilocheturismo.gob.ar/", "Portal oficial municipal"],
  esc_09: ["https://www.turismosalta.gov.ar/", "Portal provincial"],
  esc_10: [
    "https://www.cordobaturismo.gov.ar/",
    "Portal provincial: delimitar norte de Córdoba",
  ],
  esc_11: [
    "https://www.argentina.gob.ar/parquesnacionales/elpalmar",
    "Fuente comprobada para El Palmar; no cubre toda Entre Ríos",
  ],
  esc_12: [
    "https://www.ushuaia.gob.ar/turismo",
    "Portal municipal: información turística detallada pendiente",
  ],
  esc_13: [
    "https://www.argentina.gob.ar/parquesnacionales/talampaya",
    "Talampaya; Ischigualasto requiere fuente independiente de San Juan",
  ],
  esc_14: [
    "https://www.argentina.gob.ar/parquesnacionales/chaco",
    "Parque Nacional; no equivale a toda la provincia",
  ],
  esc_15: ["https://www.mendoza.gov.ar/turismo/", "Portal provincial"],
  esc_16: [
    "https://www.sanjuan.gov.ar/",
    "Portal provincial general; faltan fuentes turísticas específicas",
  ],
  esc_17: ["https://turismo.sanluis.gov.ar/", "Portal provincial"],
  esc_18: ["https://www.riogallegos.gov.ar/", "Portal municipal general"],
  esc_19: ["https://neuquentur.gob.ar/", "Portal provincial"],
  esc_20: [
    "https://www.santiagodelestero.gov.ar/",
    "Portal provincial general; faltan fuentes por destino",
  ],
  esc_21: [
    "https://misiones.tur.ar/",
    "Portal provincial: verificar titularidad institucional y cada atractivo",
  ],
  esc_22: ["https://turismo.lapampa.gob.ar/", "Portal provincial"],
  esc_23: ["https://www.formosa.gob.ar/turismo", "Portal provincial"],
  security: [
    "https://www.argentina.gob.ar/sinagir",
    "Fuente institucional de seguridad; no valida autoría del PDF",
  ],
};
async function verify(url) {
  try {
    const r = await fetch(url, {
      signal: AbortSignal.timeout(12000),
      headers: { "user-agent": "ArgentinaUniversoSur-PR10-source-check" },
    });
    const text = (await r.text()).slice(0, 200000);
    const title =
      text
        .match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]
        ?.replace(/\s+/g, " ")
        .trim() || null;
    return {
      checkedAt: new Date().toISOString(),
      status: r.status,
      finalUrl: r.url,
      title,
      availability:
        r.ok && !/just a moment|access denied|forbidden/i.test(title || "")
          ? "http-accessible-not-content-approved"
          : "manual-check-required",
    };
  } catch (e) {
    return {
      checkedAt: new Date().toISOString(),
      status: null,
      availability: "manual-check-required",
      error: e.cause?.code || e.name,
    };
  }
}
const data = JSON.parse(
  await readFile(join(root, "public/data/escapadas.json"), "utf8"),
);
const inventory = JSON.parse(
  await readFile(join(root, "docs/supabase/media-inventory.json"), "utf8"),
);
const pdfs = inventory.files.filter((f) => f.mime === "application/pdf");
let checks = {};
try {
  checks = JSON.parse(
    await readFile(join(root, "docs/pr10/official-source-checks.json"), "utf8"),
  );
} catch {
  /* first run */
}
if (process.argv.includes("--verify-sources")) {
  const urls = [...new Set(Object.values(officials).map(([u]) => u))];
  for (let i = 0; i < urls.length; i += 4)
    await Promise.all(
      urls.slice(i, i + 4).map(async (u) => {
        checks[u] = await verify(u);
      }),
    );
  await writeFile(
    join(root, "docs/pr10/official-source-checks.json"),
    JSON.stringify(checks, null, 2) + "\n",
  );
}
const matrix = pdfs.map((file) => {
  const guide = data.find((g) => g.PDF === file.url);
  const source = officials[guide?.ID || "security"];
  let pdfMetadata = { status: "not-inspected" };
  try {
    const info = execFileSync("pdfinfo", [join(root, file.originalPath)], {
      encoding: "utf8",
      maxBuffer: 2e6,
    });
    pdfMetadata = {
      status: "metadata-only",
      pages: Number(info.match(/^Pages:\s+(\d+)/m)?.[1] || 0),
      authorFieldPresent: !!info.match(/^Author:\s+\S/m),
      license: "unverified; metadata is not permission",
    };
  } catch {
    pdfMetadata = {
      status: "pdfinfo-unavailable-or-error",
      license: "unverified",
    };
  }
  const newUrl = guide
    ? "/escapadas/" +
      (guide.ID === "esc_04" ? "puerto-madryn" : createSlug(guide.TITULO))
    : "/seguridad";
  return {
    id: guide?.ID || "security-archive",
    title: guide?.TITULO || "Documento de seguridad",
    path: file.url,
    bytes: file.bytes,
    sha256: file.sha256,
    overPagesLimit: file.bytes > 25 * 1024 * 1024,
    uses: guide
      ? ["public/data/escapadas.json → EscapadasContent → /escapadas"]
      : [
          "Sin referencia interna confirmada. /seguridad ya es HTML. No descartar enlaces externos.",
        ],
    officialSource: {
      url: source[0],
      scope: source[1],
      check: checks[source[0]] || { availability: "not-checked" },
    },
    pdfMetadata,
    conversion: guide
      ? "Recomendable por etapas; redactar de nuevo tras revisar fuentes y derechos. No transcribir automáticamente."
      : "Evaluar si el HTML de /seguridad ya cubre el alcance; no crear otra URL sin necesidad.",
    manualReview: [
      "autoría y permiso de texto, mapas y fotografías",
      "vigencia de horarios, tarifas, traslados y contactos",
      "fuentes por afirmación y alcance geográfico",
      "accesibilidad, seguridad y logística sin garantías inventadas",
    ],
    suggestedUrl: newUrl,
    oldLinkStrategy:
      "Mantener PDF actual hasta autorización y respaldo independiente verificado por SHA-256. Luego 301/308 a HTML equivalente y revisado; nunca a la home ni a una página inexistente.",
    approvedForRemoval: false,
  };
});
await mkdir(join(root, "docs/pr10"), { recursive: true });
await writeFile(
  join(root, "docs/pr10/pdf-matrix.json"),
  JSON.stringify(matrix, null, 2) + "\n",
);
const md = [
  "# Matriz de sustitución de PDF",
  "",
  "Metadatos e inventario; no se extrajo texto para publicación. HTTP accesible no significa contenido ni licencia verificados. Todos los retiros siguen sin autorización.",
  "",
  "| ID / título actual | Ruta | MB | Uso | Fuente oficial candidata / estado observado | HTML propuesto |",
  "| --- | --- | ---: | --- | --- | --- |",
  ...matrix.map(
    (r) =>
      `| ${r.id}: ${r.title} | ${r.path} | ${(r.bytes / 1e6).toFixed(2)}${r.overPagesLimit ? " ⚠ >25 MiB" : ""} | ${r.uses.join("; ")} | [Fuente](${r.officialSource.url}) · ${r.officialSource.check.availability} | ${r.suggestedUrl} |`,
  ),
  "",
  "Para **cada fila** revisar autoría/licencia de texto y medios, vigencia de variables, cobertura exacta de las fuentes, mapas y logística. Los portales generales no respaldan automáticamente un itinerario. Detalle y metadatos en `pdf-matrix.json`.",
  "",
  "Enlaces antiguos: mantenerlos durante este PR. Tras autorización, copia independiente fuera del despliegue, verificación SHA-256, HTML equivalente aprobado y redirección permanente en la misma ruta original. Si no existe equivalencia, no retirar ni redirigir genéricamente. El respaldo local de los prototipos no es un archivo durable del responsable.",
];
await writeFile(join(root, "docs/pr10/PDF-MATRIX.md"), md.join("\n") + "\n");
console.log(
  JSON.stringify(
    {
      pdfs: matrix.length,
      totalBytes: matrix.reduce((n, r) => n + r.bytes, 0),
      over25MiB: matrix.filter((r) => r.overPagesLimit).length,
      sourceChecks: Object.values(checks).reduce(
        (a, r) => ((a[r.availability] = (a[r.availability] || 0) + 1), a),
        {},
      ),
    },
    null,
    2,
  ),
);
