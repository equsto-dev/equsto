/**
 * Görselsiz Öztiryakiler satırlarına web sentetik yol yazar (CDN yedek).
 *   node scripts/patch-ozti-missing-web-images.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  isOztiBrand,
  normKod,
  oztiVitrinImageHref,
} from "./lib/ozti-enrich.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPT_DIR = path.join(ROOT, "public/data/dept");
const MANIFEST = path.join(ROOT, "public/images/catalog/ozti/_manifest.json");

function loadManifest() {
  if (!fs.existsSync(MANIFEST)) return new Map();
  const raw = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
  return new Map(Object.entries(raw).map(([k, v]) => [normKod(k), v]));
}

function main() {
  const manifest = loadManifest();
  let patched = 0;
  let already = 0;

  for (const file of fs.readdirSync(DEPT_DIR).filter((f) => f.endsWith(".json"))) {
    const fp = path.join(DEPT_DIR, file);
    const rows = JSON.parse(fs.readFileSync(fp, "utf8"));
    let changed = 0;

    for (const row of rows) {
      if (!isOztiBrand(row)) continue;
      const kod = normKod(row.urun_kodu || row.sku || row.model);
      const cur = String((row.images || [])[0] || "").trim();
      if (cur) {
        already++;
        continue;
      }
      const href = oztiVitrinImageHref(kod, manifest.get(kod));
      if (!href) continue;
      row.images = [href];
      changed++;
      patched++;
    }

    if (changed) {
      fs.writeFileSync(fp, JSON.stringify(rows), "utf8");
      console.log(`  ${file}: +${changed} görsel yolu`);
    }
  }

  console.log("[patch-ozti-web] yeni:", patched, "| zaten dolu:", already);
}

main();
