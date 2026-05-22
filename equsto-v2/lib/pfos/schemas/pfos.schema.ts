/**
 * PFOS API — istek / yanıt tipleri (Downloads index.ts ile uyumlu)
 */

export type FiyatStratejisi = "ekonomik" | "orta" | "premium";

export type PFOSRequest = {
  konsept: string;
  m2: number;
  fiyatStratejisi?: FiyatStratejisi;
  sehir?: string;
};

export type EslesmisUrun = {
  id: string;
  sku: string | null;
  ad: string;
  marka: string;
  model: string | null;
  elektrikGucuKw: number | null;
  gazGucuKw: number | null;
  /** Kanonik satış fiyatı (TRY) */
  fiyat: number;
  doviz: "EUR" | "TRY" | "USD";
  gorselUrl: string | null;
  slug?: string;
};

export type PFOSKalemi = {
  poz: string;
  kategoriKodu: string;
  altKategori: string;
  urunTipi: string;
  isim: string;
  tip: "zorunlu" | "tavsiye" | "opsiyonel";
  opsiyonelSebep?: string;
  adet: number;
  elektrikGucuKwHint?: number;
  gazGucuKwHint?: number;
  notlar?: string;
  urun: EslesmisUrun | null;
};

export type PFOSOzet = {
  toplamElektrikKw: number;
  toplamGazKw: number;
  toplamFiyat: number | null;
  doviz: "EUR" | "TRY" | "USD";
  eslesmeSayisi: number;
  toplamKalemSayisi: number;
  zorunluKalemSayisi: number;
  eslesmisZorunluSayisi: number;
};

export type PFOSResponse = {
  konsept: string;
  konseptLabel: string;
  m2: number;
  sehir?: string;
  guvenSkoru: number;
  kalemler: PFOSKalemi[];
  ozet: PFOSOzet;
  uyarilar: string[];
};

export const KONSEPT_LABELS: Record<string, string> = {
  "coffee-shop": "Coffee Shop",
  pizzaci: "Pizzacı",
  "turk-restoran": "Türk Restoranı",
  meyhane: "Meyhane / Mezeli Restoran",
  "kebap-ortadogu": "Kebap & Ortadoğu Mutfağı",
};
