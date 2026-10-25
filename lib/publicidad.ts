// Espacios publicitarios futuros (AdSense o publicidad directa de negocios turísticos).
//
// Estado de PR15: NINGÚN espacio está activo. No hay proveedor, script, cookie ni ID de cliente.
// Activar uno exige, fuera de este archivo: decisión del titular, actualizar /privacidad y el
// consentimiento (AdSense usa almacenamiento y señales publicitarias que hoy se rechazan) y revisar
// las reglas de contenido. Ver docs/pr15/PUBLICIDAD.md.

export type FormatoAnuncio = "banda" | "rectangulo";

// Dimensiones reservadas antes de que llegue cualquier anuncio: el contenido no se desplaza (CLS 0).
export const FORMATOS: Record<FormatoAnuncio, { movil: { ancho: number; alto: number }; escritorio: { ancho: number; alto: number }; claseAncho: string; claseAlto: string }> = {
  // 320 × 100 en teléfonos y 728 × 90 desde 768 px (formatos estándar de AdSense).
  banda: { movil: { ancho: 320, alto: 100 }, escritorio: { ancho: 728, alto: 90 }, claseAncho: "max-w-[320px] md:max-w-[728px]", claseAlto: "h-[100px] md:h-[90px]" },
  // 300 × 250 en todos los anchos.
  rectangulo: { movil: { ancho: 300, alto: 250 }, escritorio: { ancho: 300, alto: 250 }, claseAncho: "max-w-[300px]", claseAlto: "h-[250px]" },
};

export const ESPACIOS = {
  "portada-entre-secciones": { formato: "banda", descripcion: "Portada, entre regiones y planificación" },
  "actividades-tras-listado": { formato: "banda", descripcion: "Qué hacer, después de la grilla" },
  "escapadas-tras-guias": { formato: "banda", descripcion: "Escapadas, después de las guías" },
  "escapada-lateral": { formato: "rectangulo", descripcion: "Ficha de escapada, columna lateral" },
} as const satisfies Record<string, { formato: FormatoAnuncio; descripcion: string }>;

export type IdEspacio = keyof typeof ESPACIOS;

// Un anuncio directo es contenido de un anunciante, nunca editorial: siempre se rotula «Publicidad»
// y su enlace lleva rel="sponsored".
export interface AnuncioDirecto {
  anunciante: string;
  titulo: string;
  texto: string;
  href: string;
}

// Ejemplo ficticio que solo se ve con la vista previa local (AUS_PUBLICIDAD_VISTA_PREVIA=1).
export const ANUNCIO_DE_EJEMPLO: AnuncioDirecto = {
  anunciante: "Negocio turístico de ejemplo",
  titulo: "Así se vería un anuncio directo",
  texto: "Rótulo visible, borde propio y enlace patrocinado: nunca se confunde con una recomendación editorial.",
  href: "https://example.com/",
};

export type ModoEspacio = "oculto" | "vista-previa";

// Sin anuncios activos el espacio no ocupa lugar. La vista previa (solo para revisar ubicaciones en
// local) dibuja la reserva rotulada, sin scripts ni pedidos externos.
export function modoEspacio(env: Record<string, string | undefined> = process.env): ModoEspacio {
  return env.AUS_PUBLICIDAD_VISTA_PREVIA === "1" ? "vista-previa" : "oculto";
}
