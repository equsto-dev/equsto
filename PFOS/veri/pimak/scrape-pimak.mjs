#!/usr/bin/env node
/**
 * Pimak.com ürün scraper
 * node veri/pimak/scrape-pimak.mjs
 * node veri/pimak/scrape-pimak.mjs --limit 20
 * node veri/pimak/scrape-pimak.mjs --resume   (sadece eksik JSON’ları çeker)
 * node veri/pimak/scrape-pimak.mjs --fresh    (checkpoint sıfırla)
 * node veri/pimak/scrape-pimak.mjs --no-images
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { absUrl, decodeHtml, firstMatch, parseAllTeknikTables, stripTags } from "./lib/html-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = __dirname;
const BASE = "https://www.pimak.com";
const UA = "Mozilla/5.0 (compatible; PFOS-pimak-scraper/1.0; +https://equsto.com)";

const EXCLUDE_PATHS = new Set([
  "",
  "urunler",
  "iletisim",
  "kurumsal",
  "kilavuzlar",
  "servisler",
  "kataloglarimiz",
  "haberler",
  "insan-kaynaklari",
  "projeler",
  "yurt-disi",
  "yurt-ici",
  "videolar",
  "referanslar",
  "yardim",
  "arama",
  "404",
]);

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    limit: args.includes("--limit") ? Number(args[args.indexOf("--limit") + 1]) : 0,
    resume: args.includes("--resume"),
    fresh: args.includes("--fresh"),
    noImages: args.includes("--no-images"),
    delayMs: args.includes("--delay") ? Number(args[args.indexOf("--delay") + 1]) : 400,
  };
}

async function fetchText(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": UA } });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.text();
    } catch (e) {
      if (i === retries - 1) throw e;
      await sleep(1000 * (i + 1));
    }
  }
}

async function fetchBuffer(url) {
  const r = await fetch(url, { headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error(`IMG ${r.status} ${url}`);
  return Buffer.from(await r.arrayBuffer());
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function slugFromUrl(url) {
  const u = new URL(url);
  return u.pathname.replace(/^\//, "").replace(/\/$/, "");
}

const BLOG_SLUG_RE =
  /(nasil|nedir|nelerdir|avantaj|ipucu|ipuclari|rehber|kurulumu|hizmeti|olmali|tercihi|kullanimi|deneyimi|cozum|tasarruf|tedbir|tasarim|danisman|listesi|modelleri|projeleri|firmalari|ureticileri|malzemeleri|gerecleri|onemli|dikkat|sayin-|programina|yonetim-kurulu|kvkk|fuar|euroshop|adim-adim|acmak-istiyorum|hakkinda-bilmeniz|donusum|ziyaret)/i;

function isProductUrl(url) {
  const slug = slugFromUrl(url);
  if (!slug || slug.includes("/")) return false;
  if (EXCLUDE_PATHS.has(slug)) return false;
  if (/\.(php|xml|pdf)$/i.test(slug)) return false;
  if (BLOG_SLUG_RE.test(slug)) return false;
  return true;
}

function isProductHtml(html) {
  return /class="urundetay"/i.test(html) && /class="urunkod"/i.test(html);
}

async function loadSitemapProductUrls() {
  const xml = await fetchText(`${BASE}/sitemap.xml`);
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  const fromSitemap = locs.filter(isProductUrl);
  const fromCats = await loadCategorySlugsAsUrls();
  return [...new Set([...fromSitemap, ...fromCats])];
}

async function loadCategorySlugsAsUrls() {
  const xml = await fetchText(`${BASE}/sitemap.xml`);
  const cats = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => m[1].trim())
    .filter((u) => u.includes("/urunler/") && u !== `${BASE}/urunler`);
  const urls = [];
  for (const catUrl of cats) {
    try {
      const html = await fetchText(catUrl);
      for (const m of html.matchAll(/href="([a-z0-9][a-z0-9-]+)"/gi)) {
        const s = m[1];
        if (EXCLUDE_PATHS.has(s)) continue;
        urls.push(`${BASE}/${s}`);
      }
    } catch {
      /* skip */
    }
  }
  return urls.filter(isProductUrl);
}

