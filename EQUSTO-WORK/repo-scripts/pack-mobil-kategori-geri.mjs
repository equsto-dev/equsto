/**
 * Mobil kategori geri dönüş — nav + departman shell + CSS.
 * cPanel: public_html köküne Extract.
 *
 *   node scripts/pack-mobil-kategori-geri.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const pub = path.join(root, "public");
const dist = path.join(root, "dist");
const outZip = path.join(root, "equsto-mobil-kategori-geri.zip");
const stage = path.join(root, ".deploy-stage-mobil-kat-geri");

const FILES = ["nav.js", "eq-category-shell.js", "eq-home-mutbex.css", "theme.css"];

function rmrf(p) {
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
}

function resolveSrc(rel) {
  const d = path.join(dist, rel);
  if (fs.existsSync(d)) return d;
  const p = path.join(pub, rel);
  if (fs.existsSync(p)) return p;
  return null;
}

rmrf(stage);
fs.mkdirSync(stage, { recursive: true });
let n = 0;
for (const rel of FILES) {
  const src = resolveSrc(rel);
  if (!src) {
    console.error("[pack] Eksik:", rel);
    process.exit(1);
  }
  fs.copyFileSync(src, path.join(stage, rel));
  console.log("[pack]", rel);
  n++;
}

fs.writeFileSync(
  path.join(stage, "CPANEL-MOBIL-KATEGORI.txt"),
  "Mobil kategori geri donus yamasi\n\n1. public_html -> ZIP yukle -> Extract\n2. Cloudflare Purge\n3. Test: mobil menu + departman sayfasinda alt kategori\n",
  "utf8"
);
n++;

if (fs.existsSync(outZip)) fs.unlinkSync(outZip);
const ps = `Compress-Archive -Path '${stage.replace(/'/g, "''")}\\*' -DestinationPath '${outZip.replace(/'/g, "''")}' -Force`;
execSync(`powershell -NoProfile -Command "${ps}"`, { stdio: "inherit" });
const kb = (fs.statSync(outZip).size / 1024).toFixed(0);
console.log(`\n[pack] Hazir: ${outZip} (${kb} KB, ${n} dosya)`);
rmrf(stage);
