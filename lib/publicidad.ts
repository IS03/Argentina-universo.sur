// Publicidad directa: recursos locales, sin proveedor, cookies ni medición propia.
// Cambiar activa/url/ubicacion aquí y reconstruir ambas versiones del sitio.
export const ESPACIOS = {
  "portada-entre-secciones": { descripcion: "Inicio, entre regiones y planificación" },
  "actividades-tras-listado": { descripcion: "Actividades, después de la grilla" },
  "escapadas-tras-guias": { descripcion: "Escapadas, después de las guías" },
  "escapada-lateral": { descripcion: "Ficha de escapada, columna lateral (sin campañas asignadas)" },
  "santa-fe-tras-contenido": { descripcion: "Provincia de Santa Fe, después de sus secciones" },
  "seguridad-tras-contenido": { descripcion: "Seguridad, después de los consejos" },
} as const;

export type IdEspacio = keyof typeof ESPACIOS;

export interface ImagenAnuncio {
  src: string;
  alt: string;
  ancho: number;
  alto: number;
  // Índice del cuadro del original, desde cero; permite regenerar sin alterar la creatividad.
  fotograma: number;
}

export interface AnuncioDirecto {
  id: string;
  anunciante: string;
  original: string;
  imagen: ImagenAnuncio;
  secuencia?: readonly ImagenAnuncio[];
  url?: string;
  ubicacion: IdEspacio;
  activa: boolean;
  anchoMaximo: number;
}

