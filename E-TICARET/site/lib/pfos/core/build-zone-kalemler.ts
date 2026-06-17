import { kategoriForZone } from "./zone-kategori-map";
import {
  loadZoneCatalog,
  qtyForZoneProduct,
  type ZoneCatalogProduct,
} from "./zone-catalog-loader";
import type { EslesmisUrun, FiyatStratejisi, PFOSKalemi } from "../schemas/pfos.schema";
import { olcuMmFromSku } from "../teklif/olcu-mm";
import { zoneLabel } from "../wizard/zone-labels";
import { matchProductForMotor } from "./match-product";

function catalogToEslesmis(p: ZoneCatalogProduct): EslesmisUrun {
  const fiyat = Math.round(Number(p.unit_price_try) || 0);
  return {
    id: `catalog-${p.id}`,
    sku: p.tip_kodu || p.id,
    ad: p.name,
    marka: p.marka || "—",
    model: p.dimensions ?? null,
    olcu: olcuMmFromSku(p.tip_kodu) ?? null,
    elektrikGucuKw:
      p.elk_kw != null && Number.isFinite(Number(p.elk_kw))
        ? Number(p.elk_kw)
        : null,
    gazGucuKw:
      p.gaz_kw != null && Number.isFinite(Number(p.gaz_kw))
        ? Number(p.gaz_kw)
        : null,
    fiyat,
    doviz: "TRY",
    gorselUrl: null,
  };
}

function tipFromClassification(c?: string): "zorunlu" | "tavsiye" | "opsiyonel" {
  return c === "OPS" ? "opsiyonel" : "zorunlu";
}

export async function buildZoneCatalogKalemler(opts: {
  zoneKeys: string[];
  bolumM2: Record<string, number>;
  fiyatStratejisi: FiyatStratejisi;
}): Promise<PFOSKalemi[]> {
  const bundle = await loadZoneCatalog();
  const kalemler: PFOSKalemi[] = [];
  let zoneOrdinal = 0;

  for (const zoneKey of opts.zoneKeys) {
    const zoneM2 = opts.bolumM2[zoneKey] ?? 0;
    if (zoneM2 <= 0) continue;

    const block = bundle.catalog[zoneKey];
    const products = block?.products ?? [];
    const kat = kategoriForZone(zoneKey);
    let productIdx = 0;

    for (const p of products) {
      if (!p.tip_kodu) continue;
      if (p.tip_kodu === "dilimleme_makinesi") {
        if (zoneKey === "sebze_hazirlik") continue;
        if (zoneKey !== "et_hazirlik") continue;
      }
      if (p.classification === "OPS") continue;
      const adet = qtyForZoneProduct(zoneM2, p);
      if (adet <= 0) continue;

      let urun = await matchProductForMotor(
        p.tip_kodu,
        kat,
        opts.fiyatStratejisi,
        p.name,
        p.dimensions
          ? `ölçü: ${String(p.dimensions).replace(/×/g, "*")}`
          : null,
      );
      if (!urun && Number(p.unit_price_try) > 0) {
        urun = catalogToEslesmis(p);
      }

      kalemler.push({
        poz: "",
        kategoriKodu: kat as PFOSKalemi["kategoriKodu"],
        urunTipi: p.tip_kodu,
        isim: p.name,
        tip: tipFromClassification(p.classification),
        adet,
        elektrikGucuKwHint:
          p.elk_kw != null ? Number(p.elk_kw) : undefined,
        gazGucuKwHint: p.gaz_kw != null ? Number(p.gaz_kw) : undefined,
        urun,
        zoneKey,
        zoneLabel: zoneLabel(zoneKey),
        kaynak: "zone-catalog",
        sablonSira: zoneOrdinal * 1000 + productIdx,
      });
      productIdx += 1;
    }
    zoneOrdinal += 1;
  }

  return kalemler;
}
