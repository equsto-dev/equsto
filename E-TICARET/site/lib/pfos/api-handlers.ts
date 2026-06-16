import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { calculateQuote, PFOS_CONCEPT_BY_SLUG } from "@/lib/pfos/core";
import { getAllTemplates, getTemplate, resolveTemplateForQuote } from "@/lib/pfos/core/templates";
import {
  PFOSRequestSchema,
  KONSEPT_LABELS,
  type Konsept,
} from "@/lib/pfos/schemas/pfos.schema";
import { TEKLIF_DEFAULT_FIYAT_STRATEJISI } from "@/lib/pfos/teklif/teklif-policy";
import {
  findShopTypeForQuote,
  loadProjeAkisShopTypes,
} from "@/lib/pfos/proje-akis/load-shop-types";

const M2_RANGES: Record<string, { min: number; max: number }> = {
  "all-day-dining-cafe": { min: 100, max: 400 },
  "kebap-ortadogu": { min: 80, max: 500 },
  pizzaci: { min: 80, max: 500 },
  meyhane: { min: 100, max: 500 },
  "turk-restoran": { min: 150, max: 5000 },
  "coffee-shop": { min: 60, max: 300 },
  "coffee-shop-yemek": { min: 250, max: 350 },
  steakhouse: { min: 80, max: 250 },
  balikci: { min: 80, max: 600 },
  italyan: { min: 100, max: 300 },
  birahane: { min: 100, max: 300 },
  pastane: { min: 100, max: 250 },
  pideci: { min: 100, max: 250 },
  sushi: { min: 40, max: 100 },
  "sarkuteri-kiosk": { min: 25, max: 80 },
  "hamburger-kiosk": { min: 60, max: 100 },
  "hotdog-kiosk": { min: 25, max: 60 },
  tavukcu: { min: 80, max: 150 },
  "kanatci-kebapci": { min: 100, max: 250 },
  "patisserie-yemek": { min: 200, max: 400 },
  "boyoz-pastane": { min: 100, max: 250 },
  restoran: { min: 500, max: 1000 },
  "kokteyl-kahve": { min: 30, max: 50 },
  "kahve-atolyesi": { min: 80, max: 150 },
  "harvest-cafe": { min: 100, max: 200 },
  "all-sport-cafe": { min: 100, max: 200 },
  "casual-cafe": { min: 50, max: 150 },
  "buyuk-yemekhane": { min: 2000, max: 3500 },
  "guneli-pastane": { min: 200, max: 400 },
  "pastane-cafe": { min: 300, max: 500 },
  "ekmek-kruvasan": { min: 150, max: 400 },
  "sehir-otel": { min: 500, max: 2000 },
  "tatil-otel": { min: 250, max: 4000 },
  "kiremit-akasya": { min: 100, max: 250 },
  "mus-selinoz-turk": { min: 100, max: 250 },
  kasap: { min: 100, max: 250 },
  "kasap-sarkuteri": { min: 100, max: 250 },
  "sarkuteri-restoran": { min: 100, max: 250 },
  "inari-bar-yemek": { min: 100, max: 200 },
  "kahve-duragi": { min: 100, max: 200 },
  "kahve-tatli": { min: 40, max: 100 },
  "kahve-duragi-pastane": { min: 100, max: 200 },
  "resort-otel": { min: 200, max: 500 },
  "personel-yemekhane": { min: 150, max: 250 },
};

