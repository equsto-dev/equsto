import { copyFileSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src =
  "C:/Users/User/.cursor/projects/c-D-Disk-EQUSTO-mutbex-scraping/assets/equsto-bize-ulasin-isimlik.png";
const pub = join(root, "public", "equsto-bize-ulasin-isimlik.png");
const dist = join(root, "dist", "equsto-bize-ulasin-isimlik.png");

import { writeFileSync } from "node:fs";

try {
  copyFileSync(src, pub);
  copyFileSync(src, dist);
  const msg = "copied " + statSync(pub).size + " bytes to public and dist\n";
  writeFileSync(join(root, "copy-wa-cat-result.txt"), msg);
  console.log(msg.trim());
} catch (e) {
  const err = String(e && e.message ? e.message : e);
  writeFileSync(join(root, "copy-wa-cat-result.txt"), "ERR: " + err + "\n");
  console.error(err);
  process.exit(1);
}
