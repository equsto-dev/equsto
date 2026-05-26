import { copyFileSync, statSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { writeFileSync } from "node:fs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src =
  "C:/Users/User/.cursor/projects/c-D-Disk-EQUSTO-mutbex-scraping/assets/c__Users_User_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_e3ad0c3c-f8e5-4109-bfa2-61496e917aac-6e00b8f2-6243-4bbb-bb4e-9fcb190704d0.png";
const log = [];
try {
  if (!existsSync(src)) throw new Error("src missing: " + src);
  const s0 = statSync(src).size;
  const d1 = join(root, "public", "equsto-bize-ulasin-isimlik.png");
  const d2 = join(root, "dist", "equsto-bize-ulasin-isimlik.png");
  copyFileSync(src, d1);
  copyFileSync(src, d2);
  log.push("ok src=" + s0 + " dst1=" + statSync(d1).size + " dst2=" + statSync(d2).size);
} catch (e) {
  log.push("err " + (e && e.message ? e.message : String(e)));
}
writeFileSync(join(root, "copy-wa-cat-result.txt"), log.join("\n"), "utf8");
