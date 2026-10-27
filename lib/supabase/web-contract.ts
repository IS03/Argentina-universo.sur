import { publicationHash, validatePublication, type DestinationRelease } from '../destinos/publication-contract.ts';
import type { EditorialDestinationPage } from '../destinos/editorial-page.ts';
import { CATALOG_HASHES } from './catalog-pins.ts';
export type CatalogKey = keyof typeof CATALOG_HASHES;
export interface WebPayload { schemaVersion: 1; catalogs: Record<CatalogKey, unknown[]>; release: DestinationRelease; destinations: EditorialDestinationPage[] }
export function validateWebPayload(value: unknown): WebPayload {
  const p = value as WebPayload;
  if (!p || Object.keys(p).sort().join() !== ['schemaVersion','catalogs','release','destinations'].sort().join() || p.schemaVersion !== 1 ||
      !p.catalogs || Object.keys(p.catalogs).sort().join() !== Object.keys(CATALOG_HASHES).sort().join()) throw Error('PUBLIC_RELEASE_SHAPE');
  for (const key of Object.keys(CATALOG_HASHES) as CatalogKey[]) if (!Array.isArray(p.catalogs[key]) || publicationHash(p.catalogs[key]) !== CATALOG_HASHES[key]) throw Error('PUBLIC_CATALOG_VERSION_MISMATCH');
  if (validatePublication(p.release,p.destinations).length) throw Error('PUBLIC_DESTINATION_VERSION_MISMATCH');
  return p;
}
