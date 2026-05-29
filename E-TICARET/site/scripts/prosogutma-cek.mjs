#!/usr/bin/env node
/**
 * prosogutma.com → veri/prosogutma/products-tr.json
 *
 *   node scripts/prosogutma-cek.mjs
 *   node scripts/prosogutma-cek.mjs --slug falcon
 *   node scripts/prosogutma-cek.mjs --no-pdf
 */
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const PREFER_FETCH = true;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.resolve(ROOT, "../veri/prosogutma");
const OUT_JSON = path.join(OUT_DIR, "products-tr.json");
const OUT_PAGES = path.join(OUT_DIR, "urun-sayfalari");
const OUT_MEDIA = path.join(OUT_DIR, "media/products");

const HOST = "https://prosogutma.com";
const PRODUCT_EP = `${HOST}/wp-json/wp/v2/product`;
const UA = "EqustoImport/1.0 (+https://equsto.com)";
const PER_PAGE = 50;
const CURL = process.env.CURL_PATH || "curl.exe";

const args = process.argv.slice(2);
const slugFilter = args.includes("--slug") ? args[args.indexOf("--slug") + 1] : null;
const skipPdf = args.includes("--no-pdf");
const pdfOnly = args.includes("--pdf-only");

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function decodeHtml(s) {
  return String(s || "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, " ")
    .trim();
}

function stripTags(html) {
  return decodeHtml(String(html || "").replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, " "));
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(120000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return { json: await res.json(), headers: res.headers };
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, "Accept-Language": "tr-TR,tr;q=0.9", Accept: "text/html" },
    signal: AbortSignal.timeout(120000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.text();
}

async function fetchAllProducts() {
  const out = [];
  let page = 1;
  while (true) {
    const url = `${PRODUCT_EP}?per_page=${PER_PAGE}&page=${page}&_fields=id,slug,link,title,product_cat,featured_media`;
    const { json, headers } = await fetchJson(url);
    if (!Array.isArray(json) || !json.length) break;
    out.push(...json);
    const totalPages = Number(headers.get("X-WP-TotalPages") || 1);
    if (page >= totalPages) break;
    page++;
    await sleep(350);
  }
  return out.filter((p) => String(p.link || "").includes("/urun/") && !p.link.includes("/en/"));
}

function parseAttributes(html) {
  const attrs = [];
  for (const row of html.matchAll(
    /<tr class="woocommerce-product-attributes-item[^"]*">([\s\S]*?)<\/tr>/gi
  )) {
    const chunk = row[1];
    const label = stripTags(chunk.match(/__label[^>]*>([\s\S]*?)<\//i)?.[1] || "");
    const value = stripTags(chunk.match(/__value[^>]*>([\s\S]*?)<\//i)?.[1] || "");
    if (label) attrs.push({ label, value });
  }
  return attrs;
}

function parseElementorTabs(html) {
  const tabs = [];
  const titles = [...html.matchAll(/elementor-tab-title[^>]*>([\s\S]*?)<\/div>/gi)].map((m) =>
    stripTags(m[1])
  );
  const contents = [
    ...html.matchAll(
      /<div id="elementor-tab-content-\d+"[^>]*class="elementor-tab-content[^"]*"[\s\S]*?>([\s\S]*?)<\/div>\s*(?=<div id="elementor-tab|<div class="woocommerce-tabs)/gi
    ),
  ];
  titles.forEach((name, i) => {
    if (!name) return;
    const chunk = contents[i]?.[1] || "";
    const tab = { name, html: chunk, links: [], images: [] };
    for (const a of chunk.matchAll(/href="(https:\/\/prosogutma\.com\/wp-content\/uploads\/[^"]+)"/gi)) {
      const href = a[1].split("?")[0];
      const text = stripTags(a[0]);
      tab.links.push({ href, text: text || path.basename(href) });
    }
    for (const img of chunk.matchAll(/src="(https:\/\/prosogutma\.com\/wp-content\/uploads\/[^"]+)"/gi)) {
      tab.images.push({ src: img[1].split("?")[0], alt: "" });
    }
    tabs.push(tab);
  });
  return tabs;
}

function parseGallery(html) {
  const imgs = [];
  const seen = new Set();
  for (const m of html.matchAll(
    /woocommerce-product-gallery__image[\s\S]*?href="(https:\/\/prosogutma\.com\/wp-content\/uploads\/[^"]+)"/gi
  )) {
    const src = m[1].split("?")[0];
    if (seen.has(src)) continue;
    seen.add(src);
    imgs.push({ src });
  }
  return imgs;
}

