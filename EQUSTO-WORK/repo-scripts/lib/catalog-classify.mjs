/**
 * Katalog sınıflandırma — scripts/catalog-taxonomy.json tek kaynak.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { slugifyEq } from '../eq-seo-lib.mjs';

const TAXONOMY_PATH = join(dirname(fileURLToPath(import.meta.url)), '..', 'catalog-taxonomy.json');

let _tax = null;

export function loadTaxonomy() {
  if (_tax) return _tax;
  _tax = JSON.parse(readFileSync(TAXONOMY_PATH, 'utf8'));
  return _tax;
}

export function deptForCategory(slug) {
  const tax = loadTaxonomy();
  const s = String(slug || '').trim();
  return tax.slugToDept[s] || tax.defaultDept;
}

export function getDeptSlugLists() {
  return loadTaxonomy().deptSlugLists || {};
}

function normHay(s) {
  return String(s || '')
    .toLocaleLowerCase('tr')
    .replace(/\s+/g, ' ');
}

/** İş kuralı: isimden departman/slug düzeltmesi (kategori-kurallari-KILIT ile uyumlu). */
export function classifyByName(name, oldCategory) {
  const hay = normHay(name);
  const oc = String(oldCategory || '');

  if (/kıyma|kiyma|mincer|meat grinder/.test(hay)) {
    return { dept: 'hazirlik', category: 'et-hazirlik-makineleri' };
  }
  if (/\b(buz makinesi|buz makin|küp buz|kup buz|berrak buz|frozy)\b/.test(hay) && !/buzdolab/.test(hay)) {
    return { dept: 'sogutma', category: 'icecek-berrak-buz-makineleri' };
  }
  if (/süzgeç|suzgec|oyacak|soyacak|döküm tencere|dokum tencere/.test(hay)) {
    return { dept: 'yardimci', category: 'yardimci-ekipmanlar' };
  }
  if (
    /\b(portakal|narenciye|greyfurt|mandalina)\s*(sıkma|sikma)\b|otomatik\s*portakal|orange\s*juice|juice\s*extractor|meyve\s*s[ıi]kma\s*makinesi/i.test(
      hay
    ) &&
    !/bula[sş][ıi]k|bulaşık\s*makinesi|bulasik\s*makinesi/i.test(hay)
  ) {
    return { dept: 'icecek', category: 'yiyecek-ve-icecek-otomatlari-' };
  }
  if (/hijyen bariyer|hijyen turnike|hijyen ünitesi|el yıkama|el yikama|sanitasyon/.test(hay)) {
    return { dept: 'yikama', category: 'yikama-ekipmanlari' };
  }
  if (
    /çamaşır|camasir|çamaşırhane|camasirhane/.test(hay) &&
    /yıkama|yikama|kurutma|sıkma|sikma|washing|dryer|drier/.test(hay)
  ) {
    return { dept: 'yikama', category: 'bulasik-makineleri' };
  }
  if (/yıkama makinesi|yikama makinesi|washing machine|bulaşık makinesi|bulasik makinesi/.test(hay)) {
    return { dept: 'yikama', category: 'bulasik-makineleri' };
  }
  if (/takım\s*silme|takim\s*silme|çatal\s*bıçak\s*sil|catal\s*bicak\s*sil/i.test(hay)) {
    return { dept: 'yikama', category: 'bulasik-makineleri' };
  }
  if (/\b(istif raf|rafı|rafı\b|storage shelf|duvar raf|malzeme raf|portashelf)\b/i.test(hay) && !/tezgah|ocak|fritoz/.test(hay)) {
    return { dept: 'istif', category: 'paslanmaz-urunler' };
  }
  if (/mermer.*tezgah|çalışma tezgahı.*mermer|calisma tezgahi.*mermer/.test(hay)) {
    return { dept: 'tezgah', category: 'paslanmaz-urunler' };
  }
  if (/açacak|acacak|bottle opener|konserve açacağı/.test(hay)) {
    return { dept: 'yardimci', category: 'yardimci-ekipmanlar' };
  }
  if (/silindirik tencere|sahan|gastronom kap/.test(hay) && !/ocak|fritoz|izgara/.test(hay)) {
    return { dept: 'yardimci', category: 'yardimci-ekipmanlar' };
  }
  if (/yer\s*ızgar|yer\s*izgar/.test(hay)) {
    return { dept: 'yikama', category: 'yikama-ekipmanlari' };
  }
  if (
    /döküm.*tava|dokum.*tava|izgara\s*tavası|izgara\s*tava|wok\s*tava|gastrolley.*tepsi|servis\s*tepsi|self\s*servis\s*tepsi/i.test(
      hay
    )
  ) {
    return { dept: 'yardimci', category: 'yardimci-ekipmanlar' };
  }
  if (/\btepsi\b/.test(hay) && !/ocak|fırın|firin|unox|bongard|kombi|\d+\s*tepsi\s*(\*|x|×|600)/.test(hay)) {
    return { dept: 'yardimci', category: 'yardimci-ekipmanlar' };
  }
  if (/\bsalad\s*bar\b|\bsaladbar\b|\bsoğuk\s*büfe\b|\bsoguk\s*bufe\b/.test(hay)) {
    if (!/\b(ısıt|isit|benmari|chafing)\b/.test(hay) || /\bsoğuk\b|\bsoguk\b/.test(hay)) {
      return { dept: 'market-reyon', category: 'market-reyonlari' };
    }
  }
  if (
    (/(küvet|kuvet)\s*kapak|kapak.*(küvet|kuvet)/i.test(hay) ||
      /gastronom.*(küvet|kuvet)|saplı\s*gastronom.*(küvet|kuvet)|delikli\s*gnp.*(küvet|kuvet)/i.test(hay) ||
      /polikarbon|polipropilen|policarbon/i.test(hay)) &&
    /(küvet|kuvet)/i.test(hay) &&
    !/bain\s*marie|bainmarie|küvetli|kuvetli|küvetsiz|kuvetsiz|küvet\s*kapasiteli|kuvet\s*kapasiteli|salad\s*bar|saladbar|buzdolab|make\s*up|küvet\s*ta[sş]|kuvet\s*ta[sş]|benmari/i.test(
      hay,
    )
  ) {
    return { dept: 'yardimci', category: 'gastronom-kuvetler' };
  }
  if (
    /\byemeklik\b/.test(hay) &&
    /\b(sıcak|sicak|ısıt|isit|self\s*servis)\b/.test(hay) &&
    !/\bsoğuk\b|\bsoguk\b/.test(hay)
  ) {
    return { dept: 'market-reyon', category: 'market-reyonlari' };
  }
  if (/\bself\s*servis\b/.test(hay) && /\b(sıcak|sicak|ısıt|isit)\b/.test(hay) && /\btezgah/i.test(hay)) {
    return { dept: 'market-reyon', category: 'market-reyonlari' };
  }
  if (
    /\bbenmari\b|\bbain\s*marie\b|\bchafing\b/.test(hay) ||
    (/\bpili[cç]\b/.test(hay) && /\b(ısıt|isit|nemlendir)\b/.test(hay)) ||
    /\bsıcak\s*teşhir|\bsicak\s*teshir/.test(hay)
  ) {
    return { dept: 'pisirme', category: 'benmariler-yemeklikler' };
  }
  if (
    /fırın|firin|konveksiyon|kombi fırın|kombi firin|pizza fırın|pizza firin|mayalama dolab|mikrodalga|microwave|salamander/.test(
      hay
    ) &&
    !/fırınlama makinesi|firinlama makinesi/.test(hay)
  ) {
    return { dept: 'pisirme', category: 'firinlar' };
  }
  if (/fritöz|fritoz|deep fry/.test(hay)) {
    return { dept: 'pisirme', category: 'fritozler' };
  }
  if (
    /tulumba|şekillendirme|sekillendirme|köfte şekil|kofte sekil|hamur şekil|hamur sekil/i.test(hay) ||
    (/tulumba/i.test(hay) && /makin|tk\.|emp\.tk|köfte|kofte/i.test(hay)) ||
    (/pastane|patisserie|pastac/i.test(hay) && /şekillendirme|sekillendirme|hamur|tulumba/i.test(hay))
  ) {
    return { dept: 'hazirlik', category: 'hamur-hazirlik-makineleri' };
  }
  if (/\bocak\b|wok|burner|plyt/.test(hay) && !/döner|doner|fırın|firin/.test(hay)) {
    return { dept: 'pisirme', category: 'sanayi-ocaklari' };
  }
  if (/izgara|ızgara|griddle|plancha|lavta/.test(hay) && !/davlumbaz/.test(hay)) {
    if (/ocakbaşı|ocakbasi|char/.test(hay)) return { dept: 'pisirme', category: 'ocakbasi-izgara' };
    return { dept: 'pisirme', category: 'sanayi-tipi-izgaralar' };
  }
  if (/buzdolab|soğutucu|sogutucu|derin dondur|şok dondur|sok dondur|cooling|refrigerat/.test(hay)) {
    return { dept: 'sogutma', category: 'sogutma-ekipmanlari' };
  }
  if (/bulaşık makinesi|bulasik makinesi|bulaşıkhane|bulasikhane/.test(hay)) {
    return { dept: 'yikama', category: 'bulasik-makineleri' };
  }
  if (/davlumbaz|hood|aspiratör|aspirator|eksoz/.test(hay)) {
    return { dept: 'davlumbaz', category: oc || 'paslanmaz-urunler' };
  }
  if (/\barab|tepsi arab|banket arab|servis arab/.test(hay)) {
    return { dept: 'araba', category: oc || 'banket-arabalari' };
  }
  if (/\braf\b|istif raf|portashelf|duvar raf/.test(hay) && !/buzdolab|tezgah/.test(hay)) {
    return { dept: 'istif', category: oc || 'paslanmaz-urunler' };
  }

  return null;
}

