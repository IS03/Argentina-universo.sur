import 'server-only';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { INSTITUTIONAL_PROJECT_REF } from './identity.ts';
import { validateWebPayload, type WebPayload, type CatalogKey } from './web-contract.ts';
import { publicationHash } from '../destinos/publication-contract.ts';
import { validateRemotePage } from '../destinos/remote-page.ts';
import type { EditorialDestinationPage } from '../destinos/editorial-page.ts';
type Cache = { schemaVersion: 1; projectRef: string; payload: WebPayload; payloadHash: string; extraDestinations: EditorialDestinationPage[] };
let loaded: Cache | null | undefined;
// Approved local build artifact only. Database access happens in prebuild, never during browser use.
export function readBuildCache(): Cache | null {
  if ((process.env.AUS_CONTENT_SOURCE ?? 'static') !== 'supabase') return null;
  if (loaded !== undefined) return loaded;
  let text: string;
  try { text = readFileSync(join(process.cwd(),'content/supabase/build-cache.json'),'utf8'); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT' && process.env.AUS_CONTENT_FALLBACK !== 'deny') return loaded = null;
    throw Error('APPROVED_BUILD_CACHE_REQUIRED');
  }
  const cache = JSON.parse(text) as Cache;
  if (cache.schemaVersion !== 1 || cache.projectRef !== INSTITUTIONAL_PROJECT_REF || publicationHash(cache.payload) !== cache.payloadHash) throw Error('APPROVED_BUILD_CACHE_INVALID');
  validateWebPayload(cache.payload);
  cache.extraDestinations.forEach(validateRemotePage);
  if (new Set([...cache.payload.destinations,...cache.extraDestinations].map(p=>p.slug)).size !== cache.payload.destinations.length+cache.extraDestinations.length) throw Error('PUBLIC_DESTINATION_COLLISION');
  return loaded = cache;
}
export function buildCatalog<T>(key: CatalogKey): T[] | null {
  const rows = readBuildCache()?.payload.catalogs[key];
  return rows ? structuredClone(rows) as T[] : null;
}
