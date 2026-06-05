#!/usr/bin/env node
/**
 * electroluxprofessional.com/tr → PFOS/veri/electrolux-professional/
 *
 *   node scripts/scrape-electrolux-professional.mjs
 *   node scripts/scrape-electrolux-professional.mjs --discover-only
 *   node scripts/scrape-electrolux-professional.mjs --cod 371002
 *   node scripts/scrape-electrolux-professional.mjs --no-media --limit 20
 *   node scripts/scrape-electrolux-professional.mjs --resume
 */
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.resolve(ROOT, "../../PFOS/veri/electrolux-professional");
const OUT_JSON = path.join(OUT_DIR, "products-tr.json");
const OUT_LISTINGS = path.join(OUT_DIR, "listing-contexts.json");
const OUT_PAGES = path.join(OUT_DIR, "urun-sayfalari");
const OUT_MEDIA = path.join(OUT_DIR, "media");

const BASE = "https://www.electroluxprofessional.com";
const TR = `${BASE}/tr`;
const AJAX = `${TR}/wp-admin/admin-ajax.php`;
const UA = "EqustoImport/1.0 (+https://equsto.com; catalog-research)";

const args = process.argv.slice(2);
const discoverOnly = args.includes("--discover-only");
const skipMedia = args.includes("--no-media");
const resume = args.includes("--resume");
const codFilter = args.includes("--cod") ? args[args.indexOf("--cod") + 1] : null;
const limitArg = args.includes("--limit") ? Number(args[args.indexOf("--limit") + 1]) : 0;
const listingArg = args.includes("--listing") ? args[args.indexOf("--listing") + 1] : null;
const urlArg = args.includes("--url") ? args[args.indexOf("--url") + 1] : null;

const SEEDS = [
  `${TR}/ticari-mutfak-ekipmanlari/`,
  `${TR}/ticari-camasirhane-ekipmanlari/`,
  `${TR}/`,
  // Nav'da derin link olmayan büyük listeler
  `${TR}/ticari-mutfak-ekipmanlari/900xp-700xp-pisirme-serileri/`,
  `${TR}/ticari-mutfak-ekipmanlari/fritozler/`,
  `${TR}/ticari-mutfak-ekipmanlari/thermaline-modular-serisi/`,
  `${TR}/ticari-mutfak-ekipmanlari/endustriyel-ocaklar/`,
  `${TR}/ticari-mutfak-ekipmanlari/espresso-kahve-makineleri/`,
  `${TR}/ticari-mutfak-ekipmanlari/icecek-dispenserleri/`,
];

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
  return decodeHtml(String(html || "").replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, " "));
}

function inputVal(html, id) {
  const m = html.match(new RegExp(`id="${id}"[^>]*value="([^"]*)"`, "i"));
  if (m) return m[1];
  const m2 = html.match(new RegExp(`name="${id}"[^>]*value="([^"]*)"`, "i"));
  return m2 ? m2[1] : "";
}

function normUrl(href) {
  if (!href) return "";
  try {
    const u = new URL(href, TR);
    if (!u.hostname.includes("electroluxprofessional.com")) return "";
    if (!u.pathname.startsWith("/tr/")) return "";
    u.hash = "";
    u.search = "";
    return u.toString();
  } catch {
    return "";
  }
}

function codFromUrl(url) {
  const m = String(url || "").match(/-(\d{5,7})\/?(?:\?|#|$)/);
  return m ? m[1] : "";
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, "Accept-Language": "tr-TR,tr;q=0.9", Accept: "text/html" },
    signal: AbortSignal.timeout(120000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.text();
}

async function fetchAjaxProducts(ctx, offset) {
  const body = new URLSearchParams({
    action: "com21_ajax_products_list",
    level1: ctx.level1 || "",
    level2: "",
    level3: "",
    level4: "",
    category: "",
    subcategory: "",
    attributes: "",
    otherfields: "",
    filter: String(ctx.filterId),
    lang: String(ctx.lang || "5016"),
    limit: "12",
    offset: String(offset),
    paged: "",
    page_id: String(ctx.pageId),
  });
  const res = await fetch(AJAX, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": UA,
      "Accept-Language": "tr-TR",
    },
    body: body.toString(),
    signal: AbortSignal.timeout(120000),
  });
  if (!res.ok) throw new Error(`AJAX HTTP ${res.status}`);
  return res.json();
}

