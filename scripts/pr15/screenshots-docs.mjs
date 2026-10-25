// Convierte las capturas locales (.artifacts/pr15/screens) en JPEG livianos para docs/pr15/capturas.
// Uso: node scripts/pr15/screenshots-docs.mjs
import sharp from "sharp";
import { mkdir, rm } from "node:fs/promises";
import { join, resolve } from "node:path";

const origen = resolve(".artifacts/pr15/screens");
const destino = resolve("docs/pr15/capturas");
await rm(destino, { recursive: true, force: true });
await mkdir(destino, { recursive: true });

const paginas = ["portada", "provincias", "actividades", "escapadas", "provincia", "actividad"];
const trabajos = [];
for (const [etiqueta, carpeta] of [["antes", "antes-local"], ["despues", "despues-local"]]) {
  for (const perfil of ["escritorio", "movil"]) {
    for (const pagina of paginas) trabajos.push([join(carpeta, `${perfil}-${pagina}.png`), `${etiqueta}-${perfil}-${pagina}.jpg`, perfil]);
    trabajos.push([join(carpeta, `${perfil}-portada-completa.png`), `${etiqueta}-${perfil}-portada-completa.jpg`, perfil]);
  }
  trabajos.push([join(carpeta, "movil-menu.png"), `${etiqueta}-movil-menu.jpg`, "movil"]);
  trabajos.push([join(carpeta, "movil-actividades-completa.png"), `${etiqueta}-movil-actividades-completa.jpg`, "movil-completa"]);
  trabajos.push([join(carpeta, "movil-provincias-completa.png"), `${etiqueta}-movil-provincias-completa.jpg`, "movil-completa"]);
}
trabajos.push([join("plantilla", "escritorio-plantilla-completa.png"), "plantilla-escritorio.jpg", "escritorio"]);
trabajos.push([join("plantilla", "movil-plantilla-completa.png"), "plantilla-movil.jpg", "movil"]);
trabajos.push([join("publicidad-vista-previa", "escritorio-portada-completa.png"), "publicidad-vista-previa-escritorio.jpg", "escritorio"]);

const anchos = { escritorio: 960, movil: 412, "movil-completa": 206 };
for (const [entrada, salida, perfil] of trabajos) {
  await sharp(join(origen, entrada), { limitInputPixels: false })
    .resize({ width: anchos[perfil] })
    .jpeg({ quality: 70, mozjpeg: true })
    .toFile(join(destino, salida));
}
console.log(`${trabajos.length} capturas en ${destino}`);
