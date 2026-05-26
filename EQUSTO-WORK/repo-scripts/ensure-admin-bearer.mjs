/**
 * .env içinde EQUSTO_ADMIN_BEARER yoksa üretir (gitignore).
 * deploy:admin öncesi otomatik çalışır.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(root, ".env");
const notePath = path.join(root, "deploy", ".admin-bearer-once.txt");
const pwNotePath = path.join(root, "deploy", ".admin-password-once.txt");

function parseEnv(txt) {
  const out = {};
  for (const line of txt.split(/\r?\n/)) {
    const s = line.trim();
    if (!s || s.startsWith("#")) continue;
    const i = s.indexOf("=");
    if (i < 1) continue;
    const k = s.slice(0, i).trim();
    let v = s.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  return out;
}

function upsertEnv(key, value) {
  let lines = [];
  if (fs.existsSync(envPath)) lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  const prefix = key + "=";
  let found = false;
  const next = lines.map((line) => {
    if (line.trim().startsWith(prefix)) {
      found = true;
      return `${key}=${value}`;
    }
    return line;
  });
  if (!found) {
    if (next.length && next[next.length - 1] !== "") next.push("");
    next.push(`${key}=${value}`);
  }
  fs.writeFileSync(envPath, next.join("\n").replace(/\n+$/, "\n"), "utf8");
}

let token = process.env.EQUSTO_ADMIN_BEARER;
if (fs.existsSync(envPath)) {
  const cur = parseEnv(fs.readFileSync(envPath, "utf8"));
  if (!token && cur.EQUSTO_ADMIN_BEARER) token = cur.EQUSTO_ADMIN_BEARER;
}

if (!token || !String(token).trim()) {
  token = "eq_adm_" + crypto.randomBytes(24).toString("base64url");
  upsertEnv("EQUSTO_ADMIN_BEARER", token);
  console.log("[ensure-admin-bearer] Yeni token .env dosyasina yazildi");
} else {
  token = String(token).trim();
  upsertEnv("EQUSTO_ADMIN_BEARER", token);
  console.log("[ensure-admin-bearer] Mevcut token .env icinde");
}

process.env.EQUSTO_ADMIN_BEARER = token;

fs.mkdirSync(path.dirname(notePath), { recursive: true });
const note =
  `Equsto admin token (gizli — repoya commit etmeyin)\n` +
  `Olusturma: ${new Date().toISOString()}\n\n` +
  `1) cPanel public_html/admin-config.js icinde paket zaten gomulu olabilir;\n` +
  `   yoksa: window.EQUSTO_ADMIN_BEARER = '${token}';\n\n` +
  `2) cPanel Node API .env dosyasina ekleyin:\n` +
  `   EQUSTO_ADMIN_BEARER=${token}\n\n` +
  `3) Node uygulamasini Restart edin.\n`;
fs.writeFileSync(notePath, note, "utf8");
console.log("[ensure-admin-bearer] Not:", notePath);

let password = process.env.EQUSTO_ADMIN_PASSWORD;
if (fs.existsSync(envPath)) {
  const cur = parseEnv(fs.readFileSync(envPath, "utf8"));
  if (!password && cur.EQUSTO_ADMIN_PASSWORD) password = cur.EQUSTO_ADMIN_PASSWORD;
}
if (!password || !String(password).trim()) {
  password =
    "Eq_" +
    crypto.randomBytes(4).toString("hex") +
    "!" +
    crypto.randomBytes(2).toString("hex");
  upsertEnv("EQUSTO_ADMIN_PASSWORD", password);
  console.log("[ensure-admin-bearer] Yeni admin sifresi .env dosyasina yazildi");
} else {
  password = String(password).trim();
  upsertEnv("EQUSTO_ADMIN_PASSWORD", password);
}
process.env.EQUSTO_ADMIN_PASSWORD = password;

let recovery = process.env.EQUSTO_ADMIN_RECOVERY_CODE;
if (fs.existsSync(envPath)) {
  const cur = parseEnv(fs.readFileSync(envPath, "utf8"));
  if (!recovery && cur.EQUSTO_ADMIN_RECOVERY_CODE) recovery = cur.EQUSTO_ADMIN_RECOVERY_CODE;
}
if (!recovery || !String(recovery).trim()) {
  recovery = "eq_rc_" + crypto.randomBytes(12).toString("base64url");
  upsertEnv("EQUSTO_ADMIN_RECOVERY_CODE", recovery);
  console.log("[ensure-admin-bearer] Yeni kurtarma kodu .env dosyasina yazildi");
} else {
  recovery = String(recovery).trim();
  upsertEnv("EQUSTO_ADMIN_RECOVERY_CODE", recovery);
}
process.env.EQUSTO_ADMIN_RECOVERY_CODE = recovery;

const pwNote =
  `Equsto admin giris sifresi (gizli — repoya commit etmeyin)\n` +
  `Olusturma: ${new Date().toISOString()}\n\n` +
  `https://equsto.com/admin.html\n\n` +
  `Sifre: ${password}\n\n` +
  `Sifremi unuttum — kurtarma kodu: ${recovery}\n\n` +
  `cPanel Node API .env:\n` +
  `EQUSTO_ADMIN_PASSWORD=${password}\n` +
  `EQUSTO_ADMIN_RECOVERY_CODE=${recovery}\n`;
fs.writeFileSync(pwNotePath, pwNote, "utf8");
console.log("[ensure-admin-bearer] Sifre notu:", pwNotePath);
