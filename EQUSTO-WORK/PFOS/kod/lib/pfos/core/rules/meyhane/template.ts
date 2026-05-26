/**
 * PFOS Template: Meyhane / Mezeli Restoran
 *
 * Referans: Kıyıistanbul Mezeci (2023-041-1)
 * m²: 100–500  |  Koltuk yoğunluğu: 1 koltuk / 2.0 m²
 *
 * Segment profilleri:
 *   Küçük  100–150m²  → 6m² +4 / 6m² -18 soğuk oda, temel bar, meze mostra
 *   Orta   150–250m²  → ~8m² odalar, cocktail tavsiye
 *   Büyük  250–500m²  → Kıyıistanbul profili, cocktail zorunlu, sahne bar opsiyonel
 *
 * Konsept imzaları:
 *   — Meze Mostra her ölçekte ZORUNLU (meyhane kültürünün tanımlayıcısı)
 *   — 2 ayrı soğuk oda (+4°C / -18°C)
 *   — Çay Servis Bölümü: 4 demlikli arıtmalı çay + Türk kahvesi x2
 *   — Bar: şişe soğutucu ağır; rakı kültürü
 */

import type { ConceptTemplate } from "../../engine-types";

export const meyhane: ConceptTemplate = {
  konsept: "meyhane",
  label: "Meyhane / Mezeli Restoran",
  ornekler: ["Kıyıistanbul", "Şazeli", "Çiya", "Boncuk", "Yakup 2"],
  segmentBasis: "m2",
  seatDensity: 2.0,

  items: [

    // =========================================================
    // A — BAR & KAHVE
    // Rakı + meyhane içeceği yoğun; şişe soğutucu ağır
    // =========================================================

    {
      kategoriKodu: "A",
      altKategori: "A.3",
      urunTipi: "espresso-2-grup",
      isim: "Espresso Makinası (2 Grup)",
      tip: "zorunlu",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 3.5,
    },

    {
      kategoriKodu: "A",
      altKategori: "A.3",
      urunTipi: "kahve-degirmeni",
      isim: "Kahve Değirmeni",
      tip: "zorunlu",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 0.3,
    },

    {
      kategoriKodu: "A",
      altKategori: "A.4",
      urunTipi: "portakal-sikma-otomatik",
      isim: "Otomatik Portakal Sıkma (Santos No:11)",
      tip: "zorunlu",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 0.25,
    },

    {
      kategoriKodu: "A",
      altKategori: "A.4",
      urunTipi: "kati-meyve-sikacagi",
      isim: "Katı Meyve Sıkacağı",
      tip: "tavsiye",
      opsiyonelSebep: "sef-tercihi",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 0.3,
    },

    {
      kategoriKodu: "A",
      altKategori: "A.2",
      urunTipi: "buz-makinesi",
      isim: "Buz Makinası",
      tip: "zorunlu",
      scale: { type: "threshold", thresholds: [
        { minM2: 0,   adet: 1 },   // ~50 kg/gün
        { minM2: 250, adet: 2 },   // her bar için ayrı
      ]},
      elektrikGucuKwHint: 0.6,
    },

    {
      kategoriKodu: "A",
      altKategori: "A.1",
      urunTipi: "sise-sogutucu-3-kapili",
      isim: "Şişe Soğutucu (3 Kapılı)",
      tip: "zorunlu",
      scale: { type: "threshold", thresholds: [
        { minM2: 0,   adet: 1 },
        { minM2: 150, adet: 2 },
        { minM2: 300, adet: 3 },   // Kıyıistanbul: 3 adet
      ]},
      elektrikGucuKwHint: 0.2,
      notlar: "Rakı kültüründe şişe soğutucu kapasitesi kritik.",
    },

    {
      kategoriKodu: "A",
      altKategori: "A.4",
      urunTipi: "bar-blender",
      isim: "Bar Blender",
      tip: "zorunlu",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 1.5,
    },

    {
      kategoriKodu: "A",
      altKategori: "A.1",
      urunTipi: "cocktail-istasyonu",
      isim: "Cocktail İstasyonu",
      tip: "opsiyonel",
      opsiyonelSebep: "yatirimci-karari",
      scale: { type: "fixed", adet: 1 },
      minM2: 150,
      notlar: "150m² altı meyhane: yok. 150-250m²: opsiyonel. 250m²+: tavsiye.",
    },

    // Sahne Bar — 250m²+ büyük meyhanelerde
    {
      kategoriKodu: "A",
      altKategori: "A.1",
      urunTipi: "sahne-bar-setup",
      isim: "Sahne Bar Kurulumu (Buz + Şişe Soğutucu)",
      tip: "opsiyonel",
      opsiyonelSebep: "mutfak-ihtiyaci",
      scale: { type: "fixed", adet: 1 },
      minM2: 300,
      notlar: "Canlı müzik / sahne olan büyük meyhanelerde; yönetim kararı.",
    },


    // =========================================================
    // B — SICAK SERVİS
    // =========================================================

    {
      kategoriKodu: "B",
      altKategori: "B.1",
      urunTipi: "davlumbaz",
      isim: "Davlumbaz (Duvar Tipi)",
      tip: "zorunlu",
      scale: { type: "linear", perM2: 60, min: 1, max: 4 },
      elektrikGucuKwHint: 1.5,
    },

    {
      kategoriKodu: "B",
      altKategori: "B.2",
      urunTipi: "ocak-4-gozlu",
      isim: "4 Gözlü Setüstü Ocak (Gazlı)",
      tip: "zorunlu",
      scale: { type: "threshold", thresholds: [
        { minM2: 0,   adet: 1 },
        { minM2: 200, adet: 2 },
        { minM2: 350, adet: 3 },
      ]},
      gazGucuKwHint: 14,
    },

    {
      kategoriKodu: "B",
      altKategori: "B.2",
      urunTipi: "izgara-gazli",
      isim: "Izgara (Gazlı, Setüstü)",
      tip: "zorunlu",
      scale: { type: "fixed", adet: 1 },
      gazGucuKwHint: 6,
    },

    {
      kategoriKodu: "B",
      altKategori: "B.3",
      urunTipi: "combi-firin",
      isim: "Combi Fırın (6 Tepsi GN 1/1)",
      tip: "zorunlu",
      scale: { type: "threshold", thresholds: [
        { minM2: 0,   adet: 1 },
        { minM2: 350, adet: 2 },
      ]},
      elektrikGucuKwHint: 11,
    },

    {
      kategoriKodu: "B",
      altKategori: "B.3",
      urunTipi: "salamander",
      isim: "Salamander",
      tip: "zorunlu",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 4,
    },

    {
      kategoriKodu: "B",
      altKategori: "B.4",
      urunTipi: "setaltı-buzdolabi",
      isim: "Setaltı Buzdolabı (Servis Hattı)",
      tip: "zorunlu",
      scale: { type: "threshold", thresholds: [
        { minM2: 0,   adet: 1 },
        { minM2: 250, adet: 2 },
      ]},
      elektrikGucuKwHint: 0.25,
    },


    // =========================================================
    // C — HAZIRLIK + MEZE HAZIRLIK
    // Meze Mostra bu konseptin tanımlayıcısı
    // =========================================================

    {
      kategoriKodu: "E",
      altKategori: "E.1",
      urunTipi: "meze-mostra",
      isim: "Meze Mostra (Soğutmalı Teşhir Dolabı)",
      tip: "zorunlu",
      scale: { type: "threshold", thresholds: [
        { minM2: 0,   adet: 1 },   // 120-150cm
        { minM2: 250, adet: 2 },   // 180-200cm × 2
      ]},
      elektrikGucuKwHint: 0.4,
      notlar: "Meyhane kültürünün tanımlayıcı ekipmanı. Müşteriye açık, servis alanında.",
    },

    {
      kategoriKodu: "C",
      altKategori: "C.1",
      urunTipi: "calisma-tezgahi-cekmeceli",
      isim: "Çalışma Tezgahı (Blok Çekmeceli)",
      tip: "zorunlu",
      scale: { type: "linear", perM2: 50, min: 2, max: 8 },
      notlar: "Equsto Atölyesi özel üretim.",
    },

    {
      kategoriKodu: "E",
      altKategori: "E.3",
      urunTipi: "makeup-unite-cekme",
      isim: "Make-up Ünitesi (Çekmeceli, Soğutmalı) — Meze Hazırlık",
      tip: "zorunlu",
      scale: { type: "threshold", thresholds: [
        { minM2: 0,   adet: 1 },
        { minM2: 250, adet: 2 },
      ]},
      elektrikGucuKwHint: 0.3,
      notlar: "Meze tabakları soğuk hazırlanır ve servis edilir.",
    },

    {
      kategoriKodu: "C",
      altKategori: "C.3",
      urunTipi: "sebze-sogram-makinasi",
      isim: "Sebze Soğrama Makinası",
      tip: "zorunlu",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 0.55,
      notlar: "Meze çeşitliliği için yüksek hacimli sebze işleme.",
    },

    {
      kategoriKodu: "C",
      altKategori: "C.3",
      urunTipi: "el-blenderi-profesyonel",
      isim: "El Blenderi (Profesyonel)",
      tip: "zorunlu",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 0.35,
    },

    {
      kategoriKodu: "C",
      altKategori: "C.3",
      urunTipi: "vakum-makinasi",
      isim: "Vakum Makinası",
      tip: "tavsiye",
      opsiyonelSebep: "sef-tercihi",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 0.5,
    },


    // =========================================================
    // ÇAY SERVİS BÖLÜMÜ — Meyhane standardı, ayrı zone
    // =========================================================

    {
      kategoriKodu: "A",
      altKategori: "A.3",
      urunTipi: "cay-ocagi-4-demlikli-aritimali",
      isim: "Çay Ocağı (4 Demlikli, Arıtmalı)",
      tip: "zorunlu",
      scale: { type: "threshold", thresholds: [
        { minM2: 0,   adet: 1 },
        { minM2: 300, adet: 2 },
      ]},
      elektrikGucuKwHint: 4.0,
      notlar: "Ayrı çay servis istasyonu. Meyhane kültüründe vazgeçilmez.",
    },

    {
      kategoriKodu: "A",
      altKategori: "A.3",
      urunTipi: "turk-kahvesi-makinasi",
      isim: "Türk Kahvesi Makinası",
      tip: "zorunlu",
      scale: { type: "threshold", thresholds: [
        { minM2: 0,   adet: 2 },   // Kıyıistanbul: 2 adet
        { minM2: 350, adet: 3 },
      ]},
      elektrikGucuKwHint: 1.5,
    },


    // =========================================================
    // D — TATLI HAZIRLIK
    // =========================================================

    {
      kategoriKodu: "D",
      altKategori: "D.1",
      urunTipi: "mikser-planet",
      isim: "Planet Mikser",
      tip: "tavsiye",
      opsiyonelSebep: "sef-tercihi",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 1.3,
      minM2: 150,
    },

    {
      kategoriKodu: "D",
      altKategori: "D.2",
      urunTipi: "konveksiyon-firin-pastane",
      isim: "Konveksiyonlu Fırın (Tatlı Hazırlık)",
      tip: "tavsiye",
      opsiyonelSebep: "sef-tercihi",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 3.0,
      minM2: 150,
    },


    // =========================================================
    // G — MUTFAK DEPOLAMA
    // 2 ayrı soğuk oda zorunlu — ölçeğe göre boyut değişir
    // =========================================================

    {
      kategoriKodu: "G",
      altKategori: "G.1",
      urunTipi: "panel-soguk-oda-plus4",
      isim: "Panel Tip Soğuk Oda (+4°C)",
      tip: "zorunlu",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 1.2,
      notlar: "100-150m²: ~6m² (200×300×240). 150-250m²: ~8m². 250m²+: 325×240×240.",
    },

    {
      kategoriKodu: "G",
      altKategori: "G.2",
      urunTipi: "panel-derin-dondurucu-oda-minus18",
      isim: "Panel Tip Derin Dondurucu Oda (−18°C)",
      tip: "zorunlu",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 1.5,
      notlar: "100-150m²: ~6m². 250m²+: 325×240×240.",
    },

    {
      kategoriKodu: "G",
      altKategori: "G.3",
      urunTipi: "kuru-depo-raf",
      isim: "Kuru Depo Raflama",
      tip: "zorunlu",
      scale: { type: "linear", perM2: 40, min: 2, max: 12 },
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
      scale: { type: "per-seat", perSeat: 50, min: 1, max: 3 },
      elektrikGucuKwHint: 4.5,
    },

    {
      kategoriKodu: "H",
      altKategori: "H.4",
      urunTipi: "glass-washer",
      isim: "Bar Bulaşık Makinası (Glass Washer)",
      tip: "zorunlu",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 2.5,
      notlar: "Bar ile aynı bölümde; bardak ve kokteyl ekipmanları için.",
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
