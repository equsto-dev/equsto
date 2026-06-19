#!/usr/bin/env node
/**
 * Şenox çoklu pazar fiyat karşılaştırması — Equsto · Kariyer Mutfak · Cafemarkt
 *
 *   node scripts/compare-senox-multi-market.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = path.join(ROOT, "public/data/ekipmanlar.json");
const OUT_JSON = path.join(ROOT, "scripts/data/senox-multi-market-karsilastirma.json");

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 EqustoCompare/1.0";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function norm(s) {
  return String(s || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function parseTrAmount(s) {
  const raw = String(s || "")
    .replace(/[^\d.,]/g, "")
    .trim();
  if (!raw) return 0;
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(raw)) {
    return parseFloat(raw.replace(/\./g, "").replace(",", ".")) || 0;
  }
  return parseFloat(raw.replace(",", ".")) || 0;
}

/** Equsto katalog — fiyat_tl veya price alanından KDV dahil TRY */
function equstoPriceDahil(row) {
  const p = String(row.price || "");
  const dahil =
    p.match(/KDV\s*[Dd]ahil[^\d]*([\d.,]+)/i) ||
    p.match(/₺\s*([\d.,]+)[^\n]*KDV\s*[Dd]ahil/i);
  if (dahil) return parseTrAmount(dahil[1]);
  if (Number(row.fiyat_tl) > 0) return Math.round(Number(row.fiyat_tl) * 100) / 100;
  return parseTrAmount(p);
}

function extractSku(row) {
  if (row.sku) return String(row.sku).trim();
  const m = String(row.specs || "").match(/Ürün kodu:\s*([^\n]+)/i);
  return m ? m[1].trim() : "";
}

/** SKU'dan model anahtarı: 118.BL25 → BL25, 231.VM.01 → VM01 */
function modelKeyFromSku(sku) {
  const raw = String(sku || "").trim();
  const tail = raw.replace(/^\d+\./, "").replace(/\./g, "");
  return norm(tail || raw);
}

function modelKeyFromRow(row) {
  if (row.model) return norm(row.model);
  return modelKeyFromSku(row.sku);
}

/** Başlıktan model kodu çıkar (BBC-150, MS07, FLT120, VM 01 …) */
function modelKeyFromTitle(title) {
  const t = String(title || "");
  const patterns = [
    /\b([A-Z]{2,}[\-\s]?\d{1,4}[A-Z]{0,3})\s*$/i,
    /\b([A-Z]{2,}\d{2,}[A-Z]{0,4})\b/i,
    /Senox\s+([A-Z]{2,}[\s\-]?\d+)/i,
  ];
  for (const re of patterns) {
    const m = t.match(re);
    if (m) return norm(m[1]);
  }
  return "";
}

function addToIndex(map, key, item) {
  if (!key) return;
  if (!map.has(key)) map.set(key, []);
  const arr = map.get(key);
  if (!arr.some((x) => x.url === item.url)) arr.push(item);
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, "Accept-Language": "tr-TR,tr;q=0.9" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.text();
}

function parseCafeItemList(html) {
  const items = [];
  for (const block of html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi) || []) {
    const inner = block.replace(/<\/?script[^>]*>/gi, "");
    try {
      const data = JSON.parse(inner);
      if (data["@type"] !== "ItemList" || !data.itemListElement) continue;
      for (const li of data.itemListElement) {
        const p = li.item || {};
        if (p["@type"] !== "Product") continue;
        const sku = String(p.sku || "").trim();
        const priceRaw = parseFloat(String(p.offers?.price || "0"));
        if (!(priceRaw > 0)) continue;
        // Cafemarkt JSON-LD price = total_sale_price (KDV dahil) — PRODUCT_DATA ile doğrulandı
        const priceDahil = Math.round(priceRaw * 100) / 100;
        const priceHaric = Math.round((priceDahil / 1.2) * 100) / 100;
        items.push({
          sku,
          normSku: norm(sku),
          normModel: modelKeyFromSku(sku),
          name: String(p.name || ""),
          priceHaric,
          priceDahil,
          url: String(p.url || "").replace(/^http:/, "https:"),
          source: "cafemarkt",
        });
      }
    } catch {
      /* ignore */
    }
  }
  return items;
}

async function fetchCafemarktAll() {
  const base = "https://www.cafemarkt.com/senox";
  const byModel = new Map();
  const bySku = new Map();
  let lastPg = 1;

  for (let pg = 1; pg <= lastPg; pg++) {
    const url = pg > 1 ? `${base}?pg=${pg}` : base;
    console.log(`[cafemarkt] sayfa ${pg}…`);
    const html = await fetchHtml(url);
    if (pg === 1) {
      const lastPgM = html.match(/class="last"[^>]+href="[^"]*pg=(\d+)"/);
      lastPg = lastPgM ? Number(lastPgM[1]) : 1;
      console.log(`[cafemarkt] toplam ${lastPg} sayfa`);
    }
    for (const item of parseCafeItemList(html)) {
      addToIndex(bySku, item.normSku, item);
      addToIndex(byModel, item.normModel, item);
    }
    if (pg < lastPg) await sleep(350);
  }
  return { byModel, bySku, count: bySku.size };
}

