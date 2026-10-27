import { INSTITUTIONAL_PROJECT_REF } from '../../lib/supabase/identity.ts';
import { validateWebPayload } from '../../lib/supabase/web-contract.ts';
import { validateRemotePage } from '../../lib/destinos/remote-page.ts';
// Checks only approved public projections. Private authorization/evidence never enter public CI.
import { readFile, readdir, lstat } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { validatePublication, publicationHash } from '../../lib/destinos/publication-contract.ts';
export async function readPublication(root = process.cwd()) {
  const dir = join(root, 'content/destinos');
  const release = JSON.parse(await readFile(join(dir, 'release.json'), 'utf8'));
  const names = (await readdir(dir)).filter(n => n.endsWith('.json') && n !== 'release.json');
  const pages = await Promise.all(names.sort().map(n => readFile(join(dir, n), 'utf8').then(JSON.parse)));
  const errors = validatePublication(release, pages);
  if (errors.length) throw Error('PUBLICATION_BLOCKED: ' + errors.join(','));
  const expectedAssets = new Set(release.entries.flatMap(e => e.assets.map(a => a.path)));
  const actualAssets = await readdir(join(root, "public/media/review"));
  if (actualAssets.length !== expectedAssets.size || actualAssets.some(n => !expectedAssets.has("/media/review/" + n))) throw Error("PUBLICATION_UNLISTED_MEDIA");
  for (const entry of release.entries) for (const asset of entry.assets) {
    if (!/^\/media\/review\/review-[a-f0-9]{16}-(320|640|960|1280)\.webp$/.test(asset.path)) throw Error('PUBLICATION_ASSET_PATH');
    const path = join(root, 'public', asset.path);
    const info = await lstat(path);
    if (!info.isFile() || info.isSymbolicLink()) throw Error('PUBLICATION_ASSET_FILE');
    const bytes = await readFile(path);
    if (bytes.length !== asset.bytes || createHash('sha256').update(bytes).digest('hex') !== asset.sha256) throw Error('PUBLICATION_ASSET_CHANGED');
  }
  return { release, pages };
}
// The historical pins remain unchanged. Extra routes come only from the validated build artifact.
export async function readBuildPublication(root = process.cwd()) {
  const base = await readPublication(root);
  const path = join(root, 'content/supabase/build-cache.json');
  const info = await lstat(path).catch(e => { if(e.code === 'ENOENT') return null; throw e; });
  const historicalAssets = base.release.entries.flatMap(e => e.assets);
  if (!info) return {...base, assets: historicalAssets};
  if (!info.isFile() || info.isSymbolicLink()) throw Error('PUBLIC_BUILD_CACHE_FILE');
  const cache = JSON.parse(await readFile(path, 'utf8'));
  if (cache.schemaVersion !== 1 || cache.projectRef !== INSTITUTIONAL_PROJECT_REF || publicationHash(cache.payload) !== cache.payloadHash) throw Error('PUBLIC_BUILD_CACHE_IDENTITY');
  validateWebPayload(cache.payload);
  if (!Array.isArray(cache.extraDestinations)) throw Error('PUBLIC_BUILD_CACHE_PAGES');
  const extra = cache.extraDestinations.map(validateRemotePage);
  const pages = [...cache.payload.destinations,...extra];
  if (new Set(pages.map(p=>p.slug)).size !== pages.length) throw Error('PUBLIC_DESTINATION_COLLISION');
  const needed = new Set(extra.flatMap(p=>p.photos.flatMap(photo=>[photo.foto.src,...photo.foto.variantes.map(v=>v.src)])));
  const assets = cache.extraAssets ?? [];
  if (!Array.isArray(assets) || new Set(assets.map(a=>a.path)).size !== needed.size || assets.some(a=>!needed.has(a.path))) throw Error('PUBLIC_BUILD_ASSET_SET');
  for (const asset of assets) {
    if (!/^\/media\/[a-zA-Z0-9/_.-]+$/.test(asset.path) || asset.path.includes('..')) throw Error('PUBLIC_BUILD_ASSET_PATH');
    const file = join(root,'public',asset.path), stat = await lstat(file);
    if (!stat.isFile() || stat.isSymbolicLink()) throw Error('PUBLIC_BUILD_ASSET_FILE');
    const bytes = await readFile(file);
    if (bytes.length !== asset.bytes || createHash('sha256').update(bytes).digest('hex') !== asset.sha256) throw Error('PUBLIC_BUILD_ASSET_CHANGED');
  }
  return {...base, pages, assets: [...historicalAssets,...assets]};
}
export async function approvedDestinationUrls(root = process.cwd()) {
  return (await readBuildPublication(root)).pages.map(p => p.seo.proposedCanonical);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { release, pages } = await readPublication();
  console.log(JSON.stringify({ publishedCandidates: pages.length, approvedHashes: pages.length * 4, photoVariants: release.entries.reduce((n, e) => n + e.assets.length, 0), privateInputsRead: 0 }));
}
