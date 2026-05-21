/**
 * UTF-8 düzeltme: public/ → equsto-v2/public HTML kopyala, BOM kaldır, FFFD taraması
 *   node equsto-v2/scripts/fix-utf8-public.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
const srcDir = path.join(root, "public");
const destDir = path.join(root, "equsto-v2/public");

function stripBom(buf) {
  if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
    return buf.subarray(3);
  }
  return buf;
}

function writeUtf8NoBom(filePath, text) {
  fs.writeFileSync(filePath, stripBom(Buffer.from(text, "utf8")));
}

function listHtml(dir) {
  return fs.readdirSync(dir).filter((n) => n.endsWith(".html"));
}

const copied = [];
for (const name of listHtml(srcDir)) {
  if (name === "index.html") continue;
  const src = path.join(srcDir, name);
  const dest = path.join(destDir, name);
  let html = fs.readFileSync(src, "utf8");
  html = html.replace(/^\uFEFF/, "");
  writeUtf8NoBom(dest, html);
  copied.push(name);
}

// index özel (catstrip + cache)
{
  const dest = path.join(destDir, "index.html");
  let html = fs.readFileSync(path.join(srcDir, "index.html"), "utf8").replace(/^\uFEFF/, "");
  if (html.includes("eq-decor-catstrip")) {
    html = html.replace(/\s*<nav class="eq-decor-catstrip"[\s\S]*?<\/nav>\s*\n/, "\n");
  }
  html = html
    .replace("/theme.css?v=20260521globalsearch", "/theme.css?v=20260519topnavstatic")
    .replace("/theme.js?v=20260521globalsearch", "/theme.js?v=20260519topnavstatic")
    .replace("/nav.js?v=20260521globalsearch", "/nav.js?v=20260528setustu")
    .replace("/eq-home-decor.css?v=20260528decor", "/eq-home-decor.css?v=20260519decor");
  writeUtf8NoBom(dest, html);
  copied.push("index.html");
}

// set-ustu yalnız v2
const setUstu = path.join(destDir, "set-ustu-mutfak.html");
if (fs.existsSync(setUstu)) {
  let s = fs.readFileSync(setUstu, "utf8").replace(/^\uFEFF/, "");
  const pairs = [
    ["? T?m Kategoriler", "☰ Tüm Kategoriler"],
    ["? T?m kategoriler", "☰ Tüm kategoriler"],
    ["?stanbul", "İstanbul"],
    ["T?rkiye", "Türkiye"],
    ["?r?n, marka", "Ürün, marka"],
    ["Pi?irme", "Pişirme"],
    ["So?utma", "Soğutma"],
    ["Y?kama", "Yıkama"],
    ["Haz?rl?k", "Hazırlık"],
    ["??ecek", "İçecek"],
    ["Ekipmanlar?", "Ekipmanları"],
    ["Set ?st? Mutfak", "Set Üstü Mutfak"],
  ];
  for (const [a, b] of pairs) {
    if (s.includes(a)) s = s.split(a).join(b);
  }
  writeUtf8NoBom(setUstu, s);
}

// pfos + paylaşılan JS/JSON: BOM kaldır
const extRe = /\.(html|js|json|css)$/;
function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (["node_modules", "assets", "images"].includes(ent.name)) continue;
      if (ent.name === "data" && !p.includes("i18n")) continue;
      walk(p, out);
    } else if (extRe.test(ent.name)) {
      if (ent.name.includes("ekipmanlar.json") && fs.statSync(p).size > 5e6) continue;
      out.push(p);
    }
  }
  return out;
}

let bomStripped = 0;
let fffdFiles = [];
for (const f of walk(destDir)) {
  const buf = fs.readFileSync(f);
  const hadBom = buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf;
  const text = buf.toString("utf8").replace(/^\uFEFF/, "");
  if (text.includes("\uFFFD")) fffdFiles.push(path.relative(destDir, f));
  if (hadBom || text !== buf.toString("utf8")) {
    writeUtf8NoBom(f, text);
    bomStripped++;
  }
}

console.log("[fix-utf8] HTML kopyalandı:", copied.length);
console.log("[fix-utf8] BOM temizlenen dosya:", bomStripped);
console.log("[fix-utf8] Hâlâ U+FFFD içeren:", fffdFiles.length);
if (fffdFiles.length) console.log(fffdFiles.slice(0, 20).join("\n"));
