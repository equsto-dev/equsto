/**
 * Rule-based TR → EN for catalog product names, specs, and aciklama.
 * Used by scripts/build-product-i18n-en.mjs and mirrored in public/eq-product-i18n-en.js (loader).
 */

/** Longest phrase first */
export const NAME_PHRASES = [
  ["YUFKA YEDEK ACMA", "Yufka dough sheeter spare"],
  ["YUFKA YEDEK AÇMA", "Yufka dough sheeter spare"],
  ["HAMUR AÇMA MAKİNASI", "Dough sheeter"],
  ["HAMUR ACMA MAKİNASI", "Dough sheeter"],
  ["HAMUR AÇMA MAKINASI", "Dough sheeter"],
  ["HAMUR ACMA MAKINASI", "Dough sheeter"],
  ["HAMUR YOĞURMA MAKİNASI", "Spiral dough mixer"],
  ["HAMUR YOGURMA MAKINASI", "Spiral dough mixer"],
  ["MERDANE HIZ KONTROLLU", "speed-controlled roller"],
  ["MERDANE HIZ KONTROLLÜ", "speed-controlled roller"],
  ["MERDANELI HIZ KONTROLLU", "multi-roller speed-controlled"],
  ["3 MERDANELI", "3-roller"],
  ["2 MERDANELI", "2-roller"],
  ["BARDAK YIKAMA MAKINASI", "Undercounter glasswasher"],
  ["BARDAK YIKAMA MAKİNASI", "Undercounter glasswasher"],
  ["BULAŞIK YIKAMA MAKINASI", "Commercial dishwasher"],
  ["BULAŞIK YIKAMA MAKİNASI", "Commercial dishwasher"],
  ["SET ÜSTÜ ARA TEZGAH", "Countertop intermediate work table"],
  ["SET USTU ARA TEZGAH", "Countertop intermediate work table"],
  ["SET ÜSTÜ", "Countertop"],
  ["SET USTU", "Countertop"],
  ["MEKANİK KONTROL PANELLİ", "mechanical control panel"],
  ["MEKANIK KONTROL PANELLI", "mechanical control panel"],
  ["DIK TIP", "Upright"],
  ["DİK TİP", "Upright"],
  ["TEK INOX KAPI", "single stainless door"],
  ["ÇİFT KAPILI", "twin door"],
  ["CIFT KAPILI", "twin door"],
  ["TEK KAPILI", "single door"],
  ["TEK KAPILI", "single door"],
  ["DERIN DONDURUCU", "Chest freezer"],
  ["DERİN DONDURUCU", "Chest freezer"],
  ["BUZDOLABI", "Refrigerator"],
  ["BUZDOLABI", "Refrigerator"],
  ["TEŞHİR DOLABI", "Display cabinet"],
  ["TESHIR DOLABI", "Display cabinet"],
  ["KONVEKSİYONLU FIRIN", "Convection oven"],
  ["KONVEKSIYONLU FIRIN", "Convection oven"],
  ["PİZZA FIRINI", "Pizza oven"],
  ["PIZZA FIRINI", "Pizza oven"],
  ["PLATE IZGARA", "Charbroiler griddle"],
  ["PLATE İZGARA", "Charbroiler griddle"],
  ["ENDÜSTRİYEL MUTFAK", "Commercial kitchen"],
  ["ENDUSTRIYEL MUTFAK", "Commercial kitchen"],
  ["TABAK TAŞIMA ARABASI", "Plate transport cart"],
  ["TABAK TASIMA ARABASI", "Plate transport cart"],
  ["ÇALIŞMA TEZGAHI", "Work table"],
  ["CALISMA TEZGAHI", "Work table"],
  ["HAMUR AÇMA", "Dough sheeting"],
  ["HAMUR ACMA", "Dough sheeting"],
  ["HIZ KONTROLLU", "speed-controlled"],
  ["HIZ KONTROLLÜ", "speed-controlled"],
  ["YEDEK ACMA", "spare sheeter"],
  ["YEDEK AÇMA", "spare sheeter"],
  ["NUOVA SIMONELLI KAHVE MAKİNELERİ", "Nuova Simonelli coffee machines"],
  ["NUOVA SIMONELLI KAHVE MAKINESI", "Nuova Simonelli coffee machines"],
  ["KAHVE MAKİNELERİ", "coffee machines"],
  ["KAHVE MAKINESI", "coffee machines"],
  ["KAHVE MAKİNASI", "espresso machine"],
  ["KAHVE MAKINESI", "espresso machine"],
  ["ESPRESSO MAKİNESİ", "espresso machine"],
  ["ESPRESSO MAKINESI", "espresso machine"],
  ["FILTRE KAHVE MAKINASI", "filter coffee brewer"],
  ["FILTRE KAHVE MAKİNASI", "filter coffee brewer"],
  ["ÇAY OCAKLARI VE KAHVE MAKİNELERİ", "tea brewers and coffee machines"],
  ["WMF KAHVE MAKİNALARI", "WMF coffee machines"],
  ["3 GRUPLU KAHVE", "3-group espresso"],
  ["2 GRUPLU KAHVE", "2-group espresso"],
  ["1 GRUPLU KAHVE", "1-group espresso"],
  ["3 GRUPLU", "3-group"],
  ["2 GRUPLU", "2-group"],
  ["1 GRUPLU", "1-group"],
  ["ÜÇ GRUP TAM OTOMATİK", "3-group fully automatic"],
  ["ÜÇ GRUP TAM OTOMATIK", "3-group fully automatic"],
  ["İKİ GRUP TAM OTOMATİK", "2-group fully automatic"],
  ["BİR GRUP TAM OTOMATİK", "1-group fully automatic"],
  ["TAM OTOMATİK", "fully automatic"],
  ["TAM OTOMATIK", "fully automatic"],
  ["DOZAJ AYARLI", "dose-adjustable"],
  ["APPIA LIFE MODEL", "Appia Life"],
  ["APPIA LIFE", "Appia Life"],
  ["NUOVA SIMONELLI", "Nuova Simonelli"],
  ["NUOSI APPIA", "Nuova Simonelli Appia"],
  ["NUOSI", "Nuova Simonelli"],
  ["yüksek performansı", "high performance"],
  ["yüksek performanı", "high performance"],
  ["fincanda yüksek kaliteyi garantiler", "guarantees high quality in the cup"],
  ["fincanda yüksek kaliteyi garantiler.", "guarantees high quality in the cup."],
  ["ﬁncanda yüksek kaliteyi garantiler", "guarantees high quality in the cup"],
  ["ﬁncanda yüksek kaliteyi garantiler.", "guarantees high quality in the cup."],
  ["ŞEBEKE BAĞLANTI KİTİ", "mains water connection kit"],
  ["SEBEKE BAGLANTI KITI", "mains water connection kit"],
  ["SICAK SU", "hot water"],
  ["SOĞUTUCU", "cooler"],
  ["SOGUTUCU", "cooler"],
  ["SÜT KÖPÜRTME", "milk frothing"],
  ["SUT KOPURTME", "milk frothing"],
  ["BARDAK ISITICI", "cup warmer"],
  ["BARDAK ISITICI", "cup warmer"],
  ["BULAŞIK YIKAMA", "dishwashing"],
  ["BULASIK YIKAMA", "dishwashing"],
  ["ÇAY MAKİNESİ", "tea brewer"],
  ["CAY MAKINASI", "tea brewer"],
  ["ENDÜSTRİYEL TİP", "commercial type"],
  ["ENDUSTRIYEL TIP", "commercial type"],
];

