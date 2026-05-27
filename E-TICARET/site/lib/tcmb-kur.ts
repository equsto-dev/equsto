import { cache } from "react";
import { unstable_cache } from "next/cache";

/** TCMB günlük kur XML — EUR efektif satış = BanknoteSelling */
export const TCMB_TODAY_XML_URL = "https://www.tcmb.gov.tr/kurlar/today.xml";

export type TcmbKurSnapshot = {
  currency: "EUR";
  rateType: "efektif_satis";
  /** TCMB BanknoteSelling (1 EUR) */
  rate: number;
  /** TCMB bülten tarihi (gg.aa.yyyy) */
  tcmbDate: string;
  bulletinNo: string | null;
  sourceUrl: string;
  fetchedAt: string;
  fallback: boolean;
};

function parseTcmbEurBanknoteSelling(xml: string): {
  rate: number;
  tcmbDate: string;
  bulletinNo: string | null;
} {
  const tarihMatch = xml.match(/<Tarih_Date[^>]*\bTarih="([^"]+)"/i);
  const bulletinMatch = xml.match(/<Tarih_Date[^>]*\bBulten_No="([^"]*)"/i);
  const eurBlock = xml.match(/<Currency[^>]*\bKod="EUR"[^>]*>([\s\S]*?)<\/Currency>/i);
  if (!eurBlock) throw new Error("TCMB XML: EUR bulunamadı");
  const selling = eurBlock[1].match(/<BanknoteSelling>([\d.]+)<\/BanknoteSelling>/i);
  if (!selling) throw new Error("TCMB XML: EUR BanknoteSelling (efektif satış) yok");
  const rate = Number(selling[1]);
  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error("TCMB XML: geçersiz efektif satış kuru");
  }
  return {
    rate,
    tcmbDate: tarihMatch?.[1] ?? "",
    bulletinNo: bulletinMatch?.[1]?.trim() || null,
  };
}

function fallbackRate(): number {
  const n = Number(process.env.EQUSTO_EUR_TRY_FALLBACK ?? process.env.EQUSTO_EUR_TRY ?? "53.05");
  return Number.isFinite(n) && n > 0 ? n : 53.05;
}

/** TCMB’den canlı çeker; hata durumunda EQUSTO_EUR_TRY_FALLBACK */
export async function fetchTcmbEurEfektifSatis(): Promise<TcmbKurSnapshot> {
  const fetchedAt = new Date().toISOString();
  try {
    const res = await fetch(TCMB_TODAY_XML_URL, {
      headers: { "User-Agent": "EQUSTO/1.0 (+https://equsto.com)" },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`TCMB HTTP ${res.status}`);
    const xml = await res.text();
    const parsed = parseTcmbEurBanknoteSelling(xml);
    return {
      currency: "EUR",
      rateType: "efektif_satis",
      rate: parsed.rate,
      tcmbDate: parsed.tcmbDate,
      bulletinNo: parsed.bulletinNo,
      sourceUrl: TCMB_TODAY_XML_URL,
      fetchedAt,
      fallback: false,
    };
  } catch (e) {
    console.warn("[tcmb-kur] fetch failed, using fallback:", e);
    return {
      currency: "EUR",
      rateType: "efektif_satis",
      rate: fallbackRate(),
      tcmbDate: "",
      bulletinNo: null,
      sourceUrl: TCMB_TODAY_XML_URL,
      fetchedAt,
      fallback: true,
    };
  }
}

const TCMB_API_REVALIDATE_SEC = (() => {
  const n = Number(process.env.TCMB_KUR_REVALIDATE_SEC ?? "60");
  return Number.isFinite(n) && n >= 0 ? n : 60;
})();

/**
 * Mağaza fiyatları: her sayfa isteğinde TCMB çekilir (aynı render’da tek fetch).
 * DB’deki priceListTl yerine specs EUR × güncel kur kullanılır.
 */
export const getTcmbEurForPricing = cache(fetchTcmbEurEfektifSatis);

const getTcmbEurEfektifSatisCached = unstable_cache(
  fetchTcmbEurEfektifSatis,
  ["tcmb-eur-efektif-satis-api"],
  {
    revalidate: TCMB_API_REVALIDATE_SEC > 0 ? TCMB_API_REVALIDATE_SEC : 1,
    tags: ["tcmb-kur"],
  }
);

/** /api/kur — kısa önbellek (varsayılan 60 sn; TCMB_KUR_REVALIDATE_SEC=0 → her istekte taze) */
export async function getTcmbEurEfektifSatis(): Promise<TcmbKurSnapshot> {
  if (TCMB_API_REVALIDATE_SEC === 0) return fetchTcmbEurEfektifSatis();
  return getTcmbEurEfektifSatisCached();
}

export function formatTcmbKurShort(kur: TcmbKurSnapshot): string {
  const rate = kur.rate.toLocaleString("tr-TR", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });
  return kur.tcmbDate
    ? `TCMB efektif satış ${rate} TRY (${kur.tcmbDate})`
    : `TCMB efektif satış ${rate} TRY`;
}

export function kurToApiPayload(kur: TcmbKurSnapshot) {
  return {
    success: true,
    currency: kur.currency,
    type: kur.rateType,
    label: "TCMB Efektif Satış",
    rate: kur.rate,
    unit: 1,
    date: kur.tcmbDate,
    bulletinNo: kur.bulletinNo,
    source: kur.fallback ? "fallback" : "tcmb",
    sourceUrl: kur.sourceUrl,
    fetchedAt: kur.fetchedAt,
    fallback: kur.fallback,
  };
}
