#!/usr/bin/env node
/**
 * samixir.com/tr/urunler → scripts/data/samixir/samixir-web-catalog.json
 *
 *   node scripts/scrape-samixir-catalog.mjs
 *   node scripts/scrape-samixir-catalog.mjs --limit 3
 *   node scripts/scrape-samixir-catalog.mjs --no-media
 */
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "scripts/data/samixir");
const OUT_JSON = path.join(OUT_DIR, "samixir-web-catalog.json");
const OUT_RAPOR = path.join(OUT_DIR, "samixir-web-rapor.md");
const OUT_MEDIA = path.join(OUT_DIR, "images");

const BASE = "https://www.samixir.com";
const LIST_URL = `${BASE}/tr/urunler`;
const UA = "EqustoImport/1.0 (+https://equsto.com; samixir-catalog)";

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
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, " ")
    .trim();
}

function stripTags(html) {
  return decodeHtml(String(html || "").replace(/<[^>]+>/g, " "));
}

function parseDimensions(specs, html) {
  const w =
    specs["Genişlik"]?.match(/(\d+(?:[.,]\d+)?)\s*mm/i)?.[1] ||
    html.match(/Genişlik[\s\S]{0,120}?(\d+(?:[.,]\d+)?)\s*mm/i)?.[1];
  const d =
    specs["Derinlik"]?.match(/(\d+(?:[.,]\d+)?)\s*mm/i)?.[1] ||
    html.match(/Derinlik[\s\S]{0,120}?(\d+(?:[.,]\d+)?)\s*mm/i)?.[1];
  const h =
    specs["Yükseklik"]?.match(/(\d+(?:[.,]\d+)?)\s*mm/i)?.[1] ||
    html.match(/Yükseklik[\s\S]{0,120}?(\d+(?:[.,]\d+)?)\s*mm/i)?.[1];
  if (w && d && h) {
    const raw = `${w} x ${d} x ${h} mm`;
    return {
      raw,
      genislik_mm: Math.round(Number(String(w).replace(",", "."))),
      derinlik_mm: Math.round(Number(String(d).replace(",", "."))),
      yukseklik_mm: Math.round(Number(String(h).replace(",", "."))),
    };
  }
  return null;
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.text();
}

async function discoverSlugs() {
  const pages = [
    LIST_URL,
    `${BASE}/tr/kategori/kopuklu-ayran`,
    `${BASE}/tr/kategori/ayran`,
    `${BASE}/tr/kategori/slush-milkshake`,
    `${BASE}/tr/kategori/sicak-icecek`,
  ];
  const slugs = new Set();
  for (const url of pages) {
    const html = await fetchText(url);
    for (const m of html.matchAll(/\/tr\/urun\/([a-z0-9-]+)/gi)) slugs.add(m[1]);
  }
  return [...slugs].sort();
}

function parseSpecBlock(html) {
  const specs = {};
  const block =
    html.match(/Kapasite[\s\S]{0,12000}?Besleme Voltajı[\s\S]{0,200}?<\/div>\s*<\/div>/i)?.[0] ||
    html.match(/Ağırlık ve Ölçüler[\s\S]{0,12000}?Besleme Voltajı[\s\S]{0,200}?<\/div>\s*<\/div>/i)?.[0] ||
    html.match(/Teknik Detaylar[\s\S]{0,12000}/i)?.[0] ||
    html;

  for (const m of block.matchAll(
    /<div class="col-6" style="font-weight:\s*500;\s*">([^<]+)<\/div>\s*<div class="col-6">([\s\S]*?)<\/div>\s*<\/div>/gi,
  )) {
    const key = decodeHtml(m[1]);
    let val = decodeHtml(m[2].replace(/<[^>]+>/g, " "));
    if (/Makine|Koli/.test(key)) continue;
    if (key === "Ağırlık ve Ölçüler") continue;
    if (key && val) specs[key] = val;
  }

  // Makine ölçüleri (ilk sütun)
  const dimRows = ["Ağırlık", "Genişlik", "Derinlik", "Yükseklik"];
  for (const label of dimRows) {
    const m = block.match(
      new RegExp(
        `${label}[\\s\\S]{0,80}?<div class="col-6">\\s*([^<]+?)\\s*</div>\\s*<div class="col-6">`,
        "i",
      ),
    );
    if (m) specs[label] = decodeHtml(m[1]);
  }

  return specs;
}

