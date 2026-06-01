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
  alis_fiyati_eur?: number | null;
  alis_fiyati_tl?: number | null;
  satis_fiyat_eur?: number | null;
  satis_fiyati_tl?: number | null;
  para_birimi?: string | null;
  kdv_oran?: number;
  /** Elektrik gücü (kW) */
  el_guc: number | null;
  /** Gaz gücü (kW) */
  gaz_guc: number | null;
  aciklama: string | null;
  gorsel_url: string | null;
  olculer?: {
    genislik_mm?: number;
    derinlik_mm?: number;
    yukseklik_mm?: number;
    kapasite_lt?: string | number;
    guc_kw?: string | number;
  } | null;
  teknik_ozellikler?: string[];
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
  sku?: string;
  model?: string;
  fiyat_tl?: number;
  fiyat_tl_net?: number;
  alis_fiyati_eur?: number;
  alis_fiyati_tl?: number;
  satis_fiyati_eur?: number;
  satis_fiyati_tl?: number;
  satis_eur_indirimli?: number;
  para_birimi?: string;
  kdv_oran?: number;
  tip_kodu?: string;
  olculer?: {
    genislik_mm?: number;
    derinlik_mm?: number;
    yukseklik_mm?: number;
    kapasite_lt?: string | number;
    guc_kw?: string | number;
  } | null;
  teknik_ozellikler?: string[];
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
  const fiyat =
    u?.fiyat_tl != null && Number(u.fiyat_tl) > 0
      ? Number(u.fiyat_tl)
      : parseFirstTl(u?.price);
  const satisEur =
    Number(u?.satis_fiyati_eur ?? u?.satis_eur_indirimli) > 0
      ? Number(u?.satis_fiyati_eur ?? u?.satis_eur_indirimli)
      : null;
  const alisEur = Number(u?.alis_fiyati_eur) > 0 ? Number(u.alis_fiyati_eur) : null;
  const alisTl = Number(u?.alis_fiyati_tl) > 0 ? Number(u.alis_fiyati_tl) : null;
  const satisTl = Number(u?.satis_fiyati_tl) > 0 ? Number(u.satis_fiyati_tl) : null;
  const elKw = u?.olculer?.guc_kw;
  const elGuc =
    elKw != null && Number.isFinite(Number(elKw)) ? Number(elKw) : null;

  return {
    id: ecomId(name, index),
    ad: name,
    sku: u?.sku ? String(u.sku) : null,
    tip_kodu: u?.tip_kodu ? String(u.tip_kodu) : null,
    kategori: u?.category ? String(u.category) : "",
    kategori_ad: u?.category ? String(u.category) : "",
    marka_id: null,
    marka_ad: u?.brand ? String(u.brand) : "",
    model: u?.model ? String(u.model) : null,
    stok: 0,
    fiyat_tl: fiyat,
    alis_fiyati_eur: alisEur,
    alis_fiyati_tl: alisTl,
    satis_fiyat_eur: satisEur,
    satis_fiyati_tl: satisTl,
    para_birimi: u?.para_birimi ? String(u.para_birimi) : null,
    kdv_oran: Number(u?.kdv_oran) > 0 ? Number(u.kdv_oran) : 20,
    el_guc: elGuc,
    gaz_guc: null,
    aciklama: u?.specs ? String(u.specs) : null,
    gorsel_url: gorsel,
    olculer: u?.olculer ?? null,
    teknik_ozellikler: Array.isArray(u?.teknik_ozellikler)
      ? u.teknik_ozellikler.map(String)
      : undefined,
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
