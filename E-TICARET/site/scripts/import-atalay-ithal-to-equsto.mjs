#!/usr/bin/env node
/**
 * ATALAY 2025 İTHAL.pdf (4 marka) + Cafemarkt zenginleştirme → dept/*.json
 *
 *   python scripts/extract-atalay-ithal-pdf.py
 *   node scripts/import-atalay-ithal-to-equsto.mjs
 *   node scripts/import-atalay-ithal-to-equsto.mjs --dry-run
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchTcmbEurRate } from "./fetch-tcmb-kur.mjs";
import {
  BRAND_SLUGS,
  fetchAllBrandsCache,
  fetchProductDetail,
  normCode,
} from "./lib/cafemarkt-fetch.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const PDF_RAW = path.join(ROOT, "scripts/data/atalay-ithal-pdf-raw.json");
const CAFE_CACHE = path.join(ROOT, "scripts/data/cafemarkt-atalay-ithal.json");
const IMG_OUT = path.join(ROOT, "public/images/catalog/atalay-ithal");
const KAYNAK = "atalay-2025-ithal-pdf";
const SATIS_ORAN = 0.45;
const ISKONTO = 55;
const dryRun = process.argv.includes("--dry-run");
const skipCafeFetch = process.argv.includes("--skip-cafe-fetch");
const skipImages = process.argv.includes("--skip-images");

const tcmb = await fetchTcmbEurRate();
const EUR_TRY = Number(process.env.EQUSTO_EUR_TRY) > 0 ? Number(process.env.EQUSTO_EUR_TRY) : tcmb.rate;

function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

function brandId(brand) {
  return slugify(brand);
}

function modelNeedles(model) {
  const m = String(model || "").trim();
  const out = new Set();
  const add = (s) => {
    const n = normCode(s);
    if (n.length >= 3) out.add(n);
  };
  add(m);
  add(m.replace(/\s+/g, ""));
  add(m.replace(/\s*\/\s*/g, ""));
  add(m.replace(/\s*-\s*/g, ""));
  add(m.split(/\s*-\s*/)[0]);
  const codeLead = m.match(/^(\d{5,7})/);
  if (codeLead) add(codeLead[1]);
  const no = m.match(/^NO\s*(\d+[A-Z]?)/i);
  if (no) add(`NO${no[1]}`);
  const e = m.match(/^(E\d{2})[\s/]*(S|A)?\s*\/?\s*(\d+)?/i);
  if (e) {
    add(`${e[1]}${e[2] || ""}${e[3] || ""}`);
    add(`${e[1]}${e[3] || ""}`);
  }
  const x = m.match(/^(X\d{2}[^\s]*)/i);
  if (x) add(x[1]);
  const mLine = m.match(/\b(M\d{2,3}[A-Z]?)\b/i);
  if (mLine) add(mLine[1]);
  const cb = m.match(/CB\s*[^)]*(\d+x\d+[^)]*)/i);
  if (cb) add(normCode(cb[0]));
  return [...out].sort((a, b) => b.length - a.length);
}

function cafeHaystack(item) {
  return normCode(`${item.name || ""} ${item.code || ""} ${item.url || ""}`);
}

function scoreMatch(pdfModel, cafe) {
  const needles = modelNeedles(pdfModel);
  const hay = cafeHaystack(cafe);
  let best = 0;
  for (const n of needles) {
    if (!hay.includes(n)) continue;
    let sc = n.length;
    if (n.length >= 6) sc += 10;
    if (/^NO\d/.test(n)) sc += 5;
    if (/^\d{6}$/.test(n)) sc += 8;
    if (/^E\d{2}/.test(n)) sc += 4;
    best = Math.max(best, sc);
  }
  return best;
}

function findCafemarktMatch(pdfRow, cafeList) {
  let best = null;
  let bestScore = 0;
  for (const c of cafeList) {
    const sc = scoreMatch(pdfRow.model, c);
    if (sc > bestScore) {
      bestScore = sc;
      best = c;
    }
  }
  return bestScore >= 4 ? best : null;
}

