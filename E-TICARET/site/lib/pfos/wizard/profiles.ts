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
  "personel-yemekhane": {
    konsept: "personel-yemekhane",
    konseptUst: "Catering",
    dukkan: "Personel Yemekhanesi (Catering)",
    pfosZones: [
      "ana_mutfak",
      "soguk_oda",
      "sebze_hazirlik",
      "bulasikhane",
      "kuru_depo",
      "depo",
    ],
  },
  donerci: {
    konsept: "donerci",
    konseptUst: "Restoran",
    dukkan: "Dönerci (Yeni Nesil)",
    pfosZones: [
      "ana_mutfak",
      "izgara_meze",
      "sebze_hazirlik",
      "soguk_oda",
      "derin_dondurucu",
      "bulasikhane",
      "kuru_depo",
      "depo",
      "bar",
    ],
  },
  "boyoz-pastane": {
    konsept: "boyoz-pastane",
    konseptUst: "Pastane & Fırın",
    dukkan: "Pastane Cafe (Boyoz)",
    pfosZones: [],
  },
  "ekmek-kruvasan": {
    konsept: "ekmek-kruvasan",
    konseptUst: "Üretim / Fabrika",
    dukkan: "Ekmek + Kruvasan",
    pfosZones: [
      "pastane",
      "ana_mutfak",
      "soguk_oda",
      "derin_dondurucu",
      "sebze_hazirlik",
      "bulasikhane",
      "kuru_depo",
      "depo",
    ],
  },
  "tatil-otel": {
    konsept: "tatil-otel",
    konseptUst: "Otel F&B",
    dukkan: "Tatil Oteli",
    pfosZones: [
      "ana_mutfak",
      "soguk_oda",
      "sebze_hazirlik",
      "bulasikhane",
      "bar",
      "kuru_depo",
      "depo",
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
    /** Uçan Balık / mahalle referans listesi — zone katalog bar seti eklemez */
    pfosZones: [],
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
  tavukcu: {
    konsept: "tavukcu",
    konseptUst: "Restoran",
    dukkan: "Tavukçu",
    pfosZones: [
      "ana_mutfak",
      "soguk_oda",
      "derin_dondurucu",
      "sebze_hazirlik",
      "bar",
      "bulasikhane",
      "kuru_depo",
    ],
  },
  "kanatci-kebapci": {
    konsept: "kanatci-kebapci",
    konseptUst: "Restoran",
    dukkan: "Kanatçı-Kebapçı",
    /** KÖŞK KANAT referans şablonu — zone katalog eklemez */
    pfosZones: [],
  },
  "patisserie-yemek": {
    konsept: "patisserie-yemek",
    konseptUst: "Restoran",
    dukkan: "Patisserie + Yemek",
    /** HAMOUR Acarkent referans şablonu — zone katalog eklemez */
    pfosZones: [],
  },
  restoran: {
    konsept: "restoran",
    konseptUst: "Restoran",
    dukkan: "Restoran",
    pfosZones: [
      "ana_mutfak",
      "soguk_oda",
      "derin_dondurucu",
      "sebze_hazirlik",
      "bar",
      "bulasikhane",
      "kuru_depo",
    ],
  },
  "kokteyl-kahve": {
    konsept: "kokteyl-kahve",
    konseptUst: "Bar & Lounge",
    dukkan: "Kokteyl + Kahve",
    pfosZones: ["bar", "pastane", "bulasikhane", "kuru_depo"],
  },
  "kahve-atolyesi": {
    konsept: "kahve-atolyesi",
    konseptUst: "Kafe / Coffee Shop",
    dukkan: "Kahve Atölyesi",
    pfosZones: [
      "bar",
      "ana_mutfak",
      "izgara_meze",
      "bulasikhane",
      "kuru_depo",
      "pastane",
    ],
  },
  "harvest-cafe": {
    konsept: "harvest-cafe",
    konseptUst: "Kafe / Coffee Shop",
    dukkan: "Harvest Cafe",
    pfosZones: [
      "bar",
      "ana_mutfak",
      "soguk_oda",
      "pastane",
      "bulasikhane",
      "kuru_depo",
      "izgara_meze",
    ],
  },
  "kahve-duragi": {
    konsept: "kahve-duragi",
    konseptUst: "Kafe / Coffee Shop",
    dukkan: "Kahve Durağı",
    pfosZones: [
      "bar",
      "ana_mutfak",
      "pastane",
      "sebze_hazirlik",
      "bulasikhane",
      "kuru_depo",
      "izgara_meze",
    ],
  },
  "kahve-tatli": {
    konsept: "kahve-tatli",
    konseptUst: "Kafe / Coffee Shop",
    dukkan: "Kahve & Tatlı",
    pfosZones: [
      "bar",
      "pastane",
      "ana_mutfak",
      "bulasikhane",
      "kuru_depo",
    ],
  },
  "kahve-duragi-pastane": {
    konsept: "kahve-duragi-pastane",
    konseptUst: "Kafe / Coffee Shop",
    dukkan: "Kahve Durağı — Pastane & Kahvaltı",
    pfosZones: [
      "bar",
      "pastane",
      "ana_mutfak",
      "bulasikhane",
      "kuru_depo",
      "izgara_meze",
    ],
  },
  "all-sport-cafe": {
    konsept: "all-sport-cafe",
    konseptUst: "Kafe / Coffee Shop",
    dukkan: "All Sport Cafe",
    pfosZones: [
      "bar",
      "ana_mutfak",
      "bulasikhane",
      "kuru_depo",
    ],
  },
  "casual-cafe": {
    konsept: "casual-cafe",
    konseptUst: "Kafe / Coffee Shop",
    dukkan: "Casual Cafe",
    pfosZones: [
      "bar",
      "ana_mutfak",
      "pastane",
      "bulasikhane",
      "kuru_depo",
    ],
  },
  "buyuk-yemekhane": {
    konsept: "buyuk-yemekhane",
    konseptUst: "Catering / Kurumsal",
    dukkan: "Büyük Yemekhane",
    pfosZones: [
      "ana_mutfak",
      "soguk_oda",
      "sebze_hazirlik",
      "bulasikhane",
      "kuru_depo",
      "depo",
    ],
  },
  "guneli-pastane": {
    konsept: "guneli-pastane",
    konseptUst: "Pastane & Fırın",
    dukkan: "Güneli Fırın",
    pfosZones: [
      "pastane",
      "ana_mutfak",
      "sebze_hazirlik",
      "soguk_oda",
      "derin_dondurucu",
      "bulasikhane",
      "kuru_depo",
      "bar",
    ],
  },
  "resort-otel": {
    konsept: "resort-otel",
    konseptUst: "Otel F&B",
    dukkan: "Resort Otel",
    pfosZones: [
      "ana_mutfak",
      "soguk_oda",
      "sebze_hazirlik",
      "bulasikhane",
      "bar",
      "kuru_depo",
      "depo",
    ],
  },
  "sehir-otel": {
    konsept: "sehir-otel",
    konseptUst: "Otel F&B",
    dukkan: "Şehir Oteli (Business)",
    pfosZones: [
      "ana_mutfak",
      "soguk_oda",
      "sebze_hazirlik",
      "pastane",
      "bulasikhane",
      "bar",
      "kuru_depo",
      "depo",
    ],
  },
  "mus-selinoz-turk": {
    konsept: "mus-selinoz-turk",
    konseptUst: "Fast Food / QSR",
    dukkan: "Türk Mutfağı — Lokanta",
    pfosZones: [
      "bar",
      "pastane",
      "ana_mutfak",
      "sebze_hazirlik",
      "soguk_oda",
      "izgara_meze",
      "bulasikhane",
      "kuru_depo",
    ],
  },
  "kiremit-akasya": {
    konsept: "kiremit-akasya",
    konseptUst: "Fast Food / QSR",
    dukkan: "Kiremit Akasya",
    pfosZones: [
      "ana_mutfak",
      "bulasikhane",
      "soguk_oda",
      "kuru_depo",
      "bar",
    ],
  },
  kasap: {
    konsept: "kasap",
    konseptUst: "Şarküteri & Kasap",
    dukkan: "Kasap",
    pfosZones: ["ana_mutfak", "soguk_oda", "kuru_depo", "bulasikhane"],
  },
  "kasap-sarkuteri": {
    konsept: "kasap-sarkuteri",
    konseptUst: "Şarküteri & Kasap",
    dukkan: "Kasap + Şarküteri",
    pfosZones: [
      "ana_mutfak",
      "soguk_oda",
      "sebze_hazirlik",
      "kuru_depo",
      "bar",
      "bulasikhane",
    ],
  },
  "sarkuteri-restoran": {
    konsept: "sarkuteri-restoran",
    konseptUst: "Restoran",
    dukkan: "Şarküteri Restoran",
    pfosZones: [
      "ana_mutfak",
      "soguk_oda",
      "sebze_hazirlik",
      "kuru_depo",
      "bar",
      "bulasikhane",
    ],
  },
  "inari-bar-yemek": {
    konsept: "inari-bar-yemek",
    konseptUst: "Restoran",
    dukkan: "Bar + Yemek",
    pfosZones: ["bar", "ana_mutfak", "bulasikhane", "soguk_oda", "kuru_depo"],
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
