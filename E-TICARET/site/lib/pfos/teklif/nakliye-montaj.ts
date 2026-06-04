/**
 * Nakliye (İstanbul çıkış × km) + montaj (sahada m²/kalem).
 * Katsayılar: public/data/pfos-nakliye-formula.json
 * Km tablosu: public/data/pfos-sehir-km.json
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import type { PFOSKalemi } from "../schemas/pfos.schema";
import { resolveTipKodu } from "../core/tip-kodu";
import {
  effectiveNakliyeKm,
  kmFromIstanbul,
  normSehir,
} from "./nakliye-km";

export { normSehir } from "./nakliye-km";

export type NakliyeKmFormula = {
  taban_tl: number;
  km_birim_tl: number;
  min_km: number;
  agirlik_birim_tl: number;
};

export type MontajFormula = {
  satir_birim_tl: number;
  hacim_sqrt_katsayi: number;
  ekipman_oran: number;
  m2: Array<{ min_m2: number; tl: number }>;
};

export type NakliyeFormulaConfig = {
  version: number;
  kdv_dahil: boolean;
  cikis_sehir?: string;
  nakliye_km: NakliyeKmFormula;
  montaj: MontajFormula;
  cap: { min_tl: number; max_tl: number; ekipman_oran_max: number };
  heavy_kod?: Record<string, number>;
  heavy_keywords?: string[];
};

export type NakliyeSatirInput = {
  adet: number;
  kod?: string;
  ad?: string;
  sku?: string;
};

export type NakliyeMontajInput = {
  m2: number;
  sehir?: string | null;
  kalemler: NakliyeSatirInput[];
  /** Montaj hariç ekipman satırları toplamı (KDV dahil TL, katalog fiyat) */
  ekipmanToplamTl: number;
};

export type NakliyeMontajSonuc = {
  tutar: number;
  gecerli: boolean;
  bolge: string | null;
  bolge_katsayi: number;
  montaj_tl: number;
  nakliye_tl: number;
  km: number;
  not: string;
  detay: {
    nakliyeTaban: number;
    kmPayi: number;
    nakliyeAgirlik: number;
    montajM2: number;
    montajSatir: number;
    montajHacim: number;
    montajDeger: number;
    ham: number;
    capUygulandi: boolean;
  };
};

const DEFAULT_FORMULA: NakliyeFormulaConfig = {
  version: 2,
  kdv_dahil: true,
  cikis_sehir: "İstanbul",
  nakliye_km: {
    taban_tl: 1200,
    km_birim_tl: 32,
    min_km: 25,
    agirlik_birim_tl: 95,
  },
  montaj: {
    satir_birim_tl: 140,
    hacim_sqrt_katsayi: 45,
    ekipman_oran: 0.004,
    m2: [
      { min_m2: 200, tl: 5500 },
      { min_m2: 120, tl: 3800 },
      { min_m2: 80, tl: 2800 },
      { min_m2: 0, tl: 1800 },
    ],
  },
  cap: { min_tl: 3500, max_tl: 14000, ekipman_oran_max: 0.012 },
};

let formulaCache: NakliyeFormulaConfig | null = null;

function formulaPath(): string {
  return path.join(process.cwd(), "public/data/pfos-nakliye-formula.json");
}

function normalizeLoadedFormula(raw: Record<string, unknown>): NakliyeFormulaConfig {
  if (raw.nakliye_km && raw.montaj) {
    return { ...DEFAULT_FORMULA, ...raw } as NakliyeFormulaConfig;
  }
  const legacy = raw as {
    taban_tl?: { sehirici: number; diger: number };
    satir_birim_tl?: number;
    hacim_sqrt_katsayi?: number;
    ekipman_oran?: number;
    montaj_m2?: Array<{ min_m2: number; tl: number }>;
    cap?: NakliyeFormulaConfig["cap"];
  };
  return {
    ...DEFAULT_FORMULA,
    cap: legacy.cap ?? DEFAULT_FORMULA.cap,
    montaj: {
      satir_birim_tl: legacy.satir_birim_tl ?? 140,
      hacim_sqrt_katsayi: legacy.hacim_sqrt_katsayi ?? 45,
      ekipman_oran: legacy.ekipman_oran ?? 0.004,
      m2: legacy.montaj_m2 ?? DEFAULT_FORMULA.montaj.m2,
    },
  };
}