export const NAME_WORDS = [
  ["MAKİNASI", "machine"],
  ["MAKİNELERİ", "machines"],
  ["MAKİNESİ", "machine"],
  ["MAKINELERI", "machines"],
  ["MAKINASI", "machine"],
  ["MAKINESI", "machine"],
  ["ELEKTRİKLİ", "electric"],
  ["ELEKTRIKLI", "electric"],
  ["DOĞALGAZLI", "natural gas"],
  ["DOGALGAZLI", "natural gas"],
  ["DOĞALGAZ", "natural gas"],
  ["DOGALGAZ", "natural gas"],
  ["PASLANMAZ", "stainless"],
  ["MERDANELI", "multi-roller"],
  ["MERDANELİ", "multi-roller"],
  ["MERDANE", "roller"],
  ["YOĞURMA", "mixing"],
  ["YOGURMA", "mixing"],
  ["AÇMA", "sheeting"],
  ["ACMA", "sheeting"],
  ["YIKAMA", "washing"],
  ["FRITÖZ", "fryer"],
  ["FRITOZ", "fryer"],
  ["OCAĞI", "range"],
  ["OCAK", "range"],
  ["IZGARA", "griddle"],
  ["İZGARA", "griddle"],
  ["FIRIN", "oven"],
  ["FIRINI", "oven"],
  ["FIRINI", "oven"],
  ["DOLABI", "cabinet"],
  ["DOLAP", "cabinet"],
  ["TEZGAH", "work table"],
  ["DAVLUMBAZ", "hood"],
  ["KAPILI", "door"],
  ["KAPILI", "with door"],
  ["ÇEKMECELİ", "drawer"],
  ["CEKMECELI", "drawer"],
  ["GÖZLÜ", "compartment"],
  ["GOZLU", "compartment"],
  ["HAVALI", "ventilated"],
  ["FANLI", "fan-assisted"],
  ["KONVEKSİYONLU", "convection"],
  ["KONVEKSIYONLU", "convection"],
  ["MEKANİK", "mechanical"],
  ["MEKANIK", "mechanical"],
  ["OTOMATİK", "automatic"],
  ["OTOMATIK", "automatic"],
  ["DİJİTAL", "digital"],
  ["DIJITAL", "digital"],
  ["GAZLI", "gas"],
  ["EVYELİ", "with sink"],
  ["EVYELI", "with sink"],
  ["DEMONTELİ", "knock-down"],
  ["DEMONTELI", "knock-down"],
  ["ARABALı", "cart"],
  ["ARABALI", "cart"],
  ["TERMAL", "thermal"],
  ["SEPETİ", "basket"],
  ["SEPETI", "basket"],
  ["DİLİMLEME", "slicer"],
  ["DILIMLEME", "slicer"],
  ["VAKUM", "vacuum"],
  ["KARIŞTIRICI", "mixer"],
  ["KARISTIRICI", "mixer"],
  ["BLENDER", "blender"],
  ["Buz", "ice"],
  ["BUZ", "ice"],
  ["ISKONTO", "discount"],
  ["İSKONTO", "discount"],
  ["KAHVE", "coffee"],
  ["GRUPLU", "group"],
  ["GRUP", "group"],
  ["DOZAJ", "dose"],
  ["AYARLI", "adjustable"],
  ["OTOMATİK", "automatic"],
  ["OTOMATIK", "automatic"],
  ["ÜÇ", "three"],
  ["UC", "three"],
  ["İKİ", "two"],
  ["IKI", "two"],
  ["BİR", "one"],
  ["BIR", "one"],
  ["GERİLİM", "voltage"],
  ["GERILIM", "voltage"],
  ["BARDAK", "cup"],
  ["ÇIKOLATA", "chocolate"],
  ["CIKOLATA", "chocolate"],
  ["GRINDER", "grinder"],
  ["SICAK", "hot"],
  ["SOĞUK", "cold"],
  ["SOGUK", "cold"],
  ["ŞEBEKE", "mains"],
  ["SEBEKE", "mains"],
  ["BAĞLANTI", "connection"],
  ["BAGLANTI", "connection"],
  ["KİTİ", "kit"],
  ["KITI", "kit"],
  ["KÖPÜRTME", "frothing"],
  ["KOPURTME", "frothing"],
  ["SÜT", "milk"],
  ["SUT", "milk"],
  ["ÇAY", "tea"],
  ["CAY", "tea"],
  ["MODEL", "model"],
  ["PERFORMANS", "performance"],
  ["PERFORMANI", "performance"],
  ["FİNCAN", "cup"],
  ["FINCAN", "cup"],
  ["FİNCANDA", "in the cup"],
  ["FINCANDA", "in the cup"],
  ["KALİTE", "quality"],
  ["KALITE", "quality"],
  ["GARANTİ", "guarantee"],
  ["GARANTI", "guarantee"],
  ["GARANTİLER", "guarantees"],
  ["GARANTILER", "guarantees"],
  ["YÜKSEK", "high"],
  ["YUKSEK", "high"],
  ["LİSTE", "list"],
  ["LISTE", "list"],
  ["BAYİ", "dealer"],
  ["BAYI", "dealer"],
  ["ALIŞ", "purchase"],
  ["ALIS", "purchase"],
  ["SATIŞ", "sale"],
  ["SATIS", "sale"],
  ["KAR", "margin"],
  ["KALAN", "remaining"],
  ["ORAN", "rate"],
  ["ÖDEME", "payment"],
  ["ODEME", "payment"],
  ["ÇARPAN", "multiplier"],
  ["CARPAN", "multiplier"],
];