export function pfosGetConcepts() {
  const templates = getAllTemplates();
  const base = templates.map((t) => ({
    konsept: t.konsept,
    label: KONSEPT_LABELS[t.konsept as Konsept] ?? t.label,
    ornekler: t.ornekler,
    m2Min: M2_RANGES[t.konsept]?.min ?? 60,
    m2Max: M2_RANGES[t.konsept]?.max ?? 500,
    itemSayisi: t.items.length,
    zorunluSayisi: t.items.filter((i) => i.tip === "zorunlu").length,
  }));
  const referansJson = [
    {
      konsept: "steakhouse",
      label: KONSEPT_LABELS.steakhouse,
      ornekler: ["Nusr-Et tarzı", "Mangal / steak"],
      m2Min: M2_RANGES.steakhouse.min,
      m2Max: M2_RANGES.steakhouse.max,
      itemSayisi: 58,
      zorunluSayisi: 58,
    },
    {
      konsept: "balikci",
      label: KONSEPT_LABELS.balikci,
      ornekler: ["Uçan Balık referans", "Balık restoran", "Deniz ürünleri"],
      m2Min: M2_RANGES.balikci.min,
      m2Max: M2_RANGES.balikci.max,
      itemSayisi: 56,
      zorunluSayisi: 56,
    },
    {
      konsept: "coffee-shop",
      label: KONSEPT_LABELS["coffee-shop"],
      ornekler: ["Espressolab Watergarden", "Espressolab", "Gloria Jean's"],
      m2Min: M2_RANGES["coffee-shop"].min,
      m2Max: M2_RANGES["coffee-shop"].max,
      itemSayisi: 21,
      zorunluSayisi: 21,
    },
    {
      konsept: "italyan",
      label: KONSEPT_LABELS.italyan,
      ornekler: ["Trattoria", "Osteria"],
      m2Min: M2_RANGES.italyan.min,
      m2Max: M2_RANGES.italyan.max,
      itemSayisi: 89,
      zorunluSayisi: 89,
    },
    {
      konsept: "turk-restoran",
      label: KONSEPT_LABELS["turk-restoran"],
      ornekler: [
        "Sütiş Şişhane",
        "S13-388 yerleşim",
        "Türk / esnaf lokanta",
      ],
      m2Min: M2_RANGES["turk-restoran"].min,
      m2Max: M2_RANGES["turk-restoran"].max,
      itemSayisi: 77,
      zorunluSayisi: 77,
    },
    {
      konsept: "all-day-dining-cafe",
      label: KONSEPT_LABELS["all-day-dining-cafe"],
      ornekler: ["The House Café", "Big Chefs"],
      m2Min: M2_RANGES["all-day-dining-cafe"].min,
      m2Max: M2_RANGES["all-day-dining-cafe"].max,
      itemSayisi: 89,
      zorunluSayisi: 89,
    },
    {
      konsept: "birahane",
      label: KONSEPT_LABELS.birahane,
      ornekler: ["Mikro birahane", "Craft beer pub"],
      m2Min: M2_RANGES.birahane.min,
      m2Max: M2_RANGES.birahane.max,
      itemSayisi: 27,
      zorunluSayisi: 27,
    },
    {
      konsept: "pastane",
      label: KONSEPT_LABELS.pastane,
      ornekler: ["Butik pastane", "Patisserie"],
      m2Min: M2_RANGES.pastane.min,
      m2Max: M2_RANGES.pastane.max,
      itemSayisi: 41,
      zorunluSayisi: 41,
    },
    {
      konsept: "pizzaci",
      label: KONSEPT_LABELS.pizzaci,
      ornekler: ["Mialiento Avcılar", "Pizza Il Forno"],
      m2Min: M2_RANGES.pizzaci.min,
      m2Max: M2_RANGES.pizzaci.max,
      itemSayisi: 69,
      zorunluSayisi: 69,
    },
    {
      konsept: "pideci",
      label: KONSEPT_LABELS.pideci,
      ornekler: ["Lahmacun & pide salonu", "Taş fırın pideci"],
      m2Min: M2_RANGES.pideci.min,
      m2Max: M2_RANGES.pideci.max,
      itemSayisi: 50,
      zorunluSayisi: 50,
    },
    {
      konsept: "sushi",
      label: KONSEPT_LABELS.sushi,
      ornekler: ["Sushi bar", "Omakase"],
      m2Min: M2_RANGES.sushi.min,
      m2Max: M2_RANGES.sushi.max,
      itemSayisi: 27,
      zorunluSayisi: 27,
    },
    {
      konsept: "sarkuteri-kiosk",
      label: KONSEPT_LABELS["sarkuteri-kiosk"],
      ornekler: ["Gurme şarküteri kiosk", "AVM şarküteri"],
      m2Min: M2_RANGES["sarkuteri-kiosk"].min,
      m2Max: M2_RANGES["sarkuteri-kiosk"].max,
      itemSayisi: 23,
      zorunluSayisi: 23,
    },
    {
      konsept: "hamburger-kiosk",
      label: KONSEPT_LABELS["hamburger-kiosk"],
      ornekler: ["QSR burger kiosk", "AVM hamburger"],
      m2Min: M2_RANGES["hamburger-kiosk"].min,
      m2Max: M2_RANGES["hamburger-kiosk"].max,
      itemSayisi: 22,
      zorunluSayisi: 22,
    },
    {
      konsept: "hotdog-kiosk",
      label: KONSEPT_LABELS["hotdog-kiosk"],
      ornekler: ["Sosisli kiosk", "AVM hot dog"],
      m2Min: M2_RANGES["hotdog-kiosk"].min,
      m2Max: M2_RANGES["hotdog-kiosk"].max,
      itemSayisi: 16,
      zorunluSayisi: 16,
    },
    {
      konsept: "tavukcu",
      label: KONSEPT_LABELS.tavukcu,
      ornekler: ["Pilic çevirme", "Fried chicken salonu"],
      m2Min: M2_RANGES.tavukcu.min,
      m2Max: M2_RANGES.tavukcu.max,
      itemSayisi: 28,
      zorunluSayisi: 28,
    },
    {
      konsept: "restoran",
      label: KONSEPT_LABELS.restoran,
      ornekler: [
        "Büyük yemek rezervasyonları",
        "Düğün & özel organizasyon",
        "Eğlence & etkinlik",
      ],
      m2Min: M2_RANGES.restoran.min,
      m2Max: M2_RANGES.restoran.max,
      itemSayisi: 110,
      zorunluSayisi: 110,
    },
    {
      konsept: "kokteyl-kahve",
      label: KONSEPT_LABELS["kokteyl-kahve"],
      ornekler: ["No Fish Today", "Kokteyl & espresso bar"],
      m2Min: M2_RANGES["kokteyl-kahve"].min,
      m2Max: M2_RANGES["kokteyl-kahve"].max,
      itemSayisi: 18,
      zorunluSayisi: 18,
    },
    {
      konsept: "kahve-atolyesi",
      label: KONSEPT_LABELS["kahve-atolyesi"],
      ornekler: [
        "Kahve Atölyesi markası",
        "Kahve + kahvaltı & brunch",
        "Espresso & hafif yemek",
      ],
      m2Min: M2_RANGES["kahve-atolyesi"].min,
      m2Max: M2_RANGES["kahve-atolyesi"].max,
      itemSayisi: 47,
      zorunluSayisi: 47,
    },
    {
      konsept: "harvest-cafe",
      label: KONSEPT_LABELS["harvest-cafe"],
      ornekler: [
        "Harvest Cafe Bahçeşehir",
        "A la carte menü",
        "Tatlı & kahve ağırlıklı cafe",
      ],
      m2Min: M2_RANGES["harvest-cafe"].min,
      m2Max: M2_RANGES["harvest-cafe"].max,
      itemSayisi: 44,
      zorunluSayisi: 44,
    },
    {
      konsept: "all-sport-cafe",
      label: KONSEPT_LABELS["all-sport-cafe"],
      ornekler: [
        "All Sport Cafe",
        "All day cafe",
        "Gün boyu kahve & sıcak yemek",
      ],
      m2Min: M2_RANGES["all-sport-cafe"].min,
      m2Max: M2_RANGES["all-sport-cafe"].max,
      itemSayisi: 32,
      zorunluSayisi: 32,
    },
    {
      konsept: "casual-cafe",
      label: KONSEPT_LABELS["casual-cafe"],
      ornekler: [
        "Şifa Cafe Beykent",
        "Servis mutfağı & teşhir",
        "Casual cafe · pasta & simit",
      ],
      m2Min: M2_RANGES["casual-cafe"].min,
      m2Max: M2_RANGES["casual-cafe"].max,
      itemSayisi: 49,
      zorunluSayisi: 49,
    },
    {
      konsept: "kahve-duragi",
      label: KONSEPT_LABELS["kahve-duragi"],
      ornekler: [
        "Kahve Durağı Konyaaltı",
        "Espresso & tatlı teşhir",
        "Kahvaltı & hafif sıcak mutfak",
      ],
      m2Min: M2_RANGES["kahve-duragi"].min,
      m2Max: M2_RANGES["kahve-duragi"].max,
      itemSayisi: 51,
      zorunluSayisi: 51,
    },
    {
      konsept: "kahve-duragi-pastane",
      label: KONSEPT_LABELS["kahve-duragi-pastane"],
      ornekler: [
        "Kahve Durağı Sultangazi",
        "Pastane + kahvaltı",
        "Hafif sıcak yemek",
      ],
      m2Min: M2_RANGES["kahve-duragi-pastane"].min,
      m2Max: M2_RANGES["kahve-duragi-pastane"].max,
      itemSayisi: 43,
      zorunluSayisi: 43,
    },
    {
      konsept: "kahve-tatli",
      label: KONSEPT_LABELS["kahve-tatli"],
      ornekler: [
        "Hacıbozan Çemberlitaş",
        "Kahve bar + pasta teşhir",
        "Alt kat üretim mutfağı",
      ],
      m2Min: M2_RANGES["kahve-tatli"].min,
      m2Max: M2_RANGES["kahve-tatli"].max,
      itemSayisi: 34,
      zorunluSayisi: 34,
    },
    {
      konsept: "buyuk-yemekhane",
      label: KONSEPT_LABELS["buyuk-yemekhane"],
      ornekler: [
        "Yozgat Hastanesi referans",
        "Catering · fabrika · okul yemekhanesi",
        "2000–3500 kişi/gün",
      ],
      m2Min: M2_RANGES["buyuk-yemekhane"].min,
      m2Max: M2_RANGES["buyuk-yemekhane"].max,
      itemSayisi: 285,
      zorunluSayisi: 285,
    },
    {
      konsept: "resort-otel",
      label: KONSEPT_LABELS["resort-otel"],
      ornekler: [
        "Zigana Resort Alaçatı",
        "Üst kat restaurant + personel",
        "Boutique / resort F&B",
      ],
      m2Min: M2_RANGES["resort-otel"].min,
      m2Max: M2_RANGES["resort-otel"].max,
      itemSayisi: 64,
      zorunluSayisi: 64,
    },
    {
      konsept: "sehir-otel",
      label: KONSEPT_LABELS["sehir-otel"],
      ornekler: [
        "Hilton Kocaeli referans",
        "Ana mutfak · büfe · banquet",
        "Servis bar · personel mutfağı",
      ],
      m2Min: M2_RANGES["sehir-otel"].min,
      m2Max: M2_RANGES["sehir-otel"].max,
      itemSayisi: 186,
      zorunluSayisi: 186,
    },
    {
      konsept: "mus-selinoz-turk",
      label: KONSEPT_LABELS["mus-selinoz-turk"],
      ornekler: [
        "Muş Selinöz Mimarlık",
        "Bar + pasta teşhir",
        "Tam mutfak hatları",
      ],
      m2Min: M2_RANGES["mus-selinoz-turk"].min,
      m2Max: M2_RANGES["mus-selinoz-turk"].max,
      itemSayisi: 89,
      zorunluSayisi: 89,
    },
    {
      konsept: "kiremit-akasya",
      label: KONSEPT_LABELS["kiremit-akasya"],
      ornekler: [
        "Kiremit Akasya AVM",
        "Türk mutfağı self servis",
        "Food court",
      ],
      m2Min: M2_RANGES["kiremit-akasya"].min,
      m2Max: M2_RANGES["kiremit-akasya"].max,
      itemSayisi: 30,
      zorunluSayisi: 30,
    },
    {
      konsept: "kasap",
      label: KONSEPT_LABELS.kasap,
      ornekler: ["Yalnızca kasap", "Et teşhir", "Ortaklar Rota"],
      m2Min: M2_RANGES.kasap.min,
      m2Max: M2_RANGES.kasap.max,
      itemSayisi: 28,
      zorunluSayisi: 28,
    },
    {
      konsept: "kasap-sarkuteri",
      label: KONSEPT_LABELS["kasap-sarkuteri"],
      ornekler: [
        "Kasap + şarküteri",
        "Tam teşhir & hazırlık",
        "Ortaklar Rota",
      ],
      m2Min: M2_RANGES["kasap-sarkuteri"].min,
      m2Max: M2_RANGES["kasap-sarkuteri"].max,
      itemSayisi: 36,
      zorunluSayisi: 36,
    },
    {
      konsept: "sarkuteri-restoran",
      label: KONSEPT_LABELS["sarkuteri-restoran"],
      ornekler: [
        "Şarküteri restoran",
        "Teşhir + hazırlık mutfağı",
        "Ortaklar Rota",
      ],
      m2Min: M2_RANGES["sarkuteri-restoran"].min,
      m2Max: M2_RANGES["sarkuteri-restoran"].max,
      itemSayisi: 36,
      zorunluSayisi: 36,
    },
    {
      konsept: "inari-bar-yemek",
      label: KONSEPT_LABELS["inari-bar-yemek"],
      ornekler: [
        "Inari Restaurant",
        "Bar + yemek",
        "Kokteyl & mutfak",
      ],
      m2Min: M2_RANGES["inari-bar-yemek"].min,
      m2Max: M2_RANGES["inari-bar-yemek"].max,
      itemSayisi: 37,
      zorunluSayisi: 37,
    },
  ];
  return [...base.filter((t) => t.konsept !== "coffee-shop"), ...referansJson];
}

