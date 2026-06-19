import type { ConceptTemplateItem } from "@/lib/pfos/core/engine-types";
import type { ReferansKalem } from "./referans-types";

export function referansKalemlerToTemplateItems(
  kalemler: ReferansKalem[],
): ConceptTemplateItem[] {
  return kalemler.map((k, index) => ({
    referansPoz: k.referansPoz,
    kategoriKodu: k.kategoriKodu,
    altKategori: k.altKategori ?? "A.1",
    urunTipi: k.urunTipi,
    isim: k.isim,
    tip: k.tip ?? "zorunlu",
    scale: { type: "fixed" as const, adet: k.adet },
    notlar: k.notlar,
    elektrikGucuKwHint: k.elektrikGucuKwHint,
    sablonSira: index,
  }));
}
