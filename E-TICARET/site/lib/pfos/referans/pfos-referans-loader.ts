import { dataRel, readJsonFile } from "@/lib/legacy-data";
import type { PfosEkipmanSatir } from "@/lib/pfos/kategoriler/types";
import type { PfosKategoriKodu } from "@/lib/pfos/core/engine-types";
import type { ReferansKalem, ReferansProfil } from "./referans-types";
import { inferUrunTipiFromReferansSatir } from "./infer-urun-tipi";
import { repairPfosDisplayText } from "@/lib/utf8/repair-turkish-fffd";
import { sanitizeDavlumbazOlcu } from "../teklif/davlumbaz-olcu";
import {
  displayBolumBaslik,
  kategoriFromBolumAd,
  kategoriFromUrunAd,
  referansBolumKey,
} from "./kategori-from-bolum";
import { yerIzgarasiTipFromOlcu } from "./yer-izgara-match";

const REF_DIR = "pfos-referans";

export type M2BantId = "80-150" | "150-250";
export type ReferansListeId =
  | M2BantId
  | "mahalle"
  | "referans"
  | "100-300"
  | "100-200"
  | "150-200"
  | "100-250"
  | "80-200"
  | "200-500"
  | "40-100"
  | "kiosk"
  | "60-100"
  | "150-300"
  | "500-1000"
  | "30-50"
  | "150-250"
  | "80-150"
  | "50-150"
  | "2000-3500"
  | "200-400"
  | "500-2000"
  | "500-2000-kocaeli"
  | "500-2000-topkapi"
  | "200-500"
  | "200-5000";

export function pickM2Bant(m2: number): M2BantId {
  return m2 <= 150 ? "80-150" : "150-250";
}

/** Pizzacı: küçük salon 80–200, büyük 200–500 */
export function pickPizzaciListe(m2: number): "80-200" | "200-500" {
  return m2 <= 200 ? "80-200" : "200-500";
}

/** İtalyan: ≤150 m² → 03-italyan (100–300); >150 → The House (150–300) */
export function pickItalyanListe(m2: number): "100-300" | "150-300" {
  return m2 <= 150 ? "100-300" : "150-300";
}

/** All day dining: 150–300 m² referans JSON (The House); >300 → gömülü THC listeleri */
export function pickAllDayDiningListe(m2: number): "150-300" | null {
  return m2 >= 150 && m2 <= 300 ? "150-300" : null;
}

/** Pastane: ≤150 m² → 14-PASTANE (100–200); >150 → ekipman_listesi (150–250) */
export function pickPastaneListe(m2: number): "100-200" | "150-250" {
  return m2 <= 150 ? "100-200" : "150-250";
}

