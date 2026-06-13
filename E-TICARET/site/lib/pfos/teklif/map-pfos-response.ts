import type { PFOSResponse } from "@/lib/pfos/schemas/pfos.schema";
import type { TeklifModelV14, TeklifV14Satir } from "./teklif-v14.types";
import {
  TEKLIF_V14_FORM_NO,
  TEKLIF_V14_SARTLAR,
} from "./constants";
import {
  bolumForKalem,
  finalizeKalemlerForTeklif,
} from "./assign-poz";
import {
  birimEurFromEslesmis,
  formatTarihTr,
  isOlcuMetni,
  olcuForTeklifUrun,
  yeniTeklifSayisi,
} from "./format-v14";
import { resolveTeklifMarka } from "../core/catalog-enrich";
import {
  normalizePfosGorselUrl,
  oztiWebImageRelFromSku,
  portashelfGorselRelFromSku,
} from "../core/katalog-gorsel-url";
import { equstoPimakGorselRelFromSku } from "../core/equsto-pimak-gorsel";
import { isEqustoDavlumbazRow } from "../core/davlumbaz-marka";
import { displayIsimFromSablon } from "../core/ozel-imalat";
import { sanitizeDavlumbazOlcu } from "./davlumbaz-olcu";
import {
  formatPfosDisplayTanim,
  isProformaJunkText,
} from "../parse-upload/sanitize-tanim";
import { buildCatalogTeklifAciklama } from "./catalog-teklif-aciklama";
import { resolveTeklifKw } from "@/lib/catalog/kw-resolve";

function cleanObjectString(s: string | null | undefined): string {
  if (!s) return "";
  return s.replace(/\[object\s+object\]/gi, " ").replace(/\s+/g, " ").trim();
}

function specAciklama(
  k: PFOSResponse["kalemler"][number],
  _referansListe = false,
): string {
  const fromUrun = k.urun?.teklifAciklama?.trim();
  if (fromUrun) return cleanObjectString(fromUrun);
  const notlar = cleanObjectString(k.notlar);
  if (isProformaJunkText(notlar)) {
    return "";
  }
  return buildCatalogTeklifAciklama({
    description: null,
    teknik_ozellikler: null,
    specs: notlar || null,
    aciklama: formatPfosDisplayTanim(k.isim),
  });
}

/**
 * PFOSResponse → v14 proforma modeli.
 * Böl/Poz PFOS tarafından üretilir; Tanım = şablon metni (isim).
 * Fiyatlar TCMB kuru ile EUR'a çevrilir (şablon K/L sütunları).
 */
