/**
 * PFOS — EQUSTO Fiyat Listesi 2026 tezgah / davlumbaz / duvar raf eşlemesi (EQ.* kodları).
 */
import { readJsonFile, dataRel } from "@/lib/legacy-data";
import { ecomRowToAdminUrun, type AdminUrunRow } from "@/lib/admin-urun";
import type { EslesmisUrun } from "../schemas/pfos.schema";
import { katalogRowToEslesmis } from "./katalog-row-eslesmis";
import { dimsCmFromOlcu } from "./davlumbaz-marka";
import { isBulasikSiyirmaTezgahReferans } from "./calisma-tezgah";

import { isEqustoFiyatListesiSku, parseEqSku } from "./equsto-fiyat-sku";

export const EQUSTO_FIYAT_KAYNAK = "equsto-fiyat-listesi-2026";
export const EQUSTO_IMALAT_MARKA = "Equsto";

type FiyatListesiRow = Record<string, unknown>;

let pfosPoolCache: AdminUrunRow[] | null = null;

function norm(s: string | null | undefined): string {
  return String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/[×x]/g, "*")
    .replace(/\s+/g, " ")
    .trim();
}

export function isEqustoFiyatListesiRow(
  row: Pick<AdminUrunRow, "sku"> & { kaynak?: string | null },
): boolean {
  if (String(row.kaynak ?? "") === EQUSTO_FIYAT_KAYNAK) return true;
  return isEqustoFiyatListesiSku(row.sku);
}

function dimsFromOlcuText(olcu: string): { en: number; derinlik: number } | null {
  const pair = dimsCmFromOlcu(olcu);
  if (!pair) return null;
  return { en: pair[0], derinlik: pair[1] };
}

async function loadPfosPool(): Promise<AdminUrunRow[]> {
  if (pfosPoolCache) return pfosPoolCache;
  const raw = await readJsonFile<FiyatListesiRow[]>(
    dataRel("fiyat-listeleri", "equsto", "2026-fiyat-listesi", "pfos-tum-urunler.json"),
  );
  const rows = Array.isArray(raw) ? raw : [];
  pfosPoolCache = rows.map((row, i) => {
    const admin = ecomRowToAdminUrun(row as Parameters<typeof ecomRowToAdminUrun>[0], i);
    return {
      ...admin,
      ad: String(row.name ?? row.baslik ?? admin.ad),
      marka_ad: EQUSTO_IMALAT_MARKA,
      kaynak: EQUSTO_FIYAT_KAYNAK,
    } as AdminUrunRow & { kaynak?: string };
  });
  return pfosPoolCache;
}

export function invalidateEqustoFiyatListesiPfosCache(): void {
  pfosPoolCache = null;
}

/** Referans adından tercih edilen EQUSTO seri kodları (öncelik sırası). */
export function inferTezgahSeriesKods(isim: string): string[] {
  const n = norm(isim);
  if (isBulasikSiyirmaTezgahReferans(isim)) {
    return ["KBULST02", "KBULST01"];
  }
  if (/hareketli/.test(n)) {
    return ["KHCT02", "KHCT01", "KHCT03", "KHCT04", "KHCT05"];
  }
  if (/mermer/.test(n)) {
    return ["KMERTT02", "KMERTT01", "KMERTT03", "KMERTT04", "KMERTT05", "KMERTT06"];
  }
  if (/polietilen/.test(n)) {
    return ["KPTT02", "KPTT01", "KPTT03", "KPTT04", "KPTT05", "KPTT06"];
  }
  if (/üç\s*evyeli|uc\s*evyeli|\b3\s*evye/.test(n)) {
    return ["KCEVT02", "KCEVD02"];
  }
  if (/çift\s*evyeli|cift\s*evyeli|iki\s*evyeli/.test(n)) {
    if (/dolap|kapali|kapalı/.test(n)) return ["KCEVD02", "KCEVD01"];
    return ["KCEVT02", "KCEVT01", "KDCT02", "KDCT01"];
  }
  if (/tek\s*evyeli|\b1\s*evye/.test(n)) {
    if (/dolap|kapali|kapalı/.test(n)) return ["KTEVDT02", "KTEVDT01"];
    if (/makine\s*giris|makine\s*giriş/.test(n)) return ["KMGT02", "KMGT01"];
    return ["KTEVT02", "KTEVT01"];
  }
  if (/dolapli|dolaplı|dolap|kapali|kapalı/.test(n) && /calisma|çalışma|tezgah/.test(n)) {
    return ["KDCT02", "KDCT01", "KDCT03"];
  }
  if (/set\s*alti|setalti/.test(n)) {
    return ["KSADT02", "KSADT01"];
  }
  if (/firin\s*stand|fırın\s*stand|firin\s*alt|fırın\s*alt/.test(n)) {
    return ["KSAT02", "KSAT01"];
  }
  if (/taban\s*ve\s*ara\s*rafl/.test(n)) {
    return ["KCT08", "KCT09", "KCT04", "KCT05", "KCT02", "KCT01"];
  }
  if (/taban\s*rafl/.test(n)) {
    return ["KCT04", "KCT05", "KCT06", "KCT02", "KCT01"];
  }
  return ["KCT02", "KCT01", "KCT03", "KCT04", "KCT05"];
}

