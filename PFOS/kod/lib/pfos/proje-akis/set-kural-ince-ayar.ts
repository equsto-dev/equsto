/**
 * Set/kural koşullarını teklif motoru (pickShopTypeBant, pickBalikciListe, …) ile hizalar.
 */
import type { M2BantTanim, ShopTypeKayit } from "./konsept-tanimlari";
import {
  buildRuleId,
  eqSetBantForSet,
  type ProjeAkisEqSetRow,
  type ProjeAkisRuleRow,
} from "./set-kural-taslak";

type Cond = NonNullable<ProjeAkisRuleRow["conditions"]>[number];

function cond(label: string, questionId: string, op: string, value: string): Cond {
  return { label, questionId, op, value };
}

function dukkan(value: string): Cond {
  return cond("Dükkan türü", "q_dukkan_turu", "equals", value);
}

function m2(op: "lte" | "lt" | "gte" | "gt", value: number): Cond {
  return cond("Alan m²", "q_m2", op, String(value));
}

function altSoru(questionId: string, label: string, value: string): Cond {
  return cond(label, questionId, "equals", value);
}

function ruleRow(
  concept: ShopTypeKayit,
  set: ProjeAkisEqSetRow,
  suffix: string,
  opts: {
    priority: number;
    desc: string;
    conditions: Cond[];
  },
): ProjeAkisRuleRow {
  const id = suffix
    ? `${buildRuleId(concept.id, set.id)}_${suffix}`.replace(/[^a-z0-9_]+/gi, "_")
    : buildRuleId(concept.id, set.id);
  return {
    id,
    typeId: concept.id,
    setId: set.id,
    priority: opts.priority,
    desc: opts.desc,
    conditions: opts.conditions,
  };
}

/** pickM2Bant: m² ≤ 150 → 80-150; aksi → 150-250 */
function rulesPickM2Bant(
  concept: ShopTypeKayit,
  set: ProjeAkisEqSetRow,
  bantId: string,
): ProjeAkisRuleRow[] {
  const d = dukkan(concept.pfos.dukkanSecim);
  if (bantId === "80-150") {
    return [
      ruleRow(concept, set, "", {
        priority: 20,
        desc: `${concept.name}: m² ≤ 150 → ${set.name}`,
        conditions: [d, m2("lte", 150)],
      }),
    ];
  }
  if (bantId === "150-250") {
    return [
      ruleRow(concept, set, "", {
        priority: 20,
        desc: `${concept.name}: m² > 150 → ${set.name}`,
        conditions: [d, m2("gt", 150)],
      }),
    ];
  }
  return [];
}

function rulesBalikci(
  concept: ShopTypeKayit,
  set: ProjeAkisEqSetRow,
  bant: M2BantTanim,
): ProjeAkisRuleRow[] {
  const d = dukkan("Balık Restaurant");
  if (bant.id === "mahalle") {
    return [
      ruleRow(concept, set, "mahalle", {
        priority: 5,
        desc: "Balık Restaurant + Mahalle balıkçısı → mahalle listesi",
        conditions: [d, altSoru("q_balik_alt", "Balık modeli", "Mahalle balıkçısı")],
      }),
    ];
  }
  if (bant.id === "350-600") {
    return [
      ruleRow(concept, set, "buyuk", {
        priority: 15,
        desc: "Balık Restaurant: m² ≥ 350 → Dudak Payı listesi",
        conditions: [d, m2("gte", 350)],
      }),
    ];
  }
  if (bant.id === "80-150") {
    return [
      ruleRow(concept, set, "kucuk", {
        priority: 20,
        desc: "Balık Restaurant: m² ≤ 150 (mahalle hariç) → 80–150 listesi",
        conditions: [d, m2("lte", 150), m2("lt", 350)],
      }),
    ];
  }
  if (bant.id === "150-250") {
    return [
      ruleRow(concept, set, "orta", {
        priority: 20,
        desc: "Balık Restaurant: 150 < m² < 350 → Uçan Balık listesi",
        conditions: [d, m2("gt", 150), m2("lt", 350)],
      }),
    ];
  }
  return [];
}

function rulesPizzaci(
  concept: ShopTypeKayit,
  set: ProjeAkisEqSetRow,
  bantId: string,
): ProjeAkisRuleRow[] {
  const d = dukkan(concept.pfos.dukkanSecim);
  if (bantId === "80-200") {
    return [
      ruleRow(concept, set, "", {
        priority: 20,
        desc: `${concept.name}: m² ≤ 200 → küçük salon listesi`,
        conditions: [d, m2("lte", 200)],
      }),
    ];
  }
  if (bantId === "200-500") {
    return [
      ruleRow(concept, set, "", {
        priority: 20,
        desc: `${concept.name}: m² > 200 → büyük salon listesi`,
        conditions: [d, m2("gt", 200)],
      }),
    ];
  }
  return [];
}

