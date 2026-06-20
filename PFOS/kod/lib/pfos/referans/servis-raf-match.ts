import {
  loadLegacyCatalogRows,
  type AdminUrunRow,
} from "@/lib/legacy-catalog";
import { matchEslesmisByEqustoKod } from "@/lib/catalog/equsto-kod-lookup";
import { katalogRowToEslesmis } from "../core/katalog-row-eslesmis";
import type { EslesmisUrun, FiyatStratejisi } from "../schemas/pfos.schema";
import { extractOlcuFromNotlar } from "./yer-izgara-match";
import {
  isServisRafiReferans,
  oztiServisRafSkuFromOlcu,
  servisRafNorm as norm,
} from "./servis-raf-heuristics";

export { isServisRafiReferans, oztiServisRafSkuFromOlcu };

function scoreServisRafRow(
  row: AdminUrunRow,
  olcu: string,
  isim: string,
  targetSku?: string | null,
): number {
  const ad = norm(row.ad ?? "");
  if (!/servis\s*raf/.test(ad)) return -9999;
  if (/arab|ünite|unite|banko/.test(ad)) return -9999;

  let score = 100;
  const sku = String(row.sku ?? "").toUpperCase();
  if (targetSku && sku === targetSku.toUpperCase()) return 9999;
  if (sku.startsWith("7897.") && /\.03$|\.04$/.test(sku)) score += 80;
  if (/bombe\s*cam/.test(ad)) score += 40;

  const nums = [...String(olcu).matchAll(/(\d{2,4})/g)].map((x) => Number(x[1]));
  if (nums.length >= 1) {
    const blob = `${ad} ${sku}`;
    if (blob.includes(String(nums[0]).slice(0, 3))) score += 120;
  }
  if (row.fiyat_tl > 0 || (row.satis_fiyat_eur ?? 0) > 0) score += 40;
  if (row.gorsel_url) score += 5;
  return score;
}

/** İnoksan paslanmaz çelik çift sıra servis rafı eşlemesi */
export async function matchInoksanServisRafi(
  isim: string,
  olcu: string,
  notlar: string | null | undefined,
): Promise<EslesmisUrun | null> {
  const n = norm(isim);
  const olcuBlob = olcu || extractOlcuFromNotlar(notlar) || "";
  const nums = [...olcuBlob.matchAll(/(\d+)/g)].map((x) => Number(x[1]));
  if (!nums.length) return null;
  const widthCm = nums[0];
  const roundedWidth = Math.round(widthCm / 10) * 10;
  const targetWidth = Math.min(240, Math.max(60, roundedWidth));

  const targetSku = `INO-KRC${String(targetWidth).padStart(3, "0")}`;

  const rows = await loadLegacyCatalogRows();
  const found = rows.find(
    (r) =>
      r.durum === "aktif" &&
      r.sku &&
      r.sku.toUpperCase() === targetSku.toUpperCase()
  );

  if (found) {
    const matched = katalogRowToEslesmis(found, {
      linkMarka: "İnoksan",
      sablonIsim: isim,
    });
    return {
      ...matched,
      ad: matched.ad,
      marka: "İnoksan",
      olcu: olcu || found.model || null,
    };
  }
  return null;
}

export async function matchServisRafiByReferans(
  isim: string,
  olcu: string,
  notlar?: string | null,
  _fiyatStratejisi: FiyatStratejisi = "ekonomik",
): Promise<EslesmisUrun | null> {
  if (!isServisRafiReferans(isim)) return null;

  const olcuBlob =
    olcu.trim() ||
    extractOlcuFromNotlar(notlar) ||
    String(notlar ?? "").match(/(\d+\s*[*xX×]\s*\d+(?:\s*[*xX×]\s*\d+)?)/)?.[1] ||
    "";

  const inoMatch = await matchInoksanServisRafi(isim, olcuBlob, notlar);
  if (inoMatch) return inoMatch;

  const targetSku = oztiServisRafSkuFromOlcu(olcuBlob, isim);
  if (targetSku) {
    const bySku = await matchEslesmisByEqustoKod(`EQ-OZTI.${targetSku}`);
    if (bySku) {
      return { ...bySku, ad: isim.trim() || bySku.ad };
    }
  }

  const rows = (await loadLegacyCatalogRows()).filter((r) => r.durum === "aktif");
  let best: AdminUrunRow | null = null;
  let bestScore = -1;
  for (const row of rows) {
    const sc = scoreServisRafRow(row, olcuBlob, isim, targetSku);
    if (sc > bestScore) {
      bestScore = sc;
      best = row;
    }
  }
  if (best && bestScore > 0) {
    const matched = katalogRowToEslesmis(best, { sablonIsim: isim });
    return { ...matched, ad: isim.trim() || matched.ad };
  }
  return null;
}
