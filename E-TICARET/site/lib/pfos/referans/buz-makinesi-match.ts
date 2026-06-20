import {
  loadLegacyCatalogRows,
  type AdminUrunRow,
} from "@/lib/legacy-catalog";
import { katalogRowToEslesmis } from "../core/katalog-row-eslesmis";
import type { EslesmisUrun, FiyatStratejisi } from "../schemas/pfos.schema";
import {
  parseReferansNitelikleri,
  referansKatalogCeliski,
} from "./referans-nitelikleri";

function norm(s: string): string {
  return String(s ?? "")
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i");
}

export function isBuzMakinesiReferans(isim: string): boolean {
  return /buz\s+makin|buzmakin|ice maker|ice cube/.test(norm(isim)) && !/karbuz/.test(norm(isim));
}

function kgFromRow(ad: string): number | null {
  const m = norm(ad).match(/(\d+(?:[.,]\d+)?)\s*kg/);
  return m ? Number(m[1].replace(",", ".")) : null;
}

function rowToEslesmis(row: AdminUrunRow): EslesmisUrun {
  return katalogRowToEslesmis(row);
}

/** Buz makinesi — referans kg/gün + marka ile en yakın katalog; Brema yoksa yanlış SKU dönmez */
export async function matchBuzMakinesiByReferans(
  isim: string,
  notlar: string | null | undefined,
  _fiyatStratejisi: FiyatStratejisi,
): Promise<EslesmisUrun | null> {
  const ref = parseReferansNitelikleri(isim, notlar);
  const wantKg = ref.buzKgGun;

  const rows = (await loadLegacyCatalogRows()).filter(
    (r) =>
      r.durum === "aktif" &&
      r.fiyat_tl > 0 &&
      /buz mak|ice cube|ice maker/i.test(r.ad) &&
      !referansKatalogCeliski(isim, r.ad, notlar),
  );

  if (!rows.length) return null;

  if (wantKg == null) {
    rows.sort((a, b) => a.fiyat_tl - b.fiyat_tl);
    return rowToEslesmis(rows[0]);
  }

  const scored = rows
    .map((row) => {
      const kg = kgFromRow(row.ad);
      if (kg == null) return { row, score: -9999 };
      let score = 200 - Math.abs(kg - wantKg) * 4;

      const brand = norm(row.marka_ad || "");
      const ad = norm(row.ad);
      if (brand.includes("brema") || ad.includes("brema")) {
        score += 80;
      }
      return { row, score };
    })
    .filter((x) => x.score > 80)
    .sort((a, b) => b.score - a.score);

  if (!scored.length) return null;
  return rowToEslesmis(scored[0].row);
}