/** «Üst > Alt» kategori metninden slug (merge script iyileştirilmiş). */
export function categorySlugFromKategori(kategori) {
  const tax = loadTaxonomy();
  const parts = String(kategori || '')
    .split('>')
    .map((s) => s.trim())
    .filter(Boolean);
  const top = parts[0] || '';
  const leaf = parts[parts.length - 1] || '';
  const tl = top.toLocaleLowerCase('tr');
  const ll = leaf.toLocaleLowerCase('tr');

  if (ll.includes('izgara') || ll.includes('ızgara')) {
    if (ll.includes('ocakbaşı') || ll.includes('ocakbasi')) return 'ocakbasi-izgara';
    return 'sanayi-tipi-izgaralar';
  }
  if (ll.includes('fırın') || ll.includes('firin') || ll.includes('konveksiyon') || ll.includes('pizza')) {
    return 'firinlar';
  }
  if (ll.includes('kuzine')) return 'kuzineler';
  if (ll.includes('fritöz') || ll.includes('fritoz')) return 'fritozler';
  if (ll.includes('döner') || ll.includes('doner')) return 'doner-ocaklari-';
  if (ll.includes('piliç') && ll.includes('çevir')) return 'pilic-cevirme-makineleri';
  if (ll.includes('tost')) return 'tost-makineleri';
  if (ll.includes('benmari') || ll.includes('yemeklik') || ll.includes('servis ünitesi')) {
    return 'benmariler-yemeklikler';
  }
  if (ll.includes('bulaşık') || ll.includes('bulasik')) return 'bulasik-makineleri';
  if (
    ll.includes('hamur') ||
    ll.includes('pastane') ||
    ll.includes('patisserie') ||
    ll.includes('tulumba') ||
    ll.includes('şekillendirme') ||
    ll.includes('sekillendirme')
  ) {
    return 'hamur-hazirlik-makineleri';
  }
  if (ll.includes('et ') && (ll.includes('hazır') || ll.includes('hazir') || ll.includes('kıyma'))) {
    return 'et-hazirlik-makineleri';
  }
  if (ll.includes('kahve') || ll.includes('espresso')) return 'kahve-makineleri';
  if (ll.includes('buz')) {
    if (ll.includes('berrak') || ll.includes('küp')) return 'icecek-berrak-buz-makineleri';
    return 'sogutma-ekipmanlari';
  }
  if (ll.includes('soğut') || ll.includes('sogut') || ll.includes('buzdolab')) return 'sogutma-ekipmanlari';
  if (ll.includes('çay') || ll.includes('cay')) return 'cay-kazanlari-cay-makineleri-cay-otomatlari';
  if (ll.includes('hijyen') || ll.includes('sanitasyon')) return 'yikama-ekipmanlari';
  if (ll.includes('yardımcı') || ll.includes('yardimci') || ll.includes('süzgeç')) return 'yardimci-ekipmanlar';

  const map = tax.topCategoryMap || {};
  if (map[tl]) return map[tl];

  const slug = slugifyEq(top);
  if (slug && slug.length > 2 && tax.slugToDept[slug]) return slug;
  return tax.defaultCategory;
}