async function loadCategoryMap() {
  const xml = await fetchText(`${BASE}/sitemap.xml`);
  const cats = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => m[1].trim())
    .filter((u) => u.includes("/urunler/") && u !== `${BASE}/urunler`);

  const map = new Map();
  for (const catUrl of cats) {
    const catSlug = catUrl.split("/urunler/")[1];
    const catLabel = catSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    try {
      const html = await fetchText(catUrl);
      const slugs = [...html.matchAll(/href="([a-z0-9][a-z0-9-]+)"/gi)].map((m) => m[1]);
      for (const s of slugs) {
        if (EXCLUDE_PATHS.has(s) || s.includes("urunler")) continue;
        if (!map.has(s)) map.set(s, { slug: catSlug, label: catLabel, url: catUrl });
      }
      await sleep(200);
    } catch (e) {
      console.warn("Kategori atlandı:", catUrl, e.message);
    }
  }
  return map;
}

function parseProductPage(html, url) {
  const slug = slugFromUrl(url);
  const title =
    stripTags(firstMatch(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i)) ||
    decodeHtml(firstMatch(html, /<title>([^<]+)<\/title>/i));

  const urunKodu =
    stripTags(firstMatch(html, /class="urunkod"[\s\S]*?<p>([\s\S]*?)<\/p>/i)) ||
    title?.split(" ")[0];

  const imgRel =
    firstMatch(html, /class="urunresim"[\s\S]*?<img[^>]+src="([^"]+)"/i) ||
    firstMatch(html, /class="imgBox"[\s\S]*?<img[^>]+src="([^"]+)"/i);
  const imageUrl = imgRel ? absUrl(url, imgRel) : null;

  const ozellikBlock = html.match(
    /class="ozelliklerbaslik"[^>]*>[^<]*<\/span>\s*<p>([\s\S]*?)<\/p>/i,
  );
  const temelOzellikler = ozellikBlock ? stripTags(ozellikBlock[1]) : "";
  const temelOzelliklerListe = temelOzellikler
    .split(/\n|•/)
    .map((s) => s.replace(/^[•\-\s]+/, "").trim())
    .filter(Boolean);

  const teknikTablo = parseAllTeknikTables(html);

  const teknikSatirlar = teknikTablo.rows.map((row) => {
    const flat = {};
    for (const [k, v] of Object.entries(row)) {
      flat[k] = v?.text ?? v?.value ?? "";
      if (v?.type === "image" && v.value) flat[`${k}_gorsel`] = absUrl(url, v.value);
    }
    return flat;
  });

  const metaDescription = decodeHtml(firstMatch(html, /name="description" content="([^"]*)"/i) || "");

  return {
    slug,
    url,
    urunKodu,
    baslik: title,
    metaAciklama: metaDescription,
    gorsel: imageUrl,
    temelOzellikler: temelOzelliklerListe,
    temelOzelliklerMetin: temelOzellikler,
    teknikDetaylar: {
      kolonlar: teknikTablo.headers,
      satirlar: teknikSatirlar,
    },
    cekilme: new Date().toISOString(),
  };
}

async function downloadImage(imageUrl, destDir, slug) {
  if (!imageUrl) return null;
  try {
    const ext = path.extname(new URL(imageUrl).pathname) || ".jpg";
    const fileName = `${slug}${ext}`;
    const dest = path.join(destDir, fileName);
    const buf = await fetchBuffer(imageUrl);
    await fs.writeFile(dest, buf);
    return { fileName, local: `media/images/${fileName}`, bytes: buf.length };
  } catch (e) {
    return { error: e.message, remote: imageUrl };
  }
}