function rulesPastane(
  concept: ShopTypeKayit,
  set: ProjeAkisEqSetRow,
  bantId: string,
): ProjeAkisRuleRow[] {
  const d = dukkan(concept.pfos.dukkanSecim);
  if (bantId === "100-200") {
    return [
      ruleRow(concept, set, "", {
        priority: 20,
        desc: `${concept.name}: m² ≤ 150 → 14-PASTANE listesi`,
        conditions: [d, m2("lte", 150)],
      }),
    ];
  }
  if (bantId === "150-250") {
    return [
      ruleRow(concept, set, "", {
        priority: 20,
        desc: `${concept.name}: m² > 150 → geniş pastane listesi`,
        conditions: [d, m2("gt", 150)],
      }),
    ];
  }
  return [];
}

function rulesAllDayDining(
  concept: ShopTypeKayit,
  set: ProjeAkisEqSetRow,
  bantId: string,
): ProjeAkisRuleRow[] {
  const d = dukkan(concept.pfos.dukkanSecim);
  if (bantId === "100-200") {
    return [
      ruleRow(concept, set, "boyoz", {
        priority: 10,
        desc: "All Dining: m² ≤ 200 → Smyrna Boyoz listesi",
        conditions: [d, m2("lte", 200)],
      }),
    ];
  }
  if (bantId === "150-300") {
    return [
      ruleRow(concept, set, "havelka", {
        priority: 20,
        desc: "All Dining: 200 < m² ≤ 300 → Havelka listesi",
        conditions: [d, m2("gt", 200), m2("lte", 300)],
      }),
    ];
  }
  if (bantId === "200-400") {
    return [
      ruleRow(concept, set, "thc", {
        priority: 30,
        desc: "All Dining: 300 < m² ≤ 400 → THC Mavibahçe listesi",
        conditions: [d, m2("gt", 300), m2("lte", 400)],
      }),
    ];
  }
  return [];
}

function rulesKebapOrtadogu(
  concept: ShopTypeKayit,
  set: ProjeAkisEqSetRow,
  bantId: string,
): ProjeAkisRuleRow[] {
  const d = dukkan(concept.pfos.dukkanSecim);
  if (bantId === "80-200") {
    return [
      ruleRow(concept, set, "", {
        priority: 20,
        desc: `${concept.name}: m² ≤ 200`,
        conditions: [d, m2("lte", 200)],
      }),
    ];
  }
  if (bantId === "200-400") {
    return [
      ruleRow(concept, set, "", {
        priority: 20,
        desc: `${concept.name}: 200 < m² ≤ 400`,
        conditions: [d, m2("gt", 200), m2("lte", 400)],
      }),
    ];
  }
  if (bantId === "300-500") {
    return [
      ruleRow(concept, set, "", {
        priority: 20,
        desc: `${concept.name}: m² > 400 → zone şablonu bandı`,
        conditions: [d, m2("gt", 400)],
      }),
    ];
  }
  return [];
}

function rulesKahveDuragi(
  concept: ShopTypeKayit,
  set: ProjeAkisEqSetRow,
  bantId: string,
): ProjeAkisRuleRow[] {
  const d = dukkan(concept.pfos.dukkanSecim);
  if (bantId === "100-200") {
    return [
      ruleRow(concept, set, "", {
        priority: 20,
        desc: `${concept.name}: m² < 150 → Konyaaltı (kompakt)`,
        conditions: [d, m2("lt", 150)],
      }),
    ];
  }
  if (bantId === "150-200") {
    return [
      ruleRow(concept, set, "", {
        priority: 20,
        desc: `${concept.name}: m² ≥ 150 → Karabük (standart)`,
        conditions: [d, m2("gte", 150)],
      }),
    ];
  }
  return [];
}

function rulesTurkRestoran(
  concept: ShopTypeKayit,
  set: ProjeAkisEqSetRow,
  bantId: string,
): ProjeAkisRuleRow[] {
  const d = dukkan("Türk / Esnaf lokanta");
  if (bantId === "150-300") {
    return [
      ruleRow(concept, set, "s13", {
        priority: 20,
        desc: "Türk lokanta: m² ≤ 300 → S13-388 referansı",
        conditions: [d, m2("lte", 300)],
      }),
    ];
  }
  if (bantId === "300-500") {
    return [
      ruleRow(concept, set, "vadi", {
        priority: 20,
        desc: "Türk lokanta: 300 < m² ≤ 500 → Vadi İstanbul",
        conditions: [d, m2("gt", 300), m2("lte", 500)],
      }),
    ];
  }
  if (bantId === "200-5000") {
    return [
      ruleRow(concept, set, "sutis", {
        priority: 20,
        desc: "Türk lokanta: m² > 500 → Sütiş Şişhane referansı",
        conditions: [d, m2("gt", 500)],
      }),
    ];
  }
  return [];
}

