import type { FiyatStratejisi } from "@/lib/pfos/schemas/pfos.schema";

/**
 * Teklif şablonu (v14) — iş kuralları
 *
 * İlk yıl vitrin: müşteriye kategori başına sınırlı marka paneli sunulur.
 * Motor şimdilik kalem başına tek ürün seçer; çok markalı alternatif satırlar
 * sonraki fazda eklenecek.
 */
export const TEKLIF_ILK_YIL = true;

/** UI kaldırıldı — motor varsayılanı (orta segment, tek aday) */
export const TEKLIF_DEFAULT_FIYAT_STRATEJISI: FiyatStratejisi = "orta";

/** Kategori / departman başına önerilecek farklı marka sayısı (min–max) */
export const TEKLIF_MARKA_PANELI: Record<
  string,
  { label: string; min: number; max: number; ornekMarkalar?: string }
> = {
  pisirme: {
    label: "Pişirme ekipmanları",
    min: 3,
    max: 4,
    ornekMarkalar: "Öztiryakiler, Atalay, Inoksan, …",
  },
  kahve: {
    label: "Kahve makineleri",
    min: 3,
    max: 4,
    ornekMarkalar: "Nuova Simonelli, WMF, …",
  },
  sogutma: {
    label: "Soğutma",
    min: 3,
    max: 4,
  },
  yikama: {
    label: "Yıkama",
    min: 2,
    max: 3,
  },
  hazirlik: {
    label: "Hazırlık",
    min: 3,
    max: 4,
  },
  icecek: {
    label: "İçecek",
    min: 2,
    max: 3,
  },
};

export const TEKLIF_SABLON_NOTLARI: string[] = [
  "İlk yıl teklif şablonu: kategori başına sınırlı marka paneli (çoğunlukla 3–4 marka).",
  "Pişirme ve kahve hatlarında müşteriye 3–4 alternatif marka gösterilir; fiyat tek satırda özetlenir.",
  "Geniş marka listesi ve premium alternatifler 2. yıl / uzman onaylı teklif akışına bırakılır.",
];

export function teklifMarkaPaneliOzeti(): string {
  return Object.values(TEKLIF_MARKA_PANELI)
    .map((p) => `${p.label}: ${p.min}–${p.max} marka`)
    .join(" · ");
}
