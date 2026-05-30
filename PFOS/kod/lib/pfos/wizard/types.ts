import type { FiyatStratejisi, Konsept } from "@/lib/pfos/schemas/pfos.schema";

export type PfosLokasyon = "cadde" | "avm";

export type PfosAdres = {
  il: string;
  ilce: string;
  mahalle: string;
  cadde: string;
};

export type PfosWizardState = {
  adim: number;
  adres: PfosAdres;
  lokasyon: PfosLokasyon;
  konsept: Konsept | null;
  /** v14 proforma — Proje: satırı */
  projeAdi: string;
  /** v14 proforma — Müşteri: satırı */
  musteri: string;
  m2Toplam: number | string;
  /** zone_key → m² */
  bolumM2: Record<string, number | string>;
  fiyatStratejisi?: FiyatStratejisi;
};

export type KonseptMeta = {
  konsept: string;
  label: string;
  ornekler: string[];
  m2Min: number;
  m2Max: number;
  itemSayisi?: number;
  zorunluSayisi: number;
};

export const PFOS_WIZARD_ADIMLAR = [
  { key: "adres", label: "Adres" },
  { key: "konsept", label: "Konsept" },
  { key: "alan", label: "Alan & bölümler" },
  { key: "teklif", label: "Teklif" },
] as const;

export function adresOzeti(a: PfosAdres): string {
  const p = [a.mahalle, a.cadde, a.ilce, a.il].filter(Boolean);
  return p.length ? p.join(", ") : a.il || "—";
}

export function parseM2(v: number | string): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
}
