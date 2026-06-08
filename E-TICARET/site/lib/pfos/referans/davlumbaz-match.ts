import type { EslesmisUrun, FiyatStratejisi } from "../schemas/pfos.schema";
import {
  loadLegacyCatalogRows,
  type AdminUrunRow,
} from "@/lib/legacy-catalog";
import { katalogRowToEslesmis } from "../core/katalog-row-eslesmis";
import {
  DAVLUMBAZ_MARKA,
  dimsCmFromOlcu,
  dimsCmFromProductName,
  generateEqustoDavlumbazSku,
  inferEqustoDavlumbazSuffix,
  isEqustoDavlumbazRow,
  parseDavlumbazForm,
  snapDavlumbazDepthCm,
} from "../core/davlumbaz-marka";
import { displayIsimFromSablon } from "../core/ozel-imalat";
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

function isUnoxCheftopHood(name: string): boolean {
  const n = norm(name);
  return (
    n.includes("eech") ||
    n.includes("cheftop") ||
    (n.includes("unox") && n.includes("davlumbaz"))
  );
}

type DavlumbazTip = {
  form: ReturnType<typeof parseDavlumbazForm>;
  filtrel: boolean | null;
  kutuCiftCidar: boolean;
  dekoratif: boolean;
};

function parseDavlumbazTip(isim: string): DavlumbazTip {
  const n = norm(isim);
  const form = parseDavlumbazForm(isim);

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

function olcuDistance(
  target: [number, number],
  catalog: [number, number],
): number {
  return (
    Math.abs(target[0] - catalog[0]) + Math.abs(target[1] - catalog[1])
  );
}

function rowMatchesTip(row: AdminUrunRow, tip: DavlumbazTip): boolean {
  const k = norm(row.ad);
  if (!k.includes("davlumbaz") || isUnoxCheftopHood(k)) return false;
  if (!isEqustoDavlumbazRow(row.sku)) return false;

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

function scoreEqustoDavlumbazRow(
  row: AdminUrunRow,
  tip: DavlumbazTip,
  target: [number, number] | null,
  targetSku?: string | null,
): number {
  if (!rowMatchesTip(row, tip)) return -9999;
  if (targetSku && norm(row.sku ?? "") === norm(targetSku)) return 9999;

  const catDims = dimsCmFromProductName(row.ad);
  if (!catDims || !target) return 80;

  const dist = olcuDistance(target, catDims);
  let score = 1000 - dist;
  if (row.gorsel_url) score += 5;
  if (row.fiyat_tl > 0) score += 5;
  return score;
}

async function findEqustoRowBySku(sku: string): Promise<AdminUrunRow | null> {
  const needle = norm(sku).replace(/\s+/g, "");
  if (!needle) return null;
  const rows = (await loadLegacyCatalogRows()).filter(
    (r) => r.durum === "aktif" && isEqustoDavlumbazRow(r.sku),
  );
  return (
    rows.find((r) => norm(r.sku ?? "").replace(/\s+/g, "") === needle) ?? null
  );
}

/**
 * Davlumbaz — EQUSTO katalog (ölçü + tip); Öztiryakiler 7885.* kullanılmaz.
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
  const target = dimsCmFromOlcu(
    sanitizeDavlumbazOlcu(isim, olcuRaw, urunTipi) ?? olcuRaw,
  );

  if (target) {
    const generatedSku = generateEqustoDavlumbazSku(isim, target[0], target[1]);
    const exact = await findEqustoRowBySku(generatedSku);
    if (exact) {
      const matched = katalogRowToEslesmis(exact, {
        linkMarka: DAVLUMBAZ_MARKA,
        sablonIsim: isim,
        urunTipi: urunTipi ?? undefined,
      });
      return {
        ...matched,
        ad: displayIsimFromSablon(isim),
        marka: DAVLUMBAZ_MARKA,
        olcu: olcuDisplay,
      };
    }
  }

  const rows = (await loadLegacyCatalogRows()).filter(
    (r) =>
      r.durum === "aktif" &&
      r.fiyat_tl > 0 &&
      isEqustoDavlumbazRow(r.sku),
  );

  const generatedSku = target
    ? generateEqustoDavlumbazSku(isim, target[0], target[1])
    : null;

  const scored = rows
    .map((row) => ({
      row,
      score: scoreEqustoDavlumbazRow(row, tip, target, generatedSku),
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length > 0) {
    const matched = katalogRowToEslesmis(scored[0].row, {
      linkMarka: DAVLUMBAZ_MARKA,
      sablonIsim: isim,
      urunTipi: urunTipi ?? undefined,
    });
    return {
      ...matched,
      ad: displayIsimFromSablon(isim),
      marka: DAVLUMBAZ_MARKA,
      olcu: olcuDisplay,
    };
  }

  if (target && isDavlumbazReferans(isim)) {
    const sku =
      generatedSku ??
      `EQUSTO.${String(target[0]).padStart(3, "0")}${String(snapDavlumbazDepthCm(target[1])).padStart(2, "0")}.${inferEqustoDavlumbazSuffix(isim, tip.form)}`;
    return {
      id: `equsto-davlumbaz-${sku.toLowerCase()}`,
      sku,
      ad: displayIsimFromSablon(isim),
      marka: DAVLUMBAZ_MARKA,
      model: sku,
      olcu: olcuDisplay,
      elektrikGucuKw: null,
      gazGucuKw: null,
      fiyat: 0,
      fiyatEur: null,
      doviz: "TRY",
      gorselUrl: null,
    };
  }

  return null;
}
