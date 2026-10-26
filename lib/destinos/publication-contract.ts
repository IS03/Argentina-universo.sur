import { createHash } from 'node:crypto';
import { AUTHORIZATION_DIGEST, AUTHORIZED_DESTINATIONS } from './authorized.ts';
import type { EditorialDestinationPage } from './editorial-page.ts';

export interface PublishedAsset { path: string; sha256: string; bytes: number; width: number; height: number }
export interface DestinationRelease {
  version: 1;
  entries: {
    slug: string;
    hashes: { payload: string; scope: string; evidence: string; media: string };
    channel: 'web';
    decisions: { scope: boolean; text: boolean; media: boolean; practical: boolean; publication: boolean };
    authorizationDigest: string;
    assets: PublishedAsset[];
  }[];
}
export function canonicalJSON(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(canonicalJSON).join(',') + ']';
  if (value !== null && typeof value === 'object') return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + canonicalJSON((value as Record<string, unknown>)[k])).join(',') + '}';
  return JSON.stringify(value);
}
export const publicationHash = (value: unknown) => createHash('sha256').update(canonicalJSON(value) ?? "undefined").digest('hex');
const keys = (v: object, expected: string[]) => Object.keys(v).sort().join() === expected.sort().join();

// Public CI checks integrity against reviewed pins. It does not authenticate a private human message.
export function validatePublication(release: DestinationRelease, pages: EditorialDestinationPage[]): string[] {
  const errors: string[] = [];
  if (!release || release.version !== 1 || !Array.isArray(release.entries) || !keys(release, ['version', 'entries']) || !Array.isArray(pages)) return ['RELEASE_SHAPE'];
  const seen = new Set<string>();
  if (pages.length !== release.entries.length) errors.push('PROJECTION_COUNT');
  for (const entry of release.entries) {
    if (!entry || !keys(entry, ['slug', 'hashes', 'channel', 'decisions', 'authorizationDigest', 'assets'])) { errors.push('ENTRY_SHAPE'); continue; }
    const pin = AUTHORIZED_DESTINATIONS[entry.slug as keyof typeof AUTHORIZED_DESTINATIONS];
    if (!pin || seen.has(entry.slug)) { errors.push('UNAUTHORIZED_OR_DUPLICATE_SLUG'); continue; }
    seen.add(entry.slug);
    if (entry.channel !== 'web' || entry.authorizationDigest !== AUTHORIZATION_DIGEST || !entry.decisions || !keys(entry.decisions, ['scope', 'text', 'media', 'practical', 'publication']) || Object.values(entry.decisions).some(d => d !== true)) errors.push('HUMAN_PERMISSION_REQUIRED');
    if (!entry.hashes || publicationHash(entry.hashes) !== publicationHash(pin.hashes)) errors.push('AUTHORIZED_VERSION_MISMATCH');
    const matches = pages.filter(p => p.slug === entry.slug), page = matches[0];
    if (matches.length !== 1 || publicationHash(page) !== pin.hashes.payload) { errors.push('PAYLOAD_CHANGED_OR_MISSING'); continue; }
    if (page.seo.proposedCanonical !== 'https://www.argentinauniversosur.com/destinos/' + entry.slug || page.seo.title !== page.title) errors.push('SEO_MISMATCH');
    if (!Array.isArray(entry.assets) || publicationHash(entry.assets) !== pin.assetsHash) errors.push('MEDIA_CHANGED');
    if (/originalPayload|masterRefs|reviewFindings|docs\.google\.com\/(?:spreadsheets|document)\/d\//.test(JSON.stringify(page))) errors.push('PRIVATE_PROJECTION');
  }
  if (pages.some(p => !seen.has(p.slug))) errors.push('UNRELEASED_PROJECTION');
  return [...new Set(errors)];
}
