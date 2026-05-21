import type { Product, Brand, Category } from "@prisma/client";

/** admin.html `apiToProduct` ile uyumlu kayıt */
export type AdminUrunRow = {
  id: string;
  ad: string;
  tip_kodu: string | null;
  kategori: string;
  marka_id: string | null;
  marka_ad: string;
  model: string | null;
  sku: string | null;
  stok: number;
  fiyat_tl: number;
  el_guc: string | null;
  gaz_guc: string | null;
  aciklama: string | null;
  gorsel_url: string | null;
  durum: "aktif" | "pasif";
  proje_fab_aktif: boolean;
};

type EcomRow = {
  name?: string;
  brand?: string;
  category?: string;
  price?: string | number;
  specs?: string;
  images?: string[];
};

function parseFirstTl(price: unknown): number {
  if (price == null) return 0;
  const s = String(price);
  const m = s.replace(/\./g, "").match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

function ecomId(name: string, index: number): string {
  const idSafe = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `ecom_${idSafe || "p"}_${index}`;
}

export function ecomRowToAdminUrun(u: EcomRow, index: number): AdminUrunRow {
  const name = u?.name ? String(u.name) : "";
  const img0 = u?.images?.[0];
  const gorsel = img0
    ? `./data/${String(img0).replace(/\\/g, "/").replace(/^\.\//, "")}`
    : null;

  return {
    id: ecomId(name, index),
    ad: name,
    tip_kodu: null,
    kategori: u?.category ? String(u.category) : "",
    marka_id: null,
    marka_ad: u?.brand ? String(u.brand) : "",
    model: null,
    sku: null,
    stok: 0,
    fiyat_tl: parseFirstTl(u?.price),
    el_guc: null,
    gaz_guc: null,
    aciklama: u?.specs ? String(u.specs) : null,
    gorsel_url: gorsel,
    durum: "aktif",
    proje_fab_aktif: true,
  };
}

type PrismaProduct = Product & { brand: Brand; category: Category };

export function prismaToAdminUrun(p: PrismaProduct): AdminUrunRow {
  const img = p.specs as { gorsel_url?: string } | null;
  return {
    id: p.id,
    ad: p.name,
    tip_kodu: p.modelCode || null,
    kategori: p.category.slug,
    marka_id: p.brand.slug,
    marka_ad: p.brand.name,
    model: p.modelCode || null,
    sku: p.modelCode || null,
    stok: 0,
    fiyat_tl: p.priceListTl != null ? Number(p.priceListTl) : 0,
    el_guc: null,
    gaz_guc: null,
    aciklama: p.description,
    gorsel_url: typeof img?.gorsel_url === "string" ? img.gorsel_url : null,
    durum: p.status === "PUBLISHED" ? "aktif" : "pasif",
    proje_fab_aktif: true,
  };
}

export type AdminUrunPayload = {
  ad?: string;
  tip_kodu?: string | null;
  kategori?: string;
  marka_id?: string | null;
  model?: string | null;
  sku?: string | null;
  el_guc?: string | null;
  gaz_guc?: string | null;
  fiyat_tl?: number;
  stok?: number;
  durum?: string;
  aciklama?: string | null;
  gorsel_url?: string | null;
  proje_fab_aktif?: boolean;
};

export function parseAdminUrunPayload(
  body: AdminUrunPayload
): { error: string } | {
  name: string;
  modelCode: string;
  categorySlug: string;
  brandSlug: string;
  description: string | null;
  priceListTl: number;
  status: "DRAFT" | "PUBLISHED";
  specs: Record<string, unknown>;
} {
  const name = String(body.ad || "").trim();
  if (!name) return { error: "ad zorunlu" };
  const durum = body.durum === "pasif" ? "pasif" : "aktif";
  const status = durum === "aktif" ? "PUBLISHED" : "DRAFT";
  return {
    name,
    modelCode: String(body.sku || body.model || body.tip_kodu || `ADM-${Date.now()}`).trim(),
    categorySlug: String(body.kategori || "pisirme").trim() || "pisirme",
    brandSlug: String(body.marka_id || "atalay").trim() || "atalay",
    description: body.aciklama ?? null,
    priceListTl: Number(body.fiyat_tl) || 0,
    status: status as "DRAFT" | "PUBLISHED",
    specs: {
      el_guc: body.el_guc ?? null,
      gaz_guc: body.gaz_guc ?? null,
      gorsel_url: body.gorsel_url ?? null,
      stok: body.stok ?? 0,
      proje_fab_aktif: body.proje_fab_aktif !== false,
    },
  };
}
