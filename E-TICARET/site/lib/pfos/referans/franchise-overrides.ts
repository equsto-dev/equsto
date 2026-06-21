import type { ReferansKalem } from "./referans-types";

export interface FranchiseOverrideRule {
  urunTipi: string;
  isim?: string;
  notlar?: string;
  adet?: number;
  elektrikGucuKwHint?: number;
}

export const FRANCHISE_OVERRIDES: Record<string, FranchiseOverrideRule[]> = {
  espressolab: [
    {
      urunTipi: "espresso-2-grup",
      isim: "Espresso Kahve Makinası La Marzocco Linea PB 2 Grup",
      notlar: "La Marzocco Linea PB 2 Grup, Yüksek Kapasiteli",
      elektrikGucuKwHint: 4.6,
    },
    {
      urunTipi: "kahve-degirmeni",
      isim: "Kahve Değirmeni Mahlkönig E65S",
      notlar: "Mahlkönig E65S, Hassas Öğütüm",
      elektrikGucuKwHint: 0.8,
    },
    {
      urunTipi: "konveksiyon-firin-unox",
      isim: "Konveksiyonel Fırın Unox LineMiss",
      notlar: "Unox XFT193 4 Tepsi Kapasiteli",
      elektrikGucuKwHint: 3.2,
    },
    {
      urunTipi: "speed-oven-merry-chef",
      isim: "Hızlı Pişirme Fırını Merrychef eikon e2s",
      notlar: "Merrychef eikon e2s Classic, QSR Hızlı Fırın",
      elektrikGucuKwHint: 3.6,
    },
  ],
  thc: [
    {
      urunTipi: "espresso-2-grup",
      isim: "Espresso Kahve Makinası 2 Grup Rancilio Classe 5",
      notlar: "Rancilio Classe 5 USB 2 Grup",
      elektrikGucuKwHint: 4.3,
    },
    {
      urunTipi: "kahve-degirmeni",
      isim: "Kahve Değirmeni Fiorenzato F64",
      notlar: "Fiorenzato F64 Evo",
      elektrikGucuKwHint: 0.35,
    },
  ],
};

/**
 * Applies brand specific overrides if the referansId matches a franchise name.
 */
export function applyFranchiseOverrides(
  items: ReferansKalem[],
  referansId: string | null | undefined,
): ReferansKalem[] {
  if (!referansId) return items;

  const brandKey = Object.keys(FRANCHISE_OVERRIDES).find((key) =>
    referansId.toLowerCase().includes(key),
  );

  if (!brandKey) return items;

  const overrides = FRANCHISE_OVERRIDES[brandKey];
  return items.map((item) => {
    const rule = overrides.find((o) => o.urunTipi === item.urunTipi);
    if (rule) {
      return {
        ...item,
        isim: rule.isim ?? item.isim,
        notlar: rule.notlar !== undefined ? rule.notlar : item.notlar,
        adet: rule.adet ?? item.adet,
        elektrikGucuKwHint: rule.elektrikGucuKwHint ?? item.elektrikGucuKwHint,
      };
    }
    return item;
  });
}
