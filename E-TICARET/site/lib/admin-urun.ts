import type { Product, Brand, Category } from "@/lib/prisma";
import { buildEqustoKod, deriveProductCodes } from "@/lib/catalog/product-hierarchy";
import { resolveKwFromSources } from "@/lib/catalog/kw-resolve";

/** admin.html / yönetim ProTable ile uyumlu kayıt */
export type AdminUrunRow = {
  id: string;
  /** Equsto ürün kodu (EQ-{marka_kodu}.{urun_kodu}) */
  equsto_kod: string | null;
  /** Marka kodu (Brand.kod — PIMAK, OZTI) */
  marka_kodu: string | null;
  /** Üretici ürün kodu (marka öneki olmadan) */
  urun_kodu: string | null;
  ad: string;
  sku: string | null;
  tip_kodu: string | null;
  kategori: string;
  kategori_ad: string;
  /** Kategori yolu: [ürün kategori, alt1, alt2, …] */
  kategori_yolu?: string[];
  marka_id: string | null;
  marka_ad: string;
  model: string | null;
  stok: number;
  fiyat_tl: number;
  /** KDV hariç liste fiyatı (döviz) */
  fiyat_kdv_haric_doviz?: number | null;
  doviz?: string | null;
  kdv_oran?: number | null;
  alis_fiyati_eur?: number | null;
  alis_fiyati_tl?: number | null;
  satis_fiyat_eur?: number | null;
  satis_fiyati_tl?: number | null;
  para_birimi?: string | null;
  el_guc: number | null;
  gaz_guc: number | null;
  aciklama: string | null;
  detay: string | null;
  /** inoksanshop / inoksan.com ürün açıklaması (teklif + PDP) */
  description?: string | null;
  /** oztiryakiler.com.tr WP REST açıklaması (teklif + PDP) */
  ozti_web_description?: string | null;
  ozti_web_url?: string | null;
  inoksan_shop_description?: string | null;
  inoksan_shop_url?: string | null;
  pimak_web_description?: string | null;
  gorsel_url: string | null;
  olculer?: {
    genislik_mm?: number;
    derinlik_mm?: number;
    yukseklik_mm?: number;
    kapasite_lt?: string | number;
    guc_kw?: string | number;
    guc_w?: string | number;
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
  satis_eur_net?: number;
  para_birimi?: string;
  kdv_oran?: number;
  tip_kodu?: string;
  olculer?: {
    genislik_mm?: number;
    derinlik_mm?: number;
    yukseklik_mm?: number;
    kapasite_lt?: string | number;
    guc_kw?: string | number;
    guc_w?: string | number;
  } | null;
  teknik_ozellikler?: string[];
  description?: string;
  ozti_web_description?: string;
  ozti_web_url?: string;
  inoksan_shop_description?: string;
  inoksan_shop_url?: string;
  pimak_web_description?: string;
  el_guc?: number;
  gaz_guc?: number;
  aciklama?: string;
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
    Number(u?.satis_fiyati_eur ?? u?.satis_eur_indirimli ?? u?.satis_eur_net) > 0
      ? Number(u?.satis_fiyati_eur ?? u?.satis_eur_indirimli ?? u?.satis_eur_net)
      : null;
  const alisEur = Number(u?.alis_fiyati_eur) > 0 ? Number(u.alis_fiyati_eur) : null;
  const alisTl = Number(u?.alis_fiyati_tl) > 0 ? Number(u.alis_fiyati_tl) : null;
  const satisTl = Number(u?.satis_fiyati_tl) > 0 ? Number(u.satis_fiyati_tl) : null;
  const resolvedKw = resolveKwFromSources({
    urunAd: name,
    el_guc: u?.el_guc != null ? Number(u.el_guc) : null,
    gaz_guc: u?.gaz_guc != null ? Number(u.gaz_guc) : null,
    aciklama: u?.aciklama ? String(u.aciklama) : u?.specs ? String(u.specs) : null,
    description: u?.description ? String(u.description) : null,
    ozti_web_description: u?.ozti_web_description
      ? String(u.ozti_web_description)
      : null,
    inoksan_shop_description: u?.inoksan_shop_description
      ? String(u.inoksan_shop_description)
      : null,
    pimak_web_description: u?.pimak_web_description
      ? String(u.pimak_web_description)
      : null,
    teknik_ozellikler: u?.teknik_ozellikler,
    olculer: u?.olculer ?? null,
  });

  return {
    id: ecomId(name, index),
    equsto_kod: null,
    marka_kodu: null,
    urun_kodu: null,
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
    el_guc: resolvedKw.elektrikGucuKw,
    gaz_guc: resolvedKw.gazGucuKw,
    aciklama: u?.aciklama
      ? String(u.aciklama)
      : u?.specs
        ? String(u.specs)
        : null,
    detay: u?.description ? String(u.description) : null,
    description: u?.description ? String(u.description) : null,
    ozti_web_description: u?.ozti_web_description
      ? String(u.ozti_web_description)
      : null,
    ozti_web_url: u?.ozti_web_url ? String(u.ozti_web_url) : null,
    inoksan_shop_description: u?.inoksan_shop_description
      ? String(u.inoksan_shop_description)
      : u?.description
        ? String(u.description)
        : null,
    inoksan_shop_url: u?.inoksan_shop_url ? String(u.inoksan_shop_url) : null,
    pimak_web_description: u?.pimak_web_description
      ? String(u.pimak_web_description)
      : null,
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
  const brandKod = p.brand.kod ?? null;
  const urunKodu = p.urunKodu ?? null;
  return {
    id: p.id,
    equsto_kod:
      p.equstoKod ??
      (brandKod && urunKodu ? buildEqustoKod(brandKod, urunKodu) : null),
    marka_kodu: brandKod,
    urun_kodu: urunKodu,
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
    fiyat_kdv_haric_doviz:
      p.fiyatKdvHaricDoviz != null
        ? Number(p.fiyatKdvHaricDoviz)
        : p.fiyatListe != null
          ? Number(p.fiyatListe)
          : null,
    doviz: p.dovizFiyat ?? p.dovizListe ?? null,
    kdv_oran: p.kdvOran != null ? Number(p.kdvOran) : null,
    el_guc: decimalToKw(p.elektrikGucuKw) ?? fromSpecs.el,
    gaz_guc: decimalToKw(p.gazGucuKw) ?? fromSpecs.gaz,
    aciklama: p.description,
    detay: p.detayliAciklama,
    gorsel_url: typeof primary === "string" ? primary : null,
    olculer: {
      genislik_mm: p.genislikMm ?? undefined,
      derinlik_mm: p.derinlikMm ?? undefined,
      yukseklik_mm: p.yukseklikMm ?? undefined,
    },
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
  marka_ad?: string | null;
  /** Brand.kod — PIMAK, OZTI (marka adından ayrı) */
  marka_kodu?: string | null;
  /** Üretici ürün kodu — marka öneki olmadan */
  urun_kodu?: string | null;
  equsto_kod?: string | null;
  model?: string | null;
  sku?: string | null;
  el_guc?: number | string | null;
  gaz_guc?: number | string | null;
  fiyat_tl?: number;
  fiyat_kdv_haric_doviz?: number | string | null;
  doviz?: string | null;
  kdv_oran?: number | string | null;
  stok?: number;
  durum?: string;
  aciklama?: string | null;
  detay?: string | null;
  genislik_mm?: number | null;
  derinlik_mm?: number | null;
  yukseklik_mm?: number | null;
  gorsel_url?: string | null;
  proje_fab_aktif?: boolean;
};

export function parseAdminUrunPayload(
  body: AdminUrunPayload
): { error: string } | {
  name: string;
  modelCode: string;
  sku: string | null;
  brandKod: string | null;
  brandName: string;
  urunKodu: string | null;
  equstoKod: string | null;
  categorySlug: string;
  brandSlug: string;
  description: string | null;
  detayliAciklama: string | null;
  priceListTl: number;
  fiyatKdvHaricDoviz: number | null;
  dovizFiyat: "EUR" | "TRY" | "USD" | null;
  kdvOran: number | null;
  genislikMm: number | null;
  derinlikMm: number | null;
  yukseklikMm: number | null;
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
  const brandSlug = String(body.marka_id || "atalay").trim() || "atalay";
  const brandName = String(body.marka_ad || brandSlug).trim() || brandSlug;
  const brandKod = String(body.marka_kodu || "").trim().toUpperCase() || null;
  const codes = deriveProductCodes({
    brandKod,
    urunKodu: body.urun_kodu,
    sku: body.sku || body.model || body.tip_kodu,
  });
  const modelCode = codes.modelCode || `ADM-${Date.now()}`;
  const skuRaw = String(body.sku || modelCode).trim();
  const urunKodu = codes.urunKodu || null;
  const equstoKod = String(
    body.equsto_kod || (brandKod && urunKodu ? buildEqustoKod(brandKod, urunKodu) : ""),
  ).trim();
  const dovizRaw = String(body.doviz || "EUR").trim().toUpperCase();
  const dovizFiyat =
    dovizRaw === "TRY" || dovizRaw === "USD" || dovizRaw === "EUR"
      ? (dovizRaw as "EUR" | "TRY" | "USD")
      : "EUR";
  const parseMm = (v: unknown): number | null => {
    if (typeof v === "number" && Number.isFinite(v)) return Math.round(v);
    if (v != null && v !== "") {
      const n = Number(String(v).replace(",", "."));
      return Number.isFinite(n) ? Math.round(n) : null;
    }
    return null;
  };
  const fiyatDoviz =
    body.fiyat_kdv_haric_doviz != null && body.fiyat_kdv_haric_doviz !== ""
      ? Number(body.fiyat_kdv_haric_doviz)
      : null;
  const kdvOran =
    body.kdv_oran != null && body.kdv_oran !== ""
      ? Number(body.kdv_oran)
      : null;
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
    brandKod,
    brandName,
    urunKodu,
    equstoKod: equstoKod || null,
    categorySlug: String(body.kategori || "pisirme").trim() || "pisirme",
    brandSlug,
    description: body.aciklama ?? null,
    detayliAciklama: body.detay ?? null,
    priceListTl: Number(body.fiyat_tl) || 0,
    fiyatKdvHaricDoviz: Number.isFinite(fiyatDoviz) ? fiyatDoviz : null,
    dovizFiyat: fiyatDoviz != null ? dovizFiyat : null,
    kdvOran: Number.isFinite(kdvOran) ? kdvOran : null,
    genislikMm: parseMm(body.genislik_mm),
    derinlikMm: parseMm(body.derinlik_mm),
    yukseklikMm: parseMm(body.yukseklik_mm),
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
