/** Urun fotograflari data/images (~2.6GB) -> equsto-urun-fotolari.zip — uzun surer */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const src =
  [path.join(root, "public", "data", "images"), path.join(root, "dist", "data", "images")].find(
    (p) => fs.existsSync(p)
  ) ?? null;
const outZip = path.join(root, "equsto-urun-fotolari.zip");

if (!src) {
  console.error("[pack] public/data/images veya dist/data/images yok.");
  process.exit(1);
}
console.log("[pack] Kaynak:", src);

if (fs.existsSync(outZip)) fs.unlinkSync(outZip);
console.log("[pack] Sikistiriliyor (birkaç dakika sürebilir)...");
const ps = `Compress-Archive -Path '${src.replace(/'/g, "''")}' -DestinationPath '${outZip.replace(/'/g, "''")}' -Force`;
execSync(`powershell -NoProfile -Command "${ps}"`, { stdio: "inherit" });
const mb = (fs.statSync(outZip).size / (1024 * 1024)).toFixed(0);
console.log("\n[pack] " + outZip + " (" + mb + " MB)");
console.log("[pack] Extract sonrasi: public_html/data/images/");
