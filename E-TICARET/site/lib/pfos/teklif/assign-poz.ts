import type { KategoriKodu, PFOSKalemi } from "@/lib/pfos/schemas/pfos.schema";
import { KATEGORI_LABELS } from "@/lib/pfos/schemas/pfos.schema";

export type TeklifPozModu = "referans" | "kategori";

export type TeklifLayoutMeta = {
  pozModu: TeklifPozModu;
  bolum?: { no: string; baslik: string };
};

/** v14 proforma — alan bölümü sırası (A→01, B→02, D→04 …) */
export const KATEGORI_SIRA: KategoriKodu[] = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "X",
];

export function kategoriSiraIndex(kat: KategoriKodu): number {
  const i = KATEGORI_SIRA.indexOf(kat);
  return i >= 0 ? i : 99;
}

export function bolumNoFromKategori(kat: KategoriKodu): string {
  return String(kategoriSiraIndex(kat) + 1).padStart(2, "0");
}

export function bolumBaslikFromKategori(kat: KategoriKodu): string {
  const label = KATEGORI_LABELS[kat] ?? kat;
  return `${bolumNoFromKategori(kat)}. ${label.toUpperCase()}`;
}

/** A12 → 12; 005 / 009 01 → sayısal sıra (poz harfi kategori için kullanılmaz) */
export function referansPozSira(poz: string): number {
  const p = String(poz || "").trim();
  const letterNum = p.match(/^[A-Z]+(\d+)/i);
  if (letterNum) return parseInt(letterNum[1], 10);
  const num = parseInt(p.replace(/\s.*/, ""), 10);
  return Number.isFinite(num) ? num : 9999;
}

function bolumSiraForKalem(k: PFOSKalemi): number {
  if (k.referansBolumSira != null) return k.referansBolumSira;
  return kategoriSiraIndex(k.kategoriKodu);
}

export function sortKalemlerForTeklif(a: PFOSKalemi, b: PFOSKalemi): number {
  const ba = bolumSiraForKalem(a);
  const bb = bolumSiraForKalem(b);
  if (ba !== bb) return ba - bb;

  if (a.referansPoz && b.referansPoz) {
    const sa = referansPozSira(a.referansPoz);
    const sb = referansPozSira(b.referansPoz);
    if (sa !== sb) return sa - sb;
  }
  const ka = kategoriSiraIndex(a.kategoriKodu);
  const kb = kategoriSiraIndex(b.kategoriKodu);
  if (ka !== kb) return ka - kb;
  const sa = a.sablonSira ?? 9999;
  const sb = b.sablonSira ?? 9999;
  if (sa !== sb) return sa - sb;
  return a.isim.localeCompare(b.isim, "tr");
}

/** Kategori modu: A01, B01 … */
export function assignPozNumbersKategori(kalemler: PFOSKalemi[]): PFOSKalemi[] {
  const sorted = [...kalemler].sort(sortKalemlerForTeklif);
  const counters: Partial<Record<KategoriKodu, number>> = {};

  return sorted.map((k) => {
    const cat = k.kategoriKodu;
    const next = (counters[cat] ?? 0) + 1;
    counters[cat] = next;
    return {
      ...k,
      poz: `${cat}${String(next).padStart(2, "0")}`,
    };
  });
}

/** Referans modu: şablon sırasına göre A1, A2, A3 … (A1A/A6A gibi revize kodları teklife yansımaz) */
export function assignPozNumbersReferans(kalemler: PFOSKalemi[]): PFOSKalemi[] {
  return [...kalemler].sort(sortKalemlerForTeklif).map((k, i) => ({
    ...k,
    poz: `A${i + 1}`,
  }));
}

export function finalizeKalemlerForTeklif(
  kalemler: PFOSKalemi[],
  layout?: TeklifLayoutMeta,
): PFOSKalemi[] {
  const referansMode =
    layout?.pozModu === "referans" ||
    (kalemler.length > 0 && kalemler.every((k) => !!k.referansPoz));

  if (referansMode) return assignPozNumbersReferans(kalemler);
  return assignPozNumbersKategori(kalemler);
}

function excelBolumBaslik(k: PFOSKalemi): string | null {
  const excelBolum = String(k.altKategori ?? "").trim();
  if (excelBolum.length > 1 && !/^[A-H]$/i.test(excelBolum)) {
    return excelBolum.replace(/\s+/g, " ").toUpperCase();
  }
  return null;
}

export function bolumForKalem(
  k: PFOSKalemi,
  layout?: TeklifLayoutMeta,
): { bolumNo: string; bolumBaslik: string } {
  const excel = excelBolumBaslik(k);
  if (excel) {
    const sira = bolumSiraForKalem(k);
    return {
      bolumNo: String(sira + 1).padStart(2, "0"),
      bolumBaslik: excel,
    };
  }
  if (layout?.bolum) {
    return { bolumNo: layout.bolum.no, bolumBaslik: layout.bolum.baslik };
  }
  return {
    bolumNo: bolumNoFromKategori(k.kategoriKodu),
    bolumBaslik: bolumBaslikFromKategori(k.kategoriKodu),
  };
}
