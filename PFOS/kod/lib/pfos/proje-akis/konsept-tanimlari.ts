/**
 * Legacy shopType (proje-akis) ↔ yeni PFOS motor eşlemesi.
 * Tek kaynak: buradan panel + varsayılan yükleme.
 * Katalog: PFOS/veri/PFOS-SORU-KATALOG.md §4
 */

/** m² bantı veya alt tip listesi (ör. mahalle balıkçı) */
export type ListeBantId =
  | "80-200"
  | "80-150"
  | "150-250"
  | "mahalle"
  | "referans"
  | "100-300"
  | "100-200"
  | "150-200"
  | "100-250"
  | "200-350"
  | "200-500"
  | "300-500"
  | "350-600"
  | "40-100"
  | "kiosk"
  | "60-100"
  | "150-300"
  | "500-1000"
  | "30-50"
  | "150-250"
  | "80-150"
  | "50-150"
  | "2000-3500"
  | "1500-2500"
  | "200-400"
  | "250-350"
  | "500-2000"
  | "500-2000-kocaeli"
  | "500-2000-topkapi"
  | "500-2000-arnavutkoy"
  | "50-80-oda"
  | "ikinciplan"
  | "800-1500"
  | "150-400"
  | "200-500"
  | "20-60"
  | "200-5000"
  | "35-100";

export type M2BantTanim = {
  id: ListeBantId;
  label: string;
  referansM2: number;
  listeDosya: string;
};

export type ShopTypePfosMeta = {
  /** lib/pfos konsept slug — Teklif oluştur motoru */
  motorSlug: string;
  /** pfos.html / q_dukkan_turu — ana seçenek */
  dukkanSecim: string;
  /** İleride sorulacak alt tipler (ör. mahalle balıkçısı) */
  dukkanAltTipler?: string[];
  m2Min: number;
  m2Max: number;
  bantlar: M2BantTanim[];
  /** ≤150 m² → 80-150 bandı; >150 → 150-250 */
  bantKurali: string;
  planPdf?: string;
  /** Excel/JSON referans dosya yolu (proje-veri/) */
  listeYolu?: string;
  teklifKaynagi: "pfos-referans" | "motor-sablon" | "legacy-set" | "referans-json" | "planlanan";
  /** aktif | motor | planlanan */
  durum?: "aktif" | "motor" | "planlanan";
};

export type ShopTypeKayit = {
  id: string;
  name: string;
  parent: string;
  desc: string;
  pfos: ShopTypePfosMeta;
  questions: unknown[];
};

function bant(
  id: "80-150" | "150-250",
  referansM2: number,
  kategoriId: string,
): M2BantTanim {
  const label = id === "80-150" ? "80–150 m²" : "150–250 m²";
  return {
    id,
    label,
    referansM2,
    listeDosya: `pfos-referans/${kategoriId}-${id}.json`,
  };
}

function liste(
  id: ListeBantId,
  label: string,
  referansM2: number,
  kategoriId: string,
): M2BantTanim {
  return {
    id,
    label,
    referansM2,
    listeDosya: `pfos-referans/${kategoriId}-${id}.json`,
  };
}

/** Motoru olmayan dükkan türleri — shopTypes + teklif mesajı */
function konseptPlanlanan(
  id: string,
  name: string,
  parent: string,
  dukkanSecim: string,
  m2Min: number,
  m2Max: number,
  desc?: string,
): ShopTypeKayit {
  return {
    id,
    name,
    parent,
    desc: desc ?? `${name} · liste hazırlanıyor — genel şablon`,
    pfos: {
      motorSlug: "",
      dukkanSecim,
      m2Min,
      m2Max,
      bantKurali: "Liste hazırlanıyor — genel şablon",
      teklifKaynagi: "planlanan",
      durum: "planlanan",
      bantlar: [],
    },
    questions: [],
  };
}

