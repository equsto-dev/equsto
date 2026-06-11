/**
 * Kafe matris slot kuralları — ortak slot analizi + matris hücre mantığı
 */

import type { KafeOlcek, KafeSlotDef, KafeYogunluk } from "../../matrix/kafe.types";

/** Tüm kafe hücrelerinde geçerli çekirdek (Y1+) */
export const KAFE_CEKIRDEK_SLOTS: KafeSlotDef[] = [
  {
    slotId: "espresso_makinesi",
    urunTipi: "espresso-2-grup",
    isim: "Espresso Makinası (2 Grup)",
    kategoriKodu: "A",
    altKategori: "A.1",
    tip: "zorunlu",
    scale: { type: "fixed", adet: 1 },
    elektrikGucuKwHint: 3.5,
    notlar: "Tüm kafe profillerinde zorunlu.",
  },
  {
    slotId: "kahve_degirmeni",
    urunTipi: "kahve-degirmeni",
    isim: "Profesyonel Kahve Değirmeni",
    kategoriKodu: "A",
    altKategori: "A.1",
    tip: "zorunlu",
    scale: { type: "fixed", adet: 1 },
    elektrikGucuKwHint: 0.3,
    notlar: "Espresso ile birlikte zorunlu.",
  },
  {
    slotId: "blender",
    urunTipi: "bar-blender",
    isim: "Bar Blender",
    kategoriKodu: "A",
    altKategori: "A.4",
    tip: "zorunlu",
    scale: { type: "fixed", adet: 1 },
    elektrikGucuKwHint: 0.5,
  },
  {
    slotId: "meyve_sikacagi",
    urunTipi: "kati-meyve-sikacagi",
    isim: "Katı Meyve Sıkacağı",
    kategoriKodu: "A",
    altKategori: "A.4",
    tip: "zorunlu",
    scale: { type: "fixed", adet: 1 },
    elektrikGucuKwHint: 0.4,
  },
  {
    slotId: "buz_makinesi",
    urunTipi: "buz-makinesi-90kg",
    isim: "Buz Makinası",
    kategoriKodu: "A",
    altKategori: "A.4",
    tip: "zorunlu",
    scale: { type: "fixed", adet: 1 },
    elektrikGucuKwHint: 1.2,
  },
  {
    slotId: "derin_dondurucu",
    urunTipi: "depo-derin-dondurucu",
    isim: "Depo Tipi Derin Dondurucu",
    kategoriKodu: "G",
    altKategori: "G.2",
    tip: "zorunlu",
    scale: { type: "threshold", thresholds: [
      { minM2: 0, adet: 1 },
      { minM2: 150, adet: 2 },
    ]},
    elektrikGucuKwHint: 1.5,
  },
  {
    slotId: "calisma_tezgahi",
    urunTipi: "calisma-tezgahi",
    isim: "Bar / Çalışma Tezgahı",
    kategoriKodu: "C",
    altKategori: "C.1",
    tip: "zorunlu",
    scale: { type: "threshold", thresholds: [
      { minM2: 0, adet: 4 },
      { minM2: 100, adet: 7 },
      { minM2: 150, adet: 9 },
    ]},
    notlar: "Kasa, kahve çekmeceli, evyeli modüller toplam adet.",
  },
  {
    slotId: "cop_arabasi",
    urunTipi: "cop-arabasi",
    isim: "Çöp Arabası",
    kategoriKodu: "C",
    altKategori: "C.3",
    tip: "tavsiye",
    scale: { type: "fixed", adet: 1 },
  },
];

