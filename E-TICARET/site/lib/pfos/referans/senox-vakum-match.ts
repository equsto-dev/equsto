import { readJsonFile } from "@/lib/legacy-data";
import {
  loadLegacyCatalogRows,
  type AdminUrunRow,
} from "@/lib/legacy-catalog";
import type { EslesmisUrun } from "../schemas/pfos.schema";
import { katalogRowToEslesmis } from "../core/katalog-row-eslesmis";
import { equstoSatisEurFromRow } from "../core/shop-catalog-match";
import { normalizePfosGorselUrl } from "../core/katalog-gorsel-url";
import {
  SENOX_CATALOG_REL,
  SENOX_MARKA,
  SENOX_MUTBEX_CATALOG_REL,
  SENOX_SATIS_ORAN,
  isSenoxElYikamaReferansIsim,
  isSenoxKatalogMarka,
  isSenoxOnYikamaDusuReferansIsim,
  isSenoxSinekReferansIsim,
  isSenoxVakumPfosKalem,
} from "../core/senox-marka";

type SenoxCatalogProduct = {
  model?: string;
  title?: string;
  specs?: {
    fiyat_eur?: string | number;
    elektrik_gucu?: string;
    ebat_mm?: string;
    genislik_mm?: number;
    derinlik_mm?: number;
    yukseklik_mm?: number;
  };
  image?: string;
};

type SenoxCatalogFile = {
  products?: SenoxCatalogProduct[];
};

type SenoxMutbexProduct = {
  mutbexCode?: string;
  model?: string;
  title?: string;
  priceEur?: number;
  image?: string;
};

type SenoxMutbexCatalogFile = {
  products?: SenoxMutbexProduct[];
};

let senoxCatalogCache: SenoxCatalogProduct[] | null = null;
let senoxMutbexCache: SenoxMutbexProduct[] | null = null;

function norm(s: string): string {
  return String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/\s+/g, " ")
    .trim();
}

async function loadSenoxCatalogAll(): Promise<SenoxCatalogProduct[]> {
  if (senoxCatalogCache) return senoxCatalogCache;
  const raw = await readJsonFile<SenoxCatalogFile>(SENOX_CATALOG_REL);
  senoxCatalogCache = raw?.products ?? [];
  return senoxCatalogCache;
}

async function loadSenoxMutbexProducts(): Promise<SenoxMutbexProduct[]> {
  if (senoxMutbexCache) return senoxMutbexCache;
  const raw = await readJsonFile<SenoxMutbexCatalogFile>(SENOX_MUTBEX_CATALOG_REL);
  senoxMutbexCache = raw?.products ?? [];
  return senoxMutbexCache;
}

async function loadSenoxCatalogProducts(
  titleFilter: RegExp,
): Promise<SenoxCatalogProduct[]> {
  const all = await loadSenoxCatalogAll();
  return all.filter((p) => titleFilter.test(norm(p.title ?? "")));
}