export const SPEC_LABELS = [
  ["Teknik Özellikler", "Technical specifications"],
  ["Teknik özellikler", "Technical specifications"],
  ["Ürün kodu", "Product code"],
  ["Ürün Kodu", "Product code"],
  ["Liste fiyatı (EUR)", "List price (EUR)"],
  ["Bayi iskonto", "Dealer discount"],
  ["Bayi net alış (EUR)", "Dealer net (EUR)"],
  ["Bayi net alış", "Dealer net purchase"],
  ["Bayi discount", "Dealer discount"],
  ["kalan oran", "remaining factor"],
  ["Equsto fiyatı", "Equsto price"],
  ["+%8 kar", "+8% margin"],
  ["bayi net", "dealer net"],
  ["ödeme çarpanı", "payment multiplier"],
  ["Equsto satış (EUR)", "Equsto price (EUR)"],
  ["Equsto satış (TL, KDV dahil)", "Equsto price (TRY, VAT incl.)"],
  ["Equsto satış (TL KDV dahil)", "Equsto price (TRY, VAT incl.)"],
  ["Hesap: liste × ödeme çarpanı (Excel BAYİ İSKONTO)", "Calculation: list × payment factor (Excel dealer column)"],
  ["Hesap: liste × (1 − bayi iskonto)", "Calculation: list × payment factor"],
  ["Kur:", "FX rate:"],
  ["Kategori:", "Category:"],
  ["Kaynak:", "Source:"],
  ["Açıklama:", "Description:"],
  ["Aciklama:", "Description:"],
  ["Katalog sayfası", "Catalogue page"],
  ["Katalog Sayfası", "Catalogue page"],
  ["Barkod", "Barcode"],
  ["Güç", "Power"],
  ["Gerilim:", "Voltage:"],
  ["Gerilim", "Voltage"],
  ["Ağırlık:", "Weight:"],
  ["Ağırlık", "Weight"],
  ["Genişlik", "Width"],
  ["Derinlik", "Depth"],
  ["Yükseklik", "Height"],
  ["Kapasite (kazan)", "Capacity (tank)"],
  ["KDV dahil", "VAT incl."],
  ["KDV %20", "VAT 20%"],
  ["Endüstriyel Mutfak", "Commercial kitchen"],
  ["Öztiryakiler Fiyat Listesi", "Öztiryakiler price list"],
  ["Fiyat Listesi", "Price list"],
  ["hamur-acma-makineleri", "dough sheeters"],
  ["hamur-yogurma-makineleri", "dough mixers"],
  ["ara-tezgahlar", "intermediate work tables"],
  ["buzdolaplari-ve-derin-dondurucular", "refrigerators and freezers"],
];

