import type { AdminUrunRow } from "@/lib/legacy-catalog";
import { isOztiBuzdolabiRow } from "./ozti-marka";
import { isOztiKatalogMarka } from "./hazirlik-marka";

export type BuzFamily = "tezgah" | "cihazalti" | "dik" | "bar" | null;

function norm(s: string): string {
  return String(s ?? "")
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/\s+/g, " ")
    .trim();
}

/** Ölçü genişliği + kapı → 7919 NTV/NMV önek (27=~140cm, 37=~187cm, 47=~240cm) */
export function oztiNtvPrefix(kapi: number, widthCm: number): string {
  if (kapi <= 1 && widthCm < 100) return "06";
  if (kapi >= 4 || widthCm >= 220) return "47";
  if (kapi >= 3 || widthCm >= 165) return "37";
  if (kapi >= 2 || widthCm >= 105) return "27";
  return "27";
}

export function oztiPreferredBuzSkus(
  family: BuzFamily,
  kapi: number,
  widthCm: number,
  freezer: boolean,
  camKapili: boolean,
  depthCm: 60 | 70 = 70,
): string[] {
  const p = oztiNtvPrefix(kapi, widthCm);
  const depthSeries = depthCm === 60 ? "79E4" : "79E3";
  if (family === "tezgah") {
    const nmv = `${depthSeries}.${p}NMV.${camKapili ? "01" : "00"}`;
    if (camKapili) return [nmv, `7919.${p}NTV.24`];
    return [nmv];
  }
  if (family === "cihazalti") {
    return [`7919.${p}NTV.C1`, `7919.${p}NTV.C2`];
  }
  if (family === "dik") {
    if (freezer) {
      if (kapi <= 1) return ["7919.06LMV.00", "7919.06LMV.10"];
      return ["7919.12LMV.00", "7919.12LMV.10"];
    }
    if (kapi <= 1) return ["7919.06NMV.00"];
    return ["7919.12NMV.00"];
  }
  if (family === "bar") {
    return [];
  }
  return [];
}

export function scoreOztiBuzdolabiRow(
  row: AdminUrunRow,
  family: BuzFamily,
  targetSkus: string[],
  referansIsim: string,
  freezer: boolean,
  camKapili: boolean,
  reqDoors: number | null,
  reqDepth: number | null,
  hasRequestedSize: boolean,
): number {
  if (!isOztiBuzdolabiRow(row)) return -9999;
  const ad = norm(row.ad ?? "");
  const sku = String(row.sku ?? "").toUpperCase();
  if (!/buzdolab|donduruc|ntv|nmv|lts|lmv|soguk\s*servis|cihaz\s*alti|cihazalti|dik\s*tip|havuzlu|make\s*up/.test(ad)) {
    return -9999;
  }

  if (freezer && !/donduruc|lmv|derin/.test(ad) && !/LMV/.test(sku)) {
    return -9999;
  }
  if (!freezer && /derin\s*donduruc/.test(ad) && !/buzdolab/.test(ad)) {
    return -9999;
  }

  let score = 50;
  if (isOztiKatalogMarka(row.marka_ad)) score += 40;
  if (targetSkus.some((t) => norm(sku) === norm(t.replace(/\s+/g, "")))) score += 500;

  if (family === "tezgah" && /tezgah|yatay\s*tip|nmv|tag\s*\d+\s*nmv/i.test(ad)) {
    score += 80;
  }
  if (family === "cihazalti" && /cihaz\s*alti|cihazalti/.test(ad)) score += 80;
  if (family === "dik" && /dik\s*tip/.test(ad)) score += 80;

  if (camKapili && /\.24\b|cam\s*kap|cift\s*inox\s*kapi/i.test(ad)) score += 35;

  if (reqDoors != null) {
    const doorM = ad.match(/(\d)\s*(?:inox\s*)?kap|(\d)\s*kapili|üç|iki|tek|dört|dort/i);
    const doors =
      doorM?.[1] != null
        ? Number(doorM[1])
        : /uc|üç|3\s*kap/.test(ad)
          ? 3
          : /iki|2\s*kap/.test(ad)
            ? 2
            : /tek|1\s*kap/.test(ad)
              ? 1
              : /dort|dört|4\s*kap/.test(ad)
                ? 4
                : null;
    if (doors != null && reqDoors !== doors) score -= 200;
    else if (doors === reqDoors) score += 100;
  }

  if (hasRequestedSize && reqDepth != null) {
    if (ad.includes(String(reqDepth))) score += 40;
    else if (sku.includes(String(reqDepth))) score += 30;
  }

  if (row.gorsel_url) score += 5;
  if (row.fiyat_tl > 0) score += 5;

  const refN = norm(referansIsim);
  const wantsPrepTop = /make\s*up|saladette|hazirlik|pizza\s*prep|havuz|sogutma\s*tezgah|sogutmali\s*tezgah|pizza\s*hazirlik/.test(
    refN,
  );
  if (family === "tezgah") {
    if (/yatay\s*tip|nmv|79e3\.|79e4\./i.test(`${ad} ${sku}`)) score += 120;
    if (!wantsPrepTop && /havuzlu|make\s*up|pizza\s*hazirlik|soguk\s*servis\s*bankosu|\.t1\b|\.s0\b/i.test(`${ad} ${sku}`)) {
      score -= 8000;
    }
    if (wantsPrepTop && /havuzlu|make\s*up|\.t1\b|pizza\s*hazirlik/i.test(ad)) score += 80;
  }

  return score;
}
