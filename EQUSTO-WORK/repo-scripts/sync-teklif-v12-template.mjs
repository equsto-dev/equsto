/**
 * equsto_teklif_v12.xlsx şablonunu arşivden public + dist'e kopyalar.
 *   node scripts/sync-teklif-v12-template.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const archiveDir = path.join(root, "arşiv", "teklif formatı");
const primary = path.join(archiveDir, "equsto_teklif_v12.xlsx");
const fallback = path.join(archiveDir, "equsto_teklif_v12_yeni.xlsx");
const src = fs.existsSync(primary) ? primary : fallback;
const targets = [
  path.join(root, "public", "data", "templates", "equsto_teklif_v12.xlsx"),
  path.join(root, "dist", "data", "templates", "equsto_teklif_v12.xlsx"),
];

if (!fs.existsSync(src)) {
  console.error("[sync-teklif-v12] Kaynak yok:", primary, "veya", fallback);
  process.exit(1);
}

for (const dst of targets) {
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
  console.log("[sync-teklif-v12]", path.relative(root, dst));
}

console.log("[sync-teklif-v12] Tamam.");
