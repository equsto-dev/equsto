import { foldTr } from "@/lib/search-query";
import type { TeklifV14Satir } from "./teklif-v14.types";

export type MarkaSinif =
  | "pisirme"
  | "sogutma"
  | "yikama"
  | "hazirlik"
  | "kahve"
  | "raf"
  | "nakliye"
  | "diger";

export type MarkaKapsam = "satir" | "ayni_marka" | "grup";

export const MARKA_SINIF_LABEL: Record<MarkaSinif, string> = {
  pisirme: "Pişirme",
  sogutma: "Soğutma",
  yikama: "Yıkama",
  hazirlik: "Hazırlık",
  kahve: "Kahve",
  raf: "Raf",
  nakliye: "Nakliye / montaj",
  diger: "Diğer",
};

const SINIF_RULES: Array<{ sinif: MarkaSinif; re: RegExp }> = [
  { sinif: "nakliye", re: /montaj|nakliye|pfos-montaj/i },
  {
    sinif: "kahve",
    re: /espresso|kahve|de[gğ]irmen|barista|simonelli|filter.?coffee|posa.?[cç]ekmece/i,
  },
  {
    sinif: "yikama",
    re: /bula[sş][iı]k|giyotin|s[iı]y[iı]rma|[cç][iı]k[iı][sş].*tezg|on.?y[iı]kama|bardak.?y[iı]ka/i,
  },
  {
    sinif: "sogutma",
    re: /buzdolab|dondurucu|so[gğ]utucu|saladette|buz.?mak|vitrin|prep.?tezg|tezgah.?alt[iı].*buz/i,
  },
  {
    sinif: "raf",
    re: /istif|portashelf|duvar.?raf|servis.?raf|basket.?raf/i,
  },
  {
    sinif: "pisirme",
    re: /ocak|[iı]zgar|frito|frit[oö]z|f[iı]r[iı]n|salamander|benmari|kuzine|kombi|makarna.?pi[sş]|davlumbaz|tost|waffle|d[oö]ner|char.?broil|k[oö]m[uü]rl[uü]/i,
  },
  {
    sinif: "hazirlik",
    re: /tezgah|evye|mikser|k[iı]yma|dilimle|tester|hamur|vakum|planet/i,
  },
];

const TIP_QUERY: Array<{ re: RegExp; query: string }> = [
  { re: /espresso/i, query: "espresso" },
  { re: /kahve.?makina|kahve.?makine/i, query: "espresso" },
  { re: /de[gğ]irmen/i, query: "kahve değirmeni" },
  { re: /salamander/i, query: "salamander" },
  { re: /4\s*g[oö]z|d[oö]rtl[uü].*ocak/i, query: "4 gözlü ocak" },
  { re: /2\s*g[oö]z|iki.?g[oö]z/i, query: "2 gözlü ocak" },
  { re: /6\s*g[oö]z/i, query: "6 gözlü ocak" },
  { re: /ocak/i, query: "ocak" },
  { re: /d[oö]k[uü]m.?[iı]zgar/i, query: "döküm ızgara" },
  { re: /plate.?[iı]zgar|d[uü]z.?[iı]zgar/i, query: "plate ızgara" },
  { re: /char.?broil|lavata[sş]|lava.?ta[sş]/i, query: "char broil" },
  { re: /[iı]zgar/i, query: "ızgara" },
  { re: /[cç]ift.*frit|frito.*[cç]ift/i, query: "çift hazneli fritöz" },
  { re: /frito|frit[oö]z/i, query: "fritöz" },
  { re: /kombi|icombi|rational/i, query: "kombi fırın" },
  { re: /pizza.?f[iı]r[iı]n|pide.?f[iı]r[iı]n/i, query: "pizza fırın" },
  { re: /konveksiyon|raf.?f[iı]r[iı]n/i, query: "konveksiyon fırın" },
  { re: /f[iı]r[iı]n/i, query: "fırın" },
  { re: /davlumbaz/i, query: "davlumbaz" },
  { re: /benmari/i, query: "benmari" },
  { re: /makarna/i, query: "makarna pişirici" },
  { re: /buzdolab/i, query: "buzdolabı" },
  { re: /dondurucu/i, query: "derin dondurucu" },
  { re: /bula[sş][iı]k/i, query: "bulaşık makinesi" },
  { re: /evye/i, query: "evyeli tezgah" },
  { re: /tezgah/i, query: "çalışma tezgahı" },
];

