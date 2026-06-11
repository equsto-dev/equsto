#!/usr/bin/env node
/**
 * Rational çoklu pazar fiyat karşılaştırması
 * Equsto + Cafemarkt + Mutbex + Akakce (en ucuz) + diğer satıcılar
 *
 *   node scripts/compare-rational-multi-market.mjs
 *   node scripts/compare-rational-multi-market.mjs --no-akakce
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";
import {
  parseRationalSku,
} from "./lib/rational-liste-prices.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const PISIRME = path.join(ROOT, "public/data/dept/pisirme.json");
const OUT_JSON = path.join(ROOT, "scripts/data/rational-multi-market-karsilastirma.json");
const OUT_MD = path.join(ROOT, "scripts/data/rational-multi-market-karsilastirma.md");
const CHROME =
  process.env.CHROME_PATH ||
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Equsto";
const skipAkakce = process.argv.includes("--no-akakce");

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function extractRationalSku(s) {
  const raw = String(s || "").toUpperCase();
  const body = "(IC(?:PRO|CLS)[A-Z0-9.]+|OCMP[A-Z0-9.]+|SCC[A-Z0-9.]+)";
  const m9890 = raw.match(new RegExp(`9890\\.${body}`));
  if (m9890) return `9890.${m9890[1]}`;
  const m019 = raw.match(new RegExp(`(?:019|083)\\.${body}`));
  if (m019) return `9890.${m019[1]}`;
  return "";
}

/** Tüm Rational fırın makineleri (iCombi + CombiMaster Plus + SelfCooking Center) */
function isRationalOvenSku(sku) {
  return /^9890\.(IC(PRO|CLS)|OCMP|SCC)/i.test(String(sku || ""));
}

function describeRationalOven(sku) {
  const s = String(sku || "").toUpperCase();
  if (s.includes("ICPROXS")) {
    return { seri: "iCombi Pro XS", grup: "icombi", cfg: "6/2/3", fuel: "Elektrik" };
  }
  if (/IC(PRO|CLS)/.test(s)) {
    const p = parseRationalSku(sku);
    const seri = p?.seri === "pro" ? "iCombi Pro" : "iCombi Classic";
    return {
      seri,
      grup: "icombi",
      cfg: p?.cfg || "",
      fuel: p?.fuel === "G" ? "Gaz" : "Elektrik",
    };
  }
  if (s.includes("OCMP")) {
    const m = s.match(/OCMP(\d{2})(?:\.(\d))?\.?[EG]/i);
    let cfg = "";
    if (m) {
      cfg = m[2] ? `${m[1]}/${m[2]}/1` : `${m[1][0]}/${m[1][1]}/1`;
    }
    const fuel = /\.G0|\.[0-9]+G|OCMP\d+G/i.test(s) ? "Gaz" : "Elektrik";
    return { seri: "CombiMaster Plus", grup: "cmp", cfg, fuel };
  }
  if (s.includes("SCC")) {
    return { seri: "SelfCooking Center", grup: "scc", cfg: "6x2/3 GN", fuel: "Elektrik" };
  }
  return { seri: "Rational", grup: "other", cfg: "", fuel: "" };
}

