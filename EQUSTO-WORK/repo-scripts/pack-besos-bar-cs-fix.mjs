/**
 * Besos Cocktail Stations strip düzeltmesi — hızlı canlı yama ZIP.
 * Sorun: canlıda JS yeni (bd-cs-strip), HTML içi CSS eski (bd-cs-card).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const outZip = path.join(root, "equsto-besos-bar-cs-fix.zip");
const stage = path.join(root, ".deploy-stage-besos-cs");

const files = [
  "dist/bar-design.html",
  "dist/bar-design-cocktailstations.css",
  "dist/eq-bar-design-cocktailstations.js",
  "dist/eq-bar-design-vitrum.js",
  "dist/eq-bar-module.js",
  "dist/bar-module.html",
  "dist/data/cocktailstations-catalogue.json",
  "dist/data/cocktailstations-landing.json",
];

function rmrf(p) {
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
}

rmrf(stage);
fs.mkdirSync(stage, { recursive: true });

let n = 0;
for (const rel of files) {
  const src = path.join(root, rel);
  if (!fs.existsSync(src)) {
    console.warn("[pack] eksik:", rel, "— önce npm run build");
    continue;
  }
  const dst = path.join(stage, rel.replace(/^dist[\\/]/, ""));
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
  n++;
  console.log("[pack]", rel.replace(/^dist[\\/]/, ""));
}

if (!n) {
  console.error("[pack] dist dosyası yok — npm run build çalıştırın.");
  process.exit(1);
}

if (fs.existsSync(outZip)) fs.unlinkSync(outZip);
const ps = `Compress-Archive -Path '${stage.replace(/'/g, "''")}\\*' -DestinationPath '${outZip.replace(/'/g, "''")}' -Force`;
execSync(`powershell -NoProfile -Command "${ps}"`, { stdio: "inherit" });

const mb = (fs.statSync(outZip).size / (1024 * 1024)).toFixed(2);
console.log("\n[pack] Hazir:", outZip, `(${mb} MB)`);
console.log("[pack] cPanel public_html: ZIP ac → bar-design.html, bar-design-cocktailstations.css, eq-bar-design-cocktailstations.js, data/cocktailstations-*.json");
rmrf(stage);
