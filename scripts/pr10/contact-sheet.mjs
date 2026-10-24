import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { root, scratch } from "./prepare.mjs";
const manifest = JSON.parse(
  await readFile(join(scratch, "images/manifest.json"), "utf8"),
);
const composites = [];
const width = 1080,
  rowHeight = 265;
for (const [row, url] of manifest.samples.entries()) {
  const asset = manifest.assets[url];
  const versions = [
    { path: join(root, "public", url), label: "Original redimensionado" },
    ...["webp", "avif"].map((format) => {
      const v = asset.variants.find(
        (v) => v.requestedWidth === 960 && v.format === format,
      );
      if (!v) throw Error("Missing sample " + url);
      return {
        path: join(scratch, "images", v.url),
        label: `${format.toUpperCase()} ${Math.round(v.bytes / 1024)} KiB, PSNR ${v.psnrDb.toFixed(1)} dB`,
      };
    }),
  ];
  for (const [col, v] of versions.entries()) {
    composites.push({
      input: await sharp(v.path)
        .rotate()
        .resize(350, 225, { fit: "inside" })
        .flatten({ background: "#fff" })
        .extend({ top: 0, bottom: 0, left: 0, right: 0 })
        .toBuffer(),
      left: col * 360,
      top: row * rowHeight + 30,
    });
    composites.push({
      input: Buffer.from(
        `<svg width="360" height="28"><rect width="360" height="28" fill="white"/><text x="5" y="20" font-family="sans-serif" font-size="13">${row + 1}. ${v.label}</text></svg>`,
      ),
      left: col * 360,
      top: row * rowHeight,
    });
  }
}
await sharp({
  create: {
    width,
    height: manifest.samples.length * rowHeight,
    channels: 3,
    background: "#fff",
  },
})
  .composite(composites)
  .png()
  .toFile(join(scratch, "reports/image-contact-sheet.png"));
const samples = manifest.samples.map((url) => ({
  url,
  originalBytes: manifest.assets[url].originalBytes,
  variants: manifest.assets[url].variants,
}));
await writeFile(
  join(scratch, "reports/image-samples.json"),
  JSON.stringify(samples, null, 2) + "\n",
);
console.log(join(scratch, "reports/image-contact-sheet.png"));
