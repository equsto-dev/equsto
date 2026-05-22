/**
 * PFOS Template: Türk Restoranı
 *
 * Referans: Sütiş Şişhane (2017-006-2) + Sütiş Hakim Evi (S13-145)
 * m²: 100–500  |  Koltuk yoğunluğu: 1 koltuk / 1.3 m²
 *
 * Segment profilleri:
 *   Küçük  100–200m²  → Döner 2 radyan, omlet ocağı yok, temel teşhir
 *   Orta   200–350m²  → Döner 4 radyan, omlet ocağı 8 gözlü, orta teşhir
 *   Büyük  350–500m²  → Tam hat, konveyörlü bulaşık, geniş teşhir
 *
 * Konsept imzaları:
 *   — Döner ocağı HER ölçekte zorunlu (2 radyan → 4 radyan)
 *   — Pide bölümü zorunlu (Türk mutfağı)
 *   — Kömürlü ızgara zorunlu
 *   — Servis teşhir hattı (et + kahvaltı + poğaça/baklava)
 *   — Dondurma dolabı + sütlü tatlı teşhir: opsiyonel (konsept odağına göre)
 */

import type { ConceptTemplate } from "../../engine-types";

export const turkRestoran: ConceptTemplate = {
  konsept: "turk-restoran",
  label: "Türk Restoranı",
  ornekler: ["Sütiş", "Köfteci Ramiz", "Hacı Arif Bey", "Tarihi Sultanahmet Köftecisi"],
  segmentBasis: "m2",
  seatDensity: 1.3,

  items: [

    // =========================================================
    // A — BAR & İÇECEK SERVİSİ
    // =========================================================

    {
      kategoriKodu: "A",
      altKategori: "A.3",
      urunTipi: "cay-ocagi-3-demlikli",
      isim: "Çay Ocağı (3 Demlikli, Arıtmalı)",
      tip: "zorunlu",
      scale: { type: "threshold", thresholds: [
        { minM2: 0,   adet: 1 },
        { minM2: 300, adet: 2 },
      ]},
      elektrikGucuKwHint: 3.0,
      notlar: "Türk restoranında çay servisi temel hizmettir.",
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
      altKategori: "A.3",
      urunTipi: "espresso-2-grup",
      isim: "Espresso Makinası (2 Grup)",
      tip: "tavsiye",
      opsiyonelSebep: "yatirimci-karari",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 3.5,
      minM2: 150,
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
      minM2: 150,
    },

    {
      kategoriKodu: "A",
      altKategori: "A.4",
      urunTipi: "portakal-sikma-otomatik",
      isim: "Otomatik Portakal Sıkma",
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
        { minM2: 300, adet: 2 },
      ]},
      elektrikGucuKwHint: 0.6,
    },

    {
      kategoriKodu: "A",
      altKategori: "A.2",
      urunTipi: "cam-kapili-tezgah-buzdolabi",
      isim: "Cam Kapılı Tezgah Tipi Buzdolabı (4 Kapılı)",
      tip: "zorunlu",
      scale: { type: "threshold", thresholds: [
        { minM2: 0,   adet: 1 },
        { minM2: 300, adet: 2 },
      ]},
      elektrikGucuKwHint: 0.25,
    },

    {
      kategoriKodu: "A",
      altKategori: "A.5",
      urunTipi: "dondurma-dolabi-6li",
      isim: "Dondurma Dolabı (6'lı Vitrin)",
      tip: "opsiyonel",
      opsiyonelSebep: "sef-tercihi",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 0.4,
      notlar: "Sütiş gibi süt ürünü odaklı konseptlerde zorunlu; genel Türk restoranında opsiyonel.",
    },


    // =========================================================
    // B — PİŞİRME
    // Döner + kömürlü ızgara konseptin çekirdeği
    // =========================================================

    {
      kategoriKodu: "B",
      altKategori: "B.1",
      urunTipi: "davlumbaz",
      isim: "Davlumbaz (Duvar Tipi, Filtreli)",
      tip: "zorunlu",
      scale: { type: "linear", perM2: 50, min: 1, max: 4 },
      elektrikGucuKwHint: 1.5,
      notlar: "Equsto Atölyesi özel üretim.",
    },

    {
      kategoriKodu: "B",
      altKategori: "B.2",
      urunTipi: "doner-ocagi",
      isim: "Döner Ocağı (Gazlı)",
      tip: "zorunlu",
      scale: { type: "fixed", adet: 1 },
      gazGucuKwHint: 8,
      notlar: "100-200m²: 2 radyanlı. 200m²+: 4 radyanlı. Türk restoranında HER ölçekte zorunlu.",
    },

    {
      kategoriKodu: "B",
      altKategori: "B.2",
      urunTipi: "komurlu-izgara",
      isim: "Kömürlü Izgara",
      tip: "zorunlu",
      scale: { type: "fixed", adet: 1 },
      notlar: "Türk restoranı imzası. 100-200m² → ~120cm, 200m²+ → 180cm.",
    },

    {
      kategoriKodu: "B",
      altKategori: "B.2",
      urunTipi: "yumurta-omlet-ocagi-8-gozlu",
      isim: "Yumurta / Omlet Ocağı (8 Gözlü, Gazlı)",
      tip: "zorunlu",
      scale: { type: "fixed", adet: 1 },
      gazGucuKwHint: 4,
      minM2: 200,
      notlar: "Sadece 200m²+. 100-200m² Türk restoranında gerekmez.",
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
      altKategori: "B.2",
      urunTipi: "ocak-2-gozlu",
      isim: "2 Açık Alevli Ocak (Gazlı, Setüstü)",
      tip: "zorunlu",
      scale: { type: "threshold", thresholds: [
        { minM2: 0,   adet: 1 },
        { minM2: 200, adet: 2 },
      ]},
      gazGucuKwHint: 7,
    },

    {
      kategoriKodu: "B",
      altKategori: "B.2",
      urunTipi: "friteuse-cift-hazneli",
      isim: "Fritöz (Çift Sepetli)",
      tip: "zorunlu",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 8,
    },

    {
      kategoriKodu: "B",
      altKategori: "B.2",
      urunTipi: "bainmarie-3-gn",
      isim: "Bain-Marie 3 GN 1/1 (Elektrikli, Setüstü)",
      tip: "zorunlu",
      scale: { type: "threshold", thresholds: [
        { minM2: 0,   adet: 1 },
        { minM2: 300, adet: 2 },
      ]},
      elektrikGucuKwHint: 3,
      notlar: "Sıcak yemek/sos sıcak tutma; Türk restoranı zorunluluğu.",
    },

    {
      kategoriKodu: "B",
      altKategori: "B.2",
      urunTipi: "tost-makinasi",
      isim: "Tost Makinası",
      tip: "tavsiye",
      opsiyonelSebep: "sef-tercihi",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 1.5,
    },

    {
      kategoriKodu: "B",
      altKategori: "B.4",
      urunTipi: "tezgah-buzdolabi-3-kapili",
      isim: "Tezgah Tipi Buzdolabı (3 Kapılı, Tabla İzolasyonlu)",
      tip: "zorunlu",
      scale: { type: "threshold", thresholds: [
        { minM2: 0,   adet: 1 },
        { minM2: 250, adet: 2 },
      ]},
      elektrikGucuKwHint: 0.25,
    },


    // =========================================================
    // C — PİDE HAZIRLIK
    // Türk restoranı = pide; bu bölüm zorunlu
    // =========================================================

    {
      kategoriKodu: "F",
      altKategori: "F.1",
      urunTipi: "hamur-yogurma-35lt",
      isim: "Hamur Yoğurma Makinası (35 kg)",
      tip: "zorunlu",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 1.3,
    },

    {
      kategoriKodu: "F",
      altKategori: "F.2",
      urunTipi: "pide-hazirlik-tezgahi",
      isim: "Pide/Pizza Hazırlık Tezgahı (Mermer Tablalı)",
      tip: "zorunlu",
      scale: { type: "fixed", adet: 1 },
    },

    {
      kategoriKodu: "F",
      altKategori: "F.2",
      urunTipi: "makeup-unite-3-kapili-mermer",
      isim: "Make-up Ünitesi (3 Kapılı, Mermer Tablalı)",
      tip: "zorunlu",
      scale: { type: "threshold", thresholds: [
        { minM2: 0,   adet: 1 },
        { minM2: 300, adet: 2 },
      ]},
      elektrikGucuKwHint: 0.3,
    },

    {
      kategoriKodu: "F",
      altKategori: "F.3",
      urunTipi: "pizza-firin-cift-katli",
      isim: "Pizza / Pide Fırını (Çift Katlı)",
      tip: "zorunlu",
      scale: { type: "threshold", thresholds: [
        { minM2: 0,   adet: 1 },
        { minM2: 300, adet: 2 },
      ]},
      elektrikGucuKwHint: 6,
    },

    {
      kategoriKodu: "F",
      altKategori: "F.1",
      urunTipi: "un-seker-arabasi",
      isim: "Un-Şeker Arabası (103 Lt)",
      tip: "zorunlu",
      scale: { type: "threshold", thresholds: [
        { minM2: 0,   adet: 1 },
        { minM2: 250, adet: 2 },
      ]},
    },


    // =========================================================
    // SERVİS TEŞHİR HATTI (G)
    // =========================================================

    {
      kategoriKodu: "G",
      altKategori: "G.1",
      urunTipi: "et-tesir-dolabi",
      isim: "Et Teşhir Dolabı",
      tip: "zorunlu",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 0.3,
      notlar: "Servis teşhir hattı; müşteriye açık.",
    },

    {
      kategoriKodu: "G",
      altKategori: "G.1",
      urunTipi: "kahvalti-tesir-dolabi",
      isim: "Kahvaltı Teşhir Dolabı",
      tip: "tavsiye",
      opsiyonelSebep: "mutfak-ihtiyaci",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 0.3,
      notlar: "Kahvaltı servisi yapan Türk restoranlarında zorunlu.",
    },

    {
      kategoriKodu: "G",
      altKategori: "G.1",
      urunTipi: "pogaca-baklava-tesir",
      isim: "Poğaça / Baklava Teşhir Dolabı",
      tip: "tavsiye",
      opsiyonelSebep: "sef-tercihi",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 0.25,
      minM2: 200,
    },

    {
      kategoriKodu: "G",
      altKategori: "G.1",
      urunTipi: "pasta-sutlu-tatli-tesir",
      isim: "Pasta / Sütlü Tatlı Teşhir Dolabı",
      tip: "opsiyonel",
      opsiyonelSebep: "sef-tercihi",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 0.4,
      notlar: "Sütiş gibi süt/tatlı odaklı markalarda; genel Türk restoranında opsiyonel.",
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
      scale: { type: "threshold", thresholds: [
        { minM2: 0,   adet: 1 },
        { minM2: 200, adet: 2 },
        { minM2: 350, adet: 3 },
      ]},
      elektrikGucuKwHint: 0.4,
    },

    {
      kategoriKodu: "G",
      altKategori: "G.2",
      urunTipi: "depo-derin-dondurucu",
      isim: "Depo Tipi Derin Dondurucu",
      tip: "zorunlu",
      scale: { type: "threshold", thresholds: [
        { minM2: 0,   adet: 1 },
        { minM2: 300, adet: 2 },
      ]},
      elektrikGucuKwHint: 0.3,
    },

    {
      kategoriKodu: "G",
      altKategori: "G.3",
      urunTipi: "kuru-depo-raf",
      isim: "Kuru Depo Raflama",
      tip: "zorunlu",
      scale: { type: "linear", perM2: 40, min: 2, max: 10 },
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
      scale: { type: "per-seat", perSeat: 55, min: 1, max: 2 },
      elektrikGucuKwHint: 4.5,
      maxM2: 350,
    },

    {
      kategoriKodu: "H",
      altKategori: "H.2",
      urunTipi: "bulasik-makinesi-konveyor",
      isim: "Konveyörlü Bulaşık Makinası (2000 Tb/s)",
      tip: "zorunlu",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 7,
      minM2: 350,
      notlar: "350m²+ için konveyörlü; Sütiş Hakim Evi profili.",
    },

    {
      kategoriKodu: "H",
      altKategori: "H.4",
      urunTipi: "glass-washer",
      isim: "Bardak Yıkama Makinası (Setaltı)",
      tip: "tavsiye",
      opsiyonelSebep: "mutfak-ihtiyaci",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 2.5,
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
