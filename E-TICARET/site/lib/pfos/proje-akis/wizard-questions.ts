/**
 * PFOS soru seti v3 — Proje akışı (A) / pfos.html / admin tek kaynak.
 * Katalog: PFOS/veri/PFOS-SORU-KATALOG.md
 *
 * A şıkkı: mapsTo + motorEtkisi alanları mevcut proje-akis şemasına eklenir;
 * konsept (shopTypes) ve ürün (products) ayrı yönetilir.
 */
import { buildDukkanBranchesFromKonseptler } from "./konsept-tanimlari";

export const PFOS_Q_MESLEK = [
  "Yatırımcı",
  "Şef / Aşçı",
  "Satınalma",
  "Mimar",
  "İşletme Müdürü",
  "Franchise",
  "Boş ver",
] as const;

export const PFOS_Q_UST_SEGMENT = [
  "Restoran",
  "Kafe / Coffee Shop",
  "Fast Food / QSR",
  "Pastane & Fırın",
  "Bar & Lounge",
  "Catering",
  "Bulut Mutfak",
  "Üretim / Fabrika",
] as const;

/** 750 / 1000 m² — otel segmenti ve tüm şehir oteli referansları */
export const PFOS_OTEL_UST_SEGMENT = "Otel F&B";
export const PFOS_OTEL_BIRLESIK_M2 = [750, 1000] as const;

/** 40 / 80 m² — yalnızca kompakt konsept segmentleri */
export const PFOS_KUCUK_ALAN_M2 = [40, 80] as const;

export const PFOS_KUCUK_ALAN_UST_SEGMENT = [
  "Kafe / Coffee Shop",
  "Fast Food / QSR",
  "Bar & Lounge",
  "Bulut Mutfak",
] as const;

export function otelSegmentM2Aktif(m2: number): boolean {
  return (PFOS_OTEL_BIRLESIK_M2 as readonly number[]).includes(m2);
}

export function kucukAlanSegmentM2Aktif(m2: number): boolean {
  return (PFOS_KUCUK_ALAN_M2 as readonly number[]).includes(m2);
}

/** m² alanına göre üst segment seçenekleri */
export function ustSegmentOptionsForM2(
  base: readonly string[],
  m2: number,
): string[] {
  let opts = kucukAlanSegmentM2Aktif(m2)
    ? base.filter((o) =>
        (PFOS_KUCUK_ALAN_UST_SEGMENT as readonly string[]).includes(o),
      )
    : [...base];

  if (otelSegmentM2Aktif(m2)) {
    if (!opts.includes(PFOS_OTEL_UST_SEGMENT)) {
      opts = [...opts, PFOS_OTEL_UST_SEGMENT];
    }
  } else {
    opts = opts.filter((o) => o !== PFOS_OTEL_UST_SEGMENT);
  }

  // 120 m² ve üzeri m²'lerde bulut mutfak seçeneğini kaldıralım
  if (m2 >= 120) {
    opts = opts.filter((o) => o !== "Bulut Mutfak");
  }

  return opts;
}

/** Üst segment → dükkan türü dalları (yalnızca durum=aktif paketler) */
export const PFOS_DUKKAN_BRANCHES: Record<string, string[]> =
  buildDukkanBranchesFromKonseptler();

export const PFOS_Q_BALIK_ALT = [
  "Mahalle balıkçısı",
  "Balık Restaurant",
  "Balık lokantası",
  "Seafood bistro",
] as const;

export const PFOS_Q_FAST_ALT = [
  "Burger",
  "Fried Chicken",
  "Döner / Dürüm",
  "Pide / Lahmacun",
  "Pizza (paket)",
  "Hot Dog / Snack",
] as const;

/** Türk / esnaf lokanta — self servis & food court → Kiremit Akasya referansı */
export const PFOS_Q_RESTORAN_ALT = [
  "Self servis",
  "Food Court",
  "Masaya servis",
  "Bilmiyorum",
] as const;

