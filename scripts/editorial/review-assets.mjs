// Local, reproducible derivatives. No downloader and no rights/publication approval writer.
import { readFile, mkdir, chmod, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { privatePath, readPrivateJson, writePrivateJson } from './private-io.mjs';
import { imageWidths } from '../../lib/pages/image-policy.ts';

export const REVIEW_LICENSES = new Set(['https://creativecommons.org/licenses/by-sa/4.0', 'https://creativecommons.org/licenses/by-sa/2.5/ar/deed.en']);
const plain = value => String(value ?? '').replace(/<[^>]+>/g, '').replaceAll('&amp;', '&').trim();
export async function prepareReviewPhoto({ originalPath, metadataPath, outputDirectory, crop = null }) {
  const metadata = await readPrivateJson(metadataPath);
  const page = Object.values(metadata.query?.pages ?? {})[0], info = page?.imageinfo?.[0], ext = info?.extmetadata;
  const licenseUrl = plain(ext?.LicenseUrl?.value), author = plain(ext?.Artist?.value);
  if (!info || !REVIEW_LICENSES.has(licenseUrl) || !author || plain(ext?.Credit?.value) !== 'Own work' || plain(ext?.Restrictions?.value)) throw Error('PHOTO_LICENSE_EVIDENCE_REQUIRED');
  const source = await privatePath(originalPath), bytes = await readFile(source);
  if (createHash('sha1').update(bytes).digest('hex') !== info.sha1 || bytes.length !== info.size) throw Error('PHOTO_ORIGINAL_MISMATCH');
  const actual = await sharp(bytes).metadata();
  if (actual.width !== info.width || actual.height !== info.height || actual.orientation && actual.orientation !== 1) throw Error('PHOTO_DIMENSIONS_OR_ORIENTATION');
  if (crop && (!['left', 'top', 'width', 'height'].every(k => Number.isInteger(crop[k])) || crop.left < 0 || crop.top < 0 || crop.width < 1 || crop.height < 1 || crop.left + crop.width > actual.width || crop.top + crop.height > actual.height)) throw Error('PHOTO_CROP_INVALID');
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  const width = crop?.width ?? actual.width;
  await privatePath(join(outputDirectory, 'photo-manifest.json'), { createParents: true });
  await mkdir(outputDirectory, { recursive: true, mode: 0o700 });
  const derivatives = [];
  for (const target of imageWidths('/img/editorial/photo.jpg', width)) {
    const name = `review-${sha256.slice(0, 16)}-${target}.webp`;
    let operation = sharp(bytes);
    if (crop) operation = operation.extract(crop);
    const result = await operation.resize({ width: target, withoutEnlargement: true }).webp({ quality: 80, effort: 5 }).toBuffer({ resolveWithObject: true });
    const path = await privatePath(join(outputDirectory, name), { createParents: true });
    await writeFile(path, result.data, { mode: 0o600 }); await chmod(path, 0o600);
    derivatives.push({ name, src: '/media/review/' + name, width: result.info.width, height: result.info.height, bytes: result.data.length, sha256: createHash('sha256').update(result.data).digest('hex') });
  }
  const record = {
    technicalPermission: 'license-verified', editorialApproval: null, commercialUseAllowed: true,
    originalTitle: page.title.replace(/^File:/, ''), sourcePage: 'https://commons.wikimedia.org/wiki/' + encodeURIComponent(page.title.replaceAll(' ', '_')),
    originalUrl: info.url, author, licenseName: plain(ext.LicenseShortName.value), licenseUrl,
    metadataSha256: createHash('sha256').update(await readFile(resolve(metadataPath))).digest('hex'),
    originalSha256: sha256, originalBytes: bytes.length, nativeWidth: actual.width, nativeHeight: actual.height,
    dateAsStated: plain(ext.DateTimeOriginal?.value), crop, transformations: crop ? 'Recorte, reducción y compresión WebP; sin generación ni retoque de escenas.' : 'Reducción y compresión WebP; sin recorte ni retoque de escenas.',
    derivatives,
  };
  await writePrivateJson(join(outputDirectory, `photo-${sha256.slice(0, 16)}.json`), record);
  return record;
}
