/**
 * Kafe matris → ConceptTemplate (rules engine çıktısı)
 */

import type { ConceptTemplate, ConceptTemplateItem } from "../../engine-types";
import { resolveKafeCell, getKafeMatrixDoc, kafeCellLabel } from "../../matrix/kafe-resolver";
import type { KafeMatrixResolveInput, KafeYogunluk } from "../../matrix/kafe.types";
import { referansKalemlerToTemplateItems } from "../../../referans/build-template-items";
import { loadReferansProfil } from "../../../referans/pfos-referans-loader";
import { resolveSlotsForCell } from "./slots";

function slotsToTemplateItems(
  yogunluk: KafeYogunluk,
  m2: number,
): ConceptTemplateItem[] {
  const slots = resolveSlotsForCell(yogunluk);
  return slots.map((s, index) => ({
    kategoriKodu: s.kategoriKodu,
    altKategori: s.altKategori,
    urunTipi: s.urunTipi,
    isim: s.isim,
    tip: s.tip,
    scale: s.scale,
    notlar: s.notlar,
    elektrikGucuKwHint: s.elektrikGucuKwHint,
    sablonSira: index,
  }));
}

export type BuildKafeTemplateOptions = KafeMatrixResolveInput & {
  /** true: referans seed listesi varsa onu kullan (doğrulama / geçiş) */
  preferReferansSeed?: boolean;
  altTip?: string | null;
};

/**
 * Matris hücresinden PFOS şablonu üretir.
 * preferReferansSeed=true ve hücrede seed varsa referans JSON kalemleri kullanılır.
 * Aksi halde slot kuralları (rules engine) uygulanır.
 */
export async function buildKafeMatrixTemplate(
  m2: number,
  options: BuildKafeTemplateOptions = {},
): Promise<ConceptTemplate> {
  const input: KafeMatrixResolveInput = {
    m2,
    olcek: options.olcek,
    yogunluk: options.yogunluk,
  };
  const cell = resolveKafeCell(input);
  const doc = getKafeMatrixDoc();
  const yogunlukDef = doc.yogunluk.find((y) => y.id === cell.yogunluk);

  let items: ConceptTemplateItem[];
  let referansId: string | undefined;

  if (options.preferReferansSeed && cell.referansSeed) {
    const ref = await loadReferansProfil(
      cell.referansSeed.eskiKonseptId,
      m2,
      options.altTip ?? cell.referansSeed.bantId,
    );
    items = referansKalemlerToTemplateItems(ref.kalemler);
    referansId = ref.id;
  } else {
    items = slotsToTemplateItems(cell.yogunluk, m2);
  }

  return {
    konsept: "kafe",
    label: `Kafe — ${kafeCellLabel(cell)}`,
    ornekler: [
      "Espressolab",
      "Kahve Durağı",
      "Harvest Cafe",
      "Kahve & Tatlı",
    ],
    segmentBasis: "m2",
    seatDensity: 1.5,
    teklifPozModu: referansId ? "referans" : "kategori",
    referansId,
    items,
    ...(cell.referansSeed?.proje
      ? {
          teklifBolum: {
            no: cell.id.replace("kafe_", ""),
            baslik: `${cell.referansSeed.proje} · ${yogunlukDef?.label ?? cell.yogunluk}`,
          },
        }
      : {}),
  };
}
