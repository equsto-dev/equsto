/**
 * Son yamalar — cPanel public_html köküne Extract.
 * Sepet senkronu + üst bar Alıcı/konum + PFOS teklif v12
 *
 *   node scripts/pack-canli-guncel.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const pub = path.join(root, "public");
const dist = path.join(root, "dist");
const outZip = path.join(root, "equsto-canli-guncel.zip");
const stage = path.join(root, ".deploy-stage-canli-guncel");

const FILES = [
  "theme.css",
  "ecom-cart.js",
  "eq-auth-api.js",
  "equsto-member.js",
  "equsto-auth-client.js",
  "pfos-teklif-excel.js",
  "pfos-teklif-ui.js",
  "index.html",
  "pfos.html",
  "mobil/kategoriler.html",
  "data/templates/equsto_teklif_v14.xlsx",
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
    console.error("[pack-canli-guncel] Eksik:", rel);
    process.exit(1);
  }
  const dst = path.join(stage, rel);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
  console.log("[pack-canli-guncel]", rel);
  n++;
}

fs.writeFileSync(
  path.join(stage, "CPANEL-CANLI-GUNCEL.txt"),
  `Equsto canlı yama
================

1. cPanel → Dosya Yöneticisi → public_html
2. equsto-canli-guncel.zip → Extract (kök dizin, alt klasör değil)
3. Mevcut dosyaların üzerine yaz → Evet
4. Tarayıcı önbelleğini temizleyin (mobil + PC)

Bu paket:
• Sepet PC ↔ mobil senkronu (ecom-cart.js, üye scriptleri)
• Üst bar: Alıcı üstte, şehir altta (theme.css)
• PFOS Excel teklif v12 şablonu
• index.html + pfos.html + mobil/kategoriler.html

Test:
• Google giriş → PC sepete ürün → mobilde aynı hesap → sepet dolu
• Üst barda iki satır: Alıcı … / İstanbul, Türkiye
• PFOS → Excel indir → v12 format

API: /api/auth/cart (Node proxy) çalışıyor olmalı.
`,
  "utf8",
);

if (fs.existsSync(outZip)) fs.unlinkSync(outZip);
const ps = `Compress-Archive -Path '${stage.replace(/'/g, "''")}\\*' -DestinationPath '${outZip.replace(/'/g, "''")}' -Force`;
execSync(`powershell -NoProfile -Command "${ps}"`, { stdio: "inherit" });

const mb = (fs.statSync(outZip).size / (1024 * 1024)).toFixed(2);
console.log("\n[pack-canli-guncel] Hazir:", outZip, `(${mb} MB, ${n} dosya)`);
rmrf(stage);
