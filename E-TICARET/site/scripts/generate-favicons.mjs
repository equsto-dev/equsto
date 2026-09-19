/**
 * Üç çizgi favicon — SVG → PNG + ICO (Google Search 48px+).
 *   node scripts/generate-favicons.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SVG = path.join(ROOT, "public/icons/eq/favicon.svg");

function pngToIco(entries) {
  const count = entries.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);

  let offset = 6 + 16 * count;
  const dir = [];
  const bodies = [];
  for (const { width, height, png } of entries) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(width >= 256 ? 0 : width, 0);
    entry.writeUInt8(height >= 256 ? 0 : height, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    dir.push(entry);
    bodies.push(png);
    offset += png.length;
  }
  return Buffer.concat([header, ...dir, ...bodies]);
}

const svg = fs.readFileSync(SVG);
const sizes = [16, 32, 48, 96, 180, 192, 512];
const pngs = {};

for (const size of sizes) {
  pngs[size] = await sharp(svg).resize(size, size).png().toBuffer();
}

const eqDir = path.join(ROOT, "public/icons/eq");
fs.mkdirSync(eqDir, { recursive: true });
fs.writeFileSync(path.join(eqDir, "favicon-48.png"), pngs[48]);
fs.writeFileSync(path.join(eqDir, "favicon-96.png"), pngs[96]);
fs.writeFileSync(path.join(eqDir, "favicon-192.png"), pngs[192]);
fs.writeFileSync(path.join(ROOT, "public/icons/icon-512.png"), pngs[512]);
fs.writeFileSync(path.join(ROOT, "public/apple-touch-icon.png"), pngs[180]);

const ico = pngToIco([
  { width: 16, height: 16, png: pngs[16] },
  { width: 32, height: 32, png: pngs[32] },
  { width: 48, height: 48, png: pngs[48] },
]);
fs.writeFileSync(path.join(ROOT, "public/favicon.ico"), ico);
fs.writeFileSync(path.join(ROOT, "app/favicon.ico"), ico);

console.log("favicons written", {
  ico: ico.length,
  48: pngs[48].length,
  96: pngs[96].length,
  192: pngs[192].length,
  512: pngs[512].length,
});
