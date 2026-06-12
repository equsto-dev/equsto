#!/usr/bin/env node
/**
 * yukselendustriyel.com — Taşıma Arabaları (44 ürün)
 * Görseller + katalog eşleştirme + PDF fiyat (%55 iskonto)
 *
 *   node scripts/sync-yukselendustriyel-araba.mjs
 *   node scripts/sync-yukselendustriyel-araba.mjs --fetch-only
 *   node scripts/sync-yukselendustriyel-araba.mjs --apply-only
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { fetchTcmbEurRate } from "./fetch-tcmb-kur.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const HOST = "https://www.yukselendustriyel.com";
const UA = "Mozilla/5.0 (Equsto; +https://equsto.com)";
const TASIMA_CAT_ID = 50;
const MIN_IMG = 3000;
const ISKONTO = Number(process.env.EQUSTO_YUKSEL_ISKONTO || "0.55");
const NET_MULT = 1 - ISKONTO;
const KDV = Number(process.env.EQUSTO_KDV_ORAN || "20");
const KAYNAK_PDF = "yuksel-2025-yerli-pdf";
const LISTE = "YÜKSEL YERLİ - 2025";

const OUT_JSON = path.join(ROOT, "scripts/data/yukselendustriyel-araba-catalog.json");
const ARABA_JSON = path.join(ROOT, "public/data/dept/araba.json");
const PRICE_JSON = path.join(ROOT, "public/data/fiyat-listeleri/yuksel/2025-yerli/araba-fiyatlar.json");
const IMG_DIR = path.join(ROOT, "public/images/catalog/yuksel/web");
const IMG_REL = "images/catalog/yuksel/web";

const args = new Set(process.argv.slice(2));
const doFetch = args.has("--fetch-only") || (!args.has("--apply-only") && !args.has("--prices-only"));
const doApply = args.has("--apply-only") || (!args.has("--fetch-only") && !args.has("--prices-only"));
const doPrices = args.has("--prices-only") || (!args.has("--fetch-only") && !args.has("--apply-only"));

const tcmb = await fetchTcmbEurRate();
const EUR_TRY =
  Number(process.env.EQUSTO_EUR_TRY) > 0 ? Number(process.env.EQUSTO_EUR_TRY) : tcmb.rate;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function decodeHtml(s) {
  return String(s || "")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normHay(s) {
  return decodeHtml(s)
    .toUpperCase()
    .replace(/İ/g, "I")
    .replace(/[^A-Z0-9]/g, "");
}

function slugFile(s) {
  return decodeHtml(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function fmtTry(n) {
  const parts = n.toFixed(2).split(".");
  const int = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${int},${parts[1]}`;
}

function priceFromEuro(listEur) {
  const netEur = Math.round(listEur * NET_MULT * 100) / 100;
  const netTry = netEur * EUR_TRY;
  const kdvDahil = netTry * (1 + KDV / 100);
  return {
    netEur,
    price: `₺${fmtTry(netTry)} + KDV\nKDV Dahil ₺${fmtTry(kdvDahil)}`,
    fiyat_tl: Math.round(netTry),
  };
}

function dimensionKeys(text) {
  const keys = new Set();
  for (const m of String(text || "").matchAll(/(\d{2,3})\s*[xX×]\s*(\d{2,3})/g)) {
    keys.add(`${m[1]}X${m[2]}`);
    keys.add(normHay(`${m[1]}X${m[2]}`));
  }
  for (const m of String(text || "").matchAll(/(\d{2,3})\s*[xX×]\s*(\d{2,3})\s*[xX×]\s*(\d{2,4})/g)) {
    keys.add(`${m[1]}X${m[2]}X${m[3]}`);
  }
  return [...keys];
}

function extractModelKeys(name, sku, extra = "") {
  const keys = new Set();
  const text = `${decodeHtml(name)} ${extra}`.toUpperCase();
  const add = (raw) => {
    const k = normHay(raw);
    if (k.length >= 3) keys.add(k);
  };
  if (sku) add(sku);
  for (const d of dimensionKeys(text)) add(d);
  for (const m of text.matchAll(/\b(M0?\d{4,6}[A-Z0-9]*)\b/g)) add(m[1]);
  for (const m of text.matchAll(/\b(M[A-Z]?\d{3,5}[A-Z0-9]*)\b/g)) add(m[1]);
  for (const m of text.matchAll(/\b(C\d{3}[A-Z]?)\b/g)) add(m[1]);
  for (const m of text.matchAll(/\b(MS\d{3}[A-Z0-9]*)\b/g)) add(m[1]);
  for (const m of text.matchAll(/\b(MT\d{3}[A-Z0-9]*)\b/g)) add(m[1]);
  for (const m of text.matchAll(/\b(MB\d{3}[A-Z0-9]*)\b/g)) add(m[1]);
  return [...keys];
}

function nameTokens(s) {
  return decodeHtml(s)
    .toLocaleLowerCase("tr")
    .replace(/[^a-z0-9ğüşıöç\s]/gi, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !/yuksel|portashelf|endustriyel|mutfak/.test(w));
}

function nameScore(a, b) {
  const ta = new Set(nameTokens(a));
  const tb = new Set(nameTokens(b));
  if (!ta.size || !tb.size) return 0;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  return inter / Math.max(ta.size, tb.size);
}

/** Web ürün adı → PDF model kodu (apply-yuksel-araba-prices ile uyumlu) */
const WEB_NAME_RULES = [
  [/KUVERLİ|KUVERLI/, "M0182X"],
  [/KUVERSİZ|KUVERSIZ/, "M0180X"],
  [/TABAK KARTU/, "M08221"],
  [/DÖRTLÜ TABAK|DORTLU TABAK/, "M0130X"],
  [/İKİLİ TABAK|IKILI TABAK/, "M0110X"],
  [/TEKLİ TABAK|TEKLI TABAK/, "M0100X"],
  [/17 KATLI.*GN 2\/1|17 KAT.*2\/1/, "MT152X2"],
  [/17 KATLI.*GN 1\/1|17 KAT.*1\/1/, "MT150X2"],
  [/9 KATLI.*GN 2\/1/, "MT152X2"],
  [/9 KATLI.*GN 1\/1/, "MT150X2"],
  [/TEPSİ TAŞIMA.*70.*50|70\s*[xX×]\s*50/, "MT132X2"],
  [/TEPSİ TAŞIMA.*60.*40|60\s*[xX×]\s*40/, "MT130X2"],
  [/ÇİFT KAPAKLI ERZAK|CIFT KAPAKLI ERZAK/, "MT142X"],
  [/TEK KAPAKLI ERZAK/, "MT140X"],
  [/ET ASKI/, "MT120X"],
  [/ET.*BALIK|BALIK TAŞIMA/, "MT120X"],
  [/PLATFORM DÜZ|PLATFORM DUZ/, "MT170X2"],
  [/PLATFORM TEL|PLATFROM TEL/, "MT190G"],
  [/TABAK TAŞIMA.*400|400 TABAK/, "MT162X2"],
  [/TABAK TAŞIMA.*200|200 TABAK/, "MT160X2"],
  [/YÜKSEK KASET|KASET TAŞIMA.*YÜKSEK/, "MB136X2"],
  [/KOLLU KASET|KASET TAŞIMA.*KOLLU/, "MB132X2"],
  [/KOLSUZ KASET|KASET TAŞIMA.*KOLSUZ/, "MB130X2"],
  [/ALÇAK KASET/, "MB134X2"],
  [/KAZAN.*TENCERE|TENCERE TAŞIMA/, "MT128X2"],
  [/EVYELİ ARABA|EVYELI ARABA/, "MB124X"],
  [/YUVARLAK ÇÖP|COP ARABASI/, "MB126X"],
  [/KARE ÇÖP/, "MB126X"],
  [/BULAŞIK TOPLAMA HAVUZU|BULASIK TOPLAMA HAVUZU/, "MB120X2"],
  [/İKİLİ TEL RAF|IKILI TEL RAF/, "MB114X4"],
  [/TEKLİ TEL RAF|TEKLI TEL RAF/, "MB110X4"],
  [/İKİLİ KOMPLE SAC|IKILI KOMPLE SAC/, "MB106X2"],
  [/TEKLİ KOMPLE SAC|TEKLI KOMPLE SAC/, "MB100X2"],
  [/ÜÇLÜ BULAŞIK|UCLU BULASIK/, "MB108X2"],
  [/İKİLİ BULAŞIK TOPLAMA|IKILI BULASIK TOPLAMA/, "MB106X2"],
  [/TEKLİ BULAŞIK TOPLAMA|TEKLI BULASIK TOPLAMA/, "MB100X2"],
  [/İKİ KATLI SERVİS.*AHŞAP|IKI KATLI SERVIS.*AHSAP/, "MS120X2"],
  [/ÜÇ KATLI SERVİS.*AHŞAP|UC KATLI SERVIS.*AHSAP/, "MS102BA"],
  [/ÜÇ KATLI SERVİS|UC KATLI SERVIS/, "MS102BA"],
  [/İKİ KATLI SERVİS|IKI KATLI SERVIS/, "MS120X2"],
  [/KİRLİ TOPLAMA|KIRLI TOPLAMA/, "C130B"],
  [/ASKI ARABASI/, "C120B"],
  [/ÇAMAŞIR SEPETİ|CAMASIR SEPETI/, "C122X"],
  [/SEPETLİ ARABA|SEPETLI ARABA/, "MT150X2"],
];