/** Akakce arama sonuç kodları → Equsto SKU */
const AKAKCE_CODE_TO_SKU = {
  ICPROXS: "9890.ICPROXS.00",
  ICP61E: "9890.ICPRO61.E0",
  ICP61G: "9890.ICPRO61.0G",
  ICP62E: "9890.ICPRO62.E0",
  ICP62G: "9890.ICPRO62.G0",
  ICP101E: "9890.ICPRO10.1E",
  ICP101G: "9890.ICPRO10.1G",
  ICP102E: "9890.ICPRO10.2E",
  ICP102G: "9890.ICPRO10.2G",
  ICP201E: "9890.ICPRO20.1E",
  ICP201G: "9890.ICPRO20.1G",
  ICP202E: "9890.ICPRO20.2E",
  ICP202G: "9890.ICPRO20.2G",
  ICOMBI101E: "9890.ICPRO10.1E",
  ICOMBI101G: "9890.ICPRO10.1G",
  ICOMBI102E: "9890.ICPRO10.2E",
  ICOMBI102G: "9890.ICPRO10.2G",
  ICOMBI201E: "9890.ICPRO20.1E",
  ICOMBI201G: "9890.ICPRO20.1G",
  ICOMBI202E: "9890.ICPRO20.2E",
  ICOMBI202G: "9890.ICPRO20.2G",
  ICC61E: "9890.ICCLS61.E0",
  ICC61G: "9890.ICCLS61.0G",
  ICC62E: "9890.ICCLS62.E0",
  ICC62G: "9890.ICCLS62.G0",
  ICC101E: "9890.ICCLS10.1E",
  ICC101G: "9890.ICCLS10.1G",
  ICC102E: "9890.ICCLS10.2E",
  ICC102G: "9890.ICCLS10.2G",
  ICC201E: "9890.ICCLS20.1E",
  ICC201G: "9890.ICCLS20.1G",
  ICC202E: "9890.ICCLS20.2E",
  ICC202G: "9890.ICCLS20.2G",
  CMP61E0: "9890.OCMP61.E0",
  CMP61G0: "9890.OCMP61.G0",
  CMP62E0: "9890.OCMP62.E0",
  CMP62G0: "9890.OCMP62.G0",
  CMP101E: "9890.OCMP10.1E",
  CMP101G: "9890.OCMP10.1G",
  CMP102E: "9890.OCMP10.2E",
  CMP102G: "9890.OCMP10.2G",
  CMP201E: "9890.OCMP20.1E",
  CMP201G: "9890.OCMP20.1G",
  CMP202E: "9890.OCMP20.2E",
  CMP202G: "9890.OCMP20.2G",
  SCCWEXS: "9890.SCCWEXS.00",
};

function parseTryPrice(s) {
  const m = String(s || "").match(/([\d.]+),(\d{2})/);
  if (!m) return null;
  return Math.round(Number(m[1].replace(/\./g, "")) + Number(m[2]) / 100);
}

function extractAkakceCode(text) {
  const t = String(text || "").toUpperCase();
  if (/ICPROXS|PRO XS\b/.test(t)) return "ICPROXS";
  const ordered = Object.keys(AKAKCE_CODE_TO_SKU).sort((a, b) => b.length - a.length);
  for (const code of ordered) {
    if (t.includes(code)) return code;
  }
  const icp = t.match(/ICP(\d{2,3})([EG])/);
  if (icp) return `ICP${icp[1]}${icp[2]}`;
  const icc = t.match(/ICC(\d{2,3})([EG])/);
  if (icc) return `ICC${icc[1]}${icc[2]}`;
  const cmp = t.match(/(?:OCMP|CMP)(\d{2})([EG]|\d)/);
  if (cmp) return `CMP${cmp[1]}${cmp[2]}`;
  if (/SCCWEXS|SCC XS|SELFCOOKING CENTER XS/i.test(t)) return "SCCWEXS";
  return null;
}

function inferSkuFromTitle(text) {
  const t = String(text || "").toLowerCase();
  if (/selfcook|sccw|scc xs/i.test(t)) return "9890.SCCWEXS.00";

  const isCmp = /\bcmp\d|ocmp|combi master|combimaster/i.test(t);
  const isClassic = /icombi classic|\bicc\d/.test(t);
  const isPro = /icombi pro|\bicp\d/.test(t);
  if (!isClassic && !isPro && !isCmp) return null;
  if (/pro xs|icprox/.test(t)) return "9890.ICPROXS.00";

  let cfg = null;
  if (/6x1\/1|6 tepsili[^]*?1\/1|6x1\b|6 adet gn 1\/1|6 adet gn 1\/1/i.test(t)) cfg = "61";
  else if (/6x2\/1|6 tepsili[^]*?2\/1|6 adet gn 2\/1/i.test(t)) cfg = "62";
  else if (/10x1\/1|10 tepsili[^]*?1\/1|10 adet gn 1\/1/i.test(t)) cfg = "10.1";
  else if (/10x2\/1|10 tepsili[^]*?2\/1|10 adet gn 2\/1/i.test(t)) cfg = "10.2";
  else if (/20x1\/1|20 tepsili[^]*?1\/1|20 adet gn 1\/1/i.test(t)) cfg = "20.1";
  else if (/20x2\/1|20 tepsili[^]*?2\/1|20 adet gn 2\/1/i.test(t)) cfg = "20.2";
  if (!cfg) return null;

  const gaz = /\bgazl[ıi]\b|\bgaz\b|\bcmp.*g\b|\b\d+g\b/.test(t);
  if (isCmp) {
    if (cfg === "61") return `9890.OCMP61.${gaz ? "G0" : "E0"}`;
    if (cfg === "62") return `9890.OCMP62.${gaz ? "G0" : "E0"}`;
    return `9890.OCMP${cfg}${gaz ? "G" : "E"}`;
  }
  const prefix = isClassic ? "9890.ICCLS" : "9890.ICPRO";
  if (cfg === "61") return `${prefix}${gaz ? "61.0G" : "61.E0"}`;
  if (cfg === "62") return `${prefix}${gaz ? "62.G0" : "62.E0"}`;
  return `${prefix}${cfg}${gaz ? "G" : "E"}`;
}

