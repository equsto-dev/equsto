#!/usr/bin/env node
/**
 * yukselsatis.com → katalog JSON + görseller + fiyat karşılaştırma
 *
 *   node scripts/sync-yukselsatis-catalog.mjs
 *   node scripts/sync-yukselsatis-catalog.mjs --fetch-only
 *   node scripts/sync-yukselsatis-catalog.mjs --apply-only
 *   node scripts/sync-yukselsatis-catalog.mjs --import-only
 *   node scripts/sync-yukselsatis-catalog.mjs --report-only
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { fetchTcmbEurRate } from "./fetch-tcmb-kur.mjs";
import { avathermTasimaCategory, AVATHERM_BRAND } from "./lib/avatherm-tasima.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const HOST = "https://yukselsatis.com";
const UA = "Mozilla/5.0 (Equsto; +https://equsto.com)";
const PER_PAGE = 100;
const MIN_IMG = 4000;
const ISKONTO = Number(process.env.EQUSTO_YUKSEL_ISKONTO || "0.55");
const NET_MULT = 1 - ISKONTO;
const KDV = Number(process.env.EQUSTO_KDV_ORAN || "20");

const OUT_JSON = path.join(ROOT, "scripts/data/yukselsatis-catalog.json");
const OUT_PRICES = path.join(ROOT, "public/data/fiyat-listeleri/yuksel/yukselsatis/fiyatlar.json");
const OUT_REPORT_SITE = path.join(ROOT, "scripts/data/yukselsatis-rapor.md");
const OUT_REPORT_PFOS = path.join(ROOT, "../../PFOS/veri/yukselsatis-rapor.md");
const YUKSEL_PDF = path.join(ROOT, "public/data/fiyat-listeleri/yuksel/2025-yerli/tum-urunler.json");
const IMG_DIR = path.join(ROOT, "public/images/catalog/yuksel/web");
const IMG_REL = "images/catalog/yuksel/web";
const DEPT_DIR = path.join(ROOT, "public/data/dept");

const args = new Set(process.argv.slice(2));
const doFetch =
  args.has("--fetch-only") ||
  (!args.has("--apply-only") && !args.has("--import-only") && !args.has("--report-only"));
const doImport =
  args.has("--import-only") ||
  args.has("--apply-only") ||
  (!args.has("--fetch-only") && !args.has("--report-only"));
const doApply =
  args.has("--apply-only") ||
  (!args.has("--fetch-only") && !args.has("--import-only") && !args.has("--report-only"));
const doReport = args.has("--report-only") || (!args.has("--fetch-only") && !args.has("--import-only"));

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

function priceTryFromStore(prices) {
  const minor = Number(prices?.price || 0);
  if (!minor) return null;
  return Math.round(minor) / Math.pow(10, Number(prices?.currency_minor_unit ?? 2));
}

function priceFromEuro(listEur) {
  const netEur = Math.round(listEur * NET_MULT * 100) / 100;
  const netTry = netEur * EUR_TRY;
  const kdvDahil = netTry * (1 + KDV / 100);
  return { netTry: Math.round(netTry), kdvDahil: Math.round(kdvDahil * 100) / 100, netEur };
}

function dimensionKeys(text) {
  const keys = new Set();
  for (const m of String(text || "").matchAll(/(\d{2,3})\s*[xX×]\s*(\d{2,3})\s*[xX×]\s*(\d{2,4})/g)) {
    keys.add(`${m[1]}X${m[2]}X${m[3]}`);
    keys.add(`${m[1]}-${m[2]}-${m[3]}`);
    keys.add(normHay(`${m[1]}X${m[2]}X${m[3]}`));
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

  if (sku) {
    add(sku);
    if (/^TM/i.test(sku)) add(sku.replace(/^TM/i, ""));
  }

  for (const d of dimensionKeys(text)) add(d);

  for (const m of text.matchAll(/\b(M0?\d{4,6}[A-Z]?)\b/g)) add(m[1]);
  for (const m of text.matchAll(/\b(M[A-Z]?\d{3,5}[A-Z]?)\b/g)) add(m[1]);
  for (const m of text.matchAll(
    /\b((?:TT|DT|DTT|PZA|PZAD|PZAC|PZAG|SBM|SBT|SBH|SBB|TTEV|CA|CAM|BAR|ST|SLM|MSB|ASB)[-./]?[A-Z0-9./-]{2,18})\b/g,
  )) {
    add(m[1].replace(/\./g, "-"));
  }
  for (const m of text.matchAll(/\b(1280[A-Z]{0,3})\b/g)) add(m[1]);

  return [...keys];
}

function nameTokens(s) {
  return decodeHtml(s)
    .toLocaleLowerCase("tr")
    .replace(/[^a-z0-9ğüşıöç\s]/gi, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !/portabianco|yuksel|endustriyel|mutfak/.test(w));
}

function nameScore(a, b) {
  const ta = new Set(nameTokens(a));
  const tb = new Set(nameTokens(b));
  if (!ta.size || !tb.size) return 0;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  return inter / Math.max(ta.size, tb.size);
}

async function parseProductPage(slug) {
  try {
    const html = await fetch(`${HOST}/${slug}/`, {
      headers: { "User-Agent": UA, "Accept-Language": "tr-TR,tr;q=0.9" },
      signal: AbortSignal.timeout(45000),
    }).then((r) => (r.ok ? r.text() : ""));
    if (!html) return { attrs: [], extra: "" };

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
    return { attrs: [], extra: "" };
  }
}

async function enrichProducts(products, limit = 0) {
  const slice = limit > 0 ? products.slice(0, limit) : products;
  let n = 0;
  for (const p of slice) {
    n++;
    if (n % 25 === 0) console.log(`[yukselsatis] sayfa detay ${n}/${slice.length}`);
    const { attrs, extra, pageSku } = await parseProductPage(p.slug);
    p.attributes = attrs;
    if (pageSku && !p.sku) p.sku = pageSku;
    p.model_keys = extractModelKeys(p.name, p.sku, extra);
    p.dimension_keys = dimensionKeys(extra);
    await sleep(120);
  }
  return products;
}

const DEPT_GROUPS = [
  {
    label: "Soğutma ekipmanları",
    test: /buz-dolap|tezgah-tipi|dik-tip|pizza|bar-tipi|barista|make-up|soguk-serv|teshir|cihaz-alt|ada-tipi|monoblok|evyeli|slim|mix-buz|steril-dolap|buzdolabi-opsiyon|kampanyali-urunler.*buz/i,
  },
  {
    label: "Yıkama ekipmanları",
    test: /bulasik-makin|yer-gider/i,
  },
  {
    label: "Taşıma ekipmanları",
    test: /servis-araba|camasir-araba|banket-araba|tasima-ve-muhafaza|tepsi-modelleri|trolley|thermobox|pasta-tasima|tabak-otomat|mutfak-bulasik|tepsi-tasima|avatherm/i,
  },
  {
    label: "İstif / raf sistemleri",
    test: /tek-raflar|takim-raflar|tel-raf|raf-ayak|raf-ilave|perfore-raf|duz-raf|inox-plastik|boyali-plastik|tel-izgaralar/i,
  },
  {
    label: "Davlumbaz",
    test: /davlumbaz-filtre|davlumbaz/i,
  },
  {
    label: "Kahve / içecek (ithal)",
    test: /kahve-makin|bar-blender|robot-coupe|gida-dilimleme|celme/i,
  },
  {
    label: "Catering / Fast food / Medical",
    test: /catering|fast-food|medical-modeller/i,
  },
  {
    label: "Yedek parça / aksesuar",
    test: /yedek-parca|yardimci-ekipman|elektrik-malzeme|lastik-plastik|ithal-urunler|kampanyali/i,
  },
];

function deptGroupFor(categories) {
  const slugs = (categories || []).map((c) => c.slug || "").join(" ");
  for (const g of DEPT_GROUPS) {
    if (g.test.test(slugs)) return g.label;
  }
  return "Diğer";
}

async function fetchAllProducts() {
  const out = [];
  let page = 1;
  while (true) {
    const url = `${HOST}/wp-json/wc/store/v1/products?per_page=${PER_PAGE}&page=${page}`;
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      signal: AbortSignal.timeout(120000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
    const json = await res.json();
    if (!Array.isArray(json) || !json.length) break;
    out.push(...json);
    const totalPages = Number(res.headers.get("X-WP-TotalPages") || 1);
    console.log(`[yukselsatis] sayfa ${page}/${totalPages} (+${json.length})`);
    if (page >= totalPages) break;
    page++;
    await sleep(250);
  }
  return out;
}

function normalizeProduct(p) {
  const name = decodeHtml(p.name);
  const sku = String(p.sku || "").trim();
  const priceTry = priceTryFromStore(p.prices);
  const imageUrl = p.images?.[0]?.src || "";
  const modelKeys = extractModelKeys(name, sku);
  const categories = (p.categories || []).map((c) => ({
    id: c.id,
    slug: c.slug,
    name: decodeHtml(c.name),
  }));

  return {
    id: p.id,
    slug: p.slug,
    name,
    sku,
    model_keys: modelKeys,
    dimension_keys: dimensionKeys(name),
    attributes: [],
    price_try: priceTry,
    price_html: p.price_html || "",
    currency: p.prices?.currency_code || "TRY",
    image_url: imageUrl,
    images: (p.images || []).map((i) => i.src).filter(Boolean),
    categories,
    dept_group: deptGroupFor(categories),
    url: p.permalink || `${HOST}/${p.slug}/`,
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

function buildProductIndex(products) {
  const byKey = new Map();
  const byName = products;
  for (const p of products) {
    for (const k of p.model_keys) {
      if (!byKey.has(k)) byKey.set(k, p);
    }
    for (const d of p.dimension_keys || []) {
      if (!byKey.has(normHay(d))) byKey.set(normHay(d), p);
    }
    if (p.sku) byKey.set(normHay(p.sku), p);
    byKey.set(normHay(p.slug), p);
  }
  return { byKey, byName };
}

function catalogDimensionKeys(row) {
  const keys = [];
  const sku = String(row.sku || row.model || "");
  keys.push(...dimensionKeys(sku));
  keys.push(...dimensionKeys(String(row.specs || "")));
  keys.push(...dimensionKeys(String(row.olculer_net_mm || row.olculer?.genislik_mm || "")));
  return keys.map((k) => normHay(k));
}

function findWebProduct(row, index) {
  const sku = String(row.sku || row.model || "").trim();
  const keys = extractModelKeys(row.name || "", sku);
  keys.unshift(normHay(sku));
  for (const d of catalogDimensionKeys(row)) keys.push(d);

  for (const k of keys) {
    if (index.byKey.has(k)) return { product: index.byKey.get(k), via: k, method: "key" };
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

function isYukselCatalogRow(row) {
  const kaynak = String(row.kaynak_fiyat_listesi || row.kaynak || "");
  const brand = String(row.brand || "");
  return (
    kaynak.includes("yuksel") ||
    /yuksel endustriyel|portabianco/i.test(brand) ||
    String(row.id || "").startsWith("yuksel-endustriyel") ||
    String(row.id || "").startsWith("yukselsatis__")
  );
}

const YEDEK_SLUG_RE =
  /yedek-parca|opsiyon-ilave|elektrik-malzeme|lastik-plastik|avatherm-yedek|yardimci-ekipmanlar/i;

function isYedekParca(p) {
  if (/yedek\s*par[çc]a/i.test(p.name || "")) return true;
  const slugs = (p.categories || []).map((c) => c.slug || "").join(" ");
  if (YEDEK_SLUG_RE.test(slugs)) return true;
  if (p.dept_group === "Yedek parça / aksesuar") return true;
  return false;
}

const WEB_DEPT_MAP = {
  "Soğutma ekipmanları": { dept: "sogutma", category: "sogutma-ekipmanlari" },
  "Yıkama ekipmanları": { dept: "yikama", category: "bulasik-makineleri" },
  "Taşıma ekipmanları": { dept: "tasima", category: "servis-arabalar" },
  "İstif / raf sistemleri": { dept: "istif", category: "istif-raflari" },
  Davlumbaz: { dept: "davlumbaz", category: "davlumbaz" },
  "Kahve / içecek (ithal)": { dept: "icecek", category: "bar-blender" },
  "Catering / Fast food / Medical": { dept: "servis", category: "catering-ekipmanlari" },
  Diğer: { dept: "istif", category: "istif-raflari" },
};

function mapWebDept(p) {
  const slugs = (p.categories || []).map((c) => c.slug || "").join(" ");
  if (/robot-coupe|gida-dilimleme|celme/.test(slugs)) {
    return { dept: "hazirlik", category: "robot-coupe" };
  }
  if (/bar-blender/.test(slugs)) return { dept: "icecek", category: "bar-blender" };
  if (/kahve-makin/.test(slugs)) return { dept: "kahve", category: "kahve-makineleri" };
  if (/bulasik-makin|yer-gider/.test(slugs)) {
    return { dept: "yikama", category: "bulasik-makineleri" };
  }
  if (/davlumbaz/.test(slugs)) return { dept: "davlumbaz", category: "davlumbaz" };
  if (/servis-araba|tasima|tepsi|trolley|thermobox|camasir|avatherm-tepsi/.test(slugs)) {
    if (/tepsi-tasima-araba/.test(slugs)) {
      return { dept: "tasima", category: "servis-arabalar" };
    }
    if (/thermobox|tepsi-modelleri|pasta-tasima/.test(slugs)) {
      return { dept: "tasima", category: "tasima-ekipmanlari-yemek-tasima-kaplari" };
    }
    return { dept: "tasima", category: "servis-arabalar" };
  }
  if (/avatherm|^av\d{2}/i.test(p.name || "") || /^avatherm-|^av\d/i.test(p.sku || "")) {
    return { dept: "tasima", category: avathermTasimaCategory(p.name) };
  }

  const base = WEB_DEPT_MAP[p.dept_group] || { dept: "istif", category: "istif-raflari" };
  const primary = p.categories?.[0]?.slug || "";
  if (primary && !/uncategorized|kampanyali|ithal-urunler$/i.test(primary)) {
    return { ...base, category: primary };
  }
  return base;
}

function brandForWeb(p, deptFile) {
  if (/portabianco/i.test(p.name || "") || deptFile === "sogutma" || deptFile === "yikama") {
    return "PORTABIANCO";
  }
  if (
    deptFile === "tasima" &&
    (/avatherm|^av\d{2}/i.test(p.name || "") || /^avatherm-|^av\d/i.test(p.sku || ""))
  ) {
    return AVATHERM_BRAND;
  }
  return "Yüksel Endüstriyel";
}

function buildCatalogLookup() {
  const byKey = new Map();
  const byId = new Map();
  const bySlug = new Map();
  const allRows = [];

  for (const file of fs.readdirSync(DEPT_DIR)) {
    if (!file.endsWith(".json")) continue;
    const rows = JSON.parse(fs.readFileSync(path.join(DEPT_DIR, file), "utf8"));
    for (const row of rows) {
      allRows.push(row);
      if (row.id) byId.set(row.id, row);
      if (row.yukselsatis_slug) bySlug.set(row.yukselsatis_slug, row);
      for (const k of extractModelKeys(row.name || "", row.sku || row.model || "")) {
        if (k.length >= 4 && !byKey.has(k)) byKey.set(k, row);
      }
      const sku = normHay(row.sku || row.model || "");
      if (sku.length >= 3) byKey.set(sku, row);
    }
  }
  return { byKey, byId, bySlug, allRows };
}

function findExistingCatalogRow(p, lookup) {
  const importId = `yukselsatis__${p.slug}`;
  if (lookup.byId.has(importId)) return lookup.byId.get(importId);
  if (lookup.bySlug.has(p.slug)) return lookup.bySlug.get(p.slug);

  for (const k of p.model_keys || []) {
    if (k.length >= 4 && lookup.byKey.has(k)) return lookup.byKey.get(k);
  }
  if (p.sku) {
    const sku = normHay(p.sku);
    if (sku.length >= 3 && lookup.byKey.has(sku)) return lookup.byKey.get(sku);
  }

  let best = null;
  for (const row of lookup.allRows) {
    if (!isYukselCatalogRow(row) && !row.yukselsatis_url) continue;
    const score = nameScore(p.name, row.name || "");
    if (score >= 0.82 && (!best || score > best.score)) {
      best = { row, score };
    }
  }
  return best?.row || null;
}

function buildImportRow(p, imageRel, { dept, category }, brand) {
  const sku = String(p.sku || p.slug.slice(0, 48)).trim();
  const specs = [
    p.name,
    "",
    "Kaynak: yukselsatis.com",
    p.url,
    p.attributes?.length
      ? "\n" + p.attributes.map((a) => `${a.label}: ${a.value}`).join("\n")
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    id: `yukselsatis__${p.slug}`,
    dept,
    category,
    brand,
    name: p.name,
    price: "Teklif için iletişim",
    fiyat_bekleniyor: true,
    specs,
    aciklama: p.name,
    sku,
    model: p.sku || "",
    images: imageRel ? [imageRel] : [],
    kaynak_fiyat_listesi: "yukselsatis-web",
    yukselsatis_url: p.url,
    yukselsatis_slug: p.slug,
    yukselsatis_image_source: imageRel ? "yukselsatis-web" : undefined,
    keywords: [brand, sku, p.name].filter(Boolean),
  };
}

async function stepImportLive(products) {
  if (!products?.length) {
    products = JSON.parse(fs.readFileSync(OUT_JSON, "utf8"));
  }
  if (!products[0]?.attributes?.length && !products[0]?.dimension_keys?.length) {
    console.log("[yukselsatis] import: eksik detay — sayfa zenginleştirme…");
    products = await enrichProducts(products);
    fs.writeFileSync(OUT_JSON, JSON.stringify(products, null, 2), "utf8");
  }

  const lookup = buildCatalogLookup();
  const toAdd = new Map();
  let skippedYedek = 0;
  let skippedDup = 0;

  for (const p of products) {
    if (isYedekParca(p)) {
      skippedYedek++;
      continue;
    }
    if (findExistingCatalogRow(p, lookup)) {
      skippedDup++;
      continue;
    }

    const mapped = mapWebDept(p);
    const brand = brandForWeb(p, mapped.dept);
    let imageRel = "";

    if (p.image_url) {
      const ext = path.extname(new URL(p.image_url).pathname) || ".jpg";
      const fname = `yuksel-${slugFile(p.sku || p.slug)}_1${ext.replace(/jpeg/i, ".jpg")}`;
      imageRel = `${IMG_REL}/${fname}`.replace(/\\/g, "/");
      await downloadImage(p.image_url, path.join(ROOT, "public", imageRel));
    }

    const row = buildImportRow(p, imageRel, mapped, brand);
    if (!toAdd.has(mapped.dept)) toAdd.set(mapped.dept, []);
    toAdd.get(mapped.dept).push(row);
  }

  let added = 0;
  for (const [dept, rows] of toAdd) {
    const fp = path.join(DEPT_DIR, `${dept}.json`);
    const existing = fs.existsSync(fp) ? JSON.parse(fs.readFileSync(fp, "utf8")) : [];
    existing.push(...rows);
    fs.writeFileSync(fp, JSON.stringify(existing), "utf8");
    added += rows.length;
    console.log(`[yukselsatis] import ${dept}.json: +${rows.length}`);
  }

  if (added) {
    const rebuild = spawnSync(process.execPath, ["scripts/rebuild-ekipmanlar-from-dept.mjs"], {
      cwd: ROOT,
      stdio: "inherit",
    });
    if (rebuild.status !== 0) process.exit(rebuild.status || 1);
  }

  console.log(
    `[yukselsatis] canlı import: +${added} yeni, ${skippedDup} zaten katalogda, ${skippedYedek} yedek parça atlandı`,
  );
  return { added, skippedDup, skippedYedek };
}

async function stepFetch() {
  console.log("[yukselsatis] ürünler çekiliyor…");
  const raw = await fetchAllProducts();
  let products = raw.map(normalizeProduct);
  console.log("[yukselsatis] ürün sayfalarından ölçü/SKU zenginleştirme…");
  products = await enrichProducts(products);
  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(products, null, 2), "utf8");
  console.log(`[yukselsatis] kaydedildi: ${products.length} ürün → ${path.relative(ROOT, OUT_JSON)}`);
  return products;
}

async function stepApply(products) {
  if (!products?.length) {
    products = JSON.parse(fs.readFileSync(OUT_JSON, "utf8"));
  }
  if (!products[0]?.attributes?.length && !products[0]?.dimension_keys?.length) {
    console.log("[yukselsatis] eksik detay — sayfa zenginleştirme…");
    products = await enrichProducts(products);
    fs.writeFileSync(OUT_JSON, JSON.stringify(products, null, 2), "utf8");
  }
  const index = buildProductIndex(products);
  const deptFiles = fs.readdirSync(DEPT_DIR).filter((f) => f.endsWith(".json"));
  let matched = 0;
  let imagesOk = 0;
  let skipped = 0;

  for (const file of deptFiles) {
    const fp = path.join(DEPT_DIR, file);
    const rows = JSON.parse(fs.readFileSync(fp, "utf8"));
    let changed = false;

    for (const row of rows) {
      if (!isYukselCatalogRow(row)) continue;
      const hit = findWebProduct(row, index);
      if (!hit?.product?.image_url) {
        skipped++;
        continue;
      }

      const sku = String(row.sku || row.model || hit.product.slug).trim();
      const ext = path.extname(new URL(hit.product.image_url).pathname) || ".jpg";
      const fname = `yuksel-${slugFile(sku || hit.product.slug)}_1${ext.replace(/jpeg/i, ".jpg")}`;
      const rel = `${IMG_REL}/${fname}`.replace(/\\/g, "/");
      const abs = path.join(ROOT, "public", rel);

      const ok = await downloadImage(hit.product.image_url, abs);
      if (!ok && !fs.existsSync(abs)) continue;

      row.images = [rel];
      row.yukselsatis_url = hit.product.url;
      row.yukselsatis_image_source = "yukselsatis-web";
      row.yukselsatis_match_via = hit.method + (hit.via ? `:${hit.via}` : "");
      matched++;
      if (ok || fs.existsSync(abs)) imagesOk++;
      changed = true;
    }

    if (changed) fs.writeFileSync(fp, JSON.stringify(rows), "utf8");
  }

  const rebuild = spawnSync(process.execPath, ["scripts/rebuild-ekipmanlar-from-dept.mjs"], {
    cwd: ROOT,
    stdio: "inherit",
  });
  if (rebuild.status !== 0) process.exit(rebuild.status || 1);

  console.log(`[yukselsatis] görsel uygulandı: ${matched} eşleşme, ${imagesOk} görsel, ${skipped} eşleşme yok`);
  return { matched, imagesOk, skipped };
}

function stepPrices(products) {
  if (!products?.length) {
    products = JSON.parse(fs.readFileSync(OUT_JSON, "utf8"));
  }
  const pdfRows = fs.existsSync(YUKSEL_PDF)
    ? JSON.parse(fs.readFileSync(YUKSEL_PDF, "utf8"))
    : [];
  const pdfByModel = new Map(
    pdfRows.map((r) => [normHay(r.model || r.sku), r]),
  );

  const ekip = JSON.parse(
    fs.readFileSync(path.join(ROOT, "public/data/ekipmanlar.json"), "utf8"),
  );
  const catalogByModel = new Map();
  for (const row of ekip) {
    if (!isYukselCatalogRow(row)) continue;
    const sku = normHay(row.sku || row.model);
    if (sku) catalogByModel.set(sku, row);
    for (const d of catalogDimensionKeys(row)) catalogByModel.set(d, row);
  }

  const index = buildProductIndex(products);
  const rows = [];

  for (const p of products) {
    const pdf = p.model_keys.map((k) => pdfByModel.get(k)).find(Boolean);
    let cat = p.model_keys.map((k) => catalogByModel.get(k)).find(Boolean);
    if (!cat) {
      for (const d of p.dimension_keys || []) {
        const c = catalogByModel.get(normHay(d));
        if (c) {
          cat = c;
          break;
        }
      }
    }
    const pdfCalc = pdf?.fiyat_euro > 0 ? priceFromEuro(Number(pdf.fiyat_euro)) : null;

    rows.push({
      slug: p.slug,
      name: p.name,
      sku_web: p.sku,
      model_keys: p.model_keys,
      dept_group: p.dept_group,
      categories: p.categories.map((c) => c.name),
      yukselsatis_price_try: p.price_try,
      yukselsatis_url: p.url,
      image_url: p.image_url,
      pdf_model: pdf?.model || null,
      pdf_liste_eur: pdf?.fiyat_euro || null,
      pdf_equsto_net_try: pdfCalc?.netTry || null,
      pdf_equsto_kdv_try: pdfCalc?.kdvDahil || null,
      catalog_sku: cat?.sku || null,
      catalog_fiyat_tl: cat?.fiyat_tl || null,
      catalog_dept: cat?.dept || null,
      price_delta_try:
        cat?.fiyat_tl && p.price_try ? Math.round(p.price_try - cat.fiyat_tl) : null,
    });
  }

  fs.mkdirSync(path.dirname(OUT_PRICES), { recursive: true });
  fs.writeFileSync(OUT_PRICES, JSON.stringify(rows, null, 2), "utf8");
  console.log(`[yukselsatis] fiyat karşılaştırma: ${rows.length} satır → ${path.relative(ROOT, OUT_PRICES)}`);
  return rows;
}

function stepReport(products, priceRows) {
  if (!products?.length) {
    products = JSON.parse(fs.readFileSync(OUT_JSON, "utf8"));
  }
  if (!priceRows?.length && fs.existsSync(OUT_PRICES)) {
    priceRows = JSON.parse(fs.readFileSync(OUT_PRICES, "utf8"));
  }

  const byGroup = new Map();
  for (const p of products) {
    if (!byGroup.has(p.dept_group)) byGroup.set(p.dept_group, []);
    byGroup.get(p.dept_group).push(p);
  }

  const catalogMatched = priceRows.filter((r) => r.catalog_sku).length;
  const pdfMatched = priceRows.filter((r) => r.pdf_model).length;
  const withSku = products.filter((p) => p.sku).length;
  const withDim = products.filter((p) => (p.dimension_keys || []).length).length;

  let imgApplied = 0;
  const imgByDept = {};
  if (fs.existsSync(path.join(ROOT, "public/data/dept"))) {
    for (const file of fs.readdirSync(path.join(DEPT_DIR))) {
      if (!file.endsWith(".json")) continue;
      const dept = file.replace(".json", "");
      const rows = JSON.parse(fs.readFileSync(path.join(DEPT_DIR, file), "utf8"));
      const n = rows.filter((r) => r.yukselsatis_image_source).length;
      if (n) imgByDept[dept] = n;
      imgApplied += n;
    }
  }

  let md = `# Yukselsatis.com katalog raporu\n\n`;
  md += `Tarih: ${new Date().toISOString().slice(0, 10)}  \n`;
  md += `Kaynak: [yukselsatis.com](https://yukselsatis.com/) WooCommerce Store API  \n`;
  md += `Kur (PDF karşılaştırma): 1 EUR = ${EUR_TRY} TRY, iskonto %${ISKONTO * 100}\n\n`;
  md += `## Özet\n\n`;
  md += `| Metrik | Değer |\n|--------|------:|\n`;
  md += `| Web ürün | ${products.length} |\n`;
  md += `| Web SKU dolu | ${withSku} |\n`;
  md += `| Web ölçü (sayfa attrs) | ${withDim} |\n`;
  md += `| **Görsel canlı uygulandı** | **${imgApplied}** |\n`;
  md += `| Equsto katalog fiyat eşleşmesi | ${catalogMatched} |\n`;
  md += `| PDF fiyat listesi eşleşmesi | ${pdfMatched} |\n\n`;

  if (Object.keys(imgByDept).length) {
    md += `### Görsel uygulanan departmanlar\n\n`;
    md += `| Dept dosyası | Ürün |\n|--------------|-----:|\n`;
    for (const [d, n] of Object.entries(imgByDept).sort((a, b) => b[1] - a[1])) {
      md += `| ${d} | ${n} |\n`;
    }
    md += `\n`;
  }

  md += `## Departman grupları\n\n`;
  const order = [
    "Soğutma ekipmanları",
    "Yıkama ekipmanları",
    "Taşıma ekipmanları",
    "İstif / raf sistemleri",
    "Davlumbaz",
    "Kahve / içecek (ithal)",
    "Catering / Fast food / Medical",
    "Yedek parça / aksesuar",
    "Diğer",
  ];

  for (const label of order) {
    const items = byGroup.get(label) || [];
    if (!items.length) continue;
    md += `### ${label} (${items.length})\n\n`;
    md += `| Ürün | Web SKU | Fiyat (TRY) | Katalog SKU | PDF EUR |\n`;
    md += `|------|---------|------------:|-------------|--------:|\n`;
    for (const p of items.slice(0, 40)) {
      const pr = priceRows.find((r) => r.slug === p.slug);
      const price = p.price_try ? `₺${p.price_try.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}` : "—";
      md += `| ${p.name.slice(0, 55).replace(/\|/g, "/")} | ${p.sku || "—"} | ${price} | ${pr?.catalog_sku || "—"} | ${pr?.pdf_liste_eur || "—"} |\n`;
    }
    if (items.length > 40) md += `\n_… +${items.length - 40} ürün daha_\n`;
    md += `\n`;
  }

  md += `## Dosyalar\n\n`;
  md += `- Ham web JSON: \`scripts/data/yukselsatis-catalog.json\`\n`;
  md += `- Fiyat karşılaştırma: \`public/data/fiyat-listeleri/yuksel/yukselsatis/fiyatlar.json\`\n`;
  md += `- Görseller: \`public/images/catalog/yuksel/web/\`\n\n`;
  md += `## Notlar\n\n`;
  md += `- Web fiyatları WooCommerce store API \`prices.price\` alanından (TRY, site gösterimi ile aynı).\n`;
  md += `- PDF karşılaştırma: YÜKSEL YERLİ 2025 liste EUR × ${NET_MULT} × kur (+KDV ayrı hesap).\n`;
  md += `- Canlı katalog fiyatları **değiştirilmedi**; yerel \`fiyatlar.json\` ile kontrol edin.\n`;
  md += `- Yeni web ürünleri \`yukselsatis-web\` kaynağıyla eklendi (fiyat: teklif).\n`;
  md += `- Yedek parça / opsiyon / elektrik kategorileri canlıya alınmadı.\n`;
  md += `- Görseller eşleşen Yuksel/Portabianco satırlarına uygulandı (ölçü/SKU veya isim benzerliği).\n`;
  md += `- Web’de model kodu (TT-2N70 vb.) yok; soğutma eşleşmeleri çoğunlukla isim benzerliği — kontrol edin.\n`;
  md += `- Portabianco soğutma için Cafemarkt görselleri korunmadı; yukselsatis görseli yazıldıysa öncelik web.\n`;

  fs.mkdirSync(path.dirname(OUT_REPORT_SITE), { recursive: true });
  fs.writeFileSync(OUT_REPORT_SITE, md, "utf8");
  try {
    fs.mkdirSync(path.dirname(OUT_REPORT_PFOS), { recursive: true });
    fs.writeFileSync(OUT_REPORT_PFOS, md, "utf8");
  } catch (_) {}

  console.log(`[yukselsatis] rapor: ${path.relative(ROOT, OUT_REPORT_SITE)}`);
  if (fs.existsSync(OUT_REPORT_PFOS)) {
    console.log(`[yukselsatis] rapor: ${OUT_REPORT_PFOS}`);
  }
  return md;
}

async function main() {
  let products = null;
  let priceRows = null;

  if (doFetch) products = await stepFetch();
  if (doImport) await stepImportLive(products);
  if (doApply) await stepApply(products);
  if (doReport || doFetch) priceRows = stepPrices(products);
  if (doReport) stepReport(products, priceRows);

  console.log("[yukselsatis] tamam");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
