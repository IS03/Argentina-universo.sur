import { resolveProvinciaSlug } from "./catalog.ts";
import type { ProvinciaResumen, ActividadResumen } from "./catalog.ts";

// Claves escritas por ProvinciaVisitTracker y ActividadVisitTracker.
export const CLAVE_PROVINCIAS_VISITADAS = "provinciasVisitadas";
export const CLAVE_ACTIVIDADES_VISITADAS = "actividadesVisitadas";
export const MAX_VISITAS_INICIO = 8;
export const URL_CATALOGO_RESUMEN = "/api/catalogo-resumen";

// Formato actual { slug, timestamp } y formato antiguo: array de slugs.
type Visita = string | { slug: string; timestamp?: number };

export type VisitaReciente =
  | { tipo: "provincia"; data: ProvinciaResumen }
  | { tipo: "actividad"; data: ActividadResumen };

function leerVisitas(json: string | null, tipo: string): Visita[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error(`Error al parsear ${tipo} visitadas:`, e);
    return [];
  }
}

// Combina ambos historiales, del más reciente al más antiguo, con un máximo de ocho.
export function resolverVisitasRecientes(
  provinciasJson: string | null,
  actividadesJson: string | null,
  provincias: ProvinciaResumen[],
  actividades: ActividadResumen[],
  ahora = Date.now(),
): VisitaReciente[] {
  const provinciasPorSlug = new Map(provincias.map(p => [p.slug, p]));
  const actividadesPorSlug = new Map(actividades.map(a => [a.actividadSlug, a]));
  const combinado: Array<VisitaReciente & { timestamp: number }> = [];
  const slugDe = (item: Visita) => typeof item === "string" ? item : item?.slug;
  const momentoDe = (item: Visita) => typeof item === "object" && item?.timestamp ? item.timestamp : ahora;

  for (const item of leerVisitas(provinciasJson, "provincias")) {
    const provincia = provinciasPorSlug.get(resolveProvinciaSlug(slugDe(item)));
    if (provincia) combinado.push({ tipo: "provincia", data: provincia, timestamp: momentoDe(item) });
  }
  for (const item of leerVisitas(actividadesJson, "actividades")) {
    const actividad = actividadesPorSlug.get(slugDe(item));
    if (actividad) combinado.push({ tipo: "actividad", data: actividad, timestamp: momentoDe(item) });
  }

  return combinado
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, MAX_VISITAS_INICIO)
    .map(({ tipo, data }) => ({ tipo, data }) as VisitaReciente);
}
