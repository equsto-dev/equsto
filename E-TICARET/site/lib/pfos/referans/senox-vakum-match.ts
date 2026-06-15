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
  isSenoxYerYikamaHortumuReferansIsim,
  isSenoxDusSpreyReferansIsim,
  isSenoxSinekReferansIsim,
  isSenoxVakumPfosKalem,
  isSenoxDilimlemeReferansIsim,
  isSenoxMeyveSikacagiReferansIsim,
  isSenoxMikrodalgaReferansIsim,
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

function isSenoxYerYikamaHortumuRow(row: AdminUrunRow): boolean {
  const blob = norm(`${row.ad ?? ""} ${row.sku ?? ""} ${row.model ?? ""}`);
  return (
    isSenoxKatalogMarka(row.marka_ad) &&
    (/118\.ht|^ht-\d{2}\b/i.test(String(row.sku ?? row.model ?? "")) ||
      (/geri toplam/.test(blob) && /118\.ht|ht-\d|hortum/.test(blob)))
  );
}

function isSenoxOnYikamaDusuRow(row: AdminUrunRow): boolean {
  const blob = norm(`${row.ad ?? ""} ${row.sku ?? ""} ${row.model ?? ""}`);
  if (isSenoxYerYikamaHortumuRow(row)) return false;
  return (
    isSenoxKatalogMarka(row.marka_ad) &&
    (/on yikama dus|ön yikama duş|pre.?rinse/.test(blob) ||
      isSenoxDusSpreyiRow(row))
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

function isSenoxMeyveSikacagiRow(row: AdminUrunRow): boolean {
  const blob = norm(`${row.ad ?? ""} ${row.sku ?? ""} ${row.model ?? ""}`);
  return (
    isSenoxKatalogMarka(row.marka_ad) &&
    (/118\.km|kati meyve|katı meyve|km01|kmp/i.test(blob) ||
      /^118\.(KM|KMP)/i.test(String(row.sku ?? "")))
  );
}

function pickSenoxMeyveSikacagiSku(isim: string): string {
  const n = norm(isim);
  if (/kmp|pres\b|presi/.test(n) && !/km01|km-01/.test(n)) return "118.KMP.01";
  return "118.KM01";
}

function isSenoxMikrodalgaRow(row: AdminUrunRow): boolean {
  const blob = norm(`${row.ad ?? ""} ${row.sku ?? ""} ${row.model ?? ""}`);
  return (
    isSenoxKatalogMarka(row.marka_ad) &&
    (/mikrodalga|microwave|118\.mc/i.test(blob) ||
      /^118\.MC/i.test(String(row.sku ?? "")))
  );
}

function pickSenoxMikrodalgaSku(isim: string): string {
  const n = norm(isim);
  if (/25\s*lt|mc-?25|mc25|26[,.]8|45[,.]2/.test(n)) return "118.MC25";
  return "118.MC30";
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

function pickYerYikamaHortumuSku(isim: string, notlar?: string | null): string {
  const blob = norm(`${isim} ${notlar ?? ""}`);
  const len = hoseLengthMFromIsim(blob);
  if (len != null && len >= 15) return "118.HT.15";
  if (len != null && len >= 12) return "118.HT.12";
  return "118.HT.10";
}

function pickDusSpreySku(isim: string): string {
  const n = norm(isim);
  if (/tezgah|tezgaha/.test(n)) {
    return /ara musluk|ara musluğu/.test(n) ? "118.T.02" : "118.TM.01";
  }
  return "118.DM.02";
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

/** Geri toplamalı yer yıkama hortumu — Şenox 118.HT.10 / .12 / .15 */
export async function matchSenoxYerYikamaHortumuByReferans(
  isim: string,
  notlar?: string | null,
): Promise<EslesmisUrun | null> {
  const targetSku = pickYerYikamaHortumuSku(isim, notlar);
  const rows = (await loadLegacyCatalogRows()).filter(
    (r) =>
      r.durum === "aktif" &&
      isSenoxKatalogMarka(r.marka_ad) &&
      isSenoxYerYikamaHortumuRow(r),
  );

  const exact =
    rows.find(
      (r) =>
        String(r.sku ?? "").toUpperCase() === targetSku.toUpperCase() ||
        String(r.model ?? "").toUpperCase() === targetSku.replace(/^118\./, "").toUpperCase(),
    ) ?? rows.find((r) => isSenoxYerYikamaHortumuRow(r));

  if (exact && (exact.fiyat_tl > 0 || equstoSatisEurFromRow(exact))) {
    const matched = rowToSenoxEslesmis(exact, isim);
    return { ...matched, ad: isim.trim() || matched.ad };
  }

  const mutbex = await loadSenoxMutbexProducts();
  const pick =
    mutbex.find(
      (p) =>
        String(p.mutbexCode ?? "").toUpperCase() === targetSku.toUpperCase(),
    ) ??
    mutbex.find((p) =>
      /118\.ht|geri toplam|yer yikama hortum/i.test(String(p.title ?? "")),
    );
  if (!pick) return null;
  const matched = mutbexToEslesmis(pick, isim);
  return { ...matched, ad: isim.trim() || matched.ad };
}

/** Ön yıkama duşu / sprey ünitesi — Şenox DM / T / TM (HT hortum değil) */
export async function matchSenoxOnYikamaDusuByReferans(
  isim: string,
): Promise<EslesmisUrun | null> {
  const targetSku = pickDusSpreySku(isim);
  const rows = (await loadLegacyCatalogRows()).filter(
    (r) =>
      r.durum === "aktif" &&
      isSenoxKatalogMarka(r.marka_ad) &&
      isSenoxDusSpreyiRow(r),
  );

  const exact =
    rows.find(
      (r) =>
        String(r.sku ?? "").toUpperCase() === targetSku.toUpperCase() ||
        String(r.model ?? "").toUpperCase() === targetSku.replace(/^118\./, "").toUpperCase(),
    ) ?? rows.find((r) => isSenoxDusSpreyiRow(r));

  if (exact && (exact.fiyat_tl > 0 || equstoSatisEurFromRow(exact))) {
    const matched = rowToSenoxEslesmis(exact, isim);
    return { ...matched, ad: isim.trim() || matched.ad };
  }

  const mutbex = await loadSenoxMutbexProducts();
  const pick =
    mutbex.find(
      (p) =>
        String(p.mutbexCode ?? "").toUpperCase() === targetSku.toUpperCase(),
    ) ??
    mutbex.find((p) =>
      /du[sş] sprey|dus sprey|sprey unitesi|118\.dm|118\.t\./i.test(
        String(p.title ?? ""),
      ),
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

/** Dilimleme makinesi — Şenox */
export async function matchSenoxDilimlemeByReferans(
  isim: string,
): Promise<EslesmisUrun | null> {
  const mutbexList = await loadSenoxMutbexProducts();
  const pick = mutbexList.find(
    (p) =>
      p.mutbexCode === "118.AAMH300" ||
      /aamh300|aamh-300|dilimleme/i.test(norm(p.title ?? "")),
  );
  if (!pick) return null;

  return mutbexToEslesmis(pick, isim);
}

/** Katı meyve sıkacağı / presi — Şenox KM01 (varsayılan) / KMP.01 */
export async function matchSenoxMeyveSikacagiByReferans(
  isim: string,
): Promise<EslesmisUrun | null> {
  const targetSku = pickSenoxMeyveSikacagiSku(isim);
  const rows = (await loadLegacyCatalogRows()).filter(
    (r) =>
      r.durum === "aktif" &&
      isSenoxKatalogMarka(r.marka_ad) &&
      isSenoxMeyveSikacagiRow(r),
  );

  const exact =
    rows.find(
      (r) => String(r.sku ?? "").toUpperCase() === targetSku.toUpperCase(),
    ) ??
    rows.find((r) => /118\.KM01/i.test(String(r.sku ?? ""))) ??
    rows.find((r) => isSenoxMeyveSikacagiRow(r));

  if (exact && (exact.fiyat_tl > 0 || equstoSatisEurFromRow(exact))) {
    const matched = rowToSenoxEslesmis(exact, isim);
    return { ...matched, ad: isim.trim() || matched.ad };
  }

  const mutbex = await loadSenoxMutbexProducts();
  const pick =
    mutbex.find(
      (p) =>
        String(p.mutbexCode ?? "").toUpperCase() === targetSku.toUpperCase(),
    ) ??
    mutbex.find((p) =>
      /kati meyve|katı meyve|118\.km/i.test(String(p.title ?? "")),
    );
  if (pick) {
    const matched = mutbexToEslesmis(pick, isim);
    return { ...matched, ad: isim.trim() || matched.ad };
  }

  const products = await loadSenoxCatalogProducts(/km01|kati meyve|meyve sik/i);
  const cat =
    products.find((p) => /km01/i.test(norm(p.model ?? ""))) ?? products[0];
  return cat ? senoxProductToEslesmis(cat, isim) : null;
}

/** Mikrodalga fırın — Şenox MC30 (varsayılan 30L) / MC25 */
export async function matchSenoxMikrodalgaByReferans(
  isim: string,
): Promise<EslesmisUrun | null> {
  const targetSku = pickSenoxMikrodalgaSku(isim);
  const rows = (await loadLegacyCatalogRows()).filter(
    (r) =>
      r.durum === "aktif" &&
      r.fiyat_tl > 0 &&
      isSenoxMikrodalgaRow(r),
  );

  const exact =
    rows.find(
      (r) => String(r.sku ?? "").toUpperCase() === targetSku.toUpperCase(),
    ) ??
    rows.find((r) =>
      /mc30|mc-30/i.test(String(r.sku ?? r.model ?? "")),
    ) ??
    rows[0];

  if (exact) {
    const matched = rowToSenoxEslesmis(exact, isim);
    return { ...matched, ad: isim.trim() || matched.ad };
  }

  const mutbex = await loadSenoxMutbexProducts();
  const pick =
    mutbex.find(
      (p) =>
        String(p.mutbexCode ?? "").toUpperCase() === targetSku.toUpperCase(),
    ) ??
    mutbex.find((p) => /mikrodalga|mc30|mc-30/i.test(String(p.title ?? "")));
  if (pick) {
    const matched = mutbexToEslesmis(pick, isim);
    return { ...matched, ad: isim.trim() || matched.ad };
  }

  const products = await loadSenoxCatalogProducts(/mikrodalga|mc30|mc25/i);
  const cat =
    products.find((p) =>
      targetSku.includes("MC25")
        ? /mc25/i.test(norm(p.model ?? ""))
        : /mc30/i.test(norm(p.model ?? "")),
    ) ?? products[0];
  return cat ? senoxProductToEslesmis(cat, isim) : null;
}

/** Şenox katalog eşlemesi — el yıkama, sinek, vakum, dilimleme */
export async function matchSenoxByReferans(
  isim: string,
  urunTipi?: string | null,
  notlar?: string | null,
): Promise<EslesmisUrun | null> {
  if (isSenoxElYikamaReferansIsim(isim)) {
    const el = await matchSenoxElYikamaByReferans(isim);
    if (el) return el;
  }
  if (isSenoxSinekReferansIsim(isim)) {
    const sinek = await matchSenoxSinekByReferans(isim);
    if (sinek) return sinek;
  }
  if (isSenoxYerYikamaHortumuReferansIsim(isim, notlar)) {
    const hortum = await matchSenoxYerYikamaHortumuByReferans(isim, notlar);
    if (hortum) return hortum;
  }
  if (isSenoxOnYikamaDusuReferansIsim(isim, notlar)) {
    const dus = await matchSenoxOnYikamaDusuByReferans(isim);
    if (dus) return dus;
  }
  if (isSenoxMeyveSikacagiReferansIsim(isim, urunTipi, notlar)) {
    const sikac = await matchSenoxMeyveSikacagiByReferans(isim);
    if (sikac) return sikac;
  }
  if (isSenoxMikrodalgaReferansIsim(isim, urunTipi)) {
    const mikrodalga = await matchSenoxMikrodalgaByReferans(isim);
    if (mikrodalga) return mikrodalga;
  }
  if (isSenoxVakumPfosKalem({ isim, urunTipi })) {
    return matchSenoxVakumByReferans(isim);
  }
  if (isSenoxDilimlemeReferansIsim(isim) || urunTipi === "dilimleme_makinesi") {
    return matchSenoxDilimlemeByReferans(isim);
  }
  return null;
}

/** Test / katalog yenileme */
export function invalidateSenoxVakumCache(): void {
  senoxCatalogCache = null;
  senoxMutbexCache = null;
}
