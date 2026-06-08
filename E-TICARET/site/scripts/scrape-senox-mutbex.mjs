#!/usr/bin/env node
/**
 * mutbex.com/senox → scripts/data/senox/mutbex/
 *
 *   node scripts/scrape-senox-mutbex.mjs
 *   node scripts/scrape-senox-mutbex.mjs --no-media
 *   node scripts/scrape-senox-mutbex.mjs --limit 10
 *   node scripts/scrape-senox-mutbex.mjs --detail   # açıklama + tüm görseller
 */
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "scripts/data/senox/mutbex");
const OUT_JSON = path.join(OUT_DIR, "senox-mutbex-catalog.json");
const OUT_RAPOR = path.join(OUT_DIR, "senox-mutbex-rapor.md");
const OUT_MEDIA = path.join(OUT_DIR, "images");

const BASE = "https://www.mutbex.com";
const BRAND_URL = `${BASE}/senox`;
const UA = "EqustoImport/1.0 (+https://equsto.com; mutbex-catalog)";

const args = process.argv.slice(2);
const skipMedia = args.includes("--no-media");
const withDetail = args.includes("--detail");
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
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, " ")
    .trim();
}

function stripTags(html) {
  return decodeHtml(String(html || "").replace(/<[^>]+>/g, " "));
}

function normUrl(href) {
  if (!href) return "";
  try {
    const u = new URL(href, BASE);
    if (!u.hostname.includes("mutbex.com")) return "";
    u.hash = "";
    return u.toString();
  } catch {
    return "";
  }
}

/** 118.BBC.250 → BBC-250, 118.SNX17.S → SNX17-S */
function mutbexCodeToModel(code) {
  let c = String(code || "").trim().toUpperCase();
  c = c.replace(/^118\./, "").replace(/^286\./, "");
  c = c.replace(/\./g, "-");
  c = c.replace(/([A-Z])(\d)/g, "$1-$2").replace(/--+/g, "-");
  return c.replace(/^-|-$/g, "");
}

function parseDimensions(text) {
  const s = String(text || "");
  const mm = s.match(/(\d{2,4})\s*[x×X*,]\s*(\d{2,4})\s*[x×X*,]\s*(\d{2,4})/);
  if (mm) {
    return {
      raw: mm[0],
      genislik_mm: Number(mm[1].replace(",", ".")),
      derinlik_mm: Number(mm[2].replace(",", ".")),
      yukseklik_mm: Number(mm[3].replace(",", ".")),
    };
  }
  const two = s.match(/(\d{2,4})\s*[x×X*,]\s*(\d{2,4})\s*cm/i);
  if (two) {
    return {
      raw: two[0],
      genislik_mm: Number(two[1]) * 10,
      derinlik_mm: Number(two[2]) * 10,
    };
  }
  return null;
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

function parseItemListJsonLd(html) {
  const re = /<script type="application\/ld\+json">\s*(\{"@context"[\s\S]*?"@type":"ItemList"[\s\S]*?\})\s*<\/script>/g;
  const items = new Map();
  let m;
  while ((m = re.exec(html))) {
    try {
      const data = JSON.parse(m[1]);
      for (const el of data.itemListElement || []) {
        const p = el.item;
        if (!p || p["@type"] !== "Product") continue;
        const id = p.productID || p.sku;
        items.set(String(id), {
          name: p.name,
          sku: p.sku,
          productId: p.productID,
          url: p.url,
          images: Array.isArray(p.image) ? p.image : p.image ? [p.image] : [],
          description: p.description || "",
          category: p.category || "",
          gtin: p.gtin13 || "",
          priceTry: p.offers?.price ? Number(p.offers.price) : null,
          priceCurrency: p.offers?.priceCurrency || "TRY",
        });
      }
    } catch {
      /* skip */
    }
  }
  return items;
}

function mergeListingItem(row, ld) {
  const code = row.supplier_code || row.code || ld?.sku || "";
  const title = row.name || ld?.name || code;
  const url = normUrl(row.url ? `${BASE}/${row.url.replace(/^\//, "")}` : ld?.url);
  const images = [...new Set([...(ld?.images || []), row.image].filter(Boolean))];
  const categoryPath = row.category_path || ld?.category || "";
  const parts = categoryPath.split(">").map((s) => s.trim()).filter(Boolean);

  return {
    mutbexId: String(row.id || ld?.productId || ""),
    model: mutbexCodeToModel(code),
    mutbexCode: code,
    title,
    url,
    brand: row.brand || "Senox",
    category: row.category || parts.at(-1) || "",
    categoryGroup: parts[0] || "",
    categoryPath: parts.join(" > "),
    priceEur: row.sale_price != null ? row.sale_price / 50 : null,
    priceEurRaw: row.sale_price ?? null,
    priceTry: row.total_sale_price ?? ld?.priceTry ?? null,
    priceTryList: row.total_base_price ?? null,
    currency: row.currency || "EUR",
    currencyTarget: row.currency_target || "TL",
    stockQty: row.quantity ?? null,
    images,
    description: ld?.description || "",
    gtin: ld?.gtin || "",
    olculer: parseDimensions(title),
    source: "mutbex.com",
  };
}

function parseDetailPage(html) {
  const images = [];
  for (const m of html.matchAll(/product-images-gallery[\s\S]*?<\/div>\s*<\/div>/gi)) {
    for (const im of m[0].matchAll(/href="(https:\/\/www\.mutbex\.com\/[^"]+\.(?:jpg|jpeg|png|webp))"/gi)) {
      const u = im[1].replace(/-O\.(jpg|jpeg)/i, "-B.$1");
      if (!images.includes(u)) images.push(u);
    }
    for (const im of m[0].matchAll(/data-image="(https:\/\/www\.mutbex\.com\/[^"]+)"/gi)) {
      if (!images.includes(im[1])) images.push(im[1]);
    }
  }
  const bodyM = html.match(/id="product-fullbody"[^>]*>([\s\S]*?)<\/div>/i);
  const descriptionHtml = bodyM ? bodyM[1] : "";
  const description = stripTags(descriptionHtml);
  const codeM = html.match(/id="supplier-product-code"[^>]*>([^<]+)</i);
  return {
    images: [...new Set(images)],
    description,
    mutbexCode: codeM ? codeM[1].trim() : "",
  };
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

