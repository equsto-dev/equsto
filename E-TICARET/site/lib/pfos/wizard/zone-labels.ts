/** pfos zone_key → kullanıcıya gösterilen bölüm adı */
export const ZONE_LABELS: Record<string, string> = {
  ana_mutfak: "Ana / sıcak mutfak",
  sebze_hazirlik: "Sebze hazırlık",
  et_hazirlik: "Et hazırlık",
  izgara_meze: "Izgara & meze",
  kuru_depo: "Kuru depo",
  soguk_oda: "Soğuk oda",
  derin_dondurucu: "Derin dondurucu",
  bulasikhane: "Bulaşıkhane",
  pastane: "Pastane & teşhir",
  bar: "Bar",
  acik_bufe: "Açık büfe",
  show_mutfagi: "Show mutfağı",
};

export function zoneLabel(key: string): string {
  return ZONE_LABELS[key] ?? key.replace(/_/g, " ");
}
