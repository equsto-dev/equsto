/**
 * Admin panel canlı yama — admin.html + admin-config.js + bağımlılıklar.
 * cPanel: public_html köküne Extract (alt klasör değil).
 *
 *   npm run deploy:admin
 *
 * Canlı Bearer (repoda yok):
 *   set EQUSTO_ADMIN_BEARER=... && npm run deploy:admin
 * veya sunucuda admin-config.js içinde EQUSTO_ADMIN_BEARER doldurun.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadRootEnv() {
  const envPath = path.join(root, ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const s = line.trim();
    if (!s || s.startsWith("#")) continue;
    const i = s.indexOf("=");
    if (i < 1) continue;
    const k = s.slice(0, i).trim();
    let v = s.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (process.env[k] == null) process.env[k] = v;
  }
}

loadRootEnv();
const dist = path.join(root, "dist");
const pub = path.join(root, "public");
const outZip = path.join(root, "equsto-admin-canli.zip");
const stage = path.join(root, ".deploy-stage-admin");

const ROOT_FILES = [
  "admin.html",
  "admin-config.js",
  "admin-gate.js",
  "theme.css",
  "contact.css",
  "theme.js",
  "equsto-logo.js",
  "eq-site-urls.js",
  "equsto-member.js",
  "contact.js",
  "ecom-data.js",
  "equsto-adres-national.js",
  "admin-vitrin.js",
];

const DATA_FILES = ["data/tr-adres.json"];

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

function patchAdminConfigForLive(buf) {
  const bearer = process.env.EQUSTO_ADMIN_BEARER;
  const password = process.env.EQUSTO_ADMIN_PASSWORD;
  let s = buf.toString("utf8");
  if (password && String(password).trim()) {
    const hash = crypto.createHash("sha256").update(String(password).trim()).digest("hex");
    if (/window\.EQUSTO_ADMIN_PW_SHA256\s*=/.test(s)) {
      s = s.replace(/window\.EQUSTO_ADMIN_PW_SHA256\s*=\s*[^;]+;/, `window.EQUSTO_ADMIN_PW_SHA256 = '${hash}';`);
    } else {
      s += `\nwindow.EQUSTO_ADMIN_PW_SHA256 = '${hash}';\n`;
    }
    console.log("[pack-admin] EQUSTO_ADMIN_PW_SHA256 pakete gomuldu");
  }
  if (bearer && String(bearer).trim()) {
    const esc = String(bearer).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
    if (/window\.EQUSTO_ADMIN_BEARER\s*=/.test(s)) {
      s = s.replace(
        /window\.EQUSTO_ADMIN_BEARER\s*=\s*[^;]+;/,
        `window.EQUSTO_ADMIN_BEARER = '${esc}';`
      );
    } else {
      s += `\nwindow.EQUSTO_ADMIN_BEARER = '${esc}';\n`;
    }
    if (!/window\.EQUSTO_API_BASE\s*=/.test(s)) {
      s += "\nwindow.EQUSTO_API_BASE = '/api';\n";
    }
    s = s.replace(/\n\/\/ window\.EQUSTO_ADMIN_BEARER[^\n]*\n?/g, "\n");
    console.log("[pack-admin] EQUSTO_ADMIN_BEARER pakete gomuldu");
  }
  return Buffer.from(s, "utf8");
}

try {
  execSync("node scripts/fix-dist-html-css.mjs", { cwd: root, stdio: "pipe" });
} catch (e) {
  console.warn("[pack-admin] fix-dist atlandi:", e.message);
}

rmrf(stage);
fs.mkdirSync(stage, { recursive: true });
let n = 0;

for (const rel of ROOT_FILES) {
  const src = resolveSrc(rel);
  if (!src) {
    console.error("[pack-admin] Eksik:", rel, "— opsiyonel: npm run build");
    process.exit(1);
  }
  const dst = path.join(stage, rel);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  if (rel === "admin-config.js") {
    fs.writeFileSync(dst, patchAdminConfigForLive(fs.readFileSync(src)));
  } else {
    fs.copyFileSync(src, dst);
  }
  console.log("[pack-admin]", rel);
  n++;
}

for (const rel of DATA_FILES) {
  const src = resolveSrc(rel);
  if (!src) {
    console.warn("[pack-admin] atlandi:", rel);
    continue;
  }
  const dst = path.join(stage, rel);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
  console.log("[pack-admin]", rel);
  n++;
}

const readme = path.join(root, "deploy", "CPANEL-ADMIN.md");
if (fs.existsSync(readme)) {
  fs.copyFileSync(readme, path.join(stage, "CPANEL-ADMIN.md"));
  console.log("[pack-admin] CPANEL-ADMIN.md");
  n++;
}

const liveCfg = path.join(stage, "admin-config.js");
if (fs.existsSync(liveCfg)) {
  fs.copyFileSync(liveCfg, path.join(pub, "admin-config.js"));
  console.log("[pack-admin] public/admin-config.js canli token+sifre hash ile guncellendi");
}

if (fs.existsSync(outZip)) fs.unlinkSync(outZip);
const ps = `Compress-Archive -Path '${stage.replace(/'/g, "''")}\\*' -DestinationPath '${outZip.replace(/'/g, "''")}' -Force`;
execSync(`powershell -NoProfile -Command "${ps}"`, { stdio: "inherit" });
const kb = (fs.statSync(outZip).size / 1024).toFixed(0);
console.log(`\n[pack-admin] Hazir: ${outZip} (${kb} KB, ${n} dosya)`);
console.log("[pack-admin] cPanel → public_html → ZIP yukle → Extract → Cloudflare Purge");
console.log("[pack-admin] Test: https://equsto.com/admin.html");
if (!process.env.EQUSTO_ADMIN_BEARER) {
  console.log("[pack-admin] UYARI: Sunucuda admin-config.js → EQUSTO_ADMIN_BEARER doldurun (deploy/CPANEL-ADMIN.md)");
}
rmrf(stage);