function extractPdpLinksFromHtml(html) {
  const out = new Map();
  for (const m of html.matchAll(/href="([^"]*\/tr\/pd\/[^"]+)"/gi)) {
    const url = normUrl(m[1]);
    if (!url) continue;
    const cod = codFromUrl(url);
    if (cod) out.set(cod, url);
  }
  for (const m of html.matchAll(/data-prod-permalink="([^"]+)"/gi)) {
    const url = normUrl(m[1]);
    if (!url) continue;
    const cod = codFromUrl(url) || m[0].match(/data-prod-code="(\d+)"/)?.[1];
    if (cod) out.set(cod, url);
  }
  return out;
}

function parseListingContext(html, url) {
  const filterId = inputVal(html, "filter_id");
  const pageId = inputVal(html, "page_id");
  if (!filterId || !pageId) return null;
  const productCountMatch = html.match(/Filtrele\s*\((\d+)\s*Ürün/i) || html.match(/(\d+)\s*Ürünler/i);
  return {
    url,
    level1: inputVal(html, "navigation_level_1"),
    filterId,
    pageId,
    lang: inputVal(html, "navigation_language") || "5016",
    productCountHint: productCountMatch ? Number(productCountMatch[1]) : null,
  };
}

function crawlableListingUrls(html) {
  const urls = new Set();
  for (const m of html.matchAll(/href="([^"]+)"/gi)) {
    const u = normUrl(m[1]);
    if (!u) continue;
    if (
      /\/tr\/ticari-(mutfak|camasirhane|icecek)[^/]*\//i.test(u) &&
      !u.includes("/pd/") &&
      !u.includes("/bayi-") &&
      !u.includes("/iletisim")
    ) {
      urls.add(u);
    }
  }
  return [...urls];
}

async function discoverListingContexts() {
  const seenPages = new Set();
  const contexts = new Map();
  const queue = [...SEEDS];
  if (listingArg) queue.unshift(listingArg);

  while (queue.length) {
    const url = queue.shift();
    if (!url || seenPages.has(url)) continue;
    seenPages.add(url);
    process.stdout.write(`Keşif: ${url.slice(TR.length)} … `);
    let html;
    try {
      html = await fetchHtml(url);
    } catch (e) {
      console.log("atla", e.message);
      continue;
    }
    const ctx = parseListingContext(html, url);
    if (ctx) {
      contexts.set(url, ctx);
      console.log(`liste (${ctx.productCountHint ?? "?"} ürün)`);
    } else {
      console.log("sayfa");
    }
    for (const next of crawlableListingUrls(html)) {
      if (!seenPages.has(next)) queue.push(next);
    }
    await sleep(350);
  }
  return [...contexts.values()];
}

async function discoverProductUrls(contexts) {
  const products = new Map();
  for (const ctx of contexts) {
    process.stdout.write(`Ürün URL: ${ctx.url.slice(TR.length)} … `);
    let offset = 0;
    let total = 0;
    try {
      const first = await fetchAjaxProducts(ctx, 0);
      total = Number(first.product_count || 0);
      for (const chunk of first.products || []) {
        for (const [cod, url] of extractPdpLinksFromHtml(chunk)) products.set(cod, { cod, url, listing: ctx.url });
      }
      offset = 12;
      while (offset < total) {
        await sleep(400);
        const page = await fetchAjaxProducts(ctx, offset);
        for (const chunk of page.products || []) {
          for (const [cod, url] of extractPdpLinksFromHtml(chunk)) products.set(cod, { cod, url, listing: ctx.url });
        }
        offset += 12;
      }
      console.log(total, "ürün");
    } catch (e) {
      console.log("HATA", e.message);
      const html = await fetchHtml(ctx.url);
      for (const [cod, url] of extractPdpLinksFromHtml(html)) products.set(cod, { cod, url, listing: ctx.url });
    }
    await sleep(300);
  }
  return [...products.values()];
}

