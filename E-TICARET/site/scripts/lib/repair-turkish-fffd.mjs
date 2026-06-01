/**
 * PFOS referans / katalog metinlerinde U+FFFD → Türkçe karakter onarımı.
 * Excel → Python (Windows) → JSON zincirinde kaybolan UTF-8 için kural tabanlı düzeltme.
 */

/** Uzun ifadeler önce (en spesifik) */
export const TR_FFFD_PHRASES = [
  ["ayd\uFFFDnlatma \uFFFDnitesi", "aydınlatma ünitesi"],
  ["ayd\uFFFDnlatma", "aydınlatma"],
  ["\uFFFDnitesi", "ünitesi"],
  ["set\uFFFDst\uFFFD", "setüstü"],
  ["set\uFFFDst", "setüstü"],
  ["\uFFFDal\uFFFD\uFFFDma", "çalışma"],
  ["\uFFFDal\uFFFDma", "çalışma"],
  ["\uFFFDal\uFFFD\uFFFDma tezgah", "çalışma tezgah"],
  ["\uFFFDal\uFFFDma tezgah", "çalışma tezgah"],
  ["haz\uFFFDrl\uFFFDk", "hazırlık"],
  ["pi\uFFFDirme", "pişirme"],
  ["So\uFFFDutma", "Soğutma"],
  ["so\uFFFDuk", "soğuk"],
  ["So\uFFFDuk", "Soğuk"],
  ["S\uFFFDcak", "Sıcak"],
  ["s\uFFFDcak", "sıcak"],
  ["Ta\uFFFD\uFFFDma", "Taşıma"],
  ["ta\uFFFD\uFFFDma", "taşıma"],
  ["Ye\uFFFDil", "Yeşil"],
  ["ye\uFFFDil", "yeşil"],
  ["yo\uFFFDurma", "yoğurma"],
  ["de\uFFFDirmen", "değirmen"],
  ["B\uFFFD\uFFFDak", "Bıçak"],
  ["b\uFFFD\uFFFDak", "bıçak"],
  ["\uFFFD\uFFFDk\uFFFD\uFFFD\uFFFD", "çıkış"],
  ["\uFFFD\uFFFDk\uFFFD\uFFFD", "çıkış"],
  ["\uFFFD\uFFFDp", "çöp"],
  ["\uFFFD\uFFFDp ", "çöp "],
  ["y\uFFFDkama", "yıkama"],
  ["y\uFFFDkamal\uFFFD", "yıkamalı"],
  ["y\uFFFDksek", "yüksek"],
  ["g\uFFFDvde", "gövde"],
  ["h\uFFFDzl\uFFFD", "hızlı"],
  ["k\uFFFDvetli", "küvetli"],
  ["k\uFFFDvet", "küvet"],
  ["e\uFFFDimli", "eğimli"],
  ["Ord\uFFFDvr", "Ordövr"],
  ["Kep\uFFFDe", "Kepçe"],
  ["K\uFFFDyma", "Kıyma"],
  ["B\uFFFDlme", "Bölme"],
  ["Yap\uFFFD\uFFFDkan", "Yapışkan"],
  ["Is\uFFFDtma", "Isıtma"],
  ["\uFFFDs\uFFFDtma", "ısıtma"],
  ["S\uFFFDzme", "Süzme"],
  ["s\uFFFDzme", "süzme"],
  ["Frit\uFFFDz", "Fritöz"],
  ["frit\uFFFDz", "fritöz"],
  ["F\uFFFDr\uFFFDn", "Fırın"],
  ["f\uFFFDr\uFFFDn", "fırın"],
  ["gazl\uFFFD", "gazlı"],
  ["Gazl\uFFFD", "Gazlı"],
  ["kap\uFFFDl\uFFFD", "kapılı"],
  ["mod\uFFFDl", "modül"],
  ["mod\uFFFDl\uFFFD", "modüllü"],
  ["d\uFFFDz", "düz"],
  ["a\uFFFD\uFFFDk", "açık"],
  ["stand\uFFFD", "standı"],
  ["akl\uFFFDk", "aklık"],
  ["akl\uFFFD", "aklı"],
  ["bas\uFFFD", "bası"],
  ["gah\uFFFD", "gahı"],
  ["lal\uFFFD", "lalı"],
  ["lal\uFFFDkl\uFFFD", "lalıklı"],
  ["lab\uFFFD", "labı"],
  ["mal\uFFFD", "malı"],
  ["nas\uFFFD", "nası"],
  ["p\uFFFDl\uFFFD", "pülü"],
  ["raf\uFFFD", "rafı"],
  ["val\uFFFD", "valı"],
  ["yal\uFFFD", "yalı"],
  ["zal\uFFFD", "zalı"],
  ["pal\uFFFD", "palı"],
  ["\uFFFDst\uFFFD", "üstü"],
  ["\uFFFDst\uFFFD ", "üstü "],
  ["\uFFFDn y", "ün y"],
  ["\uFFFDn Y", "ün Y"],
  ["\uFFFDift", "üift"],
  ["\uFFFDift ", "çift "],
  ["\uFFFDnoks", "inox"],
  ["\uFFFD- \uFFFDnox", "- inox"],
  ["\uFFFDnox", "inox"],
  ["s\uFFFDf\uFFFDr", "süfer"],
  ["s\uFFFDra", "sıra"],
  ["s\uFFFDf\uFFFDrlama", "süfrlama"],
  ["\uFFFDap\uFFFD", "şapı"],
  ["\uFFFDas\uFFFD", "yaşı"],
  ["\uFFFDay", "çay"],
  ["\uFFFDki ", "çki "],
  ["\uFFFDk \uFFFDnit", "ık ünit"],
  ["\uFFFDnit", "ünit"],
  ["\uFFFDr \uFFFDnit", "ır ünit"],
  ["\uFFFDr\uFFFDc\uFFFD", "ürücü"],
  ["\uFFFDzl\uFFFD", "özlü"],
  ["\uFFFDvey\uFFFDrl\uFFFD", "şveyırlı"],
  ["\uFFFDt\uFFFD\uFFFD\uFFFD", "ütüşü"],
  ["\uFFFDt\uFFFD\uFFFD", "ütüş"],
  ["\uFFFDec", "içec"],
  ["\uFFFD\uFFFDece", "içece"],
  ["du\uFFFDu", "duşu"],
  ["Du\uFFFDu", "Duşu"],
  ["D\uFFFD\uFFFD ", "Dış "],
  ["\uFFFDld\uFFFDr\uFFFDc", "ıldırıc"],
  ["\uFFFDnd\uFFFD", "ındı"],
  ["\uFFFDnd\uFFFDks", "ındüks"],
  ["par\uFFFDas\uFFFD", "parçası"],
  ["art\uFFFDm", "artım"],
  ["rat\uFFFDrl\uFFFD", "ratörlü"],
  ["zat\uFFFDr\uFFFD", "zatırı"],
  ["eyn\uFFFDr", "eynır"],
  ["d\uFFFDr\uFFFDc\uFFFD", "dürücü"],
  ["lat\uFFFDc\uFFFD", "latıcı"],
  ["\uFFFDk\uFFFD\uFFFD\uFFFDl\uFFFD", "ıkışlı"],
  ["\uFFFDk\uFFFD\uFFFDl\uFFFD,", "ıkışlı,"],
  ["\uFFFDk\uFFFD\uFFFDl\uFFFD tezgah", "ıkışlı tezgah"],
  ["\uFFFDk\uFFFD\uFFFD tezgah", "çıkış tezgah"],
  ["\uFFFDk\uFFFD\uFFFDl\uFFFD tezgah", "çıkışlı tezgah"],
  ["\uFFFDap\uFFFD:64", "şapı:64"],
  ["\uFFFD T\uFFFDP", " TİP"],
  ["SI\uFFFD T\uFFFD", "SIKI Tİ"],
  ["VC(\uFFFD75m", "VC(Ø75m"],
  ["(Y\uFFFDBER", "(YÜBER"],
  ["EKL\uFFFD", "EKLİ"],
  ["Hz,\uFFFD\uFFFD\uFFFDtme", "Hz,ısıtme"],
  ["\uFFFD\uFFFD\uFFFDtme", "ısıtme"],
  ["3h\uFFFDzl\uFFFD", "3hızlı"],
  ["g/g\uFFFDn", "g/gün"],
  ["ta\uFFFD ta", "taş ta"],
  ["Ta\uFFFD ta", "Taş ta"],
  ["\uFFFDay ", "çay "],
  ["i\uFFFD y\uFFFD", "iç yı"],
  [". i\uFFFD y\uFFFD", ". iç yı"],
  ["i\uFFFDin", "için"],
  ["i\uFFFDin,", "için,"],
  ["i\uFFFDlik", "işlik"],
  ["i\uFFFD-", "iç-"],
  ["i\uFFFD-\uFFFD\uFFFDk\uFFFD\uFFFD", "iç-çıkış"],
  ["\uFFFDi\uFFFD", "iş"],
  ["\uFFFDap\uFFFD", "kapı"],
  ["\uFFFDl\uFFFD ", "ülü "],
  ["\uFFFDl\uFFFD  f", "ülü  f"],
  ["l\uFFFD \uFFFD400", "lı Ø400"],
  ["l\uFFFD \uFFFD500", "lı Ø500"],
  ["\uFFFD \uFFFD 39", "ü Ø 39"],
  ["\uFFFDnoks", "inox"],
  ["\uFFFDap\uFFFD", "şapı"],
  ["\uFFFDas\uFFFD da", "yaşı da"],
  ["\uFFFDrl\uFFFDk \uFFFD", "ırlık ü"],
  ["\uFFFDrl\uFFFD", "ırlı"],
  ["\uFFFDrl\uFFFD, ", "ırlı, "],
  ["\uFFFDrl\uFFFD, t", "ırlı, t"],
  ["\uFFFDrl\uFFFD, \uFFFD", "ırlı, ü"],
  ["\uFFFDr\uFFFD, 1", "ürü, 1"],
  ["\uFFFDr\uFFFD ", "ürü "],
  ["\uFFFDr\uFFFD,", "ürü,"],
  ["\uFFFDr\uFFFDc\uFFFD ", "ürücü "],
  ["\uFFFDap\uFFFDkan", "yapışkan"],
  ["ap\uFFFD\uFFFDkan", "apışkan"],
  ["afl\uFFFD", "aflı"],
  ["and\uFFFD", "andı"],
  ["apl\uFFFD", "aplı"],
  ["arl\uFFFD", "arlı"],
  ["ask\uFFFD", "askı"],
  ["ask\uFFFDl\uFFFD", "askılı"],
  ["atl\uFFFD-", "atlı-"],
  ["dal\uFFFD,", "dalı,"],
  ["ek \uFFFDld\uFFFD", "ek ıldı"],
  ["er \uFFFDnit", "er ünit"],
  ["er \uFFFDzga", "er üzga"],
  ["gah\uFFFD, ", "gahı, "],
  ["iri\uFFFD", "iriş"],
  ["iri\uFFFD-", "iriş-"],
  ["iri\uFFFDli", "irişli"],
  ["is \uFFFDnit", "is ünit"],
  ["iti\uFFFD te", "itiş te"],
  ["k, \uFFFD 30", "k, Ø 30"],
  ["k\uFFFDt\uFFFD\uFFFD\uFFFD", "kütüşü"],
  ["k\uFFFDt\uFFFD\uFFFD", "kütüş"],
  ["k\uFFFDr\uFFFD", "kürü"],
  ["l y\uFFFDkam", "l yıkam"],
  ["l s\uFFFDkma", "l sıkma"],
  ["l s\uFFFDra", "l sıra"],
  ["l, \uFFFDift", "l, çift"],
  ["ma \uFFFDnit", "ma ünit"],
  ["me \uFFFDap\uFFFD", "me şapı"],
  ["nit\uFFFDr \uFFFD", "nitör ü"],
  ["oli\uFFFDret", "olişret"],
  ["ras\uFFFD", "rası"],
  ["ras\uFFFD, t", "rası, t"],
  ["rit\uFFFDz,", "ritöz,"],
  ["t k\uFFFDt\uFFFD\uFFFD", "t kütüş"],
  ["t+ \uFFFDst ", "t+ üst "],
  ["t\uFFFDc\uFFFD po", "tıcı po"],
  ["u f\uFFFDr\uFFFDn", "u fırın"],
  ["u s\uFFFDcak", "u sıcak"],
  ["ula\uFFFD\uFFFDk", "ulaşık"],
  ["yar\uFFFD ot", "yarü ot"],
  ["zan\uFFFD ka", "zanı ka"],
  ["z,\uFFFD\uFFFD\uFFFDtm", "z,ısıtm"],
  ["anl\uFFFD", "anlı"],
  ["anl\uFFFD-", "anlı-"],
  ["anl\uFFFD,", "anlı,"],
  ["anl\uFFFD, ", "anlı, "],
  ["anl\uFFFD-Pa", "anlı-Pa"],
  ["an  \uFFFD\uFFFDk\uFFFD\uFFFD", "an çıkış"],
  ["sa\uFFFD (P", "saç (P"],
  ["( \uFFFDs\uFFFDtma", "( ısıtma"],
  [", D\uFFFD\uFFFD \uFFFD", ", Dış ü"],
  [", e\uFFFDims", ", eğims"],
  [", s\uFFFDrt ", ", sırt "],
  [", d\uFFFDz+o", ", düz+o"],
  [", d\uFFFDz, ", ", düz, "],
  [". f\uFFFDr\uFFFDn", ". fırın"],
  ["0 b\uFFFD\uFFFDak", "0 bıçak"],
  ["0 k\uFFFDvet", "0 küvet"],
  ["0 l\uFFFDk t", "0 lık t"],
  ["1 f\uFFFDr\uFFFDn", "1 fırın"],
  ["4 a\uFFFD\uFFFDk ", "4 açık "],
  ["5 k\uFFFDvet", "5 küvet"],
  ["6 a\uFFFD\uFFFDk ", "6 açık "],
  ["8 C\uFFFD ,", "8 Cü ,"],
  ["F\uFFFDr\uFFFDn a", "Fırın a"],
  ["F\uFFFDr\uFFFDn s", "Fırın s"],
  ["Kap\uFFFDl\uFFFD ", "Kapılı "],
  ["n Y\uFFFDkam", "n Yıkam"],
  ["n g\uFFFDvde", "n gövde"],
  ["n i\uFFFDin", "n için"],
  ["n y\uFFFDkam", "n yıkam"],
  ["n \uFFFD\uFFFDk\uFFFD\uFFFD", "n çıkış"],
  ["f\uFFFDr\uFFFDn i", "fırın i"],
  ["f\uFFFDr\uFFFDn m", "fırın m"],
  ["f\uFFFDr\uFFFDn,", "fırın,"],
  ["f\uFFFDr\uFFFDn,e", "fırın,e"],
  ["Buharl\uFFFD f\uFFFDr\uFFFDn", "Buharlı fırın"],
  ["F\uFFFDr\uFFFDn stand\uFFFD", "Fırın standı"],
  ["Davlumbaz ayd\uFFFDnlatma \uFFFDnitesi", "Davlumbaz aydınlatma ünitesi"],
];

