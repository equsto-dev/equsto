/**
 * TCMB today.xml → EUR efektif satış (BanknoteSelling)
 * CLI: node scripts/fetch-tcmb-kur.mjs
 * Çıktı: { rate, tcmbDate, fallback }
 */
const TCMB_URL = "https://www.tcmb.gov.tr/kurlar/today.xml";

function fallbackRate() {
  const n = Number(process.env.EQUSTO_EUR_TRY_FALLBACK ?? process.env.EQUSTO_EUR_TRY ?? "36");
  return Number.isFinite(n) && n > 0 ? n : 36;
}

function parseXml(xml) {
  const tarih = xml.match(/<Tarih_Date[^>]*\bTarih="([^"]+)"/i)?.[1] ?? "";
  const eur = xml.match(/<Currency[^>]*\bKod="EUR"[^>]*>([\s\S]*?)<\/Currency>/i);
  const selling = eur?.[1]?.match(/<BanknoteSelling>([\d.]+)<\/BanknoteSelling>/i)?.[1];
  const rate = Number(selling);
  if (!Number.isFinite(rate) || rate <= 0) throw new Error("EUR BanknoteSelling parse hatası");
  return { rate, tcmbDate: tarih, fallback: false };
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

if (process.argv[1]?.endsWith("fetch-tcmb-kur.mjs")) {
  const kur = await fetchTcmbEurRate();
  console.log(JSON.stringify(kur, null, 2));
}