/** Güncel PFOS konsept tanımları (shopTypes) — soru dallarıyla 1:1 dukkanSecim */
export const PFOS_KONSEPT_SHOP_TYPES: ShopTypeKayit[] = [
  {
    id: "restaurant_steakhouse",
    name: "Steakhouse",
    parent: "Restoran",
    desc: "Et / ızgara restoran · referans ekipman listesi (m² bantlı) · teklif motoru: steakhouse",
    pfos: {
      motorSlug: "steakhouse",
      dukkanSecim: "Steakhouse",
      m2Min: 80,
      m2Max: 500,
      bantKurali: "m² ≤ 150 → 80-150 listesi; m² > 150 → 150-250 listesi",
      planPdf: "STEAKHOUSE/STEAKHOUSE-PLAN.pdf",
      teklifKaynagi: "pfos-referans",
      durum: "aktif",
      bantlar: [
        bant("80-150", 115, "steakhouse"),
        bant("150-250", 200, "steakhouse"),
      ],
    },
    questions: [],
  },
  {
    id: "restaurant_balik",
    name: "Balıkçı / Balık restoran",
    parent: "Restoran",
    desc: "Balık restoran + mahalle balıkçı · Uçan Balık (2016-094) + Dudak Payı (2017-191) · motor: balikci",
    pfos: {
      motorSlug: "balikci",
      dukkanSecim: "Balık Restaurant",
      dukkanAltTipler: [
        "Mahalle balıkçısı",
        "Balık Restaurant",
        "Balık lokantası",
        "Seafood bistro",
      ],
      m2Min: 80,
      m2Max: 600,
      bantKurali:
        "Mahalle balıkçı → mahalle listesi; m² ≤ 150 → 80-150; 150–250 → 150-250 (Uçan Balık); 350–600 → 350-600 (Dudak Payı)",
      listeYolu: "veri/ucan-balik-2016-094.xlsx · veri/balikci-dudakpayi-2017-191.xlsx",
      planPdf: "2 BALIKCI-PLAN.pdf",
      teklifKaynagi: "pfos-referans",
      durum: "aktif",
      bantlar: [
        liste("mahalle", "Mahalle balıkçı", 80, "balikci"),
        bant("80-150", 115, "balikci"),
        bant("150-250", 200, "balikci"),
        liste("350-600", "350–600 m² (Dudak Payı 2017-191)", 475, "balikci"),
      ],
    },
    questions: [],
  },
  {
    id: "restaurant_italyan",
    name: "İtalyan Restoran",
    parent: "Restoran",
    desc: "İtalyan / trattoria · 100–300 m² referans ekipman listesi · motor: italyan",
    pfos: {
      motorSlug: "italyan",
      dukkanSecim: "İtalyan Restoran",
      m2Min: 100,
      m2Max: 500,
      bantKurali: "03-italyan referans listesi (100–300 m²); m² ile adet ölçeklenir",
      planPdf: "proje-veri/03-italyan.pdf",
      listeYolu: "proje-veri/03-italyan 100-300 m2.xlsx",
      teklifKaynagi: "pfos-referans",
      durum: "aktif",
      bantlar: [liste("100-300", "100–300 m²", 200, "italyan")],
    },
    questions: [],
  },
  {
    id: "restaurant_pideci",
    name: "Pideci",
    parent: "Restoran",
    desc: "Pide / lahmacun · 100–250 m² referans ekipman listesi · motor: pideci",
    pfos: {
      motorSlug: "pideci",
      dukkanSecim: "Pideci",
      m2Min: 100,
      m2Max: 500,
      bantKurali: "Tek referans liste (100–250 m²); m² ile adet ölçeklenir",
      planPdf: "proje-veri/PIDECI.pdf",
      listeYolu: "proje-veri/PIDECI 100-250m2.xlsx",
      teklifKaynagi: "pfos-referans",
      durum: "aktif",
      bantlar: [liste("100-250", "100–250 m²", 175, "pideci")],
    },
    questions: [],
  },
  {
    id: "restaurant_sushi",
    name: "Sushi",
    parent: "Restoran",
    desc: "Sushi bar / omakase · 40–100 m² referans ekipman listesi · motor: sushi",
    pfos: {
      motorSlug: "sushi",
      dukkanSecim: "Sushi",
      m2Min: 40,
      m2Max: 100,
      bantKurali: "Tek referans liste (40–100 m²); m² ile adet ölçeklenir",
      planPdf: "proje-veri/06-SUSHI.pdf",
      listeYolu: "proje-veri/06 SUSHI 40-100 m2.xlsx",
      teklifKaynagi: "pfos-referans",
      durum: "aktif",
      bantlar: [liste("40-100", "40–100 m²", 70, "sushi")],
    },
    questions: [],
  },
  {
    id: "restaurant_inari_bar_yemek",
    name: "Bar + Yemek",
    parent: "Restoran",
    desc: "Bar + yemek · 100–200 m² referans (2016-093 Inari) · motor: inari-bar-yemek",
    pfos: {
      motorSlug: "inari-bar-yemek",
      dukkanSecim: "Bar + Yemek",
      m2Min: 100,
      m2Max: 500,
      bantKurali: "Tek referans liste (100–200 m²); m² ile adet ölçeklenir",
      listeYolu: "veri/inari-restaurant-2016-093-2.xlsx",
      teklifKaynagi: "pfos-referans",
      durum: "aktif",
      bantlar: [liste("100-200", "100–200 m²", 150, "inari-bar-yemek")],
    },
    questions: [],
  },
  {
    id: "restaurant_tavukcu",
    name: "Tavukçu",
    parent: "Restoran",
    desc: "Tavukçu / fried chicken · 80–150 m² referans ekipman listesi · motor: tavukcu",
    pfos: {
      motorSlug: "tavukcu",
      dukkanSecim: "Tavukçu",
      m2Min: 80,
      m2Max: 150,
      bantKurali: "Tek referans liste (80–150 m²); m² ile adet ölçeklenir",
      listeYolu: "proje-veri/17 TAVUKCU.xlsx",
      teklifKaynagi: "pfos-referans",
      durum: "aktif",
      bantlar: [liste("80-150", "80–150 m²", 115, "tavukcu")],
    },
    questions: [],
  },
  {
    id: "restaurant_sarkuteri_kiosk",
    name: "Şarküteri Kiosk",
    parent: "Restoran",
    desc: "Şarküteri kiosk · referans ekipman listesi · motor: sarkuteri-kiosk",
    pfos: {
      motorSlug: "sarkuteri-kiosk",
      dukkanSecim: "Şarküteri Kiosk",
      m2Min: 25,
      m2Max: 80,
      bantKurali: "Tek referans liste (kiosk); m² ile adet ölçeklenir",
      listeYolu: "proje-veri/7 ŞARKÜTERİ - KIOSK.xlsx",
      teklifKaynagi: "pfos-referans",
      durum: "aktif",
      bantlar: [liste("kiosk", "Kiosk referans", 45, "sarkuteri-kiosk")],
    },
    questions: [],
  },
  {
    id: "restaurant_kebap",
    name: "Kebap & Ortadoğu",
    parent: "Restoran",
    desc:
      "Kebap / ocakbaşı · 80–200 & 200–400 m² MEFTECH Orhangazi referans (2025-016) · >400 m² zone şablonu · motor: kebap-ortadogu",
    pfos: {
      motorSlug: "kebap-ortadogu",
      dukkanSecim: "Kebapçı",
      m2Min: 80,
      m2Max: 500,
      bantKurali:
        "m² ≤200 → 80-200 referans (016-4); ≤400 → 200-400 referans (016-3); >400 → 300-500 zone şablonu",
      listeYolu: "2025-016 MEFTECH ORHANGAZİ KADER",
      teklifKaynagi: "referans-json",
      durum: "aktif",
      bantlar: [
        liste("80-200", "80–200 m²", 140, "kebap-ortadogu"),
        liste("200-400", "200–400 m²", 300, "kebap-ortadogu"),
        liste("300-500", "300–500 m²", 400, "kebap-ortadogu"),
      ],
    },
    questions: [],
  },
  {
    id: "restaurant_kanatci_kebapci",
    name: "Kanatçı-Kebapçı",
    parent: "Restoran",
    desc: "Kanat & kebap / ızgara odaklı · 100–250 m² referans · motor: kanatci-kebapci",
    pfos: {
      motorSlug: "kanatci-kebapci",
      dukkanSecim: "Kanatçı-Kebapçı",
      m2Min: 100,
      m2Max: 500,
      bantKurali: "Tek referans liste (100–250 m²); m² ile adet ölçeklenir",
      listeYolu: "kosk-kanat-2024-107.xlsx",
      teklifKaynagi: "pfos-referans",
      durum: "aktif",
      bantlar: [liste("100-250", "100–250 m²", 175, "kanatci-kebapci")],
    },
    questions: [],
  },
  {
    id: "restaurant_patisserie_yemek",
    name: "Patisserie + Yemek",
    parent: "Restoran",
    desc: "Patisserie + sıcak mutfak · 200–400 m² referans (HAMOUR Acarkent) · motor: patisserie-yemek",
    pfos: {
      motorSlug: "patisserie-yemek",
      dukkanSecim: "Patisserie + Yemek",
      m2Min: 200,
      m2Max: 500,
      bantKurali: "Tek referans liste (200–400 m²); m² ile adet ölçeklenir",
      listeYolu: "hamour-acarkent-2024-032.xlsx",
      teklifKaynagi: "pfos-referans",
      durum: "aktif",
      bantlar: [liste("200-400", "200–400 m²", 300, "patisserie-yemek")],
    },
    questions: [],
  },
  {
    id: "pizzaci",
    name: "Pizzacı",
    parent: "Restoran",
    desc: "Pizza odaklı · 80–500 m² (80–200 / 200–500 bant) · motor: pizzaci",
    pfos: {
      motorSlug: "pizzaci",
      dukkanSecim: "Pizzacı",
      m2Min: 80,
      m2Max: 500,
      bantKurali: "≤200 m² → 80–200 liste; >200 m² → 200–500 liste",
      listeYolu: "proje-veri/pizzaci-80-200m2.xlsx",
      teklifKaynagi: "pfos-referans",
      durum: "aktif",
      bantlar: [
        liste("80-200", "80–200 m²", 140, "pizzaci"),
        liste("200-500", "200–500 m²", 350, "pizzaci"),
      ],
    },
    questions: [],
  },
  {
    id: "turk_restoran",
    name: "Türk Restoranı",
    parent: "Restoran",
    desc:
      "Türk / esnaf lokanta · S13-388 (150–300) + Sütiş 2017-006 (200–5000) · motor: turk-restoran",
    pfos: {
      motorSlug: "turk-restoran",
      dukkanSecim: "Türk / Esnaf lokanta",
      dukkanAltTipler: ["Self servis", "Food Court", "Masaya servis"],
      m2Min: 150,
      m2Max: 5000,
      bantKurali:
        "≤300 m² → S13-388; 300–500 m² → Vadi İstanbul (2017-204); >500 m² → Sütiş Excel; referansId ile AI/manuel seçim (ileride)",
      listeYolu:
        "lib/pfos/data/pfos-s13-388-referanslar.json · 2017/2017-204 VADİİSTANBUL/2017-204-4.xlsx · veri/sutis-sislihane-2017-006.xlsx",
      teklifKaynagi: "pfos-referans",
      durum: "aktif",
      bantlar: [
        {
          id: "150-300",
          label: "150–300 m² (S13-388)",
          referansM2: 220,
          listeDosya: "lib/pfos/data/pfos-s13-388-referanslar.json",
        },
        liste(
          "300-500",
          "300–500 m² (Vadi İstanbul Lokanta 2017-204)",
          400,
          "vadiistanbul-lokanta",
        ),
        liste("200-5000", "200–5000 m² (Sütiş Şişhane)", 500, "turk-restoran"),
      ],
    },
    questions: [],
  },
  {
    id: "meyhane",
    name: "Meyhane / Mezeli",
    parent: "Restoran",
    desc: "Meze / meyhane · teklif motoru: meyhane",
    pfos: {
      motorSlug: "meyhane",
      dukkanSecim: "Meyhane",
      m2Min: 100,
      m2Max: 500,
      bantKurali: "Tek referans liste (200–350 m²); m² ile adet ölçeklenir",
      listeYolu: "veri/meyhane-dersaadet-2017-098.xlsx",
      teklifKaynagi: "pfos-referans",
      durum: "aktif",
      bantlar: [liste("200-350", "200–350 m² (Dersaadet 2017-098)", 275, "meyhane")],
    },
    questions: [],
  },
  {
    id: "all_day_dining",
    name: "All Day Dining / Cafe",
    parent: "Restoran",
    desc: "All day dining · 100–200 m² Smyrna Boyoz · 150–300 m² Havelka · 200–400 m² THC Mavibahçe",
    pfos: {
      motorSlug: "all-day-dining-cafe",
      dukkanSecim: "All Dining Cafe",
      m2Min: 100,
      m2Max: 500,
      bantKurali:
        "≤200 m² → Smyrna Boyoz; 201–300 m² → Havelka; 301–400 m² → THC Mavibahçe (2017-154)",
      listeYolu:
        "veri/boyoz-pastane-2016-134.xlsx · proje-veri/2017-128-havelka.xlsx · proje-veri/2017-154-thc-mavibahce-2.pdf",
      teklifKaynagi: "pfos-referans",
      durum: "aktif",
      bantlar: [
        liste("100-200", "100–200 m² (Smyrna Boyoz)", 150, "all-day-dining-cafe"),
        liste("150-300", "150–300 m² (Havelka)", 225, "all-day-dining-cafe"),
        liste("200-400", "200–400 m² (THC Mavibahçe)", 300, "all-day-dining-cafe"),
      ],
    },
    questions: [],
  },
  {
    id: "kafe_kahve_atolyesi",
    name: "Kahve Atölyesi",
    parent: "Kafe / Coffee Shop",
    desc: "Kahve ağırlıklı · kahvaltı & hafif yemek · 80–150 m² referans (2016-046) · motor: kahve-atolyesi",
    pfos: {
      motorSlug: "kahve-atolyesi",
      dukkanSecim: "Kahve Atölyesi",
      m2Min: 80,
      m2Max: 150,
      bantKurali: "Tek referans liste (80–150 m²); m² ile adet ölçeklenir",
      listeYolu: "veri/kahve-atolyesi-2016-046-1.xlsx",
      teklifKaynagi: "pfos-referans",
      durum: "aktif",
      bantlar: [liste("80-150", "80–150 m²", 120, "kahve-atolyesi")],
    },
    questions: [],
  },
  {
    id: "kafe_casual_cafe",
    name: "Casual Cafe",
    parent: "Kafe / Coffee Shop",
    desc:
      "Casual cafe · servis mutfağı · pasta & simit teşhir · 50–150 m² referans (2017-026 Şifa Cafe Beykent) · motor: casual-cafe",
    pfos: {
      motorSlug: "casual-cafe",
      dukkanSecim: "Casual Cafe",
      m2Min: 50,
      m2Max: 150,
      bantKurali: "Tek referans liste (50–150 m²); m² ile adet ölçeklenir",
      listeYolu: "veri/beykent-sifa-cafe-2017-026.xlsx",
      teklifKaynagi: "pfos-referans",
      durum: "aktif",
      bantlar: [liste("50-150", "50–150 m²", 100, "casual-cafe")],
    },
    questions: [],
  },
  {
    id: "kafe_harvest_cafe",
    name: "Harvest Cafe",
    parent: "Kafe / Coffee Shop",
    desc: "A la carte · tatlı satış · kahve ağırlıklı cafe · 100–200 m² referans (2016-051) · motor: harvest-cafe",
    pfos: {
      motorSlug: "harvest-cafe",
      dukkanSecim: "Harvest Cafe",
      m2Min: 100,
      m2Max: 200,
      bantKurali: "Tek referans liste (100–200 m²); m² ile adet ölçeklenir",
      listeYolu: "veri/harvest-cafe-2016-051-4.xlsx",
      teklifKaynagi: "pfos-referans",
      durum: "aktif",
      bantlar: [liste("100-200", "100–200 m²", 150, "harvest-cafe")],
    },
    questions: [],
  },
  {
    id: "kafe_kahve_duragi",
    name: "Kahve Durağı",
    parent: "Kafe / Coffee Shop",
    desc:
      "Cafe-restaurant zincir · kahve+kahvaltı+tatlı · m²<150 Konyaaltı (105) · m²≥150 Karabük (106) · motor: kahve-duragi",
    pfos: {
      motorSlug: "kahve-duragi",
      dukkanSecim: "Kahve Durağı",
      m2Min: 100,
      m2Max: 200,
      bantKurali:
        "m² < 150 → 100–200 (Konyaaltı kompakt); m² ≥ 150 → 150–200 (Karabük standart)",
      listeYolu:
        "veri/kave-duragi-2016-105.xlsx · veri/kahve-duragi-karabuk-2016-106.xlsx",
      teklifKaynagi: "pfos-referans",
      durum: "aktif",
      bantlar: [
        liste("100-200", "100–150 m² (Konyaaltı)", 125, "kahve-duragi"),
        liste("150-200", "150–200 m² (Karabük)", 175, "kahve-duragi"),
      ],
    },
    questions: [],
  },
  {
    id: "kafe_all_sport_cafe",
    name: "All Sport Cafe",
    parent: "Kafe / Coffee Shop",
    desc: "All day cafe · gün boyu servis · 100–200 m² referans (2016-064) · motor: all-sport-cafe",
    pfos: {
      motorSlug: "all-sport-cafe",
      dukkanSecim: "All Sport Cafe",
      m2Min: 100,
      m2Max: 200,
      bantKurali: "Tek referans liste (100–200 m²); m² ile adet ölçeklenir",
      listeYolu: "veri/all-sport-cafe-2016-064-1.xlsx",
      teklifKaynagi: "pfos-referans",
      durum: "aktif",
      bantlar: [liste("100-200", "100–200 m²", 150, "all-sport-cafe")],
    },
    questions: [],
  },
  {
    id: "kafe_kahve_duragi_pastane",
    name: "Kahve Durağı — Pastane & Kahvaltı",
    parent: "Kafe / Coffee Shop",
    desc:
      "Pastane + kahvaltı + hafif yemek · 100–200 m² Sultangazi (2016-135) · motor: kahve-duragi-pastane",
    pfos: {
      motorSlug: "kahve-duragi-pastane",
      dukkanSecim: "Kahve Durağı — Pastane & Kahvaltı",
      m2Min: 100,
      m2Max: 200,
      bantKurali: "Tek referans liste (100–200 m²); m² ile adet ölçeklenir",
      listeYolu: "veri/kahve-duragi-sultangazi-2016-135.xlsx",
      teklifKaynagi: "pfos-referans",
      durum: "aktif",
      bantlar: [liste("100-200", "100–200 m² (Sultangazi)", 150, "kahve-duragi-pastane")],
    },
    questions: [],
  },
  {
    id: "kafe_kahve_tatli",
    name: "Kahve & Tatlı",
    parent: "Kafe / Coffee Shop",
    desc:
      "Kahve + pasta/poğaça teşhir · alt kat üretim · 40–100 m² Hacıbozan Çemberlitaş (2016-132) · motor: kahve-tatli",
    pfos: {
      motorSlug: "kahve-tatli",
      dukkanSecim: "Kahve & Tatlı",
      m2Min: 40,
      m2Max: 100,
      bantKurali: "Tek referans liste (40–100 m²); m² ile adet ölçeklenir",
      listeYolu: "veri/hacibozan-cemberlitas-2016-132.xlsx",
      teklifKaynagi: "pfos-referans",
      durum: "aktif",
      bantlar: [liste("40-100", "40–100 m²", 70, "kahve-tatli")],
    },
    questions: [],
  },
  {
    id: "coffee_shop",
    name: "Coffee Shop",
    parent: "Kafe / Coffee Shop",
    desc: "Kahve + pasta teşhir · İKİNCİPLAN (2024-054) veya Espressolab Watergarden · motor: coffee-shop",
    pfos: {
      motorSlug: "coffee-shop",
      dukkanSecim: "Coffee Shop",
      m2Min: 60,
      m2Max: 300,
      bantKurali: "Varsayılan İKİNCİPLAN; Espressolab Watergarden alternatif bant",
      teklifKaynagi: "pfos-referans",
      listeYolu: "ikinciplan-kafe-2024-054.xlsx · veri/espresolab-watergarden-2016-114.xlsx",
      durum: "aktif",
      bantlar: [
        liste("ikinciplan", "İKİNCİPLAN Kafe (2024-054)", 100, "coffee-shop"),
        liste("referans", "Espressolab Watergarden", 120, "coffee-shop"),
      ],
    },
    questions: [],
  },
  {
    id: "coffee_shop_yemek",
    name: "Coffee Shop + Yemek",
    parent: "Kafe / Coffee Shop",
    desc:
      "Coffee shop + sıcak yemek · bar + mutfak · Trabzon (2018-013) · 300 m² referans · motor: coffee-shop-yemek",
    pfos: {
      motorSlug: "coffee-shop-yemek",
      dukkanSecim: "Coffee Shop + Yemek",
      m2Min: 250,
      m2Max: 350,
      bantKurali: "Tek referans liste (250–350 m²); m² ile adet ölçeklenir",
      listeYolu: "2018/2018-013 COFFEESHOP TRABZON/2018-013-1.xlsx",
      teklifKaynagi: "pfos-referans",
      durum: "aktif",
      bantlar: [
        liste("250-350", "250–350 m² (Trabzon 2018-013)", 300, "coffee-shop-yemek"),
      ],
    },
    questions: [],
  },
  {
    id: "restaurant_buyuk_restoran",
    name: "Restoran",
    parent: "Restoran",
    desc: "500–1000 m² · büyük yemek rezervasyonları · düğün & özel organizasyon · eğlence & etkinlik · motor: restoran",
    pfos: {
      motorSlug: "restoran",
      dukkanSecim: "Restoran",
      m2Min: 500,
      m2Max: 1000,
      bantKurali: "Tek referans liste (500–1000 m²); m² ile adet ölçeklenir",
      listeYolu: "proje-veri/RESTORAN.xlsx",
      teklifKaynagi: "pfos-referans",
      durum: "aktif",
      bantlar: [liste("500-1000", "500–1000 m²", 750, "restoran")],
    },
    questions: [],
  },
  {
    id: "restaurant_sarkuteri_restoran",
    name: "Şarküteri Restoran",
    parent: "Restoran",
    desc: "Şarküteri restoran · teşhir + hazırlık mutfağı · Ortaklar Rota (2016-087) referansı · motor: sarkuteri-restoran",
    pfos: {
      motorSlug: "sarkuteri-restoran",
      dukkanSecim: "Şarküteri Restoran",
      m2Min: 100,
      m2Max: 500,
      bantKurali: "Ortaklar Rota kasap+şarküteri referans listesi (100–250 m²); m² ile adet ölçeklenir",
      listeYolu: "veri/kasap-ortaklar-2016-087.xlsx",
      teklifKaynagi: "pfos-referans",
      durum: "aktif",
      bantlar: [liste("100-250", "100–250 m²", 200, "sarkuteri-restoran")],
    },
    questions: [],
  },
  {
    id: "restaurant_fine_dining",
    name: "Fine Dining",
    parent: "Restoran",
    desc: "Fine dining · UKA Akasya (2017-193) · 500 m² referans · motor: restoran",
    pfos: {
      motorSlug: "restoran",
      dukkanSecim: "Fine Dining",
      m2Min: 500,
      m2Max: 1000,
      bantKurali: "UKA Akasya referans listesi (2017-193) · 500–1000 m²; m² ile adet ölçeklenir",
      listeYolu: "2017/2017-193 UKA AKASYA/2017-193.xlsx",
      teklifKaynagi: "pfos-referans",
      durum: "aktif",
      bantlar: [liste("500-1000", "500–1000 m²", 500, "uka-akasya")],
    },
    questions: [],
  },
  {
    id: "restaurant_dunya",
    name: "Dünya Mutfağı",
    parent: "Restoran",
    desc: "Dünya mutfağı · UKA Akasya (2017-193) · 500 m² referans · motor: restoran",
    pfos: {
      motorSlug: "restoran",
      dukkanSecim: "Dünya Mutfağı",
      m2Min: 500,
      m2Max: 1000,
      bantKurali: "UKA Akasya referans listesi (2017-193) · 500–1000 m²; m² ile adet ölçeklenir",
      listeYolu: "2017/2017-193 UKA AKASYA/2017-193.xlsx",
      teklifKaynagi: "pfos-referans",
      durum: "aktif",
      bantlar: [liste("500-1000", "500–1000 m²", 500, "uka-akasya")],
    },
    questions: [],
  },
  {
    id: "kasap_yalniz",
    name: "Kasap",
    parent: "Restoran",
    desc: "Yalnızca kasap hizmeti · et teşhir · hazırlık · Ortaklar Rota (2016-087 kasap) · motor: kasap",
    pfos: {
      motorSlug: "kasap",
      dukkanSecim: "Kasap",
      m2Min: 100,
      m2Max: 500,
      bantKurali: "Tek referans liste (100–250 m²); m² ile adet ölçeklenir",
      listeYolu: "veri/kasap-ortaklar-kasap-2016-087.xlsx",
      teklifKaynagi: "pfos-referans",
      durum: "aktif",
      bantlar: [liste("100-250", "100–250 m²", 175, "kasap")],
    },
    questions: [],
  },
  {
    id: "kasap_sarkuteri",
    name: "Kasap + Şarküteri",
    parent: "Restoran",
    desc: "Kasap + şarküteri teşhir · hazırlık mutfağı · Ortaklar Rota tam liste (2016-087) · motor: kasap-sarkuteri",
    pfos: {
      motorSlug: "kasap-sarkuteri",
      dukkanSecim: "Kasap + Şarküteri",
      m2Min: 100,
      m2Max: 500,
      bantKurali: "Tek referans liste (100–250 m²); m² ile adet ölçeklenir",
      listeYolu: "veri/kasap-ortaklar-2016-087.xlsx",
      teklifKaynagi: "pfos-referans",
      durum: "aktif",
      bantlar: [liste("100-250", "100–250 m²", 200, "kasap-sarkuteri")],
    },
    questions: [],
  },
  konseptPlanlanan("kafeterya", "Kafeterya", "Kafe / Coffee Shop", "Kafeterya", 80, 350),
  {
    id: "pastane",
    name: "Pastane",
    parent: "Pastane & Fırın",
    desc: "Pastane / fırın · ≤150 m² 14-PASTANE · >150 m² ekipman listesi · motor: pastane",
    pfos: {
      motorSlug: "pastane",
      dukkanSecim: "Pastane",
      m2Min: 100,
      m2Max: 250,
      bantKurali: "≤150 m² → 14-PASTANE (100–200); >150 m² → pastane ekipman_listesi (150–250)",
      listeYolu: "proje-veri/14-PASTANE.xlsx · veri/pastane ekipman_listesi.xlsx",
      teklifKaynagi: "pfos-referans",
      durum: "aktif",
      bantlar: [
        liste("100-200", "100–200 m² (≤150 m²)", 150, "pastane"),
        liste("150-250", "150–250 m² (>150 m²)", 200, "pastane"),
      ],
    },
    questions: [],
  },
  {
    id: "pastane_boyoz",
    name: "Pastane Cafe (Boyoz)",
    parent: "Pastane & Fırın",
    desc:
      "İzmir boyoz dükkanı · Smyrna 2016-134 · satış + üretim · 100–250 m² · motor: boyoz-pastane",
    pfos: {
      motorSlug: "boyoz-pastane",
      dukkanSecim: "Pastane Cafe (Boyoz)",
      m2Min: 100,
      m2Max: 250,
      bantKurali: "Tek referans liste (100–250 m²); m² ile adet ölçeklenir",
      listeYolu: "veri/boyoz-pastane-2016-134.xlsx",
      teklifKaynagi: "pfos-referans",
      durum: "planlanan",
      bantlar: [
        liste("100-250", "100–250 m² (Smyrna Boyoz)", 175, "boyoz-pastane"),
      ],
    },
    questions: [],
  },
  {
    id: "pastane_guneli",
    name: "Güneli Fırın",
    parent: "Pastane & Fırın",
    desc: "Pastane + yerel satış · 200–400 m² referans (2016-075) · motor: guneli-pastane",
    pfos: {
      motorSlug: "guneli-pastane",
      dukkanSecim: "Güneli Fırın",
      m2Min: 200,
      m2Max: 400,
      bantKurali: "Tek referans liste (200–400 m²); m² ile adet ölçeklenir",
      listeYolu: "veri/guneli-pastane-2016-075.xlsx",
      teklifKaynagi: "pfos-referans",
      durum: "aktif",
      bantlar: [liste("200-400", "200–400 m²", 300, "guneli-pastane")],
    },
    questions: [],
  },
  {
    id: "pastane_yerel",
    name: "Pastane & Yerel",
    parent: "Pastane & Fırın",
    desc: "Pastane + yerel perakende · 200–400 m² Güneli referans · motor: guneli-pastane",
    pfos: {
      motorSlug: "guneli-pastane",
      dukkanSecim: "Pastane & Yerel",
      m2Min: 200,
      m2Max: 400,
      bantKurali: "Tek referans liste (200–400 m²); m² ile adet ölçeklenir",
      listeYolu: "veri/guneli-pastane-2016-075.xlsx",
      teklifKaynagi: "pfos-referans",
      durum: "aktif",
      bantlar: [liste("200-400", "200–400 m²", 300, "guneli-pastane")],
    },
    questions: [],
  },
  {
    id: "pastane_cafe",
    name: "Pastane + Cafe",
    parent: "Pastane & Fırın",
    desc:
      "Pastane + cafe · üretim + teşhir + sıcak mutfak · Hacısayid Büyükçekmece (2017-210) · motor: pastane-cafe",
    pfos: {
      motorSlug: "pastane-cafe",
      dukkanSecim: "Pastane + Cafe",
      m2Min: 300,
      m2Max: 500,
      bantKurali: "Tek referans liste (300–500 m²); m² ile adet ölçeklenir",
      listeYolu: "2017/2017-210 HACISAYİD BÜYÜKÇEKMECE/2017-210-1.xlsx",
      teklifKaynagi: "pfos-referans",
      durum: "aktif",
      bantlar: [
        liste("300-500", "300–500 m² (Hacısayid 2017-210)", 400, "pastane-cafe"),
      ],
    },
    questions: [],
  },
  {
    id: "ff_turk_mutfagi",
    name: "Türk Mutfağı",
    parent: "Fast Food / QSR",
    desc: "Türk mutfağı self servis · 100–250 m² referans (2016-085 Kiremit Akasya) · motor: kiremit-akasya",
    pfos: {
      motorSlug: "kiremit-akasya",
      dukkanSecim: "Türk Mutfağı",
      m2Min: 100,
      m2Max: 500,
      bantKurali: "Tek referans liste (100–250 m²); m² ile adet ölçeklenir",
      listeYolu: "veri/kiremit-akasya-2016-085.xlsx",
      teklifKaynagi: "pfos-referans",
      durum: "aktif",
      bantlar: [liste("100-250", "100–250 m²", 175, "kiremit-akasya")],
    },
    questions: [],
  },
  {
    id: "ff_mus_selinoz_turk",
    name: "Türk Mutfağı — Lokanta",
    parent: "Fast Food / QSR",
    desc:
      "2016-101 Muş Selinöz · 89 kalem · bar+pasta+mutfak · Kiremit’ten ayrı · motor: mus-selinoz-turk",
    pfos: {
      motorSlug: "mus-selinoz-turk",
      dukkanSecim: "Türk Mutfağı — Lokanta",
      m2Min: 100,
      m2Max: 250,
      bantKurali: "Tek referans liste (101); m² ile adet ölçeklenir",
      listeYolu: "veri/mus-selinoz-2016-101.xlsx",
      teklifKaynagi: "pfos-referans",
      durum: "aktif",
      bantlar: [
        liste("100-250", "100–250 m² (Muş 101)", 200, "mus-selinoz-turk"),
      ],
    },
    questions: [],
  },
  {
    id: "ff_self_servis",
    name: "Self Servis",
    parent: "Fast Food / QSR",
    desc: "Self servis hat · bain marie · teşhir · 100–250 m² Kiremit referans · motor: kiremit-akasya",
    pfos: {
      motorSlug: "kiremit-akasya",
      dukkanSecim: "Self Servis",
      m2Min: 100,
      m2Max: 250,
      bantKurali: "Tek referans liste (100–250 m²); m² ile adet ölçeklenir",
      listeYolu: "veri/kiremit-akasya-2016-085.xlsx",
      teklifKaynagi: "pfos-referans",
      durum: "aktif",
      bantlar: [liste("100-250", "100–250 m²", 175, "kiremit-akasya")],
    },
    questions: [],
  },
  {
    id: "ff_food_court",
    name: "Food Court",
    parent: "Fast Food / QSR",
    desc: "AVM food court · çoklu outlet self servis · 100–250 m² Kiremit referans · motor: kiremit-akasya",
    pfos: {
      motorSlug: "kiremit-akasya",
      dukkanSecim: "Food Court",
      m2Min: 100,
      m2Max: 500,
      bantKurali: "Tek referans liste (100–250 m²); m² ile adet ölçeklenir",
      listeYolu: "veri/kiremit-akasya-2016-085.xlsx",
      teklifKaynagi: "pfos-referans",
      durum: "aktif",
      bantlar: [liste("100-250", "100–250 m²", 175, "kiremit-akasya")],
    },
    questions: [],
  },
  {
    id: "ff_hamburger_kiosk",
    name: "Hamburger Kiosk",
    parent: "Fast Food / QSR",
    desc: "Hamburger kiosk · 60–100 m² referans · motor: hamburger-kiosk",
    pfos: {
      motorSlug: "hamburger-kiosk",
      dukkanSecim: "Hamburger Kiosk",
      m2Min: 60,
      m2Max: 100,
      bantKurali: "Tek referans liste (60–100 m²); m² ile adet ölçeklenir",
      listeYolu: "proje-veri/8 HAMBURGER-60-150 m2 - Kopya.xlsx",
      teklifKaynagi: "pfos-referans",
      durum: "aktif",
      bantlar: [liste("60-100", "60–100 m²", 80, "hamburger-kiosk")],
    },
    questions: [],
  },
  {
    id: "ff_hotdog_kiosk",
    name: "Hotdog Kiosk",
    parent: "Fast Food / QSR",
    desc: "Hotdog kiosk · referans ekipman listesi · motor: hotdog-kiosk",
    pfos: {
      motorSlug: "hotdog-kiosk",
      dukkanSecim: "Hotdog Kiosk",
      m2Min: 25,
      m2Max: 60,
      bantKurali: "Tek referans liste (kiosk); m² ile adet ölçeklenir",
      listeYolu: "proje-veri/13 HOTDOG.xlsx",
      teklifKaynagi: "pfos-referans",
      durum: "aktif",
      bantlar: [liste("kiosk", "Kiosk referans", 40, "hotdog-kiosk")],
    },
    questions: [],
  },
  konseptPlanlanan("ff_burger", "Burger", "Fast Food / QSR", "Burger", 40, 180),
  konseptPlanlanan(
    "ff_pizza_paket",
    "Pizza (paket)",
    "Fast Food / QSR",
    "Pizza (paket)",
    35,
    150,
  ),
  {
    id: "ff_fried_chicken",
    name: "Fried Chicken",
    parent: "Fast Food / QSR",
    desc: "Fried chicken / tavukçu · 80–150 m² referans · motor: tavukcu",
    pfos: {
      motorSlug: "tavukcu",
      dukkanSecim: "Fried Chicken",
      m2Min: 80,
      m2Max: 150,
      bantKurali: "Tek referans liste (80–150 m²); m² ile adet ölçeklenir",
      listeYolu: "proje-veri/17 TAVUKCU.xlsx",
      teklifKaynagi: "pfos-referans",
      durum: "aktif",
      bantlar: [liste("80-150", "80–150 m²", 115, "tavukcu")],
    },
    questions: [],
  },
  konseptPlanlanan(
    "ff_doner",
    "Döner / Dürüm",
    "Fast Food / QSR",
    "Döner / Dürüm",
    30,
    120,
  ),
  konseptPlanlanan(
    "ff_pide",
    "Pide / Lahmacun",
    "Fast Food / QSR",
    "Pide / Lahmacun",
    35,
    150,
  ),
  konseptPlanlanan(
    "pastane_artisan",
    "Artisan / butik",
    "Pastane & Fırın",
    "Artisan / butik",
    40,
    120,
  ),
  konseptPlanlanan(
    "pastane_endustriyel",
    "Endüstriyel fırın",
    "Pastane & Fırın",
    "Endüstriyel fırın",
    80,
    800,
  ),
  {
    id: "bar_birahane",
    name: "Birahane",
    parent: "Bar & Lounge",
    desc: "Birahane / bira salonu · 100–300 m² referans ekipman listesi · motor: birahane",
    pfos: {
      motorSlug: "birahane",
      dukkanSecim: "Birahane",
      m2Min: 100,
      m2Max: 300,
      bantKurali: "Tek referans liste (100–300 m²); m² ile adet ölçeklenir",
      listeYolu: "proje-veri/11 BIRAHANE.xlsx",
      teklifKaynagi: "pfos-referans",
      durum: "aktif",
      bantlar: [
        liste("100-300", "100–300 m²", 200, "birahane"),
      ],
    },
    questions: [],
  },
  {
    id: "bar_kokteyl_kahve",
    name: "Kokteyl + Kahve",
    parent: "Bar & Lounge",
    desc: "Kokteyl & kahve bar · 30–50 m² referans (No Fish Today) · motor: kokteyl-kahve",
    pfos: {
      motorSlug: "kokteyl-kahve",
      dukkanSecim: "Kokteyl + Kahve",
      m2Min: 30,
      m2Max: 50,
      bantKurali: "Tek referans liste (30–50 m²); m² ile adet ölçeklenir",
      listeYolu: "veri/no fish today urun_listesi.xlsx",
      teklifKaynagi: "pfos-referans",
      durum: "aktif",
      bantlar: [liste("30-50", "30–50 m²", 40, "kokteyl-kahve")],
    },
    questions: [],
  },
  {
    id: "bar_kokteyl",
    name: "Kokteyl Bar",
    parent: "Bar & Lounge",
    desc: "Kokteyl bar · 30–50 m² kokteyl+kahve referansı · motor: kokteyl-kahve",
    pfos: {
      motorSlug: "kokteyl-kahve",
      dukkanSecim: "Kokteyl Bar",
      m2Min: 30,
      m2Max: 50,
      bantKurali: "Kokteyl + kahve referans listesi",
      listeYolu: "veri/no fish today urun_listesi.xlsx",
      teklifKaynagi: "pfos-referans",
      durum: "aktif",
      bantlar: [liste("30-50", "30–50 m²", 40, "kokteyl-kahve")],
    },
    questions: [],
  },
  konseptPlanlanan("bar_wine", "Wine Bar", "Bar & Lounge", "Wine Bar", 50, 200),
  konseptPlanlanan("bar_beer", "Beer Pub", "Bar & Lounge", "Beer Pub", 80, 400),
  konseptPlanlanan("bar_irish", "Irish Pub", "Bar & Lounge", "Irish Pub", 100, 450),
  {
    id: "bar_mixology",
    name: "Mixology Bar",
    parent: "Bar & Lounge",
    desc: "Mixology · 30–50 m² kokteyl+kahve referansı · motor: kokteyl-kahve",
    pfos: {
      motorSlug: "kokteyl-kahve",
      dukkanSecim: "Mixology Bar",
      m2Min: 30,
      m2Max: 50,
      bantKurali: "Kokteyl + kahve referans listesi",
      listeYolu: "veri/no fish today urun_listesi.xlsx",
      teklifKaynagi: "pfos-referans",
      durum: "aktif",
      bantlar: [liste("30-50", "30–50 m²", 40, "kokteyl-kahve")],
    },
    questions: [],
  },
  konseptPlanlanan("bar_lounge", "Lounger Bar", "Bar & Lounge", "Lounger Bar", 80, 350),
  {
    id: "otel_sehir",
    name: "Şehir Oteli (Business)",
    parent: "Otel F&B",
    desc: "Şehir/business otel F&B · Hampton Bolu (2016-088) · Hilton Kocaeli (2016-077) · DoubleTree Topkapı (2017-050) · Sheraton Arnavutköy (2024-122) · motor: sehir-otel",
    pfos: {
      motorSlug: "sehir-otel",
      dukkanSecim: "Şehir Oteli (Business)",
      m2Min: 500,
      m2Max: 2000,
      bantKurali: "Varsayılan Hampton Bolu; Kocaeli, DoubleTree Topkapı ve Sheraton Arnavutköy ayrı bantlar",
      listeYolu:
        "veri/hampton-sehir-otel-2016-088.xls · veri/hilton-sehir-otel-2016-077.xlsx · veri/doubletree-hilton-topkapi-2017-050.xlsx · veri/sheraton-arnavutkoy-2024-122.xlsx",
      teklifKaynagi: "pfos-referans",
      durum: "aktif",
      bantlar: [
        liste("500-2000", "500–2000 m² (Hampton Bolu)", 1000, "sehir-otel"),
        liste("50-80-oda", "50–80 oda (Zigana Alaçatı)", 300, "sehir-otel"),
        liste("500-2000-kocaeli", "500–2000 m² (Kocaeli)", 1000, "sehir-otel"),
        liste("500-2000-topkapi", "500–2000 m² (DoubleTree Topkapı · 140 oda)", 1000, "sehir-otel"),
        liste("500-2000-arnavutkoy", "500–2000 m² (Sheraton Arnavutköy)", 1000, "sehir-otel"),
      ],
    },
    questions: [],
  },
  {
    id: "otel_resort",
    name: "Resort Otel (ölçekli)",
    parent: "Otel F&B",
    desc:
      "Boutique / resort F&B · Zigana Alaçatı 2016-159 · 200–2000 m² · motor: resort-otel",
    pfos: {
      motorSlug: "resort-otel",
      dukkanSecim: "Resort Otel",
      m2Min: 200,
      m2Max: 2000,
      bantKurali: "Tek referans liste (ölçekli resort); m² ile adet ölçeklenir · 750/1000 m² dahil",
      listeYolu: "veri/zigana-otel-2016-159.xls",
      teklifKaynagi: "pfos-referans",
      durum: "aktif",
      bantlar: [liste("200-500", "200–500 m² (Zigana)", 300, "resort-otel")],
    },
    questions: [],
  },
  konseptPlanlanan(
    "otel_dag",
    "Dağ-Kayak Oteli",
    "Otel F&B",
    "Dağ-Kayak Oteli",
    150,
    1500,
  ),
  {
    id: "otel_tatil",
    name: "Tatil Oteli",
    parent: "Otel F&B",
    desc: "Tatil Oteli · Wyndham 2016-194 referans · 800–1500 m² (1000 m² hedef) · motor: tatil-otel",
    pfos: {
      motorSlug: "tatil-otel",
      dukkanSecim: "Tatil Oteli",
      m2Min: 250,
      m2Max: 4000,
      bantKurali: "Tek referans liste (Wyndham); m² ile adet ölçeklenir",
      listeYolu: "veri/wyndham-tatil-otel-2016-194.xlsx",
      teklifKaynagi: "pfos-referans",
      durum: "aktif",
      bantlar: [liste("800-1500", "800–1500 m² (Wyndham 2016-194)", 1000, "tatil-otel")],
    },
    questions: [],
  },
  {
    id: "catering_buyuk_yemekhane",
    name: "Büyük Yemekhane (Catering)",
    parent: "Catering",
    desc: "Büyük hastane / kurumsal mutfak · 2000–3500 kişi/gün · Yozgat referans (2016-070) · motor: buyuk-yemekhane",
    pfos: {
      motorSlug: "buyuk-yemekhane",
      dukkanSecim: "Büyük Yemekhane (Catering)",
      m2Min: 2000,
      m2Max: 3500,
      bantKurali: "Tek referans liste (2000–3500 kişi/gün); kapasite ile adet ölçeklenir",
      listeYolu: "veri/yozgat-yemekhane-2016-070.xlsx",
      teklifKaynagi: "pfos-referans",
      durum: "aktif",
      bantlar: [liste("2000-3500", "2000–3500 kişi/gün", 2750, "buyuk-yemekhane")],
    },
    questions: [],
  },
  {
    id: "fabrika_yemekhanesi",
    name: "Fabrika Yemekhanesi",
    parent: "Üretim / Fabrika",
    desc: "Fabrika personel yemekhanesi · 2000–3500 kişi/gün · Yozgat referans · motor: buyuk-yemekhane",
    pfos: {
      motorSlug: "buyuk-yemekhane",
      dukkanSecim: "Fabrika Yemekhanesi",
      m2Min: 2000,
      m2Max: 3500,
      bantKurali: "Tek referans liste (2000–3500 kişi/gün); kapasite ile adet ölçeklenir",
      listeYolu: "veri/yozgat-yemekhane-2016-070.xlsx",
      teklifKaynagi: "pfos-referans",
      durum: "aktif",
      bantlar: [liste("2000-3500", "2000–3500 kişi/gün", 2750, "buyuk-yemekhane")],
    },
    questions: [],
  },
  {
    id: "uretim_ekmek_kruvasan",
    name: "Ekmek + Kruvasan",
    parent: "Üretim / Fabrika",
    desc:
      "Ekmek + kruvasan imalathane · soğuk oda · şoklama · fırın hattı · 150–400 m² · Hakan İnan 2017-093 · motor: ekmek-kruvasan",
    pfos: {
      motorSlug: "ekmek-kruvasan",
      dukkanSecim: "Ekmek + Kruvasan",
      m2Min: 150,
      m2Max: 400,
      bantKurali: "Tek referans liste (150–400 m²); m² ile adet ölçeklenir",
      listeYolu: "veri/ekmek-kruvasan-2017-093.xlsx",
      teklifKaynagi: "pfos-referans",
      durum: "aktif",
      bantlar: [
        liste("150-400", "150–400 m² (Hakan İnan 093)", 300, "ekmek-kruvasan"),
      ],
    },
    questions: [],
  },
  {
    id: "okul_yemekhanesi",
    name: "Okul Yemekhanesi",
    parent: "Catering",
    desc: "Okul / kampüs yemekhanesi · 2000–3500 kişi/gün · Yozgat referans · motor: buyuk-yemekhane",
    pfos: {
      motorSlug: "buyuk-yemekhane",
      dukkanSecim: "Okul Yemekhanesi",
      m2Min: 2000,
      m2Max: 3500,
      bantKurali: "Tek referans liste (2000–3500 kişi/gün); kapasite ile adet ölçeklenir",
      listeYolu: "veri/yozgat-yemekhane-2016-070.xlsx",
      teklifKaynagi: "pfos-referans",
      durum: "aktif",
      bantlar: [liste("2000-3500", "2000–3500 kişi/gün", 2750, "buyuk-yemekhane")],
    },
    questions: [],
  },
  {
    id: "catering_uretim",
    name: "Üretim Fabrikası",
    parent: "Catering",
    desc:
      "Catering üretim fabrikası · 1500–2500 m² · 15.000–30.000 yemek/gün · Akademi 2025-080 referans · motor: buyuk-yemekhane",
    pfos: {
      motorSlug: "buyuk-yemekhane",
      dukkanSecim: "Üretim Fabrikası",
      m2Min: 1500,
      m2Max: 2500,
      bantKurali:
        "1500–2500 m² bandı; 15–30 bin yemek/gün kapasite seçimi ile uyumlu · referans Akademi 2025-080",
      listeYolu: "2025-080 AKADEMİ CATERING FABRİKA/2025-080-2.xlsx",
      teklifKaynagi: "referans-json",
      durum: "aktif",
      bantlar: [
        liste("1500-2500", "1500–2500 m² · 15–30 bin yemek/gün", 2000, "catering-uretim"),
      ],
    },
    questions: [],
  },
  {
    id: "catering_yerinde",
    name: "Yerinde Üretim",
    parent: "Catering",
    desc:
      "20–60 kişilik fabrika mutfağı · Liva 2016-178 referans · motor: yerinde-uretim",
    pfos: {
      motorSlug: "yerinde-uretim",
      dukkanSecim: "Yerinde Üretim",
      m2Min: 20,
      m2Max: 60,
      bantKurali: "Kişi sayısı bandı (20–60); referans liste Liva 178",
      listeYolu: "veri/liva-fabrika-2016-178.xlsx",
      teklifKaynagi: "referans-json",
      durum: "aktif",
      bantlar: [
        liste("20-60", "20–60 kişi (Liva 178)", 40, "yerinde-uretim"),
      ],
    },
    questions: [],
  },
  {
    id: "catering_personel_yemekhane",
    name: "Personel Yemekhanesi",
    parent: "Catering",
    desc: "Personel yemekhanesi · ~200 kişi · Laguna Thermal 2017-058 referans · motor: personel-yemekhane",
    pfos: {
      motorSlug: "personel-yemekhane",
      dukkanSecim: "Personel Yemekhanesi",
      m2Min: 150,
      m2Max: 250,
      bantKurali: "Tek referans liste (150–250 kişi); kapasite ile adet ölçeklenir",
      listeYolu: "veri/personel-yemekhane-laguna-2017-058.xlsx",
      teklifKaynagi: "pfos-referans",
      durum: "aktif",
      bantlar: [
        liste("150-250", "150–250 kişi (Laguna 2017-058)", 200, "personel-yemekhane"),
      ],
    },
    questions: [],
  },
  konseptPlanlanan(
    "catering_tasima",
    "Taşıma Yemek",
    "Catering",
    "Taşıma Yemek (Servis & Yıkama)",
    100,
    1500,
  ),
  konseptPlanlanan(
    "bulut_grab_go",
    "Grab&Go",
    "Bulut Mutfak",
    "Grab&Go",
    8,
    15,
    "Kompakt bulut parsel — paket ağırlıklı minimum hat",
  ),
  konseptPlanlanan(
    "bulut_coffee_counter",
    "Coffee Counter",
    "Bulut Mutfak",
    "Coffee Counter",
    8,
    15,
    "Kompakt bulut parsel — espresso + sınırlı sıcak prep",
  ),
  konseptPlanlanan("bulut_doner", "Döner", "Bulut Mutfak", "Döner", 40, 120),
  konseptPlanlanan("bulut_pizza", "Pizza", "Bulut Mutfak", "Pizza", 35, 100),
  konseptPlanlanan(
    "bulut_pide",
    "Pide & Lahmacun",
    "Bulut Mutfak",
    "Pide & Lahmacun",
    35,
    100,
  ),
  {
    id: "bulut_burger",
    name: "Hamburgerci",
    parent: "Bulut Mutfak",
    desc: "Bulut mutfak hamburgerci · referans ekipman listesi",
    pfos: {
      motorSlug: "bulut-burger",
      dukkanSecim: "Hamburgerci",
      m2Min: 35,
      m2Max: 100,
      bantKurali: "Referans hamburgerci ekipman listesi",
      listeYolu: "veri/bulut-hamburgerci-referans.xlsx",
      teklifKaynagi: "pfos-referans",
      durum: "aktif",
      bantlar: [
        liste("35-100", "35–100 m² (Hamburgerci)", 60, "bulut-burger"),
      ],
    },
    questions: [],
  },
  konseptPlanlanan(
    "bulut_ev_yemek",
    "Ev Yemekleri",
    "Bulut Mutfak",
    "Ev Yemekleri",
    40,
    120,
  ),
  konseptPlanlanan(
    "bulut_kebap",
    "Kebap & Türk Mutfağı",
    "Bulut Mutfak",
    "Kebap & Türk Mutfağı",
    50,
    150,
  ),
  konseptPlanlanan(
    "uretim_500_2000",
    "500–2000 m²",
    "Üretim / Fabrika",
    "500–2000 m²",
    500,
    2000,
  ),
  konseptPlanlanan(
    "uretim_2000_5000",
    "2000–5000 m²",
    "Üretim / Fabrika",
    "2000–5000 m²",
    2000,
    5000,
  ),
  konseptPlanlanan(
    "uretim_5000_10000",
    "5000–10000 m²",
    "Üretim / Fabrika",
    "5000–10000 m²",
    5000,
    10000,
  ),
];

