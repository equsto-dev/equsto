/**
 * Samixir ürün görselleri — Cafemarkt vitrin (witcdn) eşleştirmesi
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CAFE_UA, fetchAllBrandProducts, normCode } from "./cafemarkt-fetch.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const CAFE_BRAND_SLUG = "samixir";
export const CAFE_CACHE_JSON = path.join(__dirname, "../data/samixir/cafemarkt-samixir.json");

/** PDF kodu Cafemarkt'ta farklı yazılan slug'lar */
export const CAFE_CODE_BY_SLUG = {
  "hot-gold-sc06": "SC06.GOLD",
  "hot-gold-sc10": "SC10.GOLD",
  "hot-sc06": "SC06",
  "hot-sc10": "SC10",
  "hot-inox-10": "SC10.AI.SSPB",
};

/** Cafemarkt vitrin/banner yerine temiz ürün fotoğrafı (samixir.com detay veya cafe galeri) */
export const IMAGE_URL_BY_SLUG = {
  "hot-gold-sc06": "https://www.samixir.com/uploads/urunler/hot-gold-sc05-39352.jpg",
  "hot-gold-sc10": "https://www.samixir.com/uploads/urunler/hot-gold-sc10-389621.jpg",
  "hot-sc06": "https://www.samixir.com/uploads/urunler/hot-sc05-69793.jpg",
  "hot-neo-10": "https://www.samixir.com/uploads/urunler/hot-neo-10-31087.jpg",
};

function cafeProductCode(raw) {
  return String(raw || "")
    .replace(/^023\./i, "")
    .trim();
}

export function cafeCodeForSlug(slug, pdfCode) {
  return CAFE_CODE_BY_SLUG[slug] || pdfCode || "";
}

export function matchSamixirCafeProduct(slug, pdfCode, items) {
  const target = normCode(cafeCodeForSlug(slug, pdfCode));
  if (!target) return null;

  const pool = items || [];
  const exact = pool.filter((c) => normCode(cafeProductCode(c.code)) === target);
  if (exact.length === 1) return exact[0];
  if (exact.length > 1) {
    return exact.sort((a, b) => String(a.name).length - String(b.name).length)[0];
  }

  const partial = pool.filter((c) => {
    const nc = normCode(cafeProductCode(c.code));
    return nc.includes(target) || target.includes(nc);
  });
  if (!partial.length) return null;
  return partial.sort((a, b) => normCode(cafeProductCode(a.code)).length - normCode(cafeProductCode(b.code)).length)[0];
}

export function cafeImageExt(url) {
  const ext = path.extname(new URL(url).pathname).toLowerCase();
  if (/^\.(jpe?g|png|webp)$/.test(ext)) return ext;
  return ".jpg";
}

/** Öncelik: manuel override → Cafemarkt liste görseli */
export function resolveSamixirImage(slug, pdfCode, items) {
  const override = IMAGE_URL_BY_SLUG[slug];
  if (override) {
    return { url: override, source: "samixir-detail", cafe_code: null };
  }
  const cafe = matchSamixirCafeProduct(slug, pdfCode, items);
  if (cafe?.image) {
    return { url: cafe.image, source: "cafemarkt", cafe_code: cafe.code };
  }
  return null;
}

export async function ensureCafeCache({ refresh = false } = {}) {
  if (!refresh && fs.existsSync(CAFE_CACHE_JSON)) {
    const cached = JSON.parse(fs.readFileSync(CAFE_CACHE_JSON, "utf8"));
    if (cached.items?.length) return cached.items;
  }
  console.log("[samixir-cafe] Cafemarkt marka listesi çekiliyor…");
  const items = await fetchAllBrandProducts(CAFE_BRAND_SLUG);
  const payload = {
    fetched_at: new Date().toISOString(),
    source: `https://www.cafemarkt.com/${CAFE_BRAND_SLUG}`,
    count: items.length,
    items,
  };
  fs.mkdirSync(path.dirname(CAFE_CACHE_JSON), { recursive: true });
  fs.writeFileSync(CAFE_CACHE_JSON, JSON.stringify(payload, null, 2), "utf8");
  console.log(`[samixir-cafe] ${items.length} ürün → ${CAFE_CACHE_JSON}`);
  return items;
}

export async function downloadCafeImage(url, destPath) {
  if (!url) return false;
  try {
    const res = await fetch(url, { headers: { "User-Agent": CAFE_UA } });
    if (!res.ok) return false;
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, Buffer.from(await res.arrayBuffer()));
    return true;
  } catch {
    return false;
  }
}