/** Tek FFFD için bağlama göre tahmin (son çare) */
const SINGLE_FFFD_RULES = [
  [/gazl\uFFFD/gi, "gazlı"],
  [/set\uFFFDst\uFFFD/gi, "setüstü"],
  [/mod\uFFFDl/gi, "modül"],
  [/kap\uFFFDl\uFFFD/gi, "kapılı"],
  [/d\uFFFDz/gi, "düz"],
  [/Frit\uFFFDz/gi, "Fritöz"],
  [/f\uFFFDr\uFFFDn/gi, "fırın"],
  [/y\uFFFDk/gi, "yık"],
  [/g\uFFFDv/gi, "göv"],
  [/k\uFFFDv/gi, "küv"],
  [/h\uFFFDz/gi, "hız"],
  [/a\uFFFD\uFFFDk/gi, "açık"],
  [/So\uFFFDuk/gi, "Soğuk"],
  [/so\uFFFDuk/gi, "soğuk"],
  [/S\uFFFDcak/gi, "Sıcak"],
  [/Ta\uFFFD\uFFFDma/gi, "Taşıma"],
  [/ta\uFFFD\uFFFDma/gi, "taşıma"],
  [/\uFFFDnitesi/gi, "ünitesi"],
  [/\uFFFDal\uFFFD\uFFFDma/gi, "çalışma"],
  [/\uFFFDst\uFFFD/gi, "üstü"],
];

