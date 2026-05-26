/**
 * Kırpılmış görselleri SFTP paketine yazar (yanında .kariyer-bak olan dosyalar).
 *   node scripts/pack-kariyer-crop-deploy.mjs
 *   node scripts/deploy-cpanel-sftp.mjs --file-list .tmp-kariyer-crop-files.txt
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const IMG = path.join(ROOT, "public", "data", "images");
const LIST = path.join(ROOT, ".tmp-kariyer-crop-files.txt");

const files = fs
  .readdirSync(IMG)
  .filter((n) => n.endsWith(".kariyer-bak"))
  .map((n) => n.replace(/\.kariyer-bak$/, ""))
  .filter((n) => fs.existsSync(path.join(IMG, n)))
  .map((n) => `data/images/${n}`);

fs.writeFileSync(LIST, files.join("\n") + "\n", "utf8");

const distImg = path.join(ROOT, "dist", "data", "images");
fs.mkdirSync(distImg, { recursive: true });
let synced = 0;
for (const rel of files) {
  const name = path.basename(rel);
  const src = path.join(IMG, name);
  const dest = path.join(distImg, name);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    synced++;
  }
}
console.log(`[pack-kariyer-crop] ${files.length} dosya -> ${LIST}`);
console.log(`[pack-kariyer-crop] dist/data/images guncellendi: ${synced}`);
console.log("Deploy: node scripts/deploy-cpanel-sftp.mjs --file-list .tmp-kariyer-crop-files.txt");
