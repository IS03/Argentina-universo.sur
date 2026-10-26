import test from 'node:test';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { validatePublication, publicationHash } from '../lib/destinos/publication-contract.ts';
import { AUTHORIZATION_DIGEST, AUTHORIZED_DESTINATIONS } from '../lib/destinos/authorized.ts';
import { readPublication, approvedDestinationUrls } from '../scripts/editorial/publication.mjs';
import { validateHumanReceipt } from '../scripts/editorial/authorize-publication.mjs';
import { auditPublicArtifact } from '../scripts/pages/editorial-security.mjs';
const { release, pages } = await readPublication();
const fixture = () => ({ manifest: structuredClone(release), data: structuredClone(pages) });
const receiptFixture = () => ({ packetId: 'AUS-R2-SFE-AG-2648c2973491', decisionDate: '2026-10-26', provenance: { type: 'direct-user-instruction', sourceSha256: AUTHORIZATION_DIGEST, digitalSignature: null }, channels: ['github-public-pr','cloudflare-preview','web-after-reviewed-merge'], decisions: Object.fromEntries(Object.entries(AUTHORIZED_DESTINATIONS).map(([slug, pin]) => [slug, { hashes: pin.hashes, scope: 'approved', text: 'approved', media: 'approved', practical: 'approved', publication: 'authorized' }])) });

test('two exact approved projections and eight unchanged photographic derivatives are the entire public release', async () => {
  assert.deepEqual(validatePublication(release, pages), []);
  assert.deepEqual(pages.map(p => p.slug).sort(), ['alta-gracia', 'santa-fe-capital']);
  assert.equal(release.entries.reduce((n, e) => n + e.assets.length, 0), 8);
  for (const e of release.entries) for (const a of e.assets) {
    const metadata = await sharp(await readFile('public' + a.path)).metadata();
    assert.equal(metadata.width, a.width); assert.equal(metadata.height, a.height);
  }
  assert.equal((await approvedDestinationUrls()).length, 2);
});
test('each of the five independent permissions is required, including the separate web permission', () => {
  for (const key of ['scope','text','media','practical','publication']) {
    const { manifest, data } = fixture(); manifest.entries[0].decisions[key] = false;
    assert.ok(validatePublication(manifest, data).includes('HUMAN_PERMISSION_REQUIRED'));
    const missing = fixture(); delete missing.manifest.entries[0].decisions[key];
    assert.ok(validatePublication(missing.manifest, missing.data).includes('HUMAN_PERMISSION_REQUIRED'));
  }
});
test('another channel, declaration digest or exact authorized hash cannot grant publication', () => {
  for (const edit of [e => e.channel = 'social', e => e.authorizationDigest = '0'.repeat(64), e => e.hashes.media = '0'.repeat(64)]) {
    const { manifest, data } = fixture(); edit(manifest.entries[0]); assert.ok(validatePublication(manifest, data).length);
  }
});
test('text, SEO, credit, map, source and unknown data changes cannot be self-approved by resealing a payload', () => {
  for (const edit of [p => p.title += '!', p => p.practical[0].valor += '!', p => p.locations[0].mapaUrl += '&changed=1', p => p.photos[0].foto.credito.titular = 'Another author', p => p.seo.description += '!', p => p.sources[0].url = 'https://example.org/', p => p.privateNote = 'PRIVATE-SYNTHETIC']) {
    const { manifest, data } = fixture(); edit(data[0]); manifest.entries.find(e => e.slug === data[0].slug).hashes.payload = publicationHash(data[0]);
    assert.ok(validatePublication(manifest, data).includes('PAYLOAD_CHANGED_OR_MISSING'));
  }
});
test('Rosario, duplicates and projections absent from the release are rejected; one approved page can be selected without a filler', () => {
  const { manifest, data } = fixture(); const withheld = structuredClone(data[0]); withheld.slug = 'rosario'; data.push(withheld); manifest.entries.push({ ...manifest.entries[0], slug: 'rosario' });
  assert.ok(validatePublication(manifest, data).includes('UNAUTHORIZED_OR_DUPLICATE_SLUG'));
  const duplicate = fixture(); duplicate.manifest.entries.push(duplicate.manifest.entries[0]); assert.ok(validatePublication(duplicate.manifest, duplicate.data).length);
  assert.deepEqual(validatePublication({ version: 1, entries: [release.entries[0]] }, [pages.find(p => p.slug === release.entries[0].slug)]), []);
  assert.ok(validatePublication({ version: 1, entries: [] }, pages).includes('PROJECTION_COUNT'));
});
test('altering a photograph checksum in the manifest cannot authorize new bytes', () => {
  const { manifest, data } = fixture(); manifest.entries[0].assets[0].sha256 = '0'.repeat(64); assert.ok(validatePublication(manifest, data).includes('MEDIA_CHANGED'));
});
test('private receipt validation rejects missing decisions, fabricated signatures, wrong channels and stale versions', () => {
  assert.deepEqual(validateHumanReceipt(receiptFixture()), []);
  for (const change of [r => delete r.decisions['alta-gracia'].text, r => r.decisions['alta-gracia'].publication = 'pending', r => r.provenance.digitalSignature = 'fabricated', r => r.channels = ['other'], r => r.decisions['alta-gracia'].hashes = { payload: 'wrong' }]) {
    const r = receiptFixture(); change(r); assert.ok(validateHumanReceipt(r).length);
  }
});
test('private fields and master links are absent from all public destination projections', () => {
  assert.doesNotMatch(JSON.stringify(pages), /originalPayload|referenciasMaestro|basis|masterRefs|reviewFindings|docs\.google\.com|EV-\d{4}|[DA]-[A-Z]+-\d{3}/);
});
test('public artifact audit blocks any unapproved destination path and unknown media in the reserved namespace', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'aus-published-audit-'));
  try {
    await writeFile(join(dir, 'index.html'), '<a href="/destinos/rosario">No autorizado</a>'); assert.ok((await auditPublicArtifact(dir, [])).errors.length);
    await writeFile(join(dir, 'index.html'), '<a href="/destinos/alta-gracia">Autorizado</a>'); assert.equal((await auditPublicArtifact(dir, [])).errors.length, 0);
    await writeFile(join(dir, 'page.meta'), JSON.stringify({ tags: '_N_T_/destinos/layout,_N_T_/destinos/[slug]/page' }));
    assert.equal((await auditPublicArtifact(dir, [])).errors.length, 0);
    await mkdir(join(dir, 'media/review'), { recursive: true }); await writeFile(join(dir, 'media/review/renamed.webp'), 'unapproved bytes');
    assert.ok((await auditPublicArtifact(dir, [])).errors.some(e => e.rule === 'unapproved-destination-media'));
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('authorization CLI never logs malformed private input or parser excerpts', async () => {
  await mkdir('.artifacts/pr19', { recursive: true });
  const dir = await mkdtemp('.artifacts/pr19/auth-test-');
  try {
    const input = join(dir, 'malformed.json');
    await writeFile(input, 'SYNTHETIC_PRIVATE_AUTHORITY_CANARY', { mode: 0o600 });
    const result = spawnSync(process.execPath, ['--experimental-strip-types', 'scripts/editorial/authorize-publication.mjs', input, input, input, input], { encoding: 'utf8' });
    assert.equal(result.status, 1); assert.equal(result.stdout, '');
    assert.match(result.stderr, /PRIVATE_AUTHORIZATION_BLOCKED/);
    assert.doesNotMatch(result.stderr, /SYNTHETIC_PRIVATE_AUTHORITY_CANARY|SyntaxError|malformed.json/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
