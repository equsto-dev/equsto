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
    id: "kahve-atolyesi",
    label: "Kahve Atölyesi",
    ustKategori: "Kafe / Coffee Shop",
    planNot: "2016-046 KAHVE ATÖLYESİ LAINOX/2016-046-1.xlsx",
    bantlar: [{ id: "80-150", label: "80–150 m²", referansM2: 120 }],
  },
  {
    id: "harvest-cafe",
    label: "Harvest Cafe",
    ustKategori: "Kafe / Coffee Shop",
    planNot: "2016-051 HARVEST BAHÇEŞEHİR MEFFTECH/2016-051-4.xlsx",
    bantlar: [{ id: "100-200", label: "100–200 m²", referansM2: 150 }],
  },
  {
    id: "all-sport-cafe",
    label: "All Sport Cafe",
    ustKategori: "Kafe / Coffee Shop",
    planNot: "2016-064 ALL SPORT CAFE MEFFTECH/2016-064-1.xlsx",
    bantlar: [{ id: "100-200", label: "100–200 m²", referansM2: 150 }],
  },
  {
    id: "casual-cafe",
    label: "Casual Cafe",
    ustKategori: "Kafe / Coffee Shop",
    planNot: "2017-026 BEYKENT ŞİFA CAFE/2017-026.xlsx",
    bantlar: [{ id: "50-150", label: "50–150 m²", referansM2: 100 }],
  },
  {
    id: "buyuk-yemekhane",
    label: "Büyük Yemekhane",
    ustKategori: "Catering / Kurumsal",
    planNot: "2016-070 YOZGAT YEMEKHANE LAINOX/YOZGAT YEMEK EKİPMAN.xlsx",
    bantlar: [{ id: "2000-3500", label: "2000–3500 kişi/gün", referansM2: 2750 }],
  },
  {
    id: "catering-uretim",
    label: "Üretim Fabrikası (Catering)",
    ustKategori: "Catering / Kurumsal",
    planNot: "2025-080 AKADEMİ CATERING FABRİKA/2025-080-2.xlsx",
    bantlar: [
      {
        id: "1500-2500",
        label: "1500–2500 m² · 15–30 bin yemek/gün",
        referansM2: 2000,
      },
    ],
  },
  {
    id: "guneli-pastane",
    label: "Güneli Fırın",
    ustKategori: "Pastane & Fırın",
    planNot: "2016-075 GÜNELİ FIRIN/2016-075.xlsx",
    bantlar: [{ id: "200-400", label: "200–400 m²", referansM2: 300 }],
  },
  {
    id: "sehir-otel",
    label: "Şehir Oteli (Business)",
    ustKategori: "Otel F&B",
    planNot: "2016-077 HILTON KOCAELİ LAINOX/2016-077.xlsx",
    bantlar: [{ id: "500-2000", label: "500–2000 m²", referansM2: 1000 }],
  },
  {
    id: "kiremit-akasya",
    label: "Kiremit Akasya",
    ustKategori: "Fast Food / QSR",
    planNot: "2016-085 KİREMİT AKASYA MEFFTECH/2016-085.xlsx",
    bantlar: [{ id: "100-250", label: "100–250 m²", referansM2: 175 }],
  },
  {
    id: "mus-selinoz-turk",
    label: "Türk Mutfağı — Lokanta",
    ustKategori: "Fast Food / QSR",
    planNot: "2016-101 MUŞ SELİNÖZ MİMARLIK/2016-101.xlsx",
    bantlar: [{ id: "100-250", label: "100–250 m² (Muş 101)", referansM2: 200 }],
  },
  {
    id: "kasap",
    label: "Kasap",
    ustKategori: "Şarküteri & Kasap",
    planNot: "2016-087 KASAP ORTAKLAR ROTA/2016-087 kasap.xlsx",
    bantlar: [{ id: "100-250", label: "100–250 m²", referansM2: 175 }],
  },
  {
    id: "kasap-sarkuteri",
    label: "Kasap + Şarküteri",
    ustKategori: "Şarküteri & Kasap",
    planNot: "2016-087 KASAP ORTAKLAR ROTA/2016-087.xlsx",
    bantlar: [{ id: "100-250", label: "100–250 m²", referansM2: 200 }],
  },
  {
    id: "sarkuteri-restoran",
    label: "Şarküteri Restoran",
    ustKategori: "Restoran",
    planNot: "veri/kasap-ortaklar-2016-087.xlsx (Ortaklar Rota — şarküteri restoran)",
    bantlar: [{ id: "100-250", label: "100–250 m²", referansM2: 200 }],
  },
  {
    id: "inari-bar-yemek",
    label: "Bar + Yemek",
    ustKategori: "Restoran",
    planNot: "2016-093 INARI RESTAURANT/2016-093-2.xlsx",
    bantlar: [{ id: "100-200", label: "100–200 m²", referansM2: 150 }],
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
    planNot: "proje-veri/14-PASTANE.xlsx · veri/pastane ekipman_listesi.xlsx",
    bantlar: [
      { id: "100-200", label: "100–200 m² (≤150 m²)", referansM2: 150 },
      { id: "150-250", label: "150–250 m² (>150 m²)", referansM2: 200 },
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
    label: "Restoran",
    ustKategori: "Restoran",
    planNot: "proje-veri/RESTORAN.xlsx · düğün · büyük rezervasyon · eğlence",
    bantlar: [{ id: "500-1000", label: "500–1000 m²", referansM2: 750 }],
  },
  {
    id: "kebap-ortadogu",
    label: "Kebap & Ortadoğu Mutfağı",
    ustKategori: "Restaurant",
    planNot: "2025-016 MEFTECH Orhangazi · 200-400 referans; >400 zone şablonu",
    bantlar: [
      { id: "80-200", label: "80–200 m²", referansM2: 140 },
      { id: "200-400", label: "200–400 m²", referansM2: 300 },
      { id: "300-500", label: "300–500 m²", referansM2: 400 },
    ],
  },
  {
    id: "kanatci-kebapci",
    label: "Kanatçı-Kebapçı",
    ustKategori: "Restoran",
    planNot: "kosk-kanat-2024-107.xlsx · KÖŞK KANAT Fenerbahçe",
    bantlar: [{ id: "100-250", label: "100–250 m²", referansM2: 175 }],
  },
  {
    id: "patisserie-yemek",
    label: "Patisserie + Yemek",
    ustKategori: "Restoran",
    planNot: "hamour-acarkent-2024-032.xlsx · HAMOUR Acarkent",
    bantlar: [{ id: "200-400", label: "200–400 m²", referansM2: 300 }],
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
