/**
 * PFOS Template: Coffee Shop
 *
 * Referans: Espressolab Kuştepe (2017-150) + Watergarden AVM (2016-117-1)
 * m²: 60–300  |  Koltuk yoğunluğu: 1 koltuk / 1.5 m²
 *
 * TEMEL KURAL: Ekipman seti 60m² ile 300m² arasında DEĞİŞMEZ.
 * Salt bar kurulumu; davlumbaz yok, giyotin bulaşık yok.
 *
 * Konsept imzaları:
 *   — Espresso + değirmen çifti CORE ekipman
 *   — Buz 90 kg/gün sabit
 *   — Speed oven (Merry Chef) + Unox fırın çifti
 *   — Soğuk teşhir dolabı (pastane vitrini)
 *   — Setaltı glass washer — giyotin yok
 *   — Davlumbaz yok (pure bar setup)
 */

import type { ConceptTemplate } from "../../engine-types";

export const coffeeShop: ConceptTemplate = {
  konsept: "coffee-shop",
  label: "Coffee Shop",
  ornekler: ["Espressolab", "Coffee Sapiens", "Starbucks", "Black Sheep", "Petra"],
  segmentBasis: "m2",
  seatDensity: 1.5,

  items: [

    // =========================================================
    // A — ESPRESSO & KAHVE BARI (CORE)
    // =========================================================

    {
      kategoriKodu: "A",
      altKategori: "A.3",
      urunTipi: "espresso-2-grup",
      isim: "Profesyonel Espresso Makinası (2 Grup)",
      tip: "zorunlu",
      scale: { type: "threshold", thresholds: [
        { minM2: 0,   adet: 1 },
        { minM2: 200, adet: 2 },
      ]},
      elektrikGucuKwHint: 3.5,
      notlar: "Coffee shop'un kalbi. 200m²+ için ikinci makine.",
    },

    {
      kategoriKodu: "A",
      altKategori: "A.3",
      urunTipi: "kahve-degirmeni",
      isim: "Profesyonel Kahve Değirmeni",
      tip: "zorunlu",
      scale: { type: "threshold", thresholds: [
        { minM2: 0,   adet: 1 },
        { minM2: 200, adet: 2 },
      ]},
      elektrikGucuKwHint: 0.3,
      notlar: "Espresso makinası adediyle eşit.",
    },

    {
      kategoriKodu: "A",
      altKategori: "A.3",
      urunTipi: "filter-coffee-makinesi",
      isim: "Filter Kahve Makinası",
      tip: "zorunlu",
      scale: { type: "fixed", adet: 2 },
      elektrikGucuKwHint: 2.0,
      notlar: "Espressolab: 2 adet filtre kahve standart.",
    },

    {
      kategoriKodu: "A",
      altKategori: "A.3",
      urunTipi: "turk-kahvesi-makinasi",
      isim: "Türk Kahvesi Makinası",
      tip: "tavsiye",
      opsiyonelSebep: "sef-tercihi",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 1.5,
    },

    {
      kategoriKodu: "A",
      altKategori: "A.2",
      urunTipi: "buz-makinesi-90kg",
      isim: "Buz Makinası (90 kg/gün)",
      tip: "zorunlu",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 0.6,
      notlar: "Coffee shop için 90 kg/gün sabit; smoothie + soğuk içecek + buz.",
    },

    {
      kategoriKodu: "A",
      altKategori: "A.4",
      urunTipi: "smoothie-blender",
      isim: "Smoothie / Bar Blender",
      tip: "zorunlu",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 1.5,
    },

    {
      kategoriKodu: "A",
      altKategori: "A.4",
      urunTipi: "portakal-sikma-otomatik",
      isim: "Otomatik Portakal Sıkma Makinası",
      tip: "tavsiye",
      opsiyonelSebep: "yatirimci-karari",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 0.25,
    },

    {
      kategoriKodu: "A",
      altKategori: "A.2",
      urunTipi: "sise-sogutucu-2-kapili",
      isim: "Şişe Soğutucu (2 Kapılı)",
      tip: "zorunlu",
      scale: { type: "threshold", thresholds: [
        { minM2: 0,   adet: 1 },
        { minM2: 180, adet: 2 },
      ]},
      elektrikGucuKwHint: 0.2,
    },


    // =========================================================
    // B — YEMEK HAZIRLAMA (minimal)
    // Speed oven + Unox çifti — davlumbaz yok
    // =========================================================

    {
      kategoriKodu: "B",
      altKategori: "B.3",
      urunTipi: "speed-oven-merry-chef",
      isim: "Speed Oven (Merry Chef / Speed Cook)",
      tip: "zorunlu",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 3.2,
      notlar: "Sandviç, tost, ısıtma. Davlumbaz gerektirmez.",
    },

    {
      kategoriKodu: "B",
      altKategori: "B.3",
      urunTipi: "konveksiyon-firin-unox",
      isim: "Konveksiyonlu Fırın (Unox / Patisserie)",
      tip: "zorunlu",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 3.0,
      notlar: "Pastane ve sandviç fırınlama. Speed oven ile çift sistem.",
    },

    {
      kategoriKodu: "B",
      altKategori: "B.3",
      urunTipi: "mikrodalgali-firin",
      isim: "Mikrodalgalı Fırın (Profesyonel)",
      tip: "tavsiye",
      opsiyonelSebep: "sef-tercihi",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 1.8,
    },


    // =========================================================
    // D — PASTANE / SOĞUK TEŞHİR
    // =========================================================

    {
      kategoriKodu: "D",
      altKategori: "D.3",
      urunTipi: "soguk-tesir-dolabi-pastane",
      isim: "Soğuk Teşhir Dolabı (Pastane Vitrini)",
      tip: "zorunlu",
      scale: { type: "threshold", thresholds: [
        { minM2: 0,   adet: 1 },
        { minM2: 180, adet: 2 },
      ]},
      elektrikGucuKwHint: 0.4,
      notlar: "Coffee shop ürün gamının görsel merkezi.",
    },


    // =========================================================
    // G — DEPOLAMA (minimal)
    // =========================================================

    {
      kategoriKodu: "G",
      altKategori: "G.1",
      urunTipi: "depo-buzdolabi-tek-kapili",
      isim: "Depo Tipi Buzdolabı (Tek Kapılı)",
      tip: "zorunlu",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 0.4,
    },

    {
      kategoriKodu: "G",
      altKategori: "G.2",
      urunTipi: "depo-derin-dondurucu",
      isim: "Depo Tipi Derin Dondurucu",
      tip: "zorunlu",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 0.3,
    },

    {
      kategoriKodu: "G",
      altKategori: "G.3",
      urunTipi: "kuru-depo-raf",
      isim: "Kuru Depo Raflama",
      tip: "zorunlu",
      scale: { type: "fixed", adet: 2 },
    },


    // =========================================================
    // H — YIKAMA
    // Glass washer setaltı — giyotin YOK, davlumbaz YOK
    // =========================================================

    {
      kategoriKodu: "H",
      altKategori: "H.4",
      urunTipi: "glass-washer",
      isim: "Bardak Yıkama Makinası (Setaltı, Bar Glass Washer)",
      tip: "zorunlu",
      scale: { type: "threshold", thresholds: [
        { minM2: 0,   adet: 1 },
        { minM2: 200, adet: 2 },
      ]},
      elektrikGucuKwHint: 2.5,
      notlar: "Coffee shop'ta giyotin bulaşık yok; sadece setaltı glass washer.",
    },

    {
      kategoriKodu: "H",
      altKategori: "H.1",
      urunTipi: "evye-cift-gozlu",
      isim: "Çift Gözlü Evye (Bar)",
      tip: "zorunlu",
      scale: { type: "fixed", adet: 1 },
    },

  ],
};
