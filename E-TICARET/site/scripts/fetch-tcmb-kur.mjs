/**
 * TCMB today.xml → EUR efektif satış (BanknoteSelling)
 * CLI: node scripts/fetch-tcmb-kur.mjs
 * Çıktı: { rate, tcmbDate, fallback }
 */
const TCMB_URL = "https://www.tcmb.gov.tr/kurlar/today.xml";

function fallbackRate() {
  const n = Number(process.env.EQUSTO_EUR_TRY_FALLBACK ?? process.env.EQUSTO_EUR_TRY ?? "53.05");
  return Number.isFinite(n) && n > 0 ? n : 53.05;
}

function parseXmlEurUsd(xml) {
  const tarih = xml.match(/<Tarih_Date[^>]*\bTarih="([^"]+)"/i)?.[1] ?? "";
  const eurBlock = xml.match(/<Currency[^>]*\bKod="EUR"[^>]*>([\s\S]*?)<\/Currency>/i);
  const usdBlock = xml.match(/<Currency[^>]*\bKod="USD"[^>]*>([\s\S]*?)<\/Currency>/i);
  const eurSelling = eurBlock?.[1]?.match(/<BanknoteSelling>([\d.]+)<\/BanknoteSelling>/i)?.[1];
  const usdSelling = usdBlock?.[1]?.match(/<BanknoteSelling>([\d.]+)<\/BanknoteSelling>/i)?.[1];
  const eur = Number(eurSelling);
  const usd = Number(usdSelling);
  if (!Number.isFinite(eur) || eur <= 0) throw new Error("EUR BanknoteSelling parse hatası");
  return { eur, usd: Number.isFinite(usd) && usd > 0 ? usd : null, tcmbDate: tarih };
}

function parseXml(xml) {
  const { eur, tcmbDate } = parseXmlEurUsd(xml);
  return { rate: eur, tcmbDate, fallback: false };
}

export async function fetchTcmbEurRate() {
  try {
    const res = await fetch(TCMB_URL, {
      headers: { "User-Agent": "EQUSTO/1.0 (+https://equsto.com)" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return parseXml(await res.text());
  } catch (e) {
    console.warn("[fetch-tcmb-kur] fallback:", e?.message || e);
    return { rate: fallbackRate(), tcmbDate: "", fallback: true };
  }
}

function fallbackUsdRate() {
  const n = Number(process.env.EQUSTO_USD_TRY_FALLBACK ?? process.env.EQUSTO_USD_TRY ?? "40.5");
  return Number.isFinite(n) && n > 0 ? n : 40.5;
}

export async function fetchTcmbUsdRate() {
  try {
    const res = await fetch(TCMB_URL, {
      headers: { "User-Agent": "EQUSTO/1.0 (+https://equsto.com)" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { usd, tcmbDate } = parseXmlEurUsd(await res.text());
    if (!usd) throw new Error("USD BanknoteSelling parse hatası");
    return { rate: usd, tcmbDate, fallback: false };
  } catch (e) {
    console.warn("[fetch-tcmb-kur] USD fallback:", e?.message || e);
    return { rate: fallbackUsdRate(), tcmbDate: "", fallback: true };
  }
}

/** Tek istekte EUR + USD (Vosco USD→EUR dönüşümü için). */
export async function fetchTcmbEurUsdRates() {
  try {
    const res = await fetch(TCMB_URL, {
      headers: { "User-Agent": "EQUSTO/1.0 (+https://equsto.com)" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { eur, usd, tcmbDate } = parseXmlEurUsd(await res.text());
    if (!usd) throw new Error("USD BanknoteSelling parse hatası");
    return {
      eurTry: eur,
      usdTry: usd,
      usdEur: usd / eur,
      tcmbDate,
      fallback: false,
    };
  } catch (e) {
    console.warn("[fetch-tcmb-kur] EUR+USD fallback:", e?.message || e);
    const eurTry = fallbackRate();
    const usdTry = fallbackUsdRate();
    return {
      eurTry,
      usdTry,
      usdEur: usdTry / eurTry,
      tcmbDate: "",
      fallback: true,
    };
  }
}

if (process.argv[1]?.endsWith("fetch-tcmb-kur.mjs")) {
  const kur = await fetchTcmbEurRate();
  console.log(JSON.stringify(kur, null, 2));
}
