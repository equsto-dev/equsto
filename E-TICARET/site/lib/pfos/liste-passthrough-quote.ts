/**
 * Yüklenen liste → PFOS teklif (birebir aktarım, katalog eşlemesi yok).
 */

import type { ListeFiyatInput } from "./liste-fiyat.types";
import {
  LISTE_KONSEPT,
  LISTE_KONSEPT_LABEL,
} from "./liste-fiyat.types";
import { formatPfosDisplayTanim } from "@/lib/pfos/parse-upload/sanitize-tanim";
import { repairPfosDisplayText } from "@/lib/utf8/repair-turkish-fffd";
import { finalizeKalemlerForTeklif } from "@/lib/pfos/teklif/assign-poz";
import { applyNakliyeMontajToKalemler } from "@/lib/pfos/teklif/nakliye-montaj";
import { enrichPfosKalemlerGorsel } from "@/lib/pfos/core/katalog-gorsel";
import { resolveTeklifKw } from "@/lib/catalog/kw-resolve";
import {
  displayBolumBaslik,
  kategoriFromBolumAd,
  kategoriFromUrunAd,
} from "@/lib/pfos/referans/kategori-from-bolum";
import type {
  EslesmisUrun,
  PFOSKalemi,
  PFOSResponse,
} from "@/lib/pfos/schemas/pfos.schema";
import type { PfosKategoriKodu } from "@/lib/pfos/core/engine-types";

export type ListePassthroughKalem = {
  poz: string;
  ham_isim: string;
  olcu?: string;
  adet: number;
  marka?: string;
  birim_fiyat_eur?: number | null;
  kategori?: string;
  mevcut?: boolean;
};

const POZ_KATEGORI: Record<string, PfosKategoriKodu> = {
  A: "B",
  B: "H",
  C: "E",
  D: "H",
  E: "E",
  F: "E",
  G: "G",
  H: "H",
  K: "G",
  Y: "G",
};

function tahminiM2FromAdet(totalAdet: number): number {
  return Math.round(Math.max(50, Math.min(500, totalAdet * 2)));
}

function kategoriForKalem(kalem: ListePassthroughKalem): PfosKategoriKodu {
  const fromBolum = kategoriFromBolumAd(kalem.kategori);
  if (fromBolum) return fromBolum;
  const fromAd = kategoriFromUrunAd(kalem.ham_isim);
  if (fromAd) return fromAd;
  const letter = kalem.poz.charAt(0).toUpperCase();
  return POZ_KATEGORI[letter] ?? "C";
}

function isMevcutKalem(kalem: ListePassthroughKalem): boolean {
  if (kalem.mevcut) return true;
  return /müşteri\s*temini|musteri\s*temini/i.test(
    `${kalem.ham_isim} ${kalem.marka ?? ""}`,
  );
}

function passthroughUrun(
  kalem: ListePassthroughKalem,
  index: number,
): EslesmisUrun | null {
  if (isMevcutKalem(kalem)) return null;
  const ad = formatPfosDisplayTanim(
    repairPfosDisplayText(kalem.ham_isim),
  );
  const fiyatEur =
    typeof kalem.birim_fiyat_eur === "number" && kalem.birim_fiyat_eur > 0
      ? kalem.birim_fiyat_eur
      : null;
  return {
    id: `liste-passthrough-${kalem.poz}-${index}`,
    sku: null,
    ad,
    marka: kalem.marka?.trim() || "—",
    model: kalem.olcu?.trim() || null,
    olcu: kalem.olcu?.trim() || null,
    elektrikGucuKw: null,
    gazGucuKw: null,
    fiyat: 0,
    fiyatEur,
    doviz: "EUR",
    gorselUrl: null,
  };
}

export function pdfKalemToPassthrough(item: ListePdfKalem): ListePassthroughKalem {
  return {
    poz: item.poz?.trim() || "",
    ham_isim: item.ham_isim,
    olcu: item.olcu,
    adet:
      typeof item.adet === "number" && item.adet > 0
        ? Math.round(item.adet)
        : 1,
    marka: item.marka,
    birim_fiyat_eur: item.birim_fiyat_eur,
    kategori: item.kategori,
    mevcut: item.mevcut,
  };
}

export function ekipmanSatirToPassthrough(
  row: PfosEkipmanSatir,
): ListePassthroughKalem {
  return {
    poz: row.poz,
    ham_isim: row.ad,
    olcu: row.olcu !== "—" ? row.olcu : undefined,
    adet: typeof row.adet === "number" ? row.adet : 1,
    kategori: row.bolumAd || row.bolum,
    marka: row.marka,
    birim_fiyat_eur: row.birim_fiyat_eur,
    mevcut: row.mevcut,
  };
}

