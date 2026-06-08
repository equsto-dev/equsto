import type { EslesmisUrun, FiyatStratejisi } from "../schemas/pfos.schema";
import {
  loadLegacyCatalogRows,
  type AdminUrunRow,
} from "@/lib/legacy-catalog";
import { katalogRowToEslesmis } from "../core/katalog-row-eslesmis";
import {
  displayIsimFromSablon,
  OZEL_IMALAT_MARKA,
} from "../core/ozel-imalat";
import { sanitizeDavlumbazOlcu } from "../teklif/davlumbaz-olcu";
import { toOlcuMmDisplay } from "../teklif/olcu-mm";
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

export function isDavlumbazReferans(isim: string): boolean {
  return /davlumbaz/i.test(String(isim ?? ""));
}

type DavlumbazTip = {
  form: "orta" | "duvar" | null;
  filtrel: boolean | null;
  kutuCiftCidar: boolean;
  dekoratif: boolean;
};

function parseDavlumbazTip(isim: string): DavlumbazTip {
  const n = norm(isim);
  let form: DavlumbazTip["form"] = null;
  if (/orta\s*tip/.test(n)) form = "orta";
  else if (/duvar\s*tip/.test(n)) form = "duvar";

  let filtrel: boolean | null = null;
  if (/filtresiz/.test(n)) filtrel = false;
  else if (/filtreli|filtrel/.test(n)) filtrel = true;

  return {
    form,
    filtrel,
    kutuCiftCidar: /kutu\s*tip|cift\s*cidar/.test(n),
    dekoratif: /dekoratif/.test(n),
  };
}

function isUnoxCheftopHood(name: string): boolean {
  const n = norm(name);
  return (
    n.includes("eech") ||
    n.includes("cheftop") ||
    (n.includes("unox") && n.includes("davlumbaz"))
  );
}

function dimsFromText(text: string): [number, number] | null {
  const s = norm(text).replace(/[×x]/g, "*");
  const m = s.match(/(\d+(?:[.,]\d+)?)\s*\*\s*(\d+(?:[.,]\d+)?)/);
  if (!m) return null;
  const a = Number(m[1].replace(",", "."));
  const b = Number(m[2].replace(",", "."));
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return [a, b];
}

function olcuDistance(
  target: [number, number],
  catalog: [number, number],
): number {
  return Math.abs(target[0] - catalog[0]) + Math.abs(target[1] - catalog[1]);
}

function rowMatchesTip(row: AdminUrunRow, tip: DavlumbazTip): boolean {
  const k = norm(row.ad);
  if (!k.includes("davlumbaz") || isUnoxCheftopHood(k)) return false;

  if (tip.form === "orta" && !/orta\s*tip/.test(k)) return false;
  if (tip.form === "duvar" && !/duvar\s*tip/.test(k)) return false;

  if (tip.filtrel === true && !/filtreli|filtrel/.test(k)) return false;
  if (tip.filtrel === false && !/filtresiz/.test(k)) return false;

  if (tip.kutuCiftCidar) {
    if (!/kutu\s*tip|cift\s*cidar/.test(k)) return false;
  } else if (/kutu\s*tip|cift\s*cidar/.test(k)) {
    return false;
  }

  if (tip.dekoratif && !/dekoratif/.test(k)) return false;

  return true;
}

function scoreDavlumbazRow(
  row: AdminUrunRow,
  tip: DavlumbazTip,
  target: [number, number] | null,
): number {
  if (!rowMatchesTip(row, tip)) return -9999;
  const catDims = dimsFromText(row.ad);
  if (!catDims || !target) return 50;

  const dist = olcuDistance(target, catDims);
  let score = 1000 - dist;
  if (row.gorsel_url) score += 5;
  if (row.fiyat_tl > 0) score += 5;
  return score;
}

/**
 * Davlumbaz — referans tip + ölçüye en yakın katalog satırı; fiyat ekipmanlar.json'dan.
 */
export async function matchDavlumbazByReferans(
  isim: string,
  olcu: string,
  notlar: string | null | undefined,
  urunTipi?: string | null,
  _fiyatStratejisi: FiyatStratejisi = "ekonomik",
): Promise<EslesmisUrun | null> {
  const olcuRaw =
    olcu.trim() ||
    extractOlcuFromNotlar(notlar) ||
    String(notlar ?? "")
      .replace(/^ölçü:\s*/i, "")
      .trim();
  const olcuDisplay =
    toOlcuMmDisplay(
      sanitizeDavlumbazOlcu(isim, olcuRaw, urunTipi) ?? olcuRaw,
    ) ?? (olcuRaw || null);

  const tip = parseDavlumbazTip(isim);
  const target = dimsFromText(olcuRaw);

  const rows = (await loadLegacyCatalogRows()).filter(
    (r) => r.durum === "aktif" && r.fiyat_tl > 0,
  );

  const scored = rows
    .map((row) => ({ row, score: scoreDavlumbazRow(row, tip, target) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  if (!scored.length) return null;

  const matched = katalogRowToEslesmis(scored[0].row, {
    sablonIsim: isim,
    urunTipi: urunTipi ?? undefined,
  });

  return {
    ...matched,
    ad: displayIsimFromSablon(isim),
    marka: OZEL_IMALAT_MARKA,
    olcu: olcuDisplay,
  };
}