function akakceSkuFromRow(text) {
  const code = extractAkakceCode(text);
  if (code && AKAKCE_CODE_TO_SKU[code]) return AKAKCE_CODE_TO_SKU[code];
  return inferSkuFromTitle(text);
}

function extractEnUcuzPrice(text) {
  const m = String(text || "").match(/En Ucuz\s+([\d.]+,\d{2})\s*TL/i);
  if (m) return parseTryPrice(m[1]);
  const m2 = String(text || "").match(/en ucuz([\d.]+,\d{2})\s*TL/i);
  if (m2) return parseTryPrice(m2[1]);
  const m3 = String(text || "").match(/([\d.]+,\d{2})\s*TL/);
  return m3 ? parseTryPrice(m3[1]) : null;
}

function fmt(n) {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toLocaleString("tr-TR") + " TL";
}

function pctDiff(a, b) {
  if (!a || !b) return null;
  return ((a - b) / b) * 100;
}

function loadEqusto() {
  const map = new Map();
  for (const row of JSON.parse(fs.readFileSync(PISIRME, "utf8"))) {
    const sku = extractRationalSku(row.sku || row.urun_kodu || row.model);
    if (!sku || !isRationalOvenSku(sku)) continue;
    if (!map.has(sku)) map.set(sku, { ...row, sku });
  }
  return map;
}