function parseCategory(html, slug) {
  const hay = stripTags(html).toLocaleLowerCase("tr");
  if (/slush|milkshake|buzlu/.test(hay)) return "Slush/Milkshake";
  if (/sıcak|sicak|hot|salep|çikolata|bain/.test(hay)) return "Sıcak İçecek";
  if (/ayran|köpük|kopuk/.test(hay)) return "Köpüklü Ayran";
  if (/panoramik|fiskiye|kam/.test(hay)) return "Panoramik";
  if (/klasik/.test(hay)) return "Klasik";
  return "Samixir";
}

function parseImages(html) {
  return [
    ...new Set(
      [...html.matchAll(/<img[^>]+src="([^"]+)"/gi)]
        .map((m) => m[1])
        .filter((u) => /uploads\/(urunler|images)\//.test(u) && !/no-photo|pdf\.png/i.test(u))
        .map((u) => (u.startsWith("http") ? u : BASE + u)),
    ),
  ];
}

function parseDescription(html) {
  const meta = decodeHtml(html.match(/<meta name="description" content="([^"]+)"/i)?.[1]);
  if (meta) return meta;
  const p = html.match(/class="[^"]*product[^"]*description[^"]*"[^>]*>([\s\S]*?)<\/p>/i);
  return p ? stripTags(p[1]) : "";
}

async function downloadImage(url, dest) {
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (!res.ok) return false;
    await fsp.mkdir(path.dirname(dest), { recursive: true });
    await fsp.writeFile(dest, Buffer.from(await res.arrayBuffer()));
    return true;
  } catch {
    return false;
  }
}

async function scrapeProduct(slug) {
  const url = `${BASE}/tr/urun/${slug}`;
  const html = await fetchText(url);
  const title =
    decodeHtml(html.match(/<title>([^<|]+)/i)?.[1]) ||
    slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const teknik_ozellikler = parseSpecBlock(html);
  const olculer = parseDimensions(teknik_ozellikler, html);
  const images = parseImages(html);
  let localImage = null;
  if (!skipMedia && images[0]) {
    const ext = path.extname(new URL(images[0]).pathname) || ".jpg";
    const safe = `${slug}${ext}`;
    const dest = path.join(OUT_MEDIA, safe);
    if (await downloadImage(images[0], dest)) localImage = `images/${safe}`;
  }

  return {
    slug,
    url,
    title,
    category: parseCategory(html, slug),
    description: parseDescription(html),
    teknik_ozellikler,
    olculer,
    images,
    localImage,
    gallery_count: images.length,
  };
}

async function main() {
  console.log("[samixir] slug keşfi…");
  let slugs = await discoverSlugs();
  if (limitArg > 0) slugs = slugs.slice(0, limitArg);
  console.log(`[samixir] ${slugs.length} ürün`);

  const products = [];
  for (let i = 0; i < slugs.length; i++) {
    const slug = slugs[i];
    console.log(`[samixir] ${i + 1}/${slugs.length} ${slug}`);
    products.push(await scrapeProduct(slug));
    if (i < slugs.length - 1) await sleep(400);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    OUT_JSON,
    JSON.stringify(
      {
        fetched_at: new Date().toISOString(),
        source: LIST_URL,
        count: products.length,
        products,
      },
      null,
      2,
    ),
    "utf8",
  );

  const md = [
    "# Samixir web katalog scrape",
    "",
    `Tarih: ${new Date().toISOString().slice(0, 19)}`,
    `Ürün: **${products.length}**`,
    "",
    "| Slug | Başlık | Görsel | Ölçü |",
    "|------|--------|:------:|------|",
    ...products.map(
      (p) =>
        `| ${p.slug} | ${p.title} | ${p.localImage || p.images[0] ? "✓" : "—"} | ${p.olculer?.raw || "—"} |`,
    ),
  ].join("\n");
  fs.writeFileSync(OUT_RAPOR, md, "utf8");
  console.log(`[out] ${OUT_JSON}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
