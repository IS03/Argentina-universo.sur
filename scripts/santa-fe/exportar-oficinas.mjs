// Exporta public/santa-fe/oficinas_informes.xlsx (planilla histórica, sin modificar) a
// public/santa-fe/json/oficinas_informes.json aplicando correcciones documentadas en
// data/correcciones/oficinas_informes.json. Así la corrección es reproducible y la planilla sigue
// igual a su hash de inventario.
//
// Uso:
//   node scripts/santa-fe/exportar-oficinas.mjs           # --check: falla si el JSON publicado difiere
//   node scripts/santa-fe/exportar-oficinas.mjs --write   # reescribe el JSON publicado
//
// Falla si la planilla ya no coincide con su hash de inventario, o si una corrección encuentra en la
// planilla un valor distinto del que esperaba (alguien la editó: hay que revisar la corrección).
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import XLSX from "xlsx";
import { extraerContactos } from "../../lib/contacto.ts";

const raiz = fileURLToPath(new URL("../../", import.meta.url));
const PLANILLA = "public/santa-fe/oficinas_informes.xlsx";
const PUBLICADO = "public/santa-fe/json/oficinas_informes.json";
const CORRECCIONES = "data/correcciones/oficinas_informes.json";

export async function exportarOficinas(root = raiz) {
  const errores = [];
  const bytes = await readFile(join(root, PLANILLA));
  const hash = createHash("sha256").update(bytes).digest("hex");
  const inventario = JSON.parse(await readFile(join(root, "docs/supabase/media-inventory.json"), "utf8"));
  const registro = inventario.files.find(f => f.originalPath === PLANILLA);
  if (!registro || registro.sha256 !== hash) {
    errores.push(`${PLANILLA} no coincide con su hash de inventario: revisá el cambio y regenerá el inventario (npm run inventory:media) antes de exportar.`);
  }
  const libro = XLSX.read(bytes, { type: "buffer" });
  const filas = XLSX.utils.sheet_to_json(libro.Sheets[libro.SheetNames[0]], { defval: null });
  const correcciones = JSON.parse(await readFile(join(root, CORRECCIONES), "utf8"));
  for (const c of correcciones) {
    const fila = filas.find(f => f.Localidad === c.localidad);
    if (!fila) {
      errores.push(`Corrección sin fila: no hay «${c.localidad}» en la planilla.`);
      continue;
    }
    if (fila[c.campo] !== c.valorEnPlanilla) {
      errores.push(`La planilla cambió en «${c.localidad}» / ${c.campo}: se esperaba ${JSON.stringify(c.valorEnPlanilla)} y hay ${JSON.stringify(fila[c.campo])}. Revisá si la corrección sigue haciendo falta.`);
      continue;
    }
    if (!/^https:\/\//.test(c.fuente?.url ?? "") || !/^\d{4}-\d{2}-\d{2}$/.test(c.fuente?.consultadaEl ?? "")) {
      errores.push(`La corrección de «${c.localidad}» necesita una fuente https y una fecha de consulta.`);
    }
    const { invalidos } = extraerContactos(c.valorPublicado);
    if (c.campo === "Correo/Web" && invalidos.length) errores.push(`La corrección de «${c.localidad}» publica un correo inválido: ${invalidos.join(", ")}`);
    fila[c.campo] = c.valorPublicado;
  }
  // Mismo formato que el archivo publicado: 2 espacios, sin salto final.
  return { contenido: JSON.stringify(filas, null, 2), errores };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { contenido, errores } = await exportarOficinas();
  if (errores.length) {
    console.error(errores.join("\n"));
    process.exit(1);
  }
  if (process.argv.includes("--write")) {
    await writeFile(join(raiz, PUBLICADO), contenido);
    console.log(`Escrito ${PUBLICADO} desde ${PLANILLA} con las correcciones documentadas.`);
  } else if ((await readFile(join(raiz, PUBLICADO), "utf8")) !== contenido) {
    console.error(`${PUBLICADO} no coincide con la exportación de ${PLANILLA} + ${CORRECCIONES}. Ejecutá con --write o revisá el cambio manual.`);
    process.exit(1);
  } else {
    console.log(`${PUBLICADO} coincide con ${PLANILLA} + ${CORRECCIONES}.`);
  }
}
