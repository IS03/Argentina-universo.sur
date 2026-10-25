import { readFile, readdir, stat } from "node:fs/promises";
import { join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { createSlug, REGION_POR_PROVINCIA, REGIONES } from "../lib/catalog.ts";
import { parseEventDate } from "../lib/events.ts";
import { extraerContactos } from "../lib/contacto.ts";

export const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const photos = ["FOTO_1", "FOTO_2", "FOTO_3"];
const normalizeName = value => createSlug(value).replaceAll("-", "");

export async function readCatalog(root = projectRoot) {
  const files = {
    provincias: "data/provincias.json", actividades: "data/actividades.json",
    escapadas: "data/escapadas.json", eventos: "santa-fe/json/events_enero_febrero.json",
  };
  return Object.fromEntries(await Promise.all(Object.entries(files).map(async ([key, file]) =>
    [key, JSON.parse(await readFile(join(root, "public", file), "utf8"))])));
}

export function validateCatalog(catalog) {
  const errors = [];
  const rows = key => {
    if (!Array.isArray(catalog[key])) {
      errors.push(`${key}: se esperaba una lista`);
      return [];
    }
    return catalog[key].filter((row, i) => {
      if (!row || typeof row !== "object" || Array.isArray(row)) {
        errors.push(`${key}[${i}]: registro inválido`);
        return false;
      }
      return true;
    });
  };
  const provincias = rows("provincias");
  const actividades = rows("actividades");
  const escapadas = rows("escapadas");
  const eventos = rows("eventos");
  const required = (row, keys, label) => {
    for (const key of keys) {
      if (typeof row[key] !== "string" || !row[key].trim()) errors.push(`${label}: ${key} requerido`);
    }
  };
  const unique = (values, label) => {
    const seen = new Set();
    for (const value of values) {
      if (seen.has(value)) errors.push(`${label}: duplicado ${value}`);
      seen.add(value);
    }
  };
  const coordinates = (row, lat, lon, label) => {
    if (!Number.isFinite(row[lat]) || Math.abs(row[lat]) > 90 ||
        !Number.isFinite(row[lon]) || Math.abs(row[lon]) > 180) errors.push(`${label}: coordenadas inválidas`);
  };
  unique(provincias.map(p => p.SLUG), "slug de provincia");
  unique(provincias.map(p => p.PROVINCIA), "nombre de provincia");
  unique(actividades.map(a => typeof a.ACTIVIDAD === "string" ? createSlug(a.ACTIVIDAD) : ""), "slug de actividad");
  unique(escapadas.map(e => e.ID), "ID de escapada");
  unique(eventos.map(e => `${e.Título}|${e.Inicio}|${e.Lugar}`), "evento");
  for (const slug of Object.keys(REGION_POR_PROVINCIA)) {
    if (!provincias.some(p => p.SLUG === slug)) errors.push(`Falta provincia: ${slug}`);
  }
  for (const [i, p] of provincias.entries()) {
    const label = `provincia[${i}] ${p.SLUG}`;
    required(p, ["PROVINCIA", "SLUG", "ZONA", "nombre_capital", "des_1", "des_2", "des_3", ...photos], label);
    if (!Object.hasOwn(REGION_POR_PROVINCIA, p.SLUG) || REGION_POR_PROVINCIA[p.SLUG] !== p.ZONA) {
      errors.push(`${label}: región o slug inconsistente con la clasificación documentada`);
    }
    coordinates(p, "LAT", "LON", label);
    coordinates(p, "lat_capital", "lon_capital", label);
  }
  for (const [i, a] of actividades.entries()) {
    const label = `actividad[${i}] ${a.ACTIVIDAD}`;
    required(a, ["PROVINCIA", "SLUG", "ACTIVIDAD", "LOCALIZACION", "des_1", "des_2", ...photos], label);
    const p = provincias.find(p => p.SLUG === a.SLUG);
    if (!p || typeof p.PROVINCIA !== "string" || typeof a.PROVINCIA !== "string" || normalizeName(p.PROVINCIA) !== normalizeName(a.PROVINCIA)) {
      errors.push(`${label}: provincia inexistente o nombre/slug inconsistente`);
    }
    if (typeof a.ACTIVIDAD === "string" && !createSlug(a.ACTIVIDAD)) errors.push(`${label}: slug vacío`);
    coordinates(a, "LATITUD", "LONGITUD", label);
  }
  for (const [i, e] of escapadas.entries()) {
    const label = `escapada[${i}] ${e.ID}`;
    required(e, ["ID", "TITULO", "PROVINCIAS", "DURACION", "PDF", "ZONA"], label);
    if (!REGIONES.includes(e.ZONA)) errors.push(`${label}: región inválida`);
    if (typeof e.PROVINCIAS === "string") {
      const destinations = e.PROVINCIAS.split(/[,;]/).map(normalizeName);
      const provinces = destinations.map(name => provincias.find(p => typeof p.PROVINCIA === "string" && normalizeName(p.PROVINCIA) === name));
      if (provinces.some(p => !p)) errors.push(`${label}: provincia inexistente`);
      if (!provinces.some(p => p?.ZONA === e.ZONA)) errors.push(`${label}: región inconsistente con sus provincias`);
    }
  }
  for (const [i, e] of eventos.entries()) {
    const label = `evento[${i}] ${e.Título}`;
    required(e, ["Título", "Inicio", "Fin", "Descripción", "Lugar", "Precio"], label);
    try {
      if (parseEventDate(e.Fin).getTime() < parseEventDate(e.Inicio).getTime()) errors.push(`${label}: Fin anterior a Inicio`);
    } catch {
      errors.push(`${label}: fecha inválida (usar YYYY-MM-DD HH:mm, hora argentina)`);
    }
  }
  return errors;
}

// Verificación exacta de mayúsculas/minúsculas también en sistemas de archivos macOS.
export async function validateAsset(url, root = projectRoot) {
  if (typeof url !== "string" || !url.startsWith("/") || url.startsWith("//")) return `URL local inválida: ${url}`;
  let pathname;
  try { pathname = decodeURIComponent(url.split(/[?#]/)[0]); } catch { return `URL inválida: ${url}`; }
  const base = resolve(root, "public");
  const target = resolve(base, `.${pathname}`);
  if (!target.startsWith(base + sep)) return `Ruta fuera de public: ${url}`;
  let current = base;
  for (const part of relative(base, target).split(sep)) {
    try {
      if (!(await readdir(current)).includes(part)) return `Archivo inexistente o capitalización incorrecta: ${url}`;
      current = join(current, part);
    } catch { return `Archivo inexistente: ${url}`; }
  }
  return (await stat(current)).isFile() ? null : `No es un archivo: ${url}`;
}

export async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map(e => e.isDirectory() ? walk(join(directory, e.name)) : [join(directory, e.name)]))).flat();
}

export function sourceAssetReferences(source, filename) {
  const references = [];
  const ast = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true,
    filename.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const visit = node => {
    if ((ts.isStringLiteralLike(node) || ts.isJsxText(node)) &&
        /^\/(img\/|pdf\/|argentina\.svg$)/.test(node.text.trim())) references.push(node.text.trim());
    ts.forEachChild(node, visit);
  };
  visit(ast);
  return references;
}

export async function validateRepository(root = projectRoot) {
  const errors = [];
  let catalog;
  try { catalog = await readCatalog(root); errors.push(...validateCatalog(catalog)); }
  catch (error) { errors.push(`Catálogo ilegible: ${error.message}`); }
  // Todo JSON público debe poder consumirse sin reemplazos de NaN ni reparaciones al leerlo.
  const jsonFiles = (await walk(join(root, "public"))).filter(f => f.endsWith(".json"));
  const assets = new Map();
  const addAsset = (url, location) => {
    if (!assets.has(url)) assets.set(url, []);
    assets.get(url).push(location);
  };
  const inspect = (value, location) => {
    if (!value || typeof value !== "object") return;
    for (const [key, item] of Object.entries(value)) {
      if (/^FOTO_\d+$|^PDF$/.test(key)) {
        if (typeof item !== "string" || !(key === "PDF" ? /^\/pdf\/.+\.pdf$/i : /^\/img\/.+\.(jpg|jpeg|png|webp|avif|svg)$/i).test(item)) {
          errors.push(`${location}.${key}: ruta de imagen/PDF inválida`);
        } else addAsset(item, `${location}.${key}`);
      }
      inspect(item, `${location}.${key}`);
    }
  };
  for (const file of jsonFiles) {
    try { inspect(JSON.parse(await readFile(file, "utf8")), relative(root, file)); }
    catch (error) { errors.push(`${relative(root, file)}: JSON inválido (${error.message})`); }
  }
  for (const dir of ["app", "components", "lib"]) {
    for (const file of (await walk(join(root, dir))).filter(f => /\.[cm]?[jt]sx?$/.test(f))) {
      for (const url of sourceAssetReferences(await readFile(file, "utf8"), file)) addAsset(url, relative(root, file));
    }
  }
  for (const [url, locations] of assets) {
    const error = await validateAsset(url, root);
    if (error) errors.push(`${error} (${locations.join(", ")})`);
  }
  // Esquemas mínimos de los otros datos de Santa Fe, sin inventar datos faltantes.
  const santaFeFields = {
    "agencias.json": ["Ciudad", "Agencia", "Teléfono/Celular", "Correo electrónico", "Contacto"],
    "oficinas_informes.json": ["Localidad", "Teléfono/WhatsApp", "Direcciones y horarios"],
    "preguntas_frecuentes.json": ["Pregunta", "Respuesta"],
    "noticias.json": ["Title", "Date", "Categories", "Summary", "Additional_Info", "Source"],
    "planes.json": ["Title", "Date", "Categories", "Summary", "Additional_Info", "Source"],
  };
  for (const [name, fields] of Object.entries(santaFeFields)) {
    try {
      const rows = JSON.parse(await readFile(join(root, "public/santa-fe/json", name), "utf8"));
      if (!Array.isArray(rows) || rows.some(row => !row || fields.some(k => typeof row[k] !== "string" || !row[k].trim()))) {
        errors.push(`${name}: campos obligatorios faltantes o inválidos`);
      }
      if (name === "oficinas_informes.json" && Array.isArray(rows) && rows.some(row => row && row["Correo/Web"] !== null && typeof row["Correo/Web"] !== "string")) {
        errors.push(`${name}: Correo/Web debe ser texto o null`);
      }
      // Ningún correo malformado o de relleno (p. ej. «info@loreipsumcom»): un dato no verificado va
      // como null («No disponible»), nunca como un enlace mailto: inválido.
      const campoCorreo = { "oficinas_informes.json": "Correo/Web", "agencias.json": "Correo electrónico" }[name];
      if (campoCorreo && Array.isArray(rows)) {
        for (const row of rows) {
          const { invalidos } = extraerContactos(row?.[campoCorreo]);
          if (invalidos.length) errors.push(`${name}: correo inválido o de relleno en «${row.Localidad ?? row.Agencia}»: ${invalidos.join(", ")}`);
        }
      }
    } catch (error) { errors.push(`${name}: ${error.message}`); }
  }
  return { errors, assetCount: assets.size, catalog };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { errors, assetCount, catalog } = await validateRepository();
  if (errors.length) {
    console.error(errors.join("\n"));
    process.exitCode = 1;
  } else {
    console.log(`Integridad OK: ${catalog.provincias.length} provincias, ${catalog.actividades.length} actividades, ${catalog.escapadas.length} escapadas, ${catalog.eventos.length} eventos; ${assetCount} referencias únicas a assets.`);
  }
}