async function main() {
  const opts = parseArgs();
  const pagesDir = path.join(OUT, "urun-sayfalari");
  const imgDir = path.join(OUT, "media", "images");
  const checkpointPath = path.join(OUT, "scrape-checkpoint.json");
  const productsPath = path.join(OUT, "products-tr.json");

  await fs.mkdir(pagesDir, { recursive: true });
  if (!opts.noImages) await fs.mkdir(imgDir, { recursive: true });

  if (opts.fresh) {
    try {
      await fs.unlink(checkpointPath);
    } catch {
      /* yok */
    }
    console.log("Checkpoint sıfırlandı (--fresh)");
  }

  console.log("Sitemap ürün URL’leri yükleniyor…");
  let productUrls = await loadSitemapProductUrls();
  console.log(`Ürün URL: ${productUrls.length}`);

  console.log("Kategori eşlemesi (ürün → kategori)…");
  const categoryMap = await loadCategoryMap();
  console.log(`Kategori eşlemesi: ${categoryMap.size} ürün`);

  async function isSavedOk(url) {
    const slug = slugFromUrl(url);
    try {
      const data = JSON.parse(await fs.readFile(path.join(pagesDir, `${slug}.json`), "utf8"));
      return Boolean(data.urunKodu && data.teknikDetaylar?.satirlar?.length > 0);
    } catch {
      return false;
    }
  }

  if (opts.resume) {
    const before = productUrls.length;
    const checks = await Promise.all(productUrls.map(async (u) => ((await isSavedOk(u)) ? u : null)));
    const skip = new Set(checks.filter(Boolean));
    productUrls = productUrls.filter((u) => !skip.has(u));
    console.log(`Resume: ${skip.size} tamam, ${productUrls.length} eksik/hatalı kaldı (önceki checkpoint: ${before})`);
  }

  if (opts.limit > 0) {
    productUrls = productUrls.slice(0, opts.limit);
  }

  const allProducts = [];
  try {
    const existing = JSON.parse(await fs.readFile(productsPath, "utf8"));
    if (Array.isArray(existing.products)) allProducts.push(...existing.products);
  } catch {
    /* fresh */
  }
  const bySlug = new Map(allProducts.map((p) => [p.slug, p]));

  let i = 0;
  for (const url of productUrls) {
    i++;
    const slug = slugFromUrl(url);
    process.stdout.write(`[${i}/${productUrls.length}] ${slug} … `);
    try {
      const html = await fetchText(url);
      if (!isProductHtml(html)) {
        console.log("ATLA (ürün sayfası değil)");
        await sleep(opts.delayMs);
        continue;
      }
      const product = parseProductPage(html, url);
      const cat = categoryMap.get(slug);
      if (cat) {
        product.kategori = cat;
      }

      if (!opts.noImages && product.gorsel) {
        const img = await downloadImage(product.gorsel, imgDir, slug);
        product.gorselYerel = img;
      }

      await fs.writeFile(path.join(pagesDir, `${slug}.json`), JSON.stringify(product, null, 2), "utf8");
      bySlug.set(slug, {
        slug: product.slug,
        urunKodu: product.urunKodu,
        baslik: product.baslik,
        url: product.url,
        kategori: product.kategori?.slug ?? null,
        gorsel: product.gorsel,
        gorselYerel: product.gorselYerel?.local ?? null,
        temelOzellikSayisi: product.temelOzellikler.length,
        teknikSatirSayisi: product.teknikDetaylar.satirlar.length,
      });

      console.log("OK");
    } catch (e) {
      console.log("HATA", e.message);
    }

    await sleep(opts.delayMs);
  }

  const manifest = {
    kaynak: BASE,
    cekilme: new Date().toISOString(),
    urunSayisi: bySlug.size,
    products: [...bySlug.values()].sort((a, b) => a.baslik.localeCompare(b.baslik, "tr")),
  };
  await fs.writeFile(productsPath, JSON.stringify(manifest, null, 2), "utf8");
  console.log(`\nBitti. ${manifest.urunSayisi} ürün → ${productsPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
