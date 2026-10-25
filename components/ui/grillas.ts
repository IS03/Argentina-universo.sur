// Cada grilla y su atributo sizes viven juntos: si cambia una columna o un gap, se corrige el otro.
// Anchos: .contenedor tiene 16/24/32 px de margen y un máximo de 1216 px (1152 px útiles).

// Tarjetas de provincias y actividades: 2 columnas en teléfonos, 3 en tablet y 4 en escritorio.
export const GRILLA_TARJETAS = "grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 lg:gap-6";
export const SIZES_TARJETAS =
  "(min-width: 1280px) 270px, (min-width: 1024px) calc((100vw - 136px) / 4), (min-width: 640px) calc((100vw - 88px) / 3), calc((100vw - 48px) / 2)";

// Tres destacadas de la portada: en teléfonos, fila desplazable con tarjetas del 78 % del ancho
// (se ve que hay más sin apilar 900 px de fotos); desde 640 px, tres columnas.
export const GRILLA_DESTACADAS = "fila-desplazable -mx-4 gap-3 px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-5 sm:overflow-visible sm:px-0 lg:gap-6";
export const ITEM_DESTACADA = "w-[78%] sm:w-auto";
export const SIZES_DESTACADAS =
  "(min-width: 1280px) 368px, (min-width: 1024px) calc((100vw - 112px) / 3), (min-width: 640px) calc((100vw - 88px) / 3), calc((100vw - 32px) * 0.78)";

// Fotos de ancho completo (carruseles de detalle). En teléfonos el pedido se limita a 320 px de
// ancho de referencia: con densidades de 2,6–3× elige la variante de 960 px en lugar de la de
// 1280 (≈ 40 % menos de bytes) y la diferencia no se percibe en una foto de 380 px.
export const SIZES_ANCHO_COMPLETO =
  "(min-width: 1280px) 1152px, (min-width: 1024px) calc(100vw - 64px), (min-width: 640px) calc(100vw - 48px), min(calc(100vw - 32px), 320px)";

// Actividades: en teléfonos, lista de una columna con miniatura de 112 px (variante de 320 px);
// desde 640 px, la misma grilla de tarjetas que provincias. Así la primera pantalla del listado
// no depende de fotos grandes para el LCP.
export const GRILLA_ACTIVIDADES = "grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 lg:gap-6";
export const SIZES_ACTIVIDADES =
  "(min-width: 1280px) 270px, (min-width: 1024px) calc((100vw - 136px) / 4), (min-width: 640px) calc((100vw - 88px) / 3), 112px";
