#!/usr/bin/env node
/**
 * inoksanshop.com.tr + inoksan.com PDP → dept katalog açıklamaları
 *
 *   node scripts/fetch-inoksan-shop-descriptions.mjs
 *   node scripts/fetch-inoksan-shop-descriptions.mjs --dry-run --limit 20
 *   node scripts/fetch-inoksan-shop-descriptions.mjs --sku INO-FKE06
 *   node scripts/fetch-inoksan-shop-descriptions.mjs --skip-index   # shop sitemap taraması yok (önerilen)
 *   node scripts/fetch-inoksan-shop-descriptions.mjs --refresh-index # shop SKU→URL indeksi
 *   node scripts/fetch-inoksan-shop-descriptions.mjs --force
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parseInoksanComPdpHtml } from "./lib/inoksan-pdp-parse.mjs";
import {
  SHOP_ORIGIN,
  SHOP_UA,
  absShopUrl,
  extractProductLinksFromHtml,
  findSkuInListingHtml,
  parseShopProductPage,
  skuMatchesPage,
} from "./lib/inoksan-shop-scrape.mjs";
import { applyInoksanDescription, matchInoksanWeb, buildWebCodeIndex, buildInoksanComIndexDescription, skuCore } from "./lib/inoksan-enrich.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPT_DIR = path.join(ROOT, "public/data/dept");
const SHOP_INDEX = path.join(ROOT, "scripts/data/inoksan-shop-index.json");
const WEB_INDEX = path.join(ROOT, "scripts/data/inoksan-web-index.json");
const REPORT = path.join(ROOT, "scripts/data/inoksan-shop-desc-report.json");
const KAYNAK = "inoksan-fiyat-listesi-2026-r1";

const dryRun = process.argv.includes("--dry-run");
const force = process.argv.includes("--force");
const skipIndex = process.argv.includes("--skip-index");
const comFirst = process.argv.includes("--com-first") || skipIndex;
const skuFilter = process.argv.find((a) => a.startsWith("--sku="))?.split("=")[1]?.trim().toUpperCase();
const limitArg = process.argv.includes("--limit")
  ? Number(process.argv[process.argv.indexOf("--limit") + 1])
  : 0;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": SHOP_UA, Accept: "text/html,application/xhtml+xml" },
    redirect: "follow",
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.text();
}

function curlText(url) {
  const r = spawnSync(
    "curl.exe",
    ["-sL", "--max-time", "20", "-A", SHOP_UA, url],
    { encoding: "utf8", maxBuffer: 25 * 1024 * 1024 },
  );
  if (r.status !== 0 && !r.stdout) throw new Error(`curl failed ${url}`);
  return r.stdout || "";
}

async function getText(url) {
  try {
    return await fetchText(url);
  } catch {
    return curlText(url);
  }
}

function loadInoksanRows() {
  const rows = [];
  for (const f of fs.readdirSync(DEPT_DIR).sort()) {
    if (!f.endsWith(".json")) continue;
    const list = JSON.parse(fs.readFileSync(path.join(DEPT_DIR, f), "utf8"));
    for (const row of list) {
      if (row?.brand !== "İnoksan" && row?.kaynak_fiyat_listesi !== KAYNAK) continue;
      if (skuFilter && String(row.sku || "").toUpperCase() !== skuFilter) continue;
      rows.push({ row, file: f });
    }
  }
  return limitArg > 0 ? rows.slice(0, limitArg) : rows;
}

async function buildShopLinkIndex() {
  if (skipIndex) {
    if (fs.existsSync(SHOP_INDEX)) {
      return JSON.parse(fs.readFileSync(SHOP_INDEX, "utf8"));
    }
    console.log("[inoksan-shop] --skip-index: shop SKU indeksi atlandı (arama modu)");
    return { builtAt: new Date().toISOString(), count: 0, bySku: {} };
  }
  if (fs.existsSync(SHOP_INDEX) && !process.argv.includes("--refresh-index")) {
    return JSON.parse(fs.readFileSync(SHOP_INDEX, "utf8"));
  }

  const seeds = [SHOP_ORIGIN, `${SHOP_ORIGIN}/`];
  const sitemapCandidates = [
    `${SHOP_ORIGIN}/sitemap.xml`,
    `${SHOP_ORIGIN}/sitemap/products/0.xml`,
    `${SHOP_ORIGIN}/sitemap/products.xml`,
  ];

  const listingUrls = new Set();
  for (const sm of sitemapCandidates) {
    try {
      const xml = await getText(sm);
      for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/gi)) {
        const u = m[1].trim();
        if (u.includes("inoksanshop.com.tr")) listingUrls.add(u.split("?")[0]);
      }
    } catch {
      /* ignore */
    }
  }

  for (const seed of seeds) {
    try {
      const html = await getText(seed);
      for (const link of extractProductLinksFromHtml(html)) listingUrls.add(link);
    } catch {
      /* ignore */
    }
  }

  const bySku = {};
  const pages = [...listingUrls];
  console.log("[inoksan-shop] tarama:", pages.length, "URL");

  for (let i = 0; i < pages.length; i++) {
    const url = pages[i];
    try {
      const html = await getText(url);
      for (const m of html.matchAll(/\b((?:INO|INT)-[A-Z0-9][A-Z0-9\-./]{1,30})\b/gi)) {
        const sku = m[1].toUpperCase();
        if (!bySku[sku]) bySku[sku] = url;
      }
      if (i % 40 === 0) console.log(`[inoksan-shop] index ${i + 1}/${pages.length}`);
      await sleep(80);
    } catch {
      /* ignore page */
    }
  }

  const index = { builtAt: new Date().toISOString(), count: Object.keys(bySku).length, bySku };
  if (!dryRun) {
    fs.mkdirSync(path.dirname(SHOP_INDEX), { recursive: true });
    fs.writeFileSync(SHOP_INDEX, JSON.stringify(index, null, 2), "utf8");
  }
  return index;
}

