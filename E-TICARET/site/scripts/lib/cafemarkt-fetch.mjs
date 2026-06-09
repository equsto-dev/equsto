/**
 * Cafemarkt marka listesi + ürün detay (JSON-LD).
 */
import fs from "node:fs";
import path from "node:path";

export const CAFE_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Equsto";

export const BRAND_SLUGS = {
  Animo: "animo",
  Santos: "santos",
  Faema: "faema",
  "Dito Sama": "dito-sama",
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export function normCode(s) {
  return String(s || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

export function parseItemList(html) {
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/gi)];
  for (const m of blocks) {
    try {
      const data = JSON.parse(m[1]);
      const list = data.itemListElement;
      if (!Array.isArray(list) || !list.length) continue;
      const first = list[0]?.item || list[0];
      const isProductList =
        data["@type"] === "ItemList" &&
        (first?.["@type"] === "Product" || first?.sku || first?.productID);
      if (!isProductList) continue;
      return list.map((li) => {
        const p = li.item || li;
        const img = p.image;
        const image = Array.isArray(img) ? img[0] : img || "";
        return {
          cafemarkt_id: String(p.productID || ""),
          name: p.name || "",
          code: p.sku || "",
          brand: p.brand?.name || "",
          url: p.url || "",
          image,
          price_try_kdv_dahil: p.offers?.price ? Number(p.offers.price) : null,
        };
      });
    } catch (_) {}
  }
  return [];
}

export async function fetchBrandPage(slug, pg = 1) {
  const url =
    pg > 1 ? `https://www.cafemarkt.com/${slug}?pg=${pg}` : `https://www.cafemarkt.com/${slug}`;
  const res = await fetch(url, {
    headers: { "User-Agent": CAFE_UA, "Accept-Language": "tr-TR,tr;q=0.9" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  const html = await res.text();
  const items = parseItemList(html);
  const lastPgM = html.match(/class="last"[^>]+href="[^"]*pg=(\d+)"/);
  const totalM = html.match(/<strong>(\d+)<\/strong>\s*ürün görüntüleniyor/);
  return {
    items,
    lastPg: lastPgM ? Number(lastPgM[1]) : pg,
    total: totalM ? Number(totalM[1]) : items.length,
  };
}

export async function fetchAllBrandProducts(slug, delayMs = 350) {
  const all = [];
  const first = await fetchBrandPage(slug, 1);
  all.push(...first.items);
  for (let pg = 2; pg <= first.lastPg; pg++) {
    await sleep(delayMs);
    const page = await fetchBrandPage(slug, pg);
    all.push(...page.items);
  }
  return all;
}

export function parseProductPage(html) {
  const out = {
    name: "",
    sku: "",
    supplier_code: "",
    description: "",
    images: [],
    specs: [],
    category: "",
  };
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/gi)];
  for (const m of blocks) {
    try {
      const data = JSON.parse(m[1]);
      if (data["@type"] === "Product") {
        out.name = data.name || out.name;
        out.sku = data.sku || out.sku;
        if (data.image) {
          const imgs = Array.isArray(data.image) ? data.image : [data.image];
          out.images = imgs.filter(Boolean);
        }
        out.description = data.description || out.description;
      }
    } catch (_) {}
  }
  const sup = html.match(/supplier-product-code[^>]*>([^<]+)/i);
  if (sup) out.supplier_code = sup[1].trim();
  const kod = html.match(/Ürün\s*Kodu[^<]*<[^>]+>([^<]+)/i);
  if (kod && !out.sku) out.sku = kod[1].trim();
  const specRows = [
    ...html.matchAll(
      /<tr[^>]*>\s*<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<\/tr>/gi,
    ),
  ];
  for (const row of specRows) {
    const k = row[1].replace(/<[^>]+>/g, "").trim();
    const v = row[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (k && v) out.specs.push(`${k}: ${v}`);
  }
  const cat = html.match(/breadcrumb[\s\S]{0,2000}?Endüstriyel Mutfak[^<]*/i);
  if (cat) out.category = cat[0].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (!out.images.length) {
    const og = html.match(/property="og:image"\s+content="([^"]+)"/i);
    if (og) out.images.push(og[1]);
  }
  return out;
}

export async function fetchProductDetail(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": CAFE_UA, "Accept-Language": "tr-TR,tr;q=0.9" },
  });
  if (!res.ok) return null;
  const html = await res.text();
  return parseProductPage(html);
}

export async function fetchAllBrandsCache(outPath, brands = Object.keys(BRAND_SLUGS)) {
  const byBrand = {};
  for (const brand of brands) {
    const slug = BRAND_SLUGS[brand];
    console.log("[cafemarkt] fetching", brand, slug);
    byBrand[brand] = await fetchAllBrandProducts(slug);
    console.log("[cafemarkt]", brand, byBrand[brand].length);
    await sleep(500);
  }
  const payload = {
    fetchedAt: new Date().toISOString(),
    byBrand,
  };
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), "utf8");
  return payload;
}
