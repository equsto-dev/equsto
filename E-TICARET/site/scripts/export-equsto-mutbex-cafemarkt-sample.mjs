#!/usr/bin/env node
/**
 * Equsto × Mutbex × Cafemarkt — rastgele 50 ürün fiyat tablosu (Şenox)
 *   node scripts/export-equsto-mutbex-cafemarkt-sample.mjs
 *   node scripts/export-equsto-mutbex-cafemarkt-sample.mjs --live-cafe
 *   node scripts/export-equsto-mutbex-cafemarkt-sample.mjs --count 50 --seed 42
 */
import ExcelJS from "exceljs";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  candidateKeys,
  findMutbexListPrice,
  loadMutbexCatalog,
  normSenoxKey,
} from "./lib/senox-pdf-prices.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPT = path.join(ROOT, "public/data/dept");
const CAFE_CACHE = path.join(ROOT, "scripts/data/senox-multi-market-karsilastirma.json");
const OUT_DIR = path.join(ROOT, "scripts/out");
const OUT_XLSX = path.join(OUT_DIR, "equsto-mutbex-cafemarkt-rastgele-50.xlsx");
const OUT_CSV = path.join(OUT_DIR, "equsto-mutbex-cafemarkt-rastgele-50.csv");
const OUT_JSON = path.join(OUT_DIR, "equsto-mutbex-cafemarkt-rastgele-50.json");

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 EqustoCompare/1.0";

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    count: Number(args.find((a, i) => args[i - 1] === "--count") || 50),
    seed: Number(args.find((a, i) => args[i - 1] === "--seed") || 42),
    liveCafe: args.includes("--live-cafe"),
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

/** Deterministik shuffle (mulberry32) */
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

function buildMutbexProductByKey(products) {
  const map = new Map();
  for (const p of products) {
    for (const k of [
      normSenoxKey(p.model),
      normSenoxKey(p.mutbexCode),
      normSenoxKey(String(p.mutbexCode || "").replace(/\./g, "")),
    ]) {
      if (k && !map.has(k)) map.set(k, p);
    }
  }
  return map;
}

function loadCafeFromCache() {
  if (!fs.existsSync(CAFE_CACHE)) return new Map();
  const raw = JSON.parse(fs.readFileSync(CAFE_CACHE, "utf8"));
  const map = new Map();
  for (const row of raw.rows || []) {
    if (!row.matched?.cafemarkt || !(row.prices?.cafemarkt > 0)) continue;
    const keys = [norm(row.key), norm(row.model), norm(row.sku), modelKeyFromSku(row.sku)];
    for (const k of keys) {
      if (k && !map.has(k)) {
        map.set(k, {
          priceDahil: row.prices.cafemarkt,
          url: row.urls?.cafemarkt || null,
          sku: row.skus?.cafemarkt || row.sku,
          name: row.name,
        });
      }
    }
  }
  return map;
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
        const priceDahil = Math.round(priceRaw * 100) / 100;
        const normModel = modelKeyFromSku(sku);
        items.push({
          sku,
          normSku: norm(sku),
          normModel,
          name: String(p.name || ""),
          priceDahil,
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
  const map = new Map();
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
      for (const k of [item.normModel, item.normSku]) {
        if (k && !map.has(k)) map.set(k, item);
      }
    }
    if (pg < lastPg) await sleep(350);
  }
  return map;
}

function pickCafe(cafeMap, keys) {
  for (const k of keys) {
    const hit = cafeMap.get(k);
    if (hit) return hit;
  }
  return null;
}

function pickMutbex(mutByKey, mutIndex, row) {
  const ref = { model: row.model, mutbexCode: row.sku, sku: row.sku, urun_kodu: row.urun_kodu };
  const priceHit = findMutbexListPrice(ref, mutIndex);
  if (!priceHit) return null;
  const prod =
    mutByKey.get(normSenoxKey(priceHit.matchKey)) ||
    mutByKey.get(normSenoxKey(priceHit.mutbexCode)) ||
    mutByKey.get(normSenoxKey(priceHit.model));
  const tryPrice = Math.round(Number(prod?.priceTryList || prod?.priceTry || 0));
  if (!(tryPrice > 0)) return null;
  return {
    priceDahil: tryPrice,
    url: prod?.url || null,
    sku: prod?.mutbexCode || priceHit.mutbexCode,
    model: prod?.model || priceHit.model,
    listeEur: priceHit.listeEur,
    satisEur: priceHit.satisEur,
  };
}

