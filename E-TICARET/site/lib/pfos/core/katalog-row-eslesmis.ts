import type { AdminUrunRow } from "@/lib/legacy-catalog";
import { resolveKwFromSources } from "@/lib/catalog/kw-resolve";
import type { EslesmisUrun } from "../schemas/pfos.schema";
import { enrichEslesmisFromKatalogRow } from "./catalog-enrich";
import { normalizePfosGorselUrl } from "./katalog-gorsel-url";
import { equstoSatisEurFromRow } from "./shop-catalog-match";
import { buildCatalogTeklifAciklama } from "../teklif/catalog-teklif-aciklama";

type EnrichOpts = Parameters<typeof enrichEslesmisFromKatalogRow>[1];

function teklifAciklamaFromAdminRow(row: AdminUrunRow): string | null {
  const text = buildCatalogTeklifAciklama({
    description: row.detay,
    ozti_web_description: row.ozti_web_description,
    inoksan_shop_description: row.inoksan_shop_description,
    pimak_web_description: row.pimak_web_description,
    teknik_ozellikler: row.teknik_ozellikler,
    specs: row.aciklama,
    aciklama: row.ad,
  });
  return text.trim() || null;
}

/** ekipmanlar.json satırı → PFOS eşleşmesi (fiyat yalnızca katalog alanlarından) */
export function katalogRowToEslesmis(
  row: AdminUrunRow,
  enrichOpts: EnrichOpts = {},
): EslesmisUrun {
  const enriched = enrichEslesmisFromKatalogRow(row, enrichOpts);
  const kw = resolveKwFromSources({ ...row, sku: row.sku, urunAd: row.ad });
  return {
    id: row.id,
    slug: row.id.replace(/^ecom_/, ""),
    sku: row.sku,
    ad: row.ad,
    marka: enriched.marka,
    model: enriched.model,
    olcu: enriched.olcu,
    elektrikGucuKw: kw.elektrikGucuKw,
    gazGucuKw: kw.gazGucuKw,
    fiyat: row.fiyat_tl,
    fiyatEur: equstoSatisEurFromRow(row),
    doviz: "TRY",
    gorselUrl: normalizePfosGorselUrl(row.gorsel_url),
    teklifAciklama: teklifAciklamaFromAdminRow(row),
  };
}
