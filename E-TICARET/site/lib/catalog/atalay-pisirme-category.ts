/**
 * Atalay pişirme — kategori düzeltmeleri (PDF / Seri 600 varsayılan ızgara hatası).
 */

export type PisirmeRow = {
  model?: string;
  name?: string;
  specs?: string;
  category?: string;
  sku?: string;
};

function normModel(model: string): string {
  return model.toUpperCase().replace(/\s+/g, " ").trim();
}

/** Gerçek ızgara modelleri (Seri 600 modüller hariç). */
export function isAtalayGrillModel(model: string): boolean {
  const m = normModel(model);
  if (!m) return false;
  return /^(E\s+)?(AEI|AGI|AGL|AEGL|AEGI|AAIE|AAIG|ALI|ALIG|AAI[^MTKSB])([\s\-/]|$)/i.test(m);
}

/** Model önek → ?tip= slug (ızgara dışı). */
const PREFIX_CAT: [RegExp, string][] = [
  [/^ATKM[\s\-]?/i, "cay-makineleri"],
  [/^ATM[\s\-]?/i, "tost-makineleri"],
  [/^ADR-C/i, "adr-seri-doner-robotu"],
  [/^ADG|^ADE|^ADGC/i, "doner-ocaklari-"],
  [/^ATA[\s\-]|^ADTA/i, "taban-raflari"],
  [/^AKF|^ABA/i, "banket-arabalari"],
  [/^APFM|^ABS[\s]/i, "firinlar"],
  [/^AST[\s\-]|^E\s+AST/i, "dolaplar-ve-taban-raflari-ara-tezgahlar"],
  [/^AAT[\s\-]|^E\s+AAT/i, "dolaplar-ve-taban-raflari-ara-tezgahlar"],
  [/^AYOG|^AGO[\s\-]|^E\s+AGO|^AEO[\s\-]|^E\s+AEO|^AYOE/i, "ocaklar"],
  [/^AMPG?[\s\-]|^E\s+AMP/i, "makarna-hafllamalar"],
  [/^AEF[\s\-]|^E\s+AEF/i, "fritozler"],
  [/^APD[\s\-]|^E\s+APD/i, "patates-dinlendirme"],
  [/^APF[\s\-]/i, "fritozler"],
  [/^GN[\s\-/]|^E\s+GN/i, "benmariler"],
  [/^ASB|^ASBM|^ASSB|^E\s+ASB/i, "benmariler"],
  [/^ASM[\s\-]/i, "benmariler"],
];

export function categoryFromAtalayModel(row: PisirmeRow): string | null {
  const model = String(row.model ?? row.sku ?? "").trim();
  const m = normModel(model);
  if (!m) return null;
  for (const [re, cat] of PREFIX_CAT) {
    if (re.test(m)) return cat;
  }
  return null;
}

export function atalayPisirmeCategoryOverride(row: PisirmeRow): string | null {
  const model = String(row.model ?? row.sku ?? "").trim();
  const name = String(row.name ?? "").trim();
  const specs = String(row.specs ?? "").trim();
  const hay = `${model} ${name} ${specs}`;

  const fromModel = categoryFromAtalayModel(row);
  if (fromModel) return fromModel;

  if (/tost\s*mak/i.test(hay)) return "tost-makineleri";
  if (/döner\s*mak|doner\s*mak|döner\s*kalıp|doner\s*kalip/i.test(hay)) return "doner-ocaklari-";
  if (/tepsi\s*taşı|tepsi\s*tasi|taşıma\s*arab|tasima\s*arab|istif\s*raf/i.test(hay))
    return "taban-raflari";
  if (/banket|kumpir\s*fır|kumpir\s*fir/i.test(hay)) return "banket-arabalari";
  if (/çay\s*mak|cay\s*mak|türk\s*kahve|turk\s*kahve/i.test(hay)) return "cay-makineleri";
  if (/makarna\s*piş|makarna\s*pis/i.test(hay)) return "makarna-hafllamalar";
  if (/ara\s*tezgah|nötr\s*ara|notr\s*ara|alt\s*stand|dolaplı\s*alt/i.test(hay))
    return "dolaplar-ve-taban-raflari-ara-tezgahlar";

  return null;
}

/** Build + fix: önce override, ızgara slug'ında yalnızca gerçek ızgara kalsın. */
export function normalizeAtalayPisirmeCategory(row: PisirmeRow): string {
  const prev = String(row.category ?? "").trim();
  const override = atalayPisirmeCategoryOverride(row);
  if (override) return override;
  if (prev !== "sanayi-tipi-izgaralar") return prev;
  const model = String(row.model ?? row.sku ?? "").trim();
  if (isAtalayGrillModel(model)) return "sanayi-tipi-izgaralar";
  return categoryFromAtalayModel(row) ?? "ocaklar";
}

/** Yalnızca sanayi-tipi-izgaralar kayıtlarını düzeltir (fix script). */
export function fixMisfiledIzgaraCategory(row: PisirmeRow): string {
  if (row.category !== "sanayi-tipi-izgaralar") return String(row.category ?? "");
  return normalizeAtalayPisirmeCategory(row);
}
