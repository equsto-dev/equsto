#!/usr/bin/env node
/**
 * yukselendustriyel.com/thermobox — Avatherm Thermobox (37 ürün)
 * Görseller + tasima dept + YÜKSEL YERLİ 2025 PDF fiyat (%55 iskonto)
 *
 *   node scripts/sync-yukselendustriyel-thermobox.mjs
 *   node scripts/sync-yukselendustriyel-thermobox.mjs --fetch-only
 *   node scripts/sync-yukselendustriyel-thermobox.mjs --apply-only
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { fetchTcmbEurRate } from "./fetch-tcmb-kur.mjs";
import { applyAvathermTasimaMeta, isAvathermRow } from "./lib/avatherm-tasima.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const HOST = "https://www.yukselendustriyel.com";
const UA = "Mozilla/5.0 (Equsto; +https://equsto.com)";
const THERMOBOX_CAT_ID = 42;
const MIN_IMG = 3000;
const ISKONTO = Number(process.env.EQUSTO_YUKSEL_ISKONTO || "0.55");
const NET_MULT = 1 - ISKONTO;
const KDV = Number(process.env.EQUSTO_KDV_ORAN || "20");
const KAYNAK_PDF = "yuksel-2025-yerli-pdf";
const LISTE = "YÜKSEL YERLİ - 2025";
const PDF = process.env.YUKSEL_PDF || String.raw`C:\D Disk\FİYAT LİSTELERİ\YÜKSEL YERLİ - 2025.pdf`;

const OUT_JSON = path.join(ROOT, "scripts/data/yukselendustriyel-thermobox-catalog.json");
const TASIMA_JSON = path.join(ROOT, "public/data/dept/tasima.json");
const PRICE_JSON = path.join(ROOT, "public/data/fiyat-listeleri/yuksel/2025-yerli/thermobox-fiyatlar.json");
const IMG_REL = "images/catalog/yuksel/web";

const SUBCAT_LABEL = {
  "catering-modelleri": "Catering Modelleri",
  "fast-food-modelleri": "Fast Food Modelleri",
  "medikal-modelleri": "Medikal Modelleri",
  "pasta-tasima-modelleri": "Pasta Taşıma Modelleri",
  "tepsi-modelleri": "Tepsi Modelleri",
  "tepsi-tasima-arabasi-modelleri": "Tepsi Taşıma Arabası Modelleri",
  thermobox: "Thermobox",
};

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

function loadPdfPrices() {
  if (!fs.existsSync(PRICE_JSON)) return { by_slug: {}, by_code: {}, slug_aliases: {}, by_name: {} };
  const raw = JSON.parse(fs.readFileSync(PRICE_JSON, "utf8"));
  return {
    by_slug: raw.by_slug || {},
    by_code: raw.by_code || {},
    slug_aliases: raw.slug_aliases || {},
    by_name: raw.by_name || {},
  };
}

function ensurePdfPrices() {
  const py = spawnSync("python", [path.join(ROOT, "scripts/extract-yuksel-thermobox-pdf.py"), PDF], {
    cwd: ROOT,
    encoding: "utf8",
  });
  if (py.status !== 0) {
    console.error(py.stderr || py.stdout || "Thermobox PDF çıkarımı başarısız");
    process.exit(1);
  }
}

function resolvePdfPrice(p, pdf) {
  if (p.slug && pdf.by_slug[p.slug]) {
    return { model: p.sku || p.slug, listEur: pdf.by_slug[p.slug], via: "slug:" + p.slug };
  }
  const sku = String(p.sku || "").trim();
  const code = normHay(sku);
  if (code && pdf.by_code[code]) {
    return { model: sku || code, listEur: pdf.by_code[code], via: "code:" + code };
  }
  return null;
}

function resolveRowPrice(row, pdf) {
  const slug = row.yukselendustriyel_slug || row.yukselsatis_slug || "";
  const alias = slug && pdf.slug_aliases[slug];
  const slugKey = alias || slug;
  if (slugKey && pdf.by_slug[slugKey]) {
    return { model: row.sku || slugKey, listEur: pdf.by_slug[slugKey], via: "slug:" + slugKey };
  }
  for (const k of [row.sku, row.model].filter(Boolean)) {
    const c = normHay(k);
    if (pdf.by_code[c]) return { model: k, listEur: pdf.by_code[c], via: "code:" + c };
  }
  if (row.id?.startsWith("yukselendustriyel__")) {
    const s = row.id.replace(/^yukselendustriyel__/, "");
    if (pdf.by_slug[s]) return { model: row.sku || s, listEur: pdf.by_slug[s], via: "slug:" + s };
  }
  if (row.id?.startsWith("yukselsatis__")) {
    const s = row.id.replace(/^yukselsatis__/, "");
    const a = pdf.slug_aliases[s] || s;
    if (pdf.by_slug[a]) return { model: row.sku || s, listEur: pdf.by_slug[a], via: "alias:" + a };
  }
  const nameKey = Object.keys(pdf.by_name || {}).find((k) =>
    normHay(row.name || "").includes(normHay(k)),
  );
  if (nameKey) {
    return { model: row.sku || nameKey, listEur: pdf.by_name[nameKey], via: "name:" + nameKey };
  }
  return null;
}

function normNameKey(name) {
  return decodeHtml(name).toLocaleLowerCase("tr").replace(/\s+/g, " ").trim();
}

function dedupeThermoboxRows(rows) {
  const groups = new Map();
  for (const row of rows) {
    if (!isAvathermRow(row)) continue;
    const slug = row.yukselendustriyel_slug || row.yukselsatis_slug || "";
    const key = slug || normNameKey(row.name || row.id || "");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }

  const drop = new Set();
  for (const [, group] of groups) {
    if (group.length < 2) continue;
    const ranked = [...group].sort((a, b) => {
      const score = (r) =>
        (String(r.id || "").startsWith("yukselendustriyel__") ? 4 : 0) +
        (r.yukselendustriyel_url ? 2 : 0) +
        (r.fiyat_tl > 0 ? 1 : 0) +
        ((r.images?.length || 0) > 0 ? 1 : 0);
      return score(b) - score(a);
    });
    for (const row of ranked.slice(1)) drop.add(row);
  }

  if (!drop.size) return rows;
  console.log(`[yukselendustriyel-thermobox] ${drop.size} yinelenen AVATHERM satırı kaldırıldı`);
  return rows.filter((r) => !drop.has(r));
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
  delete row.fiyat_bekleniyor;
  if (hit.model && (!row.sku || row.sku.includes("-"))) row.sku = hit.model;
  if (hit.model) row.model = hit.model;
}

async function parseProductPage(slug) {
  try {
    const html = await fetch(`${HOST}/urun/${slug}/`, {
      headers: { "User-Agent": UA, "Accept-Language": "tr-TR,tr;q=0.9" },
      signal: AbortSignal.timeout(45000),
    }).then((r) => (r.ok ? r.text() : ""));
    if (!html) return { attrs: [], pageSku: "" };

    const attrs = [];
    for (const row of html.matchAll(
      /woocommerce-product-attributes-item__label[^>]*>([\s\S]*?)<[\s\S]*?woocommerce-product-attributes-item__value[^>]*>([\s\S]*?)<\//gi,
    )) {
      const label = decodeHtml(row[1].replace(/<[^>]+>/g, ""));
      const value = decodeHtml(row[2].replace(/<[^>]+>/g, ""));
      if (label || value) attrs.push({ label, value });
    }
    const pageSku =
      html.match(/class="sku"[^>]*>([^<]+)/i)?.[1]?.trim() ||
      html.match(/"sku"\s*:\s*"([^"]+)"/i)?.[1] ||
      "";
    return { attrs, pageSku: pageSku === "Yok" ? "" : pageSku };
  } catch {
    return { attrs: [], pageSku: "" };
  }
}

async function fetchThermoboxProducts() {
  const url = `${HOST}/wp-json/wc/store/products?category=${THERMOBOX_CAT_ID}&per_page=100`;
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(120000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  const json = await res.json();
  if (!Array.isArray(json)) throw new Error("Beklenmeyen API yanıtı");
  return json;
}

function normalizeProduct(p, enrich = {}, pdf) {
  const name = decodeHtml(p.name);
  const sku = String(enrich.pageSku || p.sku || "").trim();
  const categories = (p.categories || []).map((c) => ({
    id: c.id,
    slug: c.slug,
    name: decodeHtml(c.name),
  }));
  const leaf =
    categories.find((c) => c.slug !== "thermobox" && SUBCAT_LABEL[c.slug]) || categories[0];
  const subcatSlug = leaf?.slug || "thermobox";
  const pdfHit = resolvePdfPrice({ slug: p.slug, sku, name }, pdf);

  return {
    id: p.id,
    slug: p.slug,
    name,
    sku: sku || (pdfHit?.model ?? ""),
    pdf_hit: pdfHit,
    attributes: enrich.attrs || [],
    image_url: p.images?.[0]?.src || "",
    categories,
    subcat_slug: subcatSlug,
    subcat_label: SUBCAT_LABEL[subcatSlug] || decodeHtml(leaf?.name || "Thermobox"),
    url: p.permalink || `${HOST}/urun/${p.slug}/`,
    fetched_at: new Date().toISOString().slice(0, 10),
  };
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

function imageFileName(row, product) {
  const code = String(row.sku || row.model || product.slug).trim();
  const ext = path.extname(new URL(product.image_url).pathname) || ".jpg";
  return `yuksel-${slugFile(code || product.slug)}_1${ext.replace(/jpeg/i, ".jpg")}`;
}

function rowSlug(row) {
  return row.yukselendustriyel_slug || row.yukselsatis_slug || "";
}

function findExistingRow(rows, p) {
  const importId = `yukselendustriyel__${p.slug}`;
  let hit = rows.find((r) => r.id === importId);
  if (hit) return hit;
  hit = rows.find((r) => rowSlug(r) === p.slug);
  if (hit) return hit;
  if (p.sku) {
    hit = rows.find((r) => normHay(r.sku || r.model || "") === normHay(p.sku));
    if (hit) return hit;
  }
  return rows.find(
    (r) =>
      isAvathermRow(r) &&
      normHay(r.name || "") === normHay(p.name) &&
      r.dept === "tasima",
  );
}

function buildNewRow(p, imageRel, pdfHit) {
  const row = {
    id: `yukselendustriyel__${p.slug}`,
    dept: "tasima",
    category: "tasima-ekipmanlari-yemek-tasima-kaplari",
    brand: "Yüksel Endüstriyel",
    name: p.name,
    specs: [
      p.name,
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
    aciklama: p.name,
    sku: pdfHit?.model || p.sku || p.slug,
    model: p.sku || pdfHit?.model || "",
    images: imageRel ? [imageRel] : [],
    kaynak_fiyat_listesi: "yukselendustriyel-web",
    yukselendustriyel_url: p.url,
    yukselendustriyel_slug: p.slug,
    yukselendustriyel_image_source: imageRel ? "yukselendustriyel-web" : undefined,
    alt_kategori_1: p.subcat_label,
    urun_kategori: "Taşıma",
    urun_alt_kategori: "Yemek Taşıma Kapları",
    kategori_yolu: ["Taşıma", "Thermobox", p.subcat_label],
    keywords: ["Yüksel Endüstriyel", "Avatherm", p.name, p.subcat_label].filter(Boolean),
  };
  applyAvathermTasimaMeta(row, p.subcat_slug);
  if (pdfHit) applyPrice(row, pdfHit);
  else {
    row.price = "Teklif için iletişim";
    row.fiyat_bekleniyor = true;
  }
  return row;
}

function enrichExistingRow(row, p, imageRel, pdfHit) {
  applyAvathermTasimaMeta(row, p.subcat_slug);
  row.brand = "Yüksel Endüstriyel";
  row.alt_kategori_1 = p.subcat_label;
  row.yukselendustriyel_url = p.url;
  row.yukselendustriyel_slug = p.slug;
  if (imageRel) {
    row.images = [imageRel];
    row.yukselendustriyel_image_source = "yukselendustriyel-web";
  }
  if (pdfHit) applyPrice(row, pdfHit);
  if (!row.kategori_yolu?.length) {
    row.kategori_yolu = ["Taşıma", "Thermobox", p.subcat_label];
  }
}

async function stepFetch() {
  ensurePdfPrices();
  const pdf = loadPdfPrices();
  console.log("[yukselendustriyel-thermobox] Thermobox çekiliyor…");
  const raw = await fetchThermoboxProducts();
  console.log(`[yukselendustriyel-thermobox] ${raw.length} ürün — sayfa detayları…`);
  const products = [];
  let n = 0;
  for (const p of raw) {
    n++;
    const enrich = await parseProductPage(p.slug);
    products.push(normalizeProduct(p, enrich, pdf));
    if (n % 10 === 0) console.log(`  ${n}/${raw.length}`);
    await sleep(100);
  }
  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(products, null, 2), "utf8");
  console.log(`[yukselendustriyel-thermobox] kaydedildi → ${path.relative(ROOT, OUT_JSON)}`);
  return products;
}

async function stepApply(products) {
  ensurePdfPrices();
  const pdf = loadPdfPrices();
  if (!products?.length) {
    products = JSON.parse(fs.readFileSync(OUT_JSON, "utf8"));
  }
  const rows = JSON.parse(fs.readFileSync(TASIMA_JSON, "utf8"));
  let updated = 0;
  let added = 0;
  let imagesOk = 0;
  let priced = 0;
  const missed = [];

  for (const p of products) {
    const pdfHit = p.pdf_hit || resolvePdfPrice(p, pdf);
    let imageRel = "";
    if (p.image_url) {
      const fname = imageFileName({ sku: p.sku, model: p.pdf_hit?.model }, p);
      imageRel = `${IMG_REL}/${fname}`.replace(/\\/g, "/");
      const ok = await downloadImage(p.image_url, path.join(ROOT, "public", imageRel));
      if (ok || fs.existsSync(path.join(ROOT, "public", imageRel))) imagesOk++;
    }

    const existing = findExistingRow(rows, p);
    if (existing) {
      enrichExistingRow(existing, p, imageRel, pdfHit);
      updated++;
      if (pdfHit) priced++;
      else missed.push(p.name);
      continue;
    }

    const newRow = buildNewRow(p, imageRel, pdfHit);
    rows.push(newRow);
    added++;
    if (pdfHit) priced++;
    else missed.push(p.name);
    console.log(`[yukselendustriyel-thermobox] +yeni: ${newRow.sku || p.slug} — ${p.name.slice(0, 50)}`);
  }

  fs.writeFileSync(TASIMA_JSON, JSON.stringify(dedupeThermoboxRows(rows)), "utf8");
  const rebuild = spawnSync(process.execPath, ["scripts/rebuild-ekipmanlar-from-dept.mjs"], {
    cwd: ROOT,
    stdio: "inherit",
  });
  if (rebuild.status !== 0) process.exit(rebuild.status || 1);

  console.log(
    `[yukselendustriyel-thermobox] güncellendi: ${updated}, +${added}, görsel: ${imagesOk}, fiyat: ${priced}/${products.length}`,
  );
  if (missed.length) {
    console.log("[yukselendustriyel-thermobox] fiyatsız:");
    for (const n of missed) console.log("  -", n);
  }
}

function stepPrices() {
  ensurePdfPrices();
  const pdf = loadPdfPrices();
  const rows = JSON.parse(fs.readFileSync(TASIMA_JSON, "utf8"));
  let applied = 0;
  const missed = [];

  for (const row of rows) {
    if (!isAvathermRow(row)) continue;
    const hit = resolveRowPrice(row, pdf);
    if (!hit) {
      missed.push(row.name);
      continue;
    }
    applyPrice(row, hit);
    applied++;
  }

  fs.writeFileSync(TASIMA_JSON, JSON.stringify(dedupeThermoboxRows(rows)), "utf8");
  const rebuild = spawnSync(process.execPath, ["scripts/rebuild-ekipmanlar-from-dept.mjs"], {
    cwd: ROOT,
    stdio: "inherit",
  });
  if (rebuild.status !== 0) process.exit(rebuild.status || 1);

  console.log(`[yukselendustriyel-thermobox] fiyat: ${applied} uygulandı, EUR→TRY ${EUR_TRY}`);
  if (missed.length) {
    console.log("[yukselendustriyel-thermobox] fiyatsız:");
    for (const n of missed) console.log("  -", n);
  }
}

let products = null;
if (doFetch) products = await stepFetch();
if (doApply) await stepApply(products);
if (doPrices) stepPrices();

console.log("[yukselendustriyel-thermobox] tamam");
