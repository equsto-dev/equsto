#!/usr/bin/env node
/**
 * Equsto × Kariyer Mutfak × Cafemarkt — rastgele 50 ürün fiyat tablosu (Şenox)
 *   node scripts/export-equsto-kariyer-cafemarkt-sample.mjs
 *   node scripts/export-equsto-kariyer-cafemarkt-sample.mjs --live
 *   node scripts/export-equsto-kariyer-cafemarkt-sample.mjs --count 50 --seed 42
 */
import ExcelJS from "exceljs";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { candidateKeys } from "./lib/senox-pdf-prices.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPT = path.join(ROOT, "public/data/dept");
const MARKET_CACHE = path.join(ROOT, "scripts/data/senox-multi-market-karsilastirma.json");
const OUT_DIR = path.join(ROOT, "scripts/out");
const OUT_XLSX = path.join(OUT_DIR, "equsto-kariyer-cafemarkt-rastgele-50.xlsx");
const OUT_CSV = path.join(OUT_DIR, "equsto-kariyer-cafemarkt-rastgele-50.csv");
const OUT_JSON = path.join(OUT_DIR, "equsto-kariyer-cafemarkt-rastgele-50.json");

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 EqustoCompare/1.0";

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    count: Number(args.find((a, i) => args[i - 1] === "--count") || 50),
    seed: Number(args.find((a, i) => args[i - 1] === "--seed") || 42),
    live: args.includes("--live"),
  };
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

function equstoPriceDahil(row) {
  const p = String(row.price || "");
  const dahil =
    p.match(/KDV\s*[Dd]ahil[^\d]*([\d.,]+)/i) ||
    p.match(/₺\s*([\d.,]+)[^\n]*KDV\s*[Dd]ahil/i);
  if (dahil) return Math.round(parseTrAmount(dahil[1]));
  if (Number(row.fiyat_tl) > 0) return Math.round(Number(row.fiyat_tl));
  return Math.round(parseTrAmount(p));
}

function extractSku(row) {
  if (row.sku) return String(row.sku).trim();
  const m = String(row.specs || "").match(/Ürün kodu:\s*([^\n]+)/i);
  return m ? m[1].trim() : "";
}

function modelKeyFromSku(sku) {
  const raw = String(sku || "").trim();
  const tail = raw.replace(/^\d+\./, "").replace(/\./g, "");
  return norm(tail || raw);
}

function modelKeyFromRow(row) {
  if (row.model) return norm(row.model);
  return modelKeyFromSku(row.sku);
}

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

function pctDiff(a, b) {
  if (!(a > 0) || !(b > 0)) return null;
  return Math.round(((a - b) / b) * 1000) / 10;
}

function cheapestLabel(prices) {
  const ranked = Object.entries(prices)
    .filter(([, v]) => v != null && v > 0)
    .sort((a, b) => a[1] - b[1]);
  return ranked[0]?.[0] || "";
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(arr, seed) {
  const rnd = mulberry32(seed);
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, "Accept-Language": "tr-TR,tr;q=0.9" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.text();
}

function addToIndex(map, key, item) {
  if (!key) return;
  if (!map.has(key)) map.set(key, []);
  const arr = map.get(key);
  if (!arr.some((x) => x.url === item.url)) arr.push(item);
}

async function loadEqustoSenox() {
  const rows = [];
  for (const f of (await fsp.readdir(DEPT)).sort()) {
    if (!f.endsWith(".json")) continue;
    const arr = JSON.parse(await fsp.readFile(path.join(DEPT, f), "utf8"));
    if (!Array.isArray(arr)) continue;
    for (const r of arr) {
      if (r.kaynak !== "senox-mutbex" && !String(r.id || "").startsWith("senox__")) continue;
      rows.push({ ...r, deptFile: f.replace(".json", "") });
    }
  }
  return rows;
}

function loadMarketFromCache() {
  const kariyer = new Map();
  const cafe = new Map();
  if (!fs.existsSync(MARKET_CACHE)) return { kariyer, cafe };
  const raw = JSON.parse(fs.readFileSync(MARKET_CACHE, "utf8"));
  for (const row of raw.rows || []) {
    const keys = [
      norm(row.key),
      norm(row.model),
      norm(row.sku),
      modelKeyFromSku(row.sku),
      modelKeyFromRow({ model: row.model, sku: row.sku }),
    ];
    if (row.matched?.kariyer && row.prices?.kariyer > 0) {
      const item = {
        priceDahil: row.prices.kariyer,
        url: row.urls?.kariyer,
        sku: row.skus?.kariyer,
        name: row.name,
      };
      for (const k of keys) {
        if (k && !kariyer.has(k)) kariyer.set(k, item);
      }
    }
    if (row.matched?.cafemarkt && row.prices?.cafemarkt > 0) {
      const item = {
        priceDahil: row.prices.cafemarkt,
        url: row.urls?.cafemarkt,
        sku: row.skus?.cafemarkt,
        name: row.name,
      };
      for (const k of keys) {
        if (k && !cafe.has(k)) cafe.set(k, item);
      }
    }
  }
  return { kariyer, cafe };
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
        items.push({
          sku,
          normSku: norm(sku),
          normModel: modelKeyFromSku(sku),
          name: String(p.name || ""),
          priceDahil: Math.round(priceRaw * 100) / 100,
          url: String(p.url || "").replace(/^http:/, "https:"),
        });
      }
    } catch {
      /* ignore */
    }
  }
  return items;
}

