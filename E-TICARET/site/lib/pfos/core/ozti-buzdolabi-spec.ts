import type { AdminUrunRow } from "@/lib/legacy-catalog";
import { isOztiBuzdolabiRow } from "./ozti-marka";
import { isOztiKatalogMarka } from "./hazirlik-marka";

export type BuzFamily = "tezgah" | "cihazalti" | "dik" | "bar" | null;

/**
 * Öztiryakiler buzdolabı — PFOS ekonomik seri önceliği
 *
 * | Seri   | Kullanım              | Sac      | Örnek SKU        |
 * |--------|------------------------|----------|------------------|
 * | 79K4   | Dik tip buzdolabı (K)  | 430      | 79K4.06NMV.00    |
 * | 79E3/4 | Tezgah / yatay NMV-LMV | 304 eco  | 79E3.27NMV.00    |
 * | 7919   | Premium / cihaz altı   | 304      | 7919.06NMV.00    |
 *
 * @see pfos-tip-shop-links.json — tip başına doğrulanmış en ucuz SKU
 */

function norm(s: string): string {
  return String(s ?? "")
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/\s+/g, " ")
    .trim();
}

export function isOztiEcoKTipSku(sku: string | null | undefined): boolean {
  return /^79k4\./i.test(String(sku ?? "").trim());
}

export function isOztiEcoYataySku(sku: string | null | undefined): boolean {
  return /^79e[34]\./i.test(String(sku ?? "").trim());
}

/** Ölçü genişliği + kapı → 7919 NTV/NMV önek (tezgah/dik; cihaz altı için oztiNtvCihazaltiPrefix) */
export function oztiNtvPrefix(kapi: number, widthCm: number): string {
  if (kapi <= 1 && widthCm < 100) return "06";
  if (kapi >= 4 || widthCm >= 220) return "47";
  if (kapi >= 3 || widthCm >= 165) return "37";
  if (kapi >= 2 || widthCm >= 105) return "27";
  return "27";
}

/**
 * 7919 NTV tezgah altı — Öztiryakiler fiyat listesi seri kodu.
 * 360/370 = 160/170 cm genişlik × 60 cm derinlik; 460/470 = × 70 cm derinlik.
 */
export function oztiNtvCihazaltiPrefix(
  widthCm: number,
  depthCm: 60 | 70,
): string {
  const w = Math.round(widthCm);
  if (w >= 155) {
    const wide = w >= 165;
    if (depthCm === 70) return wide ? "47" : "46";
    return wide ? "37" : "36";
  }
  return depthCm === 70 ? "27" : "26";
}

export function isCekmeceliCihazaltiReferans(isim: string): boolean {
  const n = norm(isim);
  if (/kapili|kapılı|kapi\s*li/.test(n) && !/cekmeceli|çekmeceli|cekmece|çekmece/.test(n)) {
    return false;
  }
  return /cekmeceli|çekmeceli|cekmece|çekmece/.test(n);
}

export function isKapiliCihazaltiReferans(isim: string): boolean {
  const n = norm(isim);
  return /kapili|kapılı|\d\s*kapili|tek\s*kap|iki\s*kap|uc\s*kap|dort\s*kap|dört\s*kap/.test(
    n,
  );
}

function nmvSuffix(camKapili: boolean): string {
  return camKapili ? "01" : "00";
}

function lmvSuffix(camKapili: boolean): string {
  return camKapili ? "10" : "00";
}

/** PFOS — tercih sırasına göre katalog SKU adayları (en ucuz seri önce) */
export function oztiPreferredBuzSkus(
  family: BuzFamily,
  kapi: number,
  widthCm: number,
  freezer: boolean,
  camKapili: boolean,
  depthCm: 60 | 70 = 70,
  referansIsim?: string | null,
): string[] {
  const p = oztiNtvPrefix(kapi, widthCm);
  const depthSeries = depthCm === 60 ? "79E4" : "79E3";

  if (family === "tezgah") {
    const eco = `${depthSeries}.${p}NMV.${nmvSuffix(camKapili)}`;
    if (camKapili) return [eco, `7919.${p}NTV.24`];
    return [eco];
  }

  if (family === "cihazalti") {
    const prefix = oztiNtvCihazaltiPrefix(widthCm, depthCm);
    const cekmeceli =
      referansIsim != null && isCekmeceliCihazaltiReferans(referansIsim);
    const kapili =
      referansIsim != null && isKapiliCihazaltiReferans(referansIsim);
    const c2 = `7919.${prefix}NTV.C2`;
    const c1 = `7919.${prefix}NTV.C1`;
    if (cekmeceli && !kapili) return [c2, c1];
    if (kapili && !cekmeceli) return [c1, c2];
    return [c2, c1];
  }

  if (family === "dik") {
    if (freezer) {
      const ecoLmv = `${depthSeries}.${p}LMV.${lmvSuffix(camKapili)}`;
      if (kapi <= 1) {
        return [ecoLmv, "7919.06LMV.00", "7919.06LMV.10"];
      }
      return [ecoLmv, "7919.12LMV.00", "7919.12LMV.10"];
    }
    const k4Prefix = kapi <= 1 ? "06" : "12";
    const eco = `79K4.${k4Prefix}NMV.${nmvSuffix(camKapili)}`;
    if (kapi <= 1) {
      return [eco, "7919.06NMV.00", "7919.06NMV.01"];
    }
    return [eco, "7919.12NMV.00", "7919.12NMV.01"];
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

  if (family === "dik" && isOztiEcoKTipSku(sku)) score += 320;
  if ((family === "tezgah" || family === "cihazalti") && isOztiEcoYataySku(sku)) {
    score += 180;
  }
  if (/430\s*kalite|430\s*k\s*tip|\bk\s*tip\b/.test(ad) && family === "dik") score += 80;
  if (family === "dik" && /^7919\./i.test(sku) && !freezer) score -= 120;

  if (family === "tezgah" && /tezgah|yatay\s*tip|nmv|tag\s*\d+\s*nmv/i.test(ad)) {
    score += 80;
  }
  if (family === "cihazalti" && /cihaz\s*alti|cihazalti/.test(ad)) score += 80;
  if (family === "cihazalti") {
    const refN = norm(referansIsim);
    const wantCekmece = /cekmeceli|çekmeceli|cekmece|çekmece/.test(refN);
    const wantKapi =
      /kapili|kapılı|\d\s*kapili/.test(refN) && !wantCekmece;
    if (wantCekmece && /\.C2\b/i.test(sku)) score += 350;
    if (wantCekmece && /\.C1\b/i.test(sku)) score -= 350;
    if (wantKapi && /\.C1\b/i.test(sku)) score += 350;
    if (wantKapi && /\.C2\b/i.test(sku)) score -= 200;
  }
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