function inferDavlumbazSeriesKods(isim: string, urunTipi?: string | null): string[] {
  const n = norm(`${isim} ${urunTipi ?? ""}`);
  const orta = /orta\s*tip/.test(n);
  const filtrel = /filtresiz/.test(n) ? false : /filtreli|filtrel/.test(n) ? true : null;
  if (/giyotin|bulasikhane|bym\s*10|1000\s*tb/.test(n) && !orta) {
    return ["KDAVDT01"];
  }
  if (orta) {
    if (filtrel === true) return ["KDAVOTF02"];
    if (filtrel === false) return ["KDAVOT01"];
    return ["KDAVOTF02", "KDAVOT01"];
  }
  if (filtrel === true) return ["KDAVDTF02"];
  if (filtrel === false) return ["KDAVDT01"];
  return ["KDAVDT01", "KDAVDTF02", "KDAVOT01", "KDAVOTF02"];
}

const DUVAR_RAF_SERIES = new Set(["KDUVR01", "KDUVR02", "KSDUVR03", "KBASRAF"]);

function isTezgahPoolKod(kod: string): boolean {
  if (!kod) return false;
  if (kod.startsWith("KDAV")) return false;
  if (DUVAR_RAF_SERIES.has(kod)) return false;
  return true;
}

/** Referans adı → EQUSTO duvar / basket raf serisi */
export function inferDuvarRafSeriesKods(isim: string, urunTipi?: string | null): string[] {
  const n = norm(`${isim} ${urunTipi ?? ""}`);
  if (/basket\s*raf|tezgah\s*ust|tezgahust/.test(n)) return ["KBASRAF"];
  if (/suzmeli|süzmeli|suzme/.test(n)) return ["KSDUVR03"];
  if (/cift\s*sira|çift\s*sira|iki\s*sira|çift\s*sirali|cift\s*sirali/.test(n)) {
    return ["KDUVR02", "KDUVR01"];
  }
  return ["KDUVR01", "KDUVR02", "KSDUVR03"];
}

function scoreDuvarRafRow(
  row: AdminUrunRow,
  isim: string,
  target: { en: number; derinlik: number },
  seriesKods: string[],
): number {
  const parsed = parseEqSku(row.sku);
  if (!parsed || !DUVAR_RAF_SERIES.has(parsed.kod)) return -9999;

  const dist = Math.abs(parsed.en - target.en) + Math.abs(parsed.derinlik - target.derinlik);
  if (dist > 30) return -9999;

  let score = 500 - dist;
  const seriesIdx = seriesKods.indexOf(parsed.kod);
  if (seriesIdx >= 0) score += 400 - seriesIdx * 8;
  else score -= 120;

  const ad = norm(row.ad);
  const n = norm(isim);
  if (/tek\s*sira|tek\s*sirali/.test(n) && /tek\s*sira/.test(ad)) score += 60;
  if (/cift\s*sira|çift\s*sira/.test(n) && /cift\s*sira|çift\s*sira/.test(ad)) score += 60;
  if (/suzmeli|süzmeli/.test(n) && /suzmeli|süzmeli/.test(ad)) score += 60;
  if (/basket/.test(n) && /basket/.test(ad)) score += 80;
  if (row.fiyat_tl > 0) score += 10;
  if (row.gorsel_url) score += 5;
  return score;
}

function scoreTezgahRow(
  row: AdminUrunRow,
  isim: string,
  target: { en: number; derinlik: number },
  seriesKods: string[],
): number {
  const parsed = parseEqSku(row.sku);
  if (!parsed) return -9999;
  if (parsed.en !== target.en || parsed.derinlik !== target.derinlik) {
    const dist = Math.abs(parsed.en - target.en) + Math.abs(parsed.derinlik - target.derinlik);
    if (dist > 30) return -9999;
  }

  let score = 500 - Math.abs(parsed.en - target.en) - Math.abs(parsed.derinlik - target.derinlik);
  const seriesIdx = seriesKods.indexOf(parsed.kod);
  if (seriesIdx >= 0) score += 400 - seriesIdx * 8;
  else score -= 120;

  const ad = norm(row.ad);
  const n = norm(isim);
  if (/taban\s*ve\s*ara\s*rafl/.test(n) && /taban\s*ve\s*ara\s*rafl/.test(ad)) score += 80;
  if (/taban\s*rafl/.test(n) && /taban\s*rafl/.test(ad)) score += 50;
  if (/cekmeceli|çekmeceli/.test(n) && /cekmeceli|çekmeceli/.test(ad)) score += 40;
  if (/evyeli|evye/.test(n) && /evyeli|evye/.test(ad)) score += 60;
  if (/dolap/.test(n) && /dolap/.test(ad)) score += 50;
  if (row.fiyat_tl > 0) score += 10;
  if (row.gorsel_url) score += 5;
  return score;
}