async function fetchCafemarktIndex() {
  const byModel = new Map();
  const bySku = new Map();
  const base = "https://www.cafemarkt.com/senox";
  let lastPg = 1;
  for (let pg = 1; pg <= lastPg; pg++) {
    const url = pg > 1 ? `${base}?pg=${pg}` : base;
    console.log(`[cafemarkt] sayfa ${pg}…`);
    const html = await fetchHtml(url);
    if (pg === 1) {
      const lastPgM = html.match(/class="last"[^>]+href="[^"]*pg=(\d+)"/);
      lastPg = lastPgM ? Number(lastPgM[1]) : 1;
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
      priceDahil,
      url: `https://www.kariyermutfak.com${hrefM[1]}`,
    });
  }
  return items;
}

async function fetchKariyerIndex() {
  const byModel = new Map();
  const bySku = new Map();
  const base = "https://www.kariyermutfak.com/senox";
  let lastPg = 1;
  for (let pg = 1; pg <= lastPg; pg++) {
    const url = pg > 1 ? `${base}?sayfa=${pg}` : base;
    console.log(`[kariyer] sayfa ${pg}…`);
    const html = await fetchHtml(url);
    if (pg === 1) {
      const pages = [...html.matchAll(/sayfa=(\d+)/gi)].map((m) => +m[1]);
      lastPg = pages.length ? Math.max(...pages) : 1;
    }
    for (const item of parseKariyerListing(html)) {
      if (item.normModel) addToIndex(byModel, item.normModel, item);
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
    if (hits?.length) return hits.sort((a, b) => a.priceDahil - b.priceDahil)[0];
  }
  return null;
}

function pickFromFlatMap(map, keys) {
  for (const k of keys) {
    const hit = map.get(k);
    if (hit) return hit;
  }
  return null;
}

function pickMarket(hit) {
  if (!hit) return null;
  return {
    priceDahil: Math.round(hit.priceDahil),
    url: hit.url,
    sku: hit.sku || hit.normModel || "",
    name: hit.name,
  };
}

function fmtTry(n) {
  if (!(n > 0)) return "";
  return `₺${Math.round(n).toLocaleString("tr-TR")}`;
}

async function main() {
  const { count, seed, live } = parseArgs();
  console.log(`[sample] hedef: ${count} ürün (seed=${seed})`);

  const equsto = await loadEqustoSenox();

  let kariyerIdx;
  let cafeIdx;
  let useFlat = false;

  if (live) {
    console.log("[canlı] Kariyer + Cafemarkt çekiliyor…");
    kariyerIdx = await fetchKariyerIndex();
    cafeIdx = await fetchCafemarktIndex();
    console.log(`[kariyer] ${kariyerIdx.count} model | [cafemarkt] ${cafeIdx.count} SKU`);
  } else {
    const cache = loadMarketFromCache();
    console.log(`[önbellek] kariyer ${cache.kariyer.size} | cafemarkt ${cache.cafe.size} anahtar`);
    if (cache.kariyer.size < 10 || cache.cafe.size < 20) {
      console.log("[canlı] önbellek yetersiz — sitelerden çekiliyor…");
      kariyerIdx = await fetchKariyerIndex();
      cafeIdx = await fetchCafemarktIndex();
    } else {
      useFlat = true;
      kariyerIdx = cache.kariyer;
      cafeIdx = cache.cafe;
    }
  }

  const triple = [];
  const partial = [];

  for (const row of equsto) {
    const sku = extractSku(row);
    const keys = [...new Set([...candidateKeys(row), modelKeyFromSku(sku), modelKeyFromRow(row), norm(sku)])];
    const eqTl = equstoPriceDahil(row);

    let kariyerHit;
    let cafeHit;
    if (useFlat) {
      kariyerHit = pickFromFlatMap(kariyerIdx, keys);
      cafeHit = pickFromFlatMap(cafeIdx, keys);
    } else {
      kariyerHit =
        pickBestMatch(kariyerIdx.byModel, keys) || pickBestMatch(kariyerIdx.bySku, keys);
      cafeHit = pickBestMatch(cafeIdx.byModel, keys) || pickBestMatch(cafeIdx.bySku, keys);
    }

    const kariyer = pickMarket(kariyerHit);
    const cafe = pickMarket(cafeHit);

    const entry = {
      model: row.model || modelKeyFromSku(sku),
      sku,
      name: row.name,
      equsto_tl: eqTl > 0 ? eqTl : null,
      kariyer_tl: kariyer?.priceDahil ?? null,
      cafemarkt_tl: cafe?.priceDahil ?? null,
      urls: {
        equsto: row.id
          ? `https://equsto.com/shop/${row.dept || row.deptFile}/${row.id}`
          : null,
        kariyer: kariyer?.url ?? null,
        cafemarkt: cafe?.url ?? null,
      },
      codes: {
        equsto: sku,
        kariyer: kariyer?.sku ?? null,
        cafemarkt: cafe?.sku ?? null,
      },
    };

    const prices = {
      equsto: entry.equsto_tl,
      kariyer: entry.kariyer_tl,
      cafemarkt: entry.cafemarkt_tl,
    };
    entry.en_ucuz = cheapestLabel(prices);
    entry.eq_vs_kariyer_pct = pctDiff(entry.equsto_tl, entry.kariyer_tl);
    entry.eq_vs_cafe_pct = pctDiff(entry.equsto_tl, entry.cafemarkt_tl);

    if (entry.equsto_tl && entry.kariyer_tl && entry.cafemarkt_tl) {
      triple.push(entry);
    } else if (entry.equsto_tl && (entry.kariyer_tl || entry.cafemarkt_tl)) {
      partial.push(entry);
    }
  }

  console.log(`[eşleşme] üçlü: ${triple.length}, kısmi: ${partial.length}, equsto: ${equsto.length}`);

  let pool = triple;
  if (pool.length < count) {
    console.warn(`[uyarı] üçlü eşleşme ${pool.length} < ${count}; kısmi ile tamamlanıyor`);
    pool = [...triple, ...partial];
  }

  const sample = shuffle(pool, seed).slice(0, Math.min(count, pool.length));

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const payload = {
    generated_at: new Date().toISOString(),
    seed,
    live_scrape: live || !useFlat,
    requested: count,
    sample_size: sample.length,
    pool_triple: triple.length,
    pool_partial: partial.length,
    equsto_total: equsto.length,
    note:
      "Fiyatlar KDV dahil TRY. Kariyer: liste×1.2. Cafemarkt: JSON-LD total_sale_price. eq_vs_* pozitif = Equsto daha pahalı.",
    rows: sample,
  };
  fs.writeFileSync(OUT_JSON, JSON.stringify(payload, null, 2), "utf8");

  const csvHeader =
    "no,model,sku,urun,equsto_tl,kariyer_tl,cafemarkt_tl,en_ucuz,eq_vs_kariyer_pct,eq_vs_cafe_pct,equsto_url,kariyer_url,cafemarkt_url";
  const csvLines = sample.map((r, i) =>
    [
      i + 1,
      r.model,
      r.sku,
      `"${String(r.name).replace(/"/g, '""')}"`,
      r.equsto_tl ?? "",
      r.kariyer_tl ?? "",
      r.cafemarkt_tl ?? "",
      r.en_ucuz,
      r.eq_vs_kariyer_pct ?? "",
      r.eq_vs_cafe_pct ?? "",
      r.urls.equsto ?? "",
      r.urls.kariyer ?? "",
      r.urls.cafemarkt ?? "",
    ].join(","),
  );
  fs.writeFileSync(OUT_CSV, [csvHeader, ...csvLines].join("\n"), "utf8");

  const wb = new ExcelJS.Workbook();
  wb.creator = "Equsto";
  wb.created = new Date();
  const ws = wb.addWorksheet("Rastgele 50", { views: [{ state: "frozen", ySplit: 1 }] });

  ws.columns = [
    { header: "#", key: "no", width: 5 },
    { header: "Model", key: "model", width: 12 },
    { header: "SKU", key: "sku", width: 16 },
    { header: "Ürün", key: "name", width: 42 },
    { header: "Equsto (TL)", key: "equsto_tl", width: 14 },
    { header: "Kariyer (TL)", key: "kariyer_tl", width: 14 },
    { header: "Cafemarkt (TL)", key: "cafemarkt_tl", width: 16 },
    { header: "En ucuz", key: "en_ucuz", width: 11 },
    { header: "Eq vs Kariyer %", key: "eq_vs_kariyer_pct", width: 14 },
    { header: "Eq vs Cafe %", key: "eq_vs_cafe_pct", width: 13 },
    { header: "Equsto URL", key: "equsto_url", width: 36 },
    { header: "Kariyer URL", key: "kariyer_url", width: 36 },
    { header: "Cafemarkt URL", key: "cafemarkt_url", width: 36 },
  ];

  const headerRow = ws.getRow(1);
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1A1A1A" } };
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };

  sample.forEach((r, i) => {
    const row = ws.addRow({
      no: i + 1,
      model: r.model,
      sku: r.sku,
      name: r.name,
      equsto_tl: r.equsto_tl,
      kariyer_tl: r.kariyer_tl,
      cafemarkt_tl: r.cafemarkt_tl,
      en_ucuz: r.en_ucuz,
      eq_vs_kariyer_pct: r.eq_vs_kariyer_pct,
      eq_vs_cafe_pct: r.eq_vs_cafe_pct,
      equsto_url: r.urls.equsto,
      kariyer_url: r.urls.kariyer,
      cafemarkt_url: r.urls.cafemarkt,
    });
    ["equsto_tl", "kariyer_tl", "cafemarkt_tl"].forEach((k) => {
      row.getCell(k).numFmt = '#,##0" ₺"';
    });
    ["eq_vs_kariyer_pct", "eq_vs_cafe_pct"].forEach((k) => {
      const cell = row.getCell(k);
      if (cell.value != null) cell.numFmt = '0.0"%"';
    });
    for (const col of [11, 12, 13]) {
      const cell = row.getCell(col);
      if (cell.value) {
        cell.value = { text: String(cell.value), hyperlink: String(cell.value) };
        cell.font = { color: { argb: "FF0563C1" }, underline: true };
      }
    }
  });

  const sum = wb.addWorksheet("Özet");
  sum.addRow(["Üretim", payload.generated_at]);
  sum.addRow(["Seed", seed]);
  sum.addRow(["Canlı çekim", payload.live_scrape ? "evet" : "hayır (önbellek)"]);
  sum.addRow(["Örneklem", sample.length]);
  sum.addRow(["Üçlü eşleşme havuzu", triple.length]);
  sum.addRow(["Equsto Şenox toplam", equsto.length]);
  sum.addRow([]);
  sum.addRow(["Not", payload.note]);

  await wb.xlsx.writeFile(OUT_XLSX);

  console.log("\n=== ÖRNEKLEM (ilk 5) ===");
  for (const r of sample.slice(0, 5)) {
    console.log(
      `${r.model || r.sku}: Eq ${fmtTry(r.equsto_tl)} | Kar ${fmtTry(r.kariyer_tl)} | Cafe ${fmtTry(r.cafemarkt_tl)} → ${r.en_ucuz}`,
    );
  }
  console.log(`\n→ ${OUT_XLSX}`);
  console.log(`→ ${OUT_CSV}`);
  console.log(`→ ${OUT_JSON}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