function parseSpecGroups(html) {
  const section = html.match(/id="product-specifications"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/i)?.[0] || "";
  const groups = [];
  for (const li of section.matchAll(/<li>([\s\S]*?)<\/li>/gi)) {
    const chunk = li[1];
    const group = stripTags(chunk.match(/<a[^>]*>([\s\S]*?)<\/a>/i)?.[1] || "");
    const items = [];
    for (const p of chunk.matchAll(/<p>([\s\S]*?)<\/p>/gi)) {
      const raw = p[1];
      const label = stripTags(raw.replace(/<strong[\s\S]*?<\/strong>/gi, "").replace(/:\s*$/, ""));
      const value = stripTags(raw.match(/<strong[^>]*>([\s\S]*?)<\/strong>/i)?.[1] || raw);
      if (!label && !value) continue;
      items.push({ label: label || value, value: value || label });
    }
    if (group || items.length) groups.push({ group: group || "Genel", items });
  }
  return groups;
}

function sectionSlice(html, id, nextId) {
  const start = html.indexOf(`id="${id}"`);
  if (start < 0) return "";
  const end = nextId ? html.indexOf(`id="${nextId}"`, start + 10) : -1;
  return html.slice(start, end > start ? end : start + 80000);
}

function parseFeatureGroups(html) {
  const section = sectionSlice(html, "product-features", "product-accessories");
  const groups = [];
  let current = { group: "Ürün Özellikleri", items: [] };
  for (const el of section.matchAll(/<div class="fea-element([^"]*)">([\s\S]*?)<\/div>/gi)) {
    const cls = el[1] || "";
    const text = stripTags(el[2]);
    if (!text) continue;
    if (cls.includes("category-name")) {
      if (current.items.length) groups.push(current);
      current = { group: text, items: [] };
    } else {
      current.items.push(text);
    }
  }
  if (current.items.length) groups.push(current);
  return groups;
}

function parseDocuments(html) {
  const section = html.match(/id="product-documents"[\s\S]*?<\/ul>/i)?.[0] || "";
  const docs = [];
  for (const li of section.matchAll(/<li>([\s\S]*?)<\/li>/gi)) {
    const chunk = li[1];
    const category = stripTags(chunk.match(/<a[^>]*data-toggle="collapse"[^>]*>([\s\S]*?)<\/a>/i)?.[1] || "");
    for (const a of chunk.matchAll(/<a[^>]*href="([^"]+)"[^>]*data-ga-action="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi)) {
      const href = a[1].split("?")[0];
      const type = a[2] || "";
      const title = stripTags(a[3]).replace(/\s*\([^)]*\)\s*$/, "");
      if (!href.includes("tools.electroluxprofessional.com")) continue;
      docs.push({ category, type, title, url: href });
    }
    for (const a of chunk.matchAll(/<a[^>]*href="(https:\/\/tools\.electroluxprofessional\.com[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)) {
      const href = a[1].split("?")[0];
      const title = stripTags(a[2]);
      if (docs.some((d) => d.url === href)) continue;
      const ext = path.extname(new URL(href).pathname).toLowerCase();
      const type =
        ext === ".pdf" ? (category.includes("Veri") ? "MAD2" : "BR") : ext === ".dwg" ? "CAD" : ext === ".rfa" ? "REVIT" : "FILE";
      docs.push({ category, type, title, url: href });
    }
  }
  const uniq = new Map();
  for (const d of docs) uniq.set(d.url, d);
  return [...uniq.values()];
}

