import {
  loadLegacyCatalogRows,
  type AdminUrunRow,
} from "@/lib/legacy-catalog";
import { enrichEslesmisFromKatalogRow } from "../core/catalog-enrich";
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

function genislikFromUrunAd(ad: string): number | null {
  const m = norm(ad).match(/(\d{3,4})\s*[*xX×]\s*(\d{2,3})/);
  if (!m) return null;
  return Number(m[1]);
}

function rowToEslesmis(row: AdminUrunRow): EslesmisUrun {
  const enriched = enrichEslesmisFromKatalogRow(row, {});
  return {
    id: row.id,
    slug: row.id.replace(/^ecom_/, ""),
    sku: row.sku,
    ad: row.ad,
    marka: enriched.marka,
    model: enriched.model,
    olcu: enriched.olcu,
    elektrikGucuKw: row.el_guc,
    gazGucuKw: row.gaz_guc,
    fiyat: row.fiyat_tl,
    doviz: "TRY",
    gorselUrl: row.gorsel_url,
  };
}

function scoreMakeUpRow(
  row: AdminUrunRow,
  wantKapi: number | null,
  wantGenislikCm: number | null,
): number {
  const ad = norm(row.ad);
  if (!/make.?up|makeup|ntv/.test(ad)) return -9999;

  let score = 40;
  if (/make.?up|makeup/.test(ad)) score += 50;
  if (/ntv/.test(ad) && /kap/.test(ad)) score += 30;

  const rowKapi = kapiSayisiFromUrunAd(row.ad);
  if (wantKapi != null) {
    if (rowKapi === wantKapi) score += 80;
    else if (rowKapi != null) score -= 120;
  }

  const rowGen = genislikFromUrunAd(row.ad);
  if (wantGenislikCm != null && rowGen != null) {
    const diff = Math.abs(rowGen - wantGenislikCm);
    score += Math.max(0, 100 - diff * 3);
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
      score: scoreMakeUpRow(row, wantKapi, wantGen),
    }))
    .filter((x) => x.score >= 90)
    .sort((a, b) => b.score - a.score);

  if (!scored.length) return null;
  return rowToEslesmis(scored[0].row);
}
