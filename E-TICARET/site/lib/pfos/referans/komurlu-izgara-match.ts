import type { EslesmisUrun, FiyatStratejisi } from "../schemas/pfos.schema";
import {
  loadLegacyCatalogRows,
  type AdminUrunRow,
} from "@/lib/legacy-catalog";
import { katalogRowToEslesmis } from "../core/katalog-row-eslesmis";
import { extractOlcuFromNotlar } from "./yer-izgara-match";

function norm(s: string): string {
  return String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/\s+/g, " ")
    .trim();
}

export function isKomurluIzgaraReferans(isim: string): boolean {
  const n = norm(isim);
  return /komurlu|kömürlü/.test(n) && /izgar/.test(n);
}

function olcuSayilari(olcu: string): number[] {
  return [...String(olcu).matchAll(/(\d+(?:[.,]\d+)?)/g)]
    .map((m) => Number(m[1].replace(",", ".")))
    .filter((n) => Number.isFinite(n) && n >= 8);
}

/** Referans ölçüsü (cm) katalog adındaki boyutlarla uyumlu mu */
function olcuEslesir(olcu: string, urunAd: string): boolean {
  const nums = olcuSayilari(olcu);
  if (nums.length < 2) return false;
  const ad = norm(urunAd).replace(/[×x]/g, "*");
  const [a, b] = nums;
  const pairs = [
    `${a}*${b}`,
    `${b}*${a}`,
    `${Math.round(a * 10)}*${Math.round(b * 10)}`,
    `${Math.round(b * 10)}*${Math.round(a * 10)}`,
  ];
  if (nums.length >= 3) {
    const [a2, b2, c] = nums;
    pairs.push(`${a2}*${b2}*${c}`, `${b2}*${a2}*${c}`);
  }
  return pairs.some((p) => ad.includes(p));
}

function isKomurluIzgaraRow(row: AdminUrunRow): boolean {
  const n = norm(row.ad);
  return /komurlu.*izgar|kömürlü.*izgar/.test(n) && !/7960\./.test(row.sku ?? "");
}

function scoreKomurluRow(row: AdminUrunRow, olcu: string): number {
  if (!isKomurluIzgaraRow(row)) return -9999;
  let score = 80;
  if (olcuEslesir(olcu, row.ad)) score += 200;
  if (row.gorsel_url) score += 10;
  if (row.fiyat_tl > 0) score += 5;
  return score;
}

/**
 * Kömürlü ızgara — katalogda isim + ölçü eşleşmesi; yoksa boş fiyat.
 */
export async function matchKomurluIzgaraByReferans(
  isim: string,
  olcu: string,
  notlar: string | null | undefined,
  _fiyatStratejisi: FiyatStratejisi,
): Promise<EslesmisUrun | null> {
  const olcuText = olcu.trim() || extractOlcuFromNotlar(notlar);
  const rows = (await loadLegacyCatalogRows()).filter(
    (r) => r.durum === "aktif" && r.fiyat_tl > 0,
  );

  if (olcuText) {
    const scored = rows
      .map((row) => ({ row, score: scoreKomurluRow(row, olcuText) }))
      .filter((x) => x.score >= 280)
      .sort((a, b) => b.score - a.score);
    if (scored.length > 0) {
      return katalogRowToEslesmis(scored[0].row, { sablonIsim: isim });
    }
  }

  return {
    id: "pfos-komurlu-izgara-bos",
    sku: "",
    ad: isim.trim(),
    marka: null,
    model: null,
    olcu: olcuText || null,
    elektrikGucuKw: null,
    gazGucuKw: null,
    fiyat: 0,
    fiyatEur: null,
    doviz: "TRY",
    gorselUrl: null,
  };
}
