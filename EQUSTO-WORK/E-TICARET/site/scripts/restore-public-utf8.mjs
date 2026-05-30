/**
 * Bozuk UTF-8 HTML dosyalarını temiz yedekten geri yükler.
 *   node scripts/restore-public-utf8.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEST = path.join(ROOT, "public");
const SOURCES = [
  path.resolve(ROOT, "../../public"),
  path.resolve(ROOT, "../../equsto-v2/public"),
];

function stripBom(text) {
  return text.replace(/^\uFEFF/, "");
}

function fffdCount(text) {
  return (text.match(/\uFFFD/g) || []).length;
}

function qMarkCorrupt(text) {
  return (text.match(/\? T\?m|Pi\?irme|End\?striyel|Hakk\?m\?zda/g) || []).length;
}

function findCleanSource(name) {
  for (const base of SOURCES) {
    const p = path.join(base, name);
    if (!fs.existsSync(p)) continue;
    const text = stripBom(fs.readFileSync(p, "utf8"));
    if (fffdCount(text) === 0 && qMarkCorrupt(text) === 0) return { base, text };
  }
  return null;
}

function walkHtml(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === "node_modules" || ent.name === "images") continue;
      walkHtml(p, out);
    } else if (ent.name.endsWith(".html")) {
      out.push(p);
    }
  }
  return out;
}

let restored = 0;
let ok = 0;
let missing = 0;

for (const destPath of walkHtml(DEST)) {
  const name = path.relative(DEST, destPath).replace(/\\/g, "/");
  const cur = stripBom(fs.readFileSync(destPath, "utf8"));
  const curBad = fffdCount(cur) + qMarkCorrupt(cur);
  if (curBad === 0) {
    ok++;
    continue;
  }
  const src = findCleanSource(name);
  if (!src) {
    console.warn("[missing]", name, "FFFD", fffdCount(cur));
    missing++;
    continue;
  }
  fs.writeFileSync(destPath, src.text, "utf8");
  console.log("[restored]", name, "<-", path.basename(path.dirname(src.base)) + "/" + path.basename(src.base));
  restored++;
}

console.log(`\n[restore-public-utf8] ${restored} restored, ${ok} ok, ${missing} missing`);
