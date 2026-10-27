import type { Database } from './database.types.ts';
type Entry = Database['public']['Tables']['entries']['Row'];
export type PublishedCandidate = Pick<Entry, 'id' | 'kind' | 'slug' | 'name' | 'body' | 'canonical_path' | 'latitude' | 'longitude' | 'content_version'>;
// A second gate after RLS. Candidates still need the PR19 route/hash/asset publication contract.
export function publishedCandidate(row: Entry): PublishedCandidate {
  if (!row.publication_permitted || row.document_status !== 'verified' || row.approval_status !== 'approved' ||
      row.approved_version !== row.content_version || !row.approved_at || !row.verified_at ||
      !row.canonical_path || !/^\/[a-z0-9/_-]*$/.test(row.canonical_path)) throw Error('UNAPPROVED_BUILD_CANDIDATE');
  const { id, kind, slug, name, body, canonical_path, latitude, longitude, content_version } = row;
  return { id, kind, slug, name, body, canonical_path, latitude, longitude, content_version };
}
