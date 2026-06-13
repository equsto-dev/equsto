/**
 * Claude + Meilisearch eşlemesi → PFOS teklif taslağı (PFOSResponse).
 */

import type { KategoriKodu, PFOSKalemi, PFOSResponse } from "../schemas/pfos.schema";
import { LISTE_KONSEPT, LISTE_KONSEPT_LABEL } from "../liste-fiyat";
import { finalizeKalemlerForTeklif } from "../teklif/assign-poz";
import { applyNakliyeMontajToKalemler } from "../teklif/nakliye-montaj";
import { enrichPfosKalemlerGorsel } from "../core/katalog-gorsel";
import { resolveTeklifKw } from "@/lib/catalog/kw-resolve";
import {
  kategoriFromBolumAd,
  kategoriFromUrunAd,
  displayBolumBaslik,
} from "../referans/kategori-from-bolum";
import type { PfosKategoriKodu } from "../core/engine-types";
import type { MeiliKalemEslestirme } from "./types";
import { formatPfosDisplayTanim } from "./sanitize-tanim";

const POZ_BOLUM: Record<string, string> = {
  A: "sıcak mutfak",
  C: "panel tip soğuk oda",
  D: "bulaşık yıkama",
  F: "panel tip derin dondurucu oda",
  K: "kuru depo",
};

const POZ_KATEGORI: Record<string, PfosKategoriKodu> = {
  A: "B",
  B: "B",
  C: "E",
  D: "H",
  E: "E",
  F: "E",
  G: "G",
  H: "H",
  K: "G",
};

function kategoriForKalem(eslestirme: MeiliKalemEslestirme): KategoriKodu {
  const { kalem } = eslestirme;
  const fromBolum = kategoriFromBolumAd(kalem.bolum);
  if (fromBolum) return fromBolum;
  const fromAd = kategoriFromUrunAd(kalem.tanim);
  if (fromAd) return fromAd;
  const letter = kalem.poz.charAt(0).toUpperCase();
  return (POZ_KATEGORI[letter] ?? "C") as KategoriKodu;
}

function tahminiM2(adetToplam: number): number {
  return Math.round(Math.max(50, Math.min(500, adetToplam * 2)));
}

export type ParseUploadQuoteInput = {
  eslestirmeler: MeiliKalemEslestirme[];
  kaynakDosya?: string;
  projeAdi?: string;
  sehir?: string;
};

export async function buildQuoteFromMeiliEslestirme(
  input: ParseUploadQuoteInput,
): Promise<PFOSResponse> {
  const sehir = input.sehir?.trim() || "İstanbul";
  const kalemlerRaw: PFOSKalemi[] = input.eslestirmeler.map((e, i) => {
    const bolum =
      e.kalem.bolum ||
      POZ_BOLUM[e.kalem.poz.charAt(0).toUpperCase()] ||
      "";
    const notlar = [
      e.kalem.mevcut ? "Mevcut — fiyat beklenmez" : "",
      e.kalem.marka_orijinal ? `Marka: ${e.kalem.marka_orijinal}` : "",
      e.kalem.olcu ? `Ölçü: ${e.kalem.olcu}` : "",
      e.matched.not_found ? "Katalogda bulunamadı" : "",
      e.matched.eslesen_urun
        ? `Meili (${e.matched.eslesen_skor}): ${e.matched.eslesen_urun.urun_adi}`
        : !e.kalem.mevcut
          ? "Eşleşme yok"
          : "",
    ]
      .filter(Boolean)
      .join(" · ");

    return {
      poz: e.kalem.poz,
      referansPoz: e.kalem.poz,
      kategoriKodu: kategoriForKalem(e),
      altKategori: displayBolumBaslik(bolum, e.kalem.poz.charAt(0)),
      urunTipi: "upload-meili",
      isim: formatPfosDisplayTanim(e.kalem.tanim),
      tip: e.kalem.mevcut ? ("opsiyonel" as const) : ("zorunlu" as const),
      opsiyonelSebep: e.kalem.mevcut ? "Müşteride mevcut" : undefined,
      adet: e.kalem.adet,
      notlar,
      urun: e.kalem.mevcut ? null : e.urun,
      kaynak: "template" as const,
      sablonSira: i,
      referansBolumSira: i,
    };
  });

  const adetToplam = input.eslestirmeler.reduce(
    (t, e) => t + e.kalem.adet,
    0,
  );
  const m2 = tahminiM2(adetToplam);

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

  const skorlu = input.eslestirmeler.filter((e) => !e.kalem.mevcut);
  const ortGuven =
    skorlu.length > 0
      ? skorlu.reduce((t, e) => t + e.matched.eslesen_skor, 0) / skorlu.length
      : 0;
  const guvenSkoru =
    zorunluKalemler.length > 0
      ? Math.round(
          Math.min(
            0.95,
            ortGuven *
              (eslesmisZorunlu.length / zorunluKalemler.length) *
              0.9 +
              0.05,
          ) * 100,
        ) / 100
      : Math.round(ortGuven * 100) / 100;

  const uyarilar: string[] = [
    `Claude PDF analizi + Meilisearch eşlemesi ile ${input.eslestirmeler.length} kalem işlendi.`,
  ];
  if (input.kaynakDosya) {
    uyarilar.push(`Kaynak: ${input.kaynakDosya}`);
  }
  const fiyatsiz = kalemler.filter(
    (k) => k.tip === "zorunlu" && (!k.urun || k.urun.fiyat <= 0),
  );
  if (fiyatsiz.length > 0) {
    uyarilar.push(
      `${fiyatsiz.length} kalem için TRY fiyatı yok (EUR veya manuel kontrol gerekebilir).`,
    );
  }
  if (eksikZorunlu.length > 0) {
    uyarilar.push(
      `${eksikZorunlu.length} kalem katalogda eşleşmedi: ` +
        eksikZorunlu
          .slice(0, 6)
          .map((k) => `${k.referansPoz ?? k.poz} ${k.isim}`)
          .join("; ") +
        (eksikZorunlu.length > 6 ? "…" : ""),
    );
  }
  uyarilar.push(
    "Ön teklif — Meilisearch fuzzy eşleme; satış mühendisliği onayı gerekir.",
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
