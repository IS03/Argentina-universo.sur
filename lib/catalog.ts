// Compartido por servidor, navegador y controles de integridad.
// Las rutas FOTO_* son URLs canónicas de archivos reales; no se adivinan extensiones.
export interface ProvinciaRaw {
  PROVINCIA: string;
  SLUG: string;
  ZONA: string;
  LAT: number;
  LON: number;
  FOTO_1: string;
  FOTO_2: string;
  FOTO_3: string;
  nombre_capital: string;
  lat_capital: number;
  lon_capital: number;
  des_1: string;
  des_2: string;
  des_3: string;
}

export interface ActividadRaw {
  PROVINCIA: string;
  SLUG: string;
  ACTIVIDAD: string;
  LOCALIZACION: string;
  FOTO_1: string;
  FOTO_2: string;
  FOTO_3: string;
  des_1: string;
  des_2: string;
  LATITUD: number;
  LONGITUD: number;
}

export interface EscapadaRaw {
  ID: string;
  TITULO: string;
  PROVINCIAS: string;
  DURACION: string;
  PDF: string;
  ZONA: string;
}

export interface Provincia {
  provincia: string;
  slug: string;
  zona: string;
  des_1: string;
  des_2: string;
  des_3: string;
  fotos: string[];
  nombre_capital: string;
  lat_capital: number;
  lon_capital: number;
}

export interface Actividad {
  provincia: string;
  slug: string;
  actividad: string;
  localizacion: string;
  des_1: string;
  des_2: string;
  fotos: string[];
  actividadSlug: string;
  lat?: number;
  lon?: number;
}

export interface Escapada {
  id: string;
  titulo: string;
  provincias: string;
  duracion: string;
  pdf: string;
  zona: string;
}

// Slugs canónicos. El slug histórico catarmaca redirige permanentemente a catamarca.
// Criterio y tabla completa: docs/DATA-ASSETS.md.
export const REGION_POR_PROVINCIA: Record<string, string> = {
  buenos_aires: "Buenos Aires", caba: "Buenos Aires",
  catamarca: "Norte", jujuy: "Norte", la_rioja: "Norte", salta: "Norte",
  santiago_del_estero: "Norte", tucuman: "Norte",
  chaco: "Litoral", corrientes: "Litoral", entre_rios: "Litoral",
  formosa: "Litoral", misiones: "Litoral", santa_fe: "Litoral",
  cordoba: "Centro",
  mendoza: "Cuyo", san_juan: "Cuyo", san_luis: "Cuyo",
  chubut: "Patagonia", la_pampa: "Patagonia", neuquen: "Patagonia",
  rio_negro: "Patagonia", santa_cruz: "Patagonia", tierra_del_fuego: "Patagonia",
};

export const REGIONES = ["Norte", "Litoral", "Centro", "Cuyo", "Buenos Aires", "Patagonia"];

// Compatibilidad con URLs, filtros e historial anteriores a PR 02.
export function resolveProvinciaSlug(slug: string): string {
  return slug === "catarmaca" ? "catamarca" : slug;
}

export function createSlug(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function getFotos(item: Pick<ProvinciaRaw, "FOTO_1" | "FOTO_2" | "FOTO_3">): string[] {
  return [item.FOTO_1, item.FOTO_2, item.FOTO_3].filter(Boolean);
}

export function normalizarProvincia(item: ProvinciaRaw): Provincia {
  return {
    provincia: item.PROVINCIA, slug: item.SLUG, zona: item.ZONA,
    des_1: item.des_1 || "", des_2: item.des_2 || "", des_3: item.des_3 || "",
    fotos: getFotos(item), nombre_capital: item.nombre_capital,
    lat_capital: item.lat_capital, lon_capital: item.lon_capital,
  };
}

export function normalizarActividad(item: ActividadRaw): Actividad {
  return {
    provincia: item.PROVINCIA, slug: item.SLUG,
    actividad: item.ACTIVIDAD, localizacion: item.LOCALIZACION,
    des_1: item.des_1 || "", des_2: item.des_2 || "", fotos: getFotos(item),
    actividadSlug: createSlug(item.ACTIVIDAD), lat: item.LATITUD, lon: item.LONGITUD,
  };
}
