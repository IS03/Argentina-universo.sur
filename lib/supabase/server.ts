import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types.ts';
import { readSupabaseConfig, type SupabaseEnvironment } from './config.ts';
// Deliberately unused by lib/data.ts during PR09. No initialization at module load.
// Anonymous, stateless reads only; no service_role, cookies or auth refresh timers.
export function createOptionalSupabaseClient(env: SupabaseEnvironment = process.env) {
  const config = readSupabaseConfig(env);
  if (!config) return null;
  return createClient<Database>(config.url, config.publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(3000) }) },
  });
}
// Future consumers must explicitly opt in. The current static reader is unchanged.
export async function withStaticFallback<T>(read: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
  try { return await read(); } catch { return fallback(); }
}