export const DESC_PHRASES = [
  ["Tamamen paslanmaz gövde ve gıda normlarına uygun diğer makina elemanları.", "Fully stainless steel body and food-grade compliant machine components."],
  ["Tamamen paslanmaz gövde ve gıda normlarına uygun diğer makina elemanları", "Fully stainless steel body and food-grade compliant machine components"],
  ["Tamamen paslanmaz gövde", "Fully stainless steel body"],
  ["gıda normlarına uygun", "food-grade compliant"],
  ["diğer makina elemanları", "other machine components"],
  ["Makinamız kullanım kolaylığı dolayısıyla kalifiye eleman gerektirmez.", "Easy to operate — no skilled operator required."],
  ["Makinamız kullanım kolaylığı dolayısıyla kaliﬁye eleman gerektirmez.", "Easy to operate — no skilled operator required."],
  ["Makinamız kullanım kolaylığı dolayısıyla kalifiye eleman gerektirmez", "Easy to operate — no skilled operator required"],
  ["kullanım kolaylığı dolayısıyla kalifiye eleman gerektirmez", "ease of use — no skilled operator required"],
  ["kalifiye eleman gerektirmez", "no skilled operator required"],
  ["Makinamız", "This machine"],
  ["dolayısıyla", "therefore"],
  ["Boyutları itibariyle", "Compact design —"],
  ["Hızlı ve verimli", "Fast and efficient"],
  ["Bakım ve temizliği kolaydır.", "Easy to maintain and clean."],
  ["Bakım ve temizliği kolaydır", "Easy to maintain and clean"],
  ["Sessiz ve titreşimsiz çalışma.", "Quiet, vibration-free operation."],
  ["Sessiz ve titreşimsiz çalışma", "Quiet, vibration-free operation"],
  ["Boyutları itibariyle set üstü çalışabilme özelliği.", "Compact size — suitable for countertop use."],
  ["set üstü çalışabilme özelliği", "suitable for countertop use"],
  ["Hızlı ve verim", "Fast and efficient"],
  ["Ara tezgahlarda kullanılan paslanmaz çelik yüzey hijyenik ve ağır şartlarda çalışma", "Stainless steel surface — hygienic and built for heavy-duty use"],
  ["paslanmaz çelik yüzey hijyenik", "hygienic stainless steel surface"],
  ["ağır şartlarda çalışma", "heavy-duty operation"],
  ["APPIA LIFE MODEL KAHVE MAKİNESİ", "Appia Life espresso machine"],
  ["APPIA LIFE MODEL KAHVE MAKINESI", "Appia Life espresso machine"],
  ["yüksek performanı and", "high performance and"],
  ["yüksek performansı and", "high performance and"],
];

