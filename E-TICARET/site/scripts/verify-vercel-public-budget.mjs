/**
 * Vercel prebuild — deploy edilecek public/ boyutu ( .vercelignore hariç ).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = path.join(ROOT, "public");
const IGNORE = path.join(ROOT, ".vercelignore");

function loadIgnorePatterns() {
  if (!fs.existsSync(IGNORE)) return [];
  return fs
    .readFileSync(IGNORE, "utf8")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
}

function relPosix(from, file) {
  return path.relative(from, file).replace(/\\/g, "/");
}

function ignored(rel, patterns) {
  for (const pat of patterns) {
    const p = pat.replace(/\\/g, "/").replace(/\/$/, "");
    if (rel === p || rel.startsWith(`${p}/`)) return true;
  }
  return false;
}

function walk(dir, base, patterns, out) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, ent.name);
    const rel = relPosix(base, abs);
    if (ignored(rel, patterns)) continue;
    if (ent.isDirectory()) walk(abs, base, patterns, out);
    else out.push({ rel, bytes: fs.statSync(abs).size });
  }
}

const patterns = loadIgnorePatterns();
const files = [];
if (fs.existsSync(PUBLIC)) walk(PUBLIC, PUBLIC, patterns, files);
const totalMb = +(files.reduce((s, f) => s + f.bytes, 0) / 1048576).toFixed(1);

console.log("[verify-vercel-public]", files.length, "dosya,", totalMb, "MB (vercelignore sonrası)");

if (totalMb > 2048) {
  console.warn(
    "[verify-vercel-public] UYARI: >2 GB — Vercel statik deploy güncellenmeyebilir; büyük klasörleri .vercelignore + S3",
  );
}
