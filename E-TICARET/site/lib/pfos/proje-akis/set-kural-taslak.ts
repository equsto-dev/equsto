/**
 * proje-akis.json eqSets + rules taslak üretimi.
 * Konsept m² bantları → ekipman seti; set → sihirbaz koşullu kural.
 */
import type { ShopTypeKayit } from "./konsept-tanimlari";

export type ProjeAkisRuleRow = {
  id: string;
  typeId: string;
  setId: string;
  desc?: string;
  priority?: number;
  conditions?: { label?: string; questionId?: string; op?: string; value: string }[];
};

export type ProjeAkisEqSetRow = {
  id: string;
  name: string;
  typeId?: string;
  desc?: string;
  source?: string;
  selectedIds?: string[];
};

export function buildEqSetId(typeId: string, bantId?: string) {
  return `set_${typeId}${bantId ? `_${bantId}` : ""}`.replace(/[^a-z0-9_]+/gi, "_");
}

export function eqSetBantForSet(
  concept: ShopTypeKayit,
  setId: string,
): ShopTypeKayit["pfos"]["bantlar"][number] | undefined {
  return concept.pfos.bantlar.find((b) => buildEqSetId(concept.id, b.id) === setId);
}

export function buildRuleId(typeId: string, setId: string) {
  return `rule_${typeId}_${setId}`.replace(/[^a-z0-9_]+/gi, "_");
}

export function createStarterEqSets(shopTypes: ShopTypeKayit[]): ProjeAkisEqSetRow[] {
  const rows: ProjeAkisEqSetRow[] = [];
  for (const concept of shopTypes) {
    if (concept.pfos.durum === "planlanan") continue;
    if (concept.pfos.bantlar.length) {
      for (const bant of concept.pfos.bantlar) {
        rows.push({
          id: buildEqSetId(concept.id, bant.id),
          name: `${concept.name} - ${bant.label}`,
          typeId: concept.id,
          source: bant.listeDosya,
          desc: `${concept.pfos.dukkanSecim} / ${bant.label} / ref ${bant.referansM2} m²`,
          selectedIds: [],
        });
      }
      continue;
    }
    rows.push({
      id: buildEqSetId(concept.id),
      name: `${concept.name} - motor şablon`,
      typeId: concept.id,
      source: concept.pfos.motorSlug || concept.pfos.teklifKaynagi,
      desc: concept.pfos.bantKurali,
      selectedIds: [],
    });
  }
  return rows;
}

export function createStarterRules(
  shopTypes: ShopTypeKayit[],
  eqSets: ProjeAkisEqSetRow[],
): ProjeAkisRuleRow[] {
  const rows: ProjeAkisRuleRow[] = [];
  for (const set of eqSets) {
    const concept = shopTypes.find((t) => t.id === set.typeId);
    if (!concept) continue;
    const bant = eqSetBantForSet(concept, set.id);
    const conditions: ProjeAkisRuleRow["conditions"] = [
      {
        label: "Dükkan türü",
        questionId: "q_dukkan_turu",
        op: "equals",
        value: concept.pfos.dukkanSecim,
      },
    ];
    if (bant) {
      conditions.push({
        label: "m² bandı",
        questionId: "q_m2",
        op: "band",
        value: bant.label,
      });
    }
    rows.push({
      id: buildRuleId(concept.id, set.id),
      typeId: concept.id,
      setId: set.id,
      priority: bant ? 20 : 50,
      desc: `${concept.name} seçilirse ${set.name} setini öner`,
      conditions,
    });
  }
  return rows;
}
