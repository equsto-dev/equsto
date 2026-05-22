/**
 * PFOS API Kontratı — Zod + tipler (Downloads cursor-prompt)
 */

import { z } from "zod";

export const KategoriKoduEnum = z.enum(["A", "B", "C", "D", "E", "F", "G", "H", "X"]);
export type KategoriKodu = z.infer<typeof KategoriKoduEnum>;

export const KATEGORI_LABELS: Record<KategoriKodu, string> = {
  A: "Bar & Kahve",
  B: "Sıcak Servis",
  C: "Hazırlık",
  D: "Pastane & Tatlı Hazırlık",
  E: "Soğuk Hazırlık & Salata",
  F: "Pizza Hazırlık & Servis",
  G: "Mutfak Depolama",
  H: "Mutfak Bulaşık",
  X: "Nakliye & Montaj",
};

export const KonseptEnum = z.enum([
  "all-day-dining-cafe",
  "kebap-ortadogu",
  "pizzaci",
  "meyhane",
  "turk-restoran",
  "coffee-shop",
]);
export type Konsept = z.infer<typeof KonseptEnum>;

export const KONSEPT_LABELS: Record<Konsept, string> = {
  "all-day-dining-cafe": "All Day Dining Cafe",
  "kebap-ortadogu": "Kebap & Ortadoğu Mutfağı",
  pizzaci: "Pizzacı",
  meyhane: "Meyhane / Mezeli Restoran",
  "turk-restoran": "Türk Restoranı",
  "coffee-shop": "Coffee Shop",
};

export type FiyatStratejisi = "ekonomik" | "orta" | "premium";

export const PFOSRequestSchema = z.object({
  konsept: KonseptEnum,
  m2: z.number().min(30).max(2000),
  sehir: z.string().default("istanbul"),
  lokasyon: z.enum(["cadde", "avm"]).optional(),
  fiyatStratejisi: z.enum(["ekonomik", "orta", "premium"]).default("ekonomik"),
});

export type PFOSRequest = z.infer<typeof PFOSRequestSchema>;

export const EslesmisUrunSchema = z.object({
  id: z.string(),
  sku: z.string().nullable(),
  ad: z.string(),
  marka: z.string(),
  model: z.string().nullable(),
  elektrikGucuKw: z.number().nullable(),
  gazGucuKw: z.number().nullable(),
  fiyat: z.number(),
  doviz: z.enum(["EUR", "TRY", "USD"]),
  gorselUrl: z.string().nullable(),
  slug: z.string().optional(),
});

export type EslesmisUrun = z.infer<typeof EslesmisUrunSchema>;

export const PFOSKalemiSchema = z.object({
  poz: z.string(),
  kategoriKodu: KategoriKoduEnum,
  altKategori: z.string().optional(),
  urunTipi: z.string(),
  isim: z.string(),
  tip: z.enum(["zorunlu", "tavsiye", "opsiyonel"]),
  opsiyonelSebep: z.string().optional(),
  adet: z.number(),
  elektrikGucuKwHint: z.number().optional(),
  gazGucuKwHint: z.number().optional(),
  notlar: z.string().optional(),
  urun: EslesmisUrunSchema.nullable(),
});

export type PFOSKalemi = z.infer<typeof PFOSKalemiSchema>;

export const PFOSOzetSchema = z.object({
  toplamElektrikKw: z.number(),
  toplamGazKw: z.number(),
  toplamFiyat: z.number().nullable(),
  doviz: z.enum(["EUR", "TRY", "USD"]),
  eslesmeSayisi: z.number(),
  toplamKalemSayisi: z.number(),
  zorunluKalemSayisi: z.number(),
  eslesmisZorunluSayisi: z.number(),
});

export type PFOSOzet = z.infer<typeof PFOSOzetSchema>;

export const PFOSResponseSchema = z.object({
  konsept: z.string(),
  konseptLabel: z.string(),
  m2: z.number(),
  sehir: z.string().optional(),
  guvenSkoru: z.number().min(0).max(1),
  kalemler: z.array(PFOSKalemiSchema),
  ozet: PFOSOzetSchema,
  uyarilar: z.array(z.string()),
});

export type PFOSResponse = z.infer<typeof PFOSResponseSchema>;
