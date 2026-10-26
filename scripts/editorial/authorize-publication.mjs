// Private provenance check; no digital signature or identity authentication is claimed.
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { readPrivateJson, privatePath } from './private-io.mjs';
import { validateReviewBatch, pageHashes } from './review-batch.mjs';
import { AUTHORIZATION_DIGEST, AUTHORIZED_DESTINATIONS } from '../../lib/destinos/authorized.ts';
import { publicationHash } from '../../lib/destinos/publication-contract.ts';
export function validateHumanReceipt(receipt) {
  const errors = [];
  if (!receipt || receipt.packetId !== 'AUS-R2-SFE-AG-2648c2973491' || receipt.decisionDate !== '2026-10-26' || receipt.provenance?.type !== 'direct-user-instruction' || receipt.provenance.sourceSha256 !== AUTHORIZATION_DIGEST || receipt.provenance.digitalSignature !== null) return ['HUMAN_PROVENANCE_REQUIRED'];
  if (publicationHash(receipt.channels) !== publicationHash(['github-public-pr','cloudflare-preview','web-after-reviewed-merge'])) errors.push('CHANNEL_PERMISSION_REQUIRED');
  if (Object.keys(receipt.decisions ?? {}).sort().join() !== Object.keys(AUTHORIZED_DESTINATIONS).sort().join()) errors.push('AUTHORIZED_SELECTION_REQUIRED');
  for (const [slug, pin] of Object.entries(AUTHORIZED_DESTINATIONS)) {
    const d = receipt.decisions?.[slug];
    if (!d || ['scope','text','media','practical'].some(k => d[k] !== 'approved') || d.publication !== 'authorized') errors.push('FIVE_INDEPENDENT_DECISIONS_REQUIRED');
    if (publicationHash(d?.hashes) !== publicationHash(pin.hashes)) errors.push('AUTHORIZED_HASHES_REQUIRED');
  }
  return [...new Set(errors)];
}
export async function verifyPrivateAuthorization(batchFile, receiptFile, masterFile, declarationFile) {
  const [batch, receipt, master] = await Promise.all([readPrivateJson(batchFile), readPrivateJson(receiptFile), readPrivateJson(masterFile)]);
  const errors = [...validateHumanReceipt(receipt), ...validateReviewBatch(batch, master)];
  const declaration = await readFile(await privatePath(declarationFile));
  if (createHash('sha256').update(declaration).digest('hex') !== AUTHORIZATION_DIGEST) errors.push('DECLARATION_CHANGED');
  for (const [slug, pin] of Object.entries(AUTHORIZED_DESTINATIONS)) {
    const page = batch.pages.find(p => p.payload.slug === slug);
    if (!page || publicationHash(pageHashes(page)) !== publicationHash(pin.hashes)) errors.push('PRIVATE_VERSION_CHANGED');
  }
  if (errors.length) throw Error('PRIVATE_AUTHORIZATION_BLOCKED: ' + [...new Set(errors)].join(','));
  return { decisions: 10, hashes: 8, candidates: 2, digitalSignatureClaimed: false };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.length !== 4) throw Error('FOUR_PRIVATE_INPUTS_REQUIRED');
  console.log(JSON.stringify(await verifyPrivateAuthorization(...args)));
}
