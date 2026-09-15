/**
 * PFOS Template: Kebap & Ortadoğu Mutfağı
 *
 * Referans proje: CZN Burak Vadi İstanbul AVM (2023-022-4)
 * m² aralığı: 200–300 m²
 * Segment bazı: m²  |  Koltuk yoğunluğu: 1 koltuk / 1.2 m²
 *
 * Konsept imzaları:
 *   — Et hazırlık ayrı zone (kemik testere + zırh + kıyma)
 *   — 2 ayrı walk-in soğuk oda (et +4°C / sebze +4°C)
 *   — Kömürlü ızgara + lavash ızgara + taş fırın (müşteri temini)
 *   — Şiş arabası + kömür arabası zorunlu
 *   — Künefe ocağı (Ortadoğu tatlı imzası)
 */

import type { ConceptTemplate } from "../../engine-types";

export const kebapOrtadogu: ConceptTemplate = {
  konsept: "kebap-ortadogu",
  label: "Kebap & Ortadoğu Mutfağı",
  ornekler: ["CZN Burak", "Develi", "Hamdi", "Borsam Taşfırın", "Zübeyir Ocakbaşı"],
  segmentBasis: "m2",
  seatDensity: 1.2,

  items: [

    // =========================================================
    // A — BAR & KAHVE
    // Kebap restoranında çay ana içecek; espresso ikincil
    // =========================================================

    {
      kategoriKodu: "A",
      altKategori: "A.3",
      urunTipi: "cay-ocagi-3-demlikli",
      isim: "Çay Ocağı 3 Demlikli (Arıtmalı)",
      tip: "zorunlu",
      scale: { type: "threshold", thresholds: [
        { minM2: 0,   adet: 1 },
        { minM2: 250, adet: 2 },
      ]},
      elektrikGucuKwHint: 3.0,
      notlar: "Türk misafirperverliğinin gereği; her ölçekte zorunlu.",
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
      notlar: "Premium Ortadoğu/kebap restoranlarında kahve servisi giderek standartlaşıyor.",
    },

    {
      kategoriKodu: "A",
      altKategori: "A.3",
      urunTipi: "kahve-degirmeni",
      isim: "Profesyonel Kahve Değirmeni",
      tip: "tavsiye",
      opsiyonelSebep: "yatirimci-karari",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 0.3,
      minM2: 0,
      notlar: "Espresso makinası varsa zorunlu.",
    },

    {
      kategoriKodu: "A",
      altKategori: "A.4",
      urunTipi: "portakal-sikma-otomatik",
      isim: "Otomatik Portakal Sıkma Makinası (Santos No:11)",
      tip: "tavsiye",
      opsiyonelSebep: "sef-tercihi",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 0.25,
    },

    {
      kategoriKodu: "A",
      altKategori: "A.4",
      urunTipi: "kati-meyve-sikacagi",
      isim: "Katı Meyve Sıkacağı",
      tip: "opsiyonel",
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
        { minM2: 0,   adet: 1 },
        { minM2: 280, adet: 2 },
      ]},
      elektrikGucuKwHint: 0.6,
    },

    {
      kategoriKodu: "A",
      altKategori: "A.1",
      urunTipi: "sise-sogutucu-3-kapili",
      isim: "Şişe Soğutucu (3 Kapılı)",
      tip: "tavsiye",
      opsiyonelSebep: "yatirimci-karari",
      scale: { type: "threshold", thresholds: [
        { minM2: 0,   adet: 1 },
        { minM2: 250, adet: 2 },
      ]},
      elektrikGucuKwHint: 0.2,
    },

    {
      kategoriKodu: "A",
      altKategori: "A.4",
      urunTipi: "bar-blender",
      isim: "Bar Blender",
      tip: "tavsiye",
      opsiyonelSebep: "sef-tercihi",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 1.5,
    },


    // =========================================================
    // B — IZGARA & SICAK SERVİS
    // Kebap/Ortadoğu'nun kalbi — kömür ve ateş
    // =========================================================

    {
      kategoriKodu: "B",
      altKategori: "B.1",
      urunTipi: "davlumbaz-izgara",
      isim: "Davlumbaz (Izgara Hattı Üzeri)",
      tip: "zorunlu",
      scale: { type: "linear", perM2: 50, min: 1, max: 3 },
      elektrikGucuKwHint: 1.5,
      notlar: "Equsto Atölyesi özel üretim. Kömür dumanı için yüksek debili olmalı.",
    },

    {
      kategoriKodu: "B",
      altKategori: "B.2",
      urunTipi: "komurlu-izgara",
      isim: "Kömürlü Izgara (Ocakbaşı)",
      tip: "zorunlu",
      scale: { type: "fixed", adet: 1 },
      gazGucuKwHint: 0,
      notlar: "200-250m² için ~120-180cm, 250m²+ için 280cm. Konseptin imzası.",
    },

    {
      kategoriKodu: "B",
      altKategori: "B.2",
      urunTipi: "lavash-izgara-gazli",
      isim: "Lavash Izgara (Gazlı, Setüstü)",
      tip: "zorunlu",
      scale: { type: "fixed", adet: 1 },
      gazGucuKwHint: 5,
      notlar: "Lavash ekmeği servisi için zorunlu.",
    },

    {
      kategoriKodu: "B",
      altKategori: "B.2",
      urunTipi: "dokum-izgara-gazli",
      isim: "Döküm Izgara (Oluklu, Gazlı, Setüstü)",
      tip: "zorunlu",
      scale: { type: "fixed", adet: 1 },
      gazGucuKwHint: 6,
    },

    {
      kategoriKodu: "B",
      altKategori: "B.2",
      urunTipi: "tas-firin",
      isim: "Taş Fırın",
      tip: "zorunlu",
      scale: { type: "fixed", adet: 1 },
      notlar: "Müşteri temini. Her zaman listede yer alır ancak fiyata dahil değildir.",
    },

    {
      kategoriKodu: "B",
      altKategori: "B.2",
      urunTipi: "friteuse-cift-hazneli",
      isim: "Fritöz (Çift Hazneli, Elektrikli, Setüstü)",
      tip: "zorunlu",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 8,
    },

    {
      kategoriKodu: "B",
      altKategori: "B.2",
      urunTipi: "sos-bainmarie",
      isim: "Sos Bain-Marie (Elektrikli, Setüstü)",
      tip: "zorunlu",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 2,
      notlar: "Sos ve garnitür sıcak tutma; kebap servisinde kritik.",
    },

    {
      kategoriKodu: "B",
      altKategori: "B.5",
      urunTipi: "sicaklik-dolabi",
      isim: "Sıcaklık Dolabı (Servis)",
      tip: "zorunlu",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 1.0,
      notlar: "Pişmiş ürünlerin servise hazırlanana kadar sıcak tutulması.",
    },

    {
      kategoriKodu: "B",
      altKategori: "B.2",
      urunTipi: "plic-cevirme-6li",
      isim: "Piliç Çevirme Makinası (6'lı)",
      tip: "tavsiye",
      opsiyonelSebep: "sef-tercihi",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 2.0,
    },

    {
      kategoriKodu: "B",
      altKategori: "B.2",
      urunTipi: "kunefe-ocagi",
      isim: "Künefe Ocağı",
      tip: "tavsiye",
      opsiyonelSebep: "sef-tercihi",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 1.5,
      notlar: "Ortadoğu tatlı menüsünün imzası. Menüde künefe varsa zorunlu.",
    },

    {
      kategoriKodu: "B",
      altKategori: "B.5",
      urunTipi: "sis-arabasi",
      isim: "Şiş Arabası (Servis)",
      tip: "zorunlu",
      scale: { type: "threshold", thresholds: [
        { minM2: 0,   adet: 1 },
        { minM2: 250, adet: 2 },
      ]},
      notlar: "Müşteri masasına şiş servisi; Ortadoğu konseptinin görsel imzası.",
    },

    {
      kategoriKodu: "B",
      altKategori: "B.5",
      urunTipi: "komur-arabasi",
      isim: "Kömür Arabası",
      tip: "zorunlu",
      scale: { type: "fixed", adet: 1 },
      notlar: "Kömürlü ızgara operasyonu için zorunlu.",
    },

    {
      kategoriKodu: "B",
      altKategori: "B.5",
      urunTipi: "cam-sis-dolabi",
      isim: "Cam Kapılı Şiş Dolabı (Soğutmalı, Teşhir)",
      tip: "tavsiye",
      opsiyonelSebep: "yatirimci-karari",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 0.2,
      notlar: "Müşteriye açık şiş teşhiri; show kitchen uygulamalarda tavsiye edilir.",
    },


    // =========================================================
    // C — ET HAZIRLIK
    // Kebap/Ortadoğu'nun kritik ayrışan zone'u
    // =========================================================

    {
      kategoriKodu: "C",
      altKategori: "C.1",
      urunTipi: "polietilen-tablali-tezgah",
      isim: "Polietilen Tablalı Çalışma Tezgahı",
      tip: "zorunlu",
      scale: { type: "threshold", thresholds: [
        { minM2: 0,   adet: 1 },
        { minM2: 250, adet: 2 },
      ]},
      notlar: "Et için gıda güvenliği zorunluluğu; kesim ve hazırlık yüzeyinde polietilen.",
    },

    {
      kategoriKodu: "C",
      altKategori: "C.3",
      urunTipi: "kemik-testere",
      isim: "Et Kemik Testeresi",
      tip: "zorunlu",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 0.4,
      notlar: "Kebap hazırlığında büyük kemikli et parçalamak için zorunlu.",
    },

    {
      kategoriKodu: "C",
      altKategori: "C.3",
      urunTipi: "zirh-makinasi",
      isim: "Zırh Makinası",
      tip: "zorunlu",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 0.75,
      notlar: "Kebap etinin geleneksel yöntemle işlenmesi. Adana/Urfa/ciğer kebabı için kritik.",
    },

    {
      kategoriKodu: "C",
      altKategori: "C.3",
      urunTipi: "kiyma-makinasi-no32",
      isim: "Et Kıyma Makinası (No:32)",
      tip: "zorunlu",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 1.1,
    },

    {
      kategoriKodu: "C",
      altKategori: "C.3",
      urunTipi: "sogan-dograma-makinasi",
      isim: "Soğan Doğrama Makinası",
      tip: "zorunlu",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 0.25,
      notlar: "Ortadoğu mutfağında soğan tüketimi çok yüksek; manuel doğrama verimsiz.",
    },

    {
      kategoriKodu: "C",
      altKategori: "C.3",
      urunTipi: "sebze-sogram-makinasi",
      isim: "Sebze Soğrama Makinası (Bıçaklı Set)",
      tip: "zorunlu",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 0.55,
    },

    {
      kategoriKodu: "C",
      altKategori: "C.3",
      urunTipi: "el-blenderi-profesyonel",
      isim: "El Blenderi (Profesyonel)",
      tip: "zorunlu",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 0.35,
      notlar: "Çorba, sos ve püre hazırlığı için.",
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

    {
      kategoriKodu: "C",
      altKategori: "C.3",
      urunTipi: "hamur-yogurma-50lt",
      isim: "Hamur Yoğurma Makinası (50 Lt)",
      tip: "tavsiye",
      opsiyonelSebep: "sef-tercihi",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 1.5,
      notlar: "Ekmek/pide üretimi mutfak içinde yapılıyorsa zorunlu hale gelir.",
    },

    {
      kategoriKodu: "C",
      altKategori: "C.3",
      urunTipi: "yer-ocagi",
      isim: "Yer Ocağı (Geleneksel)",
      tip: "tavsiye",
      opsiyonelSebep: "mutfak-ihtiyaci",
      scale: { type: "fixed", adet: 2 },
      gazGucuKwHint: 3.5,
      notlar: "Geleneksel Ortadoğu pişirme yöntemi. Menüye göre değişir.",
    },

    {
      kategoriKodu: "C",
      altKategori: "C.3",
      urunTipi: "combi-firin",
      isim: "Combi Fırın (Yemekçilik Fırını)",
      tip: "zorunlu",
      scale: { type: "threshold", thresholds: [
        { minM2: 0,   adet: 1 },    // 6 tepsi GN 1/1
        { minM2: 250, adet: 1 },    // 10 tepsi GN 1/1 — same adet, larger model
      ]},
      elektrikGucuKwHint: 11,
      notlar: "200-250m² → 6 tepsi GN 1/1 · 250m²+ → 10 tepsi GN 1/1 (Rational iCombi).",
    },

    {
      kategoriKodu: "C",
      altKategori: "C.1",
      urunTipi: "davlumbaz-et-hazirlik",
      isim: "Davlumbaz (Et Hazırlık)",
      tip: "zorunlu",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 0.75,
      notlar: "Equsto Atölyesi özel üretim.",
    },


    // =========================================================
    // D — HAZIRLIK
    // =========================================================

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
      isim: "Make-up Ünitesi (Çift Sıra Çekmeceli, Mermer Üst)",
      tip: "zorunlu",
      scale: { type: "threshold", thresholds: [
        { minM2: 0,   adet: 1 },
        { minM2: 250, adet: 2 },
      ]},
      elektrikGucuKwHint: 0.3,
      notlar: "Soğuk et/sos hazırlık istasyonu; servis hattına yakın konumlanır.",
    },

    {
      kategoriKodu: "E",
      altKategori: "E.3",
      urunTipi: "mermer-tablali-tezgah",
      isim: "Mermer Tablalı Çalışma Tezgahı",
      tip: "zorunlu",
      scale: { type: "threshold", thresholds: [
        { minM2: 0,   adet: 1 },
        { minM2: 250, adet: 2 },
      ]},
      notlar: "Izgara & servis hattında; et dinlendirme ve servis öncesi son hazırlık.",
    },


    // =========================================================
    // G — MUTFAK DEPOLAMA
    // Kebap'ta 2 ayrı walk-in soğuk oda zorunlu
    // =========================================================

    {
      kategoriKodu: "G",
      altKategori: "G.1",
      urunTipi: "panel-soguk-oda-et-plus4",
      isim: "Panel Tip Soğuk Oda — Et (+4°C)",
      tip: "zorunlu",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 1.2,
      notlar: "Et stoğu için ayrı soğuk oda. 200-300m² → ~500×180×240 panel tipi.",
    },

    {
      kategoriKodu: "G",
      altKategori: "G.1",
      urunTipi: "panel-soguk-oda-sebze-plus4",
      isim: "Panel Tip Soğuk Oda — Sebze (+4°C)",
      tip: "zorunlu",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 1.0,
      notlar: "Sebze stoğu için ayrı soğuk oda. Et odası ile birleştirme; kontaminasyon riski.",
    },

    {
      kategoriKodu: "G",
      altKategori: "G.2",
      urunTipi: "depo-derin-dondurucu",
      isim: "Depo Tipi Derin Dondurucu (Standalone)",
      tip: "zorunlu",
      scale: { type: "threshold", thresholds: [
        { minM2: 0,   adet: 1 },
        { minM2: 280, adet: 2 },
      ]},
      elektrikGucuKwHint: 0.3,
    },

    {
      kategoriKodu: "G",
      altKategori: "G.3",
      urunTipi: "kuru-depo-raf",
      isim: "Kuru Depo Raflama (Demonte İstif Rafı)",
      tip: "zorunlu",
      scale: { type: "linear", perM2: 40, min: 3, max: 10 },
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
      scale: { type: "per-seat", perSeat: 60, min: 1, max: 2 },
      elektrikGucuKwHint: 4.5,
    },

    {
      kategoriKodu: "H",
      altKategori: "H.2",
      urunTipi: "bulasik-makinesi-setaltı",
      isim: "Setaltı Bulaşık Makinası (500 Tb/s)",
      tip: "tavsiye",
      opsiyonelSebep: "mutfak-ihtiyaci",
      scale: { type: "fixed", adet: 1 },
      elektrikGucuKwHint: 3.0,
      notlar: "Servis istasyonu yakınında ikinci bulaşık noktası; büyük ölçekte akış hızlandırır.",
    },

    {
      kategoriKodu: "H",
      altKategori: "H.1",
      urunTipi: "cop-siyirma-tezgahi",
      isim: "Bulaşık Sıyırma Tezgahı",
      tip: "zorunlu",
      scale: { type: "fixed", adet: 1 },
      notlar: "Equsto Atölyesi özel üretim.",
    },

    {
      kategoriKodu: "H",
      altKategori: "H.3",
      urunTipi: "bym-cikis-tezgahi",
      isim: "BYM Çıkış Tezgahı + Raf",
      tip: "zorunlu",
      scale: { type: "fixed", adet: 1 },
      notlar: "Equsto Atölyesi özel üretim.",
    },

    {
      kategoriKodu: "H",
      altKategori: "H.1",
      urunTipi: "yag-tutucu",
      isim: "Yağ Tutucu (1 Lt/sn)",
      tip: "zorunlu",
      scale: { type: "fixed", adet: 1 },
      notlar: "Atık su hattına et yağının geçmesini önler; yasal zorunluluk.",
    },

  ],
};
