/**
 * PFOS «Seçilen ürünleri sepete ekle» canlı yama.
 * cPanel: public_html köküne Extract (alt klasör değil).
 *
 *   node scripts/pack-pfos-sepete-canli.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const pub = path.join(root, "public");
const dist = path.join(root, "dist");
const outZip = path.join(root, "equsto-pfos-sepete-canli.zip");
const stage = path.join(root, ".deploy-stage-pfos-sepete");

const FILES = [
  "pfos.html",
  "theme.css",
  "ecom-cart.js",
  "ecom-data.js",
  "eq-shop-catalog-bootstrap.js",
  "contact.js",
  "equsto-member.js",
];

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
    console.error("[pack-pfos-sepete] Eksik:", rel);
    process.exit(1);
  }
  const dst = path.join(stage, rel);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
  console.log("[pack-pfos-sepete]", rel);
  n++;
}

const readme = `PFOS — Seçilen ürünleri sepete ekle (canlı yama)
================================================

1. cPanel → Dosya Yöneticisi → public_html
2. equsto-pfos-sepete-canli.zip yükle
3. ZIP üzerinde Extract (köke açılsın, alt klasör oluşturmasın)
4. Cloudflare / önbellek temizle
5. Test: https://equsto.com/pfos → Teklif bölümü → «Seçilen ürünleri sepete ekle»

Dosyalar:
  pfos.html, theme.css, ecom-cart.js, ecom-data.js, equsto-member.js, contact.js

Not: data/ekipmanlar.json sunucuda zaten varsa tekrar yüklemeniz gerekmez.
`;
fs.writeFileSync(path.join(stage, "CPANEL-PFOS-SEPETE.txt"), readme, "utf8");
n++;

if (fs.existsSync(outZip)) fs.unlinkSync(outZip);
const ps = `Compress-Archive -Path '${stage.replace(/'/g, "''")}\\*' -DestinationPath '${outZip.replace(/'/g, "''")}' -Force`;
execSync(`powershell -NoProfile -Command "${ps}"`, { stdio: "inherit" });

const kb = (fs.statSync(outZip).size / 1024).toFixed(0);
console.log(`\n[pack-pfos-sepete] Hazir: ${outZip} (${kb} KB, ${n} dosya)`);
console.log("[pack-pfos-sepete] cPanel → public_html → ZIP yukle → Extract");
console.log("[pack-pfos-sepete] Test: https://equsto.com/pfos");
rmrf(stage);
