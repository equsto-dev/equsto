/**
 * Urban Bar web katalog → Besos satır modeli (mağaza dept'e yazılmaz).
 */
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { slugify } from "./ozti-enrich.mjs";
import { fetchTcmbEurUsdRates } from "../fetch-tcmb-kur.mjs";
import { classifyUrbanBarBesos, loadUrbanBarBesosTaxonomy } from "./urbanbar-besos-taxonomy.mjs";
import { isUrbanBarAlcoholProduct } from "./urbanbar-alcohol-filter.mjs";

export const BRAND_DEFAULT = "Urban Bar";
export const BRAND_ID = "urban-bar";
export const KAYNAK = "urbanbar-web";

const TCMB_URL = "https://www.tcmb.gov.tr/kurlar/today.xml";
const UA = "EqustoImport/1.0 (+https://equsto.com; urbanbar-catalog)";

const SKIP_CAT = new Set(["new", "b2c-only", "b2c-bundle", "clearance"]);

const GLASS_TAGS = new Set([
  "glassware",
  "cocktail-glasses",
  "whisky-glasses",
  "gin-glasses",
  "gin-balloon",
  "wine-glasses",
  "beer-glasses",
  "shot-glasses",
  "sparkling-wine-champagne-glasses",
  "old-fashioned-tumblers",
  "highball-tumblers",
  "spirit-tasting-glasses",
  "water-glasses",
  "plastic-drinkware",
  "metal-drinkware",
  "gold-rim-glassware",
  "recycled-glassware",
  "glassware-collections",
]);

const BARWARE_TAGS = new Set([
  "barware",
  "cocktail-shakers",
  "cocktail-accessories",
  "cocktail-strainers",
  "jiggers-wine-measures",
  "bar-spoons",
  "mixing-glasses",
  "ice-tools-buckets-jugs",
  "bitter-bottles",
  "barware-collections",
  "personalised-barware",
  "japanese-barware",
  "calabrese-barware",
  "classico-barware",
]);

const SPIRIT_TAGS = new Set([
  "spirits",
  "gin",
  "whisky",
  "rum",
  "tequila",
  "cognac",
  "vermouth",
  "bitters-syrups-condiments",
  "cocktail-bitters",
  "english-sparkling-wines",
  "other-spirits-&-liqueurs",
]);

function foldEn(s) {
  return String(s || "").toLowerCase();
}

function primaryCatSlug(catTags) {
  const tags = (catTags || [])
    .map((t) => foldEn(t).replace(/^cat:/, ""))
    .filter((t) => t && !SKIP_CAT.has(t) && !t.startsWith("b2b-"));
  if (!tags.length) {
    const b2b = (catTags || []).map((t) => foldEn(t).replace(/^cat:/, "")).find((t) => t.startsWith("b2b-"));
    if (b2b) return slugify(b2b.replace(/^b2b-/, ""));
  }
  const preferred = tags.find((t) => GLASS_TAGS.has(t) || BARWARE_TAGS.has(t) || SPIRIT_TAGS.has(t));
  return slugify(preferred || tags[0] || "urbanbar-diger");
}

function mapDeptCategory(p) {
  const tags = (p.catTags || []).map((t) => foldEn(t));
  const hay = `${tags.join(" ")} ${p.collectionPath || ""} ${p.title || ""}`;
  const cat = primaryCatSlug(p.catTags);

  if (tags.some((t) => SPIRIT_TAGS.has(t)) || /spirit|liqueur|vermouth|bitters|syrup/.test(hay)) {
    return { dept: "icecek", category: cat || "urbanbar-spirits" };
  }
  if (tags.some((t) => BARWARE_TAGS.has(t)) || /shaker|jigger|bar-spoon|strainer|barware|mixing-glass/.test(hay)) {
    return { dept: "servis", category: cat || "urbanbar-barware" };
  }
  if (tags.some((t) => GLASS_TAGS.has(t)) || /glass|coupe|tumbler|balloon|champagne|wine-glass/.test(hay)) {
    return { dept: "servis", category: cat || "urbanbar-glassware" };
  }
  if (/gift|gifting/.test(hay)) return { dept: "servis", category: cat || "urbanbar-gifting" };
  if (/clothing|book/.test(hay)) return { dept: "servis", category: cat || "urbanbar-accessories" };
  return { dept: "servis", category: cat || "urbanbar-diger" };
}

