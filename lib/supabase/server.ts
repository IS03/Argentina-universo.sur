import 'server-only';
export { createOptionalSupabaseClient } from './client-core.ts';
// Future consumers must explicitly opt in. The current static reader is unchanged.
export async function withStaticFallback<T>(read: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
  try { return await read(); } catch { return fallback(); }
}
