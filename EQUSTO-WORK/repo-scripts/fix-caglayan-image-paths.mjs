/**
 * Çağlayan görselleri → data/images/caglayan-*.jpg (FTP alt klasör yok).
 *   node scripts/fix-caglayan-image-paths.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = path.join(ROOT, "public", "data", "caglayan-market-reyon-catalogue.json");
const SRC_DIRS = [
  path.join(ROOT, "public", "data", "caglayan-market", "images"),
  path.join(ROOT, "public", "data", "images", "caglayan-market"),
];
const IMG_DIR = path.join(ROOT, "public", "data", "images");

const j = JSON.parse(fs.readFileSync(CATALOG, "utf8"));
let copied = 0;

function flatName(fn) {
  return `caglayan-${fn}`;
}

for (const p of j.products || []) {
  const next = [];
  for (const rel of p.images || []) {
    const fn = String(rel)
      .replace(/^images\/caglayan-market\//i, "")
      .replace(/^caglayan-market\/images\//i, "")
      .replace(/^images\/caglayan-/i, "caglayan-")
      .replace(/^caglayan-/, "");
    if (!fn) continue;
    const flat = flatName(fn);
    const to = path.join(IMG_DIR, flat);
    if (!fs.existsSync(to)) {
      for (const srcDir of SRC_DIRS) {
        const from = path.join(srcDir, fn);
        if (fs.existsSync(from)) {
          fs.copyFileSync(from, to);
          copied++;
          break;
        }
      }
    }
    next.push(`images/${flat}`);
  }
  p.images = next;
}

fs.writeFileSync(CATALOG, JSON.stringify(j, null, 2) + "\n", "utf8");
console.log(`[fix-caglayan] ${copied} kopya → images/caglayan-*`);
