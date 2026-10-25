// Correos y sitios web de los datos de contacto (oficinas y agencias de Santa Fe).
// Lo usan las páginas y scripts/validate-data.mjs: un valor que no pasa estas reglas no se muestra
// como enlace y hace fallar la validación de datos.

// local@dominio.tld: sin espacios, sin puntos al borde o repetidos, etiquetas de dominio válidas y
// un dominio de nivel superior de al menos dos letras.
const CORREO = /^[A-Za-z0-9](?:[A-Za-z0-9._%+-]*[A-Za-z0-9_%+-])?@(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/;

// Marcadores de relleno o de prueba. Se comparan como partes enteras (separadas por . _ - @), así
// «dtestero@…» no cuenta como «test».
const MARCADORES = new Set(["lorem", "ipsum", "loremipsum", "loreipsum", "example", "ejemplo", "test", "prueba", "placeholder", "dominio", "xxx", "asdf", "foo"]);

function esMarcador(valor: string): boolean {
  return valor.toLowerCase().split(/[._@-]+/).some(parte => MARCADORES.has(parte));
}

export function correoValido(valor: string): boolean {
  return CORREO.test(valor) && !valor.includes("..") && !esMarcador(valor);
}

function hostValido(host: string): boolean {
  return /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i.test(host) && !esMarcador(host);
}

// Normaliza «www.sitio.gob.ar» o «https://sitio.gob.ar/x» a una URL https válida, o null.
export function webValida(valor: string): string | null {
  try {
    const url = new URL(/^https?:\/\//i.test(valor) ? valor : `https://${valor}`);
    if (url.username || url.password || !hostValido(url.hostname)) return null;
    return url.href;
  } catch {
    return null;
  }
}

export interface Contactos {
  correos: string[];
  webs: string[];
  // Partes con @ que no son un correo válido (se informan en la validación y no se muestran).
  invalidos: string[];
}

// Extrae correos y webs de un texto libre como «turismo@x.gob.ar / www.x.gob.ar» o
// «a@x.com; b@y.com». Nunca devuelve el texto completo como si fuera una dirección.
export function extraerContactos(texto: string | null | undefined): Contactos {
  const resultado: Contactos = { correos: [], webs: [], invalidos: [] };
  if (!texto) return resultado;
  const partes = texto.replace(/\((?:sitio web|web)\)|\bweb:/gi, " ").split(/[\s;,]+|\s\/\s/).filter(Boolean);
  for (const parte of partes) {
    const limpia = parte.replace(/^[(<"']+|[)>"'.]+$/g, "");
    if (!limpia || limpia === "/") continue;
    if (limpia.includes("@")) {
      (correoValido(limpia) ? resultado.correos : resultado.invalidos).push(limpia);
      continue;
    }
    if (/^(?:https?:\/\/|www\.)/i.test(limpia) || /\.[a-z]{2,}(?:\/|$)/i.test(limpia)) {
      const web = webValida(limpia);
      if (web && !resultado.webs.includes(web)) resultado.webs.push(web);
    }
  }
  return resultado;
}

// Texto visible de una web: sin protocolo ni barra final.
export const webLegible = (url: string) => url.replace(/^https?:\/\//, "").replace(/\/$/, "");
