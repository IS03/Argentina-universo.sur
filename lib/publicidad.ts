// Publicidad directa local. Activación, destino y ubicación se administran aquí.
// Pauta de octubre de 2026: el pedido indica «octubre» sin fecha de inicio ni de fin. No hay
// vencimiento automático; cada campaña se apaga con «activa: false» cuando el área comercial confirme
// las fechas (docs/publicidad-octubre-2026/README.md).
// Los GIF se sirven byte por byte; picture selecciona un cuadro estático con movimiento reducido.
export const ESPACIOS = {
  "portada-central": {
    "descripcion": "Inicio, columna central: primer bloque después del hero"
  },
  "portada-lateral-izquierda": {
    "descripcion": "Inicio, columna lateral izquierda: fija al desplazar en escritorio, en el flujo en móvil"
  },
  "portada-lateral-derecha": {
    "descripcion": "Inicio, columna lateral derecha junto a «Explorá por región»"
  },
  "actividades-antes-explorador": {
    "descripcion": "Qué hacer, después del encabezado y antes del explorador"
  },
  "escapadas-antes-guias": {
    "descripcion": "Escapadas, inmediatamente después del encabezado y antes de las guías"
  },
  "provincias-lateral-mapa": {
    "descripcion": "Viajar por Argentina, columna lateral junto al mapa y listado"
  },
  "escapada-lateral": {
    "descripcion": "Ficha de escapada, sin campañas asignadas"
  },
  "santa-fe-tras-encabezado": {
    "descripcion": "Santa Fe, después del encabezado provincial; sin campañas asignadas desde octubre de 2026"
  },
  "seguridad-antes-consejos": {
    "descripcion": "Seguridad, después del encabezado; sin campañas asignadas desde octubre de 2026"
  },
  "footer-patrocinio": {
    "descripcion": "Pie de página, bloque comercial opcional después de la descripción del sitio"
  }
} as const;

export type IdEspacio = keyof typeof ESPACIOS;

export interface ImagenAnuncio {
  src: string;
  alt: string;
  ancho: number;
  alto: number;
}

export interface AnuncioDirecto {
  id: string;
  anunciante: string;
  original: string;
  imagen: ImagenAnuncio;
  movimientoReducido?: ImagenAnuncio & { fotograma: number };
  url?: string;
  ubicacion: IdEspacio;
  activa: boolean;
  anchoMaximo: number;
}

export const CAMPANAS: readonly AnuncioDirecto[] = [
  {
    "id": "juegos-suramericanos",
    "anunciante": "Santa Fe Provincia",
    "original": "publicidad/JJSS_Banners_800x600.gif",
    "ubicacion": "portada-central",
    "activa": true,
    "anchoMaximo": 800,
    "imagen": {
      "src": "/publicidad/juegos-suramericanos.gif",
      "alt": "Santa Fe Provincia. 3,5 millones de gracias.",
      "ancho": 800,
      "alto": 600
    },
    "movimientoReducido": {
      "src": "/publicidad/juegos-suramericanos-0.webp",
      "ancho": 800,
      "alto": 600,
      "fotograma": 0,
      "alt": "3,5 millones de gracias."
    }
  },
  {
    "id": "proteccion-ingresos",
    "anunciante": "Santa Fe Provincia y Banco Santa Fe",
    "original": "publicidad/PROTEC_ING_banners_Junio_2026_250x250.gif",
    "ubicacion": "provincias-lateral-mapa",
    "activa": true,
    "anchoMaximo": 250,
    "imagen": {
      "src": "/publicidad/proteccion-ingresos.gif",
      "alt": "Santa Fe Provincia y Banco Santa Fe. Un plan para que puedas desendeudarte sin comprometer tus ingresos. Santa Fe Provincia y Banco Santa Fe.",
      "ancho": 250,
      "alto": 250
    },
    "movimientoReducido": {
      "src": "/publicidad/proteccion-ingresos-0.webp",
      "ancho": 250,
      "alto": 250,
      "fotograma": 0,
      "alt": "Un plan para que puedas desendeudarte sin comprometer tus ingresos. Santa Fe Provincia y Banco Santa Fe."
    }
  },
  {
    "id": "mamografia",
    "anunciante": "Santa Fe Provincia · Ministerio de Salud · Agencia de Control del Cáncer",
    "original": "publicidad/SF-Provincia_Bnnr-Mamografia_1140x100.gif",
    "ubicacion": "escapadas-antes-guias",
    "activa": true,
    "anchoMaximo": 1140,
    "imagen": {
      "src": "/publicidad/mamografia.gif",
      "alt": "Santa Fe Provincia · Ministerio de Salud · Agencia de Control del Cáncer. Si tenés más de 40, hacete una mamografía hoy.",
      "ancho": 1140,
      "alto": 100
    },
    "movimientoReducido": {
      "src": "/publicidad/mamografia-9.webp",
      "ancho": 1140,
      "alto": 100,
      "fotograma": 9,
      "alt": "Si tenés más de 40, hacete una mamografía hoy."
    }
  },
  {
    "id": "seguridad-vial",
    "anunciante": "APSV · Santa Fe Provincia",
    "original": "publicidad/Suramericanos-APSV_200x200.gif",
    "ubicacion": "portada-lateral-izquierda",
    "activa": true,
    "anchoMaximo": 200,
    "imagen": {
      "src": "/publicidad/seguridad-vial.gif",
      "alt": "APSV · Santa Fe Provincia. APSV. XIII Juegos Suramericanos Santa Fe 2026. ODESUR. Santa Fe Provincia. Usá el casco.",
      "ancho": 200,
      "alto": 200
    },
    "movimientoReducido": {
      "src": "/publicidad/seguridad-vial-17.webp",
      "ancho": 200,
      "alto": 200,
      "fotograma": 17,
      "alt": "APSV. XIII Juegos Suramericanos Santa Fe 2026. ODESUR. Santa Fe Provincia. Usá el casco."
    }
  },
  {
    "id": "obras-hidricas",
    "anunciante": "Santa Fe Provincia",
    "original": "publicidad/displays_obras hidricas_600x300 jpg.jpg",
    "ubicacion": "actividades-antes-explorador",
    "activa": true,
    "anchoMaximo": 600,
    "imagen": {
      "src": "/publicidad/obras-hidricas.jpg",
      "alt": "Santa Fe Provincia. En Santa Fe nos adelantamos haciendo. 300 obras hídricas en marcha. Obras que sí. Santa Fe Provincia.",
      "ancho": 600,
      "alto": 300
    }
  },
  {
    "id": "mil-aulas",
    "anunciante": "Santa Fe Provincia · Programa 1000 aulas",
    "original": "publicidad/displays_rosario_mil-aulas_300x600.gif",
    "ubicacion": "portada-lateral-derecha",
    "activa": true,
    "anchoMaximo": 300,
    "imagen": {
      "src": "/publicidad/mil-aulas.gif",
      "alt": "Santa Fe Provincia · Programa 1000 aulas. 124 aulas nuevas en Rosario. Programa 1000 aulas. Obras que sí. Santa Fe Provincia.",
      "ancho": 300,
      "alto": 600
    },
    "movimientoReducido": {
      "src": "/publicidad/mil-aulas-0.webp",
      "ancho": 300,
      "alto": 600,
      "fotograma": 0,
      "alt": "124 aulas nuevas en Rosario. Programa 1000 aulas. Obras que sí. Santa Fe Provincia."
    }
  }
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