export function pfosResponseToTeklifV14(
  res: PFOSResponse,
  meta: {
    projeAdi?: string;
    musteri?: string;
    teslimatAdresi: string;
    bolumM2: Record<string, number>;
    eurTry?: number | null;
    sayi?: string;
  },
): TeklifModelV14 {
  const kalemler = finalizeKalemlerForTeklif(res.kalemler, res.teklifLayout);
  const referansListe =
    res.teklifLayout?.pozModu === "referans" ||
    kalemler.every((k) => !!k.referansPoz);
  const eurTry = meta.eurTry ?? null;
  const doviz: TeklifV14Satir["doviz"] = "EUR";

  const satirlar: TeklifV14Satir[] = kalemler.map((k) => {
    const u = k.urun;
    const adet = k.adet;
    const birimEur = birimEurFromEslesmis(u, eurTry);
    const { bolumNo, bolumBaslik } = bolumForKalem(k, res.teklifLayout);
    const stokNo = u?.sku?.trim() ?? "";

    let finalGorsel = portashelfGorselRelFromSku(stokNo) ??
        u?.gorselUrl ??
        equstoPimakGorselRelFromSku(stokNo, k.isim) ??
        (stokNo ? oztiWebImageRelFromSku(stokNo) : null);

    const sablonIsim = formatPfosDisplayTanim(k.isim);
    const isDavlumbazSku =
      isEqustoDavlumbazRow(stokNo) || /^(7885|9885)\./i.test(stokNo);
    if (isDavlumbazSku && !/davlumbaz/i.test(sablonIsim)) {
      finalGorsel =
        equstoPimakGorselRelFromSku(stokNo, sablonIsim) ?? null;
    }

    const nameL = sablonIsim.toLowerCase();
    if (
      /induksiyon|indüksiyon|ocak|mikser/.test(nameL) &&
      finalGorsel &&
      /market|inci|vitrin|display|tatlı|tatli|caglayan|cupcake/i.test(
        String(finalGorsel),
      )
    ) {
      finalGorsel =
        equstoPimakGorselRelFromSku(stokNo, sablonIsim) ??
        (stokNo ? oztiWebImageRelFromSku(stokNo) : null);
    }

    const normSkuKey = String(stokNo || "").trim().toUpperCase();
    const normNameKey = String(k.isim || "").toLowerCase();
    if (normSkuKey.endsWith(".12") || normSkuKey.endsWith("-12") || /çift\s*evye|cift\s*evye|iki\s*evye/i.test(normNameKey)) {
      finalGorsel = "/data/images/catalog/cafemarkt-images/tablali-evye-cift-goz-damlaliksiz_1.jpg";
    } else if (normSkuKey.endsWith(".11") || normSkuKey.endsWith("-11") || /tek\s*evye|1\s*evye/i.test(normNameKey)) {
      finalGorsel = "/data/images/catalog/cafemarkt-images/tablali-evye-tek-goz-damlaliksiz_1.jpg";
    } else if (normSkuKey.endsWith(".17") || normSkuKey.endsWith("-17") || /üç\s*evye|uc\s*evye|3\s*evye/i.test(normNameKey)) {
      finalGorsel = "/data/images/catalog/cafemarkt-images/tablali-evye-uc-goz-damlaliksiz_1.jpg";
    }

    const gorselFallback = normalizePfosGorselUrl(finalGorsel);
    const kw = resolveTeklifKw({
      isim: sablonIsim,
      urunTipi: k.urunTipi,
      urun: u,
      elektrikGucuKwHint: k.elektrikGucuKwHint,
      gazGucuKwHint: k.gazGucuKwHint,
    });

    return {
      bolumNo,
      bolumBaslik,
      poz: k.poz,
      ek: "",
      stokNo: u?.sku ?? "",
      tanim: displayIsimFromSablon(sablonIsim),
      marka: resolveTeklifMarka({
        katalogMarka: u?.marka,
        urunAd: u?.ad,
        sablonIsim,
        urunTipi: k.urunTipi,
        sku: u?.sku,
      }),
      olcu:
        sanitizeDavlumbazOlcu(
          displayIsimFromSablon(sablonIsim),
          olcuForTeklifUrun(u, cleanObjectString(k.notlar)),
          k.urunTipi,
        ) ?? olcuForTeklifUrun(u, cleanObjectString(k.notlar)),
      elkKw: kw.elektrikGucuKw,
      gazKw: kw.gazGucuKw,
      adet,
      birimSatis: birimEur,
      toplamSatis: birimEur != null ? birimEur * adet : null,
      doviz,
      fotoUrl: gorselFallback ?? undefined,
      aciklama: specAciklama(k, referansListe) || undefined,
    };
  });

  const genelToplamEur = satirlar.reduce(
    (s, r) => s + (r.toplamSatis ?? 0),
    0,
  );

  const tarihIso = new Date().toISOString().slice(0, 10);

  return {
    version: "v14",
    formNo: TEKLIF_V14_FORM_NO,
    ust: {
      projeAdi: meta.projeAdi ?? res.konseptLabel,
      musteri: meta.musteri ?? "",
      sayi: meta.sayi ?? yeniTeklifSayisi(),
      tarih: tarihIso,
      eurTry,
    },
    satirlar,
    ozet: {
      toplamElektrikKw: res.ozet.toplamElektrikKw,
      toplamGazKw: res.ozet.toplamGazKw,
      genelToplam: genelToplamEur > 0 ? genelToplamEur : res.ozet.toplamFiyat,
      doviz: genelToplamEur > 0 ? "EUR" : res.ozet.doviz,
    },
    sartlar: [
      ...TEKLIF_V14_SARTLAR,
    ],
    meta: {
      konsept: res.konsept,
      konseptLabel: res.konseptLabel,
      sehir: res.sehir ?? "",
      m2Toplam: res.m2,
      bolumM2: meta.bolumM2,
      teslimatAdresi: meta.teslimatAdresi,
    },
  };
}

export { formatTarihTr };
