import { readJsonFile } from "@/lib/legacy-data";
import type { PfosEkipmanSatir } from "@/lib/pfos/kategoriler/types";
import type { PfosKategoriKodu } from "@/lib/pfos/core/engine-types";
import type { ReferansKalem, ReferansProfil } from "./referans-types";
import { inferUrunTipiFromReferansSatir } from "./infer-urun-tipi";
import { repairPfosDisplayText } from "@/lib/utf8/repair-turkish-fffd";

const REF_DIR = () =>
  `${process.cwd()}/public/data/pfos-referans`;

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

/** Excel referans: poz 001/005 değil bolum + ürün adı → PFOS A–H */
export function kategoriFromReferansSatir(s: PfosEkipmanSatir): PfosKategoriKodu {
  const urun = String(s.ad || "")
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const bolumAd = String(s.bolumAd || "")
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const hay = `${bolumAd} ${urun}`;

  if (
    /bulasik|yikama|giyotin|bym |on yikama|cop siyirma|bardak yik|kurutma makin|yag tutucu|basket rafi|kepce aski|on yikama/.test(
      hay,
    )
  ) {
    return "H";
  }
  if (/istif raf|tel raf|kuru depo|malzeme dolab|kazan/.test(hay) && !/bulasik|yikama/.test(hay)) {
    return "G";
  }
  if (/servis bar|espresso|kahve mak|kokteyl|bar blender|milk frother/.test(hay)) {
    return "A";
  }
  if (/pastane|pasta firin|hamur|konveksiyon.*pasta|mikser.*hamur/.test(hay)) {
    return "D";
  }
  if (/sebze|et hazirlik|kiyma|testere|0\s*c\s*oda|soguk oda/.test(hay)) {
    return "C";
  }
  if (/soguk|buzdolab|derin donduruc|buz makin|teshir/.test(hay) && !/sicak/.test(hay)) {
    return "E";
  }
  if (
    /sicak mutfak|izgara|firin|ocak|kuzine|fritez|salamander|davlumbaz|buharli firin/.test(
      hay,
    )
  ) {
    return "B";
  }

  const bolum = String(s.bolum || "")
    .trim()
    .toUpperCase();
  const BOLUM: Record<string, PfosKategoriKodu> = {
    A: "B",
    B: "C",
    C: "B",
    D: "H",
    E: "C",
    G: "C",
    S: "A",
  };
  if (BOLUM[bolum]) return BOLUM[bolum];

  const pozC = s.poz.trim().charAt(0).toUpperCase();
  if ("ABCDEFGH".includes(pozC)) return pozC as PfosKategoriKodu;
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
    isim: repairPfosDisplayText(s.ad),
    urunTipi: urunTipiFromSatir(s),
    kategoriKodu: kategoriFromReferansSatir(s),
    adet: adetSayi(s.adet),
    tip: "zorunlu" as const,
    notlar:
      s.olcu && s.olcu !== "—"
        ? repairPfosDisplayText(`Ölçü: ${s.olcu}`)
        : undefined,
    altKategori: repairPfosDisplayText(s.bolum || s.bolumAd || undefined),
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
    kalemler: ekipmanToReferansKalemler(raw.kalemler),
  };
}
