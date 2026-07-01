/**
 * Müşteri Excel/PDF listesi → PFOS katalog eşlemesi ve sistem fiyatları.
 * Excel'deki tedarikçi birim fiyatları kullanılmaz.
 */

import type { PfosEkipmanSatir } from "@/lib/pfos/kategoriler/types";
import { toplamAdet } from "@/lib/pfos/kategoriler/parse-ekipman-xlsx";
import { ekipmanToReferansKalemler } from "@/lib/pfos/referans/pfos-referans-loader";
import { referansKalemlerToTemplateItems } from "@/lib/pfos/referans/build-template-items";
import type { ListePdfKalem } from "@/lib/pfos/liste-pdf-analiz";
import { repairPfosDisplayText } from "@/lib/utf8/repair-turkish-fffd";
import {
  matchProductForReferansKalemWithMeta,
  metaFromReferansMatch,
  type ReferansKalemMatchMeta,
} from "@/lib/pfos/referans/match-referans-kalem";
import { isBuroTipiDerinDondurucuReferans } from "@/lib/pfos/referans/buzdolabi-match";
import { extractOlcuFromNotlar } from "@/lib/pfos/referans/yer-izgara-match";
import { clearMatchProductCache } from "@/lib/pfos/core/match-product";
import { formatPfosDisplayTanim } from "@/lib/pfos/parse-upload/sanitize-tanim";
import { finalizeKalemlerForTeklif } from "@/lib/pfos/teklif/assign-poz";
import { applyNakliyeMontajToKalemler } from "@/lib/pfos/teklif/nakliye-montaj";
import {
  enrichPfosKalemlerGorsel,
  invalidateKatalogGorselCache,
} from "@/lib/pfos/core/katalog-gorsel";
import { enrichEslesmisUrunKw } from "@/lib/pfos/core/enrich-eslesmis-kw";
import { resolveTeklifKw } from "@/lib/catalog/kw-resolve";
import { resolveTipKodu } from "@/lib/pfos/core/tip-kodu";
import { TEKLIF_DEFAULT_FIYAT_STRATEJISI } from "@/lib/pfos/teklif/teklif-policy";
import { resetTeshirReyonSeriesPin } from "@/lib/pfos/referans/teshir-reyon-match";
import { kategoriFromBolumAd } from "@/lib/pfos/referans/kategori-from-bolum";
import type { ListeFiyatInput } from "./liste-fiyat.types";
import {
  LISTE_KONSEPT,
  LISTE_KONSEPT_LABEL,
} from "./liste-fiyat.types";
import type { PFOSKalemi, PFOSResponse } from "./schemas/pfos.schema";

function tahminiM2FromAdet(totalAdet: number): number {
  return Math.round(Math.max(50, Math.min(500, totalAdet * 2)));
}

function tahminiM2(satirlar: PfosEkipmanSatir[]): number {
  return tahminiM2FromAdet(toplamAdet(satirlar));
}

function importKalemlerToReferansKalemler(
  items: ListePdfKalem[],
  listeKey: string,
) {
  const satirlar: PfosEkipmanSatir[] = items.map((item, index) => {
    const poz = item.poz?.trim() || String(index + 1);
    const olcu = item.olcu?.trim();
    const bolumAd = item.kategori?.trim() || "";
    return {
      bolum: poz.charAt(0).toUpperCase(),
      bolumAd,
      poz,
      ad: formatPfosDisplayTanim(repairPfosDisplayText(item.ham_isim)),
      olcu: olcu || "—",
      adet:
        typeof item.adet === "number" && item.adet > 0
          ? Math.round(item.adet)
          : 1,
      marka: item.marka,
      mevcut: item.mevcut,
    };
  });
  return ekipmanToReferansKalemler(satirlar, listeKey);
}

/** PDF/Excel'den çıkan her satır teklifte görünsün — eşleşme atlansa bile */
function appendMissingImportKalemler(
  kalemler: PFOSKalemi[],
  input: ListeFiyatInput,
  listeKey: string,
): PFOSKalemi[] {
  if (!input.importKalemler?.length) return kalemler;

  const seen = new Set(
    kalemler.map((k) => String(k.referansPoz ?? k.poz).trim()).filter(Boolean),
  );
  const extra: PFOSKalemi[] = [];

  for (let i = 0; i < input.importKalemler.length; i++) {
    const item = input.importKalemler[i];
    const poz = item.poz?.trim() || String(i + 1);
    if (seen.has(poz)) continue;
    seen.add(poz);

    const olcu = item.olcu?.trim();
    const notParcalari: string[] = [];
    if (item.marka?.trim()) notParcalari.push(`Marka: ${item.marka.trim()}`);
    if (olcu) notParcalari.push(`Ölçü: ${olcu}`);
    notParcalari.push("Liste satırı — katalog eşlemesi yapılamadı");

    extra.push({
      poz,
      referansPoz: poz,
      kategoriKodu: kategoriFromBolumAd(item.kategori?.trim() ?? "") ?? "C",
      altKategori: item.kategori?.trim() || "Liste",
      referansListeKey: listeKey,
      urunTipi: "liste-import",
      isim: formatPfosDisplayTanim(repairPfosDisplayText(item.ham_isim)),
      tip: "zorunlu",
      adet:
        typeof item.adet === "number" && item.adet > 0
          ? Math.round(item.adet)
          : 1,
      notlar: repairPfosDisplayText(notParcalari.join(" · ")),
      urun: null,
      kaynak: "template",
      sablonSira: kalemler.length + extra.length,
      eslesmeKatmani: "eslesmedi",
    });
  }

  return extra.length ? [...kalemler, ...extra] : kalemler;
}