function scoreDavlumbazRow(
  row: AdminUrunRow,
  isim: string,
  target: { en: number; derinlik: number } | null,
  seriesKods: string[],
): number {
  const parsed = parseEqSku(row.sku);
  if (!parsed || !parsed.kod.startsWith("KDAV")) return -9999;

  const seriesIdx = seriesKods.indexOf(parsed.kod);
  if (seriesIdx < 0) return -9999;

  let score = 600 - seriesIdx * 10;
  if (target) {
    const dist = Math.abs(parsed.en - target.en) + Math.abs(parsed.derinlik - target.derinlik);
    if (dist > 40) return -9999;
    score += 300 - dist;
  }

  const ad = norm(row.ad);
  const n = norm(isim);
  if (/filtresiz/.test(n) && /filtresiz/.test(ad)) score += 40;
  if (/filtreli|filtrel/.test(n) && /filtreli|filtrel/.test(ad)) score += 40;
  if (/orta\s*tip/.test(n) && /orta\s*tip/.test(ad)) score += 50;
  if (/duvar\s*tip/.test(n) && /duvar\s*tip/.test(ad)) score += 50;
  if (row.fiyat_tl > 0) score += 10;
  if (row.gorsel_url) score += 5;
  return score;
}

function rowToEslesmis(
  row: AdminUrunRow,
  sablonIsim: string,
  urunTipi?: string | null,
): EslesmisUrun {
  return katalogRowToEslesmis(row, {
    linkMarka: EQUSTO_IMALAT_MARKA,
    sablonIsim,
    urunTipi: urunTipi ?? undefined,
  });
}

export async function matchEqustoFiyatListesiTezgah(
  isim: string,
  olcu: string,
  urunTipi?: string | null,
): Promise<EslesmisUrun | null> {
  const dims = dimsFromOlcuText(olcu);
  if (!dims) return null;

  const pool = (await loadPfosPool()).filter((r) => {
    const k = parseEqSku(r.sku)?.kod ?? "";
    return isTezgahPoolKod(k);
  });
  if (!pool.length) return null;

  const seriesKods = inferTezgahSeriesKods(isim);
  const scored = pool
    .map((row) => ({
      row,
      score: scoreTezgahRow(row, isim, dims, seriesKods),
    }))
    .filter((x) => x.score > 200)
    .sort((a, b) => b.score - a.score);

  const best = scored[0]?.row;
  if (!best) return null;
  return rowToEslesmis(best, isim, urunTipi);
}

export async function matchEqustoFiyatListesiDavlumbaz(
  isim: string,
  olcu: string,
  urunTipi?: string | null,
): Promise<EslesmisUrun | null> {
  const dims = dimsFromOlcuText(olcu);
  const seriesKods = inferDavlumbazSeriesKods(isim, urunTipi);

  const pool = (await loadPfosPool()).filter((r) => {
    const k = parseEqSku(r.sku)?.kod ?? "";
    return k.startsWith("KDAV");
  });
  if (!pool.length) return null;

  const scored = pool
    .map((row) => ({
      row,
      score: scoreDavlumbazRow(row, isim, dims, seriesKods),
    }))
    .filter((x) => x.score > 200)
    .sort((a, b) => b.score - a.score);

  const best = scored[0]?.row;
  if (!best) return null;
  return rowToEslesmis(best, isim, urunTipi);
}

export async function matchEqustoFiyatListesiDuvarRaf(
  isim: string,
  olcu: string,
  urunTipi?: string | null,
): Promise<EslesmisUrun | null> {
  const { normalizeDuvarRafDims } = await import("../referans/duvar-raf-heuristics");
  const dims =
    normalizeDuvarRafDims(olcu, isim) ?? dimsFromOlcuText(olcu);
  if (!dims) return null;

  const pool = (await loadPfosPool()).filter((r) => {
    const k = parseEqSku(r.sku)?.kod ?? "";
    return DUVAR_RAF_SERIES.has(k);
  });
  if (!pool.length) return null;

  const seriesKods = inferDuvarRafSeriesKods(isim, urunTipi);
  const scored = pool
    .map((row) => ({
      row,
      score: scoreDuvarRafRow(row, isim, dims, seriesKods),
    }))
    .filter((x) => x.score > 200)
    .sort((a, b) => b.score - a.score);

  const best = scored[0]?.row;
  if (!best) return null;
  return rowToEslesmis(best, isim, urunTipi);
}
