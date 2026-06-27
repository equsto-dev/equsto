import { dataRel, readJsonFile } from "@/lib/legacy-data";
import type { PfosEkipmanSatir } from "@/lib/pfos/kategoriler/types";
import type { PfosKategoriKodu } from "@/lib/pfos/core/engine-types";
import type { ReferansKalem, ReferansProfil } from "./referans-types";
import { inferUrunTipiFromReferansSatir } from "./infer-urun-tipi";
import { repairPfosDisplayText } from "@/lib/utf8/repair-turkish-fffd";
import { formatPfosDisplayTanim } from "../parse-upload/sanitize-tanim";
import { sanitizeDavlumbazOlcu } from "../teklif/davlumbaz-olcu";
import {
  displayBolumBaslik,
  kategoriFromBolumAd,
  kategoriFromUrunAd,
  referansBolumKey,
} from "./kategori-from-bolum";
import { yerIzgarasiTipFromOlcu } from "./yer-izgara-match";
import {
  filterKasapYalnizKalemler,
  olcekReferansKalemlerForM2,
  referansListeOlcekAtla,
} from "./referans-m2-olcek";

const REF_DIR = "pfos-referans";

export type M2BantId = "80-150" | "150-250";
export type ReferansListeId =
  | M2BantId
  | "mahalle"
  | "referans"
  | "150-250"
  | "150-400"
  | "200-350"
  | "250-350"
  | "250-500"
  | "350-500"
  | "350-600"
  | "800-1500"
  | "sutis-mersin"
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
  | "80-150"
  | "50-150"
  | "2000-3500"
  | "1500-2500"
  | "200-400"
  | "300-500"
  | "ikinciplan"
  | "500-2000"
  | "500-2000-kocaeli"
  | "500-2000-topkapi"
  | "500-2000-arnavutkoy"
  | "200-500"
  | "200-5000"
  | "2018-199"
  | "40-80";

/** Şehir oteli — 750 / 1000 m²'de tüm referans listeleri birleştirilir */
const SEHIR_OTEL_TUM_LISTELER: ReferansListeId[] = [
  "500-2000",
  "500-2000-kocaeli",
  "500-2000-topkapi",
  "500-2000-arnavutkoy",
];

export function pickSehirOtelListeIds(m2: number): ReferansListeId[] {
  if (m2 === 750 || m2 === 1000) return [...SEHIR_OTEL_TUM_LISTELER];
  return ["500-2000-arnavutkoy"];
}

export function pickM2Bant(m2: number): M2BantId {
  return m2 <= 150 ? "80-150" : "150-250";
}

/** Pizzacı: küçük salon 80–200, büyük 200–500 */
export function pickPizzaciListe(m2: number): "80-200" | "200-500" {
  return m2 <= 200 ? "80-200" : "200-500";
}

/** Restoran: <= 400 m² "200-500", > 400 m² "500-1000" */
export function pickRestoranListe(m2: number): "200-500" | "500-1000" {
  return m2 <= 400 ? "200-500" : "500-1000";
}

/** İtalyan: ≤180 m² → 03-italyan; 181–320 m² → 2018-199-3; daha büyük → Havelka */
export function pickItalyanListe(m2: number): "100-300" | "150-300" | "2018-199" {
  if (m2 <= 180) return "100-300";
  if (m2 <= 320) return "2018-199";
  return "150-300";
}

/** All day dining: ≤200 → Boyoz; 201–280 → 2018-199-3; 281–300 → House; 301–400 → THC */
export function pickAllDayDiningListe(
  m2: number,
): "100-200" | "150-300" | "200-400" | "2018-199" | null {
  if (m2 <= 200) return "100-200";
  if (m2 <= 280) return "2018-199";
  if (m2 <= 300) return "150-300";
  if (m2 <= 400) return "200-400";
  return null;
}

/** Pastane: ≤150 m² → 14-PASTANE (100–200); >150 → ekipman_listesi (150–250) */
export function pickPastaneListe(m2: number): "100-200" | "150-250" {
  return m2 <= 150 ? "100-200" : "150-250";
}

/** Kahve Durağı: kompakt Konyaaltı vs standart Karabük */
export function pickKahveDuragiListe(m2: number): "100-200" | "150-200" {
  return m2 < 150 ? "100-200" : "150-200";
}

/** Kebapçı: ≤200 → 80-200; ≤400 → 200-400 MEFTECH referans; >400 zone şablonu */
export function pickKebapOrtadoguListe(m2: number): "80-200" | "200-400" | "300-500" {
  if (m2 <= 200) return "80-200";
  if (m2 <= 400) return "200-400";
  return "300-500";
}

