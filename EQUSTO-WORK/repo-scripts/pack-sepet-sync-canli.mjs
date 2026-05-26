/**
 * Sepet sunucu senkronu (PC ↔ mobil) canlı yama — ön yüz (public_html).
 * Node API için: node scripts/pack-api-canli.mjs
 *
 *   node scripts/pack-sepet-sync-canli.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const pub = path.join(root, "public");
const dist = path.join(root, "dist");
const outZip = path.join(root, "equsto-sepet-sync-canli.zip");
const stage = path.join(root, `.deploy-stage-sepet-sync-${process.pid}`);

/** claude-api-proxy.mjs buraya alınmaz — çalışan API kilidi + gereksiz boyut; pack-api-canli.mjs kullanın. */
const FILES = [
  "ecom-cart.js",
  "eq-auth-api.js",
  "eq-site-urls.js",
  "equsto-member.js",
  "equsto-auth-client.js",
  "nav.js",
  { rel: ".htaccess", required: false },
  { rel: "auth-api-base.json", required: false },
  { rel: "mobil/kategoriler.html", required: false },
  { rel: "index.html", required: false },
  { rel: "pisirme.html", required: false },
  { rel: "sogutma.html", required: false },
  { rel: "kahve.html", required: false },
  { rel: "yikama.html", required: false },
  { rel: "hazirlik.html", required: false },
  { rel: "icecek.html", required: false },
  { rel: "product.html", required: false },
  { rel: "sepet.html", required: false },
];

function rmrf(p) {
  if (!fs.existsSync(p)) return;
  try {
    fs.rmSync(p, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
  } catch (e) {
    console.warn("[pack-sepet-sync] Silinemedi (dosya acik olabilir):", p);
  }
}

function cleanOldStages() {
  try {
    for (const ent of fs.readdirSync(root)) {
      if (ent.startsWith(".deploy-stage-sepet-sync")) {
        rmrf(path.join(root, ent));
      }
    }
  } catch (_) {}
}

function resolveSrc(rel) {
  const d = path.join(dist, rel);
  if (fs.existsSync(d)) return d;
  const p = path.join(pub, rel);
  if (fs.existsSync(p)) return p;
  return null;
}

function zipStage(stageDir, zipPath) {
  if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
  const stageEsc = stageDir.replace(/"/g, '\\"');
  const zipEsc = zipPath.replace(/"/g, '\\"');
  try {
    execSync(`tar -a -cf "${zipEsc}" -C "${stageEsc}" .`, { stdio: "inherit" });
    return;
  } catch (e) {
    console.warn("[pack-sepet-sync] tar basarisiz, Compress-Archive deneniyor…");
  }
  const ps = [
    "$ErrorActionPreference='Stop'",
    `Compress-Archive -Path (Join-Path '${stageDir.replace(/'/g, "''")}' '*')`,
    `-DestinationPath '${zipPath.replace(/'/g, "''")}'`,
    "-Force",
  ].join("; ");
  execSync(`powershell -NoProfile -Command "${ps}"`, { stdio: "inherit" });
}

cleanOldStages();
rmrf(stage);
fs.mkdirSync(stage, { recursive: true });

let n = 0;
for (const entry of FILES) {
  const rel = typeof entry === "string" ? entry : entry.rel;
  const required = typeof entry === "string" ? true : entry.required !== false;
  const src = resolveSrc(rel);
  if (!src) {
    if (!required) continue;
    console.error("[pack-sepet-sync] Eksik:", rel);
    process.exit(1);
  }
  const dst = path.join(stage, rel);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
  console.log("[pack-sepet-sync]", rel);
  n++;
}

const readme = `Sepet senkronu (Google giriş — PC ↔ mobil)
============================================

ON YUZ (bu ZIP → public_html extract):
  ecom-cart.js, equsto-member.js, equsto-auth-client.js, eq-auth-api.js
  .htaccess (Authorization iletimi), dept HTML

NODE API (ayri — ZORUNLU cihazlar arasi sepet):
  node scripts/pack-api-canli.mjs
  → equsto-api-canli.zip → cPanel Node → npm install → RESTART
  Test: https://equsto.com/api → build: 20260520-auth-cart-token
  Giriş sonrası: /api/auth/cart?access_token=TOKEN → success:true

Kurulum:
1. public_html → bu ZIP extract (alt klasör degil).
2. Node API paketini ayrica yukleyip yeniden baslatin.
3. Cikis yapip tekrar giris (eski token gecersiz olabilir).
4. PC sepete ekle → mobilde ayni hesap → sepet ikonu.
`;

fs.writeFileSync(path.join(stage, "CPANEL-SEPET-SYNC.txt"), readme, "utf8");

try {
  zipStage(stage, outZip);
} catch (e) {
  console.error("[pack-sepet-sync] ZIP olusturulamadi:", e.message || e);
  process.exit(1);
}

if (!fs.existsSync(outZip) || fs.statSync(outZip).size < 500) {
  console.error("[pack-sepet-sync] ZIP eksik veya cok kucuk — islem basarisiz.");
  process.exit(1);
}

const mb = (fs.statSync(outZip).size / 1024).toFixed(1);
console.log("\n[pack-sepet-sync] Hazir:", outZip, `(${mb} KB, ${n} dosya)`);
rmrf(stage);
