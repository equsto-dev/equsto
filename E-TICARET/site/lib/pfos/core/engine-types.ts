/**
 * PFOS konsept şablonları — tip tanımları (files (1).zip)
 */

export type PfosKategoriKodu = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "X";

export type TemplateItemTip = "zorunlu" | "tavsiye" | "opsiyonel";

export type OpsiyonelSebep =
  | "sef-tercihi"
  | "yatirimci-karari"
  | "mutfak-ihtiyaci"
  | string;

export type ScaleFixed = { type: "fixed"; adet: number };

export type ScaleThreshold = {
  type: "threshold";
  thresholds: { minM2: number; adet: number }[];
};

export type ScaleLinear = {
  type: "linear";
  perM2: number;
  min: number;
  max: number;
};

export type ScalePerSeat = {
  type: "per-seat";
  perSeat: number;
  min: number;
  max: number;
};

export type TemplateScale =
  | ScaleFixed
  | ScaleThreshold
  | ScaleLinear
  | ScalePerSeat;

export type ConceptTemplateItem = {
  kategoriKodu: PfosKategoriKodu;
  altKategori: string;
  urunTipi: string;
  isim: string;
  tip: TemplateItemTip;
  /** Espressolab proforma poz: A1, A4, A27 … */
  referansPoz?: string;
  opsiyonelSebep?: OpsiyonelSebep;
  scale: TemplateScale;
  elektrikGucuKwHint?: number;
  gazGucuKwHint?: number;
  minM2?: number;
  maxM2?: number;
  notlar?: string;
  /** Referans şablon satır sırası */
  sablonSira?: number;
  referansBolumSira?: number;
  referansBolumKey?: string;
};

export type ConceptTemplate = {
  konsept: string;
  label: string;
  ornekler: string[];
  segmentBasis: "m2" | "seat";
  seatDensity: number;
  /** referans = A1,A2… (Espressolab); kategori = A01,B01… */
  teklifPozModu?: "referans" | "kategori";
  /** Tek bölüm proformalar (coffee shop) */
  teklifBolum?: { no: string; baslik: string };
  /** coffee-shop referans profil id */
  referansId?: string;
  items: ConceptTemplateItem[];
};

export type EvaluatedTemplateItem = ConceptTemplateItem & {
  adet: number;
};

/** Downloads index.ts ile uyumlu alias */
export type RuleItem = ConceptTemplateItem;

/** m² + ölçek → adet */
export function calcAdet(
  scale: TemplateScale,
  m2: number,
  seatDensity: number,
): number {
  switch (scale.type) {
    case "fixed":
      return scale.adet;
    case "threshold": {
      const sorted = [...scale.thresholds].sort((a, b) => a.minM2 - b.minM2);
      let adet = sorted[0]?.adet ?? 1;
      for (const t of sorted) {
        if (m2 >= t.minM2) adet = t.adet;
      }
      return adet;
    }
    case "linear": {
      const raw = m2 / scale.perM2;
      const q = Math.ceil(raw) || scale.min;
      return Math.min(scale.max, Math.max(scale.min, q));
    }
    case "per-seat": {
      const seats = seatDensity > 0 ? m2 / seatDensity : m2;
      const q = Math.ceil(seats / scale.perSeat) || scale.min;
      return Math.min(scale.max, Math.max(scale.min, q));
    }
    default:
      return 1;
  }
}
