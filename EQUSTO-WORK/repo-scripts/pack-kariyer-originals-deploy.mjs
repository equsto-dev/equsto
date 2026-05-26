/**
 * Orijinal kariyer→equsto görselleri SFTP listesi.
 *   node scripts/pack-kariyer-originals-deploy.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const LOG = path.join(ROOT, "public", "data", "kariyer-originals-fetch-log.json");
const LIST = path.join(ROOT, ".tmp-kariyer-originals-files.txt");

const files = new Set([
  "data/ekipmanlar.json",
  "data/dept/pisirme.json",
  "data/dept/sogutma.json",
  "data/dept/kahve.json",
]);

if (fs.existsSync(LOG)) {
  const log = JSON.parse(fs.readFileSync(LOG, "utf8"));
  for (const row of log.files || []) {
    if (row.ok && row.file) files.add(`data/images/${row.file}`);
  }
}

const lines = [...files].sort();
fs.writeFileSync(LIST, lines.join("\n") + "\n", "utf8");
console.log(`[pack-kariyer-originals] ${lines.length} dosya → ${LIST}`);
console.log("Deploy: node scripts/deploy-cpanel-sftp.mjs --file-list .tmp-kariyer-originals-files.txt");
