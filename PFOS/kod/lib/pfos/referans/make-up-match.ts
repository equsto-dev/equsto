import {
  loadLegacyCatalogRows,
  type AdminUrunRow,
} from "@/lib/legacy-catalog";
import { katalogRowToEslesmis } from "../core/katalog-row-eslesmis";
import { displayIsimFromSablon } from "../core/ozel-imalat";
import {
  OZTI_MARKA,
  isOztiBuzdolabiRow,
} from "../core/ozti-marka";
import { oztiNtvPrefix } from "../core/ozti-buzdolabi-spec";
import { isOztiKatalogMarka } from "../core/hazirlik-marka";
import type { EslesmisUrun, FiyatStratejisi } from "../schemas/pfos.schema";
import { toOlcuMmDisplay } from "../teklif/olcu-mm";
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

type MakeUpVariant = "standart" | "yuksek" | "camli" | "mermer" | "pizza";

function makeUpVariantFromIsim(isim: string): MakeUpVariant {
  const n = norm(isim);
  if (/pizza/.test(n)) return "pizza";
  if (/mermer/.test(n)) return "mermer";
  if (/camli|cam\s*kap|camlı/.test(n)) return "camli";
  if (/yuksek\s*borul|yüksek\s*borul|high\s*make/.test(n)) return "yuksek";
  return "standart";
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

function olcuParts(olcu: string): [number, number, number] | null {
  const nums = [...String(olcu).matchAll(/(\d+(?:[.,]\d+)?)/g)]
    .map((m) => Number(m[1].replace(",", ".")))
    .filter((n) => Number.isFinite(n) && n >= 8);
  if (nums.length < 2) return null;
  return [nums[0], nums[1], nums[2] ?? 0];
}

function snapDepthCm(depth: number): 60 | 70 {
  return Math.abs(depth - 60) <= Math.abs(depth - 70) ? 60 : 70;
}

function kapiSayisiFromSku(sku: string): number | null {
  const m = String(sku).match(/(\d)N\d{2}/i);
  return m ? Number(m[1]) : null;
}

function isOztiPizzaMakeUpRow(row: AdminUrunRow): boolean {
  const blob = norm(`${row.ad ?? ""} ${row.sku ?? ""}`);
  return (
    /^7919\./.test(String(row.sku ?? "")) &&
    (/pizza\s*hazirlik|\.pj\b|make\s*up/.test(blob) || /ntv/.test(blob))
  );
}

function preferredMakeUpSkus(
  variant: MakeUpVariant,
  kapi: number,
  depth: 60 | 70,
  widthCm = 140,
): string[] {
  if (variant === "pizza" || variant === "mermer") {
    if (kapi === 2) return ["PZAG-280", "PZAG-280-E"];
    if (kapi === 3) return ["PZAG-380", "PZAG-380-E"];
    if (kapi === 4) return ["PZAG-480", "PZAG-480-E"];
    return ["PZAG-380"];
  }
  if (variant === "yuksek") {
    if (kapi === 2) return ["SBB-2N70"];
    if (kapi === 3) return ["SBB-3N70"];
    return ["SBB-2N70"];
  }
  if (kapi === 2) return ["SBT-2N70", "SBT-2N70E"];
  if (kapi === 3) return ["SBT-3N70", "SBT-3N70E"];
  if (kapi === 4) return ["SBT-4N70", "SBT-4N70E"];
  return ["SBT-2N70"];
}

function isPortabiancoMakeUpRow(row: AdminUrunRow): boolean {
  const brand = norm(row.marka_ad || "");
  if (brand.includes("portabianco")) return true;
  const sku = String(row.sku ?? "").toUpperCase();
  return /^SBT-|^PZAG-|^SBB-|^PZA-|^PZAD-/i.test(sku) || /make.?up|makeup/i.test(row.ad || "");
}

function isOztiMakeUpRow(row: AdminUrunRow): boolean {
  if (!isOztiBuzdolabiRow(row)) return false;
  const blob = norm(`${row.ad ?? ""} ${row.sku ?? ""}`);
  return /make.?up|makeup|makyaj|ntv\.pj|ntv\.s0/i.test(blob);
}

function kapiSayisiFromUrunAd(ad: string): number | null {
  const n = norm(ad);
  if (/dort inox|4 inox|4 kap|dört kap|dort kap/.test(n)) return 4;
  if (/uc inox|3 inox|3 kap|üç kap|uc kap/.test(n)) return 3;
  if (/iki inox|2 inox|2 kap|İki/i.test(ad)) return 2;
  const d = n.match(/(\d)\s*kap/);
  return d ? Number(d[1]) : null;
}

function genislikCmFromRow(row: AdminUrunRow): number | null {
  const o = row.olculer;
  if (o?.genislik_mm) return Math.round(o.genislik_mm / 10);
  const m = norm(row.ad ?? "")
    .replace(/[×x]/g, "*")
    .match(/(\d{2,3}(?:[.,]\d+)?)\s*[x*]\s*(\d{2,3})/);
  if (m) return Number(m[1].replace(",", "."));
  return null;
}

function scoreMakeUpRow(
  row: AdminUrunRow,
  wantKapi: number | null,
  wantGenislikCm: number | null,
  referansIsim: string,
  variant: MakeUpVariant,
  targetSkus: string[],
): number {
  const refN = norm(referansIsim);
  const isPB = isPortabiancoMakeUpRow(row);
  const isOz = isOztiPizzaMakeUpRow(row) || isOztiMakeUpRow(row);
  if (!isPB && !isOz) return -9999;

  const ad = norm(row.ad);
  const sku = String(row.sku ?? "").toUpperCase();
  let score = 50;

  if (isPB) score += 250;

  if (/make.?up|makeup/.test(ad)) score += 40;
  if (targetSkus.some((s) => sku === s.toUpperCase())) score += 500;

  if (variant === "yuksek" && /yuksek|yüksek|sbb-/.test(ad)) score += 60;
  if (variant === "camli" && /camli|camlı|sbtg-/.test(ad)) score += 60;
  if (variant === "mermer" && /mermer|sbm-|sbtm-/.test(ad)) score += 60;
  if (variant === "standart" && /^sbt-|^sbtp-/.test(ad)) score += 40;
  if (variant === "standart" && /yuksek|mermer|camli|camlı/.test(ad)) score -= 40;

  const rowKapi = kapiSayisiFromUrunAd(row.ad) ?? kapiSayisiFromSku(sku);
  if (wantKapi != null) {
    if (rowKapi === wantKapi) score += 120;
    else if (rowKapi != null) score -= 200;
  }

  const rowGen = genislikCmFromRow(row);
  if (wantGenislikCm != null && rowGen != null) {
    score += Math.max(0, 120 - Math.abs(rowGen - wantGenislikCm) * 2);
  }

  if (/evyeli|evye/.test(ad) && !/evye|evyeli/.test(refN)) score -= 20;
  if (row.gorsel_url) score += 5;
  if (row.fiyat_tl > 0) score += 5;
  return score;
}

function toEslesmis(
  row: AdminUrunRow,
  isim: string,
  olcuDisplay: string | null,
  urunTipi?: string | null,
  marka = OZTI_MARKA,
): EslesmisUrun {
  const matched = katalogRowToEslesmis(row, {
    linkMarka: marka,
    sablonIsim: isim,
    urunTipi: urunTipi ?? undefined,
  });
  return {
    ...matched,
    ad: displayIsimFromSablon(isim),
    marka,
    olcu: olcuDisplay,
  };
}

/** Make-up ünitesi — Öztiryakiler NTV katalog */
export async function matchMakeUpByReferans(
  isim: string,
  olcuRaw: string,
  notlar: string | null | undefined,
  _fiyatStratejisi: FiyatStratejisi,
  urunTipi?: string | null,
): Promise<EslesmisUrun | null> {
  const olcu =
    olcuRaw.trim() ||
    extractOlcuFromNotlar(notlar) ||
    String(notlar ?? "")
      .replace(/^ölçü:\s*/i, "")
      .trim();
  const olcuDisplay = toOlcuMmDisplay(olcu) ?? (olcu || null);
  const variant = makeUpVariantFromIsim(isim);
  const parts = olcuParts(olcu);
  const depth = parts ? snapDepthCm(parts[1]) : 70;
  let wantKapi = kapiSayisiFromIsim(isim);
  if (wantKapi == null && parts && parts[0] >= 220) wantKapi = 4;
  if (wantKapi == null && parts && parts[0] >= 165) wantKapi = 3;
  if (wantKapi == null && parts && parts[0] >= 105) wantKapi = 2;
  const wantGen = parts?.[0] ?? null;

  const targetSkus =
    wantKapi != null
      ? preferredMakeUpSkus(variant, wantKapi, depth, wantGen ?? 140)
      : [];

  const rows = (await loadLegacyCatalogRows()).filter(
    (r) => r.durum === "aktif" && r.fiyat_tl > 0,
  );

  for (const sku of targetSkus) {
    const exact = rows.find(
      (r) => String(r.sku ?? "").toUpperCase() === sku.toUpperCase(),
    );
    if (exact) {
      const brand = exact.marka_ad || "Portabianco";
      return toEslesmis(exact, isim, olcuDisplay, urunTipi, brand);
    }
  }

  const scored = rows
    .map((row) => ({
      row,
      score: scoreMakeUpRow(
        row,
        wantKapi,
        wantGen,
        isim,
        variant,
        targetSkus,
      ),
    }))
    .filter((x) => x.score >= 120)
    .sort((a, b) => b.score - a.score);

  if (!scored.length) return null;
  const pick = scored[0].row;
  const brand = pick.marka_ad || "Portabianco";
  return toEslesmis(pick, isim, olcuDisplay, urunTipi, brand);
}
