// Utilidades para leer y normalizar datos JSON
import { readFile } from "fs/promises";
import { join } from "path";

import { normalizarProvincia, normalizarActividad } from "./catalog";
import type { Provincia, Actividad, Escapada, ProvinciaRaw, ActividadRaw, EscapadaRaw } from "./catalog";
import { connection } from "next/server";
import { partitionEvents } from "./events";
export type { Provincia, Actividad, Escapada } from "./catalog";

// Interfaces para datos de Santa Fe
export interface PlanSantaFe {
  Title: string;
  Date: string;
  Categories: string;
  Summary: string;
  Additional_Info: string;
  Source: string;
}

export interface PreguntaFrecuente {
  Pregunta: string;
  Respuesta: string;
}

export interface NoticiaSantaFe {
  Title: string;
  Date: string;
  Categories: string;
  Summary: string;
  Additional_Info: string;
  Source: string;
}

export interface OficinaInforme {
  Localidad: string;
  "Teléfono/WhatsApp": string;
  "Correo/Web": string;
  "Direcciones y horarios": string;
}

export interface Agencia {
  Ciudad: string;
  Agencia: string;
  "Teléfono/Celular": string;
  "Correo electrónico": string;
  Contacto: string;
}

export interface Evento {
  Título: string;
  Inicio: string;
  Fin: string;
  Descripción: string;
  Lugar: string;
  Precio: string;
}

// Normalizar datos de provincias
export async function getProvincias(): Promise<Provincia[]> {
  const filePath = join(process.cwd(), "public", "data", "provincias.json");
  const fileContents = await readFile(filePath, "utf8");
  const data: ProvinciaRaw[] = JSON.parse(fileContents);
  const provinciasNormalizadas = data.map(normalizarProvincia);

  // Ordenar provincias: Santa Fe en segundo lugar
  const santaFe = provinciasNormalizadas.find((p: Provincia) => p.slug === "santa_fe");
  const otrasProvincias = provinciasNormalizadas.filter((p: Provincia) => p.slug !== "santa_fe");
  
  // Ordenar las otras provincias alfabéticamente por nombre
  otrasProvincias.sort((a: Provincia, b: Provincia) => a.provincia.localeCompare(b.provincia));
  
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
  const data: ActividadRaw[] = JSON.parse(fileContents);
  return data.map(normalizarActividad);
}

// Normalizar datos de escapadas
export async function getEscapadas(): Promise<Escapada[]> {
  const filePath = join(process.cwd(), "public", "data", "escapadas.json");
  const fileContents = await readFile(filePath, "utf8");
  const data: EscapadaRaw[] = JSON.parse(fileContents);
  
  return data.map((item) => ({
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

// Funciones para cargar datos de Santa Fe
export async function getPlanesSantaFe(): Promise<PlanSantaFe[]> {
  const filePath = join(process.cwd(), "public", "santa-fe", "json", "planes.json");
  const fileContents = await readFile(filePath, "utf8");
  return JSON.parse(fileContents);
}

export async function getPreguntasFrecuentesSantaFe(): Promise<PreguntaFrecuente[]> {
  const filePath = join(process.cwd(), "public", "santa-fe", "json", "preguntas_frecuentes.json");
  const fileContents = await readFile(filePath, "utf8");
  return JSON.parse(fileContents);
}

export async function getNoticiasSantaFe(): Promise<NoticiaSantaFe[]> {
  const filePath = join(process.cwd(), "public", "santa-fe", "json", "noticias.json");
  const fileContents = await readFile(filePath, "utf8");
  return JSON.parse(fileContents);
}

export async function getOficinasInformesSantaFe(): Promise<OficinaInforme[]> {
  const filePath = join(process.cwd(), "public", "santa-fe", "json", "oficinas_informes.json");
  const fileContents = await readFile(filePath, "utf8");
  const data: Array<Omit<OficinaInforme, "Correo/Web"> & { "Correo/Web": string | null }> = JSON.parse(fileContents);
  return data.map((item) => ({
    Localidad: item.Localidad || "",
    "Teléfono/WhatsApp": item["Teléfono/WhatsApp"] || "",
    "Correo/Web": item["Correo/Web"] ?? "No disponible",
    "Direcciones y horarios": item["Direcciones y horarios"] || ""
  }));
}

export async function getAgenciasSantaFe(): Promise<Agencia[]> {
  const filePath = join(process.cwd(), "public", "santa-fe", "json", "agencias.json");
  const fileContents = await readFile(filePath, "utf8");
  return JSON.parse(fileContents);
}

export async function getEventosSantaFe(): Promise<Evento[]> {
  const filePath = join(process.cwd(), "public", "santa-fe", "json", "events_enero_febrero.json");
  const fileContents = await readFile(filePath, "utf8");
  return JSON.parse(fileContents);
}

// Evaluar en cada request: una agenda estática conservaría eventos vencidos hasta el próximo deploy.
export async function getAgendaSantaFe() {
  await connection();
  return partitionEvents(await getEventosSantaFe(), new Date());
}
