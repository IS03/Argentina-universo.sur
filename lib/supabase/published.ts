import 'server-only';
import { createOptionalSupabaseClient } from './server.ts';
import type { SupabaseEnvironment } from './config.ts';
import { publishedCandidate, type PublishedCandidate } from './published-contract.ts';

// Future BUILD-only reader. No current route imports it; static sources and PR19 contracts stay authoritative.
// null means unconfigured; [] means configured but no approved content. Never falls back to privileged keys.
export async function readPublishedBuildCandidates(env: SupabaseEnvironment = process.env): Promise<PublishedCandidate[] | null> {
  const client = createOptionalSupabaseClient(env);
  if (!client) return null;
  const result: PublishedCandidate[] = [];
  let lastId: string | undefined;
  for (let page = 0; page < 100; page++) {
    let query = client.from('entries').select('*').eq('publication_permitted', true)
      .eq('document_status', 'verified').eq('approval_status', 'approved').order('id').limit(200);
    if (lastId) query = query.gt('id', lastId);
    const { data, error } = await query;
    if (error || !data) throw Error('PUBLISHED_BUILD_READ_FAILED');
    result.push(...data.map(publishedCandidate));
    if (data.length < 200) return result;
    lastId = data.at(-1)!.id;
  }
  throw Error('PUBLISHED_BUILD_READ_LIMIT');
}
