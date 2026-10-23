import { resolveProvinciaSlug, REGION_POR_PROVINCIA, TODAS_LAS_PROVINCIAS } from "./catalog.ts";

/**
 * Filtro de /actividades. La página es estática y el servidor no ve ?provincia, así que cada
 * filtro se prerenderiza en una ruta interna y un rewrite la sirve bajo la URL pública, que no
 * cambia. El HTML llega ya filtrado: sin contenido incorrecto mientras hidrata.
 */
export const RUTA_INTERNA_FILTRO = "/actividades/por-provincia";
export const FILTRO_SIN_RESULTADOS = "sin-resultados";
export const SLUGS_PROVINCIAS = Object.keys(REGION_POR_PROVINCIA);

const conProvincia = (value: string) => [{ type: "query" as const, key: "provincia", value }];

// Gana la primera regla que coincide; Next compara el valor completo (^…$).
export const ACTIVIDADES_FILTRO_REWRITES = [
  { source: "/actividades", has: conProvincia(`(?<provincia>${SLUGS_PROVINCIAS.join("|")})`), destination: `${RUTA_INTERNA_FILTRO}/:provincia` },
  { source: "/actividades", has: conProvincia("catarmaca"), destination: `${RUTA_INTERNA_FILTRO}/catamarca` },
  // Cualquier otro valor no vacío muestra el listado vacío, como antes de PR 03.
  { source: "/actividades", has: conProvincia(".+"), destination: `${RUTA_INTERNA_FILTRO}/${FILTRO_SIN_RESULTADOS}` },
];

// Lo mismo que resuelven los rewrites, para el navegador: valor de ?provincia → selección.
export function seleccionDesdeParametro(valor: string | null): string {
  if (!valor) return TODAS_LAS_PROVINCIAS;
  const slug = resolveProvinciaSlug(valor);
  return SLUGS_PROVINCIAS.includes(slug) ? slug : FILTRO_SIN_RESULTADOS;
}

// La ruta interna no es pública: un acceso directo vuelve a la URL con el parámetro.
export const ACTIVIDADES_FILTRO_REDIRECTS = [
  { source: `${RUTA_INTERNA_FILTRO}/:provincia`, destination: "/actividades?provincia=:provincia", permanent: true },
];

/**
 * Rutas y textos ancla para enlazado interno (SEO).
 * Centraliza URLs para evitar links rotos y mantiene textos ancla descriptivos.
 * Jerarquía: Inicio → Provincias → Provincia → Actividades → Actividad
 *            Inicio → Actividades | Escapadas | Seguridad
 */

export const ROUTES = {
  home: "/",
  provincias: "/provincias",
  actividades: "/actividades",
  escapadas: "/escapadas",
  seguridad: "/seguridad",
  provincia: (slug: string) => `/provincias/${resolveProvinciaSlug(slug)}`,
  actividad: (slug: string) => `/actividades/${slug}`,
  actividadesPorProvincia: (slug: string) => `/actividades?provincia=${resolveProvinciaSlug(slug)}`,
} as const;

/** Textos ancla descriptivos para navegación principal (Navbar/Footer) */
export const NAV_ANCHORS = {
  home: "Inicio - Argentina Universo Sur",
  provincias: "Viajar por provincias de Argentina",
  actividades: "Qué hacer: actividades turísticas por provincia",
  escapadas: "Escapadas y guías en PDF",
  seguridad: "Guía de seguridad para viajeros",
} as const;

/** Textos ancla para bloques de enlaces internos en páginas (contextuales) */
export const INTERNAL_ANCHORS = {
  verTodasLasProvincias: "Ver todas las provincias de Argentina",
  verActividades: "Ver actividades turísticas en Argentina",
  verActividadesEnProvincia: (provincia: string) =>
    `Ver qué hacer en ${provincia}`,
  verEscapadas: "Ver guías de escapadas en PDF",
  guiaSeguridad: "Consejos de seguridad para viajeros",
  turismoEnProvincia: (provincia: string) => `Turismo en ${provincia}`,
  explorarProvincias: "Explorar provincias de Argentina",
  explorarActividades: "Explorar actividades por provincia",
} as const;
