#!/usr/bin/env node
/**
 * vosco.com.tr → scripts/data/vosco/vosco-web-catalog.json
 *
 *   node scripts/scrape-vosco-catalog.mjs
 *   node scripts/scrape-vosco-catalog.mjs --limit 5
 *   node scripts/scrape-vosco-catalog.mjs --no-media
 */
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "scripts/data/vosco");
const OUT_JSON = path.join(OUT_DIR, "vosco-web-catalog.json");
const OUT_RAPOR = path.join(OUT_DIR, "vosco-web-rapor.md");
const OUT_MEDIA = path.join(OUT_DIR, "images");

const BASE = "https://vosco.com.tr";
const SITEMAP = `${BASE}/sitemap/products/0.xml`;
const UA = "EqustoImport/1.0 (+https://equsto.com; vosco-catalog)";

const args = process.argv.slice(2);
const skipMedia = args.includes("--no-media");
const limitArg = args.includes("--limit") ? Number(args[args.indexOf("--limit") + 1]) : 0;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function decodeHtml(s) {
  return String(s || "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function stripTags(html) {
  return decodeHtml(String(html || "").replace(/<[^>]+>/g, " "));
}

function parseDimensions(text) {
  const s = String(text || "");
  const cm = s.match(/(\d+(?:[.,]\d+)?)\s*[x×X*]\s*(\d+(?:[.,]\d+)?)\s*[x×X*]\s*(\d+(?:[.,]\d+)?)\s*cm/i);
  if (cm) {
    return {
      raw: cm[0],
      genislik_cm: Number(cm[1].replace(",", ".")),
      derinlik_cm: Number(cm[2].replace(",", ".")),
      yukseklik_cm: Number(cm[3].replace(",", ".")),
    };
  }
  const mm = s.match(/(\d{2,4})\s*[x×X*]\s*(\d{2,4})\s*[x×X*]\s*(\d{2,4})/);
  if (mm) {
    return {
      raw: mm[0],
      genislik_mm: Number(mm[1]),
      derinlik_mm: Number(mm[2]),
      yukseklik_mm: Number(mm[3]),
    };
  }
  return null;
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.text();
}

function parseSitemapUrls(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => m[1].trim())
    .filter((u) => u.startsWith(BASE) && !u.includes("/sitemap/"));
}

function parseProductDetailModel(html) {
  const marker = "var productDetailModel = ";
  const start = html.indexOf(marker);
  if (start < 0) return null;
  let i = start + marker.length;
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (; i < html.length; i++) {
    const c = html[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') {
      inStr = true;
      continue;
    }
    if (c === "{") depth++;
    if (c === "}") {
      depth--;
      if (depth === 0) {
        i++;
        break;
      }
    }
  }
  try {
    return JSON.parse(html.slice(start + marker.length, i));
  } catch {
    return null;
  }
}

function parseJsonLd(html) {
  const m = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);
  if (!m) return null;
  try {
    const j = JSON.parse(m[1]);
    return Array.isArray(j) ? j.find((x) => x["@type"] === "Product") : j;
  } catch {
    return null;
  }
}

function parseDescriptionHtml(html) {
  const m = html.match(/id="divTabOzellikler"[\s\S]*?<div class="urunTabAlt">([\s\S]*?)<\/div>\s*<\/div>\s*<div id="divTabYorumlar"/i);
  return m ? m[1].trim() : "";
}

function parseTeknikDetay(html) {
  const out = {};
  for (const m of html.matchAll(/class="teknikDetayItem[^"]*"[\s\S]*?<div class="t1">([^<]+)<\/div>[\s\S]*?<span>([^<]+)<\/span>/gi)) {
    out[m[1].trim()] = m[2].trim();
  }
  return out;
}

function techFromModel(model) {
  const out = {};
  for (const t of model?.customTechnicalDetails || []) {
    const key = t.tanim || t.className;
    const val = t.degerler?.[0]?.tanim;
    if (key && val) out[key] = val;
  }
  return out;
}

function categoryFromModel(model) {
  const bc = model?.breadCrumb || [];
  const leaf = bc.find((b) => b.pid && b.pid !== 0) || bc[0];
  return {
    category: leaf?.tanim || "",
    categoryPath: bc.map((b) => b.tanim).filter(Boolean).reverse().join(" > "),
    categoryUrl: leaf?.urlKod || "",
  };
}

