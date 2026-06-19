/**
 * PFOS Template: Pizzacı
 *
 * Referans: Pizzacı Avcılar (2025-116-1)
 * m²: 80–300  |  Koltuk yoğunluğu: 1 koltuk / 1.0 m²
 *
 * Konsept imzaları:
 *   — Kubbeli pizza fırını (gazlı, döner tabanlı) ANA ekipman
 *   — Hamur bölümü ZORUNLU (outsource seçeneği yok)
 *   — Pizza teşhir hattı + pasta-sandviç dolabı ön cephede
 *   — Hafif pişirme hattı (ocak + ızgara + fritöz): kahvaltı ve tava yemekleri
 */

import type { ConceptTemplate } from "../../engine-types";

export const pizzaci: ConceptTemplate = {
  konsept: "pizzaci",
  label: "Pizzacı",
  ornekler: ["Mialiento", "Pizza Il Forno", "Domino's Dark Kitchen", "Köşe Pizzacı"],
  segmentBasis: "m2",
  seatDensity: 1.0,

  items: [

    // =========================================================
    // A — BAR & İÇECEK
    // =========================================================

    {
      kategoriKodu: "A",
      altKategori: "A.3",
      urunTipi: "espresso-2-grup",
      isim: "Espresso Makinası (2 Grup)",
      tip: "tavsiye",
      opsiyonelSebep: "yatirimci-karari",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 3.5,
    },

    {
      kategoriKodu: "A",
      altKategori: "A.3",
      urunTipi: "kahve-degirmeni",
      isim: "Kahve Değirmeni",
      tip: "tavsiye",
      opsiyonelSebep: "yatirimci-karari",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 0.3,
    },

    {
      kategoriKodu: "A",
      altKategori: "A.3",
      urunTipi: "cay-ocagi-2-demlikli",
      isim: "Çay Ocağı (2 Demlikli)",
      tip: "tavsiye",
      opsiyonelSebep: "sef-tercihi",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 2.0,
    },

    {
      kategoriKodu: "A",
      altKategori: "A.4",
      urunTipi: "portakal-sikma-otomatik",
      isim: "Otomatik Portakal Sıkma Makinası",
      tip: "tavsiye",
      opsiyonelSebep: "sef-tercihi",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 0.25,
    },

    {
      kategoriKodu: "A",
      altKategori: "A.2",
      urunTipi: "buz-makinesi",
      isim: "Buz Makinası",
      tip: "zorunlu",
      scale: { type: "threshold", thresholds: [
        { minM2: 0,   adet: 1 },
        { minM2: 200, adet: 2 },
      ]},
      elektrikGucuKwHint: 0.6,
    },

    {
      kategoriKodu: "A",
      altKategori: "A.2",
      urunTipi: "icecek-dolabi-onu-acik",
      isim: "Dik Tip İçecek Dolabı (Önü Açık)",
      tip: "zorunlu",
      scale: { type: "threshold", thresholds: [
        { minM2: 0,   adet: 1 },
        { minM2: 200, adet: 2 },
      ]},
      elektrikGucuKwHint: 0.35,
      notlar: "Müşteri self-service için; ön cephede konumlanır.",
    },

    {
      kategoriKodu: "A",
      altKategori: "A.2",
      urunTipi: "icecek-dolabi-tek-kapili",
      isim: "Dik Tip İçecek Dolabı (Tek Kapılı)",
      tip: "zorunlu",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 0.2,
    },


    // =========================================================
    // B — SICAK SERVİS (hafif pişirme hattı)
    // Kahvaltı + tava yemekleri için kompakt hat
    // =========================================================

    {
      kategoriKodu: "B",
      altKategori: "B.1",
      urunTipi: "davlumbaz",
      isim: "Davlumbaz (Duvar Tipi, Filtreli)",
      tip: "zorunlu",
      scale: { type: "linear", perM2: 80, min: 1, max: 3 },
      elektrikGucuKwHint: 1.5,
      notlar: "Equsto Atölyesi özel üretim.",
    },

    {
      kategoriKodu: "B",
      altKategori: "B.2",
      urunTipi: "ocak-4-gozlu",
      isim: "4 Gözlü Setüstü Ocak (Gazlı)",
      tip: "zorunlu",
      scale: { type: "fixed", adet: 1 },
      gazGucuKwHint: 14,
    },

    {
      kategoriKodu: "B",
      altKategori: "B.2",
      urunTipi: "plate-izgara-gazli",
      isim: "Plate Izgara (Gazlı, Setüstü)",
      tip: "zorunlu",
      scale: { type: "fixed", adet: 1 },
      gazGucuKwHint: 6,
      notlar: "Kahvaltı ve tava yemekleri için.",
    },

    {
      kategoriKodu: "B",
      altKategori: "B.2",
      urunTipi: "friteuse-cift-hazneli",
      isim: "Fritöz (Çift Hazneli, Elektrikli)",
      tip: "zorunlu",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 8,
    },

    {
      kategoriKodu: "B",
      altKategori: "B.2",
      urunTipi: "makarna-pisirici",
      isim: "Makarna Pişirici (Elektrikli, Setüstü)",
      tip: "zorunlu",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 3.5,
    },

    {
      kategoriKodu: "B",
      altKategori: "B.2",
      urunTipi: "patates-dinlendirme",
      isim: "Patates Dinlendirme Ünitesi (Elektrikli, Setüstü)",
      tip: "tavsiye",
      opsiyonelSebep: "sef-tercihi",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 0.5,
    },

    {
      kategoriKodu: "B",
      altKategori: "B.4",
      urunTipi: "cihazalti-buzdolabi-cekme",
      isim: "Cihazaltı Buzdolabı (Çift Sıra Çekmeceli)",
      tip: "zorunlu",
      scale: { type: "threshold", thresholds: [
        { minM2: 0,   adet: 1 },
        { minM2: 200, adet: 2 },
      ]},
      elektrikGucuKwHint: 0.25,
    },


    // =========================================================
    // F — PİZZA HAZIRLIK & SERVİS
    // Konseptin kalbi — en ağır kategorisi
    // =========================================================

    {
      kategoriKodu: "F",
      altKategori: "F.1",
      urunTipi: "spiral-mikser-hamur",
      isim: "Spiral Hamur Yoğurma Makinası (40 kg)",
      tip: "zorunlu",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 1.5,
      notlar: "Hamur bölümü ZORUNLU. Outsource seçeneği konsept gereği geçersiz.",
    },

    {
      kategoriKodu: "F",
      altKategori: "F.1",
      urunTipi: "konik-yuvarlama-makinasi",
      isim: "Konik Yuvarlama Makinası",
      tip: "zorunlu",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 0.37,
    },

    {
      kategoriKodu: "F",
      altKategori: "F.1",
      urunTipi: "un-seker-arabasi",
      isim: "Un-Şeker Arabası (103 Lt)",
      tip: "zorunlu",
      scale: { type: "threshold", thresholds: [
        { minM2: 0,   adet: 2 },
        { minM2: 200, adet: 3 },
      ]},
    },

    {
      kategoriKodu: "F",
      altKategori: "F.2",
      urunTipi: "mermer-tablali-tezgah-hamur",
      isim: "Mermer Tablalı Çalışma Tezgahı (Hamur Açma)",
      tip: "zorunlu",
      scale: { type: "fixed", adet: 1 },
    },

    {
      kategoriKodu: "F",
      altKategori: "F.2",
      urunTipi: "pizza-prep-tezgahi-sogutu",
      isim: "Pizza Prep Tezgahı (Make-up, Soğutmalı)",
      tip: "zorunlu",
      scale: { type: "threshold", thresholds: [
        { minM2: 0,   adet: 1 },
        { minM2: 200, adet: 2 },
      ]},
      elektrikGucuKwHint: 0.3,
    },

    {
      kategoriKodu: "F",
      altKategori: "F.3",
      urunTipi: "pizza-firin-kubbeli-gazli",
      isim: "Kubbeli Pizza Fırını (Döner Tabanlı, Gazlı, Dijital) — 300 pizza/h",
      tip: "zorunlu",
      scale: { type: "threshold", thresholds: [
        { minM2: 0,   adet: 1 },
        { minM2: 200, adet: 2 },
      ]},
      gazGucuKwHint: 22,
      notlar: "Konseptin ana yatırım kalemi. 300 pizza/h kapasite.",
    },

    {
      kategoriKodu: "F",
      altKategori: "F.3",
      urunTipi: "pizza-firin-elektrik-tek-katli",
      isim: "Tek Katlı Pizza Fırını (Elektrikli) — Yedek",
      tip: "zorunlu",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 3.0,
      notlar: "Kubbeli fırın yanında yedek/slow-bake fırın; yoğun saatlerde paralel çalışır.",
    },

    {
      kategoriKodu: "F",
      altKategori: "F.3",
      urunTipi: "firin-davlumbazi-dekoratif",
      isim: "Fırın Davlumbazı (Dekoratif)",
      tip: "zorunlu",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 0.5,
      notlar: "Equsto Atölyesi özel üretim. Kubbeli fırın üzeri; müşteriye görünür alan.",
    },

    {
      kategoriKodu: "F",
      altKategori: "F.4",
      urunTipi: "pizza-servis-buzdolabi",
      isim: "Pizza Servis Buzdolabı (Teşhir Hattı)",
      tip: "zorunlu",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 0.3,
    },

    {
      kategoriKodu: "F",
      altKategori: "F.4",
      urunTipi: "pizza-tesir-unitesi",
      isim: "Pizza Teşhir Ünitesi",
      tip: "zorunlu",
      scale: { type: "threshold", thresholds: [
        { minM2: 0,   adet: 1 },
        { minM2: 200, adet: 2 },
      ]},
      elektrikGucuKwHint: 0.4,
      notlar: "Müşteriye dönük ön cephe; dekorasyon hariç.",
    },

    {
      kategoriKodu: "F",
      altKategori: "F.4",
      urunTipi: "pasta-sandvic-dolabi-3-katli",
      isim: "Pasta ve Sandviç Dolabı (3 Katlı, Soğutmalı)",
      tip: "zorunlu",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 0.5,
      notlar: "Ön cephe teşhir; kahvaltı ve sandviç ürünleri için.",
    },


    // =========================================================
    // G — MUTFAK DEPOLAMA
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
      altKategori: "G.1",
      urunTipi: "pizza-depo-buzdolabi",
      isim: "Depo Tipi Pizza Buzdolabı (Tepsi Raflı)",
      tip: "zorunlu",
      scale: { type: "threshold", thresholds: [
        { minM2: 0,   adet: 1 },
        { minM2: 200, adet: 2 },
      ]},
      elektrikGucuKwHint: 0.4,
      notlar: "Hamur bezeleri ve hazır pizzalar için özel raflı sistem.",
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
      scale: { type: "linear", perM2: 40, min: 2, max: 8 },
    },


    // =========================================================
    // H — MUTFAK BULAŞIK
    // =========================================================

    {
      kategoriKodu: "H",
      altKategori: "H.2",
      urunTipi: "bulasik-makinesi-giyotin",
      isim: "Giyotin Bulaşık Makinası (1000 Tb/s)",
      tip: "zorunlu",
      scale: { type: "per-seat", perSeat: 70, min: 1, max: 2 },
      elektrikGucuKwHint: 4.5,
    },

    {
      kategoriKodu: "H",
      altKategori: "H.1",
      urunTipi: "cop-siyirma-tezgahi",
      isim: "Bulaşık Sıyırma Tezgahı",
      tip: "zorunlu",
      scale: { type: "fixed", adet: 1 },
    },

    {
      kategoriKodu: "H",
      altKategori: "H.3",
      urunTipi: "bym-cikis-tezgahi",
      isim: "BYM Çıkış Tezgahı + Raf",
      tip: "zorunlu",
      scale: { type: "fixed", adet: 1 },
    },

  ],
};