/** Balıkçı: mahalle alt tipi veya m² bandı */
export function pickBalikciListe(
  m2: number,
  altTip?: string | null,
): ReferansListeId {
  const t = String(altTip ?? "").toLowerCase();
  if (t.includes("mahalle")) return "mahalle";
  if (m2 >= 350) return "350-600";
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
  const bolumAdRaw = String(s.bolumAd ?? "")
    .split("\0")[0]
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i");
  const bolum = bolumAdRaw;
  const adNorm = String(s.ad ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i");
  const bolumKod = String(s.bolum ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/_/g, "-");
  const bolumBlob = `${bolumAdRaw} ${bolumKod}`.trim();
  if (
    bolumKod === "deepfreeze-depo" ||
    bolumKod === "deepfreeze_depo" ||
    /deepfreeze|deep\s*freeze/.test(bolumBlob)
  ) {
    if (/panel tip|soguk oda|soğuk oda/.test(adNorm) && !/istif raf/.test(adNorm)) {
      return "panel-derin-dondurucu-oda";
    }
  }
  if (
    /panel tip derin dondurucu|panel tipi derin dondurucu|panel tip dondurucu oda/.test(
      bolum,
    ) &&
    /panel tip|derin dondurucu|dondurucu oda/.test(adNorm) &&
    !/istif raf/.test(adNorm)
  ) {
    return "panel-derin-dondurucu-oda";
  }
  if (
    /panel tip soguk oda|panel tipi soguk oda/.test(bolum) &&
    !/deepfreeze|deep\s*freeze|derin\s*dondurucu/.test(bolumBlob) &&
    /panel tip|soguk oda/.test(adNorm) &&
    !/istif raf/.test(adNorm)
  ) {
    return "panel-soguk-oda";
  }

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
  if (typeof adet === "number" && adet > 0) {
    return Math.min(99, Math.round(adet));
  }
  if (typeof adet === "string" && adet !== "—") {
    const n = parseInt(adet.replace(/[^\d]/g, ""), 10);
    if (Number.isFinite(n) && n > 0) return Math.min(99, n);
  }
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

    const notParcalari: string[] = [];
    if (s.marka?.trim()) notParcalari.push(`Marka: ${s.marka.trim()}`);
    if (olcu) notParcalari.push(`Ölçü: ${olcu}`);
    if (s.mevcut) notParcalari.push("Müşteride mevcut — katalog referans fiyatı");

    return {
      referansPoz: s.poz,
      isim: formatPfosDisplayTanim(s.ad),
      urunTipi,
      kategoriKodu: kategoriFromReferansSatir(s),
      adet: adetSayi(s.adet),
      tip: "zorunlu" as const,
      notlar: notParcalari.length
        ? repairPfosDisplayText(notParcalari.join(" · "))
        : undefined,
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
  const dosyaKategori =
    kategoriId === "sarkuteri-restoran" ? "kasap-sarkuteri" : kategoriId;
  return readJsonFile<PfosReferansListeDosya>(
    dataRel(REF_DIR, `${dosyaKategori}-${listeId}.json`),
  );
}

export async function loadReferansProfil(
  kategoriId:
    | "steakhouse"
    | "balikci"
    | "coffee-shop"
    | "coffee-shop-yemek"
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
    | "kanatci-kebapci"
    | "patisserie-yemek"
    | "all-day-dining-cafe"
    | "restoran"
    | "kokteyl-kahve"
    | "kahve-atolyesi"
    | "harvest-cafe"
    | "all-sport-cafe"
    | "casual-cafe"
    | "buyuk-yemekhane"
    | "guneli-pastane"
    | "pastane-cafe"
    | "boyoz-pastane"
    | "ekmek-kruvasan"
    | "tatil-otel"
    | "donerci"
    | "personel-yemekhane"
    | "sehir-otel"
    | "kiremit-akasya"
    | "mus-selinoz-turk"
    | "kasap"
    | "kasap-sarkuteri"
    | "sarkuteri-restoran"
    | "inari-bar-yemek"
    | "kahve-duragi"
    | "kahve-tatli"
    | "kahve-duragi-pastane"
    | "resort-otel"
    | "turk-restoran"
    | "dunya-mutfagi"
    | "bulut-burger"
    | "bulut-ev-yemek"
    | "bulut-doner"
    | "bulut-kebap"
    | "bulut-manti"
    | "bulut-pastane-firin"
    | "bulut-pide"
    | "bulut-pizza"
    | "bulut-salata-sandvic"
    | "bulut-tavuk"
    | "bulut-balik"
    | "bulut-corbaci",
  m2: number,
  listeId?: ReferansListeId,
  altTip?: string | null,
): Promise<ReferansProfil> {
  if (kategoriId === "sehir-otel" && !listeId) {
    const listeIds = pickSehirOtelListeIds(m2);
    if (listeIds.length > 1) {
      const kalemler: ReferansKalem[] = [];
      const labels: string[] = [];
      const kaynaklar: string[] = [];
      for (const bid of listeIds) {
        const raw = await loadPfosReferansListe(kategoriId, bid);
        if (!raw?.kalemler?.length) continue;
        let k = ekipmanToReferansKalemler(
          raw.kalemler,
          `${kategoriId}-${bid}`,
        );
        if (raw.referansM2 > 0) {
          k = olcekReferansKalemlerForM2(k, m2, raw.referansM2);
        }
        kalemler.push(...k);
        labels.push(raw.label);
        if (raw.kaynakDosya) kaynaklar.push(raw.kaynakDosya);
      }
      if (!kalemler.length) {
        throw new Error(
          `sehir-otel birleşik liste boş (${m2} m²) — referans JSON dosyalarını kontrol edin.`,
        );
      }
      return {
        id: `sehir-otel-birlesik-${m2}`,
        label: `Şehir oteli — ${labels.length} referans (${m2} m²)`,
        referansM2: m2,
        kaynak: kaynaklar.join(" · "),
        kalemler,
      };
    }
  }

  const bantId =
    listeId ??
    (kategoriId === "coffee-shop"
      ? "ikinciplan"
      : kategoriId === "coffee-shop-yemek"
        ? "250-350"
      : kategoriId === "pizzaci"
        ? pickPizzaciListe(m2)
        : kategoriId === "boyoz-pastane"
          ? "100-250"
        : kategoriId === "ekmek-kruvasan"
          ? "150-400"
        : kategoriId === "tatil-otel"
          ? "800-1500"
        : kategoriId === "personel-yemekhane"
          ? "150-250"
        : kategoriId === "donerci"
          ? "350-500"
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
                      : kategoriId === "kanatci-kebapci"
                        ? "100-250"
                        : kategoriId === "patisserie-yemek"
                          ? "200-400"
                      : kategoriId === "italyan"
                        ? pickItalyanListe(m2)
                        : kategoriId === "all-day-dining-cafe"
                          ? pickAllDayDiningListe(m2) ?? "200-400"
                          : kategoriId === "dunya-mutfagi"
                            ? "2018-199"
                            : kategoriId === "restoran"
                            ? pickRestoranListe(m2)
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
                                        : kategoriId === "pastane-cafe"
                                          ? "300-500"
                                        : kategoriId === "sehir-otel"
                                          ? pickSehirOtelListeIds(m2)[0]
                                          : kategoriId === "resort-otel"
                                            ? "200-500"
                                          : kategoriId === "kiremit-akasya"
                                            ? "100-250"
                                            : kategoriId === "mus-selinoz-turk"
                                              ? "100-250"
                                              : kategoriId === "kasap" ||
                                                kategoriId === "kasap-sarkuteri" ||
                                                kategoriId === "sarkuteri-restoran"
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
          : kategoriId.startsWith("bulut-")
            ? "40-80"
          : kategoriId === "balikci"
        ? pickBalikciListe(m2, altTip)
        : pickM2Bant(m2));
  const raw = await loadPfosReferansListe(kategoriId, bantId);
  if (!raw?.kalemler?.length) {
    throw new Error(
      `${kategoriId} ${bantId} referans listesi yok — önce Kategoriler sekmesinden Excel yükleyin veya seed script çalıştırın.`,
    );
  }
  let kalemler = ekipmanToReferansKalemler(
    raw.kalemler,
    `${kategoriId}-${bantId}`,
  );
  if (kategoriId === "kasap") {
    kalemler = filterKasapYalnizKalemler(kalemler);
  }
  if (raw.referansM2 > 0 && !referansListeOlcekAtla(kategoriId)) {
    kalemler = olcekReferansKalemlerForM2(kalemler, m2, raw.referansM2);
  }
  return {
    id: `${kategoriId}-${bantId}`,
    label: raw.label,
    referansM2: raw.referansM2,
    kaynak: raw.kaynakDosya,
    kalemler,
  };
}
