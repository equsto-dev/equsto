/**
 * Atalay pişirme — sanayi-tipi-izgaralar dışına alınacak modeller.
 * Tost, tepsi taşıma, döner, banket/kumpir fırını vb.
 */
export function atalayPisirmeCategoryOverride(
  row: { model?: string; name?: string; specs?: string; category?: string },
): string | null {
  const model = String(row.model ?? row.sku ?? "").trim();
  const name = String(row.name ?? "").trim();
  const specs = String(row.specs ?? "").trim();
  const hay = `${model} ${name} ${specs}`;
  const m = model.toUpperCase().replace(/\s+/g, " ");

  if (/^ATM|^ATM-/.test(m) || /tost\s*mak/i.test(hay)) return "tost-makineleri";
  if (
    /^ADG|^ADE|^ADGC/.test(m) ||
    /döner\s*mak|doner\s*mak/i.test(name) ||
    /döner\s*kalıp|doner\s*kalip/i.test(hay)
  ) {
    return "doner-ocaklari-";
  }
  if (
    /^ATA\s|^ATA-|^ADTA/.test(m) ||
    /tepsi\s*taşı|tepsi\s*tasi|taşıma\s*arab|tasima\s*arab|istif\s*raf/i.test(hay)
  ) {
    return "taban-raflari";
  }
  if (/^AKF|^ABA|banket|kumpir\s*fır|kumpir\s*fir/i.test(hay)) return "banket-arabalari";
  if (/^APFM|^ABS\s/.test(m)) return "firinlar";

  return null;
}

/** Yalnızca izgara filtresinden çıkarılacak kayıtlar */
export function fixMisfiledIzgaraCategory(
  row: { model?: string; name?: string; specs?: string; category?: string },
): string {
  if (row.category !== "sanayi-tipi-izgaralar") return String(row.category ?? "");
  const next = atalayPisirmeCategoryOverride(row);
  return next ?? "sanayi-tipi-izgaralar";
}