/**
 * @param {string} s
 * @returns {string}
 */
export function repairTurkishFffd(s) {
  if (s == null || s === "") return s;
  let t = String(s);

  if (t.includes("\uFFFD")) {
    const phrases = [...TR_FFFD_PHRASES].sort((a, b) => b[0].length - a[0].length);
    for (const [from, to] of phrases) {
      if (t.includes(from)) t = t.split(from).join(to);
    }
    for (const [re, rep] of SINGLE_FFFD_RULES) {
      t = t.replace(re, rep);
    }
    t = t
      .replace(/,\uFFFDap:/gi, ", çap:")
      .replace(/konvey\uFFFDr/gi, "konveyör")
      .replace(/poli\uFFFDretan/gi, "poliüretan")
      .replace(/garnit\uFFFDr/gi, "garnitür")
      .replace(/giriş-\uFFFD\uFFFDk\uFFFD\uFFFD/gi, "giriş-çıkış")
      .replace(/\uFFFDn y\uFFFD/gi, "ön yı");
  }

  return applyTurkishTypoFixes(t);
}

const TYPO_FIXES = [
  [/,ıap:/g, ", çap:"],
  [/konveyırlı/gi, "konveyörlü"],
  [/ün yıkamalı/gi, "ön yıkamalı"],
  [/ün yıkama/gi, "ön yıkama"],
  [/giriş-ıçıkış/gi, "giriş-çıkış"],
  [/ıçıkış/gi, "çıkış"],
  [/polişretan/gi, "poliüretan"],
  [/garnitır üniteli/gi, "garnitürlü üniteli"],
  [/garnitır/gi, "garnitürlü"],
  [/Makina /g, "Makine "],
  [/olişretan/gi, "poliüretan"],
];

export function applyTurkishTypoFixes(s) {
  if (s == null || s === "") return s;
  let t = String(s);
  for (const [from, to] of TYPO_FIXES) {
    t = typeof from === "string" ? t.split(from).join(to) : t.replace(from, to);
  }
  return t;
}

/**
 * @param {unknown} obj
 * @returns {{ obj: unknown, fixes: number }}
 */
export function repairObjectFffdDeep(obj) {
  let fixes = 0;
  function walk(v) {
    if (typeof v === "string") {
      const next = repairTurkishFffd(v);
      if (next !== v) fixes++;
      return next;
    }
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === "object") {
      const out = {};
      for (const [k, val] of Object.entries(v)) {
        out[k] = walk(val);
      }
      return out;
    }
    return v;
  }
  return { obj: walk(obj), fixes };
}

/**
 * @param {string} text
 */
export function countFffd(text) {
  return (String(text).match(/\uFFFD/g) || []).length;
}