export function pfosGetKonseptler() {
  const templates = getAllTemplates();
  const base = templates.map((t) => ({
    slug: t.konsept,
    label: KONSEPT_LABELS[t.konsept as Konsept] ?? t.label,
    ornekler: t.ornekler,
    seatDensity: t.seatDensity,
    kalemSayisi: t.items.length,
  }));
  return [
    ...base.filter((t) => t.slug !== "coffee-shop"),
    {
      slug: "steakhouse",
      label: KONSEPT_LABELS.steakhouse,
      ornekler: ["Nusr-Et tarzı"],
      seatDensity: 1.8,
      kalemSayisi: 58,
    },
    {
      slug: "balikci",
      label: KONSEPT_LABELS.balikci,
      ornekler: ["Balık restoran"],
      seatDensity: 1.5,
      kalemSayisi: 47,
    },
    {
      slug: "coffee-shop",
      label: KONSEPT_LABELS["coffee-shop"],
      ornekler: ["Espressolab Watergarden", "Espressolab", "Gloria Jean's"],
      seatDensity: 1.5,
      kalemSayisi: 21,
    },
    {
      slug: "italyan",
      label: KONSEPT_LABELS.italyan,
      ornekler: ["Trattoria", "Osteria"],
      seatDensity: 1.6,
      kalemSayisi: 89,
    },
    {
      slug: "turk-restoran",
      label: KONSEPT_LABELS["turk-restoran"],
      ornekler: ["Sütiş Şişhane", "Türk lokanta", "Pide & bar"],
      seatDensity: 1.3,
      kalemSayisi: 77,
    },
    {
      slug: "all-day-dining-cafe",
      label: KONSEPT_LABELS["all-day-dining-cafe"],
      ornekler: ["The House Café", "Big Chefs"],
      seatDensity: 1.5,
      kalemSayisi: 89,
    },
    {
      slug: "birahane",
      label: KONSEPT_LABELS.birahane,
      ornekler: ["Mikro birahane", "Craft beer pub"],
      seatDensity: 1.5,
      kalemSayisi: 27,
    },
    {
      slug: "pastane",
      label: KONSEPT_LABELS.pastane,
      ornekler: ["Butik pastane", "Patisserie"],
      seatDensity: 1.4,
      kalemSayisi: 41,
    },
    {
      slug: "pizzaci",
      label: KONSEPT_LABELS.pizzaci,
      ornekler: ["Mialiento Avcılar", "Pizza Il Forno"],
      seatDensity: 1.5,
      kalemSayisi: 69,
    },
    {
      slug: "pideci",
      label: KONSEPT_LABELS.pideci,
      ornekler: ["Lahmacun & pide salonu", "Taş fırın pideci"],
      seatDensity: 1.5,
      kalemSayisi: 50,
    },
    {
      slug: "sushi",
      label: KONSEPT_LABELS.sushi,
      ornekler: ["Sushi bar", "Omakase"],
      seatDensity: 1.8,
      kalemSayisi: 27,
    },
    {
      slug: "sarkuteri-kiosk",
      label: KONSEPT_LABELS["sarkuteri-kiosk"],
      ornekler: ["Gurme şarküteri kiosk", "AVM şarküteri"],
      seatDensity: 0,
      kalemSayisi: 23,
    },
    {
      slug: "hamburger-kiosk",
      label: KONSEPT_LABELS["hamburger-kiosk"],
      ornekler: ["QSR burger kiosk", "AVM hamburger"],
      seatDensity: 0,
      kalemSayisi: 22,
    },
    {
      slug: "hotdog-kiosk",
      label: KONSEPT_LABELS["hotdog-kiosk"],
      ornekler: ["Sosisli kiosk", "AVM hot dog"],
      seatDensity: 0,
      kalemSayisi: 16,
    },
    {
      slug: "tavukcu",
      label: KONSEPT_LABELS.tavukcu,
      ornekler: ["Pilic çevirme", "Fried chicken salonu"],
      seatDensity: 1.6,
      kalemSayisi: 28,
    },
    {
      slug: "restoran",
      label: KONSEPT_LABELS.restoran,
      ornekler: [
        "Büyük yemek rezervasyonları",
        "Düğün & özel organizasyon",
        "Eğlence & etkinlik",
      ],
      seatDensity: 1.2,
      kalemSayisi: 110,
    },
    {
      slug: "kokteyl-kahve",
      label: KONSEPT_LABELS["kokteyl-kahve"],
      ornekler: ["No Fish Today", "Kokteyl & espresso bar"],
      seatDensity: 0,
      kalemSayisi: 18,
    },
    {
      slug: "kahve-atolyesi",
      label: KONSEPT_LABELS["kahve-atolyesi"],
      ornekler: [
        "Kahve Atölyesi markası",
        "Kahve + kahvaltı",
        "Espresso & hafif yemek",
      ],
      seatDensity: 1.4,
      kalemSayisi: 47,
    },
    {
      slug: "harvest-cafe",
      label: KONSEPT_LABELS["harvest-cafe"],
      ornekler: [
        "Harvest Cafe Bahçeşehir",
        "A la carte",
        "Tatlı & kahve",
      ],
      seatDensity: 1.5,
      kalemSayisi: 44,
    },
    {
      slug: "kahve-duragi",
      label: KONSEPT_LABELS["kahve-duragi"],
      ornekler: [
        "Kahve Durağı Konyaaltı",
        "Espresso & tatlı",
        "Kahvaltı & hafif sıcak mutfak",
      ],
      seatDensity: 1.6,
      kalemSayisi: 51,
    },
    {
      slug: "kahve-tatli",
      label: KONSEPT_LABELS["kahve-tatli"],
      ornekler: [
        "Hacıbozan Çemberlitaş",
        "Kahve + pasta",
        "Çift kat (satış + üretim)",
      ],
      seatDensity: 1.4,
      kalemSayisi: 34,
    },
    {
      slug: "kahve-duragi-pastane",
      label: KONSEPT_LABELS["kahve-duragi-pastane"],
      ornekler: [
        "Kahve Durağı Sultangazi",
        "Pastane teşhir + bar",
        "Kahvaltı mutfağı",
      ],
      seatDensity: 1.5,
      kalemSayisi: 43,
    },
    {
      slug: "all-sport-cafe",
      label: KONSEPT_LABELS["all-sport-cafe"],
      ornekler: ["All Sport Cafe", "All day cafe"],
      seatDensity: 1.5,
      kalemSayisi: 32,
    },
    {
      slug: "casual-cafe",
      label: KONSEPT_LABELS["casual-cafe"],
      ornekler: ["Şifa Cafe Beykent", "Casual cafe", "Servis mutfağı"],
      seatDensity: 1.5,
      kalemSayisi: 49,
    },
    {
      slug: "buyuk-yemekhane",
      label: KONSEPT_LABELS["buyuk-yemekhane"],
      ornekler: [
        "Yozgat Hastanesi",
        "Catering · fabrika · okul",
        "2000–3500 kişi/gün",
      ],
      seatDensity: 0,
      kalemSayisi: 285,
    },
    {
      slug: "guneli-pastane",
      label: KONSEPT_LABELS["guneli-pastane"],
      ornekler: [
        "Güneli Fırın",
        "Pastane + yerel",
        "Fırın üretim & satış",
      ],
      seatDensity: 1.3,
      kalemSayisi: 46,
    },
    {
      slug: "ekmek-kruvasan",
      // Not all konsept slugs are in the strict KONSEPT_LABELS union yet.
      label: (KONSEPT_LABELS as Record<string, string>)["ekmek-kruvasan"] || "Ekmek + Kruvasan",
      ornekler: [
        "Little Farm imalathane",
        "Ekmek + kruvasan üretim",
        "Fırın hattı + soğuk zincir",
      ],
      seatDensity: 0,
      kalemSayisi: 35,
    },
    {
      slug: "resort-otel",
      label: KONSEPT_LABELS["resort-otel"],
      ornekler: [
        "Zigana Resort Alaçatı",
        "Restaurant + personel mutfak",
        "Ölçekli resort otel",
      ],
      seatDensity: 0.8,
      kalemSayisi: 64,
    },
    {
      slug: "sehir-otel",
      label: KONSEPT_LABELS["sehir-otel"],
      ornekler: [
        "Hampton By Hilton Bolu",
        "Hilton Kocaeli",
        "Şehir/business otel F&B",
      ],
      seatDensity: 0.8,
      kalemSayisi: 186,
    },
    {
      slug: "mus-selinoz-turk",
      label: KONSEPT_LABELS["mus-selinoz-turk"],
      ornekler: [
        "Muş Selinöz 101",
        "Lokanta / bar + pasta",
        "Kiremit’ten ayrı liste",
      ],
      seatDensity: 1.6,
      kalemSayisi: 89,
    },
    {
      slug: "kiremit-akasya",
      label: KONSEPT_LABELS["kiremit-akasya"],
      ornekler: [
        "Türk Mutfağı",
        "Self Servis",
        "Food Court",
      ],
      seatDensity: 1.8,
      kalemSayisi: 30,
    },
    {
      slug: "kasap",
      label: KONSEPT_LABELS.kasap,
      ornekler: ["Yalnızca kasap", "Ortaklar Rota"],
      seatDensity: 0.3,
      kalemSayisi: 28,
    },
    {
      slug: "kasap-sarkuteri",
      label: KONSEPT_LABELS["kasap-sarkuteri"],
      ornekler: ["Kasap + şarküteri", "Ortaklar Rota"],
      seatDensity: 0.5,
      kalemSayisi: 36,
    },
    {
      slug: "sarkuteri-restoran",
      label: KONSEPT_LABELS["sarkuteri-restoran"],
      ornekler: ["Şarküteri restoran", "Ortaklar Rota"],
      seatDensity: 0.55,
      kalemSayisi: 36,
    },
    {
      slug: "inari-bar-yemek",
      label: KONSEPT_LABELS["inari-bar-yemek"],
      ornekler: ["Inari", "Bar + yemek", "Kokteyl & mutfak"],
      seatDensity: 1.6,
      kalemSayisi: 37,
    },
  ];
}

