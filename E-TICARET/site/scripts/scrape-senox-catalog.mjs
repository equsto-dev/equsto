#!/usr/bin/env node
/**
 * senox.com.tr/tr → scripts/data/senox/
 *
 *   node scripts/scrape-senox-catalog.mjs
 *   node scripts/scrape-senox-catalog.mjs --no-media
 *   node scripts/scrape-senox-catalog.mjs --limit 5
 */
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "scripts/data/senox");
const OUT_JSON = path.join(OUT_DIR, "senox-catalog.json");
const OUT_RAPOR = path.join(OUT_DIR, "senox-scrape-rapor.md");
const OUT_MEDIA = path.join(OUT_DIR, "images");

const BASE = "https://senox.com.tr";
const TR = `${BASE}/tr`;
const UA = "EqustoImport/1.0 (+https://equsto.com; catalog-research)";

const CATEGORIES = [
  { slug: "derin-dondurucular", name: "Derin Dondurucular", group: "Soğutma" },
  { slug: "su-sebilleri", name: "Su Sebilleri", group: "Soğutma" },
  { slug: "teshir-dolaplari", name: "Teşhir Dolapları", group: "Soğutma" },
  { slug: "sise-sogutucular", name: "Şişe Soğutucular", group: "Soğutma" },
  { slug: "buz-makinalari", name: "Buz Makinaları", group: "Soğutma" },
  { slug: "-sitici-lambalar", name: "Isıtıcı Lambalar", group: "Kahve Ekipmanları" },
  { slug: "filtre-kahve-makinalari", name: "Filtre Kahve Makinaları", group: "Kahve Ekipmanları" },
  { slug: "sut-sogutucular", name: "Süt Soğutucular", group: "Kahve Ekipmanları" },
  { slug: "el-blenderleri", name: "El Blenderleri", group: "Hazırlık Ekipmanları" },
  { slug: "mutfak-sefi", name: "Mutfak Şefi", group: "Hazırlık Ekipmanları" },
];

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
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&uuml;/g, "ü")
    .replace(/&Uuml;/g, "Ü")
    .replace(/&ouml;/g, "ö")
    .replace(/&Ouml;/g, "Ö")
    .replace(/&ccedil;/g, "ç")
    .replace(/&Ccedil;/g, "Ç")
    .replace(/&rsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function stripTags(html) {
  return decodeHtml(
    String(html || "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<\/tr>/gi, "\n")
      .replace(/<\/td>/gi, " | ")
      .replace(/<[^>]+>/g, " ")
  );
}

function normUrl(href) {
  if (!href || href === "#" || href.startsWith("javascript:")) return "";
  try {
    const u = new URL(href, TR);
    if (!u.hostname.includes("senox.com.tr")) return "";
    if (!u.pathname.startsWith("/tr/")) return "";
    const p = u.pathname.replace(/\/+$/, "");
    if (p === "/tr" || p === "/tr/contact" || p === "/tr/hakkimizda") return "";
    u.hash = "";
    u.search = "";
    return u.toString();
  } catch {
    return "";
  }
}

function slugFromUrl(url) {
  const m = String(url || "").match(/\/tr\/([^/?#]+)/);
  return m ? m[1] : "";
}

/** Model kodu: başlıktan SENOX / Senox sonrası veya bilinen pattern */
function extractModelNo(title, slug) {
  const t = String(title || "").replace(/^senox\s*[-–]?\s*/i, "").trim();
  const patterns = [
    /\b(SMR-\d+[A-Z0-9-]*)\b/i,
    /\b(SDS[-\s]?\d+[A-Z0-9-]*)\b/i,
    /\b(BBC[S]?[-\s]?\d+)\b/i,
    /\b(SNX\d+[A-Z]*)\b/i,
    /\b(BLK\d+)\b/i,
    /\b(\d{4}[A-Z]?)\b/,
    /\b(MS\d+)\b/i,
    /\b(COFFEEDO)\b/i,
  ];
  for (const re of patterns) {
    const m = t.match(re);
    if (m) return m[1].replace(/\s+/g, "-").toUpperCase();
  }
  const slugParts = slug.replace(/^senox-?/i, "").split("-");
  if (slugParts.length >= 2) {
    const candidate = slugParts.slice(0, 3).join("-").toUpperCase();
    if (/[0-9]/.test(candidate)) return candidate;
  }
  return t.split(/\s+/).slice(0, 3).join(" ").trim() || slug;
}

function parseDimensions(text) {
  const s = String(text || "");
  const mm = s.match(/(\d{2,4})\s*[x×X*]\s*(\d{2,4})\s*[x×X*]\s*(\d{2,4})\s*(?:mm|MM)?/);
  if (mm) return { raw: mm[0], genislik_mm: Number(mm[1]), derinlik_mm: Number(mm[2]), yukseklik_mm: Number(mm[3]) };
  const cm = s.match(/(\d{2,3})\s*[x×X*]\s*(\d{2,3})\s*[x×X*]\s*(\d{2,3})\s*cm/i);
  if (cm) {
    return {
      raw: cm[0],
      genislik_mm: Number(cm[1]) * 10,
      derinlik_mm: Number(cm[2]) * 10,
      yukseklik_mm: Number(cm[3]) * 10,
    };
  }
  return null;
}

function parseTable(html) {
  const tabMatch = html.match(/<div class="panel wc-tab" id="tab-description"[\s\S]*?<\/div>\s*<\/div>/i);
  if (!tabMatch) return { headers: [], rows: [], specs: {} };
  const tableHtml = tabMatch[0];
  const rows = [];
  const trRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let tr;
  while ((tr = trRe.exec(tableHtml))) {
    const cells = [];
    const tdRe = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
    let td;
    while ((td = tdRe.exec(tr[1]))) cells.push(stripTags(td[1]).trim());
    if (cells.some(Boolean)) rows.push(cells);
  }
  const headers = rows[0] || [];
  const dataRows = rows.slice(1);
  const specs = {};
  for (const row of dataRows) {
    row.forEach((val, i) => {
      const key = headers[i];
      if (key && val) specs[key] = val;
    });
  }
  return { headers, rows: dataRows, specs };
}

function parseCategoryListing(html, category) {
  const products = [];
  const liRe = /<li class="product">([\s\S]*?)<\/li>/gi;
  let li;
  while ((li = liRe.exec(html))) {
    const block = li[1];
    const hrefM = block.match(/href="(\/tr\/[^"]+)"/);
    const imgM = block.match(/<img[^>]+src="([^"]+)"/);
    const titleM = block.match(/woocommerce-loop-product__title"><a[^>]*>([^<]+)<\/a>/);
    const summaryM = block.match(/<p>([\s\S]*?)<\/p>/);
    const url = normUrl(hrefM?.[1]);
    if (!url) continue;
    products.push({
      url,
      slug: slugFromUrl(url),
      listTitle: decodeHtml(titleM?.[1] || ""),
      listImage: imgM?.[1] || "",
      listSummary: summaryM ? stripTags(summaryM[1]).trim() : "",
      category: category.name,
      categoryGroup: category.group,
      categorySlug: category.slug,
    });
  }
  return products;
}

function parseProductDetail(html, listing) {
  const titleM = html.match(/<div class="summary entry-summary">\s*<h1>([^<]+)<\/h1>/i);
  const title = decodeHtml(titleM?.[1] || listing.listTitle);

  const summaryM = html.match(/<div class="summary entry-summary">[\s\S]*?<div>\s*<p>([\s\S]*?)<\/p>\s*<\/div>/i);
  const summary = summaryM ? stripTags(summaryM[1]).trim() : listing.listSummary;

  const images = [];
  const imgRe = /data-large_image="([^"]+)"|data-src="([^"]+)"|<img[^>]+src="(https:\/\/senox\.com\.tr\/uploads\/product\/[^"]+)"/gi;
  let im;
  while ((im = imgRe.exec(html))) {
    const u = im[1] || im[2] || im[3];
    if (u && u.includes("/uploads/product/") && !images.includes(u)) images.push(u);
  }
  if (!images.length && listing.listImage) images.push(listing.listImage);

  const table = parseTable(html);
  const ebatRaw = table.specs["Ebatlar (mm)"] || table.specs["Ebatlar"] || "";
  const dimensions = parseDimensions(ebatRaw || summary);

  const modelNo = extractModelNo(title, listing.slug);

  return {
    ...listing,
    title,
    modelNo,
    summary,
    images,
    teknikTablo: table,
    olculer: dimensions,
    ebatRaw: ebatRaw || dimensions?.raw || null,
    scrapedAt: new Date().toISOString(),
  };
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, "Accept-Language": "tr-TR,tr;q=0.9", Accept: "text/html" },
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.text();
}

async function downloadImage(url, destPath) {
  if (skipMedia || !url) return false;
  try {
    await fsp.mkdir(path.dirname(destPath), { recursive: true });
    if (fs.existsSync(destPath)) return true;
    const res = await fetch(url, {
      headers: { "User-Agent": UA },
      signal: AbortSignal.timeout(120000),
    });
    if (!res.ok) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    await fsp.writeFile(destPath, buf);
    return true;
  } catch {
    return false;
  }
}

function buildReport(catalog) {
  const lines = [];
  lines.push("# Senox katalog scrape raporu");
  lines.push("");
  lines.push(`Kaynak: [senox.com.tr/tr](https://senox.com.tr/tr)`);
  lines.push(`Tarih: ${catalog.scrapedAt}`);
  lines.push(`Toplam ürün: **${catalog.products.length}**`);
  lines.push("");

  const byCat = {};
  for (const p of catalog.products) {
    byCat[p.category] = (byCat[p.category] || 0) + 1;
  }
  lines.push("## Kategori dağılımı");
  lines.push("");
  lines.push("| Kategori | Grup | Ürün |");
  lines.push("|----------|------|------|");
  for (const c of CATEGORIES) {
    lines.push(`| ${c.name} | ${c.group} | ${byCat[c.name] || 0} |`);
  }
  lines.push("");

  const withDims = catalog.products.filter((p) => p.olculer || p.ebatRaw).length;
  const withTable = catalog.products.filter((p) => Object.keys(p.teknikTablo?.specs || {}).length > 0).length;
  const withImages = catalog.products.filter((p) => p.images?.length > 0).length;
  const downloaded = catalog.products.filter((p) => p.localImage).length;

  lines.push("## Veri kalitesi özeti");
  lines.push("");
  lines.push(`- Görsel URL'si olan: ${withImages}/${catalog.products.length}`);
  lines.push(`- İndirilen görsel: ${downloaded}/${catalog.products.length}`);
  lines.push(`- Ölçü/ebat bilgisi: ${withDims}/${catalog.products.length}`);
  lines.push(`- Teknik tablo (gaz/voltaj/güç): ${withTable}/${catalog.products.length}`);
  lines.push("");

  lines.push("## Ürün listesi");
  lines.push("");
  for (const c of CATEGORIES) {
    const items = catalog.products.filter((p) => p.categorySlug === c.slug);
    if (!items.length) continue;
    lines.push(`### ${c.group} → ${c.name} (${items.length})`);
    lines.push("");
    for (const p of items) {
      lines.push(`#### ${p.title}`);
      lines.push(`- **Model:** ${p.modelNo}`);
      lines.push(`- **URL:** ${p.url}`);
      if (p.ebatRaw || p.olculer) {
        const o = p.olculer;
        lines.push(`- **Ölçü:** ${p.ebatRaw || o?.raw}${o ? ` → ${o.genislik_mm}×${o.derinlik_mm}×${o.yukseklik_mm} mm` : ""}`);
      } else {
        lines.push("- **Ölçü:** *(sitede yok)*");
      }
      if (Object.keys(p.teknikTablo?.specs || {}).length) {
        lines.push("- **Teknik tablo:**");
        for (const [k, v] of Object.entries(p.teknikTablo.specs)) {
          if (v) lines.push(`  - ${k}: ${v}`);
        }
      }
      if (p.summary) {
        const short = p.summary.length > 300 ? p.summary.slice(0, 300) + "…" : p.summary;
        lines.push(`- **Özet özellikler:** ${short.replace(/\n/g, " | ")}`);
      }
      if (p.images?.length) lines.push(`- **Görsel:** ${p.images[0]}${p.localImage ? ` (yerel: ${p.localImage})` : ""}`);
      lines.push("");
    }
  }

  const missingDims = catalog.products.filter((p) => !p.olculer && !p.ebatRaw);
  if (missingDims.length) {
    lines.push("## Ölçüsü eksik ürünler");
    lines.push("");
    for (const p of missingDims) lines.push(`- ${p.modelNo} — ${p.title}`);
    lines.push("");
  }

  return lines.join("\n");
}

async function main() {
  await fsp.mkdir(OUT_DIR, { recursive: true });
  await fsp.mkdir(OUT_MEDIA, { recursive: true });

  const seen = new Map();
  const listings = [];

  console.log("Kategoriler taranıyor…");
  for (const cat of CATEGORIES) {
    const url = `${TR}/${cat.slug}`;
    try {
      const html = await fetchHtml(url);
      const items = parseCategoryListing(html, cat);
      console.log(`  ${cat.name}: ${items.length} ürün`);
      for (const item of items) {
        if (!seen.has(item.url)) {
          seen.set(item.url, item);
          listings.push(item);
        }
      }
      await sleep(400);
    } catch (e) {
      console.warn(`  HATA ${cat.name}: ${e.message}`);
    }
  }

  let toScrape = listings;
  if (limitArg > 0) toScrape = toScrape.slice(0, limitArg);

  console.log(`\nDetay sayfaları: ${toScrape.length} ürün`);
  const products = [];
  for (let i = 0; i < toScrape.length; i++) {
    const listing = toScrape[i];
    process.stdout.write(`  [${i + 1}/${toScrape.length}] ${listing.slug}… `);
    try {
      const html = await fetchHtml(listing.url);
      const product = parseProductDetail(html, listing);
      if (product.images[0]) {
        const ext = path.extname(new URL(product.images[0]).pathname) || ".png";
        const safeName = product.slug.replace(/[^a-z0-9-]/gi, "_") + ext;
        const localPath = path.join(OUT_MEDIA, safeName);
        const ok = await downloadImage(product.images[0], localPath);
        if (ok) product.localImage = path.relative(OUT_DIR, localPath).replace(/\\/g, "/");
      }
      products.push(product);
      console.log("OK");
    } catch (e) {
      console.log(`HATA: ${e.message}`);
      products.push({ ...listing, error: e.message, scrapedAt: new Date().toISOString() });
    }
    await sleep(350);
  }

  const catalog = {
    source: "https://senox.com.tr/tr",
    scrapedAt: new Date().toISOString(),
    categoryCount: CATEGORIES.length,
    productCount: products.length,
    products,
  };

  await fsp.writeFile(OUT_JSON, JSON.stringify(catalog, null, 2), "utf8");
  await fsp.writeFile(OUT_RAPOR, buildReport(catalog), "utf8");

  console.log(`\nYazıldı:\n  ${OUT_JSON}\n  ${OUT_RAPOR}`);
  console.log(`  Görseller: ${OUT_MEDIA}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
