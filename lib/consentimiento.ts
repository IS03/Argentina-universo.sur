/**
 * Decisión del visitante sobre las cookies de analítica (GA4). Se guarda solo en su navegador
 * (localStorage) con versión y fecha: si cambia lo que se pide o vence la vigencia, se vuelve a preguntar.
 * El banner y el panel de /privacidad leen y escriben este mismo estado.
 */

export const CLAVE_CONSENTIMIENTO = "consentimientoCookies";
// Subir la versión obliga a preguntar de nuevo (por ejemplo, si se agregan otras cookies).
export const VERSION_CONSENTIMIENTO = 1;
export const VIGENCIA_DIAS = 365;
const EVENTO_CAMBIO = "consentimiento-cookies";
const DIA_MS = 86_400_000;

export type Decision = "aceptada" | "rechazada";

export function interpretarConsentimiento(guardado: string | null, ahora: number): Decision | null {
  if (!guardado) return null;
  try {
    const { analitica, version, fecha } = JSON.parse(guardado) ?? {};
    const momento = Date.parse(fecha);
    if (version !== VERSION_CONSENTIMIENTO || (analitica !== "aceptada" && analitica !== "rechazada")) return null;
    if (!Number.isFinite(momento) || momento > ahora + DIA_MS || ahora - momento > VIGENCIA_DIAS * DIA_MS) return null;
    return analitica;
  } catch {
    return null;
  }
}

export function serializarConsentimiento(analitica: Decision, ahora: number): string {
  return JSON.stringify({ analitica, version: VERSION_CONSENTIMIENTO, fecha: new Date(ahora).toISOString() });
}

// Si el almacenamiento no está disponible (modo privado estricto), la decisión vale para esta pestaña.
let enMemoria: Decision | null = null;

export function leerConsentimiento(): Decision | null {
  try {
    return interpretarConsentimiento(localStorage.getItem(CLAVE_CONSENTIMIENTO), Date.now());
  } catch {
    return enMemoria;
  }
}

export function guardarConsentimiento(analitica: Decision) {
  enMemoria = analitica;
  try {
    localStorage.setItem(CLAVE_CONSENTIMIENTO, serializarConsentimiento(analitica, Date.now()));
  } catch {
    // Sin almacenamiento: queda en memoria.
  }
  window.dispatchEvent(new Event(EVENTO_CAMBIO));
}

// Para useSyncExternalStore: avisa los cambios de esta pestaña y los de otras (evento storage).
export function suscribirConsentimiento(avisar: () => void) {
  const alCambiarAlmacenamiento = (e: StorageEvent) => { if (e.key === CLAVE_CONSENTIMIENTO || e.key === null) avisar(); };
  window.addEventListener(EVENTO_CAMBIO, avisar);
  window.addEventListener("storage", alCambiarAlmacenamiento);
  return () => {
    window.removeEventListener(EVENTO_CAMBIO, avisar);
    window.removeEventListener("storage", alCambiarAlmacenamiento);
  };
}

/**
 * Script en línea para el <head>: antes del primer pintado marca <html data-consentimiento="…">
 * si hay una decisión válida, y el CSS oculta el banner (que viene en el HTML). Así quien ya decidió
 * no lo ve ni un instante, y quien no decidió lo ve en el primer pintado: nunca aparece más tarde
 * como nuevo LCP. Replica interpretarConsentimiento; una prueba verifica que coincidan.
 */
export const ATRIBUTO_DECISION = "data-consentimiento";
export const SCRIPT_DECISION_INICIAL = `(function(){try{var d=JSON.parse(localStorage.getItem(${JSON.stringify(CLAVE_CONSENTIMIENTO)})||"null"),a=Date.now(),t=d&&Date.parse(d.fecha);if(d&&d.version===${VERSION_CONSENTIMIENTO}&&(d.analitica==="aceptada"||d.analitica==="rechazada")&&isFinite(t)&&t<=a+${DIA_MS}&&a-t<=${VIGENCIA_DIAS * DIA_MS})document.documentElement.setAttribute(${JSON.stringify(ATRIBUTO_DECISION)},d.analitica)}catch(e){}})()`;
