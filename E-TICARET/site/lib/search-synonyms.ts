/**
 * Kısa / İngilizce arama terimleri → katalogdaki Türkçe adlar ve markalar.
 * Meilisearch + fallback ortak kullanır.
 */
import { categorySearchHints, foldTr } from "@/lib/category-search-hints";

const QUERY_ALIASES: Record<string, string[]> = {
  esp: ["wmf", "kahve", "kahve makinesi", "cay makinasi", "turk kahve", "espresso"],
  espresso: ["wmf", "kahve", "kahve makinesi", "cay makinasi"],
  buzdolab: ["buzdolabi", "sogutma", "dolap"],
  buzdolabi: ["sogutma", "dolap"],
  buzdolap: ["buzdolabi", "sogutma"],
  ozti: ["oztiryakiler", "oztiryak"],
  öztiryak: ["oztiryakiler"],
  oztiryakiler: ["oztiryakiler"],
  atalay: ["atalay endustriyel"],
  firin: ["konveksiyonlu", "kombi", "firinlar"],
  firinlar: ["firin", "konveksiyonlu"],
  kombi: ["konveksiyonlu", "firin"],
  izgara: ["izgaralar", "yer izgarasi"],
  izgaralar: ["izgara", "ızgara", "yer izgarasi"],
  ızgara: ["izgara", "izgaralar"],
  gazli: ["gaz", "lpg"],
  elektrikli: ["elektrik"],
  blender: ["blender", "robot coupe"],
  bulasik: ["yikama", "bulaşık"],
  bulaşık: ["yikama", "bulasik"],
  kahve: ["wmf", "cay makinasi", "kahve makinesi"],
  cay: ["cay makinasi", "cay ocagi"],
  çay: ["cay makinasi", "cay ocagi"],
  induksiyonlu: ["enduksiyonlu", "enduksiyon", "induksiyon"],
  enduksiyonlu: ["induksiyonlu", "induksiyon", "enduksiyon"],
  induksiyon: ["enduksiyon", "induksiyonlu", "enduksiyonlu"],
  enduksiyon: ["induksiyon", "induksiyonlu", "enduksiyonlu"],
};

/** Meilisearch ve fallback için genişletilmiş sorgu dizisi (orijinal + eşanlamlılar). */
export function expandSearchQueries(q: string): string[] {
  const raw = String(q || "").trim();
  if (!raw) return [];

  const out: string[] = [];
  const seen = new Set<string>();

  function add(term: string) {
    const t = term.trim();
    if (!t) return;
    const key = foldTr(t);
    if (seen.has(key)) return;
    seen.add(key);
    out.push(t);
  }

  add(raw);

  const tokens = foldTr(raw).split(/\s+/).filter(Boolean);
  for (const tok of tokens) {
    const aliases = QUERY_ALIASES[tok];
    if (aliases) {
      for (const a of aliases) add(a);
    }
  }

  const whole = foldTr(raw);
  const wholeAliases = QUERY_ALIASES[whole];
  if (wholeAliases) {
    for (const a of wholeAliases) add(a);
  }

  return out;
}

/** İndeks / fallback — kategori + ürün adına özel ipuçları. */
export function deptSearchHints(dept: string, category: string, name = ""): string {
  return categorySearchHints(dept, category, name);
}

const DEPT_QUERY_HINTS: Record<string, string[]> = {
  pisirme: ["firin", "ocak", "fritoz", "konveksiyon", "salamander", "induksiyonlu", "enduksiyonlu"],
  sogutma: ["buzdolab", "sogutma", "dondurucu", "dolap"],
  kahve: ["kahve", "espresso", "cay", "wmf"],
  yikama: ["bulasik", "bulaşık", "yikama"],
  hazirlik: ["blender", "mikser", "dograma"],
  icecek: ["sogutucu", "sikacak"],
  "set-ustu-mutfak": ["gastronorm", "kuvet", "küvet", "servis"],
  istif: ["istif", "raf"],
  davlumbaz: ["davlumbaz", "aspirator"],
};

/** Birden fazla departmana yayılan geniş terimler — fallback tüm katalogda aranır. */
const CROSS_DEPT_QUERY_TERMS = new Set([
  "izgara",
  "izgaralar",
  "ızgara",
  "izgar",
  "gazli",
  "elektrikli",
  "salamander",
  "char",
  "ocak",
  "firin",
  "firinlar",
  "buzdolab",
  "buzdolabi",
  "buzdolap",
  "kahve",
  "bulasik",
  "bulaşık",
]);

/** Dar dept JSON ile hızlı fallback (ör. buzdolab → sogutma+dolap). Çok dept'li terimlerde null. */
export function searchDeptsForQuery(q: string): string[] | null {
  const folded = foldTr(String(q || "").trim());
  if (!folded) return null;
  const tokens = folded.split(/\s+/).filter(Boolean);

  for (const tok of tokens) {
    if (CROSS_DEPT_QUERY_TERMS.has(tok)) return null;
  }
  if (CROSS_DEPT_QUERY_TERMS.has(folded)) return null;

  const depts = new Set<string>();

  function matchHint(hint: string) {
    return (
      folded.includes(hint) ||
      hint.includes(folded) ||
      tokens.some((t) => t.includes(hint) || hint.includes(t))
    );
  }

  for (const [dept, hints] of Object.entries(DEPT_QUERY_HINTS)) {
    if (hints.some(matchHint)) depts.add(dept);
  }
  return depts.size ? [...depts] : null;
}

export { categorySearchHints, foldTr, MEILI_SYNONYMS, MEILI_INDEX_SETTINGS } from "@/lib/category-search-hints";