const SUBCAT_LABEL = {
  "mutfak-bulasik-arabalari": "Mutfak Bulaşık Arabaları",
  "tasima-ve-muhafaza-arabalari": "Taşıma ve Muhafaza Arabaları",
  "servis-arabalari": "Servis Arabaları",
  "camasirhane-arabalari": "Çamaşırhane Arabaları",
  otomatlar: "Otomatlar",
  "tasima-arabalari": "Taşıma Arabaları",
};

function resolvePdfModelFromName(name, pdf) {
  const n = String(name || "").toUpperCase();
  for (const [re, code] of WEB_NAME_RULES) {
    if (re.test(n) && pdf[code]) return { model: code, listEur: pdf[code], via: "web-name:" + code };
  }
  return null;
}

function resolvePdfModel(row, pdf) {
  const keys = [row.sku, row.model].filter(Boolean).map(normHay);
  for (const k of keys) {
    if (pdf[k]) return { model: k, listEur: pdf[k], via: "sku" };
  }
  return resolvePdfModelFromName(row.name, pdf);
}

async function parseProductPage(slug) {
  try {
    const html = await fetch(`${HOST}/urun/${slug}/`, {
      headers: { "User-Agent": UA, "Accept-Language": "tr-TR,tr;q=0.9" },
      signal: AbortSignal.timeout(45000),
    }).then((r) => (r.ok ? r.text() : ""));
    if (!html) return { attrs: [], extra: "", pageSku: "" };

    const attrs = [];
    for (const row of html.matchAll(
      /woocommerce-product-attributes-item__label[^>]*>([\s\S]*?)<[\s\S]*?woocommerce-product-attributes-item__value[^>]*>([\s\S]*?)<\//gi,
    )) {
      const label = decodeHtml(row[1].replace(/<[^>]+>/g, ""));
      const value = decodeHtml(row[2].replace(/<[^>]+>/g, ""));
      if (label || value) attrs.push({ label, value });
    }
    const extra = attrs.map((a) => `${a.label} ${a.value}`).join(" ");
    const pageSku =
      html.match(/class="sku"[^>]*>([^<]+)/i)?.[1]?.trim() ||
      html.match(/"sku"\s*:\s*"([^"]+)"/i)?.[1] ||
      "";
    return { attrs, extra, pageSku: pageSku === "Yok" ? "" : pageSku };
  } catch {
    return { attrs: [], extra: "", pageSku: "" };
  }
}

