import { TEKLIF_V14_EUR_TRY_URL } from "./constants";

export type TeklifKurSnapshot = {
  rate: number;
  date: string;
  label: string;
  fallback: boolean;
  fetchedAt?: string;
};

/** GET /api/kur — TCMB EUR efektif satış (BanknoteSelling) */
export async function fetchTcmbKurForTeklif(): Promise<TeklifKurSnapshot | null> {
  try {
    const res = await fetch(TEKLIF_V14_EUR_TRY_URL, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      rate?: number;
      date?: string;
      label?: string;
      fallback?: boolean;
      fetchedAt?: string;
    };
    const rate = Number(data.rate);
    if (!Number.isFinite(rate) || rate <= 0) return null;
    return {
      rate,
      date: String(data.date ?? ""),
      label: String(data.label ?? "TCMB Efektif Satış"),
      fallback: Boolean(data.fallback),
      fetchedAt: data.fetchedAt,
    };
  } catch {
    return null;
  }
}

export function formatTeklifKurLine(kur: TeklifKurSnapshot): string {
  const rate = kur.rate.toLocaleString("tr-TR", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });
  if (kur.date) {
    return `1 EUR = ${rate} TRY · ${kur.label} (${kur.date})`;
  }
  return `1 EUR = ${rate} TRY · ${kur.label}`;
}
