import { catalogUrlSlug, matchCatalogRowByPathSlug } from "@/lib/catalog-product-slug";
import { loadEkipmanlarJson } from "@/lib/catalog-json";
import { readJsonFile, dataPath } from "@/lib/legacy-data";
import {
  absoluteAssetUrl,
  cleanDescription,
  feedTitle,
  getSiteOrigin,
  isQuoteOnlyProduct,
  resolveMerchantPriceTry,
} from "@/lib/google-merchant-feed";
import { resolveShopDept } from "@/lib/shop/category-dept";
import { SHOP_DEPTS, isShopDeptSlug, type ShopDeptSlug } from "@/lib/shop/depts";
import type { Metadata } from "next";

type CatalogRow = Record<string, unknown>;

function urlDeptToFileDept(urlDept: string): string {
  if (urlDept === "market-reyonlari") return "market-reyon";
  if (urlDept === "kuvetler") return "set-ustu-mutfak";
  return urlDept;
}

function productImagePath(row: CatalogRow): string {
  const imgs = row.images;
  if (!Array.isArray(imgs) || !imgs.length) return "";
  const pick = String(imgs[0] || "").replace(/\\/g, "/").replace(/^\.\//, "");
  if (!pick) return "";
  if (pick.startsWith("http")) return pick;
  if (pick.startsWith("data/")) return `/${pick}`;
  if (pick.startsWith("images/")) return `/${pick}`;
  return `/data/${pick.replace(/^data\//, "")}`;
}

export type PdpSsrPayload = {
  name: string;
  brand: string;
  description: string;
  deptTitle: string;
  deptHref: string;
  slug: string;
  canonical: string;
  image?: string;
  sku?: string;
  priceTry?: number;
};

export async function findProductForPdp(
  urlDept: string,
  pathSlug: string,
): Promise<{ row: CatalogRow; dept: ShopDeptSlug } | null> {
  if (!isShopDeptSlug(urlDept) || !pathSlug?.trim()) return null;
  const slug = decodeURIComponent(pathSlug).toLowerCase();

  const fileDept = urlDeptToFileDept(urlDept);
  const deptRows = await readJsonFile<CatalogRow[]>(dataPath("dept", `${fileDept}.json`));
  if (Array.isArray(deptRows)) {
    for (const row of deptRows) {
      if (!row) continue;
      if (resolveShopDept(row) !== urlDept) continue;
      if (matchCatalogRowByPathSlug(row, slug)) return { row, dept: urlDept };
    }
  }

  try {
    const raw = await loadEkipmanlarJson();
    const rows = Array.isArray(raw) ? (raw as CatalogRow[]) : [];
    for (const row of rows) {
      if (!row || resolveShopDept(row) !== urlDept) continue;
      const cid = String(row.id || "").trim().toLowerCase();
      if (cid && (cid === slug || cid.replace(/__/g, "-") === slug)) {
        return { row, dept: urlDept };
      }
      if (catalogUrlSlug(row).toLowerCase() === slug) return { row, dept: urlDept };
      if (matchCatalogRowByPathSlug(row, slug)) return { row, dept: urlDept };
    }
  } catch {
    /* ekipmanlar.json yoksa dept dosyası yeterli */
  }

  return null;
}

export function rowToPdpSsr(row: CatalogRow, dept: ShopDeptSlug): PdpSsrPayload {
  const origin = getSiteOrigin();
  const slug = catalogUrlSlug(row);
  const name = feedTitle(row) || String(row.name || "Ürün").trim();
  const brand = String(row.brand || "").trim();
  const description = cleanDescription(row, 320);
  const canonical = `${origin}/shop/${dept}/${encodeURIComponent(slug)}`;
  const priceTry = resolveMerchantPriceTry(row);
  const img = productImagePath(row);

  return {
    name,
    brand,
    description: description || `${name} — ${brand || "Equsto"} endüstriyel mutfak kataloğu.`,
    deptTitle: SHOP_DEPTS[dept].title,
    deptHref: `/shop/${dept}`,
    slug,
    canonical,
    image: img ? absoluteAssetUrl(img, origin) : undefined,
    priceTry: priceTry > 0 ? priceTry : undefined,
  };
}

export function buildProductMetadata(ssr: PdpSsrPayload): Metadata {
  const title = `${ssr.name}${ssr.brand ? ` · ${ssr.brand}` : ""} · Equsto`;
  const description =
    ssr.description.slice(0, 155) +
    (ssr.description.length > 155 ? "…" : "") +
    " Teknik özellikler, fiyat ve teklif.";

  return {
    title,
    description,
    alternates: {
      canonical: ssr.canonical,
      languages: {
        tr: ssr.canonical,
        en: ssr.canonical.replace("://equsto.com/", "://equsto.com/en/"),
      },
    },
    openGraph: {
      title,
      description,
      url: ssr.canonical,
      type: "website",
      ...(ssr.image ? { images: [{ url: ssr.image }] } : {}),
    },
  };
}

export function buildProductJsonLd(ssr: PdpSsrPayload) {
  const origin = getSiteOrigin();
  const deptUrl = `${origin}${ssr.deptHref}`;

  const offer =
    ssr.priceTry && ssr.priceTry > 0
      ? {
          "@type": "Offer",
          price: ssr.priceTry.toFixed(2),
          priceCurrency: "TRY",
          availability: "https://schema.org/InStock",
          url: ssr.canonical,
        }
      : {
          "@type": "Offer",
          availability: "https://schema.org/PreOrder",
          url: ssr.canonical,
          priceCurrency: "TRY",
        };

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: ssr.name,
        description: ssr.description,
        image: ssr.image ? [ssr.image] : undefined,
        sku: ssr.sku || ssr.slug,
        brand: { "@type": "Brand", name: ssr.brand || "Equsto" },
        offers: offer,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Ana Sayfa", item: `${origin}/` },
          { "@type": "ListItem", position: 2, name: ssr.deptTitle, item: deptUrl },
          { "@type": "ListItem", position: 3, name: ssr.name, item: ssr.canonical },
        ],
      },
    ],
  };
}

/** PLP — Google için statik iç link listesi */
export async function getDeptCrawlLinks(
  dept: ShopDeptSlug,
  limit = 120,
): Promise<{ href: string; label: string }[]> {
  const fileDept = urlDeptToFileDept(dept);
  const rows = await readJsonFile<CatalogRow[]>(dataPath("dept", `${fileDept}.json`));
  if (!Array.isArray(rows)) return [];

  const out: { href: string; label: string }[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    if (out.length >= limit) break;
    if (!row || resolveShopDept(row) !== dept) continue;
    const name = String(row.name || "").trim();
    if (!name) continue;
    const slug = catalogUrlSlug(row);
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    out.push({
      href: `/shop/${dept}/${encodeURIComponent(slug)}`,
      label: feedTitle(row) || name,
    });
  }

  return out;
}

export function isIndexableProductRow(row: CatalogRow): boolean {
  const name = String(row.name || "").trim();
  if (!name) return false;
  const dept = resolveShopDept(row);
  if (!dept || !isShopDeptSlug(dept)) return false;
  if (!catalogUrlSlug(row)) return false;
  return true;
}

export { isQuoteOnlyProduct };