export async function pfosPostQuote(req: NextRequest) {
  try {
    const body = await req.json();
    const input = PFOSRequestSchema.parse(body);
    const shopTypes = await loadProjeAkisShopTypes();
    const shopType = findShopTypeForQuote(
      shopTypes,
      input.dukkanSecim ?? "",
      input.konsept,
      input.altTip,
    );
    const template = await resolveTemplateForQuote(
      input.konsept,
      input.m2,
      input.altTip,
      input.referansId,
      shopType,
    );
    const response = await calculateQuote(input, template);
    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: "Geçersiz istek", details: err.flatten() },
        { status: 400 },
      );
    }
    if (err instanceof Error && err.message.startsWith("Bilinmeyen konsept")) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("[PFOS quote]", err);
    const msg = err instanceof Error ? err.message : "Sunucu hatası";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function pfosPostCalculate(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 });
  }

  let pfosReq;
  try {
    pfosReq = PFOSRequestSchema.parse({
      ...body,
      konsept: String(body.konsept || "").trim(),
      m2: Number(body.m2),
      sehir: body.sehir != null ? String(body.sehir) : undefined,
      fiyatStratejisi: body.fiyatStratejisi ?? TEKLIF_DEFAULT_FIYAT_STRATEJISI,
    });
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi" }, { status: 400 });
  }

  const staticTpl = PFOS_CONCEPT_BY_SLUG[pfosReq.konsept];
  if (
    !staticTpl &&
    ![
      "steakhouse",
      "balikci",
      "italyan",
      "turk-restoran",
      "birahane",
      "pastane",
      "pizzaci",
      "pideci",
      "sushi",
      "sarkuteri-kiosk",
      "hamburger-kiosk",
      "hotdog-kiosk",
      "tavukcu",
      "all-day-dining-cafe",
      "restoran",
      "kokteyl-kahve",
      "kahve-atolyesi",
      "kahve-duragi",
      "kahve-tatli",
      "kahve-duragi-pastane",
      "harvest-cafe",
      "all-sport-cafe",
      "casual-cafe",
      "buyuk-yemekhane",
      "guneli-pastane",
      "ekmek-kruvasan",
      "resort-otel",
      "sehir-otel",
      "tatil-otel",
      "kiremit-akasya",
      "kasap",
      "kasap-sarkuteri",
      "sarkuteri-restoran",
      "inari-bar-yemek",
      "coffee-shop",
      "boyoz-pastane",
    ].includes(pfosReq.konsept)
  ) {
    return NextResponse.json(
      {
        error: "Bilinmeyen konsept",
        konseptler: [
          ...Object.keys(PFOS_CONCEPT_BY_SLUG),
          "steakhouse",
          "balikci",
          "italyan",
          "turk-restoran",
          "birahane",
          "pastane",
          "pizzaci",
          "pideci",
          "sushi",
          "sarkuteri-kiosk",
          "hamburger-kiosk",
          "hotdog-kiosk",
          "tavukcu",
          "all-day-dining-cafe",
          "restoran",
          "kokteyl-kahve",
          "kahve-atolyesi",
          "kahve-duragi",
          "kahve-tatli",
          "kahve-duragi-pastane",
          "harvest-cafe",
          "all-sport-cafe",
          "casual-cafe",
          "buyuk-yemekhane",
          "guneli-pastane",
          "ekmek-kruvasan",
          "resort-otel",
          "sehir-otel",
          "tatil-otel",
          "kiremit-akasya",
          "mus-selinoz-turk",
          "kasap",
          "kasap-sarkuteri",
          "sarkuteri-restoran",
          "inari-bar-yemek",
          "coffee-shop",
          "boyoz-pastane",
        ],
      },
      { status: 404 },
    );
  }

  try {
    const template = await resolveTemplateForQuote(
      pfosReq.konsept as Konsept,
      pfosReq.m2,
      pfosReq.altTip,
      pfosReq.referansId,
    );
    const data = await calculateQuote(pfosReq, template);
    return NextResponse.json({ success: true, data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Hesaplama hatası";
    console.error("[PFOS calculate]", e);
    return NextResponse.json({ error: msg }, { status: 503 });
  }
}
