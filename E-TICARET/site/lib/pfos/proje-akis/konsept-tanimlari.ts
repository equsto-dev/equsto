/**
 * Legacy shopType (proje-akis) ↔ yeni PFOS motor eşlemesi.
 * Tek kaynak: buradan panel + varsayılan yükleme.
 * Katalog: PFOS/veri/PFOS-SORU-KATALOG.md §4
 */

/** m² bantı veya alt tip listesi (ör. mahalle balıkçı) */
export type ListeBantId = "80-150" | "150-250" | "mahalle" | "referans" | "100-300";

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
      m2Max: 250,
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
    desc: "Balık restoran + mahalle balıkçı · m² bantlı listeler + mahalle listesi · motor: balikci",
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
      m2Max: 250,
      bantKurali:
        "Mahalle balıkçı → mahalle listesi; m² ≤ 150 → 80-150; m² > 150 → 150-250",
      planPdf: "2 BALIKCI-PLAN.pdf",
      teklifKaynagi: "pfos-referans",
      durum: "aktif",
      bantlar: [
        liste("mahalle", "Mahalle balıkçı", 80, "balikci"),
        bant("80-150", 115, "balikci"),
        bant("150-250", 200, "balikci"),
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
      m2Max: 300,
      bantKurali: "Tek referans liste (100–300 m²); m² ile adet ölçeklenir",
      planPdf: "proje-veri/03-italyan.pdf",
      listeYolu: "proje-veri/03-italyan 100-300 m2.xlsx",
      teklifKaynagi: "pfos-referans",
      durum: "aktif",
      bantlar: [
        liste("100-300", "100–300 m²", 200, "italyan"),
      ],
    },
    questions: [],
  },
  {
    id: "restaurant_kebap",
    name: "Kebap & Ortadoğu",
    parent: "Restoran",
    desc: "Kebap / ocakbaşı · teklif motoru: kebap-ortadogu (zone şablonu)",
    pfos: {
      motorSlug: "kebap-ortadogu",
      dukkanSecim: "Kebapçı",
      m2Min: 200,
      m2Max: 300,
      bantKurali: "Tek şablon; zone kataloğu",
      teklifKaynagi: "motor-sablon",
      durum: "aktif",
      bantlar: [],
    },
    questions: [],
  },
  {
    id: "pizzaci",
    name: "Pizzacı",
    parent: "Restoran",
    desc: "Pizza odaklı · teklif motoru: pizzaci",
    pfos: {
      motorSlug: "pizzaci",
      dukkanSecim: "Pizzacı",
      m2Min: 80,
      m2Max: 300,
      bantKurali: "Motor şablon; bant yok",
      teklifKaynagi: "motor-sablon",
      durum: "motor",
      bantlar: [],
    },
    questions: [],
  },
  {
    id: "turk_restoran",
    name: "Türk Restoranı",
    parent: "Restoran",
    desc: "Türk / esnaf lokanta · teklif motoru: turk-restoran",
    pfos: {
      motorSlug: "turk-restoran",
      dukkanSecim: "Türk / Esnaf lokanta",
      m2Min: 100,
      m2Max: 500,
      bantKurali: "Motor şablon; bant yok",
      teklifKaynagi: "motor-sablon",
      durum: "motor",
      bantlar: [],
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
      bantKurali: "Motor şablon; bant yok",
      teklifKaynagi: "motor-sablon",
      durum: "motor",
      bantlar: [],
    },
    questions: [],
  },
  {
    id: "all_day_dining",
    name: "All Day Dining / Cafe",
    parent: "Restoran",
    desc: "All dining cafe · teklif motoru: all-day-dining-cafe",
    pfos: {
      motorSlug: "all-day-dining-cafe",
      dukkanSecim: "All Dining Cafe",
      m2Min: 150,
      m2Max: 400,
      bantKurali: "Motor şablon; bant yok",
      teklifKaynagi: "motor-sablon",
      durum: "motor",
      bantlar: [],
    },
    questions: [],
  },
  {
    id: "coffee_shop",
    name: "Coffee Shop",
    parent: "Kafe / Coffee Shop",
    desc: "Kahve / içecek odaklı · referans: coffee-shop-referans.json",
    pfos: {
      motorSlug: "coffee-shop",
      dukkanSecim: "Coffee Shop",
      m2Min: 60,
      m2Max: 300,
      bantKurali: "Tek referans liste; m² ile adet ölçeklenir",
      teklifKaynagi: "referans-json",
      listeYolu: "proje-veri/coffee-shop-ekipman-listesi.xlsx",
      durum: "aktif",
      bantlar: [
        {
          id: "referans",
          label: "Referans liste",
          referansM2: 120,
          listeDosya: "coffee-shop-referans.json",
        },
      ],
    },
    questions: [],
  },
  konseptPlanlanan(
    "restaurant_fine_dining",
    "Fine Dining",
    "Restoran",
    "Fine Dining",
    120,
    600,
    "Fine dining · motor planlanan",
  ),
  konseptPlanlanan(
    "restaurant_dunya",
    "Dünya Mutfağı",
    "Restoran",
    "Dünya Mutfağı",
    100,
    500,
  ),
  konseptPlanlanan(
    "restaurant_sarkuteri",
    "Gurme Şarküteri",
    "Restoran",
    "Gurme Şarküteri",
    40,
    200,
  ),
  konseptPlanlanan("kafeterya", "Kafeterya", "Kafe / Coffee Shop", "Kafeterya", 80, 350),
  {
    id: "pastane",
    name: "Pastane / Fırın",
    parent: "Kafe / Coffee Shop",
    desc: "Pastane & fırın hattı · motor planlanan",
    pfos: {
      motorSlug: "",
      dukkanSecim: "Pastane / Fırın",
      m2Min: 40,
      m2Max: 150,
      bantKurali: "Liste hazırlanıyor — genel şablon",
      teklifKaynagi: "planlanan",
      durum: "planlanan",
      bantlar: [],
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
  konseptPlanlanan(
    "ff_fried_chicken",
    "Fried Chicken",
    "Fast Food / QSR",
    "Fried Chicken",
    40,
    200,
  ),
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
  konseptPlanlanan("bar_kokteyl", "Kokteyl Bar", "Bar & Lounge", "Kokteyl Bar", 60, 250),
  konseptPlanlanan("bar_wine", "Wine Bar", "Bar & Lounge", "Wine Bar", 50, 200),
  konseptPlanlanan("bar_beer", "Beer Pub", "Bar & Lounge", "Beer Pub", 80, 400),
  konseptPlanlanan("bar_irish", "Irish Pub", "Bar & Lounge", "Irish Pub", 100, 450),
  konseptPlanlanan("bar_mixology", "Mixology Bar", "Bar & Lounge", "Mixology Bar", 50, 180),
  konseptPlanlanan("bar_lounge", "Lounger Bar", "Bar & Lounge", "Lounger Bar", 80, 350),
  konseptPlanlanan(
    "otel_sehir",
    "Şehir Oteli (Business)",
    "Otel F&B",
    "Şehir Oteli (Business)",
    200,
    2000,
  ),
  konseptPlanlanan("otel_resort", "Resort Otel", "Otel F&B", "Resort Otel", 300, 5000),
  konseptPlanlanan(
    "otel_dag",
    "Dağ-Kayak Oteli",
    "Otel F&B",
    "Dağ-Kayak Oteli",
    150,
    1500,
  ),
  konseptPlanlanan("otel_tatil", "Tatil Oteli", "Otel F&B", "Tatil Oteli", 250, 4000),
  konseptPlanlanan(
    "catering_uretim",
    "Üretim Fabrikası",
    "Catering",
    "Üretim Fabrikası",
    200,
    3000,
  ),
  konseptPlanlanan(
    "catering_yerinde",
    "Yerinde Üretim",
    "Catering",
    "Yerinde Üretim",
    80,
    800,
  ),
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
  konseptPlanlanan("bulut_burger", "Burger", "Bulut Mutfak", "Burger", 35, 100),
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

/** q_dukkan_turu cevabı → shopTypes.pfos.dukkanSecim (tek kaynak) */
export const DUKKAN_SECIM_ESLEME: Record<string, string> = Object.fromEntries(
  PFOS_KONSEPT_SHOP_TYPES.filter((t) => t.pfos.dukkanSecim).map((t) => [
    t.pfos.dukkanSecim,
    t.pfos.dukkanSecim,
  ]),
);

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