export function foldMarka(s: string): string {
  return foldTr(String(s || "").replace(/endüstriyel.*$/i, "").trim());
}

export function espressoGrupSayisi(s: string): number | null {
  const t = foldTr(s);
  const n = t.match(/(\d)\s*grup/);
  if (n) return Number(n[1]);
  if (/cift\s*grup|iki\s*grup/.test(t)) return 2;
  if (/\buc\s*grup/.test(t)) return 3;
  if (/tek\s*grup/.test(t)) return 1;
  return null;
}

/** Kahvede «fac» → Faema (dilimleyici FAC değil) */
export function cozHedefMarka(raw: string, sinif: MarkaSinif): string {
  const t = foldMarka(raw);
  if (!t) return raw.trim();
  if (sinif === "kahve") {
    if (t === "fac" || t.startsWith("faem")) return "Faema";
    if (t.includes("simonelli") || t === "appia" || t === "nuova") {
      return "Nuova Simonelli";
    }
    if (t === "wmf") return "WMF";
    if (t.includes("bravilor")) return "Bravilor Bonamat";
  }
  if (t === "fac") return "FAC";
  return raw.trim();
}

export function ayniMarka(a: string, b: string): boolean {
  const x = foldMarka(a);
  const y = foldMarka(b);
  if (!x || !y) return false;
  if (x === y) return true;
  if (x.length >= 4 && y.length >= 4 && (x.includes(y) || y.includes(x))) {
    return true;
  }
  return false;
}

function satirMetin(s: TeklifV14Satir): string {
  return [s.tanim, s.stokNo, s.aciklama, s.olcu, s.marka].filter(Boolean).join(" ");
}

export function satirMarkaSinif(s: TeklifV14Satir): MarkaSinif {
  const t = satirMetin(s);
  for (const rule of SINIF_RULES) {
    if (rule.re.test(t)) return rule.sinif;
  }
  return "diger";
}

export function satirTipArama(s: TeklifV14Satir): string {
  const t = satirMetin(s);
  const grup = espressoGrupSayisi(t);
  if (/espresso|kahve.?makina|kahve.?makine/i.test(t)) {
    return grup ? `espresso ${grup} gruplu` : "espresso";
  }
  for (const row of TIP_QUERY) {
    if (row.re.test(t)) return row.query;
  }
  const words = String(s.tanim || "")
    .split(/[\s,/.-]+/)
    .filter((w) => w.length >= 4)
    .slice(0, 3);
  return words.join(" ") || String(s.tanim || "").slice(0, 40);
}

export function markaDegisimHedefleri(
  satirlar: TeklifV14Satir[],
  index: number,
  kapsam: MarkaKapsam,
): number[] {
  const kaynak = satirlar[index];
  if (!kaynak) return [];
  if (kapsam === "satir") return [index];
  const sinif = satirMarkaSinif(kaynak);
  const marka = kaynak.marka;
  return satirlar
    .map((s, i) => i)
    .filter((i) => {
      const s = satirlar[i];
      if (i === index) return true;
      if (s.markaKilit) return false;
      if (satirMarkaSinif(s) !== sinif) return false;
      if (kapsam === "ayni_marka") return ayniMarka(s.marka, marka);
      return true;
    });
}

export function markaKapsamSayilari(
  satirlar: TeklifV14Satir[],
  index: number,
): { ayniMarka: number; grup: number; kilitli: number; sinif: MarkaSinif } {
  const kaynak = satirlar[index];
  const sinif = kaynak ? satirMarkaSinif(kaynak) : "diger";
  let ayni = 0;
  let grup = 0;
  let kilitli = 0;
  satirlar.forEach((s, i) => {
    if (satirMarkaSinif(s) !== sinif) return;
    grup += 1;
    if (s.markaKilit && i !== index) kilitli += 1;
    if (kaynak && ayniMarka(s.marka, kaynak.marka)) ayni += 1;
  });
  return { ayniMarka: ayni, grup, kilitli, sinif };
}
