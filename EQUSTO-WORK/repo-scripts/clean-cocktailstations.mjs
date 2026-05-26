/**
 * Cocktailstations yapısı — yerel dist/public kalıntılarını siler.
 * Canlı (cPanel): aşağıdaki dosyaları public_html'den de silin.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const REL_PATHS = [
  "public/bar-design-cocktailstations.css",
  "public/eq-bar-design-cocktailstations.js",
  "public/data/cocktailstations-catalogue.json",
  "public/data/cocktailstations-landing.json",
  "public/data/cocktailstations-images",
  "dist/bar-design-cocktailstations.css",
  "dist/eq-bar-design-cocktailstations.js",
  "dist/data/cocktailstations-catalogue.json",
  "dist/data/cocktailstations-landing.json",
  "dist/data/cocktailstations-images",
];

function rmrf(p) {
  if (fs.existsSync(p)) {
    fs.rmSync(p, { recursive: true, force: true });
    console.log("[clean-cs] silindi:", path.relative(root, p));
  }
}

for (const rel of REL_PATHS) rmrf(path.join(root, rel));

const assetsDir = path.join(root, "dist", "assets");
if (fs.existsSync(assetsDir)) {
  for (const name of fs.readdirSync(assetsDir)) {
    if (!name.startsWith("bar-design-") || !name.endsWith(".css")) continue;
    const fp = path.join(assetsDir, name);
    try {
      const text = fs.readFileSync(fp, "utf8");
      if (text.includes("bd-cs-seri") || text.includes("bd-cs-strip")) {
        fs.unlinkSync(fp);
        console.log("[clean-cs] silindi: dist/assets/" + name);
      }
    } catch {
      /* ignore */
    }
  }
}

console.log("[clean-cs] tamam");