/** @type {[string, string][]} */
const NAME_WORDS_SORTED = [...NAME_WORDS].sort((a, b) => b[0].length - a[0].length);

/**
 * Phrase + word replacements (longest phrases first via NAME_PHRASES order).
 * @param {string} s
 */
export function applyWordReplacements(s) {
  let t = applyPhrasePairs(String(s == null ? "" : s), NAME_PHRASES);
  for (const [from, to] of NAME_WORDS_SORTED) {
    if (from && t.indexOf(from) !== -1) t = t.split(from).join(to);
  }
  t = t.replace(/\bve\b/gi, "and");
  t = t.replace(/\s+/g, " ").trim();
  return t;
}

/**
 * @param {string} s
 * @param {[string, string][]} pairs
 */
export function applyPhrasePairs(s, pairs) {
  let t = String(s == null ? "" : s);
  for (const [from, to] of pairs) {
    if (!from || t.indexOf(from) === -1) continue;
    t = t.split(from).join(to);
  }
  return t;
}

/**
 * @param {string} name
 */
export function translateProductName(name) {
  let t = String(name == null ? "" : name).trim();
  if (!t) return t;
  t = applyWordReplacements(t);
  t = t.replace(/\b(\d+)\s*CM\b/gi, "$1 cm");
  t = t.replace(/\b(\d+)\s*MM\b/gi, "$1 mm");
  t = t.replace(/\b(\d+)\s*KG\b/gi, "$1 kg");
  t = t.replace(/\b(\d+)\s*LT\b/gi, "$1 L");
  t = t.replace(/\s+/g, " ").trim();
  return t;
}

/**
 * @param {string} specs
 * @param {[string, string][]} [extraTerms]
 */
export function translateProductSpecs(specs, extraTerms) {
  let t = String(specs == null ? "" : specs);
  if (!t) return t;
  t = applyPhrasePairs(t, DESC_PHRASES);
  t = applyPhrasePairs(t, SPEC_LABELS);
  if (extraTerms && extraTerms.length) {
    for (const [from, to] of extraTerms) {
      if (from && t.indexOf(from) !== -1) t = t.split(from).join(to);
    }
  }
  const lines = t.split("\n");
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    if (line.trim()) {
      if (i === 0) line = translateProductName(line);
      else if (/^Description:/i.test(line.trim())) {
        line = "Description: " + translateProductDescription(line.replace(/^Description:\s*/i, ""));
      } else {
        line = applyPhrasePairs(line, DESC_PHRASES);
        line = applyWordReplacements(line);
      }
    }
    out.push(line);
  }
  return out.join("\n");
}

/**
 * @param {string} text
 */
export function translateProductDescription(text) {
  let t = String(text == null ? "" : text).trim();
  if (!t) return t;
  if (t.length < 160 && !/\n/.test(t) && /^[A-Z0-9ÇĞİÖŞÜçğıöşü\s*.,\-/()]+$/i.test(t)) {
    return translateProductName(t);
  }
  t = applyPhrasePairs(t, DESC_PHRASES);
  t = applyPhrasePairs(t, SPEC_LABELS);
  t = applyWordReplacements(t);
  return t.replace(/\s+/g, " ").trim();
}

/**
 * @param {{ name?: string, specs?: string, aciklama?: string, description?: string }} p
 */
export function translateProductFields(p) {
  const name = p.name ? translateProductName(p.name) : "";
  const specs = p.specs ? translateProductSpecs(p.specs) : "";
  const rawDesc = (p.aciklama && String(p.aciklama).trim()) || (p.description && String(p.description).trim()) || "";
  const description = rawDesc ? translateProductDescription(rawDesc) : "";
  return { name_en: name, specs_en: specs, description_en: description };
}
