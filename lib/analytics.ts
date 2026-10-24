import { pagesAnalyticsAllowed, isPagesPreview } from "./pages/environment.ts";
/**
 * Google Analytics 4. En Vercel mantiene el contrato existente; Pages requiere producción, rama
 * configurada y hostname autorizado (PagesConsent). Siempre necesita el ID configurado
 * en NEXT_PUBLIC_GA_ID: en local, en CI y en los Preview no hay banner ni scripts de Google.
 *
 * Modo de consentimiento básico: gtag.js no se carga ni envía nada hasta que la persona acepta en
 * el banner (components/consentimiento). Al aceptar se fijan los permisos de COMANDOS_CONSENTIMIENTO y
 * recién entonces se monta GoogleAnalytics.
 *
 * Las visitas de las navegaciones internas las registra la medición mejorada de GA4 ("cambios de
 * página basados en eventos del historial"). No se envían page_view manuales: duplicarían datos.
 */

type EntornoAnalytics = Record<string, string | undefined>;

export function idMedicionGA(env: EntornoAnalytics): string | null {
  const id = env.NEXT_PUBLIC_GA_ID?.trim();
  if (!id || isPagesPreview(env)) return null;
  if (env.AUS_STATIC_EXPORT === "1" ? !pagesAnalyticsAllowed(env) : env.VERCEL_ENV !== "production") return null;
  if (!/^G-[A-Z0-9]{4,}$/.test(id)) throw new Error(`NEXT_PUBLIC_GA_ID inválido: ${id}`);
  return id;
}

/**
 * Comandos de gtag previos al config: analítica concedida (la persona ya aceptó), todos los permisos
 * publicitarios denegados, sin señales de Google (datos demográficos y entre dispositivos) ni
 * personalización de anuncios.
 */
export const COMANDOS_CONSENTIMIENTO = [
  ["consent", "default", { analytics_storage: "granted", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" }],
  ["set", { allow_google_signals: false, allow_ad_personalization_signals: false, ads_data_redaction: true }],
] as const;

// Al rechazar: se deniega el almacenamiento y se borran las cookies que GA4 pudo haber creado.
export const COMANDO_REVOCAR = ["consent", "update", { analytics_storage: "denied" }] as const;

export function cookiesGA(gaId: string): string[] {
  return ["_ga", `_ga_${gaId.replace(/^G-/, "")}`];
}