function mapDept(brand, section, name, categoryPath) {
  const s = `${section || ""} ${name || ""} ${categoryPath || ""}`.toLowerCase();
  if (/magistar|kombi fırın|kombi firin|konveksiyon|endüksiyon|enduksiyon|fırın|firin|pişirme|pisirme/i.test(s)) {
    return "pisirme";
  }
  if (/espresso|kahve|degirmen|değirmen|filtre kahve|combi|m100|m200|m110|faema|e61|e71|e98|x20|x30/i.test(s)) {
    return "kahve";
  }
  if (/blender|sıkac|sikac|portakal|meyve|buz kır|rende|mikser|cutter|doğra|dogra|hamur|sebze|patates|prep4|k45|k70|dito/i.test(s)) {
    return "hazirlik";
  }
  if (/bulaşık|bardak yikama|yıkama/i.test(s)) return "yikama";
  if (/buz mak|soğutucu|dondurucu/i.test(s)) return "sogutma";
  if (brand === "Faema") return "kahve";
  if (brand === "Animo") return /filtre|combi|m1|m2|leo|no\s*\d/i.test(s) ? "kahve" : "hazirlik";
  if (brand === "Santos") return "hazirlik";
  return "pisirme";
}

function mapCategory(section, name, cafeCategory) {
  const base = slugify(section || name || cafeCategory || "ithal");
  if (base.length > 3) return base;
  return "ithal-ekipman";
}

function fmtTry(n) {
  return `₺${Math.round(n).toLocaleString("tr-TR")},00`;
}

function pricing(listeEur) {
  const satisEur = Math.round(listeEur * SATIS_ORAN * 100) / 100;
  const netTl = Math.round(satisEur * EUR_TRY);
  const kdvDahil = Math.round(netTl * 1.2);
  return {
    liste_fiyati_eur: listeEur,
    satis_eur_indirimli: satisEur,
    satis_oran: SATIS_ORAN,
    iskonto_oran: ISKONTO,
    fiyat_tl: netTl,
    price: `${fmtTry(kdvDahil)} KDV dahil`,
    fiyat_bekleniyor: false,
  };
}

function buildSpecs(pdf, cafe, detail, pricingFields) {
  const lines = [
    cafe?.name || pdf.model,
    "",
    `Marka: ${pdf.brand}`,
    `Model: ${pdf.model}`,
    pdf.section ? `Kategori (PDF): ${pdf.section}` : "",
    "",
    `Liste fiyatı (EUR): ${pdf.liste_eur}`,
    `Equsto iskonto: %${ISKONTO}`,
    `Equsto satış (EUR): ${pricingFields.satis_eur_indirimli}`,
    `Hesap: liste × ${SATIS_ORAN}`,
    `Equsto satış (TL, KDV dahil): ${pricingFields.price}`,
    `Kur: 1 EUR = ${EUR_TRY} TRY (KDV %20)`,
    `Kaynak fiyat: ${KAYNAK}`,
    cafe?.url ? `Cafemarkt: ${cafe.url}` : "",
  ].filter(Boolean);
  if (detail?.description) {
    lines.push("", "Açıklama", detail.description.replace(/<[^>]+>/g, " ").trim());
  }
  if (detail?.specs?.length) {
    lines.push("", "Teknik Özellikler");
    lines.push(...detail.specs.slice(0, 40));
  } else if (pdf.raw_fields?.length) {
    lines.push("", "Teknik Özellikler (PDF)");
    lines.push(...pdf.raw_fields);
  }
  return lines.join("\n");
}

async function downloadImage(url, destPath) {
  if (!url || dryRun) return false;
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Equsto" } });
    if (!res.ok) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, buf);
    return true;
  } catch {
    return false;
  }
}

function imageRel(brand, model, idx, ext = "jpg") {
  return `images/catalog/atalay-ithal/${slugify(brand)}/${slugify(model)}_${idx}.${ext}`;
}

function isTargetBrandRow(row) {
  const b = String(row.brand || "");
  return ["Animo", "Santos", "Faema", "Dito Sama"].includes(b);
}

function rowId(brand, model) {
  return `${brandId(brand)}__${slugify(model)}`;
}

