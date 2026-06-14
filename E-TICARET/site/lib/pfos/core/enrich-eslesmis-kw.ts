import type { AdminUrunRow } from "@/lib/admin-urun";
import {
  isPasifPfosEkipman,
  resolveKwFromSources,
} from "@/lib/catalog/kw-resolve";
import { loadLegacyCatalogRows } from "@/lib/legacy-catalog";
import type { EslesmisUrun } from "../schemas/pfos.schema";

function normSku(s: string | null | undefined): string {
  return String(s ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

function kwFromAdminRow(row: AdminUrunRow) {
  return resolveKwFromSources({
    sku: row.sku,
    urunAd: row.ad,
    el_guc: row.el_guc,
    gaz_guc: row.gaz_guc,
    aciklama: row.aciklama,
    detay: row.detay,
    description: row.description,
    ozti_web_description: row.ozti_web_description,
    inoksan_shop_description: row.inoksan_shop_description,
    teknik_ozellikler: row.teknik_ozellikler,
    olculer: row.olculer,
  });
}

/** Eşleşmiş ürüne katalogdan kW zenginleştirme */
export async function enrichEslesmisUrunKw(
  urun: EslesmisUrun | null,
  ctx: { isim?: string | null; urunTipi?: string | null },
): Promise<EslesmisUrun | null> {
  if (!urun) return null;

  if (
    isPasifPfosEkipman({
      isim: ctx.isim,
      urunTipi: ctx.urunTipi,
      sku: urun.sku,
      urunAd: urun.ad,
    })
  ) {
    return { ...urun, elektrikGucuKw: null, gazGucuKw: null };
  }

  let elk = urun.elektrikGucuKw;
  let gaz = urun.gazGucuKw;

  if ((elk == null || elk <= 0) && (gaz == null || gaz <= 0) && urun.sku?.trim()) {
    const rows = await loadLegacyCatalogRows();
    const row = rows.find((r) => normSku(r.sku) === normSku(urun.sku));
    if (row) {
      const kw = kwFromAdminRow(row);
      if (elk == null || elk <= 0) elk = kw.elektrikGucuKw;
      if (gaz == null || gaz <= 0) gaz = kw.gazGucuKw;
    }
  }

  return {
    ...urun,
    elektrikGucuKw: elk != null && elk > 0 ? elk : null,
    gazGucuKw: gaz != null && gaz > 0 ? gaz : null,
  };
}
