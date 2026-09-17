import { buildCatalogTeklifAciklama } from "./catalog-teklif-aciklama";
import { olcuForTeklifUrun } from "./format-v14";
import type { TeklifModelV14, TeklifV14Satir } from "./teklif-v14.types";

export type TeklifCatalogHit = {
  name: string;
  brand: string;
  sku: string;
  model?: string;
  image?: string;
  specs?: string;
  liste_fiyati_eur?: number | null;
  satis_eur_indirimli?: number | null;
};

function eurFromHit(hit: TeklifCatalogHit): number | null {
  const n = Number(hit.satis_eur_indirimli ?? hit.liste_fiyati_eur);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
}

export function applyCatalogHitToSatir(
  satir: TeklifV14Satir,
  hit: TeklifCatalogHit,
): TeklifV14Satir {
  const adet = Math.max(1, Math.round(satir.adet || 1));
  const birim = eurFromHit(hit);
  const aciklama = buildCatalogTeklifAciklama({
    specs: hit.specs,
    aciklama: hit.name,
  });
  return {
    ...satir,
    stokNo: String(hit.sku || satir.stokNo || "").trim(),
    tanim: String(hit.name || satir.tanim || "").trim(),
    marka: String(hit.brand || satir.marka || "").trim(),
    olcu: olcuForTeklifUrun({
      sku: hit.sku,
      model: hit.model,
      olcu: hit.model,
    }),
    birimSatis: birim,
    toplamSatis: birim != null ? Math.round(birim * adet * 100) / 100 : null,
    doviz: "EUR",
    fotoUrl: String(hit.image || satir.fotoUrl || "").trim() || undefined,
    aciklama: aciklama || satir.aciklama,
  };
}

export function recomputeTeklifV14Ozet(model: TeklifModelV14): TeklifModelV14 {
  const satirlar = model.satirlar.map((s) => {
    const adet = Math.max(0, Number(s.adet) || 0);
    const birim = s.birimSatis;
    const toplam =
      birim != null && Number.isFinite(birim)
        ? Math.round(birim * adet * 100) / 100
        : null;
    return { ...s, adet: adet || 1, toplamSatis: toplam };
  });
  const genel = satirlar.reduce((n, s) => n + (s.toplamSatis ?? 0), 0);
  return {
    ...model,
    satirlar,
    ozet: {
      ...model.ozet,
      toplamElektrikKw: satirlar.reduce(
        (n, s) => n + (s.elkKw ?? 0) * (s.adet || 0),
        0,
      ),
      toplamGazKw: satirlar.reduce(
        (n, s) => n + (s.gazKw ?? 0) * (s.adet || 0),
        0,
      ),
      genelToplam: genel > 0 ? Math.round(genel * 100) / 100 : null,
    },
  };
}

export function emptyTeklifSatir(opts: {
  bolumNo: string;
  bolumBaslik: string;
  poz: string;
}): TeklifV14Satir {
  return {
    bolumNo: opts.bolumNo,
    bolumBaslik: opts.bolumBaslik,
    poz: opts.poz,
    stokNo: "",
    tanim: "",
    marka: "",
    olcu: "—",
    elkKw: null,
    gazKw: null,
    adet: 1,
    birimSatis: null,
    toplamSatis: null,
    doviz: "EUR",
  };
}
