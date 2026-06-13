import type { AdminUrunRow } from "@/lib/legacy-catalog";
import {
  ocakBurnerCountFromRow,
  ocakFuelMismatch,
  parseOcakBurnerCount,
  parseOcakFuelFromReferans,
} from "./atalay-ocak-spec";

function norm(s: string): string {
  return String(s ?? "")
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/\s+/g, " ")
    .trim();
}

function olcuParts(olcu: string): number[] {
  return [...String(olcu).matchAll(/(\d+(?:[.,]\d+)?)/g)]
    .map((m) => Number(m[1].replace(",", ".")))
    .filter((n) => Number.isFinite(n) && n >= 8);
}

function oztiOcakBase(olcu: string): string {
  const d = olcuParts(olcu)[1] ?? 70;
  return d >= 85 ? "7865.N1.80903" : "7865.N1.80703";
}

export function oztiOcakFuelFromRow(row: {
  sku?: string | null;
  ad?: string | null;
}): "gaz" | "elektrik" | "induksiyon" | null {
  const blob = norm(`${row.ad ?? ""} ${row.sku ?? ""}`);
  if (/induksiyon|indüksiyon|enduksiyon/.test(blob)) return "induksiyon";
  if (/gazli|gazlı|\bgaz\b/.test(blob)) return "gaz";
  if (/elektrik/.test(blob)) return "elektrik";
  return null;
}

export function preferredOztiOcakSkus(
  referansIsim: string,
  olcu: string,
  notlar?: string | null,
): string[] {
  const blob = `${referansIsim} ${olcu} ${notlar ?? ""}`;
  const fuel = parseOcakFuelFromReferans(blob);
  const burners = parseOcakBurnerCount(blob);
  const base = oztiOcakBase(olcu);

  if (fuel === "induksiyon") return [];
  if (fuel === "elektrik") return [`${base}.21`];
  if (burners === 4) return [`${base}.20`, `${base}.20P`];
  if (burners === 2) return [`${base}.20`];
  return [`${base}.53`, `${base}.20`];
}

export function scoreOztiOcakRow(
  row: AdminUrunRow,
  referansIsim: string,
  olcu: string,
  notlar: string | null | undefined,
  preferred: string[],
): number {
  const blob = `${referansIsim} ${olcu} ${notlar ?? ""}`;
  const refFuel = parseOcakFuelFromReferans(blob);
  if (refFuel && oztiOcakFuelFromRow(row) && oztiOcakFuelFromRow(row) !== refFuel) {
    return -9999;
  }

  let score = 0;
  const sku = String(row.sku ?? "").toUpperCase();
  if (preferred.some((p) => norm(sku) === norm(p))) score += 500;
  if (refFuel && oztiOcakFuelFromRow(row) === refFuel) score += 200;

  const refBurners = parseOcakBurnerCount(blob);
  const rowBurners = ocakBurnerCountFromRow(row);
  if (refBurners && rowBurners === refBurners) score += 150;

  return score;
}

export function preferredOztiPisirmeSkus(
  family: string | null,
  olcu: string,
  referansIsim = "",
  notlar?: string | null,
): string[] {
  const nums = olcuParts(olcu);
  const w = nums[0] ?? 0;
  const d = nums[1] ?? 0;
  const is900 = d >= 85;
  const is730 = d >= 65 && d < 85;
  const izgaraBase = is900 ? "7864.N1.80903" : "7864.N1.80703";
  const refN = norm(referansIsim);

  if (family === "ocak") {
    return preferredOztiOcakSkus(referansIsim, olcu, notlar);
  }
  if (family === "fritoz") {
    if (w >= 75 && is900) return ["7856.EF8DS.08", "7856.EF10D.S0"];
    return ["7856.GN120.08", "7856.GN12S.08", "7856.GN23S.10"];
  }
  if (family === "izgara") {
    if (/plate\s*izgar|grill plate/.test(refN)) {
      return [`${izgaraBase}.19`];
    }
    if (/lavatas|lavataş/.test(refN)) {
      return [`${izgaraBase}.20`];
    }
    if (/dokum\s*izgar/.test(refN)) {
      return [`${izgaraBase}.72`, `${izgaraBase}.70`];
    }
    return [`${izgaraBase}.72`, `${izgaraBase}.70`, `${izgaraBase}.19`, `${izgaraBase}.20`];
  }
  if (family === "makarna") {
    return is900
      ? ["7858.N1.80908.23", "7858.N1.80908.11"]
      : ["7858.N1.80708.23"];
  }
  if (family === "patates_dinlendirme") {
    return [];
  }
  return [];
}
