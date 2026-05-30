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

/** Espressolab A1, A4, A27 → sıra numarası */
export function referansPozSira(poz: string): number {
  const m = String(poz || "").trim().match(/^[A-Z]+(\d+)$/i);
  return m ? parseInt(m[1], 10) : 9999;
}

export function sortKalemlerForTeklif(a: PFOSKalemi, b: PFOSKalemi): number {
  if (a.referansPoz && b.referansPoz) {
    const sa = a.sablonSira ?? referansPozSira(a.referansPoz);
    const sb = b.sablonSira ?? referansPozSira(b.referansPoz);
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

export function bolumForKalem(
  k: PFOSKalemi,
  layout?: TeklifLayoutMeta,
): { bolumNo: string; bolumBaslik: string } {
  if (layout?.bolum) {
    return { bolumNo: layout.bolum.no, bolumBaslik: layout.bolum.baslik };
  }
  return {
    bolumNo: bolumNoFromKategori(k.kategoriKodu),
    bolumBaslik: bolumBaslikFromKategori(k.kategoriKodu),
  };
}
