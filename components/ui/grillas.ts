// Cada grilla y su atributo sizes viven juntos: si cambia una columna o un gap, se corrige el otro.
// Anchos: .contenedor tiene 16/24/32 px de margen y un máximo de 1216 px (1152 px útiles).

// Tarjetas de provincias y actividades: 2 columnas en teléfonos, 3 en tablet y 4 en escritorio.
export const GRILLA_TARJETAS = "grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 lg:gap-6";
export const SIZES_TARJETAS =
  "(min-width: 1280px) 270px, (min-width: 1024px) calc((100vw - 136px) / 4), (min-width: 640px) calc((100vw - 88px) / 3), calc((100vw - 48px) / 2)";

// Tres destacadas de la portada: una columna en teléfonos y tres desde 640 px.
export const GRILLA_DESTACADAS = "grid gap-4 sm:grid-cols-3 sm:gap-5 lg:gap-6";
export const SIZES_DESTACADAS =
  "(min-width: 1280px) 368px, (min-width: 1024px) calc((100vw - 112px) / 3), (min-width: 640px) calc((100vw - 88px) / 3), calc(100vw - 32px)";

// Actividades: en teléfonos, lista de una columna con miniatura de 112 px (variante de 320 px);
// desde 640 px, la misma grilla de tarjetas que provincias. Así la primera pantalla del listado
// no depende de fotos grandes para el LCP.
export const GRILLA_ACTIVIDADES = "grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 lg:gap-6";
export const SIZES_ACTIVIDADES =
  "(min-width: 1280px) 270px, (min-width: 1024px) calc((100vw - 136px) / 4), (min-width: 640px) calc((100vw - 88px) / 3), 112px";
