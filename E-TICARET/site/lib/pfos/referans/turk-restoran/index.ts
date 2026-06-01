import type { ConceptTemplate } from "../../core/engine-types";
import { referansKalemlerToTemplateItems } from "../build-template-items";
import {
  loadReferansProfil,
  type ReferansListeId,
} from "../pfos-referans-loader";
import type { ReferansProfil } from "../referans-types";
import {
  getS13ReferansForKonsept,
  pickS13ReferansForM2,
  S13_388_M2_BAND,
} from "../s13-388";

/** S13-388 yerleşim modeli @ ~220 m² */
export const TURK_RESTORAN_REFERANS_M2 = 220;
export const TURK_RESTORAN_S13_ID = "s13-388-turk-220";
export const TURK_RESTORAN_SUTIS_BAND: ReferansListeId = "200-5000";

function requireS13Turk(): ReferansProfil {
  const prof = getS13ReferansForKonsept("turk-restoran");
  if (!prof) throw new Error("S13-388 Türk Restoranı referansı yüklenemedi");
  return prof;
}

const S13_TURK = requireS13Turk();

/** Tüm kaynaklar (silinmez — ileride AI doğru listeyi seçecek) */
export const TURK_RESTORAN_REFERANSLAR: ReferansProfil[] = [S13_TURK];

export const TURK_RESTORAN_DEFAULT_REFERANS_ID = S13_TURK.id;

export {
  S13_388_M2_BAND as TURK_RESTORAN_M2_BAND,
  pickS13ReferansForM2 as pickTurkRestoranReferansForM2,
};

export type TurkRestoranReferansKaynak = {
  id: string;
  label: string;
  kaynak?: string;
  not?: string;
  referansM2?: number;
  bantId: ListeBantId;
  kaynakTip: "s13-388" | "excel-referans";
};

type ListeBantId = "150-300" | "200-5000";

export function listTurkRestoranReferansKaynaklari(): TurkRestoranReferansKaynak[] {
  return [
    {
      id: S13_TURK.id,
      label: S13_TURK.label,
      kaynak: S13_TURK.kaynak,
      not: S13_TURK.not,
      referansM2: S13_TURK.referansM2,
      bantId: "150-300",
      kaynakTip: "s13-388",
    },
    {
      id: "turk-restoran-200-5000",
      label: "Sütiş Şişhane 2017-006 (Excel)",
      kaynak: "2017-006 SÜTİŞ ŞİŞHANE/2017-006-2.xlsx",
      not: "77 kalem · pide + sıcak servis + bar · 200–5000 m²",
      referansM2: 500,
      bantId: "200-5000",
      kaynakTip: "excel-referans",
    },
  ];
}

export function listTurkRestoranReferanslar(): Pick<
  ReferansProfil,
  "id" | "label" | "not" | "referansM2"
>[] {
  return listTurkRestoranReferansKaynaklari().map(
    ({ id, label, not, referansM2 }) => ({
      id,
      label,
      not,
      referansM2,
    }),
  );
}

export function getTurkRestoranReferans(id: string): ReferansProfil {
  if (id === S13_TURK.id || id.startsWith("s13-388")) return S13_TURK;
  const found = TURK_RESTORAN_REFERANSLAR.find((r) => r.id === id);
  if (found) return found;
  throw new Error(`Türk Restoranı referans bulunamadı: ${id}`);
}

/**
 * Otomatik seçim (geçici kural — ileride AI referansId ile override edecek).
 * ≤300 m² → S13-388; >300 m² → Sütiş Excel.
 */
export function pickTurkRestoranReferansId(m2: number): string {
  if (m2 <= S13_388_M2_BAND.max) return S13_TURK.id;
  return "turk-restoran-200-5000";
}

export async function resolveTurkRestoranProfil(
  m2: number,
  referansId?: string | null,
): Promise<ReferansProfil> {
  const rid = referansId?.trim() || pickTurkRestoranReferansId(m2);
  if (rid === S13_TURK.id || rid.startsWith("s13-388")) {
    return pickS13ReferansForM2("turk-restoran", m2) ?? S13_TURK;
  }
  if (rid === "turk-restoran-200-5000" || rid.includes("200-5000")) {
    return loadReferansProfil("turk-restoran", m2, TURK_RESTORAN_SUTIS_BAND);
  }
  return getTurkRestoranReferans(rid);
}

export async function buildTurkRestoranTemplate(
  m2: number,
  referansId?: string | null,
): Promise<ConceptTemplate> {
  const ref = await resolveTurkRestoranProfil(m2, referansId);
  const sutis = ref.id.includes("200-5000");
  return {
    konsept: "turk-restoran",
    label: "Türk Restoranı",
    ornekler: ["Sütiş", "Köfteci Ramiz", "Hacı Arif Bey"],
    segmentBasis: "m2",
    seatDensity: 1.3,
    teklifPozModu: "referans",
    teklifBolum: sutis
      ? {
          no: "006",
          baslik: `006. SÜTİŞ ŞİŞHANE · ${ref.label.toUpperCase()}`,
        }
      : undefined,
    referansId: ref.id,
    items: referansKalemlerToTemplateItems(ref.kalemler),
  };
}
