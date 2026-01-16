// Utilidades para leer y normalizar datos JSON
import { readFile } from "fs/promises";
import { join } from "path";

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
  actividadSlug: string; // Slug único para la actividad
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

// Función auxiliar para crear slug desde texto
function createSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Normalizar datos de provincias
export async function getProvincias(): Promise<Provincia[]> {
  const filePath = join(process.cwd(), "public", "data", "provincias.json");
  const fileContents = await readFile(filePath, "utf8");
  const data = JSON.parse(fileContents);
  
  const provinciasNormalizadas = data.map((item: any) => {
    // Normalizar rutas de imágenes: /provincias/img/... -> /img/provincias/...
    const normalizarRuta = (ruta: string) => {
      if (!ruta) return "";
      return ruta.replace(/^\/provincias\/img\//, "/img/provincias/");
    };
    
    // Manejar zona: puede ser string, null, undefined o NaN
    let zona = item.ZONA;
    if (!zona || zona === null || (typeof zona === 'number' && isNaN(zona))) {
      zona = "";
    }
    
    return {
      provincia: item.PROVINCIA,
      slug: item.SLUG,
      zona: typeof zona === 'string' ? zona : "",
      des_1: item.des_1 || "",
      des_2: item.des_2 || "",
      des_3: item.des_3 || "",
      fotos: [
        normalizarRuta(item.FOTO_1 || ""),
        normalizarRuta(item.FOTO_2 || ""),
        normalizarRuta(item.FOTO_3 || "")
      ].filter(Boolean),
      nombre_capital: item.nombre_capital || "",
      lat_capital: item.lat_capital || 0,
      lon_capital: item.lon_capital || 0
    };
  });

  // Ordenar provincias: Santa Fe en segundo lugar
  const santaFe = provinciasNormalizadas.find(p => p.slug === "santa_fe");
  const otrasProvincias = provinciasNormalizadas.filter(p => p.slug !== "santa_fe");
  
  // Ordenar las otras provincias alfabéticamente por nombre
  otrasProvincias.sort((a, b) => a.provincia.localeCompare(b.provincia));
  
  // Insertar Santa Fe en segundo lugar
  if (santaFe) {
    otrasProvincias.splice(1, 0, santaFe);
  }
  
  return otrasProvincias;
}

// Normalizar datos de actividades
export async function getActividades(): Promise<Actividad[]> {
  const filePath = join(process.cwd(), "public", "data", "actividades.json");
  const fileContents = await readFile(filePath, "utf8");
  const data = JSON.parse(fileContents);
  
  // Función para corregir extensiones de imágenes
  // Los JSON tienen .png pero los archivos reales son .jpg o .jpeg
  const corregirExtension = (ruta: string) => {
    if (!ruta) return "";
    // Caso especial: caba1/2.png -> caba1/2.jpeg (el archivo real es .jpeg)
    if (ruta.includes("/caba/caba1/2.png")) {
      return ruta.replace(/\.png$/i, ".jpeg");
    }
    // Para el resto, reemplazar .png por .jpg (los archivos reales son .jpg)
    return ruta.replace(/\.png$/i, ".jpg");
  };
  
  return data.map((item: any) => ({
    provincia: item.PROVINCIA,
    slug: item.SLUG,
    actividad: item.ACTIVIDAD,
    localizacion: item.LOCALIZACION,
    des_1: item.des_1 || "",
    des_2: item.des_2 || "",
    fotos: [
      corregirExtension(item.FOTO_1 || ""),
      corregirExtension(item.FOTO_2 || ""),
      corregirExtension(item.FOTO_3 || "")
    ].filter(Boolean),
    actividadSlug: createSlug(item.ACTIVIDAD),
    lat: item.LATITUD || undefined,
    lon: item.LONGITUD || undefined
  }));
}

// Normalizar datos de escapadas
export async function getEscapadas(): Promise<Escapada[]> {
  const filePath = join(process.cwd(), "public", "data", "escapadas.json");
  const fileContents = await readFile(filePath, "utf8");
  const data = JSON.parse(fileContents);
  
  return data.map((item: any) => ({
    id: item.ID,
    titulo: item.TITULO,
    provincias: item.PROVINCIAS,
    duracion: item.DURACION,
    pdf: item.PDF,
    zona: item.ZONA || ""
  }));
}

// Obtener una provincia por slug
export async function getProvinciaBySlug(slug: string): Promise<Provincia | null> {
  const provincias = await getProvincias();
  return provincias.find(p => p.slug === slug) || null;
}

// Obtener actividades por provincia
export async function getActividadesByProvincia(provinciaSlug: string): Promise<Actividad[]> {
  const actividades = await getActividades();
  return actividades.filter(a => a.slug === provinciaSlug);
}

// Obtener una actividad por slug
export async function getActividadBySlug(actividadSlug: string): Promise<Actividad | null> {
  const actividades = await getActividades();
  return actividades.find(a => a.actividadSlug === actividadSlug) || null;
}
