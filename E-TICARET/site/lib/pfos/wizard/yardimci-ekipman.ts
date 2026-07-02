/** Konsept / dükkan türüne göre opsiyonel yardımcı ekipman (pfos-wizard.js YARDIMCI ile uyumlu) */

import {
  normalizeTipSet,
  oncelikliYardimciEtiketler,
} from "@/lib/pfos/wizard/proje-oneri-kurallar";
import { yardimciLabelToTip } from "@/lib/pfos/wizard/yardimci-label-tip";
import { normalizeTipKodu } from "@/lib/pfos/core/tip-kodu";

const YARDIMCI_EKIPMAN: Record<string, readonly string[]> = {
  "Fine Dining": [
    "Gıda dilimleme makinası",
    "Vakum makinası",
    "Şarap dolabı",
    "Benmari (sos)",
    "Tartı (hassas)",
    "Salamander",
  ],
  Steakhouse: [
    "Dry-aged dolabı",
    "Et dilimleme makinası",
    "Vakum makinası",
    "Tartı seti",
    "Mutfak arabası",
  ],
  "Gurme Şarküteri": [
    "Soğutmalı teşhir vitrin",
    "Dilimleme makinası",
    "Vakum makinası",
    "Tartı seti",
    "Benmari (sos)",
    "Et kıyma (ilave)",
  ],
  "Şarküteri Restoran": [
    "Soğutmalı teşhir vitrin",
    "Dilimleme makinası",
    "Vakum makinası",
    "Tartı seti",
    "Benmari (sos)",
    "Masa servisi ekipmanı",
  ],
  Şarküteri: [
    "Soğutmalı teşhir vitrin",
    "Dilimleme makinası",
    "Vakum makinası",
    "Tartı seti",
    "Benmari (sos)",
    "Et kıyma (ilave)",
  ],
  "Balık Restaurant": [
    "Balık teşhir tezgahı",
    "Buz makinası (ilave)",
    "Vakum makinası",
    "Dilimleme makinası",
    "Tartı seti",
  ],
  Cafe: [
    "Kahve değirmeni (reserve)",
    "Su filtresi",
    "Bardak yıkayıcı",
    "Blender seti",
    "Termos seti",
    "Buz makinası",
  ],
  "Kafe-Kafeterya": [
    "Kahve değirmeni (reserve)",
    "Su filtresi",
    "Bardak yıkayıcı",
    "Blender seti",
    "Termos seti",
  ],
  "Coffee Shop": [
    "Kahve değirmeni (reserve)",
    "Bardak yıkayıcı",
    "Blender seti",
    "Buz makinası",
    "Teşhir vitrin",
    "Tartı (hassas)",
  ],
  "Coffee Shop + Yemek": [
    "Kahve değirmeni (reserve)",
    "Bardak yıkayıcı",
    "Blender seti",
    "Buz makinası (ilave)",
    "Salamander",
    "Benmari seti",
    "Vakum makinası",
  ],
  "Kahve Atölyesi": [
    "Kahve değirmeni (reserve)",
    "Su filtresi",
    "Bardak yıkayıcı",
    "Buz makinası",
    "Tartı (hassas)",
  ],
  "Casual Cafe": [
    "Kahve değirmeni (reserve)",
    "Bardak yıkayıcı",
    "Blender seti",
    "Buz makinası",
    "Teşhir vitrin",
  ],
  "Bulut Mutfak": [
    "Vakum makinası",
    "Termal çanta seti",
    "Gıda folyo makinası",
    "Tartı seti",
    "Mutfak arabası",
  ],
  Hotel: [
    "Isıtıcı arabalar (banket)",
    "Salata bar ekipmanları",
    "Tabak ısıtıcı",
    "Chafing dish seti",
    "Termos dispenserler",
  ],
  Bar: [
    "Buz kırıcı (ilave)",
    "Meyve sıkacağı",
    "Bardak yıkayıcı",
    "Speed rail",
    "Kokteyl seti",
  ],
  "Pastane & Patisserie": [
    "Hamur yoğurma (ilave)",
    "Dilimleme makinası",
    "Vakum makinası",
    "Tartı (hassas)",
    "Teşhir vitrin",
    "Buz makinası",
  ],
  "Pastane + Cafe": [
    "Kahve değirmeni (reserve)",
    "Spiral hamur yoğurma",
    "Planet mikser",
    "Soğuk teşhir vitrini",
    "Tartı (hassas)",
    "Buz makinası",
    "Bardak yıkayıcı",
    "Blender seti",
  ],
  Pastane: [
    "Spiral hamur yoğurma",
    "Hamur açma makinesi",
    "Planet mikser",
    "Soğuk teşhir vitrini",
    "Tartı (hassas)",
    "Teşhir vitrin",
  ],
  "Pastane & Yerel": [
    "Soğuk teşhir vitrini",
    "Spiral hamur yoğurma",
    "Tartı (hassas)",
    "Hamur açma makinesi",
    "Buz makinası",
    "Planet mikser",
  ],
  "Pastane Cafe (Boyoz)": [
    "Spiral hamur yoğurma",
    "Konveksiyon fırın (yedek)",
    "Soğuk teşhir vitrini",
    "Tartı (hassas)",
    "Teşhir vitrin",
    "Buz makinası",
  ],
  "Kahve Durağı — Pastane & Kahvaltı": [
    "Kahve değirmeni (reserve)",
    "Spiral hamur yoğurma",
    "Bardak yıkayıcı",
    "Teşhir vitrin",
    "Tartı (hassas)",
    "Buz makinası",
  ],
  Meyhane: [
    "Buz makinası (ilave)",
    "Meze hazırlık tezgahı",
    "Vakum makinası",
    "Benmari seti",
    "Tartı seti",
    "Servis arabası",
  ],
  Kebapçı: [
    "Döner motoru (yedek)",
    "Tartı seti",
    "Vakum makinası",
    "Mutfak arabası",
    "Salamander",
    "Izgara yedek seti",
  ],
  "Kanatçı-Kebapçı": [
    "Piliç çevirme makinesi (yedek)",
    "Tartı seti",
    "Vakum makinası",
    "Mutfak arabası",
    "Salamander",
    "Izgara yedek seti",
    "Fritöz (yedek)",
  ],
  "Patisserie + Yemek": [
    "Spiral hamur yoğurma",
    "Konveksiyon fırın (yedek)",
    "Soğuk teşhir vitrini",
    "Vakum makinası",
    "Tartı seti",
    "Planet mikser",
    "Buz makinası",
  ],
  Catering: [
    "Taşıma arabaları",
    "Thermobox seti",
    "Sarf malzeme rafı",
    "İstif rafı seti",
    "Çöp arabaları",
  ],
  Fastfood: [
    "Vakum makinası",
    "Fritöz (yedek)",
    "Tartı seti",
    "Mutfak arabası",
    "Salamander",
    "Buz makinası",
  ],
  Pizzacı: [
    "Spiral hamur yoğurma",
    "Hamur açma makinesi",
    "Pizza tepsisi & kürek seti",
    "Vakum makinası",
    "Tartı seti",
    "Buz makinası",
  ],
  Dönerci: [
    "Döner kesme makinesi",
    "Et dilimleme makinesi",
    "Vakum makinası",
    "Tartı seti",
    "Mutfak arabası",
    "Salamander",
  ],
  Restaurant: [
    "Gıda dilimleme makinası",
    "Vakum makinası",
    "Benmari (sos)",
    "Tartı seti",
    "Salamander",
    "Buz makinası",
  ],
  default: [
    "Gıda dilimleme makinası",
    "Vakum makinası",
    "Tartı seti",
    "Mutfak arabası",
    "Bıçak sterilizatörü",
  ],
};