async function downloadImage(url, dest) {
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (!res.ok) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    await fsp.mkdir(path.dirname(dest), { recursive: true });
    await fsp.writeFile(dest, buf);
    return true;
  } catch {
    return false;
  }
}

async function scrapeProduct(url) {
  const html = await fetchText(url);
  const model = parseProductDetailModel(html);
  const ld = parseJsonLd(html);
  const descHtml = parseDescriptionHtml(html);
  const teknik = { ...parseTeknikDetay(descHtml), ...techFromModel(model) };
  const cat = categoryFromModel(model);
  const images = (model?.productImages || [])
    .map((im) => im.bigImagePath || im.imagePath)
    .filter(Boolean);
  if (!images.length && ld?.image) {
    images.push(...(Array.isArray(ld.image) ? ld.image : [ld.image]));
  }

  const boyut = teknik["Ürün Boyutu"] || teknik["Boyut"] || "";
  const olculer = parseDimensions(boyut) || parseDimensions(model?.productName || "");

  return {
    productId: model?.productId,
    stockCode: model?.stockCode || "",
    title: model?.productName || ld?.name || "",
    brand: model?.brandName || "Vosco",
    url,
    category: cat.category,
    categoryPath: cat.categoryPath,
    categoryUrl: cat.categoryUrl,
    description: stripTags(descHtml).slice(0, 8000),
    descriptionHtml: descHtml.slice(0, 12000),
    teknik_ozellikler: teknik,
    olculer,
    images,
    sitePriceTry: model?.productPriceKDVIncluded || model?.productPrice || null,
    sitePriceStr: model?.productPriceStr || ld?.offers?.price || null,
  };
}

async function main() {
  await fsp.mkdir(OUT_DIR, { recursive: true });
  await fsp.mkdir(OUT_MEDIA, { recursive: true });

  console.log("Sitemap okunuyor…", SITEMAP);
  const xml = await fetchText(SITEMAP);
  let urls = parseSitemapUrls(xml);
  console.log(`Ürün URL: ${urls.length}`);
  if (limitArg > 0) urls = urls.slice(0, limitArg);

  const products = [];
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    process.stdout.write(`[${i + 1}/${urls.length}] ${url.replace(BASE, "")}… `);
    try {
      const p = await scrapeProduct(url);
      products.push(p);
      console.log(p.stockCode || "—");
    } catch (e) {
      console.log(`HATA: ${e.message}`);
    }
    await sleep(400);
  }

  if (!skipMedia) {
    console.log("\nGörseller indiriliyor…");
    for (const p of products) {
      const img = p.images?.[0];
      if (!img) continue;
      let ext = path.extname(new URL(img).pathname) || ".jpg";
      if (!/^\.(jpe?g|png|webp|gif)$/i.test(ext)) ext = ".jpg";
      const safe = `${p.productId || p.stockCode || "p"}${ext}`.replace(/[^\w.-]+/g, "-");
      const dest = path.join(OUT_MEDIA, safe);
      const ok = await downloadImage(img, dest);
      if (ok) p.localImage = path.relative(OUT_DIR, dest).replace(/\\/g, "/");
    }
  }

  const catalog = {
    source: BASE,
    scrapedAt: new Date().toISOString(),
    productCount: products.length,
    products,
  };
  await fsp.writeFile(OUT_JSON, JSON.stringify(catalog, null, 2), "utf8");

  const withCode = products.filter((p) => p.stockCode).length;
  const withImg = products.filter((p) => p.images?.length).length;
  const withTeknik = products.filter((p) => Object.keys(p.teknik_ozellikler || {}).length).length;
  const rapor = [
    "# Vosco web katalog raporu",
    "",
    `Kaynak: [vosco.com.tr](${BASE})`,
    `Tarih: ${catalog.scrapedAt}`,
    `Ürün: **${products.length}**`,
    "",
    `- Stok kodu: ${withCode}/${products.length}`,
    `- Görsel: ${withImg}/${products.length}`,
    `- Teknik özellik: ${withTeknik}/${products.length}`,
  ].join("\n");
  await fsp.writeFile(OUT_RAPOR, rapor, "utf8");
  console.log(`\nYazıldı: ${OUT_JSON}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
