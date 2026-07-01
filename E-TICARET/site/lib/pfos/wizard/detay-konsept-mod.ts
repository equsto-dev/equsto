import type { Konsept } from "@/lib/pfos/schemas/pfos.schema";
import { isDynamicKonsept } from "@/lib/pfos/core/templates";

/** Zone katalog + bölüm m² → teklif kalemi adetlerini etkiler */
const ZONE_KATALOG_KONSEPTLER = new Set<Konsept>(["kebap-ortadogu", "meyhane"]);

/** Bölüm m² girişi teklif motoruna bağlı mı? */
export function konseptBolumM2TeklifeEtki(konsept: string | null | undefined): boolean {
  const k = String(konsept ?? "").trim();
  if (!k) return false;
  return ZONE_KATALOG_KONSEPTLER.has(k as Konsept);
}

/** Onaylı referans xlsx/json listesinden teklif (çoğu konsept) */
export function konseptReferansListeModu(konsept: string | null | undefined): boolean {
  const k = String(konsept ?? "").trim();
  if (!k) return false;
  if (konseptBolumM2TeklifeEtki(k)) return false;
  return isDynamicKonsept(k as Konsept);
}

export type DetayModAciklama = {
  teklifKaynagi: "referans" | "zone-katalog";
  bolumM2Etki: boolean;
  ozet: string;
};

export function detayModAciklama(konsept: string | null | undefined): DetayModAciklama {
  if (konseptBolumM2TeklifeEtki(konsept)) {
    return {
      teklifKaynagi: "zone-katalog",
      bolumM2Etki: true,
      ozet:
        "Teklif, bölüm m² ve zone kataloğundan üretilir. «Kurala göre dağıt» toplam alanın 1/3'ünü mutfak alanı sayar ve oranlara böler.",
    };
  }
  if (konseptReferansListeModu(konsept)) {
    return {
      teklifKaynagi: "referans",
      bolumM2Etki: false,
      ozet:
        "Teklif, onaylı referans ekipman listesinden gelir (m² bandına göre). Bölüm m² yalnızca planlama notudur; kalem listesini değiştirmez. Teşhir ve bulaşık tercihleri listeyi etkiler.",
    };
  }
  return {
    teklifKaynagi: "referans",
    bolumM2Etki: false,
    ozet:
      "Teklif konsept şablonundan üretilir. Bölüm m² planlama amaçlıdır.",
  };
}
