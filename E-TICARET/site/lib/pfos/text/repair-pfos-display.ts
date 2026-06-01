/**
 * PFOS referans / teklif — U+FFFD ve yazım onarımı (Vercel build güvenli yol).
 * Tam sözlük: scripts/lib/repair-turkish-fffd.mjs
 */

const TR_TYPOS_AFTER_FFFD: [string | RegExp, string][] = [
  [/\bFrn\s+stand/gi, "Fırın stand"],
  [/\bFrn\b/gi, "Fırın"],
  [/(\d{2,4})\s+ı\s+(\d{2,4})\s+ı\s+(\d{2,4})/g, "$1×$2×$3"],
  [/(\d{2,4})\s+ı\s+(\d{2,4})/g, "$1×$2"],
  [/S\s+E\s+R\s+V\s+ı\s+S/gi, "SERVIS"],
  [/B\s+U\s+L\s+A\s+ı\s+I\s+K/gi, "BULAŞIK"],
  [/B\s+A\s+R/g, "BAR"],
  [/,ıap:/g, ", çap:"],
  [/model,ıap/g, "model, çap"],
  [/konveyırlı/gi, "konveyörlü"],
  [/konveyırl/gi, "konveyörl"],
  [/ün yıkamalı/gi, "ön yıkamalı"],
  [/ün yıkama/gi, "ön yıkama"],
  [/giriş-ıçıkış/gi, "giriş-çıkış"],
  [/ıçıkış/gi, "çıkış"],
  [/polişretan/gi, "poliüretan"],
  [/poli\uFFFDretan/gi, "poliüretan"],
  [/garnitır üniteli/gi, "garnitürlü üniteli"],
  [/garnitır/gi, "garnitürlü"],
  [/Makina /g, "Makine "],
  [/Makina,/g, "Makine,"],
  [/olişretan/gi, "poliüretan"],
  [/,\s*ıap:/g, ", çap:"],
];

function applyTurkishTypoFixes(s: string | null | undefined): string {
  if (s == null || s === "") return String(s ?? "");
  let t = String(s);
  for (const [from, to] of TR_TYPOS_AFTER_FFFD) {
    t = typeof from === "string" ? t.split(from).join(to) : t.replace(from, to);
  }
  return t;
}

const PHRASES: [string, string][] = [
  ["ayd\uFFFDnlatma \uFFFDnitesi", "aydınlatma ünitesi"],
  ["ayd\uFFFDnlatma", "aydınlatma"],
  ["\uFFFDnitesi", "ünitesi"],
  ["set\uFFFDst\uFFFD", "setüstü"],
  ["\uFFFDal\uFFFD\uFFFDma", "çalışma"],
  ["haz\uFFFDrl\uFFFDk", "hazırlık"],
  ["pi\uFFFDirme", "pişirme"],
  ["So\uFFFDutma", "Soğutma"],
  ["so\uFFFDuk", "soğuk"],
  ["S\uFFFDcak", "Sıcak"],
  ["Ta\uFFFD\uFFFDma", "Taşıma"],
  ["ta\uFFFD\uFFFDma", "taşıma"],
  ["Frit\uFFFDz", "Fritöz"],
  ["F\uFFFDr\uFFFDn", "Fırın"],
  ["f\uFFFDr\uFFFDn", "fırın"],
  ["gazl\uFFFD", "gazlı"],
  ["kap\uFFFDl\uFFFD", "kapılı"],
  ["mod\uFFFDl", "modül"],
  ["d\uFFFDz", "düz"],
  ["a\uFFFD\uFFFDk", "açık"],
  ["y\uFFFDkamal\uFFFD", "yıkamalı"],
  ["y\uFFFDksek", "yüksek"],
  ["g\uFFFDvde", "gövde"],
  ["k\uFFFDvet", "küvet"],
  ["B\uFFFD\uFFFDak", "Bıçak"],
  ["b\uFFFD\uFFFDak", "bıçak"],
  ["\uFFFD\uFFFDk\uFFFD\uFFFD", "çıkış"],
  ["\uFFFDst\uFFFD", "üstü"],
];

const SORTED = [...PHRASES].sort((a, b) => b[0].length - a[0].length);

const FFFD_TAIL: [RegExp, string][] = [
  [/,\uFFFDap:/gi, ", çap:"],
  [/konvey\uFFFDr/gi, "konveyör"],
  [/poli\uFFFDretan/gi, "poliüretan"],
  [/garnit\uFFFDr/gi, "garnitür"],
  [/giriş-\uFFFD\uFFFDk\uFFFD\uFFFD/gi, "giriş-çıkış"],
  [/\uFFFDn y\uFFFD/gi, "ön yı"],
  [/gazl\uFFFD/gi, "gazlı"],
  [/set\uFFFDst\uFFFD/gi, "setüstü"],
  [/mod\uFFFDl/gi, "modül"],
  [/kap\uFFFDl\uFFFD/gi, "kapılı"],
  [/d\uFFFDz/gi, "düz"],
  [/Frit\uFFFDz/gi, "Fritöz"],
  [/f\uFFFDr\uFFFDn/gi, "fırın"],
];

export function repairTurkishFffd(s: string | null | undefined): string {
  if (s == null || s === "") return String(s ?? "");
  let t = String(s);
  if (t.includes("\uFFFD")) {
    for (const [from, to] of SORTED) {
      if (t.includes(from)) t = t.split(from).join(to);
    }
    for (const [re, rep] of FFFD_TAIL) {
      t = t.replace(re, rep);
    }
  }
  return applyTurkishTypoFixes(t);
}

export function repairPfosDisplayText(s: string | null | undefined): string {
  return repairTurkishFffd(s);
}
