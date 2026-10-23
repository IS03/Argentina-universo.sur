export const EVENT_TIME_ZONE = "America/Argentina/Cordoba";

// La fuente expresa horas locales de Argentina sin offset. Nunca usar la zona del host.
// Se valida también el calendario: Date.parse por sí solo acepta p. ej. 30 de febrero.
export function parseEventDate(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(value)) {
    throw new Error(`Fecha de evento inválida: ${value}`);
  }
  const date = new Date(`${value.replace(" ", "T")}:00-03:00`);
  const local = new Date(date.getTime() - 3 * 60 * 60 * 1000);
  if (!Number.isFinite(date.getTime()) || local.toISOString().slice(0, 16).replace("T", " ") !== value) {
    throw new Error(`Fecha de evento inválida: ${value}`);
  }
  return date;
}

export function partitionEvents<T extends { Inicio: string; Fin: string }>(events: T[], now: Date) {
  const vigentes: T[] = [];
  const anteriores: T[] = [];
  for (const event of events) {
    // Fin tiene precisión de minutos: sigue vigente hasta finalizar ese minuto.
    const endExclusive = parseEventDate(event.Fin).getTime() + 60_000;
    (now.getTime() < endExclusive ? vigentes : anteriores).push(event);
  }
  vigentes.sort((a, b) => parseEventDate(a.Inicio).getTime() - parseEventDate(b.Inicio).getTime());
  anteriores.sort((a, b) => parseEventDate(b.Inicio).getTime() - parseEventDate(a.Inicio).getTime());
  return { vigentes, anteriores };
}
