export type ProductSpecs = {
  seri?: string;
  section?: string;
  energi?: string;
  radyan?: string;
  voltaj?: string;
  el_guc?: string | null;
  gaz_guc?: string | null;
  gorsel_url?: string;
  gorsel_hedef?: string;
  fiyat_euro_katalog?: number;
  fiyat_euro_site?: number;
  iskonto_oran?: number;
};

export const DONER_PLACEHOLDER = "/images/catalog/atalay/doner/_placeholder.svg";

export function parseProductSpecs(raw: unknown): ProductSpecs {
  return raw && typeof raw === "object" ? (raw as ProductSpecs) : {};
}

/** Yayında gerçek görsel yoksa placeholder */
export function resolveProductImageUrl(
  primaryUrl: string | undefined | null,
  specs: ProductSpecs
): string {
  const candidate = primaryUrl || specs.gorsel_url;
  if (!candidate) return DONER_PLACEHOLDER;
  if (candidate.includes("/catalog/atalay/doner/") && candidate.endsWith(".jpg")) {
    return DONER_PLACEHOLDER;
  }
  return candidate;
}

export function formatSpecsRows(specs: ProductSpecs, modelCode: string) {
  const rows: { label: string; value: string }[] = [
    { label: "Model", value: modelCode },
  ];
  if (specs.section) rows.push({ label: "Tip", value: specs.section });
  if (specs.radyan) rows.push({ label: "Radyan", value: specs.radyan });
  if (specs.el_guc) rows.push({ label: "Elektrik (ısıtıcı)", value: specs.el_guc });
  if (specs.gaz_guc) rows.push({ label: "Gaz gücü", value: specs.gaz_guc });
  if (specs.voltaj && specs.voltaj !== "—") rows.push({ label: "Voltaj", value: specs.voltaj });
  if (specs.energi) {
    rows.push({
      label: "Enerji",
      value: specs.energi === "elektrik" ? "Elektrikli" : "Gazlı (NG / LPG)",
    });
  }
  return rows;
}
