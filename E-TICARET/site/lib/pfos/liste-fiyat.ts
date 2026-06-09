/**
 * Müşteri Excel listesi → PFOS katalog eşlemesi ve fiyat özeti.
 */

import type { PfosEkipmanSatir } from "@/lib/pfos/kategoriler/types";
import { toplamAdet } from "@/lib/pfos/kategoriler/parse-ekipman-xlsx";
import { ekipmanToReferansKalemler } from "@/lib/pfos/referans/pfos-referans-loader";
import type { ReferansKalem } from "@/lib/pfos/referans/referans-types";
import { referansKalemlerToTemplateItems } from "@/lib/pfos/referans/build-template-items";
import type { ListePdfKalem } from "@/lib/pfos/liste-pdf-analiz";
import type { PfosKategoriKodu } from "@/lib/pfos/core/engine-types";
import { repairPfosDisplayText } from "@/lib/utf8/repair-turkish-fffd";
import { matchProductForReferansKalem } from "@/lib/pfos/referans/match-referans-kalem";
import { finalizeKalemlerForTeklif } from "@/lib/pfos/teklif/assign-poz";
import { applyNakliyeMontajToKalemler } from "@/lib/pfos/teklif/nakliye-montaj";
import { enrichPfosKalemlerGorsel } from "@/lib/pfos/core/katalog-gorsel";
import { resolveTipKodu } from "@/lib/pfos/core/tip-kodu";
import { TEKLIF_DEFAULT_FIYAT_STRATEJISI } from "@/lib/pfos/teklif/teklif-policy";
import type {
  FiyatStratejisi,
  PFOSKalemi,
  PFOSResponse,
} from "@/lib/pfos/schemas/pfos.schema";

export const LISTE_KONSEPT = "yuklenen-liste";
export const LISTE_KONSEPT_LABEL = "Yüklenen ekipman listesi";

export type ListeFiyatInput = {
  satirlar?: PfosEkipmanSatir[];
  importKalemler?: ListePdfKalem[];
  kaynakDosya?: string;
  kaynakTip?: "excel" | "pdf";
  projeAdi?: string;
  sehir?: string;
  fiyatStratejisi?: FiyatStratejisi;
};

function tahminiM2FromAdet(totalAdet: number): number {
  return Math.round(Math.max(50, Math.min(500, totalAdet * 2)));
}

function tahminiM2(satirlar: PfosEkipmanSatir[]): number {
  return tahminiM2FromAdet(toplamAdet(satirlar));
}

export function importKalemlerToReferansKalemler(
  items: ListePdfKalem[],
  listeKey: string,
): ReferansKalem[] {
  const satirlar: PfosEkipmanSatir[] = items.map((item, index) => {
    const poz = item.poz?.trim() || String(index + 1);
    const olcu = item.olcu?.trim();
    const bolumAd = item.kategori?.trim() || "";
    return {
      bolum: poz.charAt(0).toUpperCase(),
      bolumAd,
      poz,
      ad: repairPfosDisplayText(item.ham_isim),
      olcu: olcu || "—",
      adet:
        typeof item.adet === "number" && item.adet > 0
          ? Math.round(item.adet)
          : 1,
    };
  });
  return ekipmanToReferansKalemler(satirlar, listeKey);
}

export async function calculateListeQuote(
  input: ListeFiyatInput,
): Promise<PFOSResponse> {
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
    const urun = await matchProductForReferansKalem({
      urunTipi: item.urunTipi,
      fiyatStratejisi,
      isim: item.isim,
      notlar: item.notlar,
      referansPoz: item.referansPoz,
      referansListeKey: item.referansListeKey ?? listeKey,
      kategoriKodu: item.kategoriKodu,
    });

    kalemlerRaw.push({
      poz: item.referansPoz ?? "",
      referansPoz: item.referansPoz,
      kategoriKodu: item.kategoriKodu,
      altKategori: item.altKategori,
      referansBolumSira: item.referansBolumSira,
      referansBolumKey: item.referansBolumKey,
      urunTipi: item.urunTipi,
      isim: item.isim,
      tip: item.tip,
      adet: item.scale.type === "fixed" ? item.scale.adet : 1,
      elektrikGucuKwHint: item.elektrikGucuKwHint,
      gazGucuKwHint: item.gazGucuKwHint,
      notlar: item.notlar,
      urun,
      kaynak: "template",
      sablonSira: item.sablonSira ?? i,
    });
  }

  const m2 = input.satirlar?.length
    ? tahminiM2(input.satirlar)
    : tahminiM2FromAdet(
        referansKalemler.reduce((t, k) => t + k.adet, 0),
      );

  const kalemlerFinalized = finalizeKalemlerForTeklif(kalemlerRaw, {
    pozModu: "referans",
  });

  const kalemlerNakliye = await applyNakliyeMontajToKalemler(kalemlerFinalized, {
    m2,
    sehir,
  });

  const kalemler = await enrichPfosKalemlerGorsel(kalemlerNakliye);

  const zorunluKalemler = kalemler.filter((k) => k.tip === "zorunlu");
  const eslesmisZorunlu = zorunluKalemler.filter((k) => k.urun !== null);
  const eslesmeToplam = kalemler.filter((k) => k.urun !== null).length;
  const eksikZorunlu = zorunluKalemler.filter((k) => k.urun === null);

  const toplamElektrikKw = kalemler.reduce((sum, k) => {
    const kw = k.urun?.elektrikGucuKw ?? k.elektrikGucuKwHint ?? 0;
    return sum + kw * k.adet;
  }, 0);

  const toplamGazKw = kalemler.reduce((sum, k) => {
    const kw = k.urun?.gazGucuKw ?? k.gazGucuKwHint ?? 0;
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
      : `Liste dosyasından ${kalemSayisi} kalem okundu; PFOS katalog eşlemesi uygulandı.`,
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
