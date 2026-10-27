import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types.ts';
import { readSupabaseConfig, type SupabaseEnvironment } from './config.ts';
// Shared stateless, publishable-only factory for server and build tools.
// Anonymous, stateless reads only; no service_role, cookies or auth refresh timers.
export function createOptionalSupabaseClient(env: SupabaseEnvironment = process.env, fetcher: typeof fetch = fetch) {
  const config = readSupabaseConfig(env);
  if (!config) return null;
  return createClient<Database>(config.url, config.publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetcher(input, { ...init, signal: AbortSignal.timeout(3000) }) },
  });
}
