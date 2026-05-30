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
  "steakhouse",
  "balikci",
  "italyan",
  "birahane",
  "pastane",
  "pideci",
  "sushi",
  "sarkuteri-kiosk",
  "hamburger-kiosk",
  "hotdog-kiosk",
  "tavukcu",
  "restoran",
]);
export type Konsept = z.infer<typeof KonseptEnum>;

export const KONSEPT_LABELS: Record<Konsept, string> = {
  "all-day-dining-cafe": "All Day Dining Cafe",
  "kebap-ortadogu": "Kebap & Ortadoğu Mutfağı",
  pizzaci: "Pizzacı",
  meyhane: "Meyhane / Mezeli Restoran",
  "turk-restoran": "Türk Restoranı",
  "coffee-shop": "Coffee Shop",
  steakhouse: "Steakhouse",
  balikci: "Balıkçı",
  italyan: "İtalyan Restoran",
  birahane: "Birahane",
  pastane: "Pastane",
  pideci: "Pideci",
  sushi: "Sushi",
  "sarkuteri-kiosk": "Şarküteri Kiosk",
  "hamburger-kiosk": "Hamburger Kiosk",
  "hotdog-kiosk": "Hotdog Kiosk",
  tavukcu: "Tavukçu",
  restoran: "Büyük Restoran",
};

export type FiyatStratejisi = "ekonomik" | "orta" | "premium";

export const PFOSRequestSchema = z.object({
  konsept: KonseptEnum,
  m2: z.number().min(30).max(2000),
  sehir: z.string().default("istanbul"),
  lokasyon: z.enum(["cadde", "avm"]).optional(),
  fiyatStratejisi: z.enum(["ekonomik", "orta", "premium"]).default("orta"),
  /** zone_key → m² (tek motor — Faz 1 API genişletmesi) */
  bolumM2: z.record(z.string(), z.number().min(0)).optional(),
  teslimatAdresi: z.string().optional(),
  projeAdi: z.string().optional(),
  musteri: z.string().optional(),
  /** Balıkçı mahalle / alt tip — referans liste seçimi */
  altTip: z.string().optional(),
});

export type PFOSRequest = z.infer<typeof PFOSRequestSchema>;

export const EslesmisUrunSchema = z.object({
  id: z.string(),
  sku: z.string().nullable(),
  ad: z.string(),
  marka: z.string(),
  model: z.string().nullable(),
  /** Katalogdan çözümlenen ölçü / kapasite metni */
  olcu: z.string().nullable().optional(),
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
  zoneKey: z.string().optional(),
  zoneLabel: z.string().optional(),
  kaynak: z.enum(["zone-catalog", "template"]).optional(),
  /** Espressolab referans poz (A1, A27 …) */
  referansPoz: z.string().optional(),
  /** Referans şablon satır sırası (poz ataması için) */
  sablonSira: z.number().optional(),
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
  bolumM2: z.record(z.string(), z.number()).optional(),
  zonesUsed: z.array(z.string()).optional(),
  teklifLayout: z
    .object({
      pozModu: z.enum(["referans", "kategori"]),
      bolum: z.object({ no: z.string(), baslik: z.string() }).optional(),
    })
    .optional(),
});

export type PFOSResponse = z.infer<typeof PFOSResponseSchema>;