/** Kiremit Akasya — sihirbazda Türk/Esnaf + alt tip veya doğrudan dükkan seçimi */
function rulesKiremitAkasya(
  concept: ShopTypeKayit,
  set: ProjeAkisEqSetRow,
): ProjeAkisRuleRow[] {
  const dukkanSecim = concept.pfos.dukkanSecim;
  if (dukkanSecim === "Türk Mutfağı") {
    return [
      ruleRow(concept, set, "esnaf_self", {
        priority: 10,
        desc: "Türk/Esnaf lokanta + Self servis → Kiremit Akasya listesi",
        conditions: [
          dukkan("Türk / Esnaf lokanta"),
          altSoru("q_restoran_alt", "Restoran alt tip", "Self servis"),
        ],
      }),
      ruleRow(concept, set, "direct", {
        priority: 30,
        desc: "Doğrudan Türk Mutfağı seçimi → Kiremit Akasya listesi",
        conditions: [dukkan("Türk Mutfağı")],
      }),
    ];
  }
  if (dukkanSecim === "Food Court") {
    return [
      ruleRow(concept, set, "esnaf_fc", {
        priority: 10,
        desc: "Türk/Esnaf lokanta + Food Court → Kiremit Akasya listesi",
        conditions: [
          dukkan("Türk / Esnaf lokanta"),
          altSoru("q_restoran_alt", "Restoran alt tip", "Food Court"),
        ],
      }),
      ruleRow(concept, set, "direct", {
        priority: 30,
        desc: "Doğrudan Food Court seçimi → Kiremit Akasya listesi",
        conditions: [dukkan("Food Court")],
      }),
    ];
  }
  return [
    ruleRow(concept, set, "", {
      priority: 20,
      desc: `${concept.name} → ${set.name}`,
      conditions: [dukkan(dukkanSecim)],
    }),
  ];
}

function rulesNumericBantRange(
  concept: ShopTypeKayit,
  set: ProjeAkisEqSetRow,
  bant: M2BantTanim,
): ProjeAkisRuleRow[] {
  const m = String(bant.id).match(/^(\d+)-(\d+)$/);
  if (!m) return [];
  const lo = Number(m[1]);
  const hi = Number(m[2]);
  return [
    ruleRow(concept, set, "", {
      priority: 20,
      desc: `${concept.name}: ${lo}–${hi} m² aralığı`,
      conditions: [
        dukkan(concept.pfos.dukkanSecim),
        m2("gte", lo),
        m2("lte", hi),
      ],
    }),
  ];
}

function refineSetRules(
  concept: ShopTypeKayit,
  set: ProjeAkisEqSetRow,
  bant: M2BantTanim | undefined,
): ProjeAkisRuleRow[] {
  const slug = concept.pfos.motorSlug;
  const bantId = bant?.id ?? "";

  if (slug === "balikci" && bant) return rulesBalikci(concept, set, bant);
  if (slug === "pizzaci") return rulesPizzaci(concept, set, bantId);
  if (slug === "pastane") return rulesPastane(concept, set, bantId);
  if (slug === "all-day-dining-cafe") return rulesAllDayDining(concept, set, bantId);
  if (slug === "kebap-ortadogu") return rulesKebapOrtadogu(concept, set, bantId);
  if (slug === "kahve-duragi") return rulesKahveDuragi(concept, set, bantId);
  if (concept.id === "turk_restoran") return rulesTurkRestoran(concept, set, bantId);
  if (slug === "kiremit-akasya") return rulesKiremitAkasya(concept, set);

  if (bantId === "80-150" || bantId === "150-250") {
    const m2b = rulesPickM2Bant(concept, set, bantId);
    if (m2b.length) return m2b;
  }

  if (bant) {
    const ranged = rulesNumericBantRange(concept, set, bant);
    if (ranged.length) return ranged;
  }

  return [
    ruleRow(concept, set, "", {
      priority: 50,
      desc: `${concept.name} seçilirse ${set.name} setini öner`,
      conditions: [dukkan(concept.pfos.dukkanSecim)],
    }),
  ];
}

/** Taslak kuralları motor hizalı koşullara dönüştürür (set başına 1+ kural olabilir). */
export function refineProjeAkisRules(
  shopTypes: ShopTypeKayit[],
  eqSets: ProjeAkisEqSetRow[],
): ProjeAkisRuleRow[] {
  const rows: ProjeAkisRuleRow[] = [];
  for (const set of eqSets) {
    const concept = shopTypes.find((t) => t.id === set.typeId);
    if (!concept) continue;
    const bant = eqSetBantForSet(concept, set.id);
    rows.push(...refineSetRules(concept, set, bant));
  }
  return rows;
}

export function createRefinedRules(
  shopTypes: ShopTypeKayit[],
  eqSets: ProjeAkisEqSetRow[],
): ProjeAkisRuleRow[] {
  return refineProjeAkisRules(shopTypes, eqSets);
}