export const PFOS_Q_NE_PISIR = [
  "Kahvaltı",
  "Izgara",
  "Kebap",
  "Döner",
  "Pizza",
  "Pide / Lahmacun",
  "Burger",
  "Fried Chicken",
  "Balık / Deniz Ürünleri",
  "Ev Yemekleri / Sulu Yemek",
  "Makarna",
  "Tatlı / Pastane",
  "Kahve / İçecek",
  "Meze",
  "Açık Büfe",
  "Diğer",
] as const;

export const PFOS_Q_KARAR = [
  "Teklifi al (PDF çıktı)",
  "Projeyi detaylandır (altyapı ve yardımcı ekipman)",
] as const;

export const PFOS_Q_SERVIS = [
  "Masa servisi (full service)",
  "Self servis / kiosk",
  "Paket ve delivery ağırlıklı",
  "Karışık",
] as const;

/** Proje akışı (A) — müşteri sihirbazı soru kartları (12 adet, sıralı) */
export const DEFAULT_WIZARD_QUESTIONS: Record<string, unknown>[] = [
  {
    id: "q_meslek",
    step: "01",
    panel: "A",
    text: "Mesleğiniz",
    type: "select",
    required: "true",
    options: [...PFOS_Q_MESLEK],
    mapsTo: "analitik.rol",
    motorEtkisi: "yok — segment / ton",
  },
  {
    id: "q_lokasyon",
    step: "02",
    panel: "B",
    text: "İl — teslimat bölgesi",
    type: "text",
    required: "true",
    mapsTo: "lokasyon.sehir",
    motorEtkisi: "nakliye / montaj ön hesabı",
    note: "tr-adres.json ile otomatik tamamlama; ilçe ve mahalle aynı panelde.",
  },
  {
    id: "q_acik_adres",
    step: "02",
    panel: "B",
    text: "İlçe · mahalle · cadde (açık adres)",
    type: "text",
    required: "false",
    mapsTo: "lokasyon.tam",
    motorEtkisi: "keşif / teslimat",
    note: "Saha keşfi ve nakliye planı için ek adres satırı.",
  },
  {
    id: "q_m2",
    step: "05",
    panel: "E",
    text: "Toplam kullanım alanı (m²)",
    type: "number",
    required: "true",
    mapsTo: "m2",
    motorEtkisi:
      "bant: steakhouse/balikci ≤150→80-150, >150→150-250; italyan → 100-300 (03-italyan); all-day-dining ≤200→100-200, 201–300→150-300, 301–400→200-400 (THC Mavibahçe); restoran → 500-1000; turk-restoran → ≤300 S13-388, >300 Sütiş (200-5000); kokteyl-kahve → 30-50; kahve-atolyesi → 80-150; kahve-tatli → 40-100; kahve-duragi <150→100-200, ≥150→150-200; kahve-duragi-pastane → 100-200; harvest-cafe → 100-200; all-sport-cafe → 100-200; casual-cafe → 50-150; buyuk-yemekhane → 2000-3500 kişi; catering_uretim / Üretim Fabrikası → 1500-2500 m² (15–30 bin kap.); ekmek-kruvasan → 150-400; guneli-pastane → 200-400; resort-otel → 200-500; sehir-otel → 500-2000; tatil-otel → 800-1500; kiremit-akasya → 100-250; mus-selinoz-turk → 100-250; kasap/kasap-sarkuteri → 100-250; inari-bar-yemek → 100-200; birahane → 100-300; pastane ≤150→100-200, >150→150-250; pideci → 100-250; sushi → 40-100; tavukcu → 80-150; kanatci-kebapci → 100-250; patisserie-yemek → 200-400; boyoz-pastane → 100-250; sarkuteri-kiosk → kiosk; hamburger-kiosk → 60-100; hotdog-kiosk → kiosk; pizzaci ≤200→80-200, >200→200-500; kebap-ortadogu ≤200→80-200, ≤400→200-400 MEFTECH referans, >400→300-500 zone şablon)",
    note: "Bulut Mutfak ≤15 m²: yalnızca Grab&Go / Coffee Counter. Steakhouse/Balık: ≤150 → 80-150; >150 → 150-250.",
  },
  {
    id: "q_ust_segment",
    step: "03",
    panel: "C1",
    text: "Ne tür işletme açmak istiyorsunuz?",
    type: "select",
    required: "true",
    options: [...PFOS_Q_UST_SEGMENT],
    mapsTo: "agac.ust-segment",
    motorEtkisi: "q_dukkan_turu dallanması",
    note: "PFOS adım 02 — üst segment; dükkan türü seçeneklerini belirler.",
  },
  {
    id: "q_franchise_marka",
    step: "03",
    panel: "C1",
    text: "Franchise marka adı (opsiyonel)",
    type: "text",
    required: "false",
    mapsTo: "franchise.marka",
    motorEtkisi: "yok — CRM / not",
    note: "Zincir ise marka adı; değilse boş bırakılabilir.",
  },
  {
    id: "q_dukkan_turu",
    step: "04",
    panel: "C2",
    text: "Dükkan türü — işletme modeli",
    type: "select_conditional",
    required: "true",
    branches: JSON.parse(JSON.stringify(PFOS_DUKKAN_BRANCHES)),
    gosterIf: "q_ust_segment",
    mapsTo: "shopTypes.pfos.dukkanSecim",
    motorEtkisi: "motorSlug + ekipman listesi seçimi",
    note: "PFOS adım 03 — üst segmente göre dallanır. Cevap → konsept tablosundaki dukkanSecim ile eşleşir.",
  },
  {
    id: "q_servis_model",
    step: "04",
    panel: "C2",
    text: "Servis modeli",
    type: "select",
    required: "false",
    options: [...PFOS_Q_SERVIS],
    gosterIf: "q_dukkan_turu",
    mapsTo: "isletme.servis",
    motorEtkisi: "planlanan — kapasite / oturma ipucu",
    note: "PFOS adım 04c — opsiyonel; restoran ve QSR için.",
  },
  {
    id: "q_balik_alt",
    step: "04",
    panel: "C3",
    text: "Balık işletme modeli",
    type: "select",
    required: "true",
    options: [...PFOS_Q_BALIK_ALT],
    gosterIf: "q_dukkan_turu=Balık Restaurant",
    mapsTo: "balikci.altTip",
    motorEtkisi: "mahalle → balikci-mahalle.json; diğer → m² bant",
    note: "Mahalle → balikci-mahalle; diğer → m² bantlı listeler.",
  },
  {
    id: "q_fast_alt",
    step: "04",
    panel: "C3",
    text: "Fast food alt tip",
    type: "select",
    required: "true",
    options: [...PFOS_Q_FAST_ALT],
    gosterIf: "q_ust_segment=Fast Food / QSR",
    mapsTo: "fast_food.altTip",
    motorEtkisi: "planlanan — genel şablon",
    note: "Burger, FC, döner vb. — liste motoru planlanan.",
  },
  {
    id: "q_restoran_alt",
    step: "04",
    panel: "C3",
    text: "Restoran alt tip",
    type: "select",
    required: "true",
    options: [...PFOS_Q_RESTORAN_ALT],
    gosterIf: "q_dukkan_turu=Türk / Esnaf lokanta",
    mapsTo: "turk_restoran.altTip",
    motorEtkisi:
      "self servis / food court → kiremit-akasya 100–250; masaya servis → turk-restoran",
    note: "2016-085 Kiremit Akasya · self servis & food court aynı referans.",
  },
  {
    id: "q_ne_pisireceksin",
    step: "03",
    panel: "D",
    text: "Ne pişireceksiniz?",
    type: "multi_select",
    required: "true",
    options: [...PFOS_Q_NE_PISIR],
    gosterIf: "q_dukkan_turu",
    mapsTo: "menu.hattlari",
    motorEtkisi: "zone / davlumbaz ipucu (faz 2)",
    note: "Menü hattı — pişirme ve hazırlık ekipmanı önerisi.",
  },
  {
    id: "q_karar",
    step: "06",
    panel: "F",
    text: "Sonraki adım — tercihiniz?",
    type: "select",
    required: "true",
    options: [...PFOS_Q_KARAR],
    gosterIf: "q_m2",
    mapsTo: "cikti.mod",
    motorEtkisi: "PDF teklif | detaylandır dalı",
    note: "PFOS teklif özeti karar düğmeleri.",
  },
];