async function fetchTasimaProducts() {
  const url = `${HOST}/wp-json/wc/store/products?category=${TASIMA_CAT_ID}&per_page=100`;
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(120000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  const json = await res.json();
  if (!Array.isArray(json)) throw new Error("Beklenmeyen API yanıtı");
  return json;
}

function normalizeProduct(p, enrich = {}) {
  const name = decodeHtml(p.name);
  const sku = String(enrich.pageSku || p.sku || "").trim();
  const categories = (p.categories || []).map((c) => ({
    id: c.id,
    slug: c.slug,
    name: decodeHtml(c.name),
  }));
  const leaf =
    categories.find((c) => c.slug !== "tasima-arabalari" && SUBCAT_LABEL[c.slug]) ||
    categories[0];
  const subcatSlug = leaf?.slug || "tasima-arabalari";
  const modelKeys = extractModelKeys(name, sku, enrich.extra || "");
  const pdfGuess = resolvePdfModelFromName(name, loadPdfPrices());

  return {
    id: p.id,
    slug: p.slug,
    name,
    sku: sku || pdfGuess?.model || "",
    model_keys: modelKeys,
    pdf_model_guess: pdfGuess?.model || null,
    attributes: enrich.attrs || [],
    image_url: p.images?.[0]?.src || "",
    images: (p.images || []).map((i) => i.src).filter(Boolean),
    categories,
    subcat_slug: subcatSlug,
    subcat_label: SUBCAT_LABEL[subcatSlug] || decodeHtml(leaf?.name || ""),
    url: p.permalink || `${HOST}/urun/${p.slug}/`,
    fetched_at: new Date().toISOString().slice(0, 10),
  };
}

function loadPdfPrices() {
  if (!fs.existsSync(PRICE_JSON)) return {};
  return JSON.parse(fs.readFileSync(PRICE_JSON, "utf8"));
}

async function downloadImage(url, destAbs) {
  if (fs.existsSync(destAbs) && fs.statSync(destAbs).size >= MIN_IMG) return true;
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Referer: HOST },
    signal: AbortSignal.timeout(120000),
  });
  if (!res.ok) return false;
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < MIN_IMG) return false;
  fs.mkdirSync(path.dirname(destAbs), { recursive: true });
  fs.writeFileSync(destAbs, buf);
  return true;
}

