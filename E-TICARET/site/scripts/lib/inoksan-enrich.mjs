/**
 * İnoksan SKU ↔ inoksan.com eşleştirme + imagesfolder görsel indirme.
 * KİLİT: public/inoksan-istif-images-KILIT.txt
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { foldTr, slugify } from "./ozti-enrich.mjs";

const UA = "Mozilla/5.0 (Equsto; +https://equsto.com)";

/** dept / kategori yedek görseli (sitede PDP yok) */
export const DEPT_FALLBACK_IMAGES = {
  istif: "https://www.inoksan.com/imagesfolder/products/IDD.png",
  araba: "https://www.inoksan.com/imagesfolder/products/ABC100.png",
  pisirme: "https://www.inoksan.com/imagesfolder/products/7FE10.png",
  yikama: "https://www.inoksan.com/imagesfolder/products/BCB100.png",
  "set-ustu-mutfak": "https://www.inoksan.com/imagesfolder/products/7BE10.png",
};

/** SKU prefix → kategori görseli (imagesfolder/products/*.png) */
export const SKU_PREFIX_FALLBACKS = [
  [/^KLGK/i, "https://www.inoksan.com/imagesfolder/products/GLNK-TEPSI-STANDI.png"],
  [/^KLG/i, "https://www.inoksan.com/imagesfolder/products/GLN-TEPSI-STANDI.png"],
  [/^GT07/i, "https://www.inoksan.com/imagesfolder/products/GTN-SERVIS-TEZGAHI-ARA-RAFLI.png"],
  [/^KST/i, "https://www.inoksan.com/imagesfolder/products/GSN-SICAK-SERVIS-UNITESI.png"],
  [/^KBN/i, "https://www.inoksan.com/imagesfolder/products/KBN-Servis-Buzdolabi.png"],
  [/^KBT/i, "https://www.inoksan.com/imagesfolder/products/KBN-Servis-Buzdolabi.png"],
];

export function deptFallbackUrl(row) {
  const dept = row?.dept || "";
  if (DEPT_FALLBACK_IMAGES[dept]) return DEPT_FALLBACK_IMAGES[dept];
  if (dept === "market-reyon" && row?.category === "self-servis-hatti") {
    return SKU_PREFIX_FALLBACKS.find(([re]) => re.test(skuCore(row?.sku || "")))?.[1];
  }
  if (dept === "market-reyon") {
    return SKU_PREFIX_FALLBACKS.find(([re]) => re.test(skuCore(row?.sku || "")))?.[1];
  }
  return null;
}

export function skuCore(sku) {
  return String(sku || "")
    .replace(/^INO-/i, "")
    .replace(/^EQUSTO\./i, "")
    .trim();
}

/** ZMD-7FE10, ZCO-BYM052ST → modül kodu + tam kod */
export function skuMatchCodes(sku) {
  const core = skuCore(sku);
  const out = new Set([core, core.replace(/-/g, ""), core.replace(/-/g, " ")]);

  const parts = core.split("-");
  for (let i = parts.length; i >= 1; i--) {
    const seg = parts.slice(0, i).join("-");
    out.add(seg);
    out.add(seg.replace(/-/g, ""));
  }

  for (const prefix of ["ZMD-", "ZCO-", "ZBC-", "BYM-"]) {
    if (core.toUpperCase().startsWith(prefix.toUpperCase())) {
      const rest = core.slice(prefix.length);
      out.add(rest);
      out.add(rest.replace(/-/g, ""));
    }
  }
  const bundle = core.match(/^(ZMD|ZCO|ZBC|BYM)-(.+)$/i);
  if (bundle) {
    out.add(bundle[2]);
    out.add(bundle[2].replace(/-/g, ""));
  }

  for (const code of [...out]) {
    const lr = code.match(/^(.+?)([LR])$/i);
    if (lr && lr[1].length >= 4) out.add(lr[1]);

    const st = code.match(/^(.+?)(STPD|ST|SPD|TPD|TPD)$/i);
    if (st) {
      out.add(st[1]);
      out.add(`${st[1]}S`);
      out.add(`${st[1]}X`);
    }
    const nVar = code.match(/^(.+?)(N)(?:-|$)/i);
    if (nVar) {
      out.add(nVar[1]);
      out.add(`${nVar[1]}S`);
    }

    const cfg = code.match(/^(.+?)-(?:K\d+|KP\d+|K70DHR|K70D|K70|K90|K|PZ|PD|HR|RP).*$/i);
    if (cfg) out.add(cfg[1]);

    const bck = code.match(/^(BCK)0*(\d+)([LR])?$/i);
    if (bck) out.add(`${bck[1]}${bck[2]}${bck[3] || ""}`);

    const fam3 = code.match(/^([A-Za-z]{3})\d/);
    if (fam3) out.add(fam3[1].toUpperCase());
  }

  return [...out].filter(Boolean);
}

