import {
  loadLegacyCatalogRows,
  type AdminUrunRow,
} from "@/lib/legacy-catalog";
import { matchEslesmisByEqustoKod } from "@/lib/catalog/equsto-kod-lookup";
import { katalogRowToEslesmis } from "../core/katalog-row-eslesmis";
import type { EslesmisUrun, FiyatStratejisi } from "../schemas/pfos.schema";
import { extractOlcuFromNotlar } from "./yer-izgara-match";
import {
  duvarRafNorm as norm,
  isDuvarRafiReferans,
  oztiDuvarRafSkuFromOlcu,
} from "./duvar-raf-heuristics";

export { isDuvarRafiReferans, oztiDuvarRafSkuFromOlcu };

function scoreDuvarRafRow(row: AdminUrunRow, olcu: string, targetSku?: string | null): number {
  const ad = norm(row.ad ?? "");
  if (!/duvar\s*raf/.test(ad)) return -9999;
  if (/davlumbaz/.test(ad)) return -9999;

  let score = 100;
  const sku = String(row.sku ?? "").toUpperCase();
  if (targetSku && sku === targetSku.toUpperCase()) return 9999;
  if (sku.startsWith("7897.")) score += 80;

  const nums = [...String(olcu).matchAll(/(\d{2,4})/g)].map((x) => Number(x[1]));
  if (nums.length >= 2) {
    const blob = `${ad} ${sku}`;
    if (blob.includes(String(nums[0])) && blob.includes(String(nums[1]))) score += 120;
  }
  if (row.fiyat_tl > 0 || (row.satis_fiyat_eur ?? 0) > 0) score += 40;
  return score;
}

export async function matchDuvarRafiByReferans(
  isim: string,
  olcu: string,
  notlar?: string | null,
  _fiyatStratejisi: FiyatStratejisi = "ekonomik",
): Promise<EslesmisUrun | null> {
  if (!isDuvarRafiReferans(isim)) return null;

  const olcuBlob =
    olcu ||
    extractOlcuFromNotlar(notlar) ||
    String(notlar ?? "").match(/(\d+\s*[*xX×]\s*\d+(?:\s*[*xX×]\s*\d+)?)/)?.[1] ||
    "";

  const targetSku = oztiDuvarRafSkuFromOlcu(olcuBlob);
  if (targetSku) {
    const bySku = await matchEslesmisByEqustoKod(`EQ-OZTI.${targetSku}`);
    if (bySku) return bySku;
  }

  const rows = (await loadLegacyCatalogRows()).filter((r) => r.durum === "aktif");
  let best: AdminUrunRow | null = null;
  let bestScore = -1;
  for (const row of rows) {
    const sc = scoreDuvarRafRow(row, olcuBlob, targetSku);
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
