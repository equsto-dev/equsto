#!/usr/bin/env node
/**
 * Öztiryakiler — Equsto × Mutbex × Cafemarkt fiyat karşılaştırması
 *
 *   node scripts/compare-ozti-multi-market.mjs
 *   node scripts/compare-ozti-multi-market.mjs --fresh   # Mutbex yeniden çek
 *   node scripts/compare-ozti-multi-market.mjs --max-pages 20
 */
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchTcmbEurUsdRates } from "./fetch-tcmb-kur.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPT = path.join(ROOT, "public/data/dept");
const CAFE_JSON = path.join(ROOT, "scripts/data/cafemarkt-ozti.json");
const MUT_CACHE = path.join(ROOT, "scripts/data/ozti/mutbex-ozti-catalog.json");
const OUT_JSON = path.join(ROOT, "scripts/data/ozti/ozti-multi-market-karsilastirma.json");
const OUT_MD = path.join(ROOT, "scripts/data/ozti/ozti-multi-market-karsilastirma.md");
const OUT_CSV = path.join(ROOT, "scripts/data/ozti/ozti-multi-market-karsilastirma.csv");
const OUT_CANVAS_DATA = path.join(ROOT, "scripts/data/ozti/ozti-multi-market-canvas-data.json");

const BASE = "https://www.mutbex.com";
const BRAND_URL = `${BASE}/oztiryakiler`;
const UA = "EqustoCompare/1.0 (+https://equsto.com; ozti-market)";

const args = process.argv.slice(2);
const fresh = args.includes("--fresh");
const maxPagesArg = args.includes("--max-pages")
  ? Number(args[args.indexOf("--max-pages") + 1])
  : 0;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function normKod(s) {
  return String(s || "")
    .toUpperCase()
    .replace(/^1M\./, "")
    .replace(/[^A-Z0-9]/g, "");
}

function displayKod(s) {
  return String(s || "")
    .trim()
    .replace(/^1M\./i, "");
}

function pctDiff(a, b) {
  if (!(a > 0) || !(b > 0)) return null;
  return Math.round(((a - b) / b) * 1000) / 10;
}

