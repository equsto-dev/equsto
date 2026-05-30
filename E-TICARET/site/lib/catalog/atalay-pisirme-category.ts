/**
 * Atalay pişirme — sanayi-tipi-izgaralar dışına alınacak modeller.
 * Tost, tepsi taşıma, döner, banket, kahve makinesi, ocak, servis dolabı vb.
 */
export type AtalayRecategorize = {
  category: string;
  dept?: string;
};

export function atalayPisirmeRecategorize(row: {
  model?: string;
  name?: string;
  specs?: string;
  category?: string;
  dept?: string;
}): AtalayRecategorize | null {
  const model = String(row.model ?? row.sku ?? "").trim();
  const name = String(row.name ?? "").trim();
  const specs = String(row.specs ?? "").trim();
  const hay = `${model} ${name} ${specs}`;
  const m = model.toUpperCase().replace(/\s+/g, " ");

  if (/^ATM|^ATM-/.test(m) || /tost\s*mak/i.test(hay)) {
    return { category: "tost-makineleri" };
  }
  if (/^ATKM/.test(m) || /türk\s*kahve|turk\s*kahve|otomatik\s*kahve/i.test(hay)) {
    return { category: "cay-makineleri", dept: "kahve" };
  }
  if (
    /^ADG|^ADE|^ADGC/.test(m) ||
    /döner\s*mak|doner\s*mak/i.test(name) ||
    /döner\s*kalıp|doner\s*kalip/i.test(hay)
  ) {
    return { category: "doner-ocaklari-" };
  }
  if (/^ADR/.test(m) || /döner\s*robot|doner\s*robot/i.test(hay)) {
    return { category: "adr-seri-doner-robotu" };
  }
  if (
    /^ATA\s|^ATA-|^ATAT|^ADTA/.test(m) ||
    /tepsi\s*taşı|tepsi\s*tasi|taşıma\s*arab|tasima\s*arab|istif\s*raf/i.test(hay)
  ) {
    return { category: "taban-raflari" };
  }
  if (/^AST/.test(m) || /\bAST\s*-/.test(m)) {
    return { category: "dolaplar-ve-taban-raflari-ara-tezgahlar" };
  }
  if (/^AGO|^AYOG/.test(m) || /yer\s*ocağı|yer\s*ocagi/i.test(hay)) {
    return { category: "ocaklar" };
  }
  if (/^AKF|^ABA|banket|kumpir\s*fır|kumpir\s*fir/i.test(hay)) {
    return { category: "banket-arabalari" };
  }
  if (/^APFM|^ABS\s/.test(m)) return { category: "firinlar" };

  return null;
}

/** Geriye uyumluluk — yalnızca kategori slug */
export function atalayPisirmeCategoryOverride(
  row: { model?: string; name?: string; specs?: string; category?: string },
): string | null {
  return atalayPisirmeRecategorize(row)?.category ?? null;
}

/** Yalnızca izgara filtresinden çıkarılacak kayıtlar */
export function fixMisfiledIzgaraCategory(
  row: { model?: string; name?: string; specs?: string; category?: string; dept?: string },
): string {
  if (row.category !== "sanayi-tipi-izgaralar") return String(row.category ?? "");
  const next = atalayPisirmeRecategorize(row);
  return next?.category ?? "sanayi-tipi-izgaralar";
}

export function applyMisfiledIzgaraFix(
  row: { model?: string; name?: string; specs?: string; category?: string; dept?: string },
): boolean {
  if (row.category !== "sanayi-tipi-izgaralar") return false;
  const next = atalayPisirmeRecategorize(row);
  if (!next) return false;
  row.category = next.category;
  if (next.dept) row.dept = next.dept;
  return true;
}
