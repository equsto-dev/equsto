/**
 * .env INDEXNOW_KEY → public/{key}.txt (Bing IndexNow doğrulama dosyası)
 * npm run seo:indexnow
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(root, ".env");

function loadEnv() {
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

loadEnv();
const key = String(process.env.INDEXNOW_KEY || "").trim();
if (!key) {
  console.error("[seo:indexnow] .env icinde INDEXNOW_KEY yok");
  process.exit(1);
}
if (!/^[a-zA-Z0-9-]{8,128}$/.test(key)) {
  console.error("[seo:indexnow] INDEXNOW_KEY gecersiz (8-128 karakter, harf/rakam/tire)");
  process.exit(1);
}

const out = path.join(root, "public", `${key}.txt`);
fs.writeFileSync(out, key, "utf8");
console.log("[seo:indexnow] Olusturuldu:", path.relative(root, out));
console.log("[seo:indexnow] Canli URL: https://equsto.com/" + key + ".txt");
console.log("[seo:indexnow] Deploy edin, sonra npm run seo:ping");
