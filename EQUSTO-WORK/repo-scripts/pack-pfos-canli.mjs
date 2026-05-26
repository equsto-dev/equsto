/**
 * PFOS + ilgili canlı paket — public_html köküne Extract.
 *   node scripts/pack-pfos-canli.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(root, "public");
const outZip = path.join(root, "equsto-pfos-canli.zip");
const stage = path.join(root, ".pfos-canli-stage");

const ROOT_FILES = [
  "pfos.html",
  "pfos-calc-engine.js",
  "pfos-pricing.js",
  "pfos-rule-engine.js",
  "pfos-location.js",
  "pfos-teklif-ui.js",
  "pfos-teklif-excel.js",
  "ecom-cart.js",
  "ecom-data.js",
  "eq-shop-catalog-bootstrap.js",
  "contact.js",
  "equsto-adres-national.js",
  "theme.css",
];

const DATA_FILES = [
  "data/tr-adres.json",
  "data/pfos-rules.json",
  "data/pfos-zone-catalog.json",
  "data/pfos-key-to-kategori.json",
  "data/pfos-catalog.json",
  "data/pfos-projects.json",
  "data/pfos-nakliye-bolgeler.json",
  "data/templates/equsto_teklif_v14.xlsx",
  "images/pfos/suvla-kanyon-avm.png",
];

const OPTIONAL = ["admin.html", "market-reyonlari.html", ".htaccess"];

function rmrf(p) {
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
}

function copyIfExists(rel) {
  const src = path.join(publicDir, rel);
  if (!fs.existsSync(src)) {
    console.warn("[pack-pfos-canli] atlandi:", rel);
    return false;
  }
  const dst = path.join(stage, rel);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
  return true;
}

rmrf(stage);
fs.mkdirSync(stage, { recursive: true });

let n = 0;
for (const f of ROOT_FILES) if (copyIfExists(f)) n++;
for (const f of DATA_FILES) if (copyIfExists(f)) n++;
for (const f of OPTIONAL) copyIfExists(f);

const htSrc = path.join(root, "deploy", "cpanel-htaccess.example");
if (fs.existsSync(htSrc)) {
  fs.copyFileSync(htSrc, path.join(stage, ".htaccess"));
}

if (fs.existsSync(outZip)) fs.unlinkSync(outZip);
const ps = `Compress-Archive -Path '${stage.replace(/'/g, "''")}\\*' -DestinationPath '${outZip.replace(/'/g, "''")}' -Force`;
execSync(`powershell -NoProfile -Command "${ps}"`, { stdio: "inherit" });

const mb = (fs.statSync(outZip).size / (1024 * 1024)).toFixed(2);
console.log("\n[pack-pfos-canli] Hazir:", outZip);
console.log("[pack-pfos-canli] Boyut:", mb, "MB,", n, "dosya");
console.log("[pack-pfos-canli] cPanel → public_html → Yukle → Extract");
console.log("[pack-pfos-canli] Test: https://equsto.com/pfos");
rmrf(stage);
