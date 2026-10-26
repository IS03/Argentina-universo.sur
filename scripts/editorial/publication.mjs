// Checks only approved public projections. Private authorization/evidence never enter public CI.
import { readFile, readdir, lstat } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { validatePublication } from '../../lib/destinos/publication-contract.ts';
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
export async function approvedDestinationUrls(root = process.cwd()) {
  return (await readPublication(root)).pages.map(p => p.seo.proposedCanonical);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { release, pages } = await readPublication();
  console.log(JSON.stringify({ publishedCandidates: pages.length, approvedHashes: pages.length * 4, photoVariants: release.entries.reduce((n, e) => n + e.assets.length, 0), privateInputsRead: 0 }));
}