export async function buildQuoteFromListePassthrough(
  kalemlerIn: ListePassthroughKalem[],
  input: Pick<
    ListeFiyatInput,
    "kaynakDosya" | "kaynakTip" | "projeAdi" | "sehir"
  >,
): Promise<PFOSResponse> {
  const sehir = input.sehir?.trim() || "İstanbul";
  const kalemlerRaw: PFOSKalemi[] = [];

  for (let i = 0; i < kalemlerIn.length; i++) {
    const item = kalemlerIn[i];
    const poz = item.poz?.trim();
    const isim = formatPfosDisplayTanim(
      repairPfosDisplayText(item.ham_isim),
    );
    if (!poz || !isim) continue;

    const mevcut = isMevcutKalem(item);
    const bolum = item.kategori?.trim() || "";
    const notlar = [
      item.marka ? `Marka: ${item.marka}` : "",
      item.olcu ? `Ölçü: ${item.olcu}` : "",
      mevcut ? "Müşteride mevcut — fiyat beklenmez" : "",
    ]
      .filter(Boolean)
      .join(" · ");

    kalemlerRaw.push({
      poz,
      referansPoz: poz,
      kategoriKodu: kategoriForKalem(item),
      altKategori: displayBolumBaslik(bolum, poz.charAt(0)),
      urunTipi: "liste-yukleme",
      isim,
      tip: mevcut ? "opsiyonel" : "zorunlu",
      opsiyonelSebep: mevcut ? "Müşteride mevcut" : undefined,
      adet:
        typeof item.adet === "number" && item.adet > 0
          ? Math.round(item.adet)
          : 1,
      notlar,
      urun: passthroughUrun(item, i),
      kaynak: "template",
      sablonSira: i,
      referansBolumSira: i,
    });
  }

  if (!kalemlerRaw.length) {
    throw new Error("Listeden kalem okunamadı");
  }

  const adetToplam = kalemlerRaw.reduce((t, k) => t + k.adet, 0);
  const m2 = tahminiM2FromAdet(adetToplam);

  const kalemlerFinalized = finalizeKalemlerForTeklif(kalemlerRaw, {
    pozModu: "referans",
  });
  const kalemlerNakliye = await applyNakliyeMontajToKalemler(kalemlerFinalized, {
    m2,
    sehir,
  });
  const kalemler = await enrichPfosKalemlerGorsel(kalemlerNakliye);

  const zorunluKalemler = kalemler.filter((k) => k.tip === "zorunlu");
  const fiyatliZorunlu = zorunluKalemler.filter(
    (k) => k.urun && (k.urun.fiyatEur ?? 0) > 0,
  );

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

  const toplamFiyatEur = kalemler.reduce((sum, k) => {
    const birim = k.urun?.fiyatEur ?? 0;
    if (birim <= 0) return sum;
    return sum + birim * k.adet;
  }, 0);

  const uyarilar: string[] = [
    input.kaynakTip === "pdf"
      ? `PDF listesinden ${kalemlerRaw.length} kalem birebir aktarıldı (katalog eşlemesi yok).`
      : `Excel listesinden ${kalemlerRaw.length} kalem birebir aktarıldı (katalog eşlemesi yok).`,
  ];
  if (input.kaynakDosya) uyarilar.push(`Kaynak: ${input.kaynakDosya}`);

  const fiyatsiz = zorunluKalemler.filter(
    (k) => !k.urun || !(k.urun.fiyatEur && k.urun.fiyatEur > 0),
  );
  if (fiyatsiz.length > 0) {
    uyarilar.push(
      `${fiyatsiz.length} kalemde liste fiyatı yok: ` +
        fiyatsiz
          .slice(0, 6)
          .map((k) => `${k.referansPoz ?? k.poz} ${k.isim}`)
          .join("; ") +
        (fiyatsiz.length > 6 ? "…" : ""),
    );
  }

  uyarilar.push(
    "Ön teklif — yükleme listesi birebir aktarıldı; satış mühendisliği onayı gerekir.",
  );

  return {
    konsept: LISTE_KONSEPT,
    konseptLabel: input.projeAdi?.trim() || LISTE_KONSEPT_LABEL,
    m2,
    sehir,
    guvenSkoru: fiyatliZorunlu.length / Math.max(zorunluKalemler.length, 1),
    kalemler,
    teklifLayout: { pozModu: "referans" },
    ozet: {
      toplamElektrikKw: Math.round(toplamElektrikKw * 10) / 10,
      toplamGazKw: Math.round(toplamGazKw * 10) / 10,
      toplamFiyat:
        toplamFiyatEur > 0 ? Math.round(toplamFiyatEur * 100) / 100 : null,
      doviz: "EUR",
      eslesmeSayisi: fiyatliZorunlu.length,
      toplamKalemSayisi: kalemler.length,
      zorunluKalemSayisi: zorunluKalemler.length,
      eslesmisZorunluSayisi: fiyatliZorunlu.length,
    },
    uyarilar,
  };
}

export async function calculateListeQuotePassthrough(
  input: ListeFiyatInput,
): Promise<PFOSResponse> {
  const kalemSayisi =
    input.importKalemler?.length ?? input.satirlar?.length ?? 0;
  if (!kalemSayisi) {
    throw new Error("Fiyatlandırılacak kalem yok");
  }

  const passthrough = input.importKalemler?.length
    ? input.importKalemler.map(pdfKalemToPassthrough)
    : input.satirlar!.map(ekipmanSatirToPassthrough);

  if (input.satirlar?.length) {
    const m2 = tahminiM2FromAdet(toplamAdet(input.satirlar));
    const res = await buildQuoteFromListePassthrough(passthrough, input);
    return { ...res, m2 };
  }

  return buildQuoteFromListePassthrough(passthrough, input);
}