function buildProductIndex(products) {
  const byKey = new Map();
  const byName = products;
  for (const p of products) {
    for (const k of p.model_keys) {
      if (!byKey.has(k)) byKey.set(k, p);
    }
    if (p.pdf_model_guess) byKey.set(normHay(p.pdf_model_guess), p);
    if (p.sku) byKey.set(normHay(p.sku), p);
    byKey.set(normHay(p.slug), p);
  }
  return { byKey, byName };
}

function findWebProduct(row, index) {
  const hit = resolvePdfModelFromName(row.name, loadPdfPrices());
  if (hit && index.byKey.has(normHay(hit.model))) {
    return { product: index.byKey.get(normHay(hit.model)), via: hit.model, method: "pdf-name" };
  }
  const keys = extractModelKeys(row.name || "", row.sku || row.model || "");
  keys.unshift(normHay(row.sku || row.model || ""));
  for (const k of keys) {
    if (k.length >= 3 && index.byKey.has(k)) {
      return { product: index.byKey.get(k), via: k, method: "key" };
    }
  }
  let best = null;
  for (const p of index.byName) {
    const score = nameScore(row.name || "", p.name);
    if (score >= 0.55 && (!best || score > best.score)) {
      best = { product: p, via: "name", method: "name", score };
    }
  }
  return best;
}

function isArabaRow(row) {
  return row.category === "tasima-arabalari" || String(row.id || "").startsWith("yukselsatis__");
}

function imageFileName(row, product) {
  const code = String(row.sku || row.model || product.pdf_model_guess || product.slug).trim();
  const ext = path.extname(new URL(product.image_url).pathname) || ".jpg";
  return `yuksel-${slugFile(code || product.slug)}_1${ext.replace(/jpeg/i, ".jpg")}`;
}

