import type { PfosKategoriTanim } from "./types";

/** Sabit kategori + m² bant tanımları (proje-veri listeleri ile uyumlu) */
export const PFOS_KATEGORI_TANIMLARI: PfosKategoriTanim[] = [
  {
    id: "steakhouse",
    label: "Steakhouse",
    ustKategori: "Restaurant",
    planNot: "STEAKHOUSE/STEAKHOUSE-PLAN.pdf",
    bantlar: [
      { id: "80-150", label: "80–150 m²", referansM2: 115 },
      { id: "150-250", label: "150–250 m²", referansM2: 200 },
    ],
  },
  {
    id: "balikci",
    label: "Balıkçı",
    ustKategori: "Restaurant",
    planNot: "2 BALIKCI-PLAN.pdf",
    bantlar: [
      { id: "mahalle", label: "Mahalle balıkçı", referansM2: 80 },
      { id: "80-150", label: "80–150 m²", referansM2: 115 },
      { id: "150-250", label: "150–250 m²", referansM2: 200 },
    ],
  },
  {
    id: "coffee-shop",
    label: "Coffee Shop",
    ustKategori: "Kafe",
    planNot: "proje-veri/coffee-shop-ekipman-listesi.xlsx",
    bantlar: [
      {
        id: "referans",
        label: "Referans liste (Espressolab)",
        referansM2: 120,
      },
    ],
  },
  {
    id: "italyan",
    label: "İtalyan Restoran",
    ustKategori: "Restaurant",
    planNot: "proje-veri/03-italyan 100-300 m2.xlsx",
    bantlar: [
      { id: "100-300", label: "100–300 m²", referansM2: 200 },
    ],
  },
  {
    id: "birahane",
    label: "Birahane",
    ustKategori: "Bar & Lounge",
    planNot: "proje-veri/11 BIRAHANE.xlsx",
    bantlar: [
      { id: "100-300", label: "100–300 m²", referansM2: 200 },
    ],
  },
];

export function findKategoriTanim(kategoriId: string) {
  return PFOS_KATEGORI_TANIMLARI.find((k) => k.id === kategoriId);
}

export function findBantTanim(kategoriId: string, bantId: string) {
  const k = findKategoriTanim(kategoriId);
  return k?.bantlar.find((b) => b.id === bantId);
}

export function listeDosyaAdi(kategoriId: string, bantId: string) {
  return `${kategoriId}-${bantId}.json`;
}
