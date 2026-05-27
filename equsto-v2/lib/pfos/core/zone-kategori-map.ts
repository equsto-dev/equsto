import type { PfosKategoriKodu } from "./engine-types";

/** Mutfak zone → PFOS kategori kodu (teklif A–H) */
export const ZONE_KATEGORI_KODU: Record<string, PfosKategoriKodu> = {
  bar: "A",
  ana_mutfak: "B",
  izgara_meze: "B",
  show_mutfagi: "B",
  acik_bufe: "B",
  sebze_hazirlik: "C",
  et_hazirlik: "C",
  pastane: "D",
  soguk_oda: "E",
  kuru_depo: "G",
  derin_dondurucu: "G",
  bulasikhane: "H",
};

export function kategoriForZone(zoneKey: string): PfosKategoriKodu {
  return ZONE_KATEGORI_KODU[zoneKey] ?? "B";
}
