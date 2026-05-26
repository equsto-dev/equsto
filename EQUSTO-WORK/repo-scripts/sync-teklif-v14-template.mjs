/**
 * equsto_teklif_v14.xlsx — public şablonu dist + arşive kopyalar.
 * Düzenleme: public/data/templates/equsto_teklif_v14.xlsx
 *   npm run teklif:sync-v14
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "public", "data", "templates", "equsto_teklif_v14.xlsx");
const targets = [
  path.join(root, "dist", "data", "templates", "equsto_teklif_v14.xlsx"),
  path.join(root, "arşiv", "teklif formatı", "equsto_teklif_v14.xlsx"),
];

if (!fs.existsSync(src)) {
  console.error("[sync-teklif-v14] Kaynak yok:", src);
  process.exit(1);
}

for (const dst of targets) {
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
  console.log("[sync-teklif-v14]", path.relative(root, dst));
}

console.log("[sync-teklif-v14] Tamam — PFOS: /data/templates/equsto_teklif_v14.xlsx");
