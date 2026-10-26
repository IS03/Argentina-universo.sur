// Conversión reproducible de cuadros completos: nunca redibuja, recorta ni sobrescribe originales.
// node --experimental-strip-types scripts/publicidad/optimizar.mjs
import { readFile, mkdir, writeFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import sharp from "sharp";
import { CAMPANAS } from "../../lib/publicidad.ts";

const root = fileURLToPath(new URL("../../", import.meta.url));
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
await mkdir(join(root, "public/publicidad"), { recursive: true });
await mkdir(join(root, "docs/pr21"), { recursive: true });
const inventory = [];
for (const campana of CAMPANAS) {
  const original = join(root, campana.original);
  const bytes = await readFile(original);
  const metadata = await sharp(bytes, { animated: true }).metadata();
  const derivados = [];
  for (const imagen of [campana.imagen, ...campana.secuencia ?? []]) {
    if (!/^\/publicidad\/[a-z0-9-]+\.webp$/.test(imagen.src)) throw Error("Ruta de derivado inválida");
    const width = metadata.width, height = metadata.pageHeight || metadata.height;
    if (width !== imagen.ancho || height !== imagen.alto || imagen.fotograma >= (metadata.pages || 1)) {
      throw Error("Revisar dimensiones/fotograma: " + campana.id);
    }
    const path = join(root, "public", imagen.src);
    // Sin resize ni crop. Sharp elimina los metadatos de edición del archivo web.
    await sharp(original, { page: imagen.fotograma, pages: 1 }).webp({ quality: 85, effort: 6 }).toFile(path);
    derivados.push({ ...imagen, bytes: (await stat(path)).size, sha256: hash(await readFile(path)) });
  }
  inventory.push({
    id: campana.id, anunciante: campana.anunciante, original: campana.original,
    formato: metadata.format, ancho: metadata.width, alto: metadata.pageHeight || metadata.height,
    bytes: bytes.length, sha256: hash(bytes), cuadrosOriginales: metadata.pages || 1,
    url: campana.url || null, ubicacion: campana.ubicacion, derivados,
  });
}
await writeFile(join(root, "docs/pr21/inventario.json"), JSON.stringify(inventory, null, 2) + "\n");
console.log(JSON.stringify(inventory.map(c => ({id: c.id, bytesOriginal: c.bytes, bytesPrincipal: c.derivados[0].bytes, bytesSecuencia: c.derivados.reduce((n, f) => n + f.bytes, 0)})), null, 2));