/** Aktif paketlerden üst segment → dükkan seçenekleri (public /pfos + proje-akis soruları) */
export function buildDukkanBranchesFromKonseptler(
  shopTypes: ShopTypeKayit[] = PFOS_KONSEPT_SHOP_TYPES,
): Record<string, string[]> {
  const branches: Record<string, string[]> = {};
  for (const t of shopTypes) {
    if (t.pfos.durum !== "aktif") continue;
    const parent = (t.parent || "Restoran").trim();
    const sel = (t.pfos.dukkanSecim || t.name || "").trim();
    if (!sel) continue;
    if (!branches[parent]) branches[parent] = [];
    if (!branches[parent].includes(sel)) branches[parent].push(sel);
  }
  if (!branches.Catering) {
    branches.Catering = [
      "Üretim Fabrikası",
      "Yerinde Üretim",
      "Taşıma Yemek (Servis & Yıkama)",
    ];
  } else if (!branches.Catering.includes("Yerinde Üretim")) {
    branches.Catering.push("Yerinde Üretim");
  }
  // Kiremit Akasya — Restoran segmentinde de Türk Mutfağı & Food Court
  const kiremitDukkan = ["Türk Mutfağı", "Food Court"];
  for (const sel of kiremitDukkan) {
    if (!branches.Restoran) branches.Restoran = [];
    if (!branches.Restoran.includes(sel)) branches.Restoran.push(sel);
  }
  return branches;
}

