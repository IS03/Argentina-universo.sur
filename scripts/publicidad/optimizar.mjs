// Publica copias idénticas de los originales y genera solo la alternativa de movimiento reducido.
// node --experimental-strip-types scripts/publicidad/optimizar.mjs
import { readFile, mkdir, writeFile, copyFile, rm } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import sharp from "sharp";
import { CAMPANAS } from "../../lib/publicidad.ts";

const root = fileURLToPath(new URL("../../", import.meta.url));
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const previous = JSON.parse(await readFile(join(root, "docs/pr21/inventario.json"), "utf8").catch(() => "[]"));
await mkdir(join(root, "public/publicidad"), { recursive: true });
const inventory = [];
for (const campana of CAMPANAS) {
  const original = join(root, campana.original), bytes = await readFile(original);
  const metadata = await sharp(bytes, { animated: true }).metadata();
  const derivados = [];
  for (const [index, imagen] of [campana.imagen, campana.movimientoReducido].filter(Boolean).entries()) {
    if (!/^\/publicidad\/[a-z0-9-]+\.(gif|jpg|webp)$/.test(imagen.src)) throw Error("Ruta pública inválida");
    if (metadata.width !== imagen.ancho || (metadata.pageHeight || metadata.height) !== imagen.alto) throw Error("Revisar proporciones: " + campana.id);
    const target = join(root, "public", imagen.src);
    if (index === 0) await copyFile(original, target);
    else {
      if (!Number.isInteger(imagen.fotograma) || imagen.fotograma < 0 || imagen.fotograma >= (metadata.pages || 1)) throw Error("Cuadro estático inválido");
      await sharp(original, { page: imagen.fotograma, pages: 1 }).webp({ quality: 85, effort: 6 }).toFile(target);
    }
    const result = await readFile(target);
    derivados.push({ ...imagen, animada: index === 0 && (metadata.pages || 1) > 1, bytes: result.length, sha256: hash(result) });
  }
  inventory.push({ id: campana.id, anunciante: campana.anunciante, original: campana.original, formato: metadata.format,
    ancho: metadata.width, alto: metadata.pageHeight || metadata.height, bytes: bytes.length, sha256: hash(bytes),
    cuadrosOriginales: metadata.pages || 1, duracionesMs: metadata.delay || [], repeticiones: metadata.loop ?? null,
    url: campana.url || null, ubicacion: campana.ubicacion, derivados });
}
// Solo limpia derivados antes declarados que dejaron de usarse. Nunca toca publicidad/.
const used = new Set(inventory.flatMap(c => c.derivados.map(d => d.src)));
for (const image of previous.flatMap(c => c.derivados)) {
  if (!used.has(image.src) && /^\/publicidad\/[a-z0-9-]+\.webp$/.test(image.src)) await rm(join(root, "public", image.src), { force: true });
}
await writeFile(join(root, "docs/pr21/inventario.json"), JSON.stringify(inventory, null, 2) + "\n");
console.log(JSON.stringify({ campanas: inventory.length, originalesSinAlterar: inventory.length, alternativasEstaticas: inventory.filter(c => c.cuadrosOriginales > 1).length }));
