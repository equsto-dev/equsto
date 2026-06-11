/** equsto-v2/.env.local → E-TICARET/site/.env.local (DATABASE_URL, DIRECT_URL) */
import fs from "node:fs";

const src = "c:/D Disk/EQUSTO-WORK/equsto-v2/.env.local";
const dst = "c:/D Disk/EQUSTO-WORK/E-TICARET/site/.env.local";

function parseEnv(text) {
  const map = new Map();
  for (const line of text.replace(/^\uFEFF/, "").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 1) continue;
    map.set(t.slice(0, i).trim(), t.slice(i + 1).trim());
  }
  return map;
}

function setLine(lines, key, val) {
  const prefix = `${key}=`;
  let found = false;
  const out = lines.map((line) => {
    if (line.startsWith(prefix)) {
      found = true;
      return prefix + val;
    }
    return line;
  });
  if (!found) out.push(prefix + val);
  return out;
}

const map = parseEnv(fs.readFileSync(src, "utf8"));
const db = map.get("DATABASE_URL");
const direct = map.get("DIRECT_URL");
if (!db || !direct) {
  console.error("equsto-v2: DATABASE_URL veya DIRECT_URL yok");
  process.exit(1);
}
if (/\[PASSWORD\]|\[YOUR-PASSWORD\]/i.test(db)) {
  console.error("equsto-v2: hâlâ placeholder şifre var");
  process.exit(1);
}

let dstLines = fs.readFileSync(dst, "utf8").split(/\r?\n/);
dstLines = setLine(dstLines, "DATABASE_URL", db);
dstLines = setLine(dstLines, "DIRECT_URL", direct);
fs.writeFileSync(dst, dstLines.join("\n"), "utf8");

const seen = new Set();
const cleaned = [];
for (const line of fs.readFileSync(src, "utf8").split(/\r?\n/)) {
  const t = line.trim();
  if (t.startsWith("DATABASE_URL=") || t.startsWith("DIRECT_URL=")) {
    const key = t.split("=")[0];
    if (seen.has(key)) continue;
    seen.add(key);
    cleaned.push(`${key}=${map.get(key)}`);
    continue;
  }
  cleaned.push(line);
}
fs.writeFileSync(src, cleaned.join("\n"), "utf8");

console.log("OK: DATABASE_URL/DIRECT_URL senkronize edildi (equsto-v2 → site)");
