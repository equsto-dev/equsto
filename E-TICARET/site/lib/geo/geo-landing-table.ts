import steakhouse2018 from "../../public/data/geo/steakhouse-2018-199-3-table.json";
import balikci02 from "../../public/data/geo/balikci-02-table.json";
import houseCafe19 from "../../public/data/geo/house-cafe-19-table.json";

export type GeoLandingTableItem = {
  ad: string;
  olcu?: string | null;
  adet: number;
  listeBirimEur?: number;
  listeTutarEur?: number;
  satisBirimEur?: number;
  satisTutarEur?: number;
};

export type GeoLandingTableZone = {
  zone: string;
  items: GeoLandingTableItem[];
};

export type GeoLandingTableData = {
  proformaNo: string;
  label: string;
  kaynakDosya: string;
  yukleme: string;
  zones: GeoLandingTableZone[];
  ozet: {
    kalemSayisi: number;
    listeToplamEur: number;
    satisToplamEur: number;
  };
};

const TABLES: Record<string, GeoLandingTableData> = {
  "geo/steakhouse-2018-199-3-table.json": steakhouse2018 as GeoLandingTableData,
  "geo/balikci-02-table.json": balikci02 as GeoLandingTableData,
  "geo/house-cafe-19-table.json": houseCafe19 as GeoLandingTableData,
};

export function getGeoLandingTable(ref?: string): GeoLandingTableData | null {
  if (!ref) return null;
  return TABLES[ref] ?? null;
}

export function formatGeoTableEur(
  value: number | undefined | null,
  lang: "tr" | "en",
): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const loc = lang === "en" ? "en-GB" : "tr-TR";
  return `${new Intl.NumberFormat(loc, { maximumFractionDigits: 0 }).format(value)} €`;
}