/** pfos-wizard-branches.json legacyKonsept — üst segment → yardımcı havuzu */
const LEGACY_KONSEPT: Record<string, keyof typeof YARDIMCI_EKIPMAN> = {
  Restoran: "Restaurant",
  "Kafe / Coffee Shop": "Cafe",
  "Fast Food / QSR": "Fastfood",
  "Pastane & Fırın": "Pastane & Patisserie",
  "Bar & Lounge": "Bar",
  "Otel F&B": "Hotel",
  Catering: "Catering",
  "Bulut Mutfak": "Bulut Mutfak",
  "Üretim / Fabrika": "Catering",
};

export const PFOS_ELK_GAZ_SECENEKLERI = [
  "Doğalgaz bağlantısı mevcut",
  "Elektrik trifaze 380V mevcut",
  "LPG kullanılacak",
  "Hem doğalgaz hem trifaze mevcut",
] as const;

export type YardimciProjeGirdi = {
  dukkanTuru?: string;
  ustSegment?: string;
  konseptLabel?: string;
  /** Teklifte zaten olan tip_kodu / urunTipi listesi */
  mevcutTipKodlari?: string[];
  /** Eşleşmemiş zorunlu kalemlerin urunTipi listesi */
  eksikZorunluTipKodlari?: string[];
  /** Faz C — üyenin gezdiği tip_kodu listesi */
  gezilenTipKodlari?: string[];
  m2?: number;
  limit?: number;
};

