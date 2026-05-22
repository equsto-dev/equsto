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
  opsiyonelSebep?: OpsiyonelSebep;
  scale: TemplateScale;
  elektrikGucuKwHint?: number;
  gazGucuKwHint?: number;
  minM2?: number;
  maxM2?: number;
  notlar?: string;
};

export type ConceptTemplate = {
  konsept: string;
  label: string;
  ornekler: string[];
  segmentBasis: "m2" | "seat";
  seatDensity: number;
  items: ConceptTemplateItem[];
};

export type EvaluatedTemplateItem = ConceptTemplateItem & {
  adet: number;
};