function parseAccessories(html) {
  const section = sectionSlice(html, "product-accessories", "product-contact-us");
  const rows = [];
  for (const row of section.matchAll(/class="accessories-code"[^>]*>([\s\S]*?)<\/div>/gi)) {
    /* simplified - table rows */
  }
  const codes = [...section.matchAll(/accessories-code[\s\S]*?Code:<\/span>\s*(\d+)/gi)].map((m) => m[1].trim());
  const descs = [...section.matchAll(/accessories-description[^>]*>\s*([\s\S]*?)\s*<\/div>/gi)].map((m) =>
    stripTags(m[1])
  );
  const qtys = [...section.matchAll(/accessories-qty[\s\S]*?Quantity:<\/span>\s*(\d+)/gi)].map((m) => m[1].trim());
  codes.forEach((code, i) => {
    rows.push({ code, description: descs[i] || "", quantity: qtys[i] || "" });
  });
  return rows;
}

function parseGallery(html) {
  const images = [];
  const seen = new Set();
  for (const m of html.matchAll(
    /<a[^>]*href="(https:\/\/tools\.electroluxprofessional\.com\/Mirror\/Doc\/PH_[^"]+)"[^>]*>/gi
  )) {
    const url = decodeURIComponent(m[1]);
    if (seen.has(url)) continue;
    seen.add(url);
    const thumb = url.replace(/PH_\d+x\d+/, "PH_415x415");
    images.push({ full: url, thumb });
  }
  return images;
}

