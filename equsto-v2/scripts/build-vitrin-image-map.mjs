/**
 * Eksik /data/images/ vitrin yolları → mevcut katalog görselleri (ekipmanlar.json).
 * Çıktı: public/data/vitrin-image-map.json
 *
 *   node scripts/build-vitrin-image-map.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const EKIP = path.join(ROOT, "public/data/ekipmanlar.json");
const VITRIN = path.join(ROOT, "public/data/homepage-vitrin.json");
const OUT = path.join(ROOT, "public/data/vitrin-image-map.json");
const PUBLIC = path.join(ROOT, "public");

function norm(s) {
  return String(s || "")
    .toLocaleLowerCase("tr")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/ı/g, "i");
}

function existsPublic(rel) {
  const p = rel.replace(/^\//, "").replace(/^public\//, "");
  return fs.existsSync(path.join(PUBLIC, p));
}

function pickImageUrl(rel) {
  if (!rel) return "";
  const s = String(rel).replace(/\\/g, "/");
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("/")) {
    if (existsPublic(s)) return s;
    return "";
  }
  if (existsPublic("/" + s)) return "/" + s;
  if (existsPublic(s)) return "/" + s.replace(/^\//, "");
  return "";
}

function firstWithImage(rows, pred) {
  for (const r of rows) {
    if (!pred(r)) continue;
    const imgs = r.images;
    if (!Array.isArray(imgs) || !imgs[0]) continue;
    const url = pickImageUrl(imgs[0]);
    if (url) return url;
  }
  return "";
}

function collectLegacyPaths(obj, out) {
  if (!obj || typeof obj !== "object") return;
  if (Array.isArray(obj)) {
    for (const x of obj) collectLegacyPaths(x, out);
    return;
  }
  for (const [k, v] of Object.entries(obj)) {
    if ((k === "image" || k === "thumb" || k === "headerImage") && typeof v === "string") {
      const s = v.trim();
      if (/^\/data\/images\//i.test(s)) out.add(s);
    }
    collectLegacyPaths(v, out);
  }
}

function deptFallback(rows, dept) {
  return firstWithImage(rows, (r) => r.dept === dept);
}

function skuFallback(rows, sku) {
  const n = norm(sku);
  return firstWithImage(rows, (r) => norm(r.name) === n || norm(r.sku) === n);
}

function main() {
  const rows = JSON.parse(fs.readFileSync(EKIP, "utf8"));
  const vitrin = JSON.parse(fs.readFileSync(VITRIN, "utf8"));
  const legacy = new Set();
  collectLegacyPaths(vitrin, legacy);

  const deptPick = {
    pisirme: firstWithImage(rows, (r) => r.dept === "pisirme" && /atalay/i.test(r.brand || "")),
    sogutma: firstWithImage(rows, (r) => r.dept === "sogutma" && /öztiryaki|oztiryaki/i.test(r.brand || "")),
    yikama: deptFallback(rows, "yikama"),
    kahve: deptFallback(rows, "kahve"),
    hazirlik: deptFallback(rows, "hazirlik"),
    icecek: deptFallback(rows, "icecek"),
    tezgah: deptFallback(rows, "tezgah"),
    dolap: deptFallback(rows, "dolap"),
    davlumbaz: deptFallback(rows, "davlumbaz"),
    tasima: deptFallback(rows, "tasima"),
    araba: deptFallback(rows, "araba"),
    istif: deptFallback(rows, "istif"),
    "set-ustu-mutfak": deptFallback(rows, "set-ustu-mutfak"),
  };

  const map = {};
  let ok = 0;
  let miss = 0;

  for (const legacyPath of legacy) {
    let target = "";

    for (const card of vitrin.promoCards || []) {
      if (!card.sku) continue;
      const t = skuFallback(rows, card.sku);
      if (t) {
        target = t;
        break;
      }
    }
    if (!target) {
      const hay = norm(legacyPath);
      if (/oztiryakiler|ozti|buzdolab|gn-600|tag-/.test(hay)) target = deptPick.sogutma || "";
      else if (/konveksiyonlu|kombi|firin|atalay/.test(hay)) target = deptPick.pisirme || "";
      else if (/bulaşık|yikama|arisco/.test(hay)) target = deptPick.yikama || "";
      else if (/kahve|espresso|dalla/.test(hay)) target = deptPick.kahve || "";
      else if (/mikser|dito|hazirlik/.test(hay)) target = deptPick.hazirlik || "";
      else if (/buz-mak|brema|icecek/.test(hay)) target = deptPick.icecek || "";
      else if (/tezgah|evye|arisco-paslanmaz/.test(hay)) target = deptPick.tezgah || "";
      else if (/dolap|istif-rafi/.test(hay)) target = deptPick.dolap || deptPick.istif || "";
      else if (/davlumbaz|halton/.test(hay)) target = deptPick.davlumbaz || "";
      else if (/benmari|servis|chafing/.test(hay)) target = deptPick["set-ustu-mutfak"] || "";
      else if (/atalay/.test(hay)) target = deptPick.araba || deptPick.pisirme || "";
    }

    if (target) {
      map[legacyPath] = target;
      ok++;
    } else {
      miss++;
    }
  }

  fs.writeFileSync(OUT, JSON.stringify(map, null, 2), "utf8");
  console.log("[vitrin-map] legacy paths:", legacy.size, "mapped:", ok, "unmapped:", miss);
  console.log("[vitrin-map] →", path.relative(ROOT, OUT));
}

main();