/** Y1 — bar ağırlıklı ek slotlar */
export const KAFE_Y1_SLOTS: KafeSlotDef[] = [
  {
    slotId: "filtre_kahve",
    urunTipi: "filter-coffee-makinesi",
    isim: "Filtre Kahve Makinası",
    kategoriKodu: "A",
    altKategori: "A.2",
    tip: "tavsiye",
    scale: { type: "fixed", adet: 1 },
    yogunluk: ["Y1"],
    notlar: "Premium bar profillerinde tavsiye.",
  },
  {
    slotId: "bardak_yikama",
    urunTipi: "glass-washer",
    isim: "Bardak Yıkama Makinası",
    kategoriKodu: "H",
    altKategori: "H.2",
    tip: "tavsiye",
    scale: { type: "fixed", adet: 1 },
    yogunluk: ["Y1"],
    notlar: "Yüksek içecek hacminde zorunlu sayılır.",
  },
  {
    slotId: "sise_sogutucu",
    urunTipi: "sise-sogutucu-2-kapili",
    isim: "Şişe Soğutucu (Bar)",
    kategoriKodu: "G",
    altKategori: "G.1",
    tip: "tavsiye",
    scale: { type: "fixed", adet: 1 },
    yogunluk: ["Y1"],
  },
  {
    slotId: "setalti_buzdolabi",
    urunTipi: "setalti-buzdolabi-tek",
    isim: "Tezgah Altı Buzdolabı",
    kategoriKodu: "G",
    altKategori: "G.1",
    tip: "tavsiye",
    scale: { type: "fixed", adet: 1 },
    yogunluk: ["Y1"],
  },
];

/** Y2 — hafif mutfak / cafe-restaurant */
export const KAFE_Y2_SLOTS: KafeSlotDef[] = [
  {
    slotId: "kombi_firin",
    urunTipi: "kombi-firin-6t",
    isim: "Kombi Fırın (6 Tepsi GN)",
    kategoriKodu: "B",
    altKategori: "B.2",
    tip: "zorunlu",
    scale: { type: "threshold", thresholds: [
      { minM2: 0, adet: 1 },
      { minM2: 150, adet: 2 },
    ]},
    yogunluk: ["Y2"],
    yogunlukHaric: ["Y1"],
    elektrikGucuKwHint: 12,
  },
  {
    slotId: "davlumbaz",
    urunTipi: "davlumbaz-duvar",
    isim: "Davlumbaz (Duvar Tipi, Filtreli)",
    kategoriKodu: "B",
    altKategori: "B.1",
    tip: "zorunlu",
    scale: { type: "threshold", thresholds: [
      { minM2: 0, adet: 1 },
      { minM2: 120, adet: 2 },
    ]},
    yogunluk: ["Y2"],
    yogunlukHaric: ["Y1"],
  },
  {
    slotId: "bulasik_makinesi",
    urunTipi: "bulasik-makinesi-setalti",
    isim: "Bulaşık Yıkama Makinası (Setaltı)",
    kategoriKodu: "H",
    altKategori: "H.1",
    tip: "zorunlu",
    scale: { type: "threshold", thresholds: [
      { minM2: 0, adet: 1 },
      { minM2: 150, adet: 2 },
    ]},
    yogunluk: ["Y2"],
    yogunlukHaric: ["Y1"],
    elektrikGucuKwHint: 6.5,
  },
  {
    slotId: "depo_buzdolabi",
    urunTipi: "depo-buzdolabi-tek-kapili",
    isim: "Depo Tipi Buzdolabı",
    kategoriKodu: "G",
    altKategori: "G.1",
    tip: "tavsiye",
    scale: { type: "fixed", adet: 1 },
    yogunluk: ["Y2", "Y3"],
    yogunlukHaric: ["Y1"],
  },
  {
    slotId: "yer_izgarasi",
    urunTipi: "yer-izgara-kucuk",
    isim: "Yer Izgarası",
    kategoriKodu: "B",
    altKategori: "B.3",
    tip: "zorunlu",
    scale: { type: "threshold", thresholds: [
      { minM2: 0, adet: 2 },
      { minM2: 120, adet: 3 },
      { minM2: 150, adet: 4 },
    ]},
    yogunluk: ["Y2"],
    yogunlukHaric: ["Y1"],
  },
  {
    slotId: "pisirme_izgara",
    urunTipi: "yer-izgara",
    isim: "Pişirme Izgara / Ocak",
    kategoriKodu: "B",
    altKategori: "B.3",
    tip: "tavsiye",
    scale: { type: "fixed", adet: 1 },
    yogunluk: ["Y2"],
    yogunlukHaric: ["Y1"],
  },
  {
    slotId: "fritoz",
    urunTipi: "fritoz-tek",
    isim: "Fritöz (Tek Sepetli)",
    kategoriKodu: "B",
    altKategori: "B.4",
    tip: "tavsiye",
    scale: { type: "fixed", adet: 1 },
    yogunluk: ["Y2"],
    yogunlukHaric: ["Y1"],
  },
];

