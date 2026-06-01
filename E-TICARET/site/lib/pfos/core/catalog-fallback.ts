import type { EslesmisUrun } from "../schemas/pfos.schema";
import { enrichEslesmisFromKatalogRow } from "./catalog-enrich";
import {
  loadZoneCatalog,
  type ZoneCatalogProduct,
} from "./zone-catalog-loader";
import { matchShopCatalog } from "./shop-catalog-match";
import { normalizeTipKodu, resolveTipKodu, URUN_TIPI_ALIASES } from "./tip-kodu";
import {
  buildOzelImalatEslesmis,
  displayIsimFromSablon,
  isOzelImalatMotor,
} from "./ozel-imalat";

export { URUN_TIPI_ALIASES, normalizeTipKodu, resolveTipKodu };

let tipKoduIndex: Map<string, ZoneCatalogProduct> | null = null;

async function getTipKoduIndex(): Promise<Map<string, ZoneCatalogProduct>> {
  if (tipKoduIndex) return tipKoduIndex;
  const bundle = await loadZoneCatalog();
  tipKoduIndex = new Map();
  for (const block of Object.values(bundle.catalog)) {
    for (const product of block.products ?? []) {
      if (!product.tip_kodu) continue;
      const key = normalizeTipKodu(product.tip_kodu);
      if (!tipKoduIndex.has(key)) tipKoduIndex.set(key, product);
    }
  }
  return tipKoduIndex;
}

function catalogProductToEslesmis(p: ZoneCatalogProduct): EslesmisUrun {
  const fiyat = Math.round(Number(p.unit_price_try) || 0);
  const pseudoRow = {
    id: `catalog-${p.id}`,
    ad: p.name,
    sku: p.tip_kodu || p.id,
    tip_kodu: p.tip_kodu || null,
    kategori: "",
    kategori_ad: "",
    marka_id: null,
    marka_ad: p.marka || "—",
    model: p.dimensions ?? null,
    stok: 0,
    fiyat_tl: fiyat,
    el_guc: null,
    gaz_guc: null,
    aciklama: null,
    gorsel_url: null,
    durum: "aktif" as const,
    proje_fab_aktif: true,
  };
  const enriched = enrichEslesmisFromKatalogRow(pseudoRow, {
    zoneMarka: p.marka,
    zoneOlcu: p.dimensions,
    sablonIsim: p.name,
  });
  return {
    id: pseudoRow.id,
    sku: pseudoRow.sku,
    ad: p.name,
    marka: enriched.marka,
    model: enriched.model,
    olcu: enriched.olcu,
    elektrikGucuKw:
      p.elk_kw != null && Number.isFinite(Number(p.elk_kw))
        ? Number(p.elk_kw)
        : null,
    gazGucuKw:
      p.gaz_kw != null && Number.isFinite(Number(p.gaz_kw))
        ? Number(p.gaz_kw)
        : null,
    fiyat: Math.round(Number(p.unit_price_try) || 0),
    doviz: "TRY",
    gorselUrl: null,
  };
}

async function matchZoneCatalog(urunTipi: string): Promise<EslesmisUrun | null> {
  const index = await getTipKoduIndex();
  const tip = resolveTipKodu(urunTipi);
  const candidates = [
    tip,
    urunTipi,
    normalizeTipKodu(urunTipi),
    URUN_TIPI_ALIASES[urunTipi],
  ].filter(Boolean);

  for (const key of candidates) {
    const product = index.get(normalizeTipKodu(String(key)));
    if (product && Number(product.unit_price_try) > 0) {
      return catalogProductToEslesmis(product);
    }
  }
  return null;
}

/**
 * DB eşleşmesi yoksa: önce e-ticaret (ekipmanlar.json), sonra zone katalog statik fiyat.
 */
export async function matchCatalogFallback(
  urunTipi: string,
  fiyatStratejisi: "ekonomik" | "orta" | "premium" = "ekonomik",
  sablonIsim?: string | null,
): Promise<EslesmisUrun | null> {
  if (isOzelImalatMotor({ sablonIsim, urunTipi })) return null;
  const shop = await matchShopCatalog(urunTipi, fiyatStratejisi);
  if (shop) return shop;
  return matchZoneCatalog(urunTipi);
}

/** Portashelf / özel imalat — katalog SKU yok; zone medyan fiyat + Equsto marka */
export async function matchOzelImalatForSablon(
  isim: string,
  urunTipi: string,
  notlar?: string | null,
): Promise<EslesmisUrun> {
  const zone = await matchZoneCatalog(urunTipi);
  return buildOzelImalatEslesmis({
    isim: displayIsimFromSablon(isim) || isim,
    urunTipi,
    notlar,
    fiyatTry: zone?.fiyat ?? 0,
    elektrikGucuKw: zone?.elektrikGucuKw ?? null,
    gazGucuKw: zone?.gazGucuKw ?? null,
  });
}