function applyPrice(row, hit) {
  const { netEur, price, fiyat_tl } = priceFromEuro(hit.listEur);
  row.price = price;
  row.fiyat_tl = fiyat_tl;
  row.liste_fiyati_eur = hit.listEur;
  row.satis_eur_net = netEur;
  row.satis_eur_indirimli = netEur;
  row.iskonto_oran = Math.round(ISKONTO * 100);
  row.kaynak_fiyat_listesi = KAYNAK_PDF;
  if (hit.model === "MB126X" || /COP ARABASI|ÇÖP ARABASI/i.test(String(row.name || ""))) {
    row.brand = "Portashelf";
    row.name = row.name?.includes("Portashelf")
      ? row.name
      : `Portashelf Paslanmaz Çöp Arabası ${hit.model}`;
  }
  delete row.fiyat_bekleniyor;
  if (!row.model || row.model === row.sku) row.model = hit.model;
  if (!row.sku || row.sku.includes("-")) row.sku = hit.model;
}

const SLUG_TO_MODEL = {
  "iki-katli-servis-arabasi": "MS120X2",
  "uc-katli-ahsap-servis-arabasi": "MS102BA",
  "iki-katli-ahsap-servis-arabasi": "MS120X2",
  "ikili-tel-raf-bulasik-toplama": "MB114X4",
  "bulasik-toplama-tekli": "MB100X2",
  "kare-cop-arabasi": "MB126X",
  "yuvarlak-cop-arabasi": "MB126X",
  "17-katli-tepsi-tasima-gn-2-1": "MT152X2",
  "17-katli-tepsi-tasima-gn-1-1": "MT150X2",
  "et-balik-tasima": "MT120X",
};

function modelFromWebProduct(p) {
  if (p.pdf_model_guess) return p.pdf_model_guess;
  if (SLUG_TO_MODEL[p.slug]) return SLUG_TO_MODEL[p.slug];
  return resolvePdfModelFromName(p.name, loadPdfPrices())?.model || null;
}

function mergeOrphanYukselendustriyelRows(rows) {
  const pdf = loadPdfPrices();
  let merged = 0;
  const orphans = rows.filter((r) => String(r.id || "").startsWith("yukselendustriyel__"));
  for (const orphan of orphans) {
    const slug = orphan.yukselendustriyel_slug || String(orphan.id).replace(/^yukselendustriyel__/, "");
    const model =
      SLUG_TO_MODEL[slug] ||
      resolvePdfModelFromName(orphan.name, pdf)?.model ||
      null;
    if (!model) continue;
    const target = rows.find(
      (r) =>
        r !== orphan &&
        r.category === "tasima-arabalari" &&
        normHay(r.sku || r.model || "") === normHay(model),
    );
    if (!target) {
      orphan.sku = model;
      orphan.model = model;
      const hit = resolvePdfModelFromName(orphan.name, pdf) || { model, listEur: pdf[model], via: "slug" };
      if (pdf[model]) applyPrice(orphan, { model, listEur: pdf[model], via: "slug-fix" });
      continue;
    }
    if (orphan.images?.length) target.images = orphan.images;
    if (orphan.yukselendustriyel_url) target.yukselendustriyel_url = orphan.yukselendustriyel_url;
    if (orphan.yukselendustriyel_slug) target.yukselendustriyel_slug = orphan.yukselendustriyel_slug;
    target.yukselendustriyel_image_source = orphan.yukselendustriyel_image_source;
    target.yukselendustriyel_match_via = orphan.yukselendustriyel_match_via;
    if (orphan.alt_kategori_1) target.alt_kategori_1 = orphan.alt_kategori_1;
    if (pdf[model]) applyPrice(target, { model, listEur: pdf[model], via: "merge" });
    const idx = rows.indexOf(orphan);
    if (idx >= 0) rows.splice(idx, 1);
    merged++;
  }
  if (merged) console.log(`[yukselendustriyel] ${merged} yetim satır birleştirildi`);
  return rows;
}

