import {
  loadLegacyCatalogRows,
  type AdminUrunRow,
} from "@/lib/legacy-catalog";
import { katalogRowToEslesmis } from "../core/katalog-row-eslesmis";
import { displayIsimFromSablon } from "../core/ozel-imalat";
import {
  PORTABIANCO_MARKA,
  isPortabiancoBuzdolabiRow,
  isPortabiancoKatalogMarka,
} from "../core/portabianco-marka";
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

function isPortabiancoMakeUpRow(row: AdminUrunRow): boolean {
  if (!isPortabiancoBuzdolabiRow(row)) return false;
  const blob = norm(`${row.ad ?? ""} ${row.sku ?? ""}`);
  if (!/make.?up|makeup|makyaj/.test(blob)) return false;
  if (/^7919\.|^8919\./.test(String(row.sku ?? ""))) return false;
  return /^SB[A-Z]+-\dN\d+/i.test(String(row.sku ?? "")) || isPortabiancoKatalogMarka(row.marka_ad);
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
): string[] {
  const n = `${kapi}N${depth}`;
  switch (variant) {
    case "yuksek":
      return [`SBB-${n}`, `SBB-${n}E`];
    case "camli":
      return [`SBTG-${n}`, `SBTG-${n}E`];
    case "mermer":
      return [`SBM-${n}`, `SBTM-${n}`, `SBM-${n}E`, `SBTM-${n}E`];
    case "pizza":
      return [`7919.37NTV.S0`, `7919.38NTV.PJ`, `7919.48NTV.PJ`];
    default:
      return [`SBT-${n}`, `SBTP-${n}`, `SBT-${n}E`, `SBTP-${n}E`];
  }
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
  const pizzaRef = variant === "pizza";

  if (pizzaRef) {
    if (!isOztiPizzaMakeUpRow(row)) return -9999;
  } else if (!isPortabiancoMakeUpRow(row)) {
    return -9999;
  }

  const ad = norm(row.ad);
  const sku = String(row.sku ?? "").toUpperCase();
  let score = 50;

  if (/make.?up|makeup/.test(ad)) score += 40;
  if (targetSkus.some((s) => sku === s.toUpperCase())) score += 200;

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
  marka = PORTABIANCO_MARKA,
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

/** Make-up ünitesi — Portabianco (Yüksel); pizza hazırlık hariç Öztiryakiler NTV kullanılmaz */
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
    wantKapi != null ? preferredMakeUpSkus(variant, wantKapi, depth) : [];

  const rows = (await loadLegacyCatalogRows()).filter(
    (r) => r.durum === "aktif" && r.fiyat_tl > 0,
  );

  for (const sku of targetSkus) {
    const exact = rows.find(
      (r) => String(r.sku ?? "").toUpperCase() === sku.toUpperCase(),
    );
    if (exact) {
      const marka = variant === "pizza" ? exact.marka_ad : PORTABIANCO_MARKA;
      return toEslesmis(exact, isim, olcuDisplay, urunTipi, marka);
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
  const marka =
    variant === "pizza" && !isPortabiancoMakeUpRow(pick)
      ? pick.marka_ad
      : PORTABIANCO_MARKA;
  return toEslesmis(pick, isim, olcuDisplay, urunTipi, marka);
}
