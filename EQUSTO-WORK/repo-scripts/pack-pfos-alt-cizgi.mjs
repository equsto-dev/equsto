/**
 * Proje Fabrikası alt çizgisi — sunucudaki theme-ChNyeBmn.css güncellenir.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const assets = path.join(root, "dist", "assets");
const stage = path.join(root, ".pfos-css-stage");
const outZip = path.join(root, "equsto-pfos-alt-cizgi.zip");

const fresh = path.join(assets, "theme-CH7GrJKN.css");
const legacy = path.join(assets, "theme-ChNyeBmn.css");
const publicCss = path.join(root, "public", "theme.css");

if (fs.existsSync(fresh)) {
  fs.copyFileSync(fresh, legacy);
  console.log("[pack-pfos] theme-CH7GrJKN.css → theme-ChNyeBmn.css");
} else if (fs.existsSync(publicCss)) {
  fs.mkdirSync(assets, { recursive: true });
  fs.copyFileSync(publicCss, legacy);
  console.log("[pack-pfos] public/theme.css → theme-ChNyeBmn.css");
} else {
  console.error("[pack-pfos] CSS kaynağı bulunamadı. Önce npm run build.");
  process.exit(1);
}

function rmrf(p) {
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
}

rmrf(stage);
fs.mkdirSync(path.join(stage, "assets"), { recursive: true });
fs.copyFileSync(legacy, path.join(stage, "assets", "theme-ChNyeBmn.css"));
fs.copyFileSync(publicCss, path.join(stage, "theme.css"));

if (fs.existsSync(outZip)) fs.unlinkSync(outZip);
execSync(
  `powershell -NoProfile -Command "Compress-Archive -Path '${stage.replace(/'/g, "''")}\\*' -DestinationPath '${outZip.replace(/'/g, "''")}' -Force"`,
  { stdio: "inherit" }
);
rmrf(stage);

const kb = (fs.statSync(outZip).size / 1024).toFixed(1);
console.log(`[pack-pfos] ${outZip} (${kb} KB)`);
console.log("[pack-pfos] public_html → ZIP yükle → çıkar:");
console.log("  • assets/theme-ChNyeBmn.css  (sayfalar bunu kullanıyor)");
console.log("  • theme.css                  (yedek / bazı sayfalar)");
