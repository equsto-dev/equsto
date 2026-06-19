import type { AdminUrunRow } from "@/lib/admin-urun";
import {
  isPasifPfosEkipman,
  resolveKwFromSources,
} from "@/lib/catalog/kw-resolve";
import { loadLegacyCatalogRows } from "@/lib/legacy-catalog";
import type { EslesmisUrun } from "../schemas/pfos.schema";
import { teklifAciklamaFromAdminRow } from "./katalog-row-eslesmis";

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
    pimak_web_description: row.pimak_web_description,
    teknik_ozellikler: row.teknik_ozellikler,
    olculer: row.olculer,
  });
}

function kwMissing(v: number | null | undefined): boolean {
  return v == null || !Number.isFinite(v) || v <= 0;
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
  let teklifAciklama = urun.teklifAciklama;

  const needsElk = kwMissing(elk);
  const needsGaz = kwMissing(gaz);
  const needsAciklama = !teklifAciklama?.trim();

  if ((needsElk || needsGaz || needsAciklama) && urun.sku?.trim()) {
    const rows = await loadLegacyCatalogRows();
    const row = rows.find((r) => normSku(r.sku) === normSku(urun.sku));
    if (row) {
      const kw = kwFromAdminRow(row);
      if (needsElk && kw.elektrikGucuKw != null) elk = kw.elektrikGucuKw;
      if (needsGaz && kw.gazGucuKw != null) gaz = kw.gazGucuKw;
      if (needsAciklama) {
        teklifAciklama = teklifAciklamaFromAdminRow(row) ?? teklifAciklama;
      }
    }
  }

  return {
    ...urun,
    teklifAciklama: teklifAciklama ?? urun.teklifAciklama,
    elektrikGucuKw: !kwMissing(elk) ? elk : null,
    gazGucuKw: !kwMissing(gaz) ? gaz : null,
  };
}