function parseKariyerListing(html) {
  const items = [];
  const blocks = html.split(/<div class="productDetail videoAutoPlay"/i).slice(1);
  for (const block of blocks) {
    const hrefM = block.match(/href='(\/senox-[^']+)'/i);
    const titleM =
      block.match(/class="productName[^"]*"[^>]*>[\s\S]*?title="([^"]+)"/i) ||
      block.match(/class="productName[^"]*"[^>]*>[\s\S]*?<a[^>]*>([^<]+)</i);
    const priceM = block.match(/discountPriceSpan[^>]*>\s*₺([^<]+)/i);
    if (!hrefM || !priceM) continue;
    const title = (titleM?.[1] || "").trim();
    const priceHaric = parseTrAmount(priceM[1]);
    if (!(priceHaric > 0)) continue;
    const priceDahil = Math.round(priceHaric * 1.2 * 100) / 100;
    const normModel = modelKeyFromTitle(title);
    items.push({
      sku: "",
      normSku: "",
      normModel,
      name: title,
      priceHaric,
      priceDahil,
      url: `https://www.kariyermutfak.com${hrefM[1]}`,
      source: "kariyer",
    });
  }
  return items;
}

async function fetchKariyerAll() {
  const base = "https://www.kariyermutfak.com/senox";
  const byModel = new Map();
  const bySku = new Map();
  let lastPg = 1;

  for (let pg = 1; pg <= lastPg; pg++) {
    const url = pg > 1 ? `${base}?sayfa=${pg}` : base;
    console.log(`[kariyer] sayfa ${pg}…`);
    const html = await fetchHtml(url);
    if (pg === 1) {
      const pages = [...html.matchAll(/sayfa=(\d+)/gi)].map((m) => +m[1]);
      lastPg = pages.length ? Math.max(...pages) : 1;
      console.log(`[kariyer] toplam ${lastPg} sayfa`);
    }
    for (const item of parseKariyerListing(html)) {
      if (item.normModel) addToIndex(byModel, item.normModel, item);
      // başlıktan çıkarılan kodları sku index'e de ekle
      addToIndex(bySku, item.normModel, item);
    }
    if (pg < lastPg) await sleep(400);
  }
  return { byModel, bySku, count: byModel.size };
}

function pickBestMatch(indexMap, keys) {
  for (const key of keys) {
    if (!key) continue;
    const hits = indexMap.get(key);
    if (hits?.length) {
      return hits.sort((a, b) => a.priceDahil - b.priceDahil)[0];
    }
  }
  return null;
}

function loadEqustoSenox() {
  const catalog = JSON.parse(fs.readFileSync(CATALOG, "utf8"));
  return catalog.filter(
    (r) =>
      /senox|şenox/i.test(String(r.brand || "")) ||
      String(r.id || "").startsWith("senox__"),
  );
}

function pctDiff(a, b) {
  if (!(a > 0) || !(b > 0)) return null;
  return Math.round(((a - b) / b) * 1000) / 10;
}

function cheapestSite(prices) {
  const ranked = Object.entries(prices)
    .filter(([, v]) => v != null && v > 0)
    .sort((a, b) => a[1] - b[1]);
  return ranked[0]?.[0] || null;
}

