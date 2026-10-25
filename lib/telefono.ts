// Números de teléfono y WhatsApp de los datos de Santa Fe (formato argentino).
//
// WhatsApp (wa.me): número internacional solo con dígitos, sin «+», espacios, guiones ni ceros
// iniciales. Los celulares argentinos se escriben 54 + 9 + código de área sin 0 + número sin 15
// (plan de numeración de Argentina; así enlaza su WhatsApp el Ente Turístico Rosario,
// wa.me/5493415795884). Fuentes y criterio: docs/pr16/CONTACTO-SANTA-FE.md.

// Número nacional significativo de 10 dígitos (área + abonado), sin 0 inicial ni 15. null si es ambiguo.
function nacionalDiezDigitos(digitos: string): string | null {
  let d = digitos;
  if (d.startsWith("54") && d.length >= 12) d = d.slice(2);
  if (d.startsWith("9") && d.length === 11) d = d.slice(1); // 9 de celular ya presente
  if (d.startsWith("0")) d = d.slice(1);
  if (d.length === 12) {
    // Área de 2 a 4 cifras seguida del prefijo 15 de celulares: solo si hay una única lectura posible.
    const lecturas = [2, 3, 4].filter(area => d.slice(area, area + 2) === "15").map(area => d.slice(0, area) + d.slice(area + 2));
    d = lecturas.length === 1 ? lecturas[0] : "";
  }
  return /^[1-9]\d{9}$/.test(d) ? d : null;
}

export function whatsappArgentina(valor: string): string | null {
  const nacional = nacionalDiezDigitos(valor.replace(/\D/g, ""));
  return nacional ? `549${nacional}` : null;
}

export function enlaceWhatsapp(valor: string): string | null {
  const numero = whatsappArgentina(valor);
  return numero ? `https://wa.me/${numero}` : null;
}

// Teléfono para tel: en formato nacional (0 + área + abonado), que se marca igual desde cualquier
// teléfono de Argentina. null si no se puede leer un número completo.
export function enlaceTelefono(valor: string): string | null {
  const nacional = nacionalDiezDigitos(valor.replace(/\D/g, ""));
  return nacional ? `tel:0${nacional}` : null;
}

// Primer número de un campo como «TE: 0341 – 4802230 / WA: +54 341 5795884 / +54 341 5820955».
// Entre números se usa « / » o «;». La raya es ambigua: separa área y abonado en «0341 – 4802230» y
// dos números en «03405414216 – 3405502920»; se corta solo si la primera parte ya es un número completo.
export function primerNumero(texto: string, etiqueta: "TE" | "WA" | "Cel"): string | null {
  const encontrado = texto.match(new RegExp(`${etiqueta}:\\s*([^/;]+)`, "i"));
  if (!encontrado) return null;
  const numero = encontrado[1].replace(/[A-Za-zÁÉÍÓÚáéíóú]+:.*$/, "").trim();
  const [primero] = numero.split(/\s[–-]\s/);
  if (primero !== numero && nacionalDiezDigitos(primero.replace(/\D/g, ""))) return primero.trim();
  return /\d/.test(numero) ? numero : null;
}
