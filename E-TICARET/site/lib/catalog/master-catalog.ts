import { readJsonFile } from "@/lib/legacy-data";
import {
  rowToHitFromRow,
  type CatalogSearchHit,
} from "@/lib/catalog-search-fallback";

/** Onaylı ana besleyici — PFOS/ÜRÜN KATEGORİZASYONU-DOLU.xlsx */
export const MASTER_XLSX_FILENAME = "ÜRÜN KATEGORİZASYONU-DOLU.xlsx";
export const MASTER_JSON_REL = "equsto-katalog-master.json";

export type MasterCatalogProduct = {
  equsto_kod: string;
  marka: string;
  marka_kodu: string;
  marka_urun_kodu: string;
  aciklama: string;
  teknik_ozellikler?: string;
  olculer?: string;
  fiyat_eur: number | null;
  urun_kategori: string;
  urun_alt_kategori: string;
  alt_kategori_1: string;
  alt_kategori_2: string;
  dept: string;
  category: string;
  id: string;
  fiyat_tl: number | null;
  image?: string | null;
};

export type MasterCatalogFile = {
  generated: string;
  source: string;
  count: number;
  products: MasterCatalogProduct[];
};

type MasterLookupMaps = {
  byEqustoKod: Map<string, MasterCatalogProduct>;
  byMarkaSku: Map<string, MasterCatalogProduct>;
};

let lookupMaps: MasterLookupMaps | null = null;

function kategoriYolu(p: MasterCatalogProduct): string[] {
  return [
    p.urun_kategori,
    p.urun_alt_kategori,
    p.alt_kategori_1,
    p.alt_kategori_2,
  ].filter(Boolean);
}

export async function loadMasterCatalog(): Promise<MasterCatalogFile | null> {
  return readJsonFile<MasterCatalogFile>(MASTER_JSON_REL);
}

export async function getMasterLookupMaps(): Promise<MasterLookupMaps> {
  if (lookupMaps) return lookupMaps;
  const master = await loadMasterCatalog();
  const byEqustoKod = new Map<string, MasterCatalogProduct>();
  const byMarkaSku = new Map<string, MasterCatalogProduct>();

  for (const p of master?.products ?? []) {
    const eq = String(p.equsto_kod || "")
      .trim()
      .toUpperCase();
    if (eq) byEqustoKod.set(eq, p);
    const marka = String(p.marka_kodu || p.marka || "").trim();
    const sku = String(p.marka_urun_kodu || "")
      .trim()
      .toUpperCase();
    if (marka && sku) {
      byMarkaSku.set(`${marka}::${sku}`, p);
    }
  }

  lookupMaps = { byEqustoKod, byMarkaSku };
  return lookupMaps;
}

export function masterProductToHit(
  p: MasterCatalogProduct,
): CatalogSearchHit | null {
  const dept = String(p.dept || "").trim();
  if (!dept) return null;
  const name = String(p.aciklama || p.marka_urun_kodu || "").trim();
  if (!name) return null;

  return rowToHitFromRow({
    id: p.id,
    name,
    brand: p.marka,
    dept,
    category: p.category || "",
    sku: p.marka_urun_kodu,
    model: p.olculer || p.marka_urun_kodu,
    equsto_kod: p.equsto_kod,
    marka_kodu: p.marka_kodu,
    marka_urun_kodu: p.marka_urun_kodu,
    kategori_yolu: kategoriYolu(p),
    liste_fiyati_eur: p.fiyat_eur,
    satis_eur_indirimli: null,
    price: "",
    images: p.image ? [p.image] : [],
    specs: p.teknik_ozellikler || "",
    fiyat_tl: p.fiyat_tl,
  });
}

/** Master JSON'dan EQ- kodu ile arama (ekipmanlar.json yedek) */
export async function lookupMasterByEqustoKod(
  equstoKod: string,
): Promise<CatalogSearchHit | null> {
  const kod = String(equstoKod || "").trim().toUpperCase();
  if (!kod.startsWith("EQ-")) return null;
  const maps = await getMasterLookupMaps();
  const p = maps.byEqustoKod.get(kod);
  if (!p) return null;
  return masterProductToHit(p);
}
