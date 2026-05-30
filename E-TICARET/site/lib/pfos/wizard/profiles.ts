import type { Konsept } from "@/lib/pfos/schemas/pfos.schema";

export type PfosProfilMeta = {
  konsept: Konsept;
  konseptUst: string;
  dukkan: string;
  pfosZones: string[];
};

/** Şablon slug → referans profil (pfos-zone-proje-kurallari.json ile uyumlu) */
export const PROFIL_BY_SLUG: Record<Konsept, PfosProfilMeta> = {
  "all-day-dining-cafe": {
    konsept: "all-day-dining-cafe",
    konseptUst: "Restaurant",
    dukkan: "All Dining Cafe (TheHouse Cafe, Happymoons vb)",
    /** Referans şablon (THC Bakü @ 280 m²) — zone katalog eklemez */
    pfosZones: [],
  },
  "kebap-ortadogu": {
    konsept: "kebap-ortadogu",
    konseptUst: "Restaurant",
    dukkan: "Kebap & Ortadoğu",
    pfosZones: [
      "et_hazirlik",
      "ana_mutfak",
      "izgara_meze",
      "sebze_hazirlik",
      "soguk_oda",
      "derin_dondurucu",
      "bulasikhane",
      "bar",
    ],
  },
  pizzaci: {
    konsept: "pizzaci",
    konseptUst: "Restaurant",
    dukkan: "Pizzacı",
    pfosZones: [
      "ana_mutfak",
      "sebze_hazirlik",
      "kuru_depo",
      "soguk_oda",
      "bulasikhane",
      "bar",
    ],
  },
  meyhane: {
    konsept: "meyhane",
    konseptUst: "Restaurant",
    dukkan: "Meyhane / Mezeli",
    pfosZones: [
      "ana_mutfak",
      "izgara_meze",
      "sebze_hazirlik",
      "soguk_oda",
      "bulasikhane",
      "bar",
      "acik_bufe",
    ],
  },
  "turk-restoran": {
    konsept: "turk-restoran",
    konseptUst: "Restaurant",
    dukkan: "Türk Restoran",
    /** S13-388 referans şablonu — zone katalog eklemez */
    pfosZones: [],
  },
  "coffee-shop": {
    konsept: "coffee-shop",
    konseptUst: "Restaurant",
    dukkan: "Coffee Shop",
    /** Şablon Espressolab/Gloria Jeans bar setini tek başına tanımlar — zone katalog davlumbaz/giyotin/ana mutfak eklemez */
    pfosZones: [],
  },
  steakhouse: {
    konsept: "steakhouse",
    konseptUst: "Restaurant",
    dukkan: "Steakhouse",
    pfosZones: [
      "show_mutfagi",
      "soguk_oda",
      "derin_dondurucu",
      "et_hazirlik",
      "ana_mutfak",
      "bar",
      "sebze_hazirlik",
      "kuru_depo",
      "bulasikhane",
    ],
  },
  balikci: {
    konsept: "balikci",
    konseptUst: "Restaurant",
    dukkan: "Balık Restaurant",
    pfosZones: [
      "ana_mutfak",
      "sebze_hazirlik",
      "soguk_oda",
      "derin_dondurucu",
      "bulasikhane",
      "bar",
      "kuru_depo",
    ],
  },
  italyan: {
    konsept: "italyan",
    konseptUst: "Restaurant",
    dukkan: "İtalyan Restoran",
    pfosZones: [
      "kuru_depo",
      "soguk_oda",
      "derin_dondurucu",
      "sebze_hazirlik",
      "et_hazirlik",
      "ana_mutfak",
      "show_mutfagi",
      "bar",
      "bulasikhane",
    ],
  },
  birahane: {
    konsept: "birahane",
    konseptUst: "Bar & Lounge",
    dukkan: "Birahane",
    pfosZones: [
      "bar",
      "soguk_oda",
      "ana_mutfak",
      "sebze_hazirlik",
      "bulasikhane",
      "kuru_depo",
    ],
  },
  pastane: {
    konsept: "pastane",
    konseptUst: "Pastane & Fırın",
    dukkan: "Pastane",
    pfosZones: [
      "pastane",
      "ana_mutfak",
      "sebze_hazirlik",
      "soguk_oda",
      "bulasikhane",
      "kuru_depo",
    ],
  },
  pideci: {
    konsept: "pideci",
    konseptUst: "Restoran",
    dukkan: "Pideci",
    pfosZones: [
      "ana_mutfak",
      "sebze_hazirlik",
      "et_hazirlik",
      "soguk_oda",
      "derin_dondurucu",
      "bulasikhane",
      "bar",
      "kuru_depo",
    ],
  },
  sushi: {
    konsept: "sushi",
    konseptUst: "Restoran",
    dukkan: "Sushi",
    pfosZones: [
      "ana_mutfak",
      "soguk_oda",
      "sebze_hazirlik",
      "bar",
      "bulasikhane",
      "kuru_depo",
    ],
  },
  "sarkuteri-kiosk": {
    konsept: "sarkuteri-kiosk",
    konseptUst: "Restoran",
    dukkan: "Şarküteri Kiosk",
    pfosZones: [
      "ana_mutfak",
      "soguk_oda",
      "kuru_depo",
      "bar",
      "bulasikhane",
    ],
  },
  "hamburger-kiosk": {
    konsept: "hamburger-kiosk",
    konseptUst: "Fast Food / QSR",
    dukkan: "Hamburger Kiosk",
    pfosZones: [
      "ana_mutfak",
      "soguk_oda",
      "derin_dondurucu",
      "kuru_depo",
      "bulasikhane",
    ],
  },
  "hotdog-kiosk": {
    konsept: "hotdog-kiosk",
    konseptUst: "Fast Food / QSR",
    dukkan: "Hotdog Kiosk",
    pfosZones: [
      "ana_mutfak",
      "soguk_oda",
      "kuru_depo",
      "bulasikhane",
    ],
  },
};

export function zonesForKonsept(slug: Konsept | null): string[] {
  if (!slug) return [];
  return PROFIL_BY_SLUG[slug]?.pfosZones ?? [];
}

/** Toplam m²’yi zone listesine orantılı dağıt (ilk kurulum) */
export function dagitM2Toplam(
  zones: string[],
  toplam: number,
): Record<string, number> {
  if (!zones.length || toplam <= 0) return {};
  const pay = Math.floor(toplam / zones.length);
  let kalan = toplam - pay * zones.length;
  const out: Record<string, number> = {};
  zones.forEach((z, i) => {
    out[z] = pay + (i < kalan ? 1 : 0);
  });
  return out;
}