/** Excel konfigüratör kodu → web indeks anahtarı */
export const SKU_WEB_ALIASES = [
  [/^IDD/i, "idd"],
  [/^IDK/i, "idk"],
  [/^IDP/i, "idp"],
  [/^BCB/i, "bcb"],
  [/^BCN/i, "bcb"],
  [/^BCK0*90/i, "bck90"],
  [/^BGK0*90/i, "bck90"],
  [/^BYF-KP25/i, "byf450"],
  [/^BYF-KP20/i, "byf360"],
  [/^BYF-K/i, "byf300"],
  [/^BYM042/i, "bym042"],
  [/^BYM052/i, "bym052"],
  [/^BYM100/i, "bym100"],
  [/^BYM102/i, "bym102"],
  [/^KLGK/i, "glnk"],
  [/^KLG/i, "gln"],
  [/^GT07/i, "gtn"],
  [/^KST/i, "gsn"],
  [/^9GR/i, "9gr"],
  [/^9TC/i, "9tc10"],
  [/^9TN/i, "9tn10"],
  [/^7OG10WS/i, "7og10ws"],
];

export function codeVariants(sku) {
  const codes = skuMatchCodes(sku);
  const out = new Set();
  for (const code of codes) {
    out.add(code);
    out.add(code.replace(/\./g, ""));
    out.add(code.toUpperCase());
  }

  const lettersFirst = [...codes].join(" ").match(/\b([A-Za-z]+)[-.]?0*(\d[\w.-]*)\b/i);
  if (lettersFirst) {
    const letters = lettersFirst[1].toUpperCase();
    const nums = lettersFirst[2];
    const numTrim = nums.replace(/^0+/, "") || nums;
    for (const n of [nums, numTrim, nums.padStart(3, "0")]) {
      out.add(`${letters}${n}`);
      out.add(`${letters} ${n}`);
      out.add(`${letters}-${n}`);
      out.add(`${letters}${n}`.replace(/-/g, ""));
    }
  }

  for (const code of codes) {
    // 7FE20S, 7BE10S → "7FE 20S", "7BE 10S" (inoksan.com başlık formatı)
    const digitSeries = code.match(/^(\d+)([A-Za-z]+)(\d+)([A-Za-z-]*)$/i);
    if (digitSeries) {
      const [, d, letters, num, suffix] = digitSeries;
      const L = letters.toUpperCase();
      const S = (suffix || "").replace(/^-/, "").toUpperCase();
      out.add(`${d}${L}${num}${S}`);
      out.add(`${d}${L}${num}`);
      out.add(`${d}${L} ${num}${S ? S : ""}`);
      out.add(`${d}${L} ${num}${S ? " " + S : ""}`);
      out.add(`${d}${L}-${num}${S ? "-" + S : ""}`);
      if (S === "S") {
        out.add(`${d}${L}${num}`);
        out.add(`${d}${L} ${num}`);
      }
    }

    // BCB100L → BCB100
    const lr = code.match(/^(.+?)([LR])$/i);
    if (lr && lr[1].length >= 4) {
      out.add(lr[1]);
      out.add(lr[1].replace(/-/g, ""));
    }
  }

  return [...out]
    .map((s) => foldTr(s).replace(/\s+/g, " ").trim())
    .filter((s) => s.length >= 3);
}

