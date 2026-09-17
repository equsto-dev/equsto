#!/usr/bin/env node
/**
 * Fiyatsız katalog satırlarını Cafemarkt / yerel listelerden doldur.
 * Equsto satış = Cafemarkt KDV dahil −%7 (mevcut Portabianco kuralı).
 *
 *   node scripts/apply-gap-prices-from-web.mjs
 *   node scripts/apply-gap-prices-from-web.mjs --skip-fetch
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { fetchTcmbEurRate } from "./fetch-tcmb-kur.mjs";
import {
  CAFE_UA,
  fetchAllBrandProducts,
  parseItemList,
} from "./lib/cafemarkt-fetch.mjs";
import {
  PROSO_XLSX_DEFAULT,
  buildProsoPriceFields,
  loadProsoPriceIndex,
  lookupProsoListPrice,
} from "./lib/proso-display-price-list.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPT_DIR = path.join(ROOT, "public/data/dept");
const OUT_DIR = path.join(ROOT, "scripts/data/catalog-gaps");
const SKIP_FETCH = process.argv.includes("--skip-fetch");
const SKIP_SKU_SEARCH = process.argv.includes("--no-sku-search");
const CM_DISCOUNT = Number(process.env.EQUSTO_CAFE_DISCOUNT || "0.07");
const CM_MULT = 1 - CM_DISCOUNT;
const KDV = Number(process.env.EQUSTO_KDV_ORAN || "20");
const HAVALE = 0.02;

const CM_BRAND_SLUGS = [
  "electrolux-professional",
  "oztiryakiler",
  "portabianco",
  "pimak",
  "sparo",
  "vosco",
  "avatherm",
  "robot-coupe",
  "proso",
  "prosogutma",
];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function norm(s) {
  return String(s || "")
    .toLocaleUpperCase("tr")
    .replace(/İ/g, "I")
    .replace(/[^A-Z0-9]/g, "");
}

function isCaglayan(row) {
  const blob = `${row.brand || ""} ${row.kaynak || ""} ${row.category || ""} ${row.id || ""}`;
  return /çağlayan|caglayan/i.test(blob);
}

function hasPrice(row) {
  if (row.fiyat_bekleniyor) return false;
  return Number(row.fiyat_tl) > 0;
}

function hasImg(row) {
  return Array.isArray(row.images) && String(row.images[0] || "").trim().length > 0;
}

function fmtTry(n) {
  return `₺${Math.round(n).toLocaleString("tr-TR")},00`;
}

function priceFromCafemarkt(cmPrice) {
  const cm = Number(cmPrice);
  if (!(cm > 0)) return null;
  const kdvDahil = Math.round(cm * CM_MULT);
  return { kdvDahil, cm };
}

function applyCafePrice(row, pricing, src) {
  const havaleTl = Math.round(pricing.kdvDahil * (1 - HAVALE));
  row.price = `${fmtTry(pricing.kdvDahil)} KDV dahil`;
  row.fiyat_tl = pricing.kdvDahil;
  row.fiyat_kaynak = src.kaynak || "cafemarkt";
  row.cafemarkt_fiyat_kdv_dahil = pricing.cm;
  row.cafemarkt_indirim_oran = CM_DISCOUNT;
  delete row.fiyat_bekleniyor;
  const lines = String(row.specs || row.name || "").split("\n");
  const head = lines[0] || row.name;
  row.specs = [
    head,
    `Kaynak: ${src.label || "Cafemarkt"}`,
    src.code ? `Model: ${src.code}` : "",
    src.url ? `Cafemarkt: ${src.url}` : "",
    `Kaynak fiyat (KDV dahil): ${fmtTry(pricing.cm)}`,
    `Equsto −%${Math.round(CM_DISCOUNT * 100)} (KDV dahil): ${fmtTry(pricing.kdvDahil)}`,
    `Havale / EFT: %2 indirim → ${fmtTry(havaleTl)}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function robotModelFromYuksel(row) {
  const name = String(row.name || "");
  if (!/robot\s*coupe/i.test(name)) return "";
  const parts = name.split(/[–—-]/).map((s) => s.trim()).filter(Boolean);
  return parts[parts.length - 1] || "";
}

function loadLocalCafeJson(file) {
  const p = path.join(ROOT, "scripts/data", file);
  if (!fs.existsSync(p)) return [];
  const raw = JSON.parse(fs.readFileSync(p, "utf8"));
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.rows)) return raw.rows;
  return [];
}

async function fetchSearch(q) {
  const qs = new URLSearchParams({ q, Arama: q });
  const url = `https://www.cafemarkt.com/arama?${qs}`;
  const res = await fetch(url, {
    headers: { "User-Agent": CAFE_UA, "Accept-Language": "tr-TR,tr;q=0.9" },
  });
  if (!res.ok) return [];
  return parseItemList(await res.text());
}

function indexCafeItems(items) {
  const byNorm = new Map();
  const add = (k, it) => {
    const key = norm(k);
    if (key.length >= 4 && !byNorm.has(key)) byNorm.set(key, it);
  };
  for (const it of items) {
    add(it.code, it);
    add(it.sku, it);
    add(it.cafemarkt_id, it);
    add(it.name, it);
    const code = String(it.code || "");
    const tail = code.split(".").pop();
    if (tail) add(tail, it);
    const six = code.match(/(\d{6})(?:\D|$)/);
    if (six) add(six[1], it);
  }
  return byNorm;
}

function matchCafe(row, cafeIndex, cafeList) {
  const keys = [row.sku, row.model, row.urun_kodu, row.id]
    .map((x) => String(x || "").trim())
    .filter(Boolean);
  for (const raw of keys) {
    const hit =
      cafeIndex.get(norm(raw)) ||
      cafeIndex.get(norm(raw.split(".").pop())) ||
      (/^\d{6}$/.test(raw) ? cafeIndex.get(norm(`171.${raw}`)) : null);
    if (hit?.price_try_kdv_dahil > 0) return hit;
  }
  const robot = robotModelFromYuksel(row);
  if (robot) {
    const rn = norm(robot);
    const hits = cafeList.filter((c) => {
      const n = norm(c.name);
      if (!n.includes(rn)) return false;
      if (/YEDEK|BICAK|ORTAKOL|DISKSETI/.test(n) && !/YEDEK|BICAK/.test(rn)) return false;
      return Number(c.price_try_kdv_dahil) > 0;
    });
    hits.sort((a, b) => norm(a.name).length - norm(b.name).length);
    if (hits[0]) return hits[0];
  }
  const nameN = norm(row.name).slice(0, 24);
  if (nameN.length >= 10) {
    const hits = cafeList.filter((c) => norm(c.name).includes(nameN) && c.price_try_kdv_dahil > 0);
    if (hits.length === 1) return hits[0];
  }
  return null;
}

async function downloadImage(url, destRel) {
  if (!url || !/^https?:\/\//i.test(url)) return null;
  const dest = path.join(ROOT, "public", destRel.replace(/^\//, ""));
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (fs.existsSync(dest) && fs.statSync(dest).size > 800) return destRel.replace(/\\/g, "/");
  const res = await fetch(url, { headers: { "User-Agent": CAFE_UA } });
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 800) return null;
  fs.writeFileSync(dest, buf);
  return destRel.replace(/\\/g, "/");
}

function brandFolder(brand) {
  return String(brand || "diger")
    .toLocaleLowerCase("tr")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

const tcmb = await fetchTcmbEurRate();
const EUR_TRY = tcmb.rate;
console.log(`[gap-prices] EUR/TRY=${EUR_TRY}${tcmb.fallback ? " (fallback)" : ""}`);

const cafeItems = [
  ...loadLocalCafeJson("cafemarkt-portabianco.json"),
  ...loadLocalCafeJson("cafemarkt-robot-coupe.json"),
];

if (!SKIP_FETCH) {
  for (const slug of CM_BRAND_SLUGS) {
    try {
      console.log("[cafemarkt] fetch", slug);
      const items = await fetchAllBrandProducts(slug, 280);
      console.log("  ", items.length);
      cafeItems.push(...items);
      await sleep(400);
    } catch (e) {
      console.warn("[cafemarkt] skip", slug, e?.message || e);
    }
  }
}

let cafeIndex = indexCafeItems(cafeItems);

if (!SKIP_FETCH && !SKIP_SKU_SEARCH) {
  const seedGaps = JSON.parse(
    fs.readFileSync(path.join(OUT_DIR, "remaining-no-price.json"), "utf8"),
  );
  const toSearch = [];
  const seenSku = new Set();
  for (const g of seedGaps) {
    if (/çağlayan|caglayan/i.test(g.brand || "")) continue;
    const fake = { sku: g.sku, model: g.model, name: g.name, id: g.id, urun_kodu: g.sku };
    if (matchCafe(fake, cafeIndex, cafeItems)) continue;
    const q = String(g.sku || "").trim();
    if (q.length < 4 || seenSku.has(norm(q))) continue;
    if (/^EQ-|portabianco-|avatherm-/i.test(q) && q.length > 24) continue;
    seenSku.add(norm(q));
    toSearch.push(q);
  }
  console.log("[cafemarkt] SKU arama", toSearch.length);
  for (const q of toSearch) {
    try {
      const found = await fetchSearch(q);
      for (const hit of found) {
        if (!(Number(hit.price_try_kdv_dahil) > 0)) continue;
        cafeItems.push(hit);
        cafeIndex.set(norm(hit.code), hit);
        cafeIndex.set(norm(q), hit);
      }
    } catch (e) {
      console.warn("[cafemarkt] arama", q, e?.message || e);
    }
    await sleep(220);
  }
  cafeIndex = indexCafeItems(cafeItems);
}

const report = { applied: [], images: [], missed: [], generatedAt: new Date().toISOString() };

let prosoIndex = null;
if (fs.existsSync(PROSO_XLSX_DEFAULT)) {
  try {
    prosoIndex = await loadProsoPriceIndex(PROSO_XLSX_DEFAULT);
    console.log("[proso-xlsx] satır", prosoIndex.size);
  } catch (e) {
    console.warn("[proso-xlsx]", e?.message || e);
  }
}

const deptFiles = fs
  .readdirSync(DEPT_DIR)
  .filter((f) => f.endsWith(".json") && !f.includes("_items.json"));

for (const file of deptFiles) {
  const full = path.join(DEPT_DIR, file);
  const rows = JSON.parse(fs.readFileSync(full, "utf8"));
  if (!Array.isArray(rows)) continue;
  let changed = false;
  for (const row of rows) {
    if (!row || typeof row !== "object" || isCaglayan(row)) continue;
    const sku = String(row.sku || row.model || row.id || "").trim();
    const brand = String(row.brand || "");
    const needPrice = !hasPrice(row);
    const needImg = !hasImg(row);

    if (needPrice && prosoIndex && /proso/i.test(brand)) {
      const hit = lookupProsoListPrice(prosoIndex, row);
      if (hit?.listEur > 0) {
        const patch = buildProsoPriceFields(row, hit.listEur, EUR_TRY);
        Object.assign(row, patch);
        delete row.fiyat_bekleniyor;
        changed = true;
        report.applied.push({ sku, brand, name: row.name, source: "proso-xlsx", fiyat_tl: row.fiyat_tl });
      }
    }

    if (needPrice && !hasPrice(row)) {
      const cm = matchCafe(row, cafeIndex, cafeItems);
      const pricing = cm ? priceFromCafemarkt(cm.price_try_kdv_dahil) : null;
      if (pricing) {
        applyCafePrice(row, pricing, {
          kaynak: "cafemarkt",
          label: "Cafemarkt",
          code: cm.code,
          url: cm.url,
        });
        changed = true;
        report.applied.push({
          sku,
          brand,
          name: row.name,
          source: "cafemarkt",
          fiyat_tl: row.fiyat_tl,
          cm: pricing.cm,
          url: cm.url || "",
        });
      }
    }

    if (needImg && !hasImg(row)) {
      const cm = matchCafe(row, cafeIndex, cafeItems);
      const imgUrl = cm?.image || (Array.isArray(cm?.images) ? cm.images[0] : "");
      if (imgUrl) {
        const ext = /\.webp/i.test(imgUrl) ? "webp" : "jpg";
        const rel = `images/catalog/${brandFolder(brand)}/${norm(sku).slice(0, 40) || "img"}.${ext}`;
        const saved = await downloadImage(imgUrl, rel);
        if (saved) {
          row.images = [saved];
          changed = true;
          report.images.push({ sku, brand, file: saved, url: imgUrl });
        }
      }
    }

    if (!hasPrice(row) && !isCaglayan(row)) {
      report.missed.push({
        sku,
        brand,
        name: String(row.name || ""),
        dept: String(row.dept || path.basename(file, ".json")),
        needImage: !hasImg(row),
      });
    }
  }
  if (changed) {
    const tmp = `${full}.tmp-${process.pid}`;
    fs.writeFileSync(tmp, JSON.stringify(rows), "utf8");
    try {
      fs.unlinkSync(full);
    } catch (_) {}
    fs.renameSync(tmp, full);
    console.log("[gap-prices] yazıldı", file);
  }
}

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(
  path.join(OUT_DIR, "gap-price-apply-report.json"),
  JSON.stringify(
    {
      ...report,
      missed: report.missed.filter((m) => !report.applied.some((a) => a.sku === m.sku && a.brand === m.brand)),
      cafeFetched: cafeItems.length,
      eurTry: EUR_TRY,
    },
    null,
    2,
  ),
  "utf8",
);

console.log(
  `[gap-prices] uygulanan ${report.applied.length} · görsel ${report.images.length} · kaçan ${report.missed.length}`,
);

const rebuilt = spawnSync(process.execPath, ["scripts/rebuild-ekipmanlar-from-dept.mjs"], {
  cwd: ROOT,
  stdio: "inherit",
});
if (rebuilt.status !== 0) process.exit(rebuilt.status || 1);