export function classifyProduct(item) {
  const tax = loadTaxonomy();
  const name = String(item?.name || item?.ürün_adı || '').trim();
  const oldCat = String(item?.category || '').trim();
  const kategori = item?.kategori || '';

  const byName = classifyByName(name, oldCat);
  if (byName) {
    return { dept: byName.dept, category: byName.category };
  }

  let category = oldCat;
  if (kategori) {
    category = categorySlugFromKategori(kategori);
  } else if (oldCat && tax.slugToDept[oldCat]) {
    category = oldCat;
  } else if (oldCat === 'sanayi-ocaklari') {
    category = tax.defaultCategory;
  } else if (!oldCat || !tax.slugToDept[oldCat]) {
    category = tax.defaultCategory;
  }

  let dept = deptForCategory(category);
  if (dept === 'tezgah' && category === 'paslanmaz-urunler') {
    const n = normHay(name);
    if (/davlumbaz|hood/.test(n)) dept = 'davlumbaz';
    else if (/\barab/.test(n)) dept = 'araba';
    else if (/\braf\b|istif/.test(n)) dept = 'istif';
    else if (/dolap/.test(n) && !/buzdolab/.test(n)) dept = 'dolap';
  }

  return { dept, category };
}

export function catalogId(item) {
  const brand = slugifyEq(item?.brand || item?.ürün_markası || 'marka');
  const sku = String(item?.sku || item?.ürün_kodu || '').trim();
  const name = slugifyEq(item?.name || item?.ürün_adı || '');
  if (sku) return `${brand}__${slugifyEq(sku)}`;
  return `${brand}__${name}`.slice(0, 120);
}