function extractCodesFromProduct(p) {
  const codes = new Set();
  const push = (raw) => {
    const t = String(raw || "").trim();
    if (t.length < 3) return;
    codes.add(foldTr(t));
    codes.add(foldTr(t.replace(/-/g, "")));
    codes.add(foldTr(t.replace(/\s+/g, "")));
  };

  push(p.title);
  for (const part of String(p.title || "").split(/\s+/)) {
    if (/^[A-Z0-9][A-Z0-9-]{2,}$/i.test(part)) push(part);
  }

  for (const url of p.imgs || []) {
    const normUrl = String(url).replace(/ı/g, "i").replace(/İ/g, "I");
    const base = normUrl.split("/").pop()?.split("?")[0] || "";
    const m1 = base.match(/ino-([A-Z0-9-]+)/i);
    if (m1) push(m1[1]);
    const m2 = normUrl.match(/products\/([^/?#]+)/i);
    if (m2) push(m2[1]);
    const m3 = base.match(/^([A-Z0-9]{3,12})[-_.]/i);
    if (m3) push(m3[1]);
  }

  return codes;
}

/** normalized code → web product (en spesifik kod kazanır) */
/** Web indeksine manuel alias (başlık kodu çıkaramadığı ürünler) */
const WEB_INDEX_ALIASES = {
  bcb: "10288",
  idd: "10633",
  idk: "10635",
  idp: "10634",
  fka011i: "10224",
  gln: "10358",
  glnk: "10359",
  gtn: "10352",
  gsn: "10344",
  "9gr": "10069",
  "9tc10": "10062",
  "9tn10": "10060",
  "7og10ws": "10162",
};

function registerTitlePrefixes(index, p) {
  const title = String(p.title || "");
  const dash = title.match(/^([A-Z0-9]{2,5})\s*[-–/]/i);
  if (dash) {
    const key = foldTr(dash[1].replace(/\s/g, ""));
    if (key.length >= 2) index.set(key, p);
  }
  const spaced = title.match(/^(\d+[A-Z]{2,4})\s+(\d+[A-Z-]*)/i);
  if (spaced) {
    index.set(foldTr(`${spaced[1]}${spaced[2]}`.replace(/\s/g, "")), p);
    index.set(foldTr(`${spaced[1]} ${spaced[2]}`), p);
  }
}

export function buildWebCodeIndex(products) {
  const index = new Map();
  const byId = new Map(products.map((p) => [String(p.id), p]));
  for (const p of products) {
    registerTitlePrefixes(index, p);
    for (const code of extractCodesFromProduct(p)) {
      const prev = index.get(code);
      if (!prev || String(p.title || "").length < String(prev.title || "").length) {
        index.set(code, p);
      }
    }
  }
  for (const [alias, id] of Object.entries(WEB_INDEX_ALIASES)) {
    const p = byId.get(id);
    if (p) index.set(alias, p);
  }
  return index;
}

export function matchInoksanWeb(sku, shortName, products, codeIndex) {
  const vars = codeVariants(sku);
  for (const v of vars) {
    const hit = codeIndex.get(v);
    if (hit) return { product: hit, score: 100, via: "code-index" };
  }

  // ZMD/ZCO paket → modül PDP (aynı ürün sayfası)
  for (const mc of skuMatchCodes(sku)) {
    const bundle = mc.match(/^(ZMD|ZCO|ZBC|BYM)-(.+)$/i);
    if (!bundle) continue;
    const inner = bundle[2];
    for (const v of codeVariants(`INO-${inner}`)) {
      const hit = codeIndex.get(v);
      if (hit) return { product: hit, score: 95, via: "bundle-module" };
    }
  }

  const core = skuCore(sku);
  for (const code of [core, ...skuMatchCodes(sku)]) {
    for (const [re, alias] of SKU_WEB_ALIASES) {
      if (!re.test(code)) continue;
      const hit = codeIndex.get(alias);
      if (hit) return { product: hit, score: 85, via: "family-alias" };
    }
  }

  for (const code of skuMatchCodes(sku)) {
    const pref = code.match(/^([A-Z]{2,4})\d/);
    if (!pref) continue;
    const hit = codeIndex.get(foldTr(pref[1]));
    if (hit) return { product: hit, score: 82, via: "prefix-family" };
  }

  const shortF = foldTr(shortName).replace(/\s+/g, " ").trim();
  const slugCode = foldTr(skuCore(sku));
  let best = null;
  let bestScore = 0;

  for (const p of products) {
    const tf = foldTr(p.title);
    const sf = foldTr(p.slug);
    let score = 0;
    for (const v of vars) {
      if (!v) continue;
      if (tf.includes(v)) score += v.length + 12;
      if (sf.includes(v.replace(/\s+/g, "-"))) score += v.length + 8;
    }
    if (slugCode && sf.includes(slugCode.replace(/\s+/g, "-"))) score += 20;
    if (shortF.length > 8) {
      const chunk = shortF.slice(0, 28);
      if (tf.includes(chunk)) score += 8;
    }
    if (score > bestScore) {
      bestScore = score;
      best = p;
    }
  }

  if (bestScore >= 10) return { product: best, score: bestScore, via: "fuzzy" };
  return null;
}

export function directImageUrls(sku) {
  const codes = skuMatchCodes(sku);
  const exts = [".png", ".jpg"];
  const out = [];
  for (const code of codes) {
    for (const b of [code, `INO-${code}`]) {
      for (const ext of exts) {
        out.push(`https://www.inoksan.com/imagesfolder/products/${b}${ext}`);
      }
    }
    for (const [re, url] of SKU_PREFIX_FALLBACKS) {
      if (re.test(code)) out.push(url);
    }
  }
  return [...new Set(out)];
}

export function isValidImageFile(dest) {
  if (!fs.existsSync(dest)) return false;
  if (fs.statSync(dest).size <= 3000) return false;
  const head = fs.readFileSync(dest, { start: 0, end: 11 });
  if (head[0] === 0xff && head[1] === 0xd8) return true;
  if (head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47) return true;
  return false;
}

export function curlBin(url, dest, dryRun = false) {
  if (dryRun) return false;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const r = spawnSync(
    "curl.exe",
    ["-sL", "--max-time", "20", "-A", UA, "-o", dest, url],
    { stdio: "pipe" },
  );
  if (r.status !== 0 || !isValidImageFile(dest)) {
    try {
      fs.unlinkSync(dest);
    } catch (_) {}
    return false;
  }
  return true;
}

export function imgFileFor(sku, imgDir, row) {
  const series = istifSeriesKey(sku, row);
  if (series) {
    return path.join(imgDir, "istif-v2", `ino-${series}.jpg`);
  }
  return path.join(imgDir, `${slugify(sku)}.jpg`);
}

export function imgRelFor(sku, imgSub, row) {
  const series = istifSeriesKey(sku, row);
  if (series) {
    return `${imgSub}/istif-v2/ino-${series}.jpg`;
  }
  return `${imgSub}/${slugify(sku)}.jpg`;
}

function istifSeriesKey(sku, row) {
  if (row?.dept !== "istif") return "";
  const core = skuCore(sku).replace(/^INO-/i, "");
  const m = core.match(/^(IDD|IDK|IDP)/i);
  return m ? m[1].toLowerCase() : "";
}

/** Web galeri veya imagesfolder — yerel JPG döndürür */
export function downloadInoksanImage(sku, web, imgDir, imgSub, opts = {}) {
  const dryRun = opts.dryRun === true;
  const force = opts.force === true;
  const row = opts.row || null;
  const dest = imgFileFor(sku, imgDir, row);
  if (!force && fs.existsSync(dest) && !isValidImageFile(dest)) {
    try {
      fs.unlinkSync(dest);
    } catch (_) {}
  }
  if (!force && isValidImageFile(dest)) {
    return { rel: imgRelFor(sku, imgSub, row), source: "local" };
  }

  const candidates = [];
  if (web?.imgs?.length) {
    const gallery = [...web.imgs].sort((a, b) => {
      const hero = (u) => (/[_/]0\.(png|jpe?g)/i.test(u) ? 0 : 1);
      return hero(a) - hero(b);
    });
    candidates.push(...gallery);
  }
  candidates.push(...directImageUrls(sku));
  const fb = row ? deptFallbackUrl(row) : null;
  if (fb) candidates.push(fb);

  for (const url of candidates) {
    if (curlBin(url, dest, dryRun)) {
      let source = "imagesfolder";
      if (web?.imgs?.includes(url)) source = "pdp-gallery";
      else if (fb && url === fb) source = "dept-fallback";
      return { rel: imgRelFor(sku, imgSub, row), source, url };
    }
  }

  if (isValidImageFile(dest)) {
    return { rel: imgRelFor(sku, imgSub, row), source: "local" };
  }
  return null;
}

function foldCmp(s) {
  return foldTr(s).replace(/\s+/g, "");
}

/** Web başlığı bu SKU için güvenilir mi? (yalnızca tam model kodu geçiyorsa) */
function webTitleMatchesSku(model, title) {
  if (/L\s*\/\s*R/i.test(title)) return false;
  const wt = foldCmp(title);
  const m = foldCmp(model);
  if (!wt || !m || m.length < 4) return false;
  return wt.includes(m);
}

function excelLabel(row) {
  const raw =
    row?.inoksan_excel_name ||
    String(row?.specs || "").split("\n")[0] ||
    row?.name ||
    "";
  const model = skuCore(row?.sku || "");
  return String(raw)
    .replace(/^İNOKSAN\s+/i, "")
    .replace(/^INOKSAN\s+/i, "")
    .replace(new RegExp(`^${model}\\s*[-–]\\s*`, "i"), "")
    .trim();
}

/** Vitrin başlığı: model kodu + Excel; web yalnızca birebir eşleşmede */
export function inoksanDisplayName(row, web, match) {
  const model = skuCore(row?.sku || "");
  const excel = excelLabel(row);

  const wt = web?.title ? String(web.title).trim() : "";
  if (wt && webTitleMatchesSku(model, wt)) return wt;

  if (excel && foldCmp(excel).includes(foldCmp(model))) return excel;
  if (excel) return `${model} – ${excel}`;
  return model || String(row?.sku || "");
}

export function enrichInoksanRow(row, match, imgResult) {
  const web = match?.product;
  let changed = false;

  row.model = skuCore(row.sku || "");
  row.name = inoksanDisplayName(row, web, match);

  if (web) {
    row.inoksan_web_title = web.title || "";
    row.inoksan_web_id = web.id;
    row.inoksan_slug = web.slug;
    row.inoksan_url = `https://inoksan.com/urun/${web.id}/${web.slug}`;
    row.inoksan_match_via = match.via;
    changed = true;

    const specLines = (web.specs || []).map((s) => `${s.k}: ${s.v}`);
    const tech = [...(row.teknik_ozellikler || [])];
    for (const line of specLines) {
      if (!tech.includes(line)) tech.push(line);
    }
    row.teknik_ozellikler = tech;
    const extra = specLines.length
      ? "\n\nTeknik Özellikler (inoksan.com)\n" + specLines.join("\n")
      : "";
    if (extra && !String(row.specs || "").includes("Teknik Özellikler (inoksan.com)")) {
      row.specs = String(row.specs || "") + extra;
    }
  }

  if (imgResult?.rel) {
    row.images = [imgResult.rel];
    row.inoksan_image_source = imgResult.source;
    if (imgResult.url) row.inoksan_image_url = imgResult.url;
    changed = true;
  }

  if (web || imgResult?.rel) {
    row.inoksan_enriched = true;
    row.inoksan_enriched_at = new Date().toISOString().slice(0, 10);
  }

  row.aciklama = `${row.name}\n\nKategori: ${row.inoksan_h3 || row.category || ""}`;
  return changed;
}
