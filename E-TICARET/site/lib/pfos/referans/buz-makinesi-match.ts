import {
  loadLegacyCatalogRows,
  type AdminUrunRow,
} from "@/lib/legacy-catalog";
import { enrichEslesmisFromKatalogRow } from "../core/catalog-enrich";
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
  const enriched = enrichEslesmisFromKatalogRow(row, {});
  return {
    id: row.id,
    slug: row.id.replace(/^ecom_/, ""),
    sku: row.sku,
    ad: row.ad,
    marka: enriched.marka,
    model: enriched.model,
    olcu: enriched.olcu,
    elektrikGucuKw: row.el_guc,
    gazGucuKw: row.gaz_guc,
    fiyat: row.fiyat_tl,
    doviz: "TRY",
    gorselUrl: row.gorsel_url,
  };
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
      return { row, score: 200 - Math.abs(kg - wantKg) * 4 };
    })
    .filter((x) => x.score > 80)
    .sort((a, b) => b.score - a.score);

  if (!scored.length) return null;
  return rowToEslesmis(scored[0].row);
}