/** q_dukkan_turu cevabı → shopTypes.pfos.dukkanSecim (tek kaynak) */
export const DUKKAN_SECIM_ESLEME: Record<string, string> = Object.fromEntries(
  PFOS_KONSEPT_SHOP_TYPES.filter((t) => t.pfos.dukkanSecim).map((t) => [
    t.pfos.dukkanSecim,
    t.pfos.dukkanSecim,
  ]),
);

/** Eski sihirbaz kayıtları — dukkanSecim yeniden adlandırmaları */
export const DUKKAN_SECIM_LEGACY_ALIASES: Record<string, string> = {
  "Büyük Restoran": "Restoran",
  "Bar + Yemek (Hafif Asya)": "Bar + Yemek",
  "Esnaf Lokantası": "Türk / Esnaf lokanta",
};

export function normalizeDukkanSecim(raw: string): string {
  const d = raw.trim();
  if (!d) return d;
  return DUKKAN_SECIM_LEGACY_ALIASES[d] ?? DUKKAN_SECIM_ESLEME[d] ?? d;
}

export type ShopType = ShopTypeKayit;

function parseBantlar(raw: unknown): M2BantTanim[] {
  if (!Array.isArray(raw)) return [];
  const out: M2BantTanim[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const b = row as Record<string, unknown>;
    const id = String(b.id ?? "").trim() as ListeBantId;
    if (!id) continue;
    out.push({
      id,
      label: String(b.label ?? id),
      referansM2: Number(b.referansM2) || 0,
      listeDosya: String(b.listeDosya ?? "").trim(),
    });
  }
  return out;
}

