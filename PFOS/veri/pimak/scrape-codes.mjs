#!/usr/bin/env node
/**
 * Belirli ürün kodlarını pimak.com'dan çeker ve manifest'e ekler.
 *   node scrape-codes.mjs BPKM.12 BHA.30 ...
 *   node scrape-codes.mjs --file p100-130-missing-scrape.json
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { absUrl, decodeHtml, firstMatch, parseAllTeknikTables, stripTags } from "./lib/html-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = "https://www.pimak.com";
const UA = "Mozilla/5.0 (compatible; PFOS-pimak-scraper/1.0)";

const CODE_GUESSES = {
  "BPKM.12": ["bpkm-12-paslanmaz-kiyma-makinesi", "bpkm-12"],
  "BPKM.12CK": ["bpkm-12ck-paslanmaz-cikma-kafa-kiyma-makinesi", "bpkm-12ck"],
  "BPKM.32CK": ["bpkm-32ck-paslanmaz-cikma-kafa-kiyma-makinesi", "bpkm-32ck"],
  "BPKM.32SCK": ["bpkm-32sck-paslanmaz-sogutuculu-cikma-kafa-kiyma-makinesi", "bpkm-32sck"],
  "BPKM.42SA": ["bpkm-42sa-paslanmaz-sogutuculu-kiyma-makinesi", "bpkm-42sa"],
  "BDH.45S": ["bdh-45s-devrilir-humus-makinesi", "bdh-45s"],
  "BKT.1840": ["bkt-1840-kemik-testeresi", "bkt-1840"],
  "BKTA.1840": ["bkta-1840-kemik-testeresi", "bkta-1840"],
  "BKS.150": ["bks-150-kofte-basma-makinesi", "bks-150"],
  BKB: ["bkb-adana-kebap-makinesi", "bkb"],
  "BHA.30T": ["bha-30t-paslanmaz-hamur-acma-makinesi", "bha-30t"],
  "BHA.40T": ["bha-40t-paslanmaz-hamur-acma-makinesi", "bha-40t"],
  "BHA.30": ["bha-30-paslanmaz-hamur-acma-makinesi", "bha-30"],
  "BHA.40": ["bha-40-paslanmaz-hamur-acma-makinesi", "bha-40"],
};

function slugifyCode(code) {
  return String(code)
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/\./g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

async function fetchText(url) {
  const r = await fetch(url, { headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.text();
}

function parseProductPage(html, url) {
  const slug = url.replace(`${BASE}/`, "").replace(/\/$/, "");
  const title =
    stripTags(firstMatch(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i)) ||
    decodeHtml(firstMatch(html, /<title>([^<]+)<\/title>/i));
  const urunKodu = stripTags(firstMatch(html, /class="urunkod"[\s\S]*?<p>([\s\S]*?)<\/p>/i)) || title?.split(" ")[0];
  const imgRel =
    firstMatch(html, /class="urunresim"[\s\S]*?<img[^>]+src="([^"]+)"/i) ||
    firstMatch(html, /class="imgBox"[\s\S]*?<img[^>]+src="([^"]+)"/i);
  const imageUrl = imgRel ? absUrl(url, imgRel) : null;
  const ozellikBlock = html.match(/class="ozelliklerbaslik"[^>]*>[^<]*<\/span>\s*<p>([\s\S]*?)<\/p>/i);
  const temelOzellikler = ozellikBlock ? stripTags(ozellikBlock[1]) : "";
  const teknikTablo = parseAllTeknikTables(html);
  const teknikSatirlar = teknikTablo.rows.map((row) => {
    const flat = {};
    for (const [k, v] of Object.entries(row)) {
      flat[k] = v?.text ?? v?.value ?? "";
      if (v?.type === "image" && v.value) flat[`${k}_gorsel`] = absUrl(url, v.value);
    }
    return flat;
  });
  return {
    slug,
    url,
    urunKodu,
    baslik: title,
    metaAciklama: decodeHtml(firstMatch(html, /name="description" content="([^"]*)"/i) || ""),
    gorsel: imageUrl,
    temelOzellikler: temelOzellikler.split(/\n|•/).map((s) => s.replace(/^[•\-\s]+/, "").trim()).filter(Boolean),
    temelOzelliklerMetin: temelOzellikler,
    teknikDetaylar: { kolonlar: teknikTablo.headers, satirlar: teknikSatirlar },
    cekilme: new Date().toISOString(),
  };
}

async function findUrl(code) {
  const guesses = CODE_GUESSES[code] || [slugifyCode(code)];
  for (const slug of guesses) {
    const url = `${BASE}/${slug}`;
    try {
      const html = await fetchText(url);
      if (/class="urundetay"/i.test(html)) return url;
    } catch {
      /* next */
    }
  }
  const q = encodeURIComponent(code);
  try {
    const html = await fetchText(`${BASE}/arama?q=${q}`);
    const links = [...html.matchAll(/href="(\/[a-z0-9][a-z0-9-]+)"/gi)].map((m) => m[1].slice(1));
    for (const slug of links.slice(0, 8)) {
      const url = `${BASE}/${slug}`;
      try {
        const p = await fetchText(url);
        if (!/class="urundetay"/i.test(p)) continue;
        const kod = stripTags(firstMatch(p, /class="urunkod"[\s\S]*?<p>([\s\S]*?)<\/p>/i));
        if (kod && kod.replace(/\s+/g, "").toUpperCase() === code.replace(/\s+/g, "").toUpperCase()) return url;
      } catch {
        /* */
      }
    }
  } catch {
    /* */
  }
  return null;
}

async function downloadImage(imageUrl, slug) {
  if (!imageUrl) return null;
  const imgDir = path.join(__dirname, "media", "images");
  await fs.mkdir(imgDir, { recursive: true });
  const r = await fetch(imageUrl, { headers: { "User-Agent": UA } });
  if (!r.ok) return null;
  const buf = Buffer.from(await r.arrayBuffer());
  const fileName = `${slug}.jpg`;
  await fs.writeFile(path.join(imgDir, fileName), buf);
  return { fileName, local: `media/images/${fileName}`, bytes: buf.length };
}

async function upsertManifest(product) {
  const manifestPath = path.join(__dirname, "products-tr.json");
  const raw = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  const norm = (k) => String(k || "").replace(/\s+/g, "").trim().toUpperCase();
  const idx = (raw.products || []).findIndex((p) => norm(p.urunKodu) === norm(product.urunKodu));
  const summary = {
    slug: product.slug,
    urunKodu: product.urunKodu,
    baslik: product.baslik,
    url: product.url,
    kategori: product.kategori?.slug || "",
    gorsel: product.gorsel,
    gorselYerel: product.gorselYerel?.local,
  };
  if (idx >= 0) raw.products[idx] = { ...raw.products[idx], ...summary };
  else raw.products.push(summary);
  raw.productCount = raw.products.length;
  await fs.writeFile(manifestPath, JSON.stringify(raw, null, 2), "utf8");
}

async function main() {
  let codes = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  if (process.argv.includes("--file")) {
    const f = process.argv[process.argv.indexOf("--file") + 1];
    const rows = JSON.parse(await fs.readFile(path.join(__dirname, f), "utf8"));
    codes = rows.map((r) => r.code || r.urun_kodu);
  }
  const pagesDir = path.join(__dirname, "urun-sayfalari");
  await fs.mkdir(pagesDir, { recursive: true });

  for (const code of codes) {
    const url = await findUrl(code);
    if (!url) {
      console.warn("[skip]", code, "URL bulunamadı");
      continue;
    }
    const html = await fetchText(url);
    const product = parseProductPage(html, url);
    product.gorselYerel = await downloadImage(product.gorsel, product.slug);
    await fs.writeFile(path.join(pagesDir, `${product.slug}.json`), JSON.stringify(product, null, 2), "utf8");
    await upsertManifest(product);
    console.log("[ok]", code, "->", product.slug);
    await new Promise((r) => setTimeout(r, 400));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