export async function loadNakliyeFormula(): Promise<NakliyeFormulaConfig> {
  if (formulaCache) return formulaCache;
  try {
    const raw = await readFile(formulaPath(), "utf8");
    formulaCache = normalizeLoadedFormula(JSON.parse(raw));
  } catch {
    formulaCache = DEFAULT_FORMULA;
  }
  return formulaCache;
}

export function bolgeForSehir(
  sehir: string | null | undefined,
  sehirBolge: Record<string, string>,
): string {
  const s = normSehir(sehir);
  if (!s) return "marmara";
  if (sehirBolge[s]) return sehirBolge[s];
  const low = s.toLocaleLowerCase("tr-TR");
  for (const key of Object.keys(sehirBolge)) {
    if (key.toLocaleLowerCase("tr-TR") === low) return sehirBolge[key];
  }
  return "icanadolu";
}

function montajTlForM2(
  m2: number,
  tiers: Array<{ min_m2: number; tl: number }>,
): number {
  const sorted = [...tiers].sort((a, b) => b.min_m2 - a.min_m2);
  for (const t of sorted) {
    if (m2 >= t.min_m2) return t.tl;
  }
  return sorted[sorted.length - 1]?.tl ?? 1800;
}

export function lineWeight(
  row: NakliyeSatirInput,
  formula: NakliyeFormulaConfig,
): number {
  const kod = row.kod || row.sku || "";
  if (formula.heavy_kod?.[kod]) return formula.heavy_kod[kod];
  const ad = String(row.ad || "").toLocaleLowerCase("tr-TR");
  for (const kw of formula.heavy_keywords ?? []) {
    if (ad.includes(kw.toLocaleLowerCase("tr-TR"))) return 1.8;
  }
  return 1;
}

export async function estimateNakliyeMontajTry(
  input: NakliyeMontajInput,
  formula: NakliyeFormulaConfig,
  kmTablo: number,
  kmGecerli: boolean,
): Promise<NakliyeMontajSonuc> {
  const m2 = Math.max(0, Number(input.m2) || 0);
  const ekipmanToplam = Math.max(0, Number(input.ekipmanToplamTl) || 0);
  const sehir = normSehir(input.sehir);
  const nk = formula.nakliye_km;
  const mj = formula.montaj;

  if (!sehir || !kmGecerli) {
    return {
      tutar: 0,
      gecerli: false,
      bolge: null,
      bolge_katsayi: 1,
      montaj_tl: 0,
      nakliye_tl: 0,
      km: 0,
      not: "Şehir seçilmedi veya km tablosunda yok",
      detay: {
        nakliyeTaban: 0,
        kmPayi: 0,
        nakliyeAgirlik: 0,
        montajM2: 0,
        montajSatir: 0,
        montajHacim: 0,
        montajDeger: 0,
        ham: 0,
        capUygulandi: false,
      },
    };
  }

  let agirlik = 0;
  for (const r of input.kalemler) {
    const a = Math.max(1, Math.round(Number(r.adet) || 1));
    agirlik += lineWeight(r, formula) * a;
  }

  const kmEff = effectiveNakliyeKm(kmTablo, nk.min_km);
  const nakliyeTaban = nk.taban_tl;
  const kmPayi = Math.round(kmEff * nk.km_birim_tl);
  const nakliyeAgirlik = Math.round(agirlik * nk.agirlik_birim_tl);
  const nakliyeTl = nakliyeTaban + kmPayi + nakliyeAgirlik;

  const montajM2 = montajTlForM2(m2, mj.m2);
  const montajSatir = Math.round(agirlik * mj.satir_birim_tl);
  const montajHacim = Math.round(
    Math.sqrt(Math.max(m2, 40)) * mj.hacim_sqrt_katsayi,
  );
  const montajDeger =
    ekipmanToplam > 0
      ? Math.round(ekipmanToplam * mj.ekipman_oran)
      : 0;
  const montajTl = montajM2 + montajSatir + montajHacim + montajDeger;

  let capUygulandi = false;
  const capMin = formula.cap.min_tl;
  const montajCap = Math.min(
    formula.cap.max_tl,
    ekipmanToplam > 0
      ? Math.round(ekipmanToplam * formula.cap.ekipman_oran_max)
      : formula.cap.max_tl,
  );
  let montajFinal = montajTl;
  if (montajFinal > montajCap) {
    montajFinal = montajCap;
    capUygulandi = true;
  }
  let ham = nakliyeTl + montajFinal;
  if (ham < capMin) {
    ham = capMin;
    capUygulandi = true;
  }

  const tutar = Math.round(ham / 100) * 100;
  const cikis = formula.cikis_sehir ?? "İstanbul";

  return {
    tutar,
    gecerli: true,
    bolge: null,
    bolge_katsayi: 1,
    montaj_tl: montajFinal,
    nakliye_tl: nakliyeTl,
    km: kmEff,
    not: `${cikis} → ${sehir} · ${kmEff} km nakliye`,
    detay: {
      nakliyeTaban,
      kmPayi,
      nakliyeAgirlik,
      montajM2,
      montajSatir,
      montajHacim,
      montajDeger,
      ham,
      capUygulandi,
    },
  };
}

