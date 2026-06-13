/** Müşteriye/teklife gidecek açıklama — fiyat satırları hariç */

const INTERNAL_LINE =
  /^(liste fiyatı|bayi\b|equsto\b|hesap\s*:|kur\s*:|kaynak\s*:|kategori:|model:|ürün kodu|barkod:)/i;

function isInternalLine(ln: string): boolean {
  const t = ln.trim();
  if (!t) return true;
  if (INTERNAL_LINE.test(t)) return true;
  if (/iskonto/i.test(t) && /liste|eur|bayi|kalan|%/i.test(t)) return true;
  if (/^equsto\b/i.test(t) && /(satış|fiyat|eur|tl|kar)/i.test(t)) return true;
  return false;
}

function cleanLines(lines: string[]): string[] {
  return lines
    .map((l) => String(l || "").trim())
    .filter((l) => l && !isInternalLine(l));
}

export type CatalogAciklamaInput = {
  description?: string | null;
  ozti_web_description?: string | null;
  inoksan_shop_description?: string | null;
  teknik_ozellikler?: string[] | null;
  specs?: string | null;
  aciklama?: string | null;
};

/** Katalog satırından PFOS teklif `aciklama` metni */
export function buildCatalogTeklifAciklama(row: CatalogAciklamaInput | null | undefined): string {
  if (!row) return "";

  const shop = String(
    row.ozti_web_description || row.inoksan_shop_description || row.description || "",
  ).trim();
  if (shop.length >= 40) {
    return shop
      .split(/\r?\n/)
      .map((l) => l.replace(/^[•\-–—*·]+\s*/, "").trim())
      .filter((l) => l && !isInternalLine(l))
      .join("\n")
      .trim();
  }

  const teknik = cleanLines(Array.isArray(row.teknik_ozellikler) ? row.teknik_ozellikler : []);
  if (teknik.length) {
    return teknik.map((l) => (l.startsWith("•") ? l : `• ${l}`)).join("\n");
  }

  const fromSpecs = String(row.specs || "")
    .split(/\r?\n/)
    .filter((l) => l.trim() && !isInternalLine(l))
    .filter((l) => !/^teknik özellikler/i.test(l.trim()))
    .slice(0, 12);
  if (fromSpecs.length) return fromSpecs.join("\n");

  const lead = String(row.aciklama || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => !/^kategori:/i.test(l));
  return lead.slice(0, 6).join("\n");
}
