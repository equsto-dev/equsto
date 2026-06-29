import type { PfosKategoriTanim } from "./types";

/** Sabit kategori + m² bant tanımları (proje-veri listeleri ile uyumlu) */
export const PFOS_KATEGORI_TANIMLARI: PfosKategoriTanim[] = [
  {
    id: "steakhouse",
    label: "Steakhouse",
    ustKategori: "Restaurant",
    planNot: "proje-veri/80-150 m2-steakhouse-ekipman-listesi.xlsx",
    bantlar: [
      { id: "80-150", label: "80–150 m²", referansM2: 115 },
      { id: "150-250", label: "150–250 m²", referansM2: 200 },
    ],
  },
  {
    id: "balikci",
    label: "Balıkçı",
    ustKategori: "Restaurant",
    planNot: "proje-veri/MAHALLE BALIKCI-ekipman-listesi.xlsx",
    bantlar: [
      { id: "mahalle", label: "Mahalle balıkçı", referansM2: 80 },
      { id: "80-150", label: "80–150 m²", referansM2: 115 },
      { id: "150-250", label: "150–250 m² (Uçan Balık)", referansM2: 200 },
      { id: "350-600", label: "350–600 m² (Dudak Payı 2017-191)", referansM2: 475 },
    ],
  },
  {
    id: "coffee-shop",
    label: "Coffee Shop",
    ustKategori: "Kafe / Coffee Shop",
    planNot: "proje-veri/2016-114 ESPRESOLAB WATERGARDEN/2016-114-1.xlsx",
    bantlar: [
      { id: "referans", label: "Espressolab Watergarden referans", referansM2: 120 },
      { id: "ikinciplan", label: "İKİNCİPLAN Kafe (2024-054)", referansM2: 100 },
    ],
  },
  {
    id: "italyan",
    label: "İtalyan Restoran",
    ustKategori: "Restaurant",
    planNot: "proje-veri/03-italyan 100-300 m2.xlsx",
    bantlar: [
      { id: "100-300", label: "100–300 m²", referansM2: 200 },
      { id: "150-300", label: "150–300 m² (Havelka)", referansM2: 225 },
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
  {
    id: "pastane",
    label: "Pastane",
    ustKategori: "Pastane & Fırın",
    planNot: "proje-veri/14-PASTANE.xlsx",
    bantlar: [
      { id: "100-200", label: "100–200 m²", referansM2: 150 },
      { id: "150-250", label: "150–250 m²", referansM2: 200 },
    ],
  },
  {
    id: "pizzaci",
    label: "Pizzacı",
    ustKategori: "Restaurant",
    planNot: "proje-veri/pizzaci-80-200m2.xlsx",
    bantlar: [
      { id: "80-200", label: "80–200 m²", referansM2: 140 },
      { id: "200-500", label: "200–500 m²", referansM2: 350 },
    ],
  },
  {
    id: "pideci",
    label: "Pideci",
    ustKategori: "Restoran",
    planNot: "proje-veri/PIDECI 100-250m2.xlsx",
    bantlar: [
      { id: "100-250", label: "100–250 m²", referansM2: 175 },
    ],
  },
  {
    id: "sushi",
    label: "Sushi",
    ustKategori: "Restoran",
    planNot: "proje-veri/06 SUSHI 40-100 m2.xlsx",
    bantlar: [
      { id: "40-100", label: "40–100 m²", referansM2: 70 },
    ],
  },
  {
    id: "sarkuteri-kiosk",
    label: "Şarküteri Kiosk",
    ustKategori: "Restoran",
    planNot: "proje-veri/7 ŞARKÜTERİ - KIOSK.xlsx",
    bantlar: [
      { id: "kiosk", label: "Kiosk referans", referansM2: 45 },
    ],
  },
  {
    id: "hamburger-kiosk",
    label: "Hamburger Kiosk",
    ustKategori: "Fast Food / QSR",
    planNot: "proje-veri/8 HAMBURGER-60-150 m2 - Kopya.xlsx",
    bantlar: [
      { id: "60-100", label: "60–100 m²", referansM2: 80 },
    ],
  },
  {
    id: "hotdog-kiosk",
    label: "Hotdog Kiosk",
    ustKategori: "Fast Food / QSR",
    planNot: "proje-veri/13 HOTDOG.xlsx",
    bantlar: [
      { id: "kiosk", label: "Kiosk referans", referansM2: 40 },
    ],
  },
  {
    id: "tavukcu",
    label: "Tavukçu",
    ustKategori: "Restoran",
    planNot: "proje-veri/17 TAVUKCU.xlsx",
    bantlar: [
      { id: "80-150", label: "80–150 m²", referansM2: 115 },
    ],
  },
  {
    id: "all-day-dining-cafe",
    label: "All Day Dining Cafe",
    ustKategori: "Restoran",
    planNot: "proje-veri/2016-134 SMYRNA BOYOZ LAINOX/2016-134.xlsx",
    bantlar: [
      { id: "100-200", label: "100–200 m² (Smyrna Boyoz)", referansM2: 150 },
      { id: "150-300", label: "150–300 m² (Havelka)", referansM2: 225 },
      { id: "200-400", label: "200–400 m² (THC Mavibahçe)", referansM2: 300 },
    ],
  },
  {
    id: "restoran",
    label: "Büyük Restoran",
    ustKategori: "Restoran",
    planNot: "proje-veri/2017-142 ONNOGROUP/2017-142.xlsx",
    bantlar: [
      { id: "500-1000", label: "500–1000 m² (ONNOGROUP)", referansM2: 500 },
      { id: "200-500", label: "200–500 m² (RESTORAN)", referansM2: 350 },
    ],
  },
  {
    id: "kokteyl-kahve",
    label: "Kokteyl + Kahve",
    ustKategori: "Bar & Lounge",
    planNot: "proje-veri/no fish today urun_listesi.xlsx",
    bantlar: [
      { id: "30-50", label: "30–200 m²", referansM2: 40 },
    ],
  },
  {
    id: "kahve-atolyesi",
    label: "Kahve Atölyesi",
    ustKategori: "Kafe / Coffee Shop",
    planNot: "proje-veri/2016-046 KAHVE ATÖLYESİ LAINOX/2016-046-1.xlsx",
    bantlar: [
      { id: "80-150", label: "80–150 m²", referansM2: 120 },
    ],
  },
  {
    id: "harvest-cafe",
    label: "Harvest Cafe",
    ustKategori: "Kafe / Coffee Shop",
    planNot: "proje-veri/2016-051 HARVEST BAHÇEŞEHİR MEFFTECH/2016-051-4.xlsx",
    bantlar: [
      { id: "100-200", label: "100–200 m²", referansM2: 150 },
    ],
  },
  {
    id: "all-sport-cafe",
    label: "All Sport Cafe",
    ustKategori: "Kafe / Coffee Shop",
    planNot: "proje-veri/2016-064 ALL SPORT CAFE MEFFTECH/2016-064-1.xlsx",
    bantlar: [
      { id: "100-200", label: "100–200 m²", referansM2: 150 },
    ],
  },
  {
    id: "buyuk-yemekhane",
    label: "Büyük Yemekhane",
    ustKategori: "Catering / Kurumsal",
    planNot: "proje-veri/2016-070 YOZGAT YEMEKHANE LAINOX/YOZGAT YEMEK EKİPMAN.xlsx",
    bantlar: [
      { id: "2000-3500", label: "2000–3500 kişi/gün", referansM2: 2750 },
    ],
  },
  {
    id: "guneli-pastane",
    label: "Güneli Fırın",
    ustKategori: "Pastane & Fırın",
    planNot: "proje-veri/2016-075 GÜNELİ FIRIN/2016-075.xlsx",
    bantlar: [
      { id: "200-400", label: "200–400 m²", referansM2: 300 },
    ],
  },
  {
    id: "sehir-otel",
    label: "Şehir Oteli (Business)",
    ustKategori: "Otel F&B",
    planNot: "proje-veri/2016-159 ZİGANA OTEL LAINOX/MUTFAK MALZEME zigana resort hotel alaçatı - LAINOX FİYAT TEKLİFİ YERLİ EKİPMAN.xls",
    bantlar: [
      { id: "50-80-oda", label: "50–80 oda (Zigana Alaçatı)", referansM2: 300 },
      { id: "500-2000", label: "500–2000 m² (Hampton Bolu)", referansM2: 1000 },
      { id: "500-2000-kocaeli", label: "500–2000 m² (Kocaeli)", referansM2: 1000 },
      { id: "500-2000-topkapi", label: "500–2000 m² (DoubleTree Topkapı · 140 oda)", referansM2: 1000 },
      { id: "500-2000-arnavutkoy", label: "500–2000 m² (Sheraton Arnavutköy · 2024-122)", referansM2: 1000 },
    ],
  },
  {
    id: "kiremit-akasya",
    label: "Kiremit Akasya",
    ustKategori: "Fast Food / QSR",
    planNot: "proje-veri/2016-085 KİREMİT AKASYA MEFFTECH/kiremit-akasya-2016-085.xlsx",
    bantlar: [
      { id: "100-250", label: "100–250 m²", referansM2: 175 },
    ],
  },
  {
    id: "kasap",
    label: "Kasap",
    ustKategori: "Şarküteri & Kasap",
    planNot: "proje-veri/2016-087 KASAP ORTAKLAR ROTA/2016-087 kasap.xlsx",
    bantlar: [
      { id: "100-250", label: "100–250 m²", referansM2: 175 },
    ],
  },
  {
    id: "kasap-sarkuteri",
    label: "Kasap + Şarküteri",
    ustKategori: "Şarküteri & Kasap",
    planNot: "proje-veri/2016-087 KASAP ORTAKLAR ROTA/2016-087.xlsx",
    bantlar: [
      { id: "100-250", label: "100–250 m²", referansM2: 200 },
    ],
  },
  {
    id: "inari-bar-yemek",
    label: "Bar + Yemek",
    ustKategori: "Restoran",
    planNot: "proje-veri/2016-093 INARI RESTAURANT/2016-093-2.xlsx",
    bantlar: [
      { id: "100-200", label: "100–200 m²", referansM2: 150 },
    ],
  },
  {
    id: "mus-selinoz-turk",
    label: "Türk Mutfağı — Lokanta",
    ustKategori: "Fast Food / QSR",
    planNot: "proje-veri/2016-101 MUŞ SELİNÖZ MİMARLIK/2016-101.xlsx",
    bantlar: [
      { id: "100-250", label: "100–250 m² (Muş Selinöz 2016-101)", referansM2: 200 },
    ],
  },
  {
    id: "kahve-duragi",
    label: "Kahve Durağı",
    ustKategori: "Kafe / Coffee Shop · Cafe-Restaurant",
    planNot: "proje-veri/2016-105 KAVE DURAĞI KONYALTI LAINOX/2016-105.xlsx",
    bantlar: [
      { id: "100-200", label: "Kahve Durağı 100–150 m² (Konyaaltı)", referansM2: 125 },
      { id: "150-200", label: "Kahve Durağı 150–200 m² (Karabük)", referansM2: 175 },
    ],
  },
  {
    id: "kahve-tatli",
    label: "Kahve & Tatlı",
    ustKategori: "Kafe / Coffee Shop",
    planNot: "proje-veri/2016-132 HACIBOZAN ÇEMBERLİTAŞ LAINOX/2016-132-2.xlsx",
    bantlar: [
      { id: "40-100", label: "40–100 m² (Çemberlitaş)", referansM2: 70 },
    ],
  },
  {
    id: "kahve-duragi-pastane",
    label: "Kahve Durağı — Pastane & Kahvaltı",
    ustKategori: "Kafe / Coffee Shop",
    planNot: "proje-veri/2016-135 KAHVE DURAĞI SULTANGAZİ LAINOX/2016-135.xlsx",
    bantlar: [
      { id: "100-200", label: "100–200 m² (Sultangazi)", referansM2: 150 },
    ],
  },
  {
    id: "resort-otel",
    label: "Resort Otel (ölçekli)",
    ustKategori: "Otel F&B",
    planNot: "proje-veri/2016-159 ZİGANA OTEL LAINOX/MUTFAK MALZEME zigana resort hotel alaçatı.xls",
    bantlar: [
      { id: "200-500", label: "200–500 m² (Zigana Alaçatı)", referansM2: 300 },
    ],
  },
  {
    id: "yerinde-uretim",
    label: "Yerinde Üretim (fabrika mutfağı)",
    ustKategori: "Catering",
    planNot: "proje-veri/2016-178 LİVA FABRİKA/2016-178.xlsx",
    bantlar: [
      { id: "20-60", label: "20–60 kişi (Liva 178)", referansM2: 40 },
    ],
  },
  {
    id: "turk-restoran",
    label: "Türk Restoranı",
    ustKategori: "Restoran",
    planNot: "proje-veri/S13-388-2-Model.pdf",
    bantlar: [
      { id: "150-300", label: "150–300 m² (S13-388)", referansM2: 220 },
      { id: "200-5000", label: "200–5000 m² (Sütiş Şişhane)", referansM2: 500 },
    ],
  },
  {
    id: "casual-cafe",
    label: "Casual Cafe",
    ustKategori: "Kafe / Coffee Shop",
    planNot: "proje-veri/2017-026 BEYKENT ŞİFA CAFE/2017-026.xlsx",
    bantlar: [
      { id: "50-150", label: "50–150 m²", referansM2: 100 },
    ],
  },
  {
    id: "catering-uretim",
    label: "Üretim Fabrikası (Catering)",
    ustKategori: "Catering / Kurumsal",
    planNot: "proje-veri/2025-080 AKADEMİ CATERING FABRİKA/2025-080-2.xlsx",
    bantlar: [
      { id: "1500-2500", label: "1500–2500 m² · 15–30 bin yemek/gün", referansM2: 2000 },
    ],
  },
  {
    id: "kanatci-kebapci",
    label: "Kanatçı-Kebapçı",
    ustKategori: "Restoran",
    planNot: "proje-veri/2024-107 KÖŞK KANAT/2024-107.XLSX",
    bantlar: [
      { id: "100-250", label: "100–250 m²", referansM2: 175 },
    ],
  },
  {
    id: "kebap-ortadogu",
    label: "Kebap & Ortadoğu Mutfağı",
    ustKategori: "Restoran",
    planNot: "proje-veri/2025-016 MEFTECH ORHANGAZİ KADER/2025-016-4.xlsx",
    bantlar: [
      { id: "80-200", label: "80–200 m²", referansM2: 140 },
      { id: "200-400", label: "200–400 m²", referansM2: 300 },
    ],
  },
  {
    id: "patisserie-yemek",
    label: "Patisserie + Yemek",
    ustKategori: "Restoran",
    planNot: "proje-veri/2024-032 HAMOUR ACARKENT/2024-032.xlsx",
    bantlar: [
      { id: "200-400", label: "200–400 m²", referansM2: 300 },
      { id: "referans", label: "Referans liste (2017)", referansM2: 200 },
    ],
  },
  {
    id: "boyoz-pastane",
    label: "Pastane Cafe (Boyoz)",
    ustKategori: "Pastane & Fırın",
    planNot: "proje-veri/2016-134 SMYRNA BOYOZ LAINOX/2016-134.xlsx",
    bantlar: [
      { id: "100-250", label: "100–250 m² (Smyrna Boyoz)", referansM2: 175 },
    ],
  },
  {
    id: "tatil-otel",
    label: "Tatil Oteli",
    ustKategori: "Otel F&B",
    planNot: "proje-veri/2016-170 NOYAN OTELCİLİK LAINOX/2016-194R1_WYNDAM HOTEL_2042017.xlsx",
    bantlar: [
      { id: "800-1500", label: "800–1500 m² (Wyndham 2016-194)", referansM2: 1000 },
    ],
  },
  {
    id: "ekmek-kruvasan",
    label: "Ekmek + Kruvasan (İmalathane)",
    ustKategori: "Üretim / Fabrika",
    planNot: "proje-veri/2017-093 HAKAN İNAN İMALATHANE/2017-093.xlsx",
    bantlar: [
      { id: "150-400", label: "150–400 m² (Hakan İnan 093)", referansM2: 300 },
    ],
  },
  {
    id: "meyhane",
    label: "Meyhane",
    ustKategori: "Restoran",
    planNot: "proje-veri/2017-098 DERSAADET KARAKÖY/2017-098-1.xlsx",
    bantlar: [
      { id: "200-350", label: "200–350 m² (Dersaadet 2017-098)", referansM2: 275 },
    ],
  },
  {
    id: "personel-yemekhane",
    label: "Personel Yemekhanesi (Catering)",
    ustKategori: "Catering",
    planNot: "proje-veri/2017-058 LAGUNA THERMAL PERSONEL YEMEKHANESİ/2017-058.xlsx",
    bantlar: [
      { id: "150-250", label: "150–250 kişi (Laguna 2017-058)", referansM2: 200 },
    ],
  },
  {
    id: "uka-akasya",
    label: "UKA Akasya",
    ustKategori: "Restoran",
    planNot: "proje-veri/2017/2017-193 UKA AKASYA/2017-193.xlsx",
    bantlar: [
      { id: "500-1000", label: "500–1000 m²", referansM2: 500 },
    ],
  },
  {
    id: "vadiistanbul-lokanta",
    label: "Vadi İstanbul Lokanta",
    ustKategori: "Restoran",
    planNot: "proje-veri/2017/2017-204 VADİİSTANBUL/2017-204-4.xlsx",
    bantlar: [
      { id: "300-500", label: "300–500 m²", referansM2: 400 },
    ],
  },
  {
    id: "pastane-cafe",
    label: "Pastane + Cafe (Hacısayid)",
    ustKategori: "Pastane & Fırın",
    planNot: "proje-veri/2017/2017-210 HACISAYİD BÜYÜKÇEKMECE/2017-210-1.xlsx",
    bantlar: [
      { id: "300-500", label: "300–500 m²", referansM2: 400 },
    ],
  },
  {
    id: "coffee-shop-yemek",
    label: "Coffee Shop + Yemek",
    ustKategori: "Kafe / Coffee Shop",
    planNot: "proje-veri/2018/2018-013 COFFEESHOP TRABZON/2018-013-1.xlsx",
    bantlar: [
      { id: "250-350", label: "250–350 m²", referansM2: 300 },
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