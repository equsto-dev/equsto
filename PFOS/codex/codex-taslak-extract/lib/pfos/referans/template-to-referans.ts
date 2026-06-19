import type { ConceptTemplate } from "@/lib/pfos/core/engine-types";
import { calcAdet } from "@/lib/pfos/core/engine-types";
import type { ReferansKalem } from "./referans-types";

type TipFiltre = "zorunlu" | "tavsiye" | "opsiyonel";

/**
 * Konsept şablonundan referans kalem listesi (sabit adet @ referansM2).
 */
export function conceptTemplateToReferansKalemler(
  template: ConceptTemplate,
  referansM2: number,
  opts?: {
    includeTips?: TipFiltre[];
    montajNakliye?: boolean;
  },
): ReferansKalem[] {
  const include = new Set<TipFiltre>(
    opts?.includeTips ?? ["zorunlu", "tavsiye"],
  );
  const kalemler: ReferansKalem[] = [];
  let idx = 0;

  for (const item of template.items) {
    if (!include.has(item.tip)) continue;
    if (item.minM2 !== undefined && referansM2 < item.minM2) continue;
    if (item.maxM2 !== undefined && referansM2 >= item.maxM2) continue;

    const adet = calcAdet(item.scale, referansM2, template.seatDensity);
    if (adet <= 0) continue;

    idx += 1;
    kalemler.push({
      referansPoz: `ref-${idx}`,
      isim: item.isim,
      urunTipi: item.urunTipi,
      kategoriKodu: item.kategoriKodu,
      adet,
      notlar: item.notlar,
      altKategori: item.altKategori,
      elektrikGucuKwHint: item.elektrikGucuKwHint,
      gazGucuKwHint: item.gazGucuKwHint,
    });
  }

  if (opts?.montajNakliye !== false) {
    kalemler.push({
      referansPoz: `ref-${idx + 1}`,
      isim: "Nakliye Montaj",
      urunTipi: "montaj-nakliye",
      kategoriKodu: "X",
      adet: 1,
    });
  }

  return kalemler;
}