function fmtTry(n) {
  if (!(n > 0)) return "";
  return `₺${Math.round(n).toLocaleString("tr-TR")}`;
}

function fmtPct(n) {
  if (n == null) return "";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n}%`;
}

async function main() {
  const { count, seed, liveCafe } = parseArgs();
  console.log(`[sample] hedef: ${count} ürün (seed=${seed})`);

  const equsto = await loadEqustoSenox();
  const mutCat = loadMutbexCatalog();
  const mutByKey = buildMutbexProductByKey(mutCat.products);

  let cafeMap;
  if (liveCafe) {
    console.log("[cafemarkt] canlı çekiliyor…");
    cafeMap = await fetchCafemarktIndex();
  } else {
    cafeMap = loadCafeFromCache();
    console.log(`[cafemarkt] önbellek: ${cafeMap.size} eşleşme anahtarı`);
    if (cafeMap.size < 20) {
      console.log("[cafemarkt] önbellek zayıf — canlı çekiliyor…");
      cafeMap = await fetchCafemarktIndex();
    }
  }

  const triple = [];
  const partial = [];

  for (const row of equsto) {
    const sku = extractSku(row);
    const keys = [...new Set([...candidateKeys(row), modelKeyFromSku(sku), norm(sku)])];
    const eqTl = equstoPriceDahil(row);
    const mut = pickMutbex(mutByKey, mutCat.index, row);
    const cafe = pickCafe(cafeMap, keys);

    const entry = {
      model: row.model || mut?.model || "",
      sku,
      name: row.name,
      equsto_tl: eqTl > 0 ? eqTl : null,
      mutbex_tl: mut?.priceDahil ?? null,
      cafemarkt_tl: cafe?.priceDahil ?? null,
      equsto_eur_satis: row.satis_fiyati_eur ?? null,
      mutbex_eur_satis: mut?.satisEur ?? null,
      urls: {
        equsto: row.id ? `https://equsto.com/shop/${row.dept || row.deptFile}/${row.id}` : null,
        mutbex: mut?.url ?? row.mutbex_url ?? null,
        cafemarkt: cafe?.url ?? null,
      },
      codes: {
        equsto: sku,
        mutbex: mut?.sku ?? null,
        cafemarkt: cafe?.sku ?? null,
      },
      matched: {
        equsto: eqTl > 0,
        mutbex: !!mut,
        cafemarkt: !!cafe,
      },
    };

    const prices = {
      equsto: entry.equsto_tl,
      mutbex: entry.mutbex_tl,
      cafemarkt: entry.cafemarkt_tl,
    };
    entry.en_ucuz = cheapestLabel(prices);
    entry.eq_vs_mut_pct = pctDiff(entry.equsto_tl, entry.mutbex_tl);
    entry.eq_vs_cafe_pct = pctDiff(entry.equsto_tl, entry.cafemarkt_tl);

    if (entry.equsto_tl && entry.mutbex_tl && entry.cafemarkt_tl) {
      triple.push(entry);
    } else if (entry.equsto_tl && (entry.mutbex_tl || entry.cafemarkt_tl)) {
      partial.push(entry);
    }
  }

  console.log(`[eşleşme] üçlü: ${triple.length}, kısmi: ${partial.length}, equsto: ${equsto.length}`);

  let pool = triple;
  if (pool.length < count) {
    console.warn(`[uyarı] üçlü eşleşme ${pool.length} < ${count}; kısmi eşleşmelerle tamamlanıyor`);
    pool = [...triple, ...partial.filter((p) => !triple.includes(p))];
  }

  const sample = shuffle(pool, seed).slice(0, Math.min(count, pool.length));

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const payload = {
    generated_at: new Date().toISOString(),
    seed,
    requested: count,
    sample_size: sample.length,
    pool_triple: triple.length,
    pool_partial: partial.length,
    equsto_total: equsto.length,
    note: "Fiyatlar KDV dahil TRY. eq_vs_* pozitif = Equsto daha pahalı.",
    rows: sample,
  };
  fs.writeFileSync(OUT_JSON, JSON.stringify(payload, null, 2), "utf8");

  const csvHeader =
    "no,model,sku,urun,equsto_tl,mutbex_tl,cafemarkt_tl,en_ucuz,eq_vs_mut_pct,eq_vs_cafe_pct,equsto_url,mutbex_url,cafemarkt_url";
  const csvLines = sample.map((r, i) =>
    [
      i + 1,
      r.model,
      r.sku,
      `"${String(r.name).replace(/"/g, '""')}"`,
      r.equsto_tl ?? "",
      r.mutbex_tl ?? "",
      r.cafemarkt_tl ?? "",
      r.en_ucuz,
      r.eq_vs_mut_pct ?? "",
      r.eq_vs_cafe_pct ?? "",
      r.urls.equsto ?? "",
      r.urls.mutbex ?? "",
      r.urls.cafemarkt ?? "",
    ].join(","),
  );
  fs.writeFileSync(OUT_CSV, [csvHeader, ...csvLines].join("\n"), "utf8");

  const wb = new ExcelJS.Workbook();
  wb.creator = "Equsto";
  wb.created = new Date();
  const ws = wb.addWorksheet("Rastgele 50", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  ws.columns = [
    { header: "#", key: "no", width: 5 },
    { header: "Model", key: "model", width: 12 },
    { header: "SKU", key: "sku", width: 16 },
    { header: "Ürün", key: "name", width: 42 },
    { header: "Equsto (TL)", key: "equsto_tl", width: 14 },
    { header: "Mutbex (TL)", key: "mutbex_tl", width: 14 },
    { header: "Cafemarkt (TL)", key: "cafemarkt_tl", width: 16 },
    { header: "En ucuz", key: "en_ucuz", width: 11 },
    { header: "Eq vs Mut %", key: "eq_vs_mut_pct", width: 12 },
    { header: "Eq vs Cafe %", key: "eq_vs_cafe_pct", width: 13 },
    { header: "Equsto URL", key: "equsto_url", width: 36 },
    { header: "Mutbex URL", key: "mutbex_url", width: 36 },
    { header: "Cafemarkt URL", key: "cafemarkt_url", width: 36 },
  ];

  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1A1A1A" },
  };
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };

  sample.forEach((r, i) => {
    const row = ws.addRow({
      no: i + 1,
      model: r.model,
      sku: r.sku,
      name: r.name,
      equsto_tl: r.equsto_tl,
      mutbex_tl: r.mutbex_tl,
      cafemarkt_tl: r.cafemarkt_tl,
      en_ucuz: r.en_ucuz,
      eq_vs_mut_pct: r.eq_vs_mut_pct,
      eq_vs_cafe_pct: r.eq_vs_cafe_pct,
      equsto_url: r.urls.equsto,
      mutbex_url: r.urls.mutbex,
      cafemarkt_url: r.urls.cafemarkt,
    });
    ["equsto_tl", "mutbex_tl", "cafemarkt_tl"].forEach((k) => {
      row.getCell(k).numFmt = '#,##0" ₺"';
    });
    ["eq_vs_mut_pct", "eq_vs_cafe_pct"].forEach((k) => {
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
  sum.addRow(["Örneklem", sample.length]);
  sum.addRow(["Üçlü eşleşme havuzu", triple.length]);
  sum.addRow(["Equsto Şenox toplam", equsto.length]);
  sum.addRow([]);
  sum.addRow(["Not", payload.note]);

  await wb.xlsx.writeFile(OUT_XLSX);

  console.log("\n=== ÖRNEKLEM (ilk 5) ===");
  for (const r of sample.slice(0, 5)) {
    console.log(
      `${r.model || r.sku}: Eq ${fmtTry(r.equsto_tl)} | Mut ${fmtTry(r.mutbex_tl)} | Cafe ${fmtTry(r.cafemarkt_tl)} → ${r.en_ucuz}`,
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
