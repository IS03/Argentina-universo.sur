// Publicidad directa local. Activación, destino y ubicación se administran aquí.
// Pauta de noviembre de 2026: el pedido indica «noviembre» sin fecha de inicio ni de fin. No hay
// vencimiento automático; cada campaña se apaga con «activa: false» cuando el área comercial confirme
// las fechas. Mismas ranuras contratadas que en octubre (docs/publicidad-octubre-2026/README.md).
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
    "id": "obras-newbery",
    "anunciante": "Santa Fe Provincia · Obras que sí",
    "original": "publicidad/OBRAS QUE SI -HIDRICAS-newbery_banner-__800x600.gif",
    "ubicacion": "portada-central",
    "activa": true,
    "anchoMaximo": 800,
    "imagen": {
      "src": "/publicidad/obras-newbery.gif",
      "alt": "Santa Fe Provincia · Obras que sí. Av. Jorge Newbery, transformación integral. Mejoramos la conexión al aeropuerto, multiplicamos carriles, sumamos iluminación y bicisenda. Obras que sí.",
      "ancho": 800,
      "alto": 600
    },
    "movimientoReducido": {
      "src": "/publicidad/obras-newbery-0.webp",
      "ancho": 800,
      "alto": 600,
      "fotograma": 0,
      "alt": "Av. Jorge Newbery, transformación integral. Obras que sí. Santa Fe Provincia."
    }
  },
  {
    "id": "genero-violencia",
    "anunciante": "Santa Fe Provincia",
    "original": "publicidad/GENERO 4_200X200.gif",
    "ubicacion": "portada-lateral-izquierda",
    "activa": true,
    "anchoMaximo": 200,
    "imagen": {
      "src": "/publicidad/genero-violencia.gif",
      "alt": "Santa Fe Provincia. No es un ex intenso. Es violento. Y puede terminar mal. Metete, ella te necesita: llamá al 911.",
      "ancho": 200,
      "alto": 200
    },
    "movimientoReducido": {
      "src": "/publicidad/genero-violencia-1.webp",
      "ancho": 200,
      "alto": 200,
      "fotograma": 1,
      "alt": "Metete, ella te necesita. Llamá al 911. Santa Fe Provincia."
    }
  },
  {
    "id": "obras-hidricas-vertical",
    "anunciante": "Santa Fe Provincia · Obras que sí",
    "original": "publicidad/obras hidricas_300x600 jpg.jpg",
    "ubicacion": "actividades-antes-explorador",
    "activa": true,
    "anchoMaximo": 300,
    "imagen": {
      "src": "/publicidad/obras-hidricas-vertical.jpg",
      "alt": "Santa Fe Provincia · Obras que sí. En Santa Fe nos adelantamos haciendo. 300 obras hídricas en marcha. Obras que sí.",
      "ancho": 300,
      "alto": 600
    }
  },
  {
    "id": "mil-aulas-rosario",
    "anunciante": "Santa Fe Provincia · Programa 1000 aulas",
    "original": "publicidad/mil-aulas_ROSARIO 600x300.gif",
    "ubicacion": "portada-lateral-derecha",
    "activa": true,
    "anchoMaximo": 600,
    "imagen": {
      "src": "/publicidad/mil-aulas-rosario.gif",
      "alt": "Santa Fe Provincia · Programa 1000 aulas. 124 aulas nuevas en Rosario. Sí a más oportunidades para enseñar y aprender. Programa 1000 aulas. Obras que sí.",
      "ancho": 600,
      "alto": 300
    },
    "movimientoReducido": {
      "src": "/publicidad/mil-aulas-rosario-0.webp",
      "ancho": 600,
      "alto": 300,
      "fotograma": 0,
      "alt": "124 aulas nuevas en Rosario. Programa 1000 aulas. Obras que sí. Santa Fe Provincia."
    }
  },
  {
    "id": "tercer-carril",
    "anunciante": "Santa Fe Provincia · Obras que sí",
    "original": "publicidad/3°CARRIL-nuevo-tramo_banner-web_1140x100.gif",
    "ubicacion": "escapadas-antes-guias",
    "activa": true,
    "anchoMaximo": 1140,
    "imagen": {
      "src": "/publicidad/tercer-carril.gif",
      "alt": "Santa Fe Provincia · Obras que sí. 3er carril: se viene un nuevo tramo. Autopista Rosario · Santa Fe. Espacio para camiones, fluidez para todos. Obras que sí.",
      "ancho": 1140,
      "alto": 100
    },
    "movimientoReducido": {
      "src": "/publicidad/tercer-carril-0.webp",
      "ancho": 1140,
      "alto": 100,
      "fotograma": 0,
      "alt": "3er carril: se viene un nuevo tramo. Autopista Rosario · Santa Fe."
    }
  },
  {
    "id": "objetivo-dengue",
    "anunciante": "Santa Fe Provincia · Objetivo Dengue",
    "original": "publicidad/Dengue_Objetivo_250x250.gif",
    "ubicacion": "provincias-lateral-mapa",
    "activa": true,
    "anchoMaximo": 250,
    "imagen": {
      "src": "/publicidad/objetivo-dengue.gif",
      "alt": "Santa Fe Provincia · Objetivo Dengue. Entrenamiento anti dengue. Vaciá, limpiá, tapá los recipientes que acumulen agua. Objetivo Dengue.",
      "ancho": 250,
      "alto": 250
    },
    "movimientoReducido": {
      "src": "/publicidad/objetivo-dengue-1.webp",
      "ancho": 250,
      "alto": 250,
      "fotograma": 1,
      "alt": "Vaciá, limpiá, tapá los recipientes que acumulen agua. Objetivo Dengue. Santa Fe Provincia."
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
