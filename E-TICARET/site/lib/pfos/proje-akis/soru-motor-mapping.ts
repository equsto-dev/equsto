/**
 * A şıkkı — soru cevapları → motor girdisi eşlemesi.
 * Konsept tanımı (shopTypes) Adem tarafında; burada yalnızca soru → alan haritası.
 */

import { DUKKAN_SECIM_ESLEME } from "@/lib/pfos/proje-akis/konsept-tanimlari";

export { DUKKAN_SECIM_ESLEME };

export type SoruCevapHaritasi = {
  q_meslek?: string;
  q_ust_segment?: string;
  q_franchise_marka?: string;
  q_dukkan_turu?: string;
  q_balik_alt?: string;
  q_fast_alt?: string;
  q_servis_model?: string;
  q_ne_pisireceksin?: string | string[];
  q_m2?: number | string;
  q_lokasyon?: string;
  q_acik_adres?: string;
  q_karar?: string;
};

export type MotorGirdi = {
  ustSegment: string;
  dukkanSecim: string;
  altTip?: string;
  menuHatlari: string[];
  m2: number;
  lokasyon: string;
  adresNot: string;
  franchiseMarka?: string;
  karar: string;
};

function menuDizi(v: string | string[] | undefined): string[] {
  if (Array.isArray(v)) return v.filter(Boolean);
  if (v && String(v).trim()) return [String(v)];
  return [];
}

function m2Sayi(v: number | string | undefined): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export type ShopTypeMotorRow = {
  pfos?: {
    motorSlug?: string;
    dukkanSecim?: string;
    m2Min?: number;
    m2Max?: number;
    durum?: string;
  };
};

/** shopTypes tablosundan motor slug (Adem konsept verisi) */
export function dukkanSecimdenMotorSlug(
  dukkanSecim: string,
  shopTypes: ShopTypeMotorRow[],
): string | null {
  const d = dukkanSecim.trim();
  if (!d) return null;
  const hit = shopTypes.find((s) => s.pfos?.dukkanSecim === d);
  const slug = hit?.pfos?.motorSlug?.trim();
  return slug || null;
}

/** Soru cevaplarından teklif motoruna gidecek normalize edilmiş girdi */
export function soruCevaplarindanMotorGirdi(
  c: SoruCevapHaritasi,
): MotorGirdi {
  const dukkan = String(c.q_dukkan_turu ?? "").trim();
  const balikAlt = String(c.q_balik_alt ?? "").trim();
  const fastAlt = String(c.q_fast_alt ?? "").trim();

  let altTip: string | undefined;
  if (dukkan === "Balık Restaurant" && balikAlt) altTip = balikAlt;
  else if (
    String(c.q_ust_segment ?? "").includes("Fast Food") &&
    fastAlt
  )
    altTip = fastAlt;

  return {
    ustSegment: String(c.q_ust_segment ?? ""),
    dukkanSecim: DUKKAN_SECIM_ESLEME[dukkan] ?? dukkan,
    altTip,
    menuHatlari: menuDizi(c.q_ne_pisireceksin),
    m2: m2Sayi(c.q_m2),
    lokasyon: String(c.q_lokasyon ?? "").trim(),
    adresNot: String(c.q_acik_adres ?? "").trim(),
    franchiseMarka: String(c.q_franchise_marka ?? "").trim() || undefined,
    karar: String(c.q_karar ?? ""),
  };
}