async function main() {
  if (!fs.existsSync(PDF_RAW)) {
    console.error("Önce: python scripts/extract-atalay-ithal-pdf.py");
    process.exit(1);
  }
  const pdfData = JSON.parse(fs.readFileSync(PDF_RAW, "utf8"));
  const pdfProducts = pdfData.products || [];

  let cafeData;
  if (!skipCafeFetch && (!fs.existsSync(CAFE_CACHE) || process.argv.includes("--refresh-cafe"))) {
    cafeData = await fetchAllBrandsCache(CAFE_CACHE);
  } else {
    cafeData = JSON.parse(fs.readFileSync(CAFE_CACHE, "utf8"));
  }

  const detailCache = new Map();
  const rows = [];
  const unmatched = [];
  const matched = [];

  for (const pdf of pdfProducts) {
    const cafeList = cafeData.byBrand[pdf.brand] || [];
    const cafe = findCafemarktMatch(pdf, cafeList);
    if (!cafe) {
      unmatched.push(pdf);
      continue;
    }

    let detail = detailCache.get(cafe.url);
    if (!detail && cafe.url) {
      detail = await fetchProductDetail(cafe.url);
      detailCache.set(cafe.url, detail);
      await new Promise((r) => setTimeout(r, 280));
    }
    detail = detail || {};

    const sku = detail.supplier_code || detail.sku || cafe.code || pdf.model;
    const name = (detail.name || cafe.name || `${pdf.brand} ${pdf.model}`).trim();
    const priceFields = pricing(pdf.liste_eur);
    const dept = mapDept(pdf.brand, pdf.section, name, detail.category);
    const category = mapCategory(pdf.section, name, detail.category);
    const id = rowId(pdf.brand, pdf.model);

    const images = [];
    const srcImgs = detail.images?.length ? detail.images : cafe.image ? [cafe.image] : [];
    for (let i = 0; i < Math.min(srcImgs.length, 3); i++) {
      const src = srcImgs[i];
      let ext = "jpg";
    try {
      ext = (path.extname(new URL(src).pathname) || ".jpg").replace(".", "") || "jpg";
    } catch {
      ext = "jpg";
    }
      const rel = imageRel(pdf.brand, pdf.model, i + 1, ext === "jpeg" ? "jpg" : ext);
      const abs = path.join(ROOT, "public", rel);
      if (!skipImages) await downloadImage(src, abs);
      images.push(rel);
    }

    const teknik =
      detail.specs?.length > 0
        ? detail.specs.slice(0, 40)
        : (pdf.raw_fields || []).map((x) => String(x));

    rows.push({
      id,
      dept,
      category,
      brand: pdf.brand,
      oem_brand: pdf.brand,
      name,
      ...priceFields,
      specs: buildSpecs(pdf, cafe, detail, priceFields),
      aciklama: detail.description?.replace(/<[^>]+>/g, " ").trim() || name,
      teknik_ozellikler: teknik,
      images: images.length ? images : undefined,
      sku: String(sku).trim(),
      model: pdf.model,
      urun_kodu: String(sku).trim(),
      kaynak: KAYNAK,
      kaynak_fiyat_listesi: KAYNAK,
      kaynak_url: cafe.url || "",
      cafemarkt_url: cafe.url || "",
      cafemarkt_id: cafe.cafemarkt_id || "",
      pdf_page: pdf.page,
      pdf_section: pdf.section || "",
      keywords: [pdf.brand, pdf.model, sku, category].filter(Boolean),
    });
    matched.push({ pdf: pdf.model, cafe: cafe.name?.slice(0, 60), sku });
  }

  const byDept = {};
  for (const row of rows) {
    const d = row.dept || "pisirme";
    if (!byDept[d]) byDept[d] = [];
    byDept[d].push(row);
  }

  if (!dryRun) {
    for (const [dept, add] of Object.entries(byDept)) {
      const deptPath = path.join(ROOT, "public/data/dept", `${dept}.json`);
      let existing = [];
      if (fs.existsSync(deptPath)) {
        existing = JSON.parse(fs.readFileSync(deptPath, "utf8"));
        existing = existing.filter((r) => !(r.kaynak_fiyat_listesi === KAYNAK && isTargetBrandRow(r)));
      }
      const merged = [...existing, ...add];
      fs.writeFileSync(deptPath, JSON.stringify(merged), "utf8");
      console.log("[atalay-ithal-import] dept", dept, "+", add.length, "toplam", merged.length);
    }
  }

  const report = {
    dryRun,
    pdfTotal: pdfProducts.length,
    matched: matched.length,
    unmatched: unmatched.length,
    byDept: Object.fromEntries(Object.entries(byDept).map(([k, v]) => [k, v.length])),
    unmatchedSample: unmatched.slice(0, 30).map((u) => ({ brand: u.brand, model: u.model, eur: u.liste_eur })),
    matchedSample: matched.slice(0, 20),
  };
  const reportPath = path.join(ROOT, "scripts/data/atalay-ithal-import-report.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");
  console.log("[atalay-ithal-import]", JSON.stringify(report, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
