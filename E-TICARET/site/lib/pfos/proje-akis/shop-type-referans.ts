import { dataRel, readJsonFile } from "@/lib/legacy-data";
import type { ConceptTemplate } from "@/lib/pfos/core/engine-types";
import { referansKalemlerToTemplateItems } from "@/lib/pfos/referans/build-template-items";
import {
  ekipmanToReferansKalemler,
  pickAllDayDiningListe,
  pickBalikciListe,
  pickItalyanListe,
  pickKahveDuragiListe,
  pickM2Bant,
  pickPastaneListe,
  pickPizzaciListe,
  type PfosReferansListeDosya,
  type ReferansListeId,
} from "@/lib/pfos/referans/pfos-referans-loader";
import { olcekReferansKalemlerForM2 } from "@/lib/pfos/referans/referans-m2-olcek";
import type { ListeBantId, M2BantTanim, ShopTypeKayit } from "./konsept-tanimlari";

export type ReferansBaglam = {
  shopTypeId: string;
  shopTypeName: string;
  dukkanSecim: string;
  motorSlug: string;
  bant: M2BantTanim;
  listeDosya: string;
  kaynakDosya?: string;
  referansM2: number;
  kalemSayisi: number;
  planPdf?: string;
  bantKurali: string;
  listeYolu?: string;
  kalemlerOzet: { poz: string; ad: string }[];
};

function legacyListeId(
  motorSlug: string,
  m2: number,
  altTip?: string | null,
): ReferansListeId | null {
  switch (motorSlug) {
    case "steakhouse":
      return pickM2Bant(m2);
    case "balikci":
      return pickBalikciListe(m2, altTip);
    case "pizzaci":
      return pickPizzaciListe(m2);
    case "italyan":
      return pickItalyanListe(m2);
    case "pastane":
      return pickPastaneListe(m2);
    case "kahve-duragi":
      return pickKahveDuragiListe(m2);
    case "all-day-dining-cafe":
      return pickAllDayDiningListe(m2) ?? "150-300";
    case "coffee-shop":
      return "referans";
    default:
      return null;
  }
}

/** shopTypes bant kuralları — m² / alt tip ile kayıtlı liste dosyasını seç */
export function pickShopTypeBant(
  shopType: ShopTypeKayit,
  m2: number,
  altTip?: string | null,
): M2BantTanim | null {
  const bantlar = shopType.pfos.bantlar;
  if (!bantlar.length) return null;

  const alt = String(altTip ?? "").toLowerCase();
  if (alt.includes("mahalle")) {
    const mahalle = bantlar.find((b) => b.id === "mahalle");
    if (mahalle) return mahalle;
  }

  const slug = shopType.pfos.motorSlug;
  const legacy = slug ? legacyListeId(slug, m2, altTip) : null;
  if (legacy) {
    const hit = bantlar.find((b) => b.id === legacy);
    if (hit) return hit;
  }

  if (bantlar.length === 1) return bantlar[0]!;

  const inRange = bantlar.filter((b) => {
    const m = String(b.id).match(/^(\d+)-(\d+)$/);
    if (!m) return false;
    const lo = Number(m[1]);
    const hi = Number(m[2]);
    return m2 >= lo && m2 <= hi;
  });
  if (inRange.length === 1) return inRange[0]!;
  if (inRange.length > 1) {
    return inRange.reduce((a, b) =>
      Math.abs(a.referansM2 - m2) < Math.abs(b.referansM2 - m2) ? a : b,
    );
  }

  return bantlar.reduce((a, b) =>
    Math.abs(a.referansM2 - m2) < Math.abs(b.referansM2 - m2) ? a : b,
  );
}

function resolveListeRel(listeDosya: string): string | null {
  const dosya = listeDosya.trim();
  if (!dosya) return null;

  if (dosya.startsWith("pfos-referans/")) {
    return dataRel("pfos-referans", dosya.slice("pfos-referans/".length));
  }
  if (dosya.startsWith("lib/pfos/data/")) {
    return dataRel(dosya.slice("lib/pfos/data/".length));
  }
  if (dosya.endsWith(".json") && !dosya.includes("/")) {
    return dataRel("pfos-referans", dosya);
  }
  if (dosya.includes("/")) {
    return dataRel(dosya);
  }
  return dataRel("pfos-referans", dosya);
}

export async function loadReferansListeFromBant(
  bant: M2BantTanim,
): Promise<PfosReferansListeDosya | null> {
  const rel = resolveListeRel(bant.listeDosya);
  if (!rel) return null;
  return readJsonFile<PfosReferansListeDosya>(rel);
}

/** Dükkan türü + m² → kayıtlı referans JSON (uydurma yok) */
export async function resolveReferansBaglam(
  shopType: ShopTypeKayit,
  m2: number,
  altTip?: string | null,
): Promise<ReferansBaglam | null> {
  if (shopType.pfos.teklifKaynagi === "planlanan") return null;
  if (!shopType.pfos.bantlar.length) return null;

  const bant = pickShopTypeBant(shopType, m2, altTip);
  if (!bant) return null;

  const raw = await loadReferansListeFromBant(bant);
  if (!raw?.kalemler?.length) return null;

  return {
    shopTypeId: shopType.id,
    shopTypeName: shopType.name,
    dukkanSecim: shopType.pfos.dukkanSecim,
    motorSlug: shopType.pfos.motorSlug,
    bant,
    listeDosya: bant.listeDosya,
    kaynakDosya: raw.kaynakDosya,
    referansM2: raw.referansM2 || bant.referansM2,
    kalemSayisi: raw.kalemler.length,
    planPdf: shopType.pfos.planPdf,
    bantKurali: shopType.pfos.bantKurali,
    listeYolu: shopType.pfos.listeYolu,
    kalemlerOzet: raw.kalemler.slice(0, 12).map((k) => ({
      poz: String(k.poz ?? ""),
      ad: String(k.ad ?? ""),
    })),
  };
}

export async function buildTemplateFromShopType(
  shopType: ShopTypeKayit,
  m2: number,
  altTip?: string | null,
): Promise<ConceptTemplate | null> {
  const baglam = await resolveReferansBaglam(shopType, m2, altTip);
  if (!baglam) return null;

  const raw = await loadReferansListeFromBant(baglam.bant);
  if (!raw?.kalemler?.length) return null;

  const listeKey = `${raw.kategoriId}-${raw.bantId}`;
  let kalemler = ekipmanToReferansKalemler(raw.kalemler, listeKey);
  const refM2 = raw.referansM2 || baglam.referansM2;
  if (refM2 > 0) {
    kalemler = olcekReferansKalemlerForM2(kalemler, m2, refM2);
  }
  const slug = shopType.pfos.motorSlug || shopType.id;

  return {
    konsept: slug,
    label: shopType.name,
    ornekler: [],
    segmentBasis: "m2",
    seatDensity: 1.8,
    teklifPozModu: "referans",
    referansId: listeKey,
    items: referansKalemlerToTemplateItems(kalemler),
  };
}
