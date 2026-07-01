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
  oztiAxImageUrlFromSku,
  oztiPfosPreferredGorselUrl,
  oztiWebImageRelFromSku,
  portashelfGorselRelFromSku,
} from "../core/katalog-gorsel-url";
import { equstoPimakGorselRelFromSku } from "../core/equsto-pimak-gorsel";
import { equstoFiyatListesiGorselRelFromSku } from "../core/equsto-fiyat-sku";
import { isEqustoDavlumbazRow } from "../core/davlumbaz-marka";
import { buzdolabiDisplayIsimFromSablon } from "../referans/buzdolabi-display";
import { sanitizeDavlumbazOlcu } from "./davlumbaz-olcu";
import {
  formatPfosDisplayTanim,
  isProformaJunkText,
} from "../parse-upload/sanitize-tanim";
import { buildCatalogTeklifAciklama, normalizeTeklifAciklamaText } from "./catalog-teklif-aciklama";
import { referansTeklifAciklamaCeliski } from "../referans/referans-nitelikleri";
import { resolveTeklifKw } from "@/lib/catalog/kw-resolve";
import { tezgahEvyeGorselRel } from "../core/tezgah-evye-gorsel";
import { isCalismaTezgahiReferansIsim } from "../core/calisma-tezgah";
import { isIstifRafiReferansIsim } from "../core/portashelf-marka";
import { PORTASHELF_304_GORSEL_REL } from "../core/portashelf-fiyat";

function cleanObjectString(s: string | null | undefined): string {
  if (!s) return "";
  return s.replace(/\[object\s+object\]/gi, " ").replace(/\s+/g, " ").trim();
}

function specAciklama(
  k: PFOSResponse["kalemler"][number],
  referansListe = false,
): string {
  const fromUrun = k.urun?.teklifAciklama?.trim();
  if (fromUrun) {
    if (
      referansListe &&
      referansTeklifAciklamaCeliski(k.isim, fromUrun, k.notlar)
    ) {
      // Katalog teknik metni referans satırıyla çelişiyorsa gösterme
    } else {
      return normalizeTeklifAciklamaText(cleanObjectString(fromUrun));
    }
  }
  const notlar = cleanObjectString(k.notlar);
  if (isProformaJunkText(notlar)) {
    return "";
  }
  return normalizeTeklifAciklamaText(
    buildCatalogTeklifAciklama({
      description: null,
      teknik_ozellikler: null,
      specs: notlar || null,
      aciklama: formatPfosDisplayTanim(k.isim),
    }),
  );
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
    const sablonIsim = formatPfosDisplayTanim(k.isim);

    const specCeliski =
      referansListe &&
      Boolean(u?.teklifAciklama?.trim()) &&
      referansTeklifAciklamaCeliski(
        sablonIsim,
        String(u?.teklifAciklama ?? ""),
        k.notlar,
      );

    const fiyatsizKalem =
      !u ||
      ((u.fiyat ?? 0) <= 0 && !(u.fiyatEur && u.fiyatEur > 0));
    const eslesmediKalem = k.eslesmeKatmani === "eslesmedi" || fiyatsizKalem;

    let finalGorsel = portashelfGorselRelFromSku(stokNo) ??
        equstoFiyatListesiGorselRelFromSku(stokNo) ??
        oztiPfosPreferredGorselUrl(stokNo) ??
        u?.gorselUrl ??
        equstoPimakGorselRelFromSku(stokNo, k.isim) ??
        (specCeliski || !stokNo ? null : oztiAxImageUrlFromSku(stokNo));

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
        (stokNo ? oztiAxImageUrlFromSku(stokNo) : null);
    }

    const evyeGorsel = tezgahEvyeGorselRel(stokNo, sablonIsim);
    if (evyeGorsel) {
      finalGorsel = evyeGorsel;
    }

    if (isIstifRafiReferansIsim(sablonIsim)) {
      finalGorsel = finalGorsel ?? PORTASHELF_304_GORSEL_REL;
    }

    if (
      !finalGorsel &&
      isCalismaTezgahiReferansIsim(sablonIsim, cleanObjectString(k.notlar)) &&
      u?.olcu
    ) {
      finalGorsel =
        equstoPimakGorselRelFromSku(stokNo, sablonIsim) ??
        equstoFiyatListesiGorselRelFromSku(stokNo);
    }

    const gorselFallback = normalizePfosGorselUrl(finalGorsel);
    const kw = resolveTeklifKw({
      isim: sablonIsim,
      urunTipi: k.urunTipi,
      urun: u,
      elektrikGucuKwHint: k.elektrikGucuKwHint,
      gazGucuKwHint: k.gazGucuKwHint,
    });

    const olcuTeklif =
      olcuForTeklifUrun(u, cleanObjectString(k.notlar));
    const tanim = referansListe
      ? sablonIsim
      : buzdolabiDisplayIsimFromSablon(sablonIsim, {
          sku: u?.sku,
          katalogAd: u?.ad,
          olcu: olcuTeklif,
        });

    return {
      bolumNo,
      bolumBaslik,
      poz: k.poz,
      ek: "",
      stokNo: u?.sku ?? "",
      tanim,
      marka: resolveTeklifMarka({
        katalogMarka: u?.marka,
        urunAd: u?.ad,
        sablonIsim,
        urunTipi: k.urunTipi,
        sku: u?.sku,
        ignoreSablonMarka: referansListe,
      }),
      olcu:
        sanitizeDavlumbazOlcu(
          tanim,
          olcuTeklif,
          k.urunTipi,
        ) ?? olcuTeklif,
      elkKw: kw.elektrikGucuKw,
      gazKw: kw.gazGucuKw,
      adet,
      birimSatis: birimEur,
      toplamSatis: birimEur != null ? birimEur * adet : null,
      doviz,
      originalFiyat: u ? (u.fiyatEur && u.fiyatEur > 0 ? u.fiyatEur : u.fiyat) : null,
      originalDoviz: u ? (u.fiyatEur && u.fiyatEur > 0 ? "EUR" : u.doviz) : "EUR",
      fotoUrl: gorselFallback ?? undefined,
      aciklama:
        specAciklama(k, referansListe) ||
        (eslesmediKalem
          ? "Liste satırı — katalog fiyatı bulunamadı"
          : undefined),
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
    pfos: {
      guvenSkoru: res.guvenSkoru,
      referansListeKey:
        kalemler.find((k) => k.referansListeKey)?.referansListeKey ?? null,
      kalemler: kalemler.map((k) => ({
        poz: k.poz,
        referansPoz: k.referansPoz,
        isim: formatPfosDisplayTanim(k.isim),
        urunTipi: k.urunTipi,
        referansListeKey: k.referansListeKey,
        sku: k.urun?.sku ?? null,
        ad: k.urun?.ad ?? null,
        marka: k.urun?.marka ?? null,
        eslesmeKatmani: k.eslesmeKatmani,
        eslesmeLinkKey: k.eslesmeLinkKey,
      })),
    },
  };
}

export { formatTarihTr };