function median(arr) {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function mean(arr) {
  if (!arr.length) return null;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function parseProductDataPushes(html) {
  const out = [];
  const marker = "PRODUCT_DATA.push(JSON.parse('";
  let pos = 0;
  while (true) {
    const start = html.indexOf(marker, pos);
    if (start === -1) break;
    let i = start + marker.length;
    let raw = "";
    while (i < html.length) {
      const ch = html[i];
      if (ch === "\\") {
        raw += html.slice(i, i + 2);
        i += 2;
        continue;
      }
      if (ch === "'") break;
      raw += ch;
      i++;
    }
    try {
      const jsonStr = raw.replace(/\\"/g, '"').replace(/\\\\/g, "\\");
      out.push(JSON.parse(jsonStr));
    } catch {
      /* skip */
    }
    pos = i + 1;
  }
  return out;
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      "Accept-Language": "tr-TR,tr;q=0.9",
      Accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(90000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.text();
}

function rowFromMutbexPush(row) {
  const code = String(row.supplier_code || row.code || "").trim();
  const sku = displayKod(code);
  const tl = Number(row.total_sale_price);
  const listTl = Number(row.total_base_price);
  return {
    sku,
    mutbexCode: code,
    name: row.name || "",
    url: row.url ? `${BASE}/${String(row.url).replace(/^\//, "")}` : "",
    price_try_kdv_dahil: tl > 0 ? Math.round(tl) : null,
    price_try_list: listTl > 0 ? Math.round(listTl) : null,
    currency: row.currency || "",
    brand: row.brand || "Öztiryakiler",
    category: row.category || "",
    category_path: row.category_path || "",
  };
}

async function scrapeMutbexOzti() {
  if (!fresh && fs.existsSync(MUT_CACHE)) {
    const cached = JSON.parse(fs.readFileSync(MUT_CACHE, "utf8"));
    if ((cached.products || []).length > 100) {
      console.log(`[mutbex] cache: ${cached.products.length} ürün (${cached.scrapedAt})`);
      return cached;
    }
  }

  console.log("[mutbex] sayfa 1…");
  const first = await fetchHtml(BRAND_URL);
  const maxPg = Math.max(
    1,
    ...[...first.matchAll(/[?&]pg=(\d+)/gi)].map((m) => Number(m[1])),
  );
  const lastPage = maxPagesArg > 0 ? Math.min(maxPagesArg, maxPg) : maxPg;
  console.log(`[mutbex] toplam sayfa ≈ ${maxPg}, çekilecek: ${lastPage}`);

  const bySku = new Map();
  const ingest = (html) => {
    for (const raw of parseProductDataPushes(html)) {
      const p = rowFromMutbexPush(raw);
      const k = normKod(p.sku);
      if (!k || !(p.price_try_kdv_dahil > 0)) continue;
      if (!bySku.has(k)) bySku.set(k, p);
    }
  };
  ingest(first);

  for (let pg = 2; pg <= lastPage; pg++) {
    process.stdout.write(`\r[mutbex] sayfa ${pg}/${lastPage} (${bySku.size} SKU)`);
    try {
      const html = await fetchHtml(`${BRAND_URL}?pg=${pg}`);
      ingest(html);
    } catch (e) {
      console.warn(`\n[mutbex] sayfa ${pg} hata: ${e.message}`);
    }
    await sleep(250);
  }
  console.log(`\n[mutbex] ${bySku.size} benzersiz SKU`);

  const payload = {
    source: BRAND_URL,
    scrapedAt: new Date().toISOString(),
    pageCount: lastPage,
    productCount: bySku.size,
    products: [...bySku.values()].sort((a, b) => a.sku.localeCompare(b.sku)),
  };
  await fsp.mkdir(path.dirname(MUT_CACHE), { recursive: true });
  await fsp.writeFile(MUT_CACHE, JSON.stringify(payload, null, 2), "utf8");
  return payload;
}

function loadEqustoOzti() {
  const rows = [];
  for (const f of fs.readdirSync(DEPT).filter((x) => x.endsWith(".json"))) {
    const arr = JSON.parse(fs.readFileSync(path.join(DEPT, f), "utf8"));
    if (!Array.isArray(arr)) continue;
    for (const r of arr) {
      if (!/öztiryakiler/i.test(String(r.brand || ""))) continue;
      const sku = String(r.sku || r.model || r.urun_kodu || "").trim();
      const tl = Number(r.fiyat_tl);
      if (!sku || !(tl > 0)) continue;
      rows.push({
        sku,
        name: r.name || "",
        price_try_kdv_dahil: Math.round(tl),
        liste_eur: Number(r.liste_fiyati_eur) || null,
        iskonto_oran: Number(r.iskonto_oran) || null,
        bayi_iskonto: Number(r.bayi_iskonto) || null,
        kur: Number(r.kur_eur_try) || null,
        kaynak: r.kaynak_fiyat_listesi || r.kaynak || "",
        dept: f.replace(/\.json$/, ""),
        id: r.id || "",
      });
    }
  }
  return rows;
}

function loadCafemarkt(eurTry) {
  const raw = JSON.parse(fs.readFileSync(CAFE_JSON, "utf8"));
  return raw.map((p, i) => {
    const eur = Number(p.fiyat_kdv_dahil);
    const para = String(p.para_birimi || "EUR").toUpperCase();
    let tl = null;
    if (eur > 0) {
      tl = para === "TL" || para === "TRY" ? Math.round(eur) : Math.round(eur * eurTry);
    }
    const hay =
      (p["ürün_adı"] || "") +
      "\n" +
      (p.açıklamalar || "") +
      "\n" +
      (p.açıklamalar_site || "");
    return {
      idx: i,
      name: p["ürün_adı"] || "",
      price_eur: para.startsWith("EUR") && eur > 0 ? eur : null,
      price_try_kdv_dahil: tl,
      para,
      kategori: p.kategori || "",
      hayNorm: normKod(hay),
      hay,
    };
  });
}

function findCafemarkt(sku, cafeRows) {
  const needle = normKod(sku);
  if (needle.length < 6) return null;
  const hits = cafeRows.filter((c) => c.hayNorm.includes(needle));
  if (!hits.length) return null;
  hits.sort((a, b) => a.hayNorm.length - b.hayNorm.length);
  return hits[0];
}

function bucketPct(pct) {
  if (pct == null) return null;
  if (pct <= -20) return "eq_cok_ucuz";
  if (pct < -5) return "eq_ucuz";
  if (pct <= 5) return "benzer";
  if (pct < 20) return "eq_pahali";
  return "eq_cok_pahali";
}

function cheapest(prices) {
  const ranked = Object.entries(prices)
    .filter(([, v]) => v > 0)
    .sort((a, b) => a[1] - b[1]);
  return ranked[0]?.[0] || null;
}

async function main() {
  const rates = await fetchTcmbEurUsdRates().catch(() => ({ eurTry: 54.05, usdTry: 47.3 }));
  const eurTry = rates.eurTry || rates.eur || 54.05;
  console.log(`[kur] 1 EUR = ${eurTry} TRY`);

  const mut = await scrapeMutbexOzti();
  const mutByKod = new Map();
  for (const p of mut.products || []) {
    const k = normKod(p.sku);
    if (k) mutByKod.set(k, p);
  }

  const cafeRows = loadCafemarkt(eurTry);
  const equsto = loadEqustoOzti();
  console.log(`[equsto] ${equsto.length} Öztiryakiler | [cafe] ${cafeRows.length} | [mutbex] ${mutByKod.size}`);

  const rows = [];
  let cafeHit = 0;
  let mutHit = 0;

  for (const eq of equsto) {
    const k = normKod(eq.sku);
    const m = mutByKod.get(k) || null;
    const c = findCafemarkt(eq.sku, cafeRows);
    if (m) mutHit++;
    if (c) cafeHit++;

    const eqTl = eq.price_try_kdv_dahil;
    const mutTl = m?.price_try_kdv_dahil || null;
    const cafeTl = c?.price_try_kdv_dahil || null;
    const vsMut = pctDiff(eqTl, mutTl);
    const vsCafe = pctDiff(eqTl, cafeTl);

    rows.push({
      sku: eq.sku,
      name: eq.name,
      dept: eq.dept,
      equsto_tl: eqTl,
      mutbex_tl: mutTl,
      cafemarkt_tl: cafeTl,
      cafemarkt_eur: c?.price_eur ?? null,
      liste_eur: eq.liste_eur,
      iskonto_oran: eq.iskonto_oran,
      eq_vs_mut_pct: vsMut,
      eq_vs_cafe_pct: vsCafe,
      en_ucuz: cheapest({ equsto: eqTl, mutbex: mutTl, cafemarkt: cafeTl }),
      bucket_mut: bucketPct(vsMut),
      bucket_cafe: bucketPct(vsCafe),
      mutbex_url: m?.url || null,
      mutbex_list_tl: m?.price_try_list || null,
      cafe_name: c?.name || null,
    });
  }

  const bothMut = rows.filter((r) => r.mutbex_tl > 0);
  const bothCafe = rows.filter((r) => r.cafemarkt_tl > 0);
  const allThree = rows.filter((r) => r.mutbex_tl > 0 && r.cafemarkt_tl > 0);
  const vsMutArr = bothMut.map((r) => r.eq_vs_mut_pct).filter((x) => x != null);
  const vsCafeArr = bothCafe.map((r) => r.eq_vs_cafe_pct).filter((x) => x != null);

  const countBucket = (key) => {
    const out = {};
    for (const r of rows) {
      const b = r[key];
      if (!b) continue;
      out[b] = (out[b] || 0) + 1;
    }
    return out;
  };

  const outliersMut = [...bothMut]
    .filter((r) => r.eq_vs_mut_pct != null && Math.abs(r.eq_vs_mut_pct) >= 25)
    .sort((a, b) => Math.abs(b.eq_vs_mut_pct) - Math.abs(a.eq_vs_mut_pct))
    .slice(0, 40);

  const outliersCafe = [...bothCafe]
    .filter((r) => r.eq_vs_cafe_pct != null && Math.abs(r.eq_vs_cafe_pct) >= 25)
    .sort((a, b) => Math.abs(b.eq_vs_cafe_pct) - Math.abs(a.eq_vs_cafe_pct))
    .slice(0, 40);

  const cheapestCounts = { equsto: 0, mutbex: 0, cafemarkt: 0 };
  for (const r of allThree) {
    if (r.en_ucuz && cheapestCounts[r.en_ucuz] != null) cheapestCounts[r.en_ucuz]++;
  }

  const byDept = {};
  for (const r of bothMut) {
    if (!byDept[r.dept]) byDept[r.dept] = { n: 0, diffs: [] };
    byDept[r.dept].n++;
    if (r.eq_vs_mut_pct != null) byDept[r.dept].diffs.push(r.eq_vs_mut_pct);
  }
  const deptStats = Object.entries(byDept)
    .map(([dept, v]) => ({
      dept,
      matched: v.n,
      ort_eq_vs_mut_pct: Math.round(mean(v.diffs) * 10) / 10,
      med_eq_vs_mut_pct: Math.round(median(v.diffs) * 10) / 10,
    }))
    .sort((a, b) => b.matched - a.matched);

  const summary = {
    generatedAt: new Date().toISOString(),
    kur_eur_try: eurTry,
    equsto_ozti: equsto.length,
    mutbex_catalog: mutByKod.size,
    cafemarkt_catalog: cafeRows.length,
    matched_mutbex: mutHit,
    matched_cafemarkt: cafeHit,
    matched_all_three: allThree.length,
    ort_eq_vs_mut_pct: Math.round(mean(vsMutArr) * 10) / 10,
    med_eq_vs_mut_pct: Math.round(median(vsMutArr) * 10) / 10,
    ort_eq_vs_cafe_pct: Math.round(mean(vsCafeArr) * 10) / 10,
    med_eq_vs_cafe_pct: Math.round(median(vsCafeArr) * 10) / 10,
    eq_cheaper_than_mut: bothMut.filter((r) => r.eq_vs_mut_pct < 0).length,
    eq_cheaper_than_cafe: bothCafe.filter((r) => r.eq_vs_cafe_pct < 0).length,
    buckets_vs_mutbex: countBucket("bucket_mut"),
    buckets_vs_cafemarkt: countBucket("bucket_cafe"),
    cheapest_when_all_three: cheapestCounts,
    dept_vs_mutbex: deptStats,
    mutbex_scraped_at: mut.scrapedAt,
    cafemarkt_note:
      "Cafemarkt fiyatları EUR (KDV dahil) → TCMB kuru ile TL; kod eşlemesi ürün adı/açıklama içinde SKU araması",
  };

  const report = { summary, outliersMut, outliersCafe, rows };
  await fsp.mkdir(path.dirname(OUT_JSON), { recursive: true });
  await fsp.writeFile(OUT_JSON, JSON.stringify(report, null, 2), "utf8");

  // Compact canvas payload (inline-friendly)
  const canvasData = {
    summary,
    deptStats: deptStats.slice(0, 12),
    outliersMut: outliersMut.slice(0, 25).map((r) => ({
      sku: r.sku,
      name: r.name.slice(0, 80),
      equsto_tl: r.equsto_tl,
      mutbex_tl: r.mutbex_tl,
      pct: r.eq_vs_mut_pct,
    })),
    outliersCafe: outliersCafe.slice(0, 25).map((r) => ({
      sku: r.sku,
      name: r.name.slice(0, 80),
      equsto_tl: r.equsto_tl,
      cafemarkt_tl: r.cafemarkt_tl,
      pct: r.eq_vs_cafe_pct,
    })),
    sampleCheapestEq: allThree
      .filter((r) => r.en_ucuz === "equsto")
      .sort((a, b) => (a.eq_vs_mut_pct ?? 0) - (b.eq_vs_mut_pct ?? 0))
      .slice(0, 15)
      .map((r) => ({
        sku: r.sku,
        name: r.name.slice(0, 70),
        equsto_tl: r.equsto_tl,
        mutbex_tl: r.mutbex_tl,
        cafemarkt_tl: r.cafemarkt_tl,
        vs_mut: r.eq_vs_mut_pct,
        vs_cafe: r.eq_vs_cafe_pct,
      })),
    sampleExpensiveEq: allThree
      .filter((r) => r.en_ucuz !== "equsto")
      .sort((a, b) => (b.eq_vs_mut_pct ?? 0) - (a.eq_vs_mut_pct ?? 0))
      .slice(0, 15)
      .map((r) => ({
        sku: r.sku,
        name: r.name.slice(0, 70),
        equsto_tl: r.equsto_tl,
        mutbex_tl: r.mutbex_tl,
        cafemarkt_tl: r.cafemarkt_tl,
        vs_mut: r.eq_vs_mut_pct,
        vs_cafe: r.eq_vs_cafe_pct,
        en_ucuz: r.en_ucuz,
      })),
  };
  await fsp.writeFile(OUT_CANVAS_DATA, JSON.stringify(canvasData, null, 2), "utf8");

  const fmt = (n) =>
    n == null ? "—" : `₺${Math.round(n).toLocaleString("tr-TR")}`;
  const fmtPct = (n) => (n == null ? "—" : `${n > 0 ? "+" : ""}${n}%`);

  const md = [
    "# Öztiryakiler — Equsto × Mutbex × Cafemarkt Fiyat Raporu",
    "",
    `**Tarih:** ${summary.generatedAt}`,
    `**Kur:** 1 EUR = ${eurTry} TRY`,
    `**Mutbex scrape:** ${mut.scrapedAt || "cache"} (${mut.productCount} ürün)`,
    "",
    "## Özet",
    "",
    `| Metrik | Değer |`,
    `| --- | --- |`,
    `| Equsto Öztiryakiler | ${summary.equsto_ozti} |`,
    `| Mutbex katalog | ${summary.mutbex_catalog} |`,
    `| Cafemarkt katalog | ${summary.cafemarkt_catalog} |`,
    `| Equsto↔Mutbex eşleşen | **${summary.matched_mutbex}** |`,
    `| Equsto↔Cafemarkt eşleşen | **${summary.matched_cafemarkt}** |`,
    `| Üçünde de var | ${summary.matched_all_three} |`,
    `| Ort. Equsto vs Mutbex | **${fmtPct(summary.ort_eq_vs_mut_pct)}** (medyan ${fmtPct(summary.med_eq_vs_mut_pct)}) |`,
    `| Ort. Equsto vs Cafemarkt | **${fmtPct(summary.ort_eq_vs_cafe_pct)}** (medyan ${fmtPct(summary.med_eq_vs_cafe_pct)}) |`,
    `| Equsto Mutbex'ten ucuz | ${summary.eq_cheaper_than_mut}/${summary.matched_mutbex} |`,
    `| Equsto Cafemarkt'tan ucuz | ${summary.eq_cheaper_than_cafe}/${summary.matched_cafemarkt} |`,
    "",
    "### Üç kanalda en ucuz (üçü de eşleşince)",
    "",
    `| Kanal | Adet |`,
    `| --- | --- |`,
    `| Equsto | ${cheapestCounts.equsto} |`,
    `| Mutbex | ${cheapestCounts.mutbex} |`,
    `| Cafemarkt | ${cheapestCounts.cafemarkt} |`,
    "",
    "## Departman (vs Mutbex)",
    "",
    `| Dept | Eşleşen | Ort. % | Medyan % |`,
    `| --- | --- | --- | --- |`,
    ...deptStats.map(
      (d) =>
        `| ${d.dept} | ${d.matched} | ${fmtPct(d.ort_eq_vs_mut_pct)} | ${fmtPct(d.med_eq_vs_mut_pct)} |`,
    ),
    "",
    "## En büyük farklar vs Mutbex (|%| ≥ 25)",
    "",
    `| SKU | Equsto | Mutbex | Fark | Ürün |`,
    `| --- | --- | --- | --- | --- |`,
    ...outliersMut.slice(0, 25).map(
      (r) =>
        `| ${r.sku} | ${fmt(r.equsto_tl)} | ${fmt(r.mutbex_tl)} | ${fmtPct(r.eq_vs_mut_pct)} | ${r.name.slice(0, 50)} |`,
    ),
    "",
    "## En büyük farklar vs Cafemarkt (|%| ≥ 25)",
    "",
    `| SKU | Equsto | Cafemarkt | Fark | Ürün |`,
    `| --- | --- | --- | --- | --- |`,
    ...outliersCafe.slice(0, 25).map(
      (r) =>
        `| ${r.sku} | ${fmt(r.equsto_tl)} | ${fmt(r.cafemarkt_tl)} | ${fmtPct(r.eq_vs_cafe_pct)} | ${r.name.slice(0, 50)} |`,
    ),
    "",
    "## Notlar",
    "",
    "- Equsto: Öztiryakiler 2025 liste EUR × (1 − bayi iskonto) × 1,08 × KDV × TCMB",
    "- Mutbex: mutbex.com/oztiryakiler `total_sale_price` (KDV dahil TL)",
    "- Cafemarkt: yerel dump EUR KDV dahil × TCMB; SKU metin içinde aranır (yanlış eşleşme riski var)",
    `- Negatif % = Equsto daha ucuz`,
    "",
  ];
  await fsp.writeFile(OUT_MD, md.join("\n"), "utf8");

  const csvHeader =
    "sku,name,dept,equsto_tl,mutbex_tl,cafemarkt_tl,eq_vs_mut_pct,eq_vs_cafe_pct,en_ucuz,mutbex_url";
  const csvLines = [csvHeader];
  for (const r of rows) {
    if (!(r.mutbex_tl || r.cafemarkt_tl)) continue;
    csvLines.push(
      [
        r.sku,
        JSON.stringify(r.name),
        r.dept,
        r.equsto_tl ?? "",
        r.mutbex_tl ?? "",
        r.cafemarkt_tl ?? "",
        r.eq_vs_mut_pct ?? "",
        r.eq_vs_cafe_pct ?? "",
        r.en_ucuz ?? "",
        r.mutbex_url ?? "",
      ].join(","),
    );
  }
  await fsp.writeFile(OUT_CSV, csvLines.join("\n"), "utf8");

  console.log("\n=== ÖZET ===");
  console.log(JSON.stringify(summary, null, 2));
  console.log(`\n→ ${OUT_JSON}`);
  console.log(`→ ${OUT_MD}`);
  console.log(`→ ${OUT_CSV}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