async function downloadImage(url, destPath) {
  if (!url) return false;
  try {
    await fsp.mkdir(path.dirname(destPath), { recursive: true });
    if (fs.existsSync(destPath)) return true;
    if (skipMedia) return false;
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Referer: BASE },
      signal: AbortSignal.timeout(120000),
    });
    if (!res.ok) return false;
    await fsp.writeFile(destPath, Buffer.from(await res.arrayBuffer()));
    return true;
  } catch {
    return false;
  }
}

function slugFromUrl(url) {
  try {
    return new URL(url).pathname.replace(/^\//, "").replace(/[^a-z0-9-]/gi, "-").slice(0, 80);
  } catch {
    return "product";
  }
}

function buildReport(catalog) {
  const lines = [];
  lines.push("# Senox — Mutbex katalog raporu");
  lines.push("");
  lines.push(`Kaynak: [mutbex.com/senox](${BRAND_URL})`);
  lines.push(`Tarih: ${catalog.scrapedAt}`);
  lines.push(`Toplam ürün: **${catalog.productCount}**`);
  lines.push("");

  const byCat = {};
  for (const p of catalog.products) {
    byCat[p.category] = (byCat[p.category] || 0) + 1;
  }
  lines.push("## Kategori dağılımı");
  lines.push("");
  lines.push("| Kategori | Adet |");
  lines.push("|----------|------|");
  for (const [cat, n] of Object.entries(byCat).sort((a, b) => b[1] - a[1])) {
    lines.push(`| ${cat} | ${n} |`);
  }
  lines.push("");

  const withImg = catalog.products.filter((p) => p.images?.length).length;
  const withLocal = catalog.products.filter((p) => p.localImage).length;
  const withEur = catalog.products.filter((p) => p.priceEur != null).length;
  const withDims = catalog.products.filter((p) => p.olculer).length;

  lines.push("## Veri kalitesi");
  lines.push("");
  lines.push(`- Görsel URL: ${withImg}/${catalog.productCount}`);
  lines.push(`- İndirilen görsel: ${withLocal}/${catalog.productCount}`);
  lines.push(`- EUR fiyat (liste): ${withEur}/${catalog.productCount}`);
  lines.push(`- Başlıktan ölçü: ${withDims}/${catalog.productCount}`);
  lines.push("");

  lines.push("## Örnek ürünler");
  lines.push("");
  for (const p of catalog.products.slice(0, 15)) {
    lines.push(`- **${p.mutbexCode}** (${p.model}) — ${p.title}`);
    lines.push(`  - ${p.priceEur ?? "?"} EUR / ${p.priceTry ?? "?"} TL — [link](${p.url})`);
  }

  return lines.join("\n");
}

async function fetchBrandPages() {
  const byId = new Map();
  let page = 1;
  let maxPage = 1;

  while (page <= maxPage) {
    const url = page === 1 ? BRAND_URL : `${BRAND_URL}?pg=${page}`;
    process.stdout.write(`Liste sayfa ${page}… `);
    const html = await fetchHtml(url);
    const pushes = parseProductDataPushes(html);
    const ld = parseItemListJsonLd(html);
    console.log(`${pushes.length} ürün`);

    for (const row of pushes) {
      if ((row.brand || "").toLowerCase() !== "senox") continue;
      const extra = ld.get(String(row.id));
      const item = mergeListingItem(row, extra);
      byId.set(item.mutbexId || item.mutbexCode, item);
    }

    const pagM = html.match(/title="(\d+)\. sayfaya git"[^>]*href="senox\?pg=(\d+)"/g);
    if (pagM) {
      for (const pm of pagM) {
        const n = Number(pm.match(/pg=(\d+)/)?.[1] || 0);
        if (n > maxPage) maxPage = n;
      }
    }
    const lastM = html.match(/class="last"[^>]*href="senox\?pg=(\d+)"/);
    if (lastM) maxPage = Math.max(maxPage, Number(lastM[1]));

    page++;
    await sleep(500);
  }

  return [...byId.values()];
}

async function main() {
  await fsp.mkdir(OUT_DIR, { recursive: true });
  await fsp.mkdir(OUT_MEDIA, { recursive: true });

  console.log("Mutbex Senox marka sayfası taranıyor…");
  let products = await fetchBrandPages();
  products.sort((a, b) => a.title.localeCompare(b.title, "tr"));
  console.log(`\nBenzersiz ürün: ${products.length}`);

  if (limitArg > 0) products = products.slice(0, limitArg);

  if (withDetail) {
    console.log(`\nDetay sayfaları (${products.length})…`);
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      process.stdout.write(`  [${i + 1}/${products.length}] ${p.mutbexCode}… `);
      try {
        const html = await fetchHtml(p.url);
        const det = parseDetailPage(html);
        if (det.description) p.description = det.description;
        if (det.images.length) p.images = [...new Set([...det.images, ...det.images])];
        if (det.mutbexCode) p.mutbexCode = det.mutbexCode;
        p.olculer = p.olculer || parseDimensions(p.title + " " + p.description);
        console.log("OK");
      } catch (e) {
        console.log(`HATA: ${e.message}`);
      }
      await sleep(350);
    }
  }

  console.log("\nGörseller indiriliyor…");
  for (const p of products) {
    const img = p.images?.[0];
    if (!img) continue;
    let ext = path.extname(new URL(img).pathname) || ".jpg";
    if (!/^\.(jpe?g|png|webp|gif)$/i.test(ext)) ext = ".jpg";
    const safe = `${p.mutbexId || slugFromUrl(p.url)}${ext}`;
    const dest = path.join(OUT_MEDIA, safe);
    const ok = await downloadImage(img, dest);
    if (ok) p.localImage = path.relative(OUT_DIR, dest).replace(/\\/g, "/");
  }

  const catalog = {
    source: BRAND_URL,
    scrapedAt: new Date().toISOString(),
    productCount: products.length,
    products,
  };

  await fsp.writeFile(OUT_JSON, JSON.stringify(catalog, null, 2), "utf8");
  await fsp.writeFile(OUT_RAPOR, buildReport(catalog), "utf8");

  console.log(`\nYazıldı:\n  ${OUT_JSON}\n  ${OUT_RAPOR}`);
  console.log(`  Görseller: ${OUT_MEDIA}`);
  console.log(`  Görsel indirilen: ${products.filter((p) => p.localImage).length}/${products.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