export async function estimateNakliyeMontaj(
  input: NakliyeMontajInput,
): Promise<NakliyeMontajSonuc> {
  const [formula, kmInfo] = await Promise.all([
    loadNakliyeFormula(),
    kmFromIstanbul(input.sehir),
  ]);
  return estimateNakliyeMontajTry(
    input,
    formula,
    kmInfo.km,
    kmInfo.gecerli,
  );
}

export function isMontajNakliyeKalem(k: PFOSKalemi): boolean {
  const tip = resolveTipKodu(k.urunTipi);
  if (tip === "montaj_nakliye") return true;
  const sku = String(k.urun?.sku ?? "").toUpperCase();
  if (sku === "PFOS-MONTAJ") return true;
  const isim = String(k.isim || "").toLocaleLowerCase("tr-TR");
  return /nakliye/.test(isim) && /montaj/.test(isim);
}

/** Teklif motoru: montaj satır fiyatını formülden günceller */
export async function applyNakliyeMontajToKalemler(
  kalemler: PFOSKalemi[],
  opts: { m2: number; sehir?: string | null },
): Promise<PFOSKalemi[]> {
  const montajIdx = kalemler
    .map((k, i) => (isMontajNakliyeKalem(k) ? i : -1))
    .filter((i) => i >= 0);
  if (!montajIdx.length) return kalemler;

  const others = kalemler.filter((_, i) => !montajIdx.includes(i));
  const ekipmanToplamTl = others.reduce((sum, k) => {
    const f = k.urun?.fiyat ?? 0;
    return sum + f * k.adet;
  }, 0);

  const est = await estimateNakliyeMontaj({
    m2: opts.m2,
    sehir: opts.sehir,
    ekipmanToplamTl,
    kalemler: others.map((k) => ({
      adet: k.adet,
      kod: k.urun?.sku ?? undefined,
      sku: k.urun?.sku ?? undefined,
      ad: k.isim || (k.urun as { isim?: string })?.isim,
    })),
  });

  if (!est.gecerli || est.tutar <= 0) return kalemler;

  const montajSet = new Set(montajIdx);
  return kalemler.map((k, i) => {
    if (!montajSet.has(i) || !k.urun) return k;
    return {
      ...k,
      urun: {
        ...k.urun,
        fiyat: est.tutar,
        doviz: "TRY",
      },
    };
  });
}
