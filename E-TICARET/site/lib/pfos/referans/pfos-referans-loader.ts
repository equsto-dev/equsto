import { readJsonFile } from "@/lib/legacy-data";
import type { PfosEkipmanSatir } from "@/lib/pfos/kategoriler/types";
import type { PfosKategoriKodu } from "@/lib/pfos/core/engine-types";
import type { ReferansKalem, ReferansProfil } from "./referans-types";
import { inferUrunTipiFromReferansSatir } from "./infer-urun-tipi";

const REF_DIR = () =>
  `${process.cwd()}/public/data/pfos-referans`;

export type M2BantId = "80-150" | "150-250";
export type ReferansListeId = M2BantId | "mahalle" | "referans" | "100-300";

export function pickM2Bant(m2: number): M2BantId {
  return m2 <= 150 ? "80-150" : "150-250";
}

/** Balıkçı: mahalle alt tipi veya m² bandı */
export function pickBalikciListe(
  m2: number,
  altTip?: string | null,
): ReferansListeId {
  const t = String(altTip ?? "").toLowerCase();
  if (t.includes("mahalle")) return "mahalle";
  return pickM2Bant(m2);
}

function kategoriFromPoz(poz: string): PfosKategoriKodu {
  const c = poz.trim().charAt(0).toUpperCase();
  if ("ABCDEFGH".includes(c)) return c as PfosKategoriKodu;
  return "G";
}

function urunTipiFromSatir(s: PfosEkipmanSatir): string {
  return inferUrunTipiFromReferansSatir(s);
}

function adetSayi(adet: number | string): number {
  if (typeof adet === "number" && adet > 0) return Math.round(adet);
  return 1;
}

export function ekipmanToReferansKalemler(
  kalemler: PfosEkipmanSatir[],
): ReferansKalem[] {
  return kalemler.map((s) => ({
    referansPoz: s.poz,
    isim: s.ad,
    urunTipi: urunTipiFromSatir(s),
    kategoriKodu: kategoriFromPoz(s.poz),
    adet: adetSayi(s.adet),
    tip: "zorunlu" as const,
    notlar: s.olcu && s.olcu !== "—" ? `Ölçü: ${s.olcu}` : undefined,
    altKategori: s.bolum || s.bolumAd || undefined,
  }));
}

export type PfosReferansListeDosya = {
  kategoriId: string;
  bantId: string;
  label: string;
  referansM2: number;
  kaynakDosya?: string;
  kalemler: PfosEkipmanSatir[];
};

export async function loadPfosReferansListe(
  kategoriId: string,
  listeId: ReferansListeId,
): Promise<PfosReferansListeDosya | null> {
  const path = `${REF_DIR()}/${kategoriId}-${listeId}.json`;
  return readJsonFile<PfosReferansListeDosya>(path);
}

export async function loadReferansProfil(
  kategoriId: "steakhouse" | "balikci" | "coffee-shop" | "italyan",
  m2: number,
  listeId?: ReferansListeId,
  altTip?: string | null,
): Promise<ReferansProfil> {
  const bantId =
    listeId ??
    (kategoriId === "coffee-shop"
      ? "referans"
      : kategoriId === "italyan"
        ? "100-300"
      : kategoriId === "balikci"
        ? pickBalikciListe(m2, altTip)
        : pickM2Bant(m2));
  const raw = await loadPfosReferansListe(kategoriId, bantId);
  if (!raw?.kalemler?.length) {
    throw new Error(
      `${kategoriId} ${bantId} referans listesi yok — önce Kategoriler sekmesinden Excel yükleyin veya seed script çalıştırın.`,
    );
  }
  return {
    id: `${kategoriId}-${bantId}`,
    label: raw.label,
    referansM2: raw.referansM2,
    kaynak: raw.kaynakDosya,
    kalemler: ekipmanToReferansKalemler(raw.kalemler),
  };
}