/** Y3 — pastane / tatlı / kahvaltı */
export const KAFE_Y3_SLOTS: KafeSlotDef[] = [
  {
    slotId: "konveksiyon_firin",
    urunTipi: "konveksiyon-firin-pastane",
    isim: "Konveksiyon Fırın (Pastane)",
    kategoriKodu: "D",
    altKategori: "D.1",
    tip: "zorunlu",
    scale: { type: "fixed", adet: 1 },
    yogunluk: ["Y3"],
    yogunlukHaric: ["Y1", "Y2"],
    notlar: "Y3 profilde kombi fırın yerine veya yanında.",
  },
  {
    slotId: "soguk_teshir",
    urunTipi: "soguk-tesir-dolabi-pastane",
    isim: "Soğuk Teşhir Dolabı (Pasta / Tatlı)",
    kategoriKodu: "D",
    altKategori: "D.2",
    tip: "zorunlu",
    scale: { type: "threshold", thresholds: [
      { minM2: 0, adet: 1 },
      { minM2: 120, adet: 2 },
    ]},
    yogunluk: ["Y3"],
    yogunlukHaric: ["Y1"],
  },
  {
    slotId: "davlumbaz_pastane",
    urunTipi: "davlumbaz-duvar",
    isim: "Davlumbaz (Pastane Hattı)",
    kategoriKodu: "B",
    altKategori: "B.1",
    tip: "zorunlu",
    scale: { type: "fixed", adet: 1 },
    yogunluk: ["Y3"],
    yogunlukHaric: ["Y1"],
  },
  {
    slotId: "bulasik_pastane",
    urunTipi: "bulasik-makinesi-setalti",
    isim: "Bulaşık Yıkama Makinası",
    kategoriKodu: "H",
    altKategori: "H.1",
    tip: "zorunlu",
    scale: { type: "fixed", adet: 1 },
    yogunluk: ["Y3"],
    yogunlukHaric: ["Y1"],
  },
  {
    slotId: "hamur_yogurma",
    urunTipi: "hamur-yogurma",
    isim: "Hamur Yoğurma Makinası",
    kategoriKodu: "D",
    altKategori: "D.3",
    tip: "opsiyonel",
    scale: { type: "fixed", adet: 1 },
    yogunluk: ["Y3"],
    notlar: "Üretim pastane profillerinde.",
  },
];

export const KAFE_ALL_SLOTS: KafeSlotDef[] = [
  ...KAFE_CEKIRDEK_SLOTS,
  ...KAFE_Y1_SLOTS,
  ...KAFE_Y2_SLOTS,
  ...KAFE_Y3_SLOTS,
];

export function slotAppliesToYogunluk(slot: KafeSlotDef, yogunluk: KafeYogunluk): boolean {
  if (slot.yogunlukHaric?.includes(yogunluk)) return false;
  if (slot.yogunluk?.length && !slot.yogunluk.includes(yogunluk)) return false;
  return true;
}

/** Y3'te kombi fırın yerine konveksiyon; Y2'de konveksiyon yok */
export function resolveSlotsForCell(
  yogunluk: KafeYogunluk,
): KafeSlotDef[] {
  return KAFE_ALL_SLOTS.filter((s) => {
    if (!slotAppliesToYogunluk(s, yogunluk)) return false;
    if (yogunluk === "Y3" && s.slotId === "kombi_firin") return false;
    if (yogunluk === "Y2" && s.slotId === "konveksiyon_firin") return false;
    if (yogunluk === "Y1" && (s.slotId === "kombi_firin" || s.slotId === "konveksiyon_firin")) return false;
    return true;
  });
}

export function olcekFromM2(m2: number): KafeOlcek {
  if (m2 < 100) return "S1";
  if (m2 < 150) return "S2";
  return "S3";
}

export function referansM2ForOlcek(olcek: KafeOlcek): number {
  const map: Record<KafeOlcek, number> = { S1: 70, S2: 120, S3: 175 };
  return map[olcek];
}
