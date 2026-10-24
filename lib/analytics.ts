/**
 * Google Analytics 4. Solo mide en el despliegue de producción de Vercel y con el ID configurado
 * en NEXT_PUBLIC_GA_ID: en local, en CI y en los Preview no se carga ningún script de Google.
 *
 * Las visitas de las navegaciones internas las registra la medición mejorada de GA4 ("cambios de
 * página basados en eventos del historial"). No se envían page_view manuales: duplicarían datos.
 */

type EntornoAnalytics = Record<string, string | undefined>;

export function idMedicionGA(env: EntornoAnalytics): string | null {
  const id = env.NEXT_PUBLIC_GA_ID?.trim();
  if (env.VERCEL_ENV !== "production" || !id) return null;
  if (!/^G-[A-Z0-9]{4,}$/.test(id)) throw new Error(`NEXT_PUBLIC_GA_ID inválido: ${id}`);
  return id;
}

// Espacio Económico Europeo, Reino Unido y Suiza: el almacenamiento analítico requiere
// consentimiento previo (RGPD/ePrivacy). Sin un banner, GA4 envía allí solo pings sin cookies.
export const REGIONES_CONSENTIMIENTO_PREVIO = [
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV",
  "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE", "IS", "LI", "NO", "GB", "CH",
] as const;

const SIN_PUBLICIDAD = { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" };

/**
 * Modo de consentimiento v2, antes de cualquier `config`. El sitio no usa publicidad: los
 * permisos publicitarios se deniegan en todas partes. Se desactivan las señales de Google
 * (datos demográficos y entre dispositivos) y la personalización de anuncios.
 */
export const SCRIPT_CONSENTIMIENTO = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('consent','default',${JSON.stringify({ ...SIN_PUBLICIDAD, analytics_storage: "denied", region: REGIONES_CONSENTIMIENTO_PREVIO })});
gtag('consent','default',${JSON.stringify({ ...SIN_PUBLICIDAD, analytics_storage: "granted" })});
gtag('set',${JSON.stringify({ allow_google_signals: false, allow_ad_personalization_signals: false, ads_data_redaction: true })});`;
