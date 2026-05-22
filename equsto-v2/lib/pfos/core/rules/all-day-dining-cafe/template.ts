/**
 * PFOS Template: All Day Dining Cafe
 *
 * Örnek referans: The House Café, Big Chefs, Happy Moon's
 * Segment bazı: m² (5 bant: mikro / küçük / orta / büyük / kurumsal)
 * Koltuk yoğunluğu: 1 koltuk / 1.5 m² (all-day dining standardı)
 *
 * Kategori dağılımı:
 *   A — BAR & KAHVE
 *   B — SICAK SERVİS
 *   C — HAZIRLIK
 *   D — PASTANE & TATLI HAZIRLIK
 *   E — SOĞUK HAZIRLIK & SALATA
 *   F — PİZZA HAZIRLIK & SERVİS
 *   G — MUTFAK DEPOLAMA
 *   H — MUTFAK BULAŞIK
 *
 * %80 Standart Temel → tip: "zorunlu"
 * %20 Profesyonel Tercih → tip: "tavsiye" | "opsiyonel"
 */

import type { ConceptTemplate } from "../../engine-types";

export const allDayDiningCafe: ConceptTemplate = {
  konsept: "all-day-dining-cafe",
  label: "All Day Dining Cafe",
  ornekler: ["The House Café", "Big Chefs", "Happy Moon's", "Thehouse"],
  segmentBasis: "m2",
  seatDensity: 1.5,

  items: [

    // =========================================================
    // A — BAR & KAHVE
    // =========================================================

    {
      kategoriKodu: "A",
      altKategori: "A.3",
      urunTipi: "espresso-2-grup",
      isim: "Profesyonel Espresso Makinesi (2 grup)",
      tip: "zorunlu",
      scale: {
        type: "threshold",
        thresholds: [
          { minM2: 0,   adet: 1 },
          { minM2: 200, adet: 2 },
          { minM2: 400, adet: 3 },
        ],
      },
      elektrikGucuKwHint: 3.5,
      notlar: "All Day Dining'in kalbi. 200m²+ ikinci, 400m²+ üçüncü makine.",
    },

    {
      kategoriKodu: "A",
      altKategori: "A.3",
      urunTipi: "kahve-degirmeni",
      isim: "Profesyonel Kahve Değirmeni",
      tip: "zorunlu",
      scale: {
        type: "threshold",
        thresholds: [
          { minM2: 0,   adet: 1 },
          { minM2: 200, adet: 2 },
          { minM2: 400, adet: 3 },
        ],
      },
      elektrikGucuKwHint: 0.3,
      notlar: "Espresso makinesi adedi ile eşit.",
    },

    {
      kategoriKodu: "A",
      altKategori: "A.3",
      urunTipi: "filter-coffee-makinesi",
      isim: "Filter Kahve Makinesi",
      tip: "tavsiye",
      opsiyonelSebep: "sef-tercihi",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 2.0,
      notlar: "All Day Dining'de kalabalık sabah servisi için tavsiye edilir.",
    },

    {
      kategoriKodu: "A",
      altKategori: "A.3",
      urunTipi: "turk-kahvesi-makinesi",
      isim: "Türk Kahvesi Makinesi",
      tip: "opsiyonel",
      opsiyonelSebep: "sef-tercihi",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 1.5,
    },

    {
      kategoriKodu: "A",
      altKategori: "A.2",
      urunTipi: "buz-makinesi",
      isim: "Buz Makinesi",
      tip: "zorunlu",
      scale: {
        type: "threshold",
        thresholds: [
          { minM2: 0,   adet: 1 },
          { minM2: 200, adet: 2 },
        ],
      },
      elektrikGucuKwHint: 0.6,
      notlar: "Bar ve içecek servisi için zorunlu.",
    },

    {
      kategoriKodu: "A",
      altKategori: "A.2",
      urunTipi: "bar-sogutucu-setaltı",
      isim: "Setaltı Bar Soğutucusu",
      tip: "zorunlu",
      scale: { type: "threshold", thresholds: [
        { minM2: 0,   adet: 1 },
        { minM2: 150, adet: 2 },
      ]},
      elektrikGucuKwHint: 0.3,
    },

    {
      kategoriKodu: "A",
      altKategori: "A.4",
      urunTipi: "blender-bar",
      isim: "Bar Blender (smoothie / kokteyl)",
      tip: "zorunlu",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 1.5,
    },

    {
      kategoriKodu: "A",
      altKategori: "A.5",
      urunTipi: "sarap-dolabi",
      isim: "Şarapdolabı",
      tip: "opsiyonel",
      opsiyonelSebep: "yatirimci-karari",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 0.2,
      notlar: "Alkollü içecek lisansı + yatırımcı kararına bağlı.",
    },


    // =========================================================
    // B — SICAK SERVİS
    // =========================================================

    {
      kategoriKodu: "B",
      altKategori: "B.1",
      urunTipi: "davlumbaz",
      isim: "Endüstriyel Davlumbaz",
      tip: "zorunlu",
      scale: {
        type: "linear",
        perM2: 60,  // Her 60m² mutfak alanı için 1 davlumbaz bölümü
        min: 1,
        max: 4,
      },
      elektrikGucuKwHint: 1.5,
      notlar: "Equsto Atölyesi özel üretim. Ölçü projede belirlenir.",
    },

    {
      kategoriKodu: "B",
      altKategori: "B.2",
      urunTipi: "ocak-4-gozlu",
      isim: "4 Gözlü Setüstü Ocak (gazlı)",
      tip: "zorunlu",
      scale: {
        type: "threshold",
        thresholds: [
          { minM2: 0,   adet: 1 },
          { minM2: 150, adet: 2 },
          { minM2: 350, adet: 3 },
        ],
      },
      gazGucuKwHint: 14,
      notlar: "Temel pişirme hattı.",
    },

    {
      kategoriKodu: "B",
      altKategori: "B.2",
      urunTipi: "izgara-setustü",
      isim: "Setüstü Izgara (gazlı)",
      tip: "zorunlu",
      scale: { type: "fixed", adet: 1 },
      gazGucuKwHint: 6,
    },

    {
      kategoriKodu: "B",
      altKategori: "B.2",
      urunTipi: "friteuse-setustü",
      isim: "Setüstü Fritöz (2x8L)",
      tip: "zorunlu",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 6,
    },

    {
      kategoriKodu: "B",
      altKategori: "B.3",
      urunTipi: "salamander",
      isim: "Salamander",
      tip: "zorunlu",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 4,
      notlar: "Tabak finishing ve servis öncesi ısıtma.",
    },

    {
      kategoriKodu: "B",
      altKategori: "B.3",
      urunTipi: "combi-firin",
      isim: "Combi Fırın (6 tepsi GN 1/1)",
      tip: "zorunlu",
      scale: {
        type: "threshold",
        thresholds: [
          { minM2: 0,   adet: 1 },
          { minM2: 300, adet: 2 },
        ],
      },
      elektrikGucuKwHint: 11,
      notlar: "All Day Dining için temel fırın. 300m²+ ikinci ünite.",
    },

    {
      kategoriKodu: "B",
      altKategori: "B.4",
      urunTipi: "setaltı-buzdolabı",
      isim: "Setaltı Buzdolabı (servis hattı)",
      tip: "zorunlu",
      scale: {
        type: "linear",
        perM2: 80,
        min: 1,
        max: 4,
      },
      elektrikGucuKwHint: 0.25,
    },

    {
      kategoriKodu: "B",
      altKategori: "B.5",
      urunTipi: "heat-lamp-servis",
      isim: "Heat Lamp (servis tezgahı üstü)",
      tip: "tavsiye",
      opsiyonelSebep: "mutfak-ihtiyaci",
      scale: {
        type: "threshold",
        thresholds: [
          { minM2: 0,   adet: 1 },
          { minM2: 200, adet: 2 },
        ],
      },
      elektrikGucuKwHint: 1.0,
    },


    // =========================================================
    // C — HAZIRLIK
    // =========================================================

    {
      kategoriKodu: "C",
      altKategori: "C.1",
      urunTipi: "calisma-tezgahi-cekmeceli",
      isim: "Çalışma Tezgahı (blok çekmeceli)",
      tip: "zorunlu",
      scale: {
        type: "linear",
        perM2: 50,
        min: 1,
        max: 6,
      },
      notlar: "Equsto Atölyesi özel üretim. Ölçü projede belirlenir.",
    },

    {
      kategoriKodu: "C",
      altKategori: "C.2",
      urunTipi: "hazirlik-buzdolabı",
      isim: "Hazırlık Buzdolabı (tezgah tipi)",
      tip: "zorunlu",
      scale: { type: "threshold", thresholds: [
        { minM2: 0,   adet: 1 },
        { minM2: 200, adet: 2 },
      ]},
      elektrikGucuKwHint: 0.3,
    },

    {
      kategoriKodu: "C",
      altKategori: "C.3",
      urunTipi: "vakum-makinesi",
      isim: "Vakum Makinesi",
      tip: "tavsiye",
      opsiyonelSebep: "sef-tercihi",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 0.5,
    },

    {
      kategoriKodu: "C",
      altKategori: "C.3",
      urunTipi: "dilimleme-makinesi",
      isim: "Dilimleme Makinesi",
      tip: "opsiyonel",
      opsiyonelSebep: "sef-tercihi",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 0.15,
      notlar: "Şarküteri/mezze ağırlıklı menülerde gerekebilir.",
    },


    // =========================================================
    // D — PASTANE & TATLI HAZIRLIK
    // All Day Dining'in olmazsa olmazı
    // =========================================================

    {
      kategoriKodu: "D",
      altKategori: "D.1",
      urunTipi: "mikser-planet",
      isim: "Planet Mikser",
      tip: "zorunlu",
      scale: { type: "threshold", thresholds: [
        { minM2: 0,   adet: 1 },
        { minM2: 300, adet: 2 },
      ]},
      elektrikGucuKwHint: 1.3,
    },

    {
      kategoriKodu: "D",
      altKategori: "D.2",
      urunTipi: "konveksiyon-firin-pastane",
      isim: "Konveksiyonlu Fırın (pastane)",
      tip: "zorunlu",
      scale: { type: "threshold", thresholds: [
        { minM2: 0,   adet: 1 },
        { minM2: 250, adet: 2 },
      ]},
      elektrikGucuKwHint: 3.0,
    },

    {
      kategoriKodu: "D",
      altKategori: "D.2",
      urunTipi: "waffle-makinesi",
      isim: "Waffle / Pancake Makinesi",
      tip: "tavsiye",
      opsiyonelSebep: "sef-tercihi",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 1.5,
      notlar: "All Day Dining sabah menüsünde standart hale geldi.",
    },

    {
      kategoriKodu: "D",
      altKategori: "D.3",
      urunTipi: "pastane-vitrin-soguk",
      isim: "Soğuk Pastane Vitrini",
      tip: "zorunlu",
      scale: { type: "threshold", thresholds: [
        { minM2: 0,   adet: 1 },
        { minM2: 200, adet: 2 },
      ]},
      elektrikGucuKwHint: 0.4,
      notlar: "All Day Dining'in görsel merkezi. Müşteriye dönük konumlanır.",
    },

    {
      kategoriKodu: "D",
      altKategori: "D.4",
      urunTipi: "sicak-yemek-display",
      isim: "Sıcak Yemek Display (open buffet ünitesi)",
      tip: "opsiyonel",
      opsiyonelSebep: "mutfak-ihtiyaci",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 1.2,
      notlar: "Açık büfe servis modeli varsa eklenir.",
    },


    // =========================================================
    // E — SOĞUK HAZIRLIK & SALATA
    // =========================================================

    {
      kategoriKodu: "E",
      altKategori: "E.3",
      urunTipi: "saladette",
      isim: "Saladette (soğutmalı salata tezgahı)",
      tip: "zorunlu",
      scale: { type: "threshold", thresholds: [
        { minM2: 0,   adet: 1 },
        { minM2: 250, adet: 2 },
      ]},
      elektrikGucuKwHint: 0.3,
    },

    {
      kategoriKodu: "E",
      altKategori: "E.1",
      urunTipi: "soguk-hazirlik-tezgahi",
      isim: "Soğuk Hazırlık Çalışma Tezgahı",
      tip: "zorunlu",
      scale: {
        type: "linear",
        perM2: 100,
        min: 1,
        max: 3,
      },
      notlar: "Equsto Atölyesi özel üretim.",
    },


    // =========================================================
    // F — PİZZA HAZIRLIK & SERVİS
    // =========================================================

    {
      kategoriKodu: "F",
      altKategori: "F.1",
      urunTipi: "spiral-mikser-hamur",
      isim: "Spiral Hamur Mikseri",
      tip: "zorunlu",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 1.5,
    },

    {
      kategoriKodu: "F",
      altKategori: "F.2",
      urunTipi: "pizza-prep-tezgahi",
      isim: "Pizza Prep Tezgahı (soğutmalı)",
      tip: "zorunlu",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 0.3,
    },

    {
      kategoriKodu: "F",
      altKategori: "F.3",
      urunTipi: "pizza-firin-kubbeli",
      isim: "Pizza Fırını (kubbeli, dijital)",
      tip: "zorunlu",
      scale: { type: "threshold", thresholds: [
        { minM2: 0,   adet: 1 },
        { minM2: 300, adet: 2 },
      ]},
      elektrikGucuKwHint: 8.5,
      notlar: "300m²+ ikinci fırın; servis kapasitesi için.",
    },


    // =========================================================
    // G — MUTFAK DEPOLAMA
    // =========================================================

    {
      kategoriKodu: "G",
      altKategori: "G.1",
      urunTipi: "dik-buzdolabı-depo",
      isim: "Dik Tip Depo Buzdolabı",
      tip: "zorunlu",
      scale: { type: "threshold", thresholds: [
        { minM2: 0,   adet: 1 },
        { minM2: 100, adet: 2 },
        { minM2: 250, adet: 3 },
        { minM2: 400, adet: 4 },
      ]},
      elektrikGucuKwHint: 0.4,
    },

    {
      kategoriKodu: "G",
      altKategori: "G.2",
      urunTipi: "derin-dondurucu-depo",
      isim: "Derin Dondurucu (dik tip)",
      tip: "zorunlu",
      scale: { type: "threshold", thresholds: [
        { minM2: 0,   adet: 1 },
        { minM2: 200, adet: 2 },
      ]},
      elektrikGucuKwHint: 0.3,
    },

    {
      kategoriKodu: "G",
      altKategori: "G.3",
      urunTipi: "kuru-depo-raf",
      isim: "Kuru Depo Raflama (katlı istif)",
      tip: "zorunlu",
      scale: {
        type: "linear",
        perM2: 30,
        min: 2,
        max: 12,
      },
      notlar: "Equsto Atölyesi özel üretim.",
    },

    {
      kategoriKodu: "G",
      altKategori: "G.4",
      urunTipi: "dizden-kumandalı-evye",
      isim: "Dizden Kumandalı El Yıkama Evyesi",
      tip: "zorunlu",
      scale: { type: "threshold", thresholds: [
        { minM2: 0,   adet: 1 },
        { minM2: 200, adet: 2 },
      ]},
      notlar: "Hijyen zorunluluğu. Her bölüm girişinde.",
    },


    // =========================================================
    // H — MUTFAK BULAŞIK
    // =========================================================

    {
      kategoriKodu: "H",
      altKategori: "H.2",
      urunTipi: "bulasik-makinesi-kapasiteli",
      isim: "Giyotin Bulaşık Makinesi",
      tip: "zorunlu",
      scale: {
        type: "per-seat",
        perSeat: 60, // Her 60 koltuğa 1 bulaşık makinesi
        min: 1,
        max: 3,
      },
      elektrikGucuKwHint: 4.5,
      notlar: "Kapasite koltuk sayısına göre belirlenir.",
    },

    {
      kategoriKodu: "H",
      altKategori: "H.4",
      urunTipi: "glass-washer",
      isim: "Bar Bulaşık Makinesi (glass washer)",
      tip: "zorunlu",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 2.5,
      notlar: "Bar bölümüne bağlı; bardak ve cocktail ekipmanları için.",
    },

    {
      kategoriKodu: "H",
      altKategori: "H.1",
      urunTipi: "cop-siyirma-tezgahi",
      isim: "Çöp Sıyırma & Bulaşık Giriş Tezgahı",
      tip: "zorunlu",
      scale: { type: "fixed", adet: 1 },
      notlar: "Equsto Atölyesi özel üretim.",
    },

    {
      kategoriKodu: "H",
      altKategori: "H.3",
      urunTipi: "bulasik-cikis-tezgahi",
      isim: "Bulaşık Çıkış Tezgahı & Duvar Rafı",
      tip: "zorunlu",
      scale: { type: "fixed", adet: 1 },
      notlar: "Equsto Atölyesi özel üretim.",
    },

  ],
};