function parsePdp(html, url) {
  const cod =
    stripTags(html.match(/id="product-code"[^>]*>([\s\S]*?)<\//i)?.[1] || "") ||
    codFromUrl(url) ||
    html.match(/data-prod-code="(\d+)"/)?.[1] ||
    "";
  const category = stripTags(html.match(/<div class="product-title">\s*<h5>([\s\S]*?)<\/h5>/i)?.[1] || "");
  const title = stripTags(html.match(/<div class="product-title">[\s\S]*?<h1>([\s\S]*?)<\/h1>/i)?.[1] || "");
  const description = stripTags(html.match(/<div class="product-description">\s*<p>([\s\S]*?)<\/p>/i)?.[1] || "");
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/i)?.[1] || url;
  return {
    cod,
    title,
    category,
    description,
    url: normUrl(canonical) || url,
    specifications: parseSpecGroups(html),
    features: parseFeatureGroups(html),
    documents: parseDocuments(html),
    accessories: parseAccessories(html),
    images: parseGallery(html),
    scrapedAt: new Date().toISOString(),
  };
}

async function downloadFile(url, dest) {
  try {
    await fsp.mkdir(path.dirname(dest), { recursive: true });
    if (fs.existsSync(dest) && fs.statSync(dest).size > 0) return true;
    const res = await fetch(url, {
      headers: { "User-Agent": UA },
      signal: AbortSignal.timeout(180000),
    });
    if (!res.ok) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    if (!buf.length) return false;
    await fsp.writeFile(dest, buf);
    return true;
  } catch {
    return false;
  }
}

function extFromUrl(url) {
  try {
    return path.extname(new URL(url).pathname) || ".bin";
  } catch {
    return ".bin";
  }
}

async function downloadMedia(product) {
  const cod = product.cod;
  if (!cod) return product;
  const imgDir = path.join(OUT_MEDIA, "images", cod);
  const docDir = path.join(OUT_MEDIA, "documents", cod);
  const images = [];
  for (let i = 0; i < product.images.length; i++) {
    const img = product.images[i];
    const ext = extFromUrl(img.full) || ".jpg";
    const dest = path.join(imgDir, `hero-${i + 1}${ext}`);
    const ok = await downloadFile(img.full, dest);
    images.push({
      ...img,
      local: ok ? path.relative(OUT_DIR, dest).replace(/\\/g, "/") : null,
    });
    await sleep(150);
  }
  const documents = [];
  for (const doc of product.documents) {
    const base = path.basename(new URL(doc.url).pathname) || `${doc.type}${extFromUrl(doc.url)}`;
    const dest = path.join(docDir, base);
    const ok = await downloadFile(doc.url, dest);
    documents.push({
      ...doc,
      local: ok ? path.relative(OUT_DIR, dest).replace(/\\/g, "/") : null,
    });
    await sleep(200);
  }
  return { ...product, images, documents };
}

async function scrapeProduct(meta) {
  const html = await fetchHtml(meta.url);
  let product = parsePdp(html, meta.url);
  product.listing = meta.listing || null;
  if (!skipMedia) product = await downloadMedia(product);
  return product;
}

async function main() {
  await fsp.mkdir(OUT_DIR, { recursive: true });
  await fsp.mkdir(OUT_PAGES, { recursive: true });
  await fsp.mkdir(OUT_MEDIA, { recursive: true });

  if (codFilter) {
    const url = urlArg || metaUrlFromCod(codFilter);
    if (!url) {
      console.error("URL bulunamadı. --url ile verin veya önce --discover-only çalıştırın.");
      process.exit(1);
    }
    console.log("Tek ürün:", codFilter);
    const p = await scrapeProduct({ cod: codFilter, url, listing: null });
    await fsp.writeFile(path.join(OUT_PAGES, `${p.cod}.json`), JSON.stringify(p, null, 2), "utf8");
    const all = fs.existsSync(OUT_JSON) ? JSON.parse(fs.readFileSync(OUT_JSON, "utf8")) : [];
    const next = [...all.filter((x) => x.cod !== p.cod), p].sort((a, b) => String(a.cod).localeCompare(b.cod));
    await fsp.writeFile(OUT_JSON, JSON.stringify(next, null, 2), "utf8");
    console.log("→", path.join(OUT_PAGES, `${p.cod}.json`));
    return;
  }

  console.log("Listing sayfaları keşfediliyor…");
  const contexts = await discoverListingContexts();
  await fsp.writeFile(OUT_LISTINGS, JSON.stringify(contexts, null, 2), "utf8");
  console.log("Listing:", contexts.length, "→", OUT_LISTINGS);

  console.log("Ürün URL'leri toplanıyor…");
  let productMetas = await discoverProductUrls(contexts);
  console.log("Toplam benzersiz ürün:", productMetas.length);

  if (discoverOnly) {
    await fsp.writeFile(path.join(OUT_DIR, "product-urls.json"), JSON.stringify(productMetas, null, 2), "utf8");
    console.log("→", path.join(OUT_DIR, "product-urls.json"));
    return;
  }

  if (limitArg > 0) productMetas = productMetas.slice(0, limitArg);

  const products = [];
  let n = 0;
  for (const meta of productMetas) {
    n++;
    const pagePath = path.join(OUT_PAGES, `${meta.cod}.json`);
    if (resume && fs.existsSync(pagePath)) {
      try {
        products.push(JSON.parse(fs.readFileSync(pagePath, "utf8")));
        continue;
      } catch (_) {}
    }
    process.stdout.write(`[${n}/${productMetas.length}] ${meta.cod} … `);
    try {
      const p = await scrapeProduct(meta);
      products.push(p);
      await fsp.writeFile(pagePath, JSON.stringify(p, null, 2), "utf8");
      console.log("ok", p.images.length, "görsel", p.documents.length, "döküman");
    } catch (e) {
      console.log("HATA", e.message);
      products.push({ cod: meta.cod, url: meta.url, error: e.message });
    }
    await sleep(700);
  }

  products.sort((a, b) => String(a.cod || "").localeCompare(String(b.cod || "")));
  await fsp.writeFile(OUT_JSON, JSON.stringify(products, null, 2), "utf8");
  console.log("→", OUT_JSON, "|", products.length, "ürün");
}

function metaUrlFromCod(cod) {
  if (!fs.existsSync(path.join(OUT_DIR, "product-urls.json"))) return null;
  try {
    const list = JSON.parse(fs.readFileSync(path.join(OUT_DIR, "product-urls.json"), "utf8"));
    return list.find((x) => String(x.cod) === String(cod))?.url || null;
  } catch {
    return null;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