function parseItemList(html) {
  const m = html.match(
    /<script type="application\/ld\+json">\s*(\{"@context"[^<]*"@type":"ItemList"[\s\S]*?)\s*<\/script>/i,
  );
  if (!m) return [];
  const data = JSON.parse(m[1]);
  return (data.itemListElement || []).map((li) => {
    const p = li.item || {};
    return {
      name: p.name || "",
      code: p.sku || "",
      url: p.url || "",
      price_try_kdv_dahil: p.offers?.price ? Number(p.offers.price) : null,
    };
  });
}

async function fetchCafemarktAll() {
  const base = "https://www.cafemarkt.com/rational";
  const map = new Map();
  let lastPg = 1;
  for (let pg = 1; pg <= lastPg; pg++) {
    const url = pg > 1 ? `${base}?pg=${pg}` : base;
    const res = await fetch(url, {
      headers: { "User-Agent": UA, "Accept-Language": "tr-TR,tr;q=0.9" },
    });
    if (!res.ok) throw new Error(`Cafemarkt HTTP ${res.status}`);
    const html = await res.text();
    if (pg === 1) {
      const lastPgM = html.match(/class="last"[^>]+href="[^"]*pg=(\d+)"/);
      lastPg = lastPgM ? Number(lastPgM[1]) : 1;
    }
    for (const row of parseItemList(html)) {
      const key = extractRationalSku(row.code || row.name);
      if (!key || !isRationalOvenSku(key)) continue;
      if (!map.has(key)) map.set(key, { ...row, normalized_sku: key });
    }
    if (pg < lastPg) await sleep(350);
  }
  return map;
}

async function fetchMutbexAll() {
  const url = "https://www.mutbex.com/rational-firinlar";
  const res = await fetch(url, {
    headers: { "User-Agent": UA, "Accept-Language": "tr-TR,tr;q=0.9" },
  });
  if (!res.ok) throw new Error(`Mutbex HTTP ${res.status}`);
  const html = await res.text();
  const codes = [...html.matchAll(/id="product-code"[^>]*>\s*([^<]+)/g)].map((m) =>
    m[1].trim(),
  );
  const prices = [...html.matchAll(/class="product-price">([\d.]+)/g)].map((m) =>
    Number(m[1].replace(/\./g, "")),
  );
  const map = new Map();
  for (let i = 0; i < codes.length; i++) {
    const sku = extractRationalSku(codes[i]);
    if (!sku) continue;
    map.set(sku, {
      mutbex_code: codes[i],
      price_try_kdv_dahil: prices[i] || null,
      url: "https://www.mutbex.com/rational-firinlar",
      source: "mutbex.com",
    });
  }
  return map;
}

async function fetchAkakceSearch(page, query) {
  const url = "https://www.akakce.com/arama/?q=" + encodeURIComponent(query);
  await page.goto(url, { waitUntil: "networkidle2", timeout: 90000 });
  await sleep(2500);
  return page.evaluate(() =>
    [...document.querySelectorAll("li.w")].map((el) => ({
      href: el.querySelector("a[href]")?.href || "",
      text: (el.textContent || "").replace(/\s+/g, " ").trim(),
    })),
  );
}

async function fetchAkakceAll() {
  if (skipAkakce) return { bySku: new Map(), sellersBySku: new Map() };
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--no-sandbox", "--disable-blink-features=AutomationControlled"],
  });
  const bySku = new Map();
  const sellersBySku = new Map();

  try {
    const page = await browser.newPage();
    await page.setUserAgent(UA);
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => false });
    });

    const queries = [
      "Rational iCombi Pro 6 tepsili",
      "Rational iCombi Pro 10 tepsili",
      "Rational iCombi Pro 20 tepsili",
      "Rational iCombi Pro XS",
      "Rational iCombi Classic 6 tepsili",
      "Rational iCombi Classic 10 tepsili",
      "Rational iCombi Classic 20 tepsili",
      "Rational CMP61 CMP62 CMP10 CMP20",
      "Rational CombiMaster Plus",
      "Rational SelfCooking Center SCC",
      "Rational ICP61E ICC61E",
    ];

    for (const q of queries) {
      console.log(`[akakce] arama: ${q.slice(0, 60)}…`);
      const items = await fetchAkakceSearch(page, q);
      for (const row of items) {
        if (!/rational|icombi|icp|icc|cmp|ocmp|selfcook|scc/i.test(row.text)) continue;
        const sku = akakceSkuFromRow(row.text);
        if (!sku || !isRationalOvenSku(sku)) continue;
        const price = extractEnUcuzPrice(row.text);
        if (!price) continue;
        const prev = bySku.get(sku);
        if (!prev || price < prev.price_try_kdv_dahil) {
          bySku.set(sku, {
            akakce_code: extractAkakceCode(row.text),
            title: row.text.slice(0, 120),
            price_try_kdv_dahil: price,
            url: row.href,
            source: "akakce.com (en ucuz)",
          });
        }
      }
      await sleep(1200);
    }

    // Satıcı listesi — birkaç ürün için ürün sayfası
    const sampleSkus = [...bySku.entries()].slice(0, 8);
    for (const [sku, meta] of sampleSkus) {
      if (!meta.url) continue;
      try {
        await page.goto(meta.url, { waitUntil: "networkidle2", timeout: 90000 });
        await sleep(3500);
        const title = await page.title();
        if (/blocked|cloudflare|attention required/i.test(title)) continue;
        const offers = await page.evaluate(() => {
          const out = [];
          for (const li of document.querySelectorAll("#PL li, .PT_v8 li, ul.PT_v8 li")) {
            const raw = (li.textContent || "").replace(/\s+/g, " ").trim();
            const priceM = raw.match(/([\d.]+,\d{2})\s*TL/);
            if (!priceM) continue;
            const shop =
              li.querySelector("span.v_v8, .v_v8, img[alt]")?.getAttribute?.("alt") ||
              li.querySelector("span.v_v8, .v_v8")?.textContent?.trim() ||
              raw.split(/\d/)[0].trim();
            const link = li.querySelector("a[href]")?.href || "";
            out.push({ shop, price_str: priceM[0], link, raw: raw.slice(0, 120) });
          }
          return out;
        });
        if (offers.length) {
          sellersBySku.set(
            sku,
            offers.map((o) => ({
              shop: o.shop,
              price_try_kdv_dahil: parseTryPrice(o.price_str),
              url: o.link,
            })),
          );
        }
      } catch {
        /* skip */
      }
      await sleep(1000);
    }
  } finally {
    await browser.close();
  }

  return { bySku, sellersBySku };
}

