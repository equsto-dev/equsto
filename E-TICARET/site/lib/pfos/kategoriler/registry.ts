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
      { id: "100-300", label: "100–300 m² (≤150 m²)", referansM2: 200 },
      { id: "150-300", label: "150–300 m² (>150 m²)", referansM2: 225 },
    ],
  },
  {
    id: "all-day-dining-cafe",
    label: "All Day Dining Cafe",
    ustKategori: "Restoran",
    planNot: "proje-veri/19 THEHOUSE CAFE 150-300 m2.xlsx · THC 200–400",
    bantlar: [{ id: "150-300", label: "150–300 m²", referansM2: 225 }],
  },
  {
    id: "kokteyl-kahve",
    label: "Kokteyl + Kahve",
    ustKategori: "Bar & Lounge",
    planNot: "PFOS/veri/no fish today urun_listesi.xlsx",
    bantlar: [{ id: "30-50", label: "30–50 m²", referansM2: 40 }],
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
  {
    id: "pastane",
    label: "Pastane",
    ustKategori: "Pastane & Fırın",
    planNot: "proje-veri/14-PASTANE.xlsx",
    bantlar: [
      { id: "100-200", label: "100–200 m²", referansM2: 150 },
    ],
  },
  {
    id: "pideci",
    label: "Pideci",
    ustKategori: "Restaurant",
    planNot: "proje-veri/PIDECI 100-250m2.xlsx",
    bantlar: [{ id: "100-250", label: "100–250 m²", referansM2: 175 }],
  },
  {
    id: "sushi",
    label: "Sushi",
    ustKategori: "Restoran",
    planNot: "proje-veri/06 SUSHI 40-100 m2.xlsx",
    bantlar: [{ id: "40-100", label: "40–100 m²", referansM2: 70 }],
  },
  {
    id: "sarkuteri-kiosk",
    label: "Şarküteri Kiosk",
    ustKategori: "Restoran",
    planNot: "proje-veri/7 ŞARKÜTERİ - KIOSK.xlsx",
    bantlar: [{ id: "kiosk", label: "Kiosk referans", referansM2: 45 }],
  },
  {
    id: "hamburger-kiosk",
    label: "Hamburger Kiosk",
    ustKategori: "Fast Food / QSR",
    planNot: "proje-veri/8 HAMBURGER-60-150 m2 - Kopya.xlsx",
    bantlar: [{ id: "60-100", label: "60–100 m²", referansM2: 80 }],
  },
  {
    id: "hotdog-kiosk",
    label: "Hotdog Kiosk",
    ustKategori: "Fast Food / QSR",
    planNot: "proje-veri/13 HOTDOG.xlsx",
    bantlar: [{ id: "kiosk", label: "Kiosk referans", referansM2: 40 }],
  },
  {
    id: "tavukcu",
    label: "Tavukçu",
    ustKategori: "Restoran",
    planNot: "proje-veri/17 TAVUKCU.xlsx",
    bantlar: [{ id: "80-150", label: "80–150 m²", referansM2: 115 }],
  },
  {
    id: "pizzaci",
    label: "Pizzacı",
    ustKategori: "Restaurant",
    planNot: "proje-veri/pizzaci-80-200m2.xlsx · pizzaci-200-500-m2.xlsx",
    bantlar: [
      { id: "80-200", label: "80–200 m²", referansM2: 140 },
      { id: "200-500", label: "200–500 m²", referansM2: 350 },
    ],
  },
  {
    id: "restoran",
    label: "Büyük Restoran",
    ustKategori: "Restoran",
    planNot: "proje-veri/RESTORAN.xlsx · düğün · büyük rezervasyon · eğlence",
    bantlar: [{ id: "500-1000", label: "500–1000 m²", referansM2: 750 }],
  },
  {
    id: "kebap-ortadogu",
    label: "Kebap & Ortadoğu Mutfağı",
    ustKategori: "Restaurant",
    planNot: "Zone şablonu (CZN Burak referansı)",
    bantlar: [
      { id: "300-500", label: "300–500 m²", referansM2: 400 },
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