function dedupeArabaRows(rows) {
  const bySku = new Map();
  const out = [];
  let removed = 0;

  function prefer(a, b) {
    const aNew = String(a.id || "").startsWith("yukselendustriyel__");
    const bNew = String(b.id || "").startsWith("yukselendustriyel__");
    if (aNew && !bNew) return b;
    if (bNew && !aNew) return a;
    return a;
  }

  for (const row of rows) {
    const sku = normHay(row.sku || row.model || "");
    if (!sku || row.category !== "tasima-arabalari") {
      out.push(row);
      continue;
    }
    const prev = bySku.get(sku);
    if (!prev) {
      bySku.set(sku, row);
      out.push(row);
      continue;
    }
    const kept = prefer(prev, row);
    const dropped = kept === prev ? row : prev;
    if (kept !== prev) {
      const idx = out.indexOf(prev);
      if (idx >= 0) out[idx] = kept;
      bySku.set(sku, kept);
    }
    removed++;
    void dropped;
  }
  if (removed) console.log(`[yukselendustriyel] ${removed} yinelenen satır kaldırıldı`);
  return out;
}

function catalogHasPdfModel(rows, model) {
  if (!model) return false;
  const m = normHay(model);
  return rows.some(
    (r) =>
      r.category === "tasima-arabalari" &&
      !String(r.id || "").startsWith("yukselendustriyel__") &&
      normHay(r.sku || r.model || "") === m,
  );
}
function buildNewRow(p, imageRel, pdfHit) {
  const brand =
    pdfHit?.model === "MB126X" ? "Portashelf" : "Yüksel Endüstriyel";
  const name =
    pdfHit?.model === "MB126X"
      ? `Portashelf Paslanmaz Çöp Arabası ${pdfHit.model}`
      : p.name;
  const row = {
    id: `yukselendustriyel__${p.slug}`,
    dept: "araba",
    category: "tasima-arabalari",
    brand,
    name,
    specs: [
      name,
      "",
      "Kaynak: yukselendustriyel.com",
      p.url,
      `Alt kategori: ${p.subcat_label}`,
      p.attributes?.length
        ? "\n" + p.attributes.map((a) => `${a.label}: ${a.value}`).join("\n")
        : "",
    ]
      .filter(Boolean)
      .join("\n"),
    aciklama: name,
    sku: pdfHit?.model || p.sku || p.slug.slice(0, 20).toUpperCase(),
    model: pdfHit?.model || p.sku || "",
    images: imageRel ? [imageRel] : [],
    kaynak_fiyat_listesi: "yukselendustriyel-web",
    yukselendustriyel_url: p.url,
    yukselendustriyel_slug: p.slug,
    yukselendustriyel_image_source: imageRel ? "yukselendustriyel-web" : undefined,
    alt_kategori_1: p.subcat_label,
    urun_kategori: "Servis Arabaları",
    urun_alt_kategori: "Tasima Arabalari",
    kategori_yolu: ["Servis Arabaları", "Tasima Arabalari", p.subcat_label],
    keywords: [brand, p.name, p.subcat_label].filter(Boolean),
  };
  if (pdfHit) applyPrice(row, pdfHit);
  else {
    row.price = "Teklif için iletişim";
    row.fiyat_bekleniyor = true;
  }
  return row;
}

async function stepFetch() {
  console.log("[yukselendustriyel] Taşıma Arabaları çekiliyor…");
  const raw = await fetchTasimaProducts();
  console.log(`[yukselendustriyel] ${raw.length} ürün — sayfa detayları…`);
  const products = [];
  let n = 0;
  for (const p of raw) {
    n++;
    const enrich = await parseProductPage(p.slug);
    products.push(normalizeProduct(p, enrich));
    if (n % 10 === 0) console.log(`  ${n}/${raw.length}`);
    await sleep(100);
  }
  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(products, null, 2), "utf8");
  console.log(`[yukselendustriyel] kaydedildi → ${path.relative(ROOT, OUT_JSON)}`);
  return products;
}

