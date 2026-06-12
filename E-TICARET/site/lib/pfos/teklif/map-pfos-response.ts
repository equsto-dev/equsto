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
import { displayIsimFromSablon } from "../core/ozel-imalat";
import { sanitizeDavlumbazOlcu } from "./davlumbaz-olcu";
import { repairPfosDisplayText } from "@/lib/utf8/repair-turkish-fffd";

function specAciklama(
  k: PFOSResponse["kalemler"][number],
  referansListe = false,
): string {
  return "";
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

    return {
      bolumNo,
      bolumBaslik,
      poz: k.poz,
      ek: "",
      stokNo: u?.sku ?? "",
      tanim: displayIsimFromSablon(k.isim),
      marka: resolveTeklifMarka({
        katalogMarka: u?.marka,
        urunAd: u?.ad,
        sablonIsim: k.isim,
        urunTipi: k.urunTipi,
        sku: u?.sku,
      }),
      olcu:
        sanitizeDavlumbazOlcu(
          displayIsimFromSablon(k.isim),
          olcuForTeklifUrun(u, k.notlar),
          k.urunTipi,
        ) ?? olcuForTeklifUrun(u, k.notlar),
      elkKw: u?.elektrikGucuKw ?? k.elektrikGucuKwHint ?? null,
      gazKw: u?.gazGucuKw ?? k.gazGucuKwHint ?? null,
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
      ...res.uyarilar.filter((u) => !u.startsWith("PFOS yapay")),
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
