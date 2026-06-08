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
} from "../core/katalog-gorsel";
import { displayIsimFromSablon } from "../core/ozel-imalat";
import { sanitizeDavlumbazOlcu } from "./davlumbaz-olcu";
import { repairPfosDisplayText } from "@/lib/utf8/repair-turkish-fffd";

function specAciklama(
  k: PFOSResponse["kalemler"][number],
  referansListe = false,
): string {
  const u = k.urun;
  const lines: string[] = [];
  if (
    !referansListe &&
    u?.ad &&
    u.ad !== k.isim
  ) {
    lines.push(`•  ${repairPfosDisplayText(u.ad)}`);
  }
  if (k.notlar && !isOlcuMetni(k.notlar))
    lines.push(`•  ${repairPfosDisplayText(k.notlar)}`);
  if (u?.sku?.trim()) lines.push(`•  Stok: ${u.sku}`);
  if (u?.model && u.model !== u.sku) lines.push(`•  Model: ${u.model}`);
  const marka = resolveTeklifMarka({
    katalogMarka: u?.marka,
    urunAd: u?.ad,
    sablonIsim: k.isim,
    urunTipi: k.urunTipi,
  });
  if (marka && marka !== "—") lines.push(`•  Marka: ${marka}`);
  const elk = u?.elektrikGucuKw ?? k.elektrikGucuKwHint;
  const gaz = u?.gazGucuKw ?? k.gazGucuKwHint;
  if (elk && elk > 0) lines.push(`•  Elektrik: ${elk} kW`);
  if (gaz && gaz > 0) lines.push(`•  Gaz: ${gaz} kW`);
  return lines.join("\n");
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
    const hasKnownProduct =
      Boolean(stokNo) &&
      (birimEur != null || (u?.fiyat != null && Number(u.fiyat) > 0));
    const gorselFallback = normalizePfosGorselUrl(
      u?.gorselUrl ??
        (hasKnownProduct && stokNo ? oztiWebImageRelFromSku(stokNo) : null),
    );

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