async function stepApply(products) {
  if (!products?.length) {
    products = JSON.parse(fs.readFileSync(OUT_JSON, "utf8"));
  }
  const pdf = loadPdfPrices();
  const index = buildProductIndex(products);
  const rows = JSON.parse(fs.readFileSync(ARABA_JSON, "utf8"));
  const existingIds = new Set(rows.map((r) => r.id));
  const existingSlugs = new Set(
    rows.map((r) => r.yukselendustriyel_slug || r.yukselsatis_slug).filter(Boolean),
  );
  let matched = 0;
  let imagesOk = 0;
  let added = 0;

  for (const row of rows) {
    if (!isArabaRow(row)) continue;
    const hit = findWebProduct(row, index);
    if (!hit?.product?.image_url) continue;

    const rel = `${IMG_REL}/${imageFileName(row, hit.product)}`.replace(/\\/g, "/");
    const abs = path.join(ROOT, "public", rel);
    const ok = await downloadImage(hit.product.image_url, abs);
    if (!ok && !fs.existsSync(abs)) continue;

    row.images = [rel];
    row.yukselendustriyel_url = hit.product.url;
    row.yukselendustriyel_slug = hit.product.slug;
    row.yukselendustriyel_image_source = "yukselendustriyel-web";
    row.yukselendustriyel_match_via = `${hit.method}:${hit.via || ""}`;
    if (hit.product.subcat_label) row.alt_kategori_1 = hit.product.subcat_label;

    const pdfHit = resolvePdfModel(row, pdf);
    if (pdfHit) applyPrice(row, pdfHit);

    matched++;
    if (ok || fs.existsSync(abs)) imagesOk++;
    existingSlugs.add(hit.product.slug);
  }

  for (const p of products) {
    if (existingSlugs.has(p.slug)) continue;
    const pdfHit = resolvePdfModelFromName(p.name, pdf);
    if (pdfHit && catalogHasPdfModel(rows, pdfHit.model)) continue;

    const importId = `yukselendustriyel__${p.slug}`;
    if (existingIds.has(importId)) continue;

    let imageRel = "";
    if (p.image_url) {
      const fname = imageFileName({ sku: p.sku, model: p.pdf_model_guess }, p);
      imageRel = `${IMG_REL}/${fname}`.replace(/\\/g, "/");
      await downloadImage(p.image_url, path.join(ROOT, "public", imageRel));
    }
    const pdfHit2 = resolvePdfModelFromName(p.name, pdf);
    const newRow = buildNewRow(p, imageRel, pdfHit2);
    rows.push(newRow);
    added++;
    console.log(`[yukselendustriyel] +yeni: ${newRow.sku || p.slug} — ${p.name.slice(0, 50)}`);
  }

  const mergedRows = mergeOrphanYukselendustriyelRows(rows);
  const deduped = dedupeArabaRows(mergedRows);
  fs.writeFileSync(ARABA_JSON, JSON.stringify(deduped), "utf8");

  const rebuild = spawnSync(process.execPath, ["scripts/rebuild-ekipmanlar-from-dept.mjs"], {
    cwd: ROOT,
    stdio: "inherit",
  });
  if (rebuild.status !== 0) process.exit(rebuild.status || 1);

  console.log(
    `[yukselendustriyel] görsel: ${matched} güncellendi, ${imagesOk} indirildi, +${added} yeni`,
  );
  return { matched, imagesOk, added };
}

function stepPrices() {
  const pdf = loadPdfPrices();
  const rows = JSON.parse(fs.readFileSync(ARABA_JSON, "utf8"));
  let applied = 0;
  const missed = [];

  for (const row of rows) {
    if (!isArabaRow(row)) continue;
    const hit = resolvePdfModel(row, pdf);
    if (!hit) {
      missed.push(row.name);
      continue;
    }
    applyPrice(row, hit);
    applied++;
  }

  const cleaned = dedupeArabaRows(mergeOrphanYukselendustriyelRows(rows));
  fs.writeFileSync(ARABA_JSON, JSON.stringify(cleaned), "utf8");
  const rebuild2 = spawnSync(process.execPath, ["scripts/rebuild-ekipmanlar-from-dept.mjs"], {
    cwd: ROOT,
    stdio: "inherit",
  });
  if (rebuild2.status !== 0) process.exit(rebuild2.status || 1);

  console.log(`[yukselendustriyel] fiyat: ${applied} uygulandı, EUR→TRY ${EUR_TRY}`);
  if (missed.length) {
    console.log("[yukselendustriyel] fiyatsız:");
    for (const n of missed) console.log("  -", n);
  }
}

let products = null;
if (doFetch) products = await stepFetch();
if (doApply) await stepApply(products);
if (doPrices) stepPrices();

console.log("[yukselendustriyel] tamam");