/** proje-akis.json içindeki pfos bloğu — panel API yanıtı */
export function pfosMetaFromRaw(raw: unknown): ShopTypePfosMeta | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Record<string, unknown>;
  const motorSlug = String(p.motorSlug ?? "").trim();
  const m2Min = Number(p.m2Min) || 0;
  const m2Max = Number(p.m2Max) || 0;
  const bantlar = parseBantlar(p.bantlar);
  if (!motorSlug && !m2Min && !bantlar.length) return null;

  const teklifKaynagi = String(p.teklifKaynagi ?? "").trim();
  const kaynak = (
    ["pfos-referans", "motor-sablon", "legacy-set", "referans-json", "planlanan"] as const
  ).includes(teklifKaynagi as ShopTypePfosMeta["teklifKaynagi"])
    ? (teklifKaynagi as ShopTypePfosMeta["teklifKaynagi"])
    : motorSlug
      ? "pfos-referans"
      : "legacy-set";

  return {
    motorSlug,
    dukkanSecim: String(p.dukkanSecim ?? "").trim(),
    dukkanAltTipler: Array.isArray(p.dukkanAltTipler)
      ? (p.dukkanAltTipler as string[])
      : undefined,
    m2Min,
    m2Max,
    bantlar,
    bantKurali: String(p.bantKurali ?? "").trim(),
    planPdf: String(p.planPdf ?? "").trim() || undefined,
    listeYolu: String(p.listeYolu ?? "").trim() || undefined,
    teklifKaynagi: kaynak,
    durum:
      p.durum === "aktif" || p.durum === "motor" || p.durum === "planlanan"
        ? p.durum
        : motorSlug
          ? "aktif"
          : "planlanan",
  };
}