/** Kahve Durağı: kompakt Konyaaltı vs standart Karabük */
export function pickKahveDuragiListe(m2: number): "100-200" | "150-200" {
  return m2 < 150 ? "100-200" : "150-200";
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

/**
 * Excel referans → PFOS A–H.
 * Öncelik: bolumAd (bölüm başlığı) → ürün adı (net tip) → G.
 * Poz harfleri (A12, D5) ve bolum tek harfi kategori için kullanılmaz.
 */
export function kategoriFromReferansSatir(s: PfosEkipmanSatir): PfosKategoriKodu {
  const fromBolum = kategoriFromBolumAd(s.bolumAd);
  if (fromBolum) return fromBolum;

  const fromUrun = kategoriFromUrunAd(s.ad);
  if (fromUrun) return fromUrun;

  return "G";
}

function urunTipiFromSatir(s: PfosEkipmanSatir): string {
  const n = String(s.ad ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i");
  if (/yer\s*izgar/.test(n) && s.olcu) {
    return yerIzgarasiTipFromOlcu(String(s.olcu));
  }
  return inferUrunTipiFromReferansSatir(s);
}

function adetSayi(adet: number | string): number {
  if (typeof adet === "number" && adet > 0) return Math.round(adet);
  return 1;
}

function pozBolumHarfi(poz: string): string {
  return String(poz ?? "")
    .trim()
    .match(/^([A-Z]+)/i)?.[1]
    ?.toUpperCase() ?? "";
}

function referansBolumKeyFromSatir(s: PfosEkipmanSatir): string {
  const fromExcel = referansBolumKey(s.bolum, s.bolumAd);
  if (fromExcel && fromExcel !== "?") return fromExcel;
  const harf = pozBolumHarfi(s.poz);
  return harf || "?";
}

function altKategoriFromSatir(s: PfosEkipmanSatir): string {
  const excel = displayBolumBaslik(s.bolumAd, s.bolum);
  if (excel && excel !== "—") return repairPfosDisplayText(excel);
  const harf = pozBolumHarfi(s.poz);
  return harf ? repairPfosDisplayText(`Bölüm ${harf}`) : "";
}

export function ekipmanToReferansKalemler(
  kalemler: PfosEkipmanSatir[],
  referansListeKey?: string,
): ReferansKalem[] {
  const bolumOrder = new Map<string, number>();
  let nextBolum = 0;

  return kalemler.map((s) => {
    const key = referansBolumKeyFromSatir(s);
    if (!bolumOrder.has(key)) bolumOrder.set(key, nextBolum++);

    const urunTipi = urunTipiFromSatir(s);
    const olcu =
      s.olcu && s.olcu !== "—"
        ? sanitizeDavlumbazOlcu(s.ad, s.olcu, urunTipi) ?? s.olcu
        : null;

    return {
      referansPoz: s.poz,
      isim: repairPfosDisplayText(s.ad),
      urunTipi,
      kategoriKodu: kategoriFromReferansSatir(s),
      adet: adetSayi(s.adet),
      tip: "zorunlu" as const,
      notlar: olcu ? repairPfosDisplayText(`Ölçü: ${olcu}`) : undefined,
      altKategori: altKategoriFromSatir(s),
      referansBolumKey: key,
      referansBolumSira: bolumOrder.get(key)!,
      referansListeKey,
    };
  });
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
  return readJsonFile<PfosReferansListeDosya>(
    dataRel(REF_DIR, `${kategoriId}-${listeId}.json`),
  );
}

export async function loadReferansProfil(
  kategoriId:
    | "steakhouse"
    | "balikci"
    | "coffee-shop"
    | "italyan"
    | "birahane"
    | "pastane"
    | "pizzaci"
    | "pideci"
    | "sushi"
    | "sarkuteri-kiosk"
    | "hamburger-kiosk"
    | "hotdog-kiosk"
    | "tavukcu"
    | "all-day-dining-cafe"
    | "restoran"
    | "kokteyl-kahve"
    | "kahve-atolyesi"
    | "harvest-cafe"
    | "all-sport-cafe"
    | "casual-cafe"
    | "buyuk-yemekhane"
    | "guneli-pastane"
    | "sehir-otel"
    | "kiremit-akasya"
    | "mus-selinoz-turk"
    | "kasap"
    | "kasap-sarkuteri"
    | "inari-bar-yemek"
    | "kahve-duragi"
    | "kahve-tatli"
    | "kahve-duragi-pastane"
    | "resort-otel"
    | "turk-restoran",
  m2: number,
  listeId?: ReferansListeId,
  altTip?: string | null,
): Promise<ReferansProfil> {
  const bantId =
    listeId ??
    (kategoriId === "coffee-shop"
      ? "referans"
      : kategoriId === "pizzaci"
        ? pickPizzaciListe(m2)
        : kategoriId === "pastane"
          ? pickPastaneListe(m2)
          : kategoriId === "pideci"
            ? "100-250"
            : kategoriId === "sushi"
              ? "40-100"
              : kategoriId === "sarkuteri-kiosk"
                ? "kiosk"
                : kategoriId === "hamburger-kiosk"
                  ? "60-100"
                  : kategoriId === "hotdog-kiosk"
                    ? "kiosk"
                    : kategoriId === "tavukcu"
                      ? "80-150"
                      : kategoriId === "italyan"
                        ? pickItalyanListe(m2)
                        : kategoriId === "all-day-dining-cafe"
                          ? pickAllDayDiningListe(m2) ?? "150-300"
                          : kategoriId === "restoran"
                            ? "500-1000"
                            : kategoriId === "kokteyl-kahve"
                              ? "30-50"
                              : kategoriId === "kahve-atolyesi"
                                ? "80-150"
                                : kategoriId === "harvest-cafe"
                                  ? "100-200"
                                  : kategoriId === "all-sport-cafe"
                                    ? "100-200"
                                    : kategoriId === "casual-cafe"
                                      ? "50-150"
                                      : kategoriId === "buyuk-yemekhane"
                                      ? "2000-3500"
                                      : kategoriId === "guneli-pastane"
                                        ? "200-400"
                                        : kategoriId === "sehir-otel"
                                          ? "500-2000"
                                          : kategoriId === "resort-otel"
                                            ? "200-500"
                                          : kategoriId === "kiremit-akasya"
                                            ? "100-250"
                                            : kategoriId === "mus-selinoz-turk"
                                              ? "100-250"
                                              : kategoriId === "kasap" ||
                                                kategoriId === "kasap-sarkuteri"
                                              ? "100-250"
                                              : kategoriId === "inari-bar-yemek"
                                                ? "100-200"
                                                : kategoriId === "kahve-duragi"
                                                  ? pickKahveDuragiListe(m2)
                                                  : kategoriId === "kahve-tatli"
                                                    ? "40-100"
                                                    : kategoriId === "kahve-duragi-pastane"
                                                      ? "100-200"
          : kategoriId === "birahane"
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
    kalemler: ekipmanToReferansKalemler(raw.kalemler, `${kategoriId}-${bantId}`),
  };
}
