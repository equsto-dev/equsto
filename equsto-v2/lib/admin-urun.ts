import type { Product, Brand, Category } from "@/lib/prisma";

/** admin.html / yönetim ProTable ile uyumlu kayıt */
export type AdminUrunRow = {
  id: string;
  ad: string;
  sku: string | null;
  tip_kodu: string | null;
  kategori: string;
  kategori_ad: string;
  marka_id: string | null;
  marka_ad: string;
  model: string | null;
  stok: number;
  fiyat_tl: number;
  /** Elektrik gücü (kW) */
  el_guc: number | null;
  /** Gaz gücü (kW) */
  gaz_guc: number | null;
  aciklama: string | null;
  gorsel_url: string | null;
  durum: "aktif" | "pasif";
  proje_fab_aktif: boolean;
  /** Legacy katalog satırı — DB CRUD kapalı */
  readonly?: boolean;
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
    sku: null,
    tip_kodu: null,
    kategori: u?.category ? String(u.category) : "",
    kategori_ad: u?.category ? String(u.category) : "",
    marka_id: null,
    marka_ad: u?.brand ? String(u.brand) : "",
    model: null,
    stok: 0,
    fiyat_tl: parseFirstTl(u?.price),
    el_guc: null,
    gaz_guc: null,
    aciklama: u?.specs ? String(u.specs) : null,
    gorsel_url: gorsel,
    durum: "aktif",
    proje_fab_aktif: true,
    readonly: true,
  };
}

function decimalToKw(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function parseKwFromSpecs(specs: Record<string, unknown>): {
  el: number | null;
  gaz: number | null;
} {
  const elRaw = specs.el_guc ?? specs.elektrik_kw;
  const gazRaw = specs.gaz_guc ?? specs.gaz_kw;
  if (typeof elRaw === "number") {
    return { el: elRaw, gaz: decimalToKw(gazRaw) };
  }
  if (typeof elRaw === "string") {
    const m = elRaw.match(/([\d.,]+)/);
    return {
      el: m ? Number(m[1].replace(",", ".")) : null,
      gaz:
        typeof gazRaw === "string"
          ? (() => {
              const gm = gazRaw.match(/([\d.,]+)/);
              return gm ? Number(gm[1].replace(",", ".")) : null;
            })()
          : decimalToKw(gazRaw),
    };
  }
  return { el: null, gaz: decimalToKw(gazRaw) };
}

type PrismaProduct = Product & { brand: Brand; category: Category };

type PrismaProductWithImages = PrismaProduct & {
  images?: { url: string; isPrimary: boolean; order: number }[];
};

export function prismaToAdminUrun(p: PrismaProductWithImages): AdminUrunRow {
  const specs = (p.specs || {}) as Record<string, unknown>;
  const fromSpecs = parseKwFromSpecs(specs);
  const primary =
    p.images?.find((i) => i.isPrimary)?.url ??
    p.images?.[0]?.url ??
    (typeof specs.gorsel_url === "string" ? specs.gorsel_url : null);
  return {
    id: p.id,
    ad: p.name,
    sku: p.sku ?? p.modelCode ?? null,
    tip_kodu: p.modelCode || null,
    kategori: p.category.slug,
    kategori_ad: p.category.name,
    marka_id: p.brand.slug,
    marka_ad: p.brand.name,
    model: p.model ?? p.modelCode ?? null,
    stok: p.stok ?? 0,
    fiyat_tl: p.priceListTl != null ? Number(p.priceListTl) : 0,
    el_guc: decimalToKw(p.elektrikGucuKw) ?? fromSpecs.el,
    gaz_guc: decimalToKw(p.gazGucuKw) ?? fromSpecs.gaz,
    aciklama: p.description,
    gorsel_url: typeof primary === "string" ? primary : null,
    durum: p.status === "PUBLISHED" ? "aktif" : "pasif",
    proje_fab_aktif: p.pfosAktif !== false,
    readonly: false,
  };
}

export type AdminUrunPayload = {
  ad?: string;
  tip_kodu?: string | null;
  kategori?: string;
  marka_id?: string | null;
  model?: string | null;
  sku?: string | null;
  el_guc?: number | string | null;
  gaz_guc?: number | string | null;
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
  sku: string | null;
  categorySlug: string;
  brandSlug: string;
  description: string | null;
  priceListTl: number;
  stok: number;
  elektrikGucuKw: number | null;
  gazGucuKw: number | null;
  pfosAktif: boolean;
  status: "DRAFT" | "PUBLISHED";
  specs: Record<string, unknown>;
} {
  const name = String(body.ad || "").trim();
  if (!name) return { error: "ad zorunlu" };
  const durum = body.durum === "pasif" ? "pasif" : "aktif";
  const status = durum === "aktif" ? "PUBLISHED" : "DRAFT";
  const skuRaw = String(body.sku || body.model || body.tip_kodu || "").trim();
  const modelCode = skuRaw || `ADM-${Date.now()}`;
  const el =
    typeof body.el_guc === "number"
      ? body.el_guc
      : body.el_guc != null && body.el_guc !== ""
        ? Number(String(body.el_guc).replace(",", "."))
        : null;
  const gaz =
    typeof body.gaz_guc === "number"
      ? body.gaz_guc
      : body.gaz_guc != null && body.gaz_guc !== ""
        ? Number(String(body.gaz_guc).replace(",", "."))
        : null;
  return {
    name,
    modelCode,
    sku: skuRaw || modelCode,
    categorySlug: String(body.kategori || "pisirme").trim() || "pisirme",
    brandSlug: String(body.marka_id || "atalay").trim() || "atalay",
    description: body.aciklama ?? null,
    priceListTl: Number(body.fiyat_tl) || 0,
    stok: Number(body.stok) || 0,
    elektrikGucuKw: Number.isFinite(el) ? el : null,
    gazGucuKw: Number.isFinite(gaz) ? gaz : null,
    pfosAktif: body.proje_fab_aktif !== false,
    status: status as "DRAFT" | "PUBLISHED",
    specs: {
      gorsel_url: body.gorsel_url ?? null,
      proje_fab_aktif: body.proje_fab_aktif !== false,
    },
  };
}
