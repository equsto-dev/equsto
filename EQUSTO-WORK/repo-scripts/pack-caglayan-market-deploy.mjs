/**
 * Market reyonları — Çağlayan katalog + görseller SFTP listesi.
 *   node scripts/pack-caglayan-market-deploy.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const IMG_DIR = path.join(ROOT, "public", "data", "images");
const LIST = path.join(ROOT, ".tmp-caglayan-market-files.txt");

const files = ["data/caglayan-market-reyon-catalogue.json", "market-reyonlari.html", "eq-market-reyon.js", "eq-dept-plp.js"];

if (fs.existsSync(IMG_DIR)) {
  for (const fn of fs.readdirSync(IMG_DIR)) {
    if (/^caglayan-/.test(fn) && /\.(jpe?g|png|webp|gif)$/i.test(fn)) {
      files.push(`data/images/${fn}`);
    }
  }
}

fs.writeFileSync(LIST, files.join("\n") + "\n", "utf8");
console.log(`[pack-caglayan] ${files.length} dosya → ${LIST}`);
