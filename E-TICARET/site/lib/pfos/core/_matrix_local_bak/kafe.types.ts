/**
 * Kafe karar matrisi — İş tipi × Ölçek × Servis yoğunluğu
 */

import type { ConceptTemplateItem, TemplateItemTip, TemplateScale } from "../engine-types";
import type { KategoriKodu } from "../../schemas/pfos.schema";

export type KafeOlcek = "S1" | "S2" | "S3";
export type KafeYogunluk = "Y1" | "Y2" | "Y3";

export type KafeOlcekDef = {
  id: KafeOlcek;
  key: "kucuk" | "orta" | "buyuk";
  label: string;
  m2Min: number;
  m2Max: number;
  referansM2: number;
};

export type KafeYogunlukDef = {
  id: KafeYogunluk;
  key: "bar" | "hafif_mutfak" | "pastane";
  label: string;
  aciklama: string;
};

export type KafeReferansSeed = {
  listeDosya: string;
  eskiKonseptId: string;
  bantId?: string;
  proje?: string;
};

export type KafeMatrixCell = {
  id: string;
  olcek: KafeOlcek;
  yogunluk: KafeYogunluk;
  label: string;
  referansM2: number;
  referansSeed?: KafeReferansSeed;
  /** Boş hücre — komşu seed + kurallardan türetilir */
  interpolated?: boolean;
  interpolasyonKaynak?: string;
};

export type KafeSlotDef = {
  slotId: string;
  urunTipi: string;
  isim: string;
  kategoriKodu: KategoriKodu;
  altKategori: string;
  tip: TemplateItemTip;
  scale: TemplateScale;
  /** Hangi yoğunluklarda dahil (yoksa hepsi) */
  yogunluk?: KafeYogunluk[];
  /** Hangi yoğunluklarda hariç */
  yogunlukHaric?: KafeYogunluk[];
  notlar?: string;
  elektrikGucuKwHint?: number;
};

export type KafeMatrixDoc = {
  isTipi: "kafe";
  konsept: "kafe";
  label: string;
  olcek: KafeOlcekDef[];
  yogunluk: KafeYogunlukDef[];
  slotlar: KafeSlotDef[];
  hucreler: KafeMatrixCell[];
  legacyKonseptMap: Record<
    string,
    { olcek: KafeOlcek; yogunluk: KafeYogunluk; bantEsleme?: Record<string, { olcek: KafeOlcek; yogunluk: KafeYogunluk }> }
  >;
};

export type KafeMatrixResolveInput = {
  m2: number;
  olcek?: KafeOlcek;
  yogunluk?: KafeYogunluk;
};

export type KafeResolvedCell = KafeMatrixCell & {
  items: ConceptTemplateItem[];
};
