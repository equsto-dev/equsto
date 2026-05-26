/**
 * Arama çubuğu düzeltmesi — küçük ZIP (cPanel public_html köküne çıkarın).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const stage = path.join(root, ".arama-stage");
const outZip = path.join(root, "equsto-arama-duzeltme.zip");

const files = ["theme.js", "eq-category-shell.js", "nav.js"];
const assetCss = "dist/assets/theme-ChNyeBmn.css";

function rmrf(p) {
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
}

rmrf(stage);
fs.mkdirSync(stage, { recursive: true });
fs.mkdirSync(path.join(stage, "assets"), { recursive: true });

const cssSrc = path.join(root, assetCss);
if (fs.existsSync(cssSrc)) {
  fs.copyFileSync(cssSrc, path.join(stage, "assets", "theme-ChNyeBmn.css"));
  fs.copyFileSync(path.join(root, "public", "theme.css"), path.join(stage, "theme.css"));
}

for (const name of files) {
  const src = path.join(root, "public", name);
  if (!fs.existsSync(src)) {
    console.error("[pack-arama] Eksik:", src);
    process.exit(1);
  }
  fs.copyFileSync(src, path.join(stage, name));
}

if (fs.existsSync(outZip)) fs.unlinkSync(outZip);
execSync(
  `powershell -NoProfile -Command "Compress-Archive -Path '${stage.replace(/'/g, "''")}\\*' -DestinationPath '${outZip.replace(/'/g, "''")}' -Force"`,
  { stdio: "inherit" }
);
rmrf(stage);

const kb = (fs.statSync(outZip).size / 1024).toFixed(1);
console.log(`[pack-arama] ${outZip} (${kb} KB)`);
console.log("[pack-arama] cPanel → Dosya Yöneticisi → public_html → Yükle → ZIP üzerine çıkar.");
