import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
const index = JSON.parse(await readFile("lib/pages/media-index.json", "utf8"));
const paths = [
  "/img/home/1.jpg",
  "/img/home/2.jpg",
  "/img/provincias/santa-fe/1.jpg",
  "/img/provincias/santa-fe/2.jpg",
  "/img/actividades/santa-fe/1.jpg",
];
const composites = [],
  rows = [];
for (const [row, path] of paths.entries()) {
  const original = "public" + path,
    asset = join(
      ".artifacts/pages/production-audit/media",
      index[path].hash + "-" + Math.min(960, index[path].width) + ".webp",
    );
  const ref = await sharp(original)
    .rotate()
    .resize({
      width: Math.min(960, index[path].width),
      withoutEnlargement: true,
    })
    .toColourspace("srgb")
    .removeAlpha()
    .raw()
    .toBuffer();
  const decoded = await sharp(asset)
    .toColourspace("srgb")
    .removeAlpha()
    .raw()
    .toBuffer();
  if (ref.length !== decoded.length)
    throw Error("Comparison dimensions differ");
  let sse = 0;
  for (let i = 0; i < ref.length; i++) sse += (ref[i] - decoded[i]) ** 2;
  const bytes = (await readFile(asset)).length;
  rows.push({
    original: path,
    originalBytes: (await readFile(original)).length,
    webpBytes: bytes,
    width: Math.min(960, index[path].width),
    psnrDb: sse === 0 ? null : 10 * Math.log10(255 ** 2 / (sse / ref.length)),
    rights:
      "Unverified; existing publication and metadata are not proof of a license.",
  });
  for (const [col, input] of [original, asset].entries()) {
    const label = Buffer.from(
      `<svg width="400" height="28"><rect width="400" height="28" fill="white"/><text x="8" y="20" font-size="16" fill="black">${col ? "WebP 960 — " + Math.round(bytes / 1024) + " KiB" : "Original redimensionado"} · muestra ${row + 1}</text></svg>`,
    );
    composites.push({ input: label, left: col * 400, top: row * 260 });
    composites.push({
      input: await sharp(input)
        .rotate()
        .resize({ width: 400, height: 225, fit: "inside" })
        .toBuffer(),
      left: col * 400,
      top: row * 260 + 28,
    });
  }
}
await sharp({
  create: { width: 800, height: 1300, channels: 3, background: "white" },
})
  .composite(composites)
  .png()
  .toFile(".artifacts/pages/reports/contact-sheet.png");
await writeFile(
  ".artifacts/pages/reports/visual-quality.json",
  JSON.stringify(rows, null, 2) + "\n",
);
console.log(rows);
