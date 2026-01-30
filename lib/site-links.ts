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
  provincia: (slug: string) => `/provincias/${slug}`,
  actividad: (slug: string) => `/actividades/${slug}`,
  actividadesPorProvincia: (slug: string) => `/actividades?provincia=${slug}`,
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
