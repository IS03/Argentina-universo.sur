import { INSTITUTIONAL_PROJECT_REF, INSTITUTIONAL_URL } from './identity.ts';
export type SupabaseEnvironment = Record<string, string | undefined>;
export type PublicReadConfig = { url: string; publishableKey: string };
// No browser config or secret-key fallback. The project must be explicitly identified.
export function readSupabaseConfig(env: SupabaseEnvironment): PublicReadConfig | null {
  const url = env.SUPABASE_URL;
  const publishableKey = env.SUPABASE_PUBLISHABLE_KEY;
  const ref = env.SUPABASE_PROJECT_REF;
  if (!url && !publishableKey && !ref) return null;
  if (ref !== INSTITUTIONAL_PROJECT_REF || url !== INSTITUTIONAL_URL ||
      !publishableKey || !/^sb_publishable_[A-Za-z0-9_-]+$/.test(publishableKey)) {
    throw new Error('Configuración Supabase inválida: usar proyecto dedicado y clave publicable.');
  }
  return { url, publishableKey };
}
