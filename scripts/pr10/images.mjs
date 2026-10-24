import sharp from "sharp";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join, dirname } from "node:path";
import { root, scratch } from "./prepare.mjs";
export const widths = [480, 960, 1600];
const inputInventory = JSON.parse(
  await readFile(join(root, "docs/supabase/media-inventory.json"), "utf8"),
);
const all = inputInventory.files.filter(
  (f) =>
    f.category === "tourism-images" &&
    ["image/jpeg", "image/png", "image/webp"].includes(f.mime),
);
export const samples = [
  "/img/home/1.jpg",
  "/img/home/2.jpg",
  "/img/provincias/santa-fe/1.jpg",
  "/img/provincias/santa-fe/2.jpg",
  "/img/actividades/santa-fe/1.jpg",
];
export async function optimize({ full = false } = {}) {
  const files = full ? all : all.filter((f) => samples.includes(f.url));
  const sampleHashes = new Set(
    all.filter((f) => samples.includes(f.url)).map((f) => f.sha256),
  );
  const generated = new Map(),
    manifest = {
      version: 1,
      widths,
      webpQuality: 72,
      avifQuality: 48,
      assets: {},
      originalBytes: 0,
      uniqueOriginalBytes: 0,
      variantBytes: 0,
      samples: [],
      rights:
        "Unverified. Existing publication is not evidence of a license. Local prototypes only.",
    };
  const destination = join(scratch, "images");
  await mkdir(destination, { recursive: true });
  for (const file of files) {
    manifest.originalBytes += file.bytes;
    if (!generated.has(file.sha256)) {
      manifest.uniqueOriginalBytes += file.bytes;
      const variants = [];
      const source = join(root, file.originalPath);
      const formats = sampleHashes.has(file.sha256)
        ? ["webp", "avif"]
        : ["webp"];
      for (const width of widths)
        for (const format of formats) {
          const url = `/optimized/${file.sha256.slice(0, 16)}-${width}.${format}`;
          const output = join(destination, url);
          await mkdir(dirname(output), { recursive: true });
          const operation = sharp(source)
            .rotate()
            .resize({ width, withoutEnlargement: true })
            .toColourspace("srgb")
            .withMetadata();
          const { data, info } = await (
            format === "webp"
              ? operation.webp({ quality: 72 })
              : operation.avif({ quality: 48, effort: 4 })
          ).toBuffer({ resolveWithObject: true });
          await writeFile(output, data);
          manifest.variantBytes += data.length;
          const variant = {
            url,
            width: info.width,
            height: info.height,
            requestedWidth: width,
            bytes: data.length,
            format,
            sha256: createHash("sha256").update(data).digest("hex"),
          };
          if (sampleHashes.has(file.sha256)) {
            const reference = await sharp(source)
              .rotate()
              .resize({ width, withoutEnlargement: true })
              .toColourspace("srgb")
              .removeAlpha()
              .raw()
              .toBuffer();
            const compressed = await sharp(data)
              .toColourspace("srgb")
              .removeAlpha()
              .raw()
              .toBuffer();
            if (reference.length !== compressed.length)
              throw Error("Quality comparison dimensions differ");
            let squared = 0;
            for (let i = 0; i < reference.length; i++)
              squared += (reference[i] - compressed[i]) ** 2;
            variant.psnrDb =
              squared === 0
                ? null
                : 10 * Math.log10(255 ** 2 / (squared / reference.length));
          }
          variants.push(variant);
        }
      generated.set(file.sha256, variants);
    }
    manifest.assets[file.url] = {
      originalBytes: file.bytes,
      sha256: file.sha256,
      dimensions: file.dimensions,
      references: file.references,
      variants: generated.get(file.sha256),
      rights: "unverified",
      attribution:
        "Preserve source attribution; none established by this inventory.",
    };
    if (samples.includes(file.url)) manifest.samples.push(file.url);
  }
  manifest.assetCount = Object.keys(manifest.assets).length;
  manifest.uniqueImages = generated.size;
  await writeFile(
    join(destination, "manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n",
  );
  return manifest;
}
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const manifest = await optimize({ full: process.argv.includes("--all") });
  console.log(
    JSON.stringify(
      {
        assetCount: manifest.assetCount,
        uniqueImages: manifest.uniqueImages,
        originalBytes: manifest.originalBytes,
        uniqueOriginalBytes: manifest.uniqueOriginalBytes,
        allVariantBytes: manifest.variantBytes,
        samples: manifest.samples,
      },
      null,
      2,
    ),
  );
}
