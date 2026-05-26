import { copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src =
  "C:/Users/User/.cursor/projects/c-D-Disk-EQUSTO-mutbex-scraping/assets/c__Users_User_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_e3ad0c3c-f8e5-4109-bfa2-61496e917aac-6e00b8f2-6243-4bbb-bb4e-9fcb190704d0.png";
copyFileSync(src, join(root, "public", "equsto-bize-ulasin-isimlik.png"));
copyFileSync(src, join(root, "dist", "equsto-bize-ulasin-isimlik.png"));
console.log("ok");
