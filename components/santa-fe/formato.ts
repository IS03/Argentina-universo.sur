// Formato compartido de las secciones de Santa Fe (planes y noticias).
export function fechaSantaFe(valor: string): string {
  return new Date(valor).toLocaleDateString("es-AR", { year: "numeric", month: "long", day: "numeric" });
}

// Los resúmenes importados traen marcas de cita del tipo 【…】 que no deben verse.
export function limpiarResumen(texto: string): string {
  return texto.replace(/【.*?】/g, "").trim();
}