function parseTables(html) {
  const tables = [];
  for (const block of html.matchAll(/<table[^>]*>([\s\S]*?)<\/table>/gi)) {
    const tHtml = block[1];
    const basliklar = [];
    for (const th of tHtml.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/gi)) {
      const t = stripTags(th[1]);
      if (t) basliklar.push(t);
    }
    const satirlar = [];
    for (const tr of tHtml.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
      const cells = [];
      for (const cell of tr[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)) {
        const t = stripTags(cell[1]);
        if (t) cells.push(t);
      }
      if (cells.length) satirlar.push(cells);
    }
    if (satirlar.length) tables.push({ basliklar, satirlar });
  }
  return tables;
}

function findPdfUrl(tabs, slug) {
  for (const tab of tabs) {
    for (const l of tab.links || []) {
      if (/\.pdf$/i.test(l.href)) return l.href;
    }
  }
  return `${HOST}/wp-content/uploads/2023/02/${slug}.pdf`;
}

async function downloadFile(url, dest) {
  await fsp.mkdir(path.dirname(dest), { recursive: true });
  try {
    await fsp.access(dest);
    return true;
  } catch {
    /* */
  }
  try {
    if (!PREFER_FETCH) {
      const { stdout } = await execFileAsync(
        CURL,
        ["-sL", "--max-time", "120", "-A", UA, url],
        { maxBuffer: 80 * 1024 * 1024, encoding: "buffer" }
      );
      if (!stdout?.length) return false;
      await fsp.writeFile(dest, stdout);
      return true;
    }
    const res = await fetch(url, {
      headers: { "User-Agent": UA },
      signal: AbortSignal.timeout(120000),
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

async function extractPdfText(pdfPath) {
  const py = path.join(__dirname, "lib", "extract-pdf-text.py");
  try {
    const { stdout } = await execFileAsync("python", [py, pdfPath], {
      maxBuffer: 8 * 1024 * 1024,
      encoding: "utf8",
      env: { ...process.env, PYTHONIOENCODING: "utf-8" },
    });
    return stdout || "";
  } catch {
    return "";
  }
}

async function scrapeProduct(meta) {
  const url = meta.link;
  const html = await fetchHtml(url);
  const title =
    stripTags(html.match(/<h1[^>]*class="[^"]*product_title[^"]*"[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || "") ||
    decodeHtml(meta.title?.rendered || meta.slug);
  const attributes = parseAttributes(html);
  const tabs = parseElementorTabs(html);
  const gallery = parseGallery(html);
  const tablolar = parseTables(html);
  const pdfUrl = findPdfUrl(tabs, meta.slug);

  let pdfText = "";
  let pdfLocal = "";
  if (!skipPdf && pdfUrl) {
    const pdfName = path.basename(new URL(pdfUrl).pathname);
    const pdfDest = path.join(OUT_MEDIA, meta.slug, "pdfs", pdfName);
    const ok = await downloadFile(pdfUrl, pdfDest);
    if (ok) {
      pdfLocal = path.relative(OUT_DIR, pdfDest).replace(/\\/g, "/");
      pdfText = await extractPdfText(pdfDest);
    }
  }

  const catSlug = meta.link?.includes("/urun-kategori/")
    ? null
    : attributes.find((a) => /kabin/i.test(a.label))?.value || "";

  return {
    slug: meta.slug,
    wpId: meta.id,
    title,
    baslik: title,
    url,
    attributes,
    categories: catSlug ? [{ name: catSlug }] : [],
    gallery,
    tabs,
    teknik: { tablolar, pdfText, pdfUrl, pdfLocal },
    pdfText,
    scrapedAt: new Date().toISOString(),
  };
}

async function patchPdfOnly(product) {
  const pdfUrl = findPdfUrl(product.tabs || [], product.slug);
  let pdfText = "";
  let pdfLocal = "";
  if (!skipPdf && pdfUrl) {
    const pdfName = path.basename(new URL(pdfUrl).pathname);
    const pdfDest = path.join(OUT_MEDIA, product.slug, "pdfs", pdfName);
    const ok = await downloadFile(pdfUrl, pdfDest);
    if (ok) {
      pdfLocal = path.relative(OUT_DIR, pdfDest).replace(/\\/g, "/");
      pdfText = await extractPdfText(pdfDest);
    }
  }
  return {
    ...product,
    pdfText,
    teknik: { ...(product.teknik || {}), pdfText, pdfUrl, pdfLocal },
  };
}

async function main() {
  await fsp.mkdir(OUT_DIR, { recursive: true });
  await fsp.mkdir(OUT_PAGES, { recursive: true });
  await fsp.mkdir(OUT_MEDIA, { recursive: true });

  if (pdfOnly && fs.existsSync(OUT_JSON)) {
    let products = JSON.parse(fs.readFileSync(OUT_JSON, "utf8"));
    if (slugFilter) products = products.filter((p) => p.slug === slugFilter);
    console.log("PDF metin yaması:", products.length, "ürün");
    let n = 0;
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      if (p.error) continue;
      n++;
      process.stdout.write(`[${n}/${products.length}] ${p.slug} … `);
      products[i] = await patchPdfOnly(p);
      const mark = (products[i].pdfText || "").includes("Length") ? "+" : "·";
      console.log(mark, (products[i].pdfText || "").length);
      await sleep(200);
    }
    await fsp.writeFile(OUT_JSON, JSON.stringify(products, null, 2), "utf8");
    for (const p of products) {
      if (p.slug && !p.error) {
        await fsp.writeFile(
          path.join(OUT_PAGES, `${p.slug}.json`),
          JSON.stringify(p, null, 2),
          "utf8"
        );
      }
    }
    console.log("→", OUT_JSON);
    return;
  }

  console.log("Proso ürün listesi (TR)…");
  let list = await fetchAllProducts();
  if (slugFilter) {
    list = list.filter((p) => p.slug === slugFilter);
    if (!list.length) {
      console.error("Slug bulunamadı:", slugFilter);
      process.exit(1);
    }
  }
  console.log("Ürün:", list.length);

  const products = [];
  let n = 0;
  for (const meta of list) {
    n++;
    process.stdout.write(`[${n}/${list.length}] ${meta.slug} … `);
    try {
      const p = await scrapeProduct(meta);
      products.push(p);
      await fsp.writeFile(
        path.join(OUT_PAGES, `${p.slug}.json`),
        JSON.stringify(p, null, 2),
        "utf8"
      );
      const vCount = (p.pdfText || "").includes("Length") ? "+" : "·";
      console.log("ok", vCount, (p.teknik?.tablolar || []).length, "tablo");
    } catch (e) {
      console.log("HATA", e.message);
      products.push({ slug: meta.slug, error: e.message, url: meta.link });
    }
    await sleep(450);
  }

  products.sort((a, b) => String(a.title || a.slug).localeCompare(String(b.title || b.slug), "tr"));
  await fsp.writeFile(OUT_JSON, JSON.stringify(products, null, 2), "utf8");
  console.log("→", OUT_JSON, "|", products.length, "ürün");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
