import type { AdminUrunRow } from "@/lib/legacy-catalog";
import type { EslesmisUrun } from "../schemas/pfos.schema";
import { enrichEslesmisFromKatalogRow } from "./catalog-enrich";
import { normalizePfosGorselUrl } from "./katalog-gorsel-url";
import { equstoSatisEurFromRow } from "./shop-catalog-match";

type EnrichOpts = Parameters<typeof enrichEslesmisFromKatalogRow>[1];

/** ekipmanlar.json satırı → PFOS eşleşmesi (fiyat yalnızca katalog alanlarından) */
export function katalogRowToEslesmis(
  row: AdminUrunRow,
  enrichOpts: EnrichOpts = {},
): EslesmisUrun {
  const enriched = enrichEslesmisFromKatalogRow(row, enrichOpts);
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
    fiyatEur: equstoSatisEurFromRow(row),
    doviz: "TRY",
    gorselUrl: normalizePfosGorselUrl(row.gorsel_url),
  };
}