function detectShopName(url, shop) {
  const s = `${url} ${shop}`.toLowerCase();
  if (s.includes("equsto")) return "equsto";
  if (s.includes("cafemarkt")) return "cafemarkt";
  if (s.includes("mutbex")) return "mutbex";
  if (s.includes("endustriyelmutfak")) return "endustriyelmutfak";
  if (s.includes("iles")) return "iles";
  if (s.includes("gastromarket")) return "gastromarket";
  return shop || "diger";
}

async function main() {
  console.log("[equsto] pisirme.json");
  const equstoMap = loadEqusto();
  console.log(`[equsto] ${equstoMap.size} fırın`);

  console.log("[cafemarkt] çekiliyor…");
  const cafeMap = await fetchCafemarktAll();
  console.log(`[cafemarkt] ${cafeMap.size} fırın SKU`);

  console.log("[mutbex] çekiliyor…");
  const mutbexMap = await fetchMutbexAll();
  console.log(`[mutbex] ${mutbexMap.size} SKU`);

  const { bySku: akakceMap, sellersBySku } = await fetchAkakceAll();
  console.log(`[akakce] ${akakceMap.size} SKU (en ucuz)`);

  const allSkus = [
    ...new Set([
      ...equstoMap.keys(),
      ...cafeMap.keys(),
      ...mutbexMap.keys(),
      ...akakceMap.keys(),
    ]),
  ].sort();

  const rows = [];
  for (const sku of allSkus) {
    const eq = equstoMap.get(sku);
    const meta = describeRationalOven(sku);
    const equstoPrice = eq ? Number(eq.fiyat_tl) || null : null;
    const cafe = cafeMap.get(sku);
    const mutbex = mutbexMap.get(sku);
    const akakce = akakceMap.get(sku);
    const akakceSellers = sellersBySku.get(sku) || [];

    const market = {
      equsto: equstoPrice
        ? { price_try_kdv_dahil: equstoPrice, url: "https://equsto.com/shop/marka/rational" }
        : null,
      cafemarkt: cafe?.price_try_kdv_dahil
        ? {
            price_try_kdv_dahil: cafe.price_try_kdv_dahil,
            url: cafe.url,
            code: cafe.code,
            name: cafe.name,
          }
        : null,
      mutbex: mutbex?.price_try_kdv_dahil
        ? {
            price_try_kdv_dahil: mutbex.price_try_kdv_dahil,
            url: mutbex.url,
            code: mutbex.mutbex_code,
          }
        : null,
      akakce_en_ucuz: akakce?.price_try_kdv_dahil
        ? { price_try_kdv_dahil: akakce.price_try_kdv_dahil, url: akakce.url, title: akakce.title }
        : null,
    };

    const allPrices = [
      equstoPrice,
      cafe?.price_try_kdv_dahil,
      mutbex?.price_try_kdv_dahil,
      akakce?.price_try_kdv_dahil,
    ].filter((x) => x > 0);
    const minPrice = allPrices.length ? Math.min(...allPrices) : null;

    rows.push({
      sku,
      seri: meta.seri,
      grup: meta.grup,
      cfg: meta.cfg,
      fuel: meta.fuel,
      name: eq?.name || cafe?.name || akakce?.title || sku,
      in_equsto: !!eq,
      rational_liste_eur: eq?.rational_liste_eur || eq?.liste_fiyati_eur || null,
      market,
      akakce_saticilar: akakceSellers.map((s) => ({
        ...s,
        shop_key: detectShopName(s.url, s.shop),
      })),
      min_price_tl: minPrice,
      equsto_vs_cafemarkt_pct: pctDiff(equstoPrice, cafe?.price_try_kdv_dahil),
      equsto_vs_mutbex_pct: pctDiff(equstoPrice, mutbex?.price_try_kdv_dahil),
      equsto_vs_akakce_pct: pctDiff(equstoPrice, akakce?.price_try_kdv_dahil),
      equsto_en_ucuz:
        equstoPrice != null && minPrice != null ? equstoPrice <= minPrice + 50 : null,
      rank_among_known: (() => {
        const ranked = [
          ["equsto", equstoPrice],
          ["cafemarkt", cafe?.price_try_kdv_dahil],
          ["mutbex", mutbex?.price_try_kdv_dahil],
          ["akakce", akakce?.price_try_kdv_dahil],
        ]
          .filter(([, v]) => v > 0)
          .sort((a, b) => a[1] - b[1]);
        return ranked.map(([k, v]) => ({ site: k, price: v }));
      })(),
    });
  }

  const equstoRows = rows.filter((r) => r.in_equsto);
  const withEqustoCafe = rows.filter((r) => r.market.equsto && r.market.cafemarkt);
  const equstoCheapest = rows.filter((r) => r.equsto_en_ucuz === true).length;
  const avg = (field) => {
    const subset = rows.filter((r) => r[field] != null);
    if (!subset.length) return null;
    return subset.reduce((s, r) => s + r[field], 0) / subset.length;
  };
  const avgVsCafe = avg("equsto_vs_cafemarkt_pct");
  const avgVsMutbex = avg("equsto_vs_mutbex_pct");
  const avgVsAkakce = avg("equsto_vs_akakce_pct");

  const byGrup = (g) => rows.filter((r) => r.grup === g);

  const summary = {
    fetched_at: new Date().toISOString(),
    toplam_firin_sku: rows.length,
    equsto_count: equstoRows.length,
    equsto_disinda_cafemarkt: rows.filter((r) => !r.in_equsto && r.market.cafemarkt).length,
    icombi_count: byGrup("icombi").length,
    cmp_count: byGrup("cmp").length,
    scc_count: byGrup("scc").length,
    cafemarkt_matched: rows.filter((r) => r.market.cafemarkt).length,
    mutbex_matched: rows.filter((r) => r.market.mutbex).length,
    akakce_matched: rows.filter((r) => r.market.akakce_en_ucuz).length,
    equsto_cafemarkt_birlikte: withEqustoCafe.length,
    equsto_en_ucuz: equstoCheapest,
    ort_equsto_vs_cafemarkt_pct: avgVsCafe,
    ort_equsto_vs_mutbex_pct: avgVsMutbex,
    ort_equsto_vs_akakce_pct: avgVsAkakce,
  };

  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify({ summary, rows }, null, 2), "utf8");

  const rowLine = (r) => {
    const best = r.rank_among_known[0];
    const eqMark = r.in_equsto ? "" : " *(Equsto'da yok)*";
    return `| ${r.sku} | ${r.seri} ${r.cfg} ${r.fuel}${eqMark} | ${fmt(r.market.equsto?.price_try_kdv_dahil)} | ${fmt(r.market.cafemarkt?.price_try_kdv_dahil)} | ${fmt(r.market.mutbex?.price_try_kdv_dahil)} | ${fmt(r.market.akakce_en_ucuz?.price_try_kdv_dahil)} | **${best?.site || "—"}** ${fmt(best?.price)} |`;
  };

  const md = [
    "# Rational fırın fiyat karşılaştırması — Equsto · Cafemarkt · Mutbex · Akakce",
    "",
    `Tarih: ${summary.fetched_at.slice(0, 19).replace("T", " ")}`,
    "",
    "## Özet",
    "",
    "| Metrik | Değer |",
    "|--------|------:|",
    `| Toplam fırın SKU (birleşik) | ${summary.toplam_firin_sku} |`,
    `| iCombi (Pro/Classic/XS) | ${summary.icombi_count} |`,
    `| CombiMaster Plus (CMP) | ${summary.cmp_count} |`,
    `| SelfCooking Center | ${summary.scc_count} |`,
    `| Equsto katalogda | ${summary.equsto_count} |`,
    `| Sadece Cafemarkt'ta (Equsto'da yok) | ${summary.equsto_disinda_cafemarkt} |`,
    `| Cafemarkt eşleşen | ${summary.cafemarkt_matched} |`,
    `| Mutbex eşleşen | ${summary.mutbex_matched} |`,
    `| Akakce en ucuz eşleşen | ${summary.akakce_matched} |`,
    `| Equsto tüm kanallarda en ucuz | **${summary.equsto_en_ucuz}/${summary.toplam_firin_sku}** |`,
    ...(avgVsCafe != null
      ? [`| Ort. Equsto−Cafemarkt (Equsto'da olanlar) | ${avgVsCafe.toFixed(1)}% |`]
      : []),
    ...(avgVsMutbex != null
      ? [`| Ort. Equsto−Mutbex | ${avgVsMutbex.toFixed(1)}% |`]
      : []),
    ...(avgVsAkakce != null
      ? [`| Ort. Equsto−Akakce | ${avgVsAkakce.toFixed(1)}% |`]
      : []),
    "",
    "> Negatif % = Equsto daha ucuz. Fiyatlar KDV dahil TL.",
    "",
    "## Rakip mağazalar (Equsto'da olan fırınlar)",
    "",
    `| Metrik | Değer |`,
    `|--------|------:|`,
    `| Equsto, Cafemarkt'tan ucuz | **${rows.filter((r) => r.in_equsto && r.equsto_vs_cafemarkt_pct != null && r.equsto_vs_cafemarkt_pct < 0).length}/${rows.filter((r) => r.in_equsto && r.market.cafemarkt).length}** |`,
    `| Equsto, Mutbex'ten ucuz | **${rows.filter((r) => r.in_equsto && r.equsto_vs_mutbex_pct != null && r.equsto_vs_mutbex_pct < 0).length}/${rows.filter((r) => r.in_equsto && r.market.mutbex).length}** |`,
    "",
    ...(avgVsAkakce != null
      ? [
          "## Akakce pazar yeri",
          "",
          `Akakce en ucuz satıcı Equsto'dan ortalama **${avgVsAkakce > 0 ? avgVsAkakce.toFixed(1) + "% pahalı" : Math.abs(avgVsAkakce).toFixed(1) + "% ucuz"}** (Equsto'da fiyatı olan modeller).`,
          "",
        ]
      : []),
    "## iCombi Pro / Classic / XS",
    "",
    "| SKU | Model | Equsto | Cafemarkt | Mutbex | Akakce ↓ | En ucuz |",
    "|-----|-------|-------:|----------:|-------:|---------:|---------|",
    ...byGrup("icombi").map(rowLine),
    "",
    "## CombiMaster Plus (CMP) — Equsto'da yok",
    "",
    "| SKU | Model | Equsto | Cafemarkt | Mutbex | Akakce ↓ | En ucuz |",
    "|-----|-------|-------:|----------:|-------:|---------:|---------|",
    ...(byGrup("cmp").length ? byGrup("cmp").map(rowLine) : ["| — | — | — | — | — | — | — |"]),
    "",
    "## SelfCooking Center — Equsto'da yok",
    "",
    "| SKU | Model | Equsto | Cafemarkt | Mutbex | Akakce ↓ | En ucuz |",
    "|-----|-------|-------:|----------:|-------:|---------:|---------|",
    ...(byGrup("scc").length ? byGrup("scc").map(rowLine) : ["| — | — | — | — | — | — | — |"]),
    "",
    "## Equsto en ucuz olduğu ürünler",
    "",
    ...(rows.filter((r) => r.equsto_en_ucuz).length
      ? rows
          .filter((r) => r.equsto_en_ucuz)
          .map(
            (r) =>
              `- **${r.sku}** (${r.seri}) — Equsto ${fmt(r.market.equsto?.price_try_kdv_dahil)} · Cafemarkt ${fmt(r.market.cafemarkt?.price_try_kdv_dahil)} · Mutbex ${fmt(r.market.mutbex?.price_try_kdv_dahil)} · Akakce ${fmt(r.market.akakce_en_ucuz?.price_try_kdv_dahil)}`,
          )
      : ["- Yok"]),
    "",
    "## Akakce satıcı detayı (örnek)",
    "",
    ...rows
      .filter((r) => r.akakce_saticilar?.length)
      .slice(0, 6)
      .flatMap((r) => [
        `### ${r.sku}`,
        "",
        "| Satıcı | Fiyat |",
        "|--------|------:|",
        ...r.akakce_saticilar.map(
          (s) => `| ${s.shop_key || s.shop} | ${fmt(s.price_try_kdv_dahil)} |`,
        ),
        "",
      ]),
  ].join("\n");

  fs.writeFileSync(OUT_MD, md, "utf8");
  console.log(JSON.stringify(summary, null, 2));
  console.log(`[out] ${OUT_JSON}`);
  console.log(`[out] ${OUT_MD}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
