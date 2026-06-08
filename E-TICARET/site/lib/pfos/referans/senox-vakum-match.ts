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
  isSenoxKatalogMarka,
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

let senoxCatalogCache: SenoxCatalogProduct[] | null = null;

function norm(s: string): string {
  return String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/\s+/g, " ")
    .trim();
}

async function loadSenoxCatalogProducts(): Promise<SenoxCatalogProduct[]> {
  if (senoxCatalogCache) return senoxCatalogCache;
  const raw = await readJsonFile<SenoxCatalogFile>(SENOX_CATALOG_REL);
  senoxCatalogCache = (raw?.products ?? []).filter((p) =>
    /vakum|vakuum/.test(norm(p.title ?? "")),
  );
  return senoxCatalogCache;
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
  const n = Number(spec?.fiyat_eur);
  if (Number.isFinite(n) && n > 0) return Math.round(n * 100) / 100;
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

/** Referans adına göre varsayılan Şenox modeli — genel vakum → WM-2 tek çene */
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

function senoxProductToEslesmis(p: SenoxCatalogProduct): EslesmisUrun {
  const ad = String(p.title ?? p.model ?? "Vakum Makinesi").trim();
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

function isSenoxVakumRow(row: AdminUrunRow): boolean {
  return (
    isSenoxKatalogMarka(row.marka_ad) && /vakum|vakuum/.test(norm(row.ad))
  );
}

async function matchFromEkipmanlar(isim: string): Promise<EslesmisUrun | null> {
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

  const matched = katalogRowToEslesmis(pick, { sablonIsim: isim });
  return {
    ...matched,
    marka: SENOX_MARKA,
    fiyatEur: equstoSatisEurFromRow(pick),
  };
}

/** Vakum makinesi — önce ekipmanlar.json (Şenox), yoksa fiyat listesi kataloğu */
export async function matchSenoxVakumByReferans(
  isim: string,
): Promise<EslesmisUrun | null> {
  const fromShop = await matchFromEkipmanlar(isim);
  if (fromShop?.fiyatEur) return fromShop;

  const products = await loadSenoxCatalogProducts();
  const pick = pickSenoxVakumProduct(products, isim);
  if (!pick) return fromShop;

  const fromList = senoxProductToEslesmis(pick);
  if (fromShop && !fromList.fiyatEur) {
    return { ...fromShop, fiyatEur: fromList.fiyatEur };
  }
  return fromList.fiyatEur ? fromList : fromShop;
}

/** Test / katalog yenileme */
export function invalidateSenoxVakumCache(): void {
  senoxCatalogCache = null;
}