export const CAMPANAS: readonly AnuncioDirecto[] = [
  {
    id: "juegos-suramericanos", anunciante: "Santa Fe Provincia",
    original: "publicidad/JJSS_Banners_800x600.gif",
    imagen: { src: "/publicidad/juegos-suramericanos-0.webp", ancho: 800, alto: 600, fotograma: 0, alt: "3,5 millones de gracias." },
    secuencia: [
      { src: "/publicidad/juegos-suramericanos-1.webp", ancho: 800, alto: 600, fotograma: 1, alt: "Atletas, voluntarios, familias, entrenadores, profesores y equipos, público, sponsors, hinchas… Gracias a todos." },
      { src: "/publicidad/juegos-suramericanos-2.webp", ancho: 800, alto: 600, fotograma: 2, alt: "XIII Juegos Suramericanos Santa Fe 2026. ODESUR." },
      { src: "/publicidad/juegos-suramericanos-3.webp", ancho: 800, alto: 600, fotograma: 3, alt: "Santa Fe Provincia." },
    ],
    ubicacion: "portada-entre-secciones", activa: true, anchoMaximo: 480,
  },
  {
    id: "proteccion-ingresos", anunciante: "Santa Fe Provincia y Banco Santa Fe",
    original: "publicidad/PROTEC_ING_banners_Junio_2026_250x250.gif",
    imagen: { src: "/publicidad/proteccion-ingresos-0.webp", ancho: 250, alto: 250, fotograma: 0, alt: "Un plan para que puedas desendeudarte sin comprometer tus ingresos. Santa Fe Provincia y Banco Santa Fe." },
    secuencia: [
      { src: "/publicidad/proteccion-ingresos-1.webp", ancho: 250, alto: 250, fotograma: 1, alt: "Consultá cómo ordenar tus deudas. Santa Fe Provincia y Banco Santa Fe." },
      { src: "/publicidad/proteccion-ingresos-2.webp", ancho: 250, alto: 250, fotograma: 2, alt: "Para recuperar la tranquilidad y seguir progresando. Santa Fe Provincia y Banco Santa Fe." },
    ],
    ubicacion: "actividades-tras-listado", activa: true, anchoMaximo: 250,
  },
  {
    id: "mamografia", anunciante: "Santa Fe Provincia · Ministerio de Salud · Agencia de Control del Cáncer",
    original: "publicidad/SF-Provincia_Bnnr-Mamografia_1140x100.gif",
    imagen: { src: "/publicidad/mamografia-9.webp", ancho: 1140, alto: 100, fotograma: 9, alt: "Si tenés más de 40, hacete una mamografía hoy." },
    secuencia: [
      { src: "/publicidad/mamografia-2.webp", ancho: 1140, alto: 100, fotograma: 2, alt: "Es hora." },
      { src: "/publicidad/mamografia-6.webp", ancho: 1140, alto: 100, fotograma: 6, alt: "Es ahora." },
      { src: "/publicidad/mamografia-11.webp", ancho: 1140, alto: 100, fotograma: 11, alt: "Es gratuita en la salud pública de Santa Fe y es la manera más efectiva de detectar el cáncer de mama." },
      { src: "/publicidad/mamografia-14.webp", ancho: 1140, alto: 100, fotograma: 14, alt: "Agencia de Control del Cáncer. Santa Fe Provincia. Ministerio de Salud." },
    ],
    ubicacion: "santa-fe-tras-contenido", activa: true, anchoMaximo: 1140,
  },
  {
    id: "seguridad-vial", anunciante: "APSV · Santa Fe Provincia",
    original: "publicidad/Suramericanos-APSV_200x200.gif",
    imagen: { src: "/publicidad/seguridad-vial-17.webp", ancho: 200, alto: 200, fotograma: 17, alt: "APSV. XIII Juegos Suramericanos Santa Fe 2026. ODESUR. Santa Fe Provincia. Usá el casco." },
    secuencia: [
      { src: "/publicidad/seguridad-vial-0.webp", ancho: 200, alto: 200, fotograma: 0, alt: "APSV. Te vamos a hinchar. Usá el casco." },
      { src: "/publicidad/seguridad-vial-2.webp", ancho: 200, alto: 200, fotograma: 2, alt: "APSV. Hasta que lo uses. Usá el casco." },
    ],
    ubicacion: "seguridad-tras-contenido", activa: true, anchoMaximo: 200,
  },
  {
    id: "obras-hidricas", anunciante: "Santa Fe Provincia",
    original: "publicidad/displays_obras hidricas_600x300 jpg.jpg",
    imagen: { src: "/publicidad/obras-hidricas-0.webp", ancho: 600, alto: 300, fotograma: 0, alt: "En Santa Fe nos adelantamos haciendo. 300 obras hídricas en marcha. Obras que sí. Santa Fe Provincia." },
    ubicacion: "escapadas-tras-guias", activa: true, anchoMaximo: 600,
  },
  {
    id: "mil-aulas", anunciante: "Santa Fe Provincia · Programa 1000 aulas",
    original: "publicidad/displays_rosario_mil-aulas_300x600.gif",
    imagen: { src: "/publicidad/mil-aulas-0.webp", ancho: 300, alto: 600, fotograma: 0, alt: "124 aulas nuevas en Rosario. Programa 1000 aulas. Obras que sí. Santa Fe Provincia." },
    secuencia: [
      { src: "/publicidad/mil-aulas-1.webp", ancho: 300, alto: 600, fotograma: 1, alt: "Sí a más oportunidades para enseñar y aprender. Programa 1000 aulas. Obras que sí. Santa Fe Provincia." },
    ],
    ubicacion: "escapadas-tras-guias", activa: true, anchoMaximo: 240,
  },
];

export function anunciosDelEspacio(id: IdEspacio, campanas: readonly AnuncioDirecto[] = CAMPANAS): readonly AnuncioDirecto[] {
  return campanas.filter(campana => campana.activa && campana.ubicacion === id);
}

// Una URL ausente, vacía o no web se muestra sin enlace. Nunca deducir destinos de un logotipo.
export function urlAnuncio(url?: string): string | null {
  if (!url?.trim()) return null;
  try {
    const destino = new URL(url.trim());
    return ["https:", "http:"].includes(destino.protocol) && !destino.username && !destino.password ? destino.href : null;
  } catch {
    return null;
  }
}
