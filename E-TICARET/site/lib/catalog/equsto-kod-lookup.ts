import {
  lookupCatalogByEqustoKod,
  type CatalogSearchHit,
} from "@/lib/catalog-search-fallback";
import { buildEqustoKod } from "@/lib/catalog/product-hierarchy";
import type { EslesmisUrun } from "@/lib/pfos/schemas/pfos.schema";
import { hitToEslesmis } from "@/lib/pfos/parse-upload/hit-to-eslesmis";

const PROFORMA_MARKA_KOD: Record<string, string> = {
  inoksan: "INOKSAN",
  ink: "INOKSAN",
  ino: "INOKSAN",
  atalay: "ATALAY",
  oztiryakiler: "OZTI",
  ozti: "OZTI",
  öztiryakiler: "OZTI",
  pimak: "PIMAK",
  proso: "PROSO",
  electrolux: "ELECTROLUX",
  caglayan: "CAGLAYAN",
  çağlayan: "CAGLAYAN",
  yuksel: "YUKSEL",
  yüksel: "YUKSEL",
  portabianco: "YUKSEL",
  rational: "RATIONAL",
  tic: "CAGLAYAN",
  skturk: "CAGLAYAN",
  sktürk: "CAGLAYAN",
  portashelf: "PORTASHELF",
  p: "PORTASHELF",
  ps: "PORTASHELF",
};

/** Proforma stok öneki: INK- EEN → marka kodu + ürün kodu adayı */
export function parseProformaStokKodu(tanim: string): {
  brandKod: string;
  urunKodu: string;
} | null {
  const m = String(tanim || "").match(
    /\(([A-Z]{2,6})-?\s*([A-Z0-9][A-Z0-9.\-/]*)\)/i,
  );
  if (!m) return null;
  const prefix = m[1].toUpperCase();
  const urunKodu = m[2].trim().toUpperCase();
  const brandKod = PROFORMA_MARKA_KOD[prefix.toLowerCase()] || prefix;
  return { brandKod, urunKodu };
}

export function extractEqustoKodFromText(text: string): string | null {
  const m = String(text || "").match(/EQ-[A-Z0-9][A-Z0-9.\-_]*/i);
  return m ? m[0].toUpperCase() : null;
}

export function guessEqustoKodFromItem(input: {
  tanim: string;
  marka_orijinal?: string;
  marka_urun_kodu?: string;
}): string | null {
  const direct = extractEqustoKodFromText(input.tanim);
  if (direct) return direct;

  const stok = parseProformaStokKodu(input.tanim);
  if (stok?.brandKod && stok.urunKodu) {
    return buildEqustoKod(stok.brandKod, stok.urunKodu);
  }

  const markaRaw = String(input.marka_orijinal || "").trim().toLowerCase();
  const brandKod = PROFORMA_MARKA_KOD[markaRaw];
  const sku = String(input.marka_urun_kodu || "").trim();
  if (brandKod && sku) return buildEqustoKod(brandKod, sku);

  return null;
}

export async function matchCatalogByEqustoKod(
  equstoKod: string,
): Promise<CatalogSearchHit | null> {
  const kod = String(equstoKod || "").trim().toUpperCase();
  if (!kod.startsWith("EQ-")) return null;
  return lookupCatalogByEqustoKod(kod);
}

/** EQ- kodu → PFOS eşleşmesi (master katalog öncelikli) */
export async function matchEslesmisByEqustoKod(
  equstoKod: string,
): Promise<EslesmisUrun | null> {
  const hit = await matchCatalogByEqustoKod(equstoKod);
  if (!hit) return null;
  return hitToEslesmis(hit);
}

/** Metin / stok kodundan EQ- tahmini → PFOS eşleşmesi */
export async function matchEslesmisByEqustoGuess(input: {
  tanim: string;
  marka_orijinal?: string;
  marka_urun_kodu?: string;
}): Promise<EslesmisUrun | null> {
  const kod = guessEqustoKodFromItem(input);
  if (!kod) return null;
  return matchEslesmisByEqustoKod(kod);
}