function parsePowerKw(spec?: string): number | null {
  const s = String(spec ?? "");
  const kw = s.match(/([\d.,]+)\s*kw/i);
  if (kw) {
    const n = Number(kw[1].replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }
  const w = s.match(/([\d.,]+)\s*w/i);
  if (w) {
    const n = Number(w[1].replace(",", "."));
    return Number.isFinite(n) ? Math.round((n / 1000) * 100) / 100 : null;
  }
  return null;
}

function senoxEur(spec?: SenoxCatalogProduct["specs"]): number | null {
  const liste = Number(spec?.fiyat_eur);
  if (Number.isFinite(liste) && liste > 0) {
    return Math.round(liste * SENOX_SATIS_ORAN * 100) / 100;
  }
  return null;
}

function olcuFromSenox(p: SenoxCatalogProduct): string | null {
  const s = p.specs;
  if (s?.genislik_mm && s?.derinlik_mm) {
    const y = s.yukseklik_mm ? `×${s.yukseklik_mm}` : "";
    return `${s.genislik_mm}×${s.derinlik_mm}${y} mm`;
  }
  if (s?.ebat_mm) return `${s.ebat_mm} mm`;
  return null;
}

function senoxProductToEslesmis(
  p: SenoxCatalogProduct,
  fallbackAd = "Şenox",
): EslesmisUrun {
  const ad = String(p.title ?? p.model ?? fallbackAd).trim();
  const sku = String(p.model ?? "").trim();
  const fiyatEur = senoxEur(p.specs);
  return {
    id: `senox-${sku || norm(ad).replace(/\s+/g, "-")}`,
    sku,
    ad,
    marka: SENOX_MARKA,
    model: sku || null,
    olcu: olcuFromSenox(p),
    elektrikGucuKw: parsePowerKw(p.specs?.elektrik_gucu),
    gazGucuKw: null,
    fiyat: 0,
    fiyatEur,
    doviz: "TRY",
    gorselUrl: normalizePfosGorselUrl(p.image ?? null),
  };
}

function rowToSenoxEslesmis(row: AdminUrunRow, isim: string): EslesmisUrun {
  const matched = katalogRowToEslesmis(row, {
    sablonIsim: isim,
    linkMarka: SENOX_MARKA,
  });
  return {
    ...matched,
    marka: SENOX_MARKA,
    fiyatEur: equstoSatisEurFromRow(row),
  };
}

function isSenoxElYikamaRow(row: AdminUrunRow): boolean {
  const blob = norm(`${row.ad ?? ""} ${row.sku ?? ""} ${row.model ?? ""}`);
  return (
    isSenoxKatalogMarka(row.marka_ad) &&
    (/dbe|dizden|el yik|el yık|lavabo|evye/.test(blob) ||
      /118\.dbe/i.test(String(row.sku ?? "")))
  );
}

function isSenoxSinekRow(row: AdminUrunRow): boolean {
  const blob = norm(`${row.ad ?? ""} ${row.sku ?? ""} ${row.model ?? ""}`);
  return (
    isSenoxKatalogMarka(row.marka_ad) &&
    (/sinek|yso-|yapiskanli|yapışkanlı|fly kill|insect/.test(blob) ||
      /118\.yso/i.test(String(row.sku ?? "")))
  );
}

function isSenoxVakumRow(row: AdminUrunRow): boolean {
  return (
    isSenoxKatalogMarka(row.marka_ad) && /vakum|vakuum/.test(norm(row.ad))
  );
}

function isSenoxOnYikamaDusuRow(row: AdminUrunRow): boolean {
  const blob = norm(`${row.ad ?? ""} ${row.sku ?? ""} ${row.model ?? ""}`);
  return (
    isSenoxKatalogMarka(row.marka_ad) &&
    (/118\.ht|ht-\d{2}|geri toplam|on yikama dus|ön yikama duş/.test(blob) ||
      /^118\.ht/i.test(String(row.sku ?? "")))
  );
}

function isSenoxDusSpreyiRow(row: AdminUrunRow): boolean {
  const blob = norm(`${row.ad ?? ""} ${row.sku ?? ""}`);
  return (
    isSenoxKatalogMarka(row.marka_ad) &&
    (/118\.dm|118\.tm|118\.t\.|duş sprey|dus sprey|ara musluk/.test(blob) ||
      /^118\.(DM|TM|T)\./i.test(String(row.sku ?? "")))
  );
}

function hoseLengthMFromIsim(isim: string): number | null {
  const n = norm(isim);
  const m = n.match(/(\d+)\s*(?:mt|m\b|metre)/);
  if (m) return Number(m[1]);
  if (/8760\.0ccgt\.15|ccgt\.15|15\s*mt/.test(n)) return 15;
  if (/8760\.0ccgt\.06|ccgt\.06|6\s*mt/.test(n)) return 6;
  if (/8760\.0ccgt\.10|ccgt\.10|10\s*mt/.test(n)) return 10;
  if (/ht-15|118\.ht\.15/.test(n)) return 15;
  if (/ht-12|118\.ht\.12/.test(n)) return 12;
  if (/ht-10|118\.ht\.10/.test(n)) return 10;
  return null;
}

function pickOnYikamaSku(isim: string): string {
  const n = norm(isim);
  const araMusluk = /ara musluk|ara musluğu/.test(n);
  const wantHortum =
    /geri toplam|geri top|ccgt|8760\.0ccgt/.test(n) ||
    (/on yikama dus|ön yikama duş|on yikama dusu|ön yikama duşu|pre.?rinse/.test(
      n,
    ) &&
      !araMusluk);

  if (!wantHortum && araMusluk) {
    if (/tezgah|tezgaha/.test(n)) return "118.T.02";
    return "118.DM.02";
  }

  const len = hoseLengthMFromIsim(isim);
  if (len != null && len >= 15) return "118.HT.15";
  if (len != null && len >= 12) return "118.HT.12";
  return "118.HT.10";
}

function mutbexToEslesmis(p: SenoxMutbexProduct, isim: string): EslesmisUrun {
  const sku = String(p.mutbexCode ?? p.model ?? "").trim();
  const ad = String(p.title ?? isim).trim();
  const liste = Number(p.priceEur);
  const fiyatEur =
    Number.isFinite(liste) && liste > 0
      ? Math.round(liste * SENOX_SATIS_ORAN * 100) / 100
      : null;
  const img = p.image?.startsWith("/")
    ? p.image.replace(/^\/data\//, "")
    : p.image;
  return {
    id: `senox-${sku || norm(ad).replace(/\s+/g, "-")}`,
    sku,
    ad,
    marka: SENOX_MARKA,
    model: String(p.model ?? sku).trim() || null,
    olcu: null,
    elektrikGucuKw: null,
    gazGucuKw: null,
    fiyat: 0,
    fiyatEur,
    doviz: "TRY",
    gorselUrl: normalizePfosGorselUrl(img ?? null),
  };
}

/** Geri toplamalı ön yıkama duşu — Şenox HT-10 / HT-12 / HT-15 */
export async function matchSenoxOnYikamaDusuByReferans(
  isim: string,
): Promise<EslesmisUrun | null> {
  const targetSku = pickOnYikamaSku(isim);
  const rows = (await loadLegacyCatalogRows()).filter(
    (r) =>
      r.durum === "aktif" &&
      isSenoxKatalogMarka(r.marka_ad) &&
      (isSenoxOnYikamaDusuRow(r) || isSenoxDusSpreyiRow(r)),
  );

  const exact =
    rows.find(
      (r) =>
        String(r.sku ?? "").toUpperCase() === targetSku.toUpperCase() ||
        String(r.model ?? "").toUpperCase() === targetSku.replace(/^118\./, "").toUpperCase(),
    ) ??
    rows.find((r) => isSenoxOnYikamaDusuRow(r) || isSenoxDusSpreyiRow(r));

  if (exact && (exact.fiyat_tl > 0 || equstoSatisEurFromRow(exact))) {
    return rowToSenoxEslesmis(exact, isim);
  }

  const mutbex = await loadSenoxMutbexProducts();
  const pick =
    mutbex.find(
      (p) =>
        String(p.mutbexCode ?? "").toUpperCase() === targetSku.toUpperCase(),
    ) ??
    mutbex.find((p) =>
      /geri toplam|on yikama dus|ön yikama duş/i.test(String(p.title ?? "")),
    );
  return pick ? mutbexToEslesmis(pick, isim) : null;
}

function pickSenoxElYikamaProduct(
  products: SenoxCatalogProduct[],
  isim: string,
): SenoxCatalogProduct | null {
  if (!products.length) return null;
  const n = norm(isim);
  const wantCift =
    /cift|cift|çift|sicak.*soguk|sicak\/soguk|hot.*cold|ift su/.test(n);
  if (wantCift) {
    return (
      products.find((p) =>
        /dbe-02|dbe 02|ift su|cift su/.test(norm(p.title ?? "")),
      ) ??
      products.find((p) => /dbe-02/.test(norm(p.model ?? ""))) ??
      products[products.length - 1]
    );
  }
  return (
    products.find((p) => /dbe-01|dbe 01|tek su/.test(norm(p.title ?? ""))) ??
    products.find((p) => /dbe-01/.test(norm(p.model ?? ""))) ??
    products[0]
  );
}

function pickSenoxSinekProduct(
  products: SenoxCatalogProduct[],
  isim: string,
): SenoxCatalogProduct | null {
  if (!products.length) return null;
  const n = norm(isim);
  if (/200|yso-200|yso 200/.test(n)) {
    return (
      products.find((p) => /yso-200|yso 200|200 m2/.test(norm(p.title ?? ""))) ??
      products[products.length - 1]
    );
  }
  return (
    products.find((p) => /yso-100|yso 100|100 m2/.test(norm(p.title ?? ""))) ??
    products[0]
  );
}

function pickSenoxVakumProduct(
  products: SenoxCatalogProduct[],
  isim: string,
): SenoxCatalogProduct | null {
  if (!products.length) return null;
  const n = norm(isim);

  if (/mini/.test(n)) {
    return (
      products.find((p) => /vm-01|mini/.test(norm(p.title ?? ""))) ??
      products[0]
    );
  }
  if (/cift|cift|çift|ikili|2\s*cene|2\s*çene/.test(n)) {
    return (
      products.find((p) =>
        /vm\s*3|cift\s*cene|çift\s*çene|çift\s*cene/.test(norm(p.title ?? "")),
      ) ?? products[products.length - 1]
    );
  }
  return (
    products.find((p) => /wm-2|tek\s*cene|tek\s*çene/.test(norm(p.title ?? ""))) ??
    products.find((p) => /wm-2/.test(norm(p.model ?? ""))) ??
    products[0]
  );
}

/** Dizden kumandalı el yıkama — Şenox DBE-01 (tek su) / DBE-02 (çift su) */
export async function matchSenoxElYikamaByReferans(
  isim: string,
): Promise<EslesmisUrun | null> {
  const rows = (await loadLegacyCatalogRows()).filter(
    (r) => r.durum === "aktif" && r.fiyat_tl > 0 && isSenoxElYikamaRow(r),
  );
  const n = norm(isim);
  const wantCift =
    /cift|cift|çift|sicak.*soguk|sicak\/soguk|hot.*cold|ift su/.test(n);

  if (rows.length > 0) {
    let pick = rows[0];
    if (wantCift) {
      pick =
        rows.find((r) =>
          /dbe\.02|dbe-02/i.test(String(r.sku ?? r.model ?? "")),
        ) ?? pick;
    } else {
      pick =
        rows.find((r) =>
          /dbe\.01|dbe-01/i.test(String(r.sku ?? r.model ?? "")),
        ) ?? pick;
    }
    return rowToSenoxEslesmis(pick, isim);
  }

  const products = await loadSenoxCatalogProducts(/dbe|dizden|evye/i);
  const pick = pickSenoxElYikamaProduct(products, isim);
  return pick ? senoxProductToEslesmis(pick, isim) : null;
}

/** Sinek öldürücü — Şenox YSO-100 / YSO-200 */
export async function matchSenoxSinekByReferans(
  isim: string,
): Promise<EslesmisUrun | null> {
  const rows = (await loadLegacyCatalogRows()).filter(
    (r) => r.durum === "aktif" && r.fiyat_tl > 0 && isSenoxSinekRow(r),
  );
  const n = norm(isim);
  if (rows.length > 0) {
    let pick = rows[0];
    if (/200|yso-200|yso 200/.test(n)) {
      pick =
        rows.find((r) =>
          /yso\.200|yso-200/i.test(String(r.sku ?? r.model ?? "")),
        ) ?? pick;
    } else {
      pick =
        rows.find((r) =>
          /yso\.100|yso-100/i.test(String(r.sku ?? r.model ?? "")),
        ) ?? pick;
    }
    return rowToSenoxEslesmis(pick, isim);
  }

  const products = await loadSenoxCatalogProducts(/sinek|yso-/i);
  const pick = pickSenoxSinekProduct(products, isim);
  return pick ? senoxProductToEslesmis(pick, isim) : null;
}

async function matchSenoxVakumFromEkipmanlar(
  isim: string,
): Promise<EslesmisUrun | null> {
  const rows = (await loadLegacyCatalogRows()).filter(
    (r) => r.durum === "aktif" && r.fiyat_tl > 0 && isSenoxVakumRow(r),
  );
  if (!rows.length) return null;

  const n = norm(isim);
  let pick = rows[0];
  if (/mini/.test(n)) {
    pick = rows.find((r) => /mini|vm-01/.test(norm(r.ad))) ?? pick;
  } else if (/cift|cift|çift/.test(n)) {
    pick = rows.find((r) => /cift|cift|çift|vm\s*3/.test(norm(r.ad))) ?? pick;
  } else {
    pick = rows.find((r) => /wm-2|tek/.test(norm(r.ad))) ?? pick;
  }

  return rowToSenoxEslesmis(pick, isim);
}

/** Vakum makinesi — önce ekipmanlar.json (Şenox), yoksa fiyat listesi kataloğu */
export async function matchSenoxVakumByReferans(
  isim: string,
): Promise<EslesmisUrun | null> {
  const fromShop = await matchSenoxVakumFromEkipmanlar(isim);
  if (fromShop?.fiyatEur) return fromShop;

  const products = await loadSenoxCatalogProducts(/vakum|vakuum/i);
  const pick = pickSenoxVakumProduct(products, isim);
  if (!pick) return fromShop;

  const fromList = senoxProductToEslesmis(pick, isim);
  if (fromShop && !fromList.fiyatEur) {
    return { ...fromShop, fiyatEur: fromList.fiyatEur };
  }
  return fromList.fiyatEur ? fromList : fromShop;
}

/** Şenox katalog eşlemesi — el yıkama, sinek, vakum */
export async function matchSenoxByReferans(
  isim: string,
  urunTipi?: string | null,
): Promise<EslesmisUrun | null> {
  if (isSenoxElYikamaReferansIsim(isim)) {
    const el = await matchSenoxElYikamaByReferans(isim);
    if (el) return el;
  }
  if (isSenoxSinekReferansIsim(isim)) {
    const sinek = await matchSenoxSinekByReferans(isim);
    if (sinek) return sinek;
  }
  if (isSenoxOnYikamaDusuReferansIsim(isim)) {
    const dus = await matchSenoxOnYikamaDusuByReferans(isim);
    if (dus) return dus;
  }
  if (isSenoxVakumPfosKalem({ isim, urunTipi })) {
    return matchSenoxVakumByReferans(isim);
  }
  return null;
}

/** Test / katalog yenileme */
export function invalidateSenoxVakumCache(): void {
  senoxCatalogCache = null;
  senoxMutbexCache = null;
}
