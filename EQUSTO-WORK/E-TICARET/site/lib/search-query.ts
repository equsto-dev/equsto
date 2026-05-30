/** Ortak arama sorgusu — API, fallback, PLP filtre. */

export function foldTr(s: string): string {
  return String(s || "")
    .toLocaleLowerCase("tr")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/ı/g, "i")
    .replace(/İ/g, "i");
}

/** `buzdolab|buzdolap` → OR dalları; yoksa tek dizi. */
export function splitQueryOrBranches(q: string): string[] {
  const raw = String(q || "").trim();
  if (!raw) return [];
  if (!raw.includes("|")) return [raw];
  const parts = raw.split("|").map((s) => s.trim()).filter(Boolean);
  return parts.length ? parts : [raw];
}

/** Meilisearch tek sorgu — pipe varsa en uzun dal (daha spesifik). */
export function meiliSearchQuery(q: string): string {
  const branches = splitQueryOrBranches(q);
  if (branches.length <= 1) return branches[0] || q;
  return branches.slice().sort((a, b) => b.length - a.length)[0];
}
