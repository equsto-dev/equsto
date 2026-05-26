/**
 * equsto_teklif_v13.xlsx — public şablonu dist + arşive kopyalar (PFOS Excel çıktısı).
 * Düzenleme: public/data/templates/equsto_teklif_v13.xlsx
 *   npm run teklif:sync-v13
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "public", "data", "templates", "equsto_teklif_v13.xlsx");
const targets = [
  path.join(root, "dist", "data", "templates", "equsto_teklif_v13.xlsx"),
  path.join(root, "arşiv", "teklif formatı", "equsto_teklif_v13.xlsx"),
];

if (!fs.existsSync(src)) {
  console.error("[sync-teklif-v13] Kaynak yok:", src);
  process.exit(1);
}

for (const dst of targets) {
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
  console.log("[sync-teklif-v13]", path.relative(root, dst));
}

console.log("[sync-teklif-v13] Tamam — PFOS: /data/templates/equsto_teklif_v13.xlsx");