/** Eski kayıtları (yalnızca desc) güncel tanıma yükselt */
export function normalizeShopType(raw: Record<string, unknown>): ShopTypeKayit {
  const id = String(raw.id ?? "");
  const canonical = PFOS_KONSEPT_SHOP_TYPES.find((t) => t.id === id);
  const rawPfos = pfosMetaFromRaw(raw.pfos);
  const questions = Array.isArray(raw.questions) ? raw.questions : [];

  if (canonical) {
    return { ...canonical, questions };
  }

  if (rawPfos) {
    return {
      id,
      name: String(raw.name ?? id),
      parent: String(raw.parent ?? ""),
      desc: String(raw.desc ?? ""),
      pfos: rawPfos,
      questions,
    };
  }

  return {
    id,
    name: String(raw.name ?? id),
    parent: String(raw.parent ?? ""),
    desc: String(raw.desc ?? ""),
    pfos: {
      motorSlug: "",
      dukkanSecim: "",
      m2Min: 0,
      m2Max: 0,
      bantKurali: "",
      teklifKaynagi: "legacy-set",
      bantlar: [],
    },
    questions,
  };
}

/** Yükleme / API: kod tanımları + dosyadaki kayıtlar birleşir (İtalyan 100–300 m² vb.) */
export function enrichShopTypesFromFile(
  rawList: unknown[],
): ShopTypeKayit[] {
  const normalized = rawList.map((row) =>
    normalizeShopType(
      row && typeof row === "object" ? (row as Record<string, unknown>) : {},
    ),
  );
  return mergeShopTypes(normalized, PFOS_KONSEPT_SHOP_TYPES);
}

export function mergeShopTypes(
  existing: ShopTypeKayit[],
  incoming: ShopTypeKayit[],
): ShopTypeKayit[] {
  const byId = new Map(existing.map((t) => [t.id, t]));
  for (const t of incoming) byId.set(t.id, t);
  return [...byId.values()];
}
