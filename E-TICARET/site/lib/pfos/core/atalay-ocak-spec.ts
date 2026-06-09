import type { AdminUrunRow } from "@/lib/legacy-catalog";

export type OcakFuel = "gaz" | "elektrik" | "induksiyon";

function norm(s: string | null | undefined): string {
  return String(s ?? "")
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/\s+/g, " ")
    .trim();
}

/** Referans metninden ocak yakıt tipi */
export function parseOcakFuelFromReferans(...parts: Array<string | null | undefined>): OcakFuel | null {
  const n = norm(parts.filter(Boolean).join(" "));
  if (!n) return null;
  if (/induksiyon|indüksiyon/.test(n)) return "induksiyon";
  if (/gazli|gazlı|\bgaz\b|lpg|dogalgaz|dogal gaz|acik alev|açık alev|mavi alev/.test(n)) {
    return "gaz";
  }
  if (/elektrik|elk\.|resistans|dokum plaka|döküm plaka/.test(n)) return "elektrik";
  return null;
}

/** Referans metninden göz / brülör sayısı */
export function parseOcakBurnerCount(...parts: Array<string | null | undefined>): number | null {
  const n = norm(parts.filter(Boolean).join(" "));
  if (!n) return null;
  const direct = n.match(
    /(\d+)\s*(?:acik alev|açık alev|gozlu|gözlü|goz|göz|brulor|brülör|plaka|gobek|göbek)/,
  );
  if (direct) return Number(direct[1]);
  if (/\bdort\b|\bdört\b|\b4\s*goz|\b4\s*gözlü/.test(n)) return 4;
  if (/\biki\b|\b2\s*goz|\b2\s*gözlü/.test(n)) return 2;
  if (/\buc\b|\büç\b|\b3\s*goz/.test(n)) return 3;
  if (/\balti\b|\baltı\b|\b6\s*goz/.test(n)) return 6;
  return null;
}

function olcuParts(olcu: string): number[] {
  return [...String(olcu).matchAll(/(\d+(?:[.,]\d+)?)/g)]
    .map((m) => Number(m[1].replace(",", ".")))
    .filter((n) => Number.isFinite(n) && n >= 8);
}

/** Atalay ocak SKU son eki — ölçüden (cm) */
export function ocakSkuSuffixesFromOlcu(olcu: string): string[] {
  const nums = olcuParts(olcu);
  const w = nums[0] ?? 0;
  const d = nums[1] ?? 0;
  const seri730 = d >= 65;

  if (w >= 115) return seri730 ? ["1273"] : ["1270", "1290", "1060"];
  if (w >= 95) return seri730 ? ["1273"] : ["1060", "1270"];
  if (w >= 75) return seri730 ? ["873", "890", "870"] : ["860", "890", "870"];
  if (w >= 55) return seri730 ? ["673"] : ["660", "670"];
  if (w >= 35) return seri730 ? ["473", "470"] : ["460", "470", "360"];
  return [];
}

export function ocakFuelFromRow(row: {
  sku?: string | null;
  ad?: string | null;
  kategori?: string | null;
}): OcakFuel | null {
  const sku = String(row.sku ?? "").toUpperCase();
  const blob = norm(`${row.ad ?? ""} ${row.kategori ?? ""}`);
  if (/^AIO-/.test(sku) || /induksiyon|indüksiyon/.test(blob)) return "induksiyon";
  if (/^A(?:GO|EAGO)-|^EAGO/.test(sku) || /\bgaz\b|gazli|gazlı/.test(blob)) return "gaz";
  if (/^AE[O]|^EAEO-/.test(sku) || /elektrik/.test(blob)) return "elektrik";
  return null;
}

export function ocakBurnerCountFromRow(row: {
  ad?: string | null;
  kategori?: string | null;
}): number | null {
  const blob = norm(`${row.ad ?? ""} ${row.kategori ?? ""}`);
  const plaka = blob.match(/plaka:\s*(\d+)/);
  if (plaka) return Number(plaka[1]);
  const inline = String(row.ad).match(/-\s*\d+\s+(\d)\s+\d{3,4}\s*x/i);
  if (inline) return Number(inline[1]);
  const mult = String(row.ad).match(/(\d)\s*x\s*[oøØ]/i);
  if (mult) return Number(mult[1]);
  return null;
}

export function ocakFuelMismatch(
  referansFuel: OcakFuel | null,
  row: Parameters<typeof ocakFuelFromRow>[0],
): boolean {
  if (!referansFuel) return false;
  const rowFuel = ocakFuelFromRow(row);
  return rowFuel !== null && rowFuel !== referansFuel;
}

export function preferredOcakSkus(
  referansIsim: string,
  olcu: string,
  notlar?: string | null,
): string[] {
  const blob = `${referansIsim} ${olcu} ${notlar ?? ""}`;
  const fuel = parseOcakFuelFromReferans(blob);
  const suffixes = ocakSkuSuffixesFromOlcu(olcu);
  const prefixes: string[] =
    fuel === "gaz"
      ? ["AGO", "EAGO"]
      : fuel === "elektrik"
        ? ["AEO", "EAEO"]
        : fuel === "induksiyon"
          ? ["AIO"]
          : ["AGO", "EAGO", "AEO", "EAEO"];

  const out: string[] = [];
  for (const prefix of prefixes) {
    for (const suffix of suffixes) {
      out.push(`${prefix}-${suffix}`);
      if (prefix.startsWith("E") && prefix.length > 4) {
        out.push(`${prefix.replace(/-/g, "")}${suffix}`);
      }
    }
  }
  return [...new Set(out)];
}

export function scoreOcakRow(
  row: AdminUrunRow,
  referansIsim: string,
  olcu: string,
  notlar: string | null | undefined,
  preferred: string[],
): number {
  const blob = `${referansIsim} ${olcu} ${notlar ?? ""}`;
  const refFuel = parseOcakFuelFromReferans(blob);
  const refBurners = parseOcakBurnerCount(blob);
  if (ocakFuelMismatch(refFuel, row)) return -9999;

  const ad = norm(row.ad);
  if (/wok|konveyorlu izgar|konveyörlü izgar|krep|tost|makarna|doner|döner/.test(ad)) {
    return -9999;
  }

  let score = 0;
  const sku = String(row.sku ?? "").toUpperCase();
  if (preferred.some((p) => norm(sku) === norm(p))) score += 500;

  const rowFuel = ocakFuelFromRow(row);
  if (refFuel && rowFuel === refFuel) score += 200;

  const rowBurners = ocakBurnerCountFromRow(row);
  if (refBurners && rowBurners === refBurners) score += 150;
  else if (refBurners && rowBurners && Math.abs(refBurners - rowBurners) >= 2) return -9999;

  return score;
}
