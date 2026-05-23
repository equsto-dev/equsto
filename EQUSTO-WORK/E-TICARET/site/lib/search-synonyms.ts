/**
 * Kısa / İngilizce arama terimleri → katalogdaki Türkçe adlar ve markalar.
 * Meilisearch + fallback ortak kullanır.
 */
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
  firin: ["konveksiyonlu", "kombi"],
  izgara: ["izgaralar", "yer izgarasi"],
  blender: ["blender", "robot coupe"],
  bulasik: ["yikama", "bulaşık"],
  bulaşık: ["yikama", "bulasik"],
  kahve: ["wmf", "cay makinasi", "kahve makinesi", "kahveci"],
  cay: ["cay makinasi", "cay ocagi"],
  çay: ["cay makinasi", "cay ocagi"],
};

function foldTr(s: string) {
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

/** İndeks belgesine eklenecek statik arama ipuçları (dept + kategori). */
export function deptSearchHints(dept: string, category: string): string {
  const d = foldTr(dept);
  const hints: string[] = [dept, category];
  const deptMap: Record<string, string[]> = {
    kahve: ["espresso", "wmf", "cay makinasi", "kahve makinesi", "barista"],
    sogutma: ["buzdolabi", "sogutma dolabi", "derin dondurucu"],
    dolap: ["buzdolabi", "dolap", "sogutma"],
    pisirme: ["ocak", "izgara", "firin", "fritoz"],
    yikama: ["bulasik makinesi", "bulaşık"],
    hazirlik: ["mikser", "blender", "dograma"],
    icecek: ["sogutucu", "meyve sikacagi"],
    "set-ustu-mutfak": ["gastronorm", "tencere", "servis"],
  };
  if (deptMap[d]) hints.push(...deptMap[d]);
  if (/buzdolab/i.test(category)) hints.push("buzdolabi", "sogutma");
  if (/kahve|cay/i.test(category)) hints.push("kahve", "wmf", "espresso", "cay");
  return hints.filter(Boolean).join(" ");
}
