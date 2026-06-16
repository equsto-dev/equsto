import { catalogUrlSlug } from "@/lib/catalog-product-slug";
import { dataRel, readJsonFile } from "@/lib/legacy-data";

export type EqustoFiyatSeriMeta = {
  kod: string;
  title: string;
  lead: string;
  dept: string;
  eticaret_count: number;
  pfos_count: number;
  gorsel?: string;
};

export type EqustoFiyatSeriProduct = {
  id: string;
  name: string;
  brand: string;
  sku: string;
  price: string;
  fiyat_tl?: number;
  olcu_etiket?: string;
  malzeme?: string;
  image?: string;
  href?: string;
  vitrin: boolean;
};

type IndexSheet = {
  kod: string;
  urun_adi: string;
  dept: string;
  slug: string;
  eticaret_count: number;
  pfos_count: number;
  gorsel?: string;
};

type IndexFile = {
  malzeme?: string;
  sheets?: IndexSheet[];
};

type CatalogRow = Record<string, unknown>;

const KAYNAK = "equsto-fiyat-listesi-2026";

function rowImage(row: CatalogRow, fallback?: string): string | undefined {
  const imgs = row.images;
  if (Array.isArray(imgs) && imgs[0]) return String(imgs[0]);
  return fallback;
}

function catalogRowToProduct(
  row: CatalogRow,
  dept: string,
  shopSkus: Set<string>,
  fallbackImage?: string,
): EqustoFiyatSeriProduct {
  const sku = String(row.sku || "");
  const slug = catalogUrlSlug(row);
  const inShop = shopSkus.has(sku);
  return {
    id: String(row.id || slug),
    name: String(row.name || ""),
    brand: String(row.brand || "Equsto"),
    sku,
    price: String(row.price || ""),
    fiyat_tl: Number(row.fiyat_tl) || undefined,
    olcu_etiket: row.olcu_etiket ? String(row.olcu_etiket) : undefined,
    malzeme: row.malzeme ? String(row.malzeme) : undefined,
    image: rowImage(row, fallbackImage),
    href: inShop ? `/shop/${dept}/${encodeURIComponent(slug)}` : undefined,
    vitrin: inShop,
  };
}

export async function loadEqustoFiyatIndex(): Promise<IndexFile | null> {
  return readJsonFile<IndexFile>(
    dataRel("fiyat-listeleri", "equsto", "2026-fiyat-listesi", "index.json"),
  );
}

async function loadCatalogRows(slug: string, kind: "eticaret" | "pfos"): Promise<CatalogRow[]> {
  const file =
    kind === "eticaret" ? "eticaret-urunler.json" : "pfos-urunler.json";
  const rows = await readJsonFile<CatalogRow[]>(
    dataRel("fiyat-listeleri", "equsto", "2026-fiyat-listesi", slug, file),
  );
  return Array.isArray(rows) ? rows : [];
}

export async function loadEqustoFiyatSeriProducts(
  seriSlug: string,
  deptHint?: string,
): Promise<{ meta: EqustoFiyatSeriMeta; products: EqustoFiyatSeriProduct[] } | null> {
  const index = await loadEqustoFiyatIndex();
  const slug = seriSlug.toLowerCase();
  const sheet = index?.sheets?.find(
    (s) => s.slug === slug || s.kod.toLowerCase() === slug,
  );
  if (!sheet) return null;

  const dept = deptHint && deptHint === sheet.dept ? deptHint : sheet.dept;
  const malzeme = index?.malzeme || "AISI 18/10 (304 kalite) paslanmaz çelik mamül";

  const deptRows = await readJsonFile<CatalogRow[]>(dataRel("dept", `${dept}.json`));
  const shopRows = (Array.isArray(deptRows) ? deptRows : []).filter((r) => {
    if (!r) return false;
    const kod = String(r.kod || r.equsto_seri || "").toUpperCase();
    return kod === sheet.kod.toUpperCase() && String(r.kaynak || "") === KAYNAK;
  });
  const shopSkus = new Set(shopRows.map((r) => String(r.sku || "")).filter(Boolean));

  const eticRows = await loadCatalogRows(sheet.slug, "eticaret");
  const pfosRows = await loadCatalogRows(sheet.slug, "pfos");
  const sourceRows = eticRows.length > 0 ? eticRows : pfosRows;

  const products = sourceRows
    .map((r) => catalogRowToProduct(r, dept, shopSkus, sheet.gorsel))
    .sort((a, b) => a.name.localeCompare(b.name, "tr"));

  const vitrinCount = products.filter((p) => p.vitrin).length;
  const leadParts = [
    sheet.urun_adi,
    malzeme,
    "Marka: Equsto.",
    vitrinCount > 0
      ? `${vitrinCount} ürün online vitrinde.`
      : "Ölçü ve fiyat listesi (PFOS teklif için).",
  ];

  return {
    meta: {
      kod: sheet.kod,
      title: sheet.urun_adi,
      lead: leadParts.join(" — "),
      dept,
      eticaret_count: sheet.eticaret_count,
      pfos_count: sheet.pfos_count,
      gorsel: sheet.gorsel,
    },
    products,
  };
}