export async function calculateListeQuoteCatalog(
  input: ListeFiyatInput,
): Promise<PFOSResponse> {
  clearMatchProductCache();
  invalidateKatalogGorselCache();
  resetTeshirReyonSeriesPin();
  const fiyatStratejisi =
    input.fiyatStratejisi ?? TEKLIF_DEFAULT_FIYAT_STRATEJISI;
  const sehir = input.sehir?.trim() || "İstanbul";
  const listeKey = input.kaynakDosya
    ? `upload:${input.kaynakDosya}`
    : "upload";

  const kalemSayisi =
    input.importKalemler?.length ?? input.satirlar?.length ?? 0;
  if (!kalemSayisi) {
    throw new Error("Fiyatlandırılacak kalem yok");
  }

  const referansKalemler = input.importKalemler?.length
    ? importKalemlerToReferansKalemler(input.importKalemler, listeKey)
    : ekipmanToReferansKalemler(input.satirlar!, listeKey);
  const templateItems = referansKalemlerToTemplateItems(referansKalemler);

  const kalemlerRaw: PFOSKalemi[] = [];

  for (let i = 0; i < templateItems.length; i++) {
    const item = templateItems[i];
    const olcuHint = extractOlcuFromNotlar(item.notlar) || "";
    const skipCatalogMatch = isBuroTipiDerinDondurucuReferans(
      item.isim,
      olcuHint,
      item.notlar,
    );

    const itemListeKey = item.referansListeKey ?? listeKey;
    let urun = null;
    let matchMeta: ReferansKalemMatchMeta = {
      eslesmeKatmani: "eslesmedi",
      eslesmeLinkKey: undefined,
      referansListeKey: itemListeKey,
    };

    if (!skipCatalogMatch) {
      const referansMatch = await matchProductForReferansKalemWithMeta({
        urunTipi: item.urunTipi,
        fiyatStratejisi,
        isim: item.isim,
        notlar: item.notlar,
        referansPoz: item.referansPoz,
        referansListeKey: itemListeKey,
        altKategori: item.altKategori,
        kategoriKodu: item.kategoriKodu,
      });
      urun = await enrichEslesmisUrunKw(referansMatch.urun, {
        isim: item.isim,
        urunTipi: item.urunTipi,
      });
      matchMeta = metaFromReferansMatch(referansMatch, itemListeKey);
    }

    const mevcutNot = /müşteride mevcut/i.test(item.notlar ?? "");
    const notlar = [
      item.notlar,
      skipCatalogMatch ? "Otomatik katalog eşlemesi atlandı" : "",
    ]
      .filter(Boolean)
      .join(" · ");

    kalemlerRaw.push({
      poz: item.referansPoz ?? "",
      referansPoz: item.referansPoz,
      kategoriKodu: item.kategoriKodu,
      altKategori: item.altKategori,
      referansBolumSira: item.referansBolumSira,
      referansBolumKey: item.referansBolumKey,
      referansListeKey: itemListeKey,
      urunTipi: item.urunTipi,
      isim: formatPfosDisplayTanim(item.isim),
      tip: item.tip,
      opsiyonelSebep: mevcutNot ? "Müşteride mevcut" : undefined,
      adet: item.scale.type === "fixed" ? item.scale.adet : 1,
      elektrikGucuKwHint: item.elektrikGucuKwHint,
      gazGucuKwHint: item.gazGucuKwHint,
      notlar,
      urun,
      kaynak: "template",
      sablonSira: item.sablonSira ?? i,
      eslesmeKatmani: matchMeta.eslesmeKatmani,
      eslesmeLinkKey: matchMeta.eslesmeLinkKey,
    });
  }

  const kalemlerWithImport = appendMissingImportKalemler(
    kalemlerRaw,
    input,
    listeKey,
  );

  const m2 = input.satirlar?.length
    ? tahminiM2(input.satirlar)
    : tahminiM2FromAdet(
        referansKalemler.reduce((t, k) => t + k.adet, 0),
      );

  const kalemlerFinalized = finalizeKalemlerForTeklif(kalemlerWithImport, {
    pozModu: "referans",
  });

  const kalemlerNakliye = await applyNakliyeMontajToKalemler(kalemlerFinalized, {
    m2,
    sehir,
  });

  const kalemler = await enrichPfosKalemlerGorsel(kalemlerNakliye);

  const zorunluKalemler = kalemler.filter((k) => k.tip === "zorunlu");
  const eslesmisZorunlu = zorunluKalemler.filter(
    (k) => k.urun !== null && (k.urun.fiyat ?? 0) > 0,
  );
  const eslesmeToplam = kalemler.filter(
    (k) => k.urun !== null && (k.urun.fiyat ?? 0) > 0,
  ).length;
  const eksikZorunlu = zorunluKalemler.filter((k) => k.urun === null);

  const toplamElektrikKw = kalemler.reduce((sum, k) => {
    const kw =
      resolveTeklifKw({
        isim: k.isim,
        urunTipi: k.urunTipi,
        urun: k.urun,
        elektrikGucuKwHint: k.elektrikGucuKwHint,
        gazGucuKwHint: k.gazGucuKwHint,
      }).elektrikGucuKw ?? 0;
    return sum + kw * k.adet;
  }, 0);

  const toplamGazKw = kalemler.reduce((sum, k) => {
    const kw =
      resolveTeklifKw({
        isim: k.isim,
        urunTipi: k.urunTipi,
        urun: k.urun,
        elektrikGucuKwHint: k.elektrikGucuKwHint,
        gazGucuKwHint: k.gazGucuKwHint,
      }).gazGucuKw ?? 0;
    return sum + kw * k.adet;
  }, 0);

  const toplamFiyatEslesen = kalemler.reduce((sum, k) => {
    if (!k.urun) return sum;
    return sum + k.urun.fiyat * k.adet;
  }, 0);
  const toplamFiyat =
    toplamFiyatEslesen > 0 ? Math.round(toplamFiyatEslesen) : null;

  const guvenSkoru =
    zorunluKalemler.length > 0
      ? Math.round(
          (eslesmisZorunlu.length / zorunluKalemler.length) * 0.85 * 100,
        ) / 100
      : 0.75;

  const uyarilar: string[] = [
    input.kaynakTip === "pdf"
      ? `PDF analizi ile ${kalemSayisi} kalem çıkarıldı; PFOS katalog eşlemesi uygulandı.`
      : `Liste dosyasından ${kalemSayisi} kalem okundu; Equsto katalog fiyatları uygulandı (Excel tedarikçi fiyatları kullanılmaz).`,
  ];

  if (input.kaynakDosya) {
    uyarilar.push(`Kaynak: ${input.kaynakDosya}`);
  }

  const fiyatsiz = kalemler.filter(
    (k) => k.tip === "zorunlu" && (!k.urun || k.urun.fiyat <= 0),
  );
  if (fiyatsiz.length > 0) {
    uyarilar.push(
      `${fiyatsiz.length} kalem için katalog fiyatı bulunamadı: ` +
        fiyatsiz
          .slice(0, 6)
          .map((k) => `${k.referansPoz ?? k.poz} ${k.isim}`)
          .join("; ") +
        (fiyatsiz.length > 6 ? "…" : ""),
    );
  }

  if (eksikZorunlu.length > 0) {
    uyarilar.push(
      `${eksikZorunlu.length} kalem katalogda eşleşmedi: ` +
        eksikZorunlu
          .slice(0, 6)
          .map((k) => resolveTipKodu(k.urunTipi) || k.isim)
          .join(", ") +
        (eksikZorunlu.length > 6 ? "…" : ""),
    );
  }

  uyarilar.push(
    "Ön teklif — satış mühendisliği onayı ve saha keşfi sonrası kesinleşir.",
  );

  return {
    konsept: LISTE_KONSEPT,
    konseptLabel: input.projeAdi?.trim() || LISTE_KONSEPT_LABEL,
    m2,
    sehir,
    guvenSkoru,
    kalemler,
    teklifLayout: { pozModu: "referans" },
    ozet: {
      toplamElektrikKw: Math.round(toplamElektrikKw * 10) / 10,
      toplamGazKw: Math.round(toplamGazKw * 10) / 10,
      toplamFiyat,
      doviz: "TRY",
      eslesmeSayisi: eslesmeToplam,
      toplamKalemSayisi: kalemler.length,
      zorunluKalemSayisi: zorunluKalemler.length,
      eslesmisZorunluSayisi: eslesmisZorunlu.length,
    },
    uyarilar,
  };
}
