import {
  loadLegacyCatalogRows,
  type AdminUrunRow,
} from "@/lib/legacy-catalog";
import { katalogRowToEslesmis } from "../core/katalog-row-eslesmis";
import type { EslesmisUrun, FiyatStratejisi } from "../schemas/pfos.schema";
import { extractOlcuFromNotlar } from "./yer-izgara-match";

function norm(s: string): string {
  return String(s ?? "")
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/\s+/g, " ")
    .trim();
}

export function isMakeUpReferans(isim: string): boolean {
  return /make.?up|makeup|makyaj/.test(norm(isim));
}

function kapiSayisiFromIsim(isim: string): number | null {
  const n = norm(isim);
  const digit = n.match(/(\d)\s*kapili/);
  if (digit) return Number(digit[1]);
  if (/\buc\b|uc kap|3 kap|üç/.test(n)) return 3;
  if (/\biki\b|iki kap|2 kap|İki/i.test(isim)) return 2;
  if (/\bdort\b|dort kap|4 kap|dört|dörd/.test(n)) return 4;
  return null;
}

function genislikCm(olcu: string): number | null {
  const m = String(olcu).match(/(\d+(?:[.,]\d+)?)\s*[*xX×]/);
  if (!m) return null;
  const n = Number(m[1].replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function kapiSayisiFromUrunAd(ad: string): number | null {
  const n = norm(ad);
  if (/dort inox|4 inox|4 kap/.test(n)) return 4;
  if (/uc inox|3 inox|3 kap|üç/.test(n)) return 3;
  if (/iki inox|2 inox|2 kap|İki/i.test(ad)) return 2;
  const d = n.match(/(\d)\s*kap/);
  return d ? Number(d[1]) : null;
}

function tagGenislikCmFromSku(sku: string | null | undefined): number | null {
  const m = String(sku ?? "").match(/7919\.(\d{2})NTV/i);
  if (!m) return null;
  const seri = Number(m[1]);
  if (seri === 27) return 142;
  if (seri === 37) return 188;
  if (seri === 47) return 240;
  if (seri === 48) return 240;
  return null;
}

function genislikFromUrunAd(ad: string): number | null {
  const fromSku = tagGenislikCmFromSku(ad);
  const m = norm(ad).replace(/[×x]/g, "*").match(/(\d{3,4})\s*\*\s*(\d{2,3})/);
  if (m) return Number(m[1]);
  return fromSku;
}

function isPizzaMakeUpRow(ad: string, sku: string | null | undefined): boolean {
  const n = norm(ad);
  return /\.pj\b/i.test(String(sku ?? "")) || /pizza\s*hazirlik|ozel\s*pizza/.test(n);
}

function rowToEslesmis(row: AdminUrunRow): EslesmisUrun {
  return katalogRowToEslesmis(row);
}

function scoreMakeUpRow(
  row: AdminUrunRow,
  wantKapi: number | null,
  wantGenislikCm: number | null,
  referansIsim: string,
): number {
  const ad = norm(row.ad);
  if (!/make.?up|makeup|ntv|tag\s*\d{3}/.test(ad)) return -9999;

  const refN = norm(referansIsim);
  const pizzaRef = /pizza/.test(refN);
  if (isPizzaMakeUpRow(row.ad, row.sku) && !pizzaRef) return -9999;

  let score = 40;
  if (/servis\s*banko|soguk\s*servis/.test(ad) && !/servis\s*banko/.test(refN)) {
    score -= 80;
  }
  if (/evyeli|evye/.test(ad) && !/evye|evyeli/.test(refN)) score -= 15;
  if (/make.?up|makeup/.test(ad)) score += 40;
  if (/tag\s*\d{3}\s*ntv/.test(ad)) score += 55;
  if (/ntv/.test(ad) && /kap/.test(ad)) score += 30;

  const rowKapi = kapiSayisiFromUrunAd(row.ad);
  if (wantKapi != null) {
    if (rowKapi === wantKapi) score += 120;
    else if (rowKapi != null) score -= 200;
  }

  const rowGen =
    genislikFromUrunAd(row.ad) ?? tagGenislikCmFromSku(row.sku);
  if (wantGenislikCm != null && rowGen != null) {
    const diff = Math.abs(rowGen - wantGenislikCm);
    score += Math.max(0, 120 - diff * 2);
  }

  if (row.gorsel_url) score += 5;
  return score;
}

/** Make-up ünitesi / buzdolabı — kapı sayısı + ölçü genişliğine göre NTV katalog */
export async function matchMakeUpByReferans(
  isim: string,
  olcuRaw: string,
  notlar: string | null | undefined,
  _fiyatStratejisi: FiyatStratejisi,
): Promise<EslesmisUrun | null> {
  const olcu = olcuRaw.trim() || extractOlcuFromNotlar(notlar);
  const wantKapi = kapiSayisiFromIsim(isim);
  const wantGen = genislikCm(olcu);

  const rows = (await loadLegacyCatalogRows()).filter(
    (r) => r.durum === "aktif" && r.fiyat_tl > 0,
  );

  const scored = rows
    .map((row) => ({
      row,
      score: scoreMakeUpRow(row, wantKapi, wantGen, isim),
    }))
    .filter((x) => x.score >= 90)
    .sort((a, b) => b.score - a.score);

  if (!scored.length) return null;
  return rowToEslesmis(scored[0].row);
}