async function resolveShopPdpUrl(row, shopIndex) {
  const sku = String(row.sku || "").toUpperCase();
  if (row.inoksan_shop_url && !force) return row.inoksan_shop_url;

  const direct = shopIndex.bySku?.[sku] || shopIndex.bySku?.[`INO-${skuCore(sku)}`];
  if (direct) return direct;

  const searchUrls = [
    `${SHOP_ORIGIN}/Arama?Kelime=${encodeURIComponent(sku)}`,
    `${SHOP_ORIGIN}/arama?Kelime=${encodeURIComponent(sku)}`,
    `${SHOP_ORIGIN}/arama?q=${encodeURIComponent(sku)}`,
    `${SHOP_ORIGIN}/search?q=${encodeURIComponent(sku)}`,
  ];

  for (const su of searchUrls) {
    try {
      const html = await getText(su);
      const fromListing = findSkuInListingHtml(html, sku);
      if (fromListing) return fromListing;
      const first = extractProductLinksFromHtml(html)[0];
      if (first) return first;
    } catch {
      /* next */
    }
    await sleep(120);
  }
  return "";
}

async function fetchInoksanComDescription(row, webCtx) {
  const byId = webCtx?.byId;
  const id = row.inoksan_web_id;
  const slug = row.inoksan_slug;
  if (id && slug) {
    try {
      const html = await getText(`https://inoksan.com/urun/${id}/${slug}`);
      const parsed = parseInoksanComPdpHtml(html);
      if (parsed?.description) return parsed;
    } catch {
      /* web index fallback */
    }
    const indexed = byId?.get(String(id));
    const fromIndex = buildInoksanComIndexDescription(indexed);
    if (fromIndex) {
      fromIndex.url = row.inoksan_url || `https://inoksan.com/urun/${id}/${slug}`;
      return fromIndex;
    }
  }

  if (webCtx) {
    const match = matchInoksanWeb(
      row.sku,
      row.name || row.inoksan_excel_name || "",
      webCtx.products,
      webCtx.codeIndex,
    );
    if (match?.product?.id && match.product.slug) {
      try {
        const html = await getText(
          `https://inoksan.com/urun/${match.product.id}/${match.product.slug}`,
        );
        const parsed = parseInoksanComPdpHtml(html);
        if (parsed?.description) {
          row.inoksan_web_id = match.product.id;
          row.inoksan_slug = match.product.slug;
          row.inoksan_url = `https://inoksan.com/urun/${match.product.id}/${match.product.slug}`;
          return parsed;
        }
      } catch {
        /* ignore */
      }
      const fromIndex = buildInoksanComIndexDescription(match.product);
      if (fromIndex) {
        row.inoksan_web_id = match.product.id;
        row.inoksan_slug = match.product.slug;
        row.inoksan_url = `https://inoksan.com/urun/${match.product.id}/${match.product.slug}`;
        fromIndex.url = row.inoksan_url;
        return fromIndex;
      }
    }
  }
  return null;
}

