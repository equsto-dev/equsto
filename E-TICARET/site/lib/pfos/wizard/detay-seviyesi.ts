export type DetaySeviyesi = "hizli" | "standart" | "detayli";

export const PFOS_Q_DETAY_SEVIYESI = [
  "Hızlı teklif",
  "Standart teklif",
  "Detaylı proje",
] as const;

const LABEL_TO_LEVEL: Record<string, DetaySeviyesi> = {
  "hızlı teklif": "hizli",
  "hizli teklif": "hizli",
  "standart teklif": "standart",
  "detaylı proje": "detayli",
  "detayli proje": "detayli",
};

export function detaySeviyesiFromLabel(label: string | undefined | null): DetaySeviyesi {
  const key = String(label ?? "").trim().toLowerCase();
  return LABEL_TO_LEVEL[key] ?? "standart";
}

export function detaySeviyesiLabel(level: DetaySeviyesi): string {
  switch (level) {
    case "hizli":
      return "Hızlı teklif";
    case "detayli":
      return "Detaylı proje";
    default:
      return "Standart teklif";
  }
}
