/**
 * Canlıda eksik katalog görsellerini özetler.
 *   node scripts/check-catalog-images-deploy.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = path.join(ROOT, "public");
const IMG = path.join(PUBLIC, "images", "catalog");

function dirSize(rel) {
  const base = path.join(IMG, rel);
  if (!fs.existsSync(base)) return { count: 0, mb: 0 };
  let count = 0;
  let sum = 0;
  const walk = (d) => {
    for (const name of fs.readdirSync(d)) {
      const p = path.join(d, name);
      const st = fs.statSync(p);
      if (st.isDirectory()) walk(p);
      else {
        count++;
        sum += st.size;
      }
    }
  };
  walk(base);
  return { count, mb: Math.round((sum / 1024 / 1024) * 10) / 10 };
}

const atalay = dirSize("atalay");
const ozti = dirSize("ozti");

console.log("Katalog görselleri (yerel disk):");
console.log("  atalay/", atalay.count, "dosya,", atalay.mb, "MB → git + deploy gerekli (CDN yok)");
console.log("  ozti/", ozti.count, "dosya,", ozti.mb, "MB → canlıda ax-images CDN (eq-site-urls)");
console.log("\nÖztiryakiler örnek CDN:");
console.log(
  "  https://oztiryakiler.com.tr/ax-images/images/7865.N1.80908.10.jpg"
);
