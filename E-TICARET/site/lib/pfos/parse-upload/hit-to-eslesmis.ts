import { ecomRowToAdminUrun } from "@/lib/admin-urun";
import type { CatalogSearchHit } from "@/lib/catalog-search-fallback";
import { getCatalogLookupMaps } from "@/lib/catalog-search-fallback";
import { loadLegacyCatalogRows } from "@/lib/legacy-catalog";
import { enrichEslesmisFromKatalogRow } from "@/lib/pfos/core/catalog-enrich";
import { equstoSatisEurFromRow } from "@/lib/pfos/core/shop-catalog-match";
import type { EslesmisUrun } from "@/lib/pfos/schemas/pfos.schema";
import { getTcmbEurForPricing } from "@/lib/tcmb-kur";
import { enrichEslesmisGorsel } from "@/lib/pfos/core/katalog-gorsel";

function gorselFromHit(hit: CatalogSearchHit): string | null {
  const img = String(hit.image || "").trim();
  if (!img) return null;
  return img.startsWith("/") ? img : `/${img.replace(/^\/+/, "")}`;
}

/** Meilisearch hit → PFOS EslesmisUrun (katalog satırı üzerinden fiyat/güç) */
async function hitToEslesmisRaw(
  hit: CatalogSearchHit,
): Promise<EslesmisUrun | null> {
  const maps = await getCatalogLookupMaps();
  let row = maps.byMeiliId.get(hit.id);
  if (!row && hit.slug) {
    row =
      maps.byCatalogSlug.get(hit.slug.toLowerCase()) ||
      maps.byLegacySlug.get(hit.slug.toLowerCase());
  }

  if (row) {
    const idx = maps.rows.indexOf(row);
    const admin = ecomRowToAdminUrun(
      row as Parameters<typeof ecomRowToAdminUrun>[0],
      idx >= 0 ? idx : 0,
    );
    const eur = equstoSatisEurFromRow(admin);
    const meiliEur = hit.satis_eur_indirimli ?? hit.liste_fiyati_eur;
    const hasPrice =
      admin.fiyat_tl > 0 || (eur != null && eur > 0) || (meiliEur != null && meiliEur > 0);
    if (!hasPrice) return null;
    const enriched = enrichEslesmisFromKatalogRow(admin);
    return {
      id: admin.id,
      slug: hit.slug || admin.id.replace(/^ecom_/, ""),
      sku: admin.sku,
      ad: admin.ad || hit.name,
      marka: enriched.marka || hit.brand || "—",
      model: enriched.model || hit.model || null,
      olcu: enriched.olcu || null,
      elektrikGucuKw: admin.el_guc,
      gazGucuKw: admin.gaz_guc,
      fiyat: admin.fiyat_tl,
      fiyatEur: eur ?? (meiliEur != null && meiliEur > 0 ? meiliEur : null),
      doviz: "TRY",
      gorselUrl: admin.gorsel_url || gorselFromHit(hit),
    };
  }

  const sku = hit.sku?.trim();
  if (sku) {
    const rows = await loadLegacyCatalogRows();
    const admin = rows.find(
      (r) => r.durum === "aktif" && r.sku && r.sku === sku,
    );
    if (admin) {
      const eurSku = equstoSatisEurFromRow(admin);
      const meiliEur = hit.satis_eur_indirimli ?? hit.liste_fiyati_eur;
      if (!(admin.fiyat_tl > 0 || (eurSku != null && eurSku > 0) || (meiliEur != null && meiliEur > 0))) {
        return null;
      }
      const enriched = enrichEslesmisFromKatalogRow(admin);
      return {
        id: admin.id,
        slug: hit.slug || admin.id.replace(/^ecom_/, ""),
        sku: admin.sku,
        ad: admin.ad || hit.name,
        marka: enriched.marka || hit.brand || "—",
        model: enriched.model || hit.model || null,
        olcu: enriched.olcu || null,
        elektrikGucuKw: admin.el_guc,
        gazGucuKw: admin.gaz_guc,
        fiyat: admin.fiyat_tl,
        fiyatEur: equstoSatisEurFromRow(admin),
        doviz: "TRY",
        gorselUrl: admin.gorsel_url || gorselFromHit(hit),
      };
    }
  }

  const fiyatEur = hit.satis_eur_indirimli ?? hit.liste_fiyati_eur;
  if (fiyatEur != null && fiyatEur > 0) {
    const tcmb = await getTcmbEurForPricing();
    const fiyatTry = Math.round(fiyatEur * tcmb.rate * 100) / 100;
    return {
      id: hit.id,
      slug: hit.slug,
      sku: hit.sku || null,
      ad: hit.name,
      marka: hit.brand || "—",
      model: hit.model || null,
      olcu: null,
      elektrikGucuKw: null,
      gazGucuKw: null,
      fiyat: fiyatTry,
      fiyatEur,
      doviz: "TRY",
      gorselUrl: gorselFromHit(hit),
    };
  }

  return null;
}

export async function hitToEslesmis(
  hit: CatalogSearchHit,
): Promise<EslesmisUrun | null> {
  const urun = await hitToEslesmisRaw(hit);
  if (!urun) return null;
  return enrichEslesmisGorsel(urun);
}
