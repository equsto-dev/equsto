/**
 * index.html gömülü URUNLER[] → boş (canlı katalog dept/ekipmanlar’dan gelir).
 *   node scripts/clear-index-urunler-embed.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const files = [
  path.join(ROOT, "public/index.html"),
  path.join(ROOT, "..", "public/index.html"),
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let html = fs.readFileSync(file, "utf8");
  const re = /const URUNLER=\[[\s\S]*?\];/;
  if (!re.test(html)) {
    console.warn("[clear-urunler] URUNLER bulunamadı:", file);
    continue;
  }
  html = html.replace(re, "const URUNLER=[];");
  fs.writeFileSync(file, html, "utf8");
  console.log("[clear-urunler] gömülü katalog temizlendi:", path.relative(ROOT, file));
}
