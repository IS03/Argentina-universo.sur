/**
 * Datos del aviso de privacidad y cookies (/privacidad). Mantener en línea con lo que el sitio
 * realmente usa: lib/analytics.ts (GA4), @vercel/analytics, @vercel/speed-insights, localStorage
 * de "Continuar explorando" y las teselas de OpenStreetMap de los mapas.
 */

export const ULTIMA_ACTUALIZACION = "24 de octubre de 2026";

// Titular según el pie de página del sitio.
export const RESPONSABLE = "Sebastián Miguel Giusti";

// Canal para ejercer los derechos de la Ley 25.326. Obligatorio: una prueba impide publicar sin él.
export const CONTACTO_PRIVACIDAD = "sebastiangiusti@hotmail.com";

// Período de conservación configurado en GA4 (Admin → Recopilación de datos → Retención).
export const RETENCION_GA = "14 meses";

export const COOKIES = [
  { nombre: "_ga", proveedor: "Google Analytics", finalidad: "Distinguir visitas de un mismo navegador con un identificador seudónimo.", duracion: "2 años" },
  { nombre: "_ga_ seguida del identificador de la propiedad", proveedor: "Google Analytics", finalidad: "Mantener el estado de la sesión de medición.", duracion: "2 años" },
];

export const ALMACENAMIENTO_LOCAL = [
  { nombre: "consentimientoCookies", finalidad: "Guardar tu decisión sobre las cookies de Google Analytics (aceptar o rechazar) y su fecha, durante 12 meses." },
  { nombre: "provinciasVisitadas", finalidad: "Recordar las últimas provincias visitadas para la sección “Continuar explorando” de la portada." },
  { nombre: "actividadesVisitadas", finalidad: "Recordar las últimas actividades visitadas para la misma sección." },
];