function yardimciKey(
  dukkanTuru: string,
  ustSegment: string,
  konseptLabel = "",
): keyof typeof YARDIMCI_EKIPMAN {
  const candidates = [dukkanTuru, konseptLabel, ustSegment].map((s) => s.trim()).filter(Boolean);
  for (const c of candidates) {
    if (YARDIMCI_EKIPMAN[c]) return c;
  }
  const legacy = LEGACY_KONSEPT[ustSegment.trim()];
  if (legacy && YARDIMCI_EKIPMAN[legacy]) return legacy;
  return "default";
}

/** Konsept + teklif bağlamına göre yardımcı ekipman etiketleri (Faz B skorlama) */
export function yardimciEkipmanForProje(input: YardimciProjeGirdi): string[] {
  const dukkanTuru = String(input.dukkanTuru ?? "").trim();
  const ustSegment = String(input.ustSegment ?? "").trim();
  const konseptLabel = String(input.konseptLabel ?? "").trim();
  const limit = input.limit ?? 6;

  const key = yardimciKey(dukkanTuru, ustSegment, konseptLabel);
  const havuz = [...(YARDIMCI_EKIPMAN[key] ?? YARDIMCI_EKIPMAN.default)];

  const mevcut = normalizeTipSet(input.mevcutTipKodlari ?? []);
  const eksik = normalizeTipSet(input.eksikZorunluTipKodlari ?? []);
  const gezilen = normalizeTipSet(input.gezilenTipKodlari ?? []);
  const m2Raw = Number(input.m2);
  const m2 = Number.isFinite(m2Raw) && m2Raw > 0 ? m2Raw : undefined;

  return oncelikliYardimciEtiketler(
    havuz,
    {
      mevcutTipKodlari: mevcut,
      eksikZorunluTipKodlari: eksik,
      m2,
      gezilenTipKodlari: gezilenKonseptIci(gezilen, havuz),
      konseptTipKodlari: konseptTipSetFromHavuz(havuz),
    },
    limit,
  );
}

function konseptTipSetFromHavuz(havuz: readonly string[]): Set<string> {
  const tips = new Set<string>();
  for (const label of havuz) {
    const tip = yardimciLabelToTip(label);
    if (tip) tips.add(normalizeTipKodu(tip));
  }
  return tips;
}

/** Üye geçmişi — yalnızca konsept havuzundaki tipler skorlamaya girer */
function gezilenKonseptIci(gezilen: Set<string>, havuz: readonly string[]): Set<string> {
  const izinli = konseptTipSetFromHavuz(havuz);
  const filtered = new Set<string>();
  for (const tip of gezilen) {
    if (izinli.has(tip)) filtered.add(tip);
  }
  return filtered;
}

/** Konsept havuzundaki izinli tip_kodu kümesi (Faz C filtre) */
export function yardimciKonseptTipSet(input: YardimciProjeGirdi): Set<string> {
  const dukkanTuru = String(input.dukkanTuru ?? "").trim();
  const ustSegment = String(input.ustSegment ?? "").trim();
  const konseptLabel = String(input.konseptLabel ?? "").trim();
  const key = yardimciKey(dukkanTuru, ustSegment, konseptLabel);
  const havuz = YARDIMCI_EKIPMAN[key] ?? YARDIMCI_EKIPMAN.default;
  return konseptTipSetFromHavuz(havuz);
}

/** @deprecated yardimciEkipmanForProje kullanın */
export function yardimciEkipmanForKonsept(
  dukkanTuru: string,
  ustSegment = "",
): string[] {
  return yardimciEkipmanForProje({ dukkanTuru, ustSegment, limit: 6 });
}