function writeJsonAtomic(dest, data) {
  const tmp = `${dest}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data), "utf8");
  fs.renameSync(tmp, dest);
}

function saveDepts(entries) {
  const byFile = new Map();
  for (const { row, file } of entries) {
    if (!byFile.has(file)) byFile.set(file, new Map());
    byFile.get(file).set(row.sku, row);
  }
  for (const [file, map] of byFile) {
    const dest = path.join(DEPT_DIR, file);
    const full = JSON.parse(fs.readFileSync(dest, "utf8"));
    const out = full.map((r) => (map.has(r.sku) ? map.get(r.sku) : r));
    if (!dryRun) writeJsonAtomic(dest, out);
  }
}

async function main() {
  const entries = loadInoksanRows();
  if (!entries.length) {
    console.log("[inoksan-shop] İnoksan satırı yok");
    process.exit(1);
  }

  console.log(`[inoksan-shop] ${entries.length} satır — shop index:${skipIndex ? "atlandı" : "açık"} comFirst:${comFirst}`);

  let webCtx = null;
  if (fs.existsSync(WEB_INDEX)) {
    const webIndex = JSON.parse(fs.readFileSync(WEB_INDEX, "utf8"));
    const products = Array.isArray(webIndex?.products) ? webIndex.products : [];
    webCtx = {
      products,
      codeIndex: buildWebCodeIndex(products),
      byId: new Map(products.map((p) => [String(p.id), p])),
    };
  }

  const shopIndex = await buildShopLinkIndex();
  let shopOk = 0;
  let comOk = 0;
  let missing = [];

  for (let i = 0; i < entries.length; i++) {
    const { row } = entries[i];
    const sku = String(row.sku || "").toUpperCase();

    if (
      !force &&
      row.inoksan_shop_description &&
      row.description &&
      String(row.inoksan_description_at || "").slice(0, 10) >= new Date().toISOString().slice(0, 10)
    ) {
      shopOk++;
      continue;
    }

    let payload = null;

    if (comFirst) {
      const com = await fetchInoksanComDescription(row, webCtx);
      if (com?.description) {
        payload = {
          description: com.description,
          bullets: com.bullets,
          specBullets: com.specBullets,
          descBullets: com.descBullets,
          source: com.source,
          url: row.inoksan_url || "",
          shopSku: sku,
        };
        comOk++;
      }
    }

    if (!payload) {
      const shopUrl = await resolveShopPdpUrl(row, shopIndex);
      if (shopUrl) {
        try {
          const html = await getText(shopUrl);
          const page = parseShopProductPage(html, shopUrl);
          if (page?.description && skuMatchesPage(page.shopSku || sku, sku)) {
            payload = {
              description: page.description,
              bullets: page.bullets,
              source: page.source || "inoksanshop.com.tr",
              url: shopUrl,
              shopSku: page.shopSku || sku,
            };
            shopOk++;
          }
        } catch {
          /* fallback */
        }
      }
    }

    if (!payload && !comFirst) {
      const com = await fetchInoksanComDescription(row, webCtx);
      if (com?.description) {
        payload = {
          description: com.description,
          bullets: com.bullets,
          specBullets: com.specBullets,
          descBullets: com.descBullets,
          source: com.source,
          url: row.inoksan_url || "",
          shopSku: sku,
        };
        comOk++;
      }
    }

    if (payload) {
      applyInoksanDescription(row, payload);
    } else {
      missing.push(sku);
    }

    if ((i + 1) % 25 === 0 || i === entries.length - 1) {
      console.log(`[inoksan-shop] ${i + 1}/${entries.length} shop:${shopOk} com:${comOk} eksik:${missing.length}`);
      if (!dryRun && (i + 1) % 25 === 0) saveDepts(entries);
    }
    await sleep(150);
  }

  const report = {
    at: new Date().toISOString(),
    total: entries.length,
    shopDescriptions: shopOk,
    inoksanComFallback: comOk,
    missing: missing.length,
    missingSkus: missing.slice(0, 200),
  };

  console.log(
    `[inoksan-shop] tamam — shop:${shopOk} inoksan.com yedek:${comOk} eksik:${missing.length}/${entries.length}`,
  );

  if (!dryRun) {
    saveDepts(entries);
    fs.writeFileSync(REPORT, JSON.stringify(report, null, 2), "utf8");
    spawnSync(process.execPath, ["scripts/rebuild-ekipmanlar-from-dept.mjs"], {
      cwd: ROOT,
      stdio: "inherit",
    });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