async function main() {
  console.log("[equsto] katalog yükleniyor…");
  const equstoRows = loadEqustoSenox();
  console.log(`[equsto] ${equstoRows.length} Şenox ürün`);

  const cafe = await fetchCafemarktAll();
  console.log(`[cafemarkt] ${cafe.count} benzersiz SKU`);

  const kariyer = await fetchKariyerAll();
  console.log(`[kariyer] ${kariyer.count} benzersiz model`);

  const rows = [];
  const seenKeys = new Set();

  for (const row of equstoRows) {
    const sku = extractSku(row);
    const normSku = norm(sku);
    const normModel = modelKeyFromRow(row);
    const eqDahil = equstoPriceDahil(row);
    const matchKeys = [...new Set([normModel, normSku, modelKeyFromSku(sku)])];

    const cafeHit = pickBestMatch(cafe.byModel, matchKeys) || pickBestMatch(cafe.bySku, matchKeys);
    const kariyerHit =
      pickBestMatch(kariyer.byModel, matchKeys) || pickBestMatch(kariyer.bySku, matchKeys);

    const prices = {
      equsto: eqDahil > 0 ? eqDahil : null,
      kariyer: kariyerHit?.priceDahil ?? null,
      cafemarkt: cafeHit?.priceDahil ?? null,
    };
    const cheapest = cheapestSite(prices);
    const withCompetitor = [prices.kariyer, prices.cafemarkt].filter((p) => p > 0);
    const minComp = withCompetitor.length ? Math.min(...withCompetitor) : null;

    rows.push({
      key: normModel || normSku,
      model: row.model || modelKeyFromSku(sku),
      sku,
      name: row.name,
      equsto_kod: row.equsto_kod || null,
      in_equsto: true,
      prices,
      urls: {
        equsto: row.id ? `https://equsto.com/urun/${row.id}` : "https://equsto.com/arama?q=şenox",
        kariyer: kariyerHit?.url ?? null,
        cafemarkt: cafeHit?.url ?? null,
      },
      skus: {
        equsto: sku,
        kariyer: kariyerHit?.sku || kariyerHit?.normModel || null,
        cafemarkt: cafeHit?.sku ?? null,
      },
      matched: {
        kariyer: !!kariyerHit,
        cafemarkt: !!cafeHit,
      },
      diff_pct: {
        equsto_vs_kariyer: pctDiff(eqDahil, prices.kariyer),
        equsto_vs_cafemarkt: pctDiff(eqDahil, prices.cafemarkt),
      },
      cheapest,
      equsto_cheapest:
        eqDahil > 0 && minComp != null ? eqDahil <= minComp + 1 : null,
    });
    seenKeys.add(normModel || normSku);
  }

  // Cafemarkt'ta olup Equsto'da olmayan ürünler
  for (const [normModelKey, hits] of cafe.byModel) {
    if (seenKeys.has(normModelKey)) continue;
    const cafeHit = hits.sort((a, b) => a.priceDahil - b.priceDahil)[0];
    const kariyerHit = pickBestMatch(kariyer.byModel, [normModelKey]);
    const prices = {
      equsto: null,
      kariyer: kariyerHit?.priceDahil ?? null,
      cafemarkt: cafeHit.priceDahil,
    };
    rows.push({
      key: normModelKey,
      model: normModelKey,
      sku: cafeHit.sku,
      name: cafeHit.name,
      equsto_kod: null,
      in_equsto: false,
      prices,
      urls: {
        equsto: null,
        kariyer: kariyerHit?.url ?? null,
        cafemarkt: cafeHit.url,
      },
      skus: {
        equsto: null,
        kariyer: kariyerHit?.normModel || null,
        cafemarkt: cafeHit.sku,
      },
      matched: { kariyer: !!kariyerHit, cafemarkt: true },
      diff_pct: { equsto_vs_kariyer: null, equsto_vs_cafemarkt: null },
      cheapest: cheapestSite(prices),
      equsto_cheapest: null,
    });
  }

  rows.sort((a, b) => String(a.model).localeCompare(String(b.model), "tr"));

  const equstoWithPrice = rows.filter((r) => r.in_equsto && r.prices.equsto > 0);
  const matchedKariyer = equstoWithPrice.filter((r) => r.matched.kariyer);
  const matchedCafe = equstoWithPrice.filter((r) => r.matched.cafemarkt);
  const matchedBoth = equstoWithPrice.filter((r) => r.matched.kariyer && r.matched.cafemarkt);
  const equstoCheapestKariyer = matchedKariyer.filter((r) => r.equsto_cheapest === true);
  const equstoCheapestCafe = matchedCafe.filter((r) => r.equsto_cheapest === true);
  const equstoCheapestAny = equstoWithPrice.filter((r) => r.equsto_cheapest === true);

  const avgPct = (field, subset) => {
    const vals = subset.map((r) => r.diff_pct[field]).filter((v) => v != null);
    if (!vals.length) return null;
    return Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10;
  };

  const summary = {
    generated_at: new Date().toISOString(),
    equsto_count: equstoRows.length,
    cafemarkt_scraped_skus: cafe.count,
    kariyer_scraped_models: kariyer.count,
    total_rows: rows.length,
    equsto_with_price: equstoWithPrice.length,
    matched_kariyer: matchedKariyer.length,
    matched_cafemarkt: matchedCafe.length,
    matched_both: matchedBoth.length,
    cafe_only_rows: rows.filter((r) => !r.in_equsto).length,
    equsto_cheapest_vs_kariyer: equstoCheapestKariyer.length,
    equsto_cheapest_vs_cafemarkt: equstoCheapestCafe.length,
    equsto_cheapest_vs_any_competitor: equstoCheapestAny.length,
    equsto_cheapest_pct_of_matched:
      matchedBoth.length > 0
        ? Math.round((equstoCheapestAny.filter((r) => r.matched.kariyer && r.matched.cafemarkt).length / matchedBoth.length) * 1000) / 10
        : null,
    avg_equsto_vs_kariyer_pct: avgPct("equsto_vs_kariyer", matchedKariyer),
    avg_equsto_vs_cafemarkt_pct: avgPct("equsto_vs_cafemarkt", matchedCafe),
    note: "Negatif % = Equsto daha ucuz. Cafemarkt JSON-LD fiyatı KDV dahil (total_sale_price). Kariyer liste fiyatı +KDV → ×1.2.",
  };

  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify({ summary, rows }, null, 2), "utf8");
  console.log("\n=== ÖZET ===");
  console.log(JSON.stringify(summary, null, 2));
  console.log(`\n→ ${OUT_JSON}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