export async function fetchTcmbGbpTry() {
  const fallback = Number(process.env.EQUSTO_GBP_TRY_FALLBACK || "68");
  try {
    const res = await fetch(TCMB_URL, { headers: { "User-Agent": UA } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    const block = xml.match(/<Currency[^>]*\bKod="GBP"[^>]*>([\s\S]*?)<\/Currency>/i);
    const selling = block?.[1]?.match(/<BanknoteSelling>([\d.]+)<\/BanknoteSelling>/i)?.[1];
    const gbp = Number(selling);
    if (!Number.isFinite(gbp) || gbp <= 0) throw new Error("GBP parse");
    return gbp;
  } catch (e) {
    console.warn("[urbanbar-rows] GBP fallback:", e?.message || e);
    return fallback;
  }
}

function pricingFromGbp(gbpInclVat, gbpTry, eurTry, satisOran) {
  if (!gbpInclVat || gbpInclVat <= 0) return null;
  const listeGbp = Math.round(gbpInclVat * 100) / 100;
  const satisGbp = Math.round(listeGbp * satisOran * 100) / 100;
  const listeEur = Math.round(((listeGbp * gbpTry) / eurTry) * 100) / 100;
  const satisEur = Math.round(((satisGbp * gbpTry) / eurTry) * 100) / 100;
  const fiyatTl = Math.round(satisGbp * gbpTry);
  return {
    price: `₺${fiyatTl.toLocaleString("tr-TR")} KDV dahil`,
    fiyat_tl: fiyatTl,
    liste_fiyati_gbp: listeGbp,
    satis_fiyati_gbp: satisGbp,
    liste_fiyati_eur: listeEur,
    satis_fiyati_eur: satisEur,
    kur_gbp_try: gbpTry,
    kur_eur_try: eurTry,
    satis_oran: satisOran,
    fiyat_kaynak: "urbanbar.com-gbp",
  };
}

function variantTitle(productTitle, variant) {
  const opt = [variant.option1, variant.option2, variant.option3]
    .filter((o) => o && o !== "Default Title")
    .join(" / ");
  return opt ? `${productTitle} — ${opt}` : productTitle;
}

function formatSpecs(p, variant, px, mapped) {
  const lines = [
    variantTitle(p.title, variant),
    "",
    p.description || "",
    "",
    `SKU: ${variant.sku || "—"}`,
    `Marka / Tedarikçi: ${p.vendor || BRAND_DEFAULT}`,
    `Kategori: ${p.collectionPath || mapped.category}`,
  ];
  if (p.catTags?.length) lines.push(`Etiketler: ${p.catTags.join(", ")}`);
  if (px) {
    lines.push(
      "",
      `Liste fiyatı (GBP, KDV dahil): £${px.liste_fiyati_gbp.toFixed(2)}`,
      `Equsto satış (GBP): £${px.satis_fiyati_gbp.toFixed(2)}`,
      `Equsto satış (TL, KDV dahil): ${px.price}`,
      `Kur: 1 GBP = ${px.kur_gbp_try} TRY, 1 EUR = ${px.kur_eur_try} TRY`,
    );
  } else {
    lines.push("", "Fiyat: sitede görüntülenemedi — teklif için iletişim");
  }
  lines.push("", `Kaynak ürün: urbanbar.com — ${p.url}`, `Marka: ${p.vendor || BRAND_DEFAULT}`);
  return lines.filter((l, i, arr) => !(l === "" && arr[i + 1] === "")).join("\n");
}

function rowId(p, variant) {
  const base = variant.sku ? slugify(variant.sku) : `${p.handle}-${variant.id}`;
  return `${BRAND_ID}__${base}`;
}

async function copyImages(p, root, outImg, dryRun) {
  const relPaths = [];
  const locals = p.localImages || [];
  if (locals.length) {
    for (const rel of locals) {
      const src = path.join(root, "scripts/data/urbanbar", rel);
      if (!fs.existsSync(src)) continue;
      const fname = path.basename(src);
      const dest = path.join(outImg, fname);
      if (!dryRun) {
        fs.mkdirSync(outImg, { recursive: true });
        fs.copyFileSync(src, dest);
      }
      relPaths.push(`images/catalog/urbanbar/${fname}`);
    }
  }
  if (relPaths.length) return relPaths;

  const imgUrl = p.images?.[0];
  if (!imgUrl) return [];
  let ext = path.extname(new URL(imgUrl).pathname) || ".jpg";
  if (!/^\.(jpe?g|png|webp|gif)$/i.test(ext)) ext = ".jpg";
  const safe = `urbanbar-${p.handle}${ext}`.replace(/[^\w.-]+/g, "-");
  const dest = path.join(outImg, safe);
  if (!dryRun) {
    try {
      const res = await fetch(imgUrl, { headers: { "User-Agent": UA } });
      if (!res.ok) return [];
      await fsp.mkdir(outImg, { recursive: true });
      await fsp.writeFile(dest, Buffer.from(await res.arrayBuffer()));
    } catch {
      return [];
    }
  }
  return [`images/catalog/urbanbar/${safe}`];
}

async function toRows(p, gbpTry, eurTry, opts) {
  const { root, outImg, dryRun, satisOran } = opts;
  const mapped = mapDeptCategory(p);
  const images = await copyImages(p, root, outImg, dryRun);
  const variants = p.variants?.length ? p.variants : [{ id: "default", sku: "", title: "Default Title", priceGbp: 0 }];
  const taxonomy = loadUrbanBarBesosTaxonomy();
  const besosHit = classifyUrbanBarBesos(
    { catTags: p.catTags, collections: p.collections?.map((c) => c.handle), title: p.title, name: p.title },
    taxonomy,
  );

  return variants.map((variant) => {
    const px = pricingFromGbp(variant.priceGbp, gbpTry, eurTry, satisOran);
    const brand = p.vendor && p.vendor !== "Urban Bar" ? `${BRAND_DEFAULT} / ${p.vendor}` : BRAND_DEFAULT;
    const name = variantTitle(p.title, variant);
    return {
      id: rowId(p, variant),
      dept: mapped.dept,
      category: mapped.category,
      brand,
      oem_brand: p.vendor || BRAND_DEFAULT,
      name,
      price: px?.price || "Teklif için iletişim",
      fiyat_bekleniyor: !px,
      specs: formatSpecs(p, variant, px, mapped),
      aciklama: p.description || name,
      teknik_ozellikler: [
        variant.sku ? `SKU: ${variant.sku}` : null,
        p.vendor ? `Tedarikçi: ${p.vendor}` : null,
        p.collectionPath ? `Koleksiyon: ${p.collectionPath}` : null,
        variant.grams ? `Ağırlık: ${variant.grams} g` : null,
      ].filter(Boolean),
      olculer: {},
      keywords: [BRAND_DEFAULT, p.vendor, variant.sku, mapped.category, ...p.catTags].filter(Boolean),
      images: images.length ? images : undefined,
      sku: variant.sku || undefined,
      model: variant.sku || p.handle,
      urun_kodu: variant.sku || p.handle,
      urbanbar_handle: p.handle,
      urbanbar_product_id: p.productId,
      urbanbar_variant_id: variant.id,
      kaynak: KAYNAK,
      kaynak_url: p.url,
      shopify_image: p.images?.[0] || undefined,
      urbanbar_cat_tags: p.catTags,
      urbanbar_collections: p.collections?.map((c) => c.handle),
      besos_section: besosHit.section || undefined,
      besos_group: besosHit.group || undefined,
      ...(px || {}),
      kaynak_fiyat_listesi: px ? "urbanbar.com" : undefined,
    };
  });
}

export function isUrbanBarRow(r) {
  return String(r?.kaynak || "") === KAYNAK || String(r?.id || "").startsWith(`${BRAND_ID}__`);
}

/** @param {{ root?: string, dryRun?: boolean, skipAlcohol?: boolean, copyImages?: boolean }} opts */
export async function buildUrbanBarRowsFromWeb(opts = {}) {
  const root = opts.root || path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
  const srcJson = path.join(root, "scripts/data/urbanbar/urbanbar-web-catalog.json");
  const outImg = path.join(root, "public/images/catalog/urbanbar");
  const dryRun = opts.copyImages === false ? true : Boolean(opts.dryRun);
  const skipAlcohol = opts.skipAlcohol !== false;
  const satisOran = Number(process.env.EQUSTO_URBANBAR_SATIS_ORAN || "2");

  if (!fs.existsSync(srcJson)) {
    throw new Error(`urbanbar-web-catalog.json yok — önce scrape: ${srcJson}`);
  }

  const raw = JSON.parse(await fsp.readFile(srcJson, "utf8"));
  const products = raw.products || [];
  const tcmb = await fetchTcmbEurUsdRates();
  const eurTry = Number(process.env.EQUSTO_EUR_TRY) > 0 ? Number(process.env.EQUSTO_EUR_TRY) : tcmb.eurTry;
  const gbpTry = await fetchTcmbGbpTry();

  const rows = [];
  let skippedAlcohol = 0;
  for (const p of products) {
    if (skipAlcohol && isUrbanBarAlcoholProduct(p)) {
      skippedAlcohol++;
      continue;
    }
    rows.push(...(await toRows(p, gbpTry, eurTry, { root, outImg, dryRun, satisOran })));
  }

  return { rows, skippedAlcohol, gbpTry, eurTry, productCount: products.length };
}
