/**
 * Mutbex / Cafemarkt vitrin sırası — build için.
 * Kaynak: public/eq-dept-tips.js — npm run data:dept öncesi: node scripts/sync-dept-plp-rank.mjs
 */
export const RAW = [
    { tip: "firinlar", dept: "pisirme", label: "Fırınlar", search: "fırın|firin|konveksiyon|kombi|kombili|combi|pizza|mayalama|mikrodalga|microwave|pastane fırın" },
    { tip: "kombi-firin", dept: "pisirme", label: "Kombi Fırınlar", search: "kombi|kombili|icombi|combi" },
    { tip: "konveksiyonlu-firin", dept: "pisirme", label: "Konveksiyonlu Fırınlar", search: "konveksiyon|konveksiyonel" },
    { tip: "jet-mikrodalga-firin", dept: "pisirme", label: "Jet ve Mikrodalga Fırınlar", search: "mikrodalga|jet|microwave" },
    { tip: "komurlu-firin", dept: "pisirme", label: "Kömürlü Fırınlar", search: "kömür|komur|taş fırın|tas firin|lahmacun|pide" },
    { tip: "pizza-firinlari", dept: "pisirme", label: "Pizza Fırınları", search: "pizza|kubbe|taş taban" },
    { tip: "mayalama-dolabi", dept: "pisirme", label: "Mayalama Dolapları", search: "mayalama|prover|ferment" },
    { tip: "induksiyonlu-ocak", dept: "pisirme", label: "İndüksiyonlu Ocaklar", search: "indüksiyon|induksiyon|induction" },
    { tip: "asansorlu-izgara", dept: "pisirme", label: "Asansörlü Izgaralar", search: "asansör|asansor|elevator|izgara" },
    { tip: "doner-ocaklari", dept: "pisirme", label: "Döner Ocakları", search: "döner|doner|kebab|kebap" },
    { tip: "pilic-cevirme", dept: "pisirme", label: "Piliç Çevirme Makineleri", search: "piliç|pilic|rotisserie|çevirme|cevirme" },
    { tip: "lavtasli_izgara", dept: "pisirme", label: "Lavtaşlı Izgara", search: "lavta|lavtaş|griddle|plancha" },
    { tip: "char_izgara", dept: "pisirme", label: "Char Izgara", search: "char|kömür|komur|ocakbaşı|ocakbasi" },
    { tip: "salamander", dept: "pisirme", label: "Salamander", search: "salamander|gratin|üst ızgara|ust izgara" },
    { tip: "patates_dinlendirme", dept: "pisirme", label: "Patates Dinlendirme", search: "patates|dinlendirme|holding" },
    { tip: "sanayi-ocaklari", dept: "pisirme", label: "Endüstriyel Ocaklar", slug: "sanayi-ocaklari" },
    { tip: "sanayi-tipi-izgaralar", dept: "pisirme", label: "Endüstriyel Izgaralar", slug: "sanayi-tipi-izgaralar" },
    { tip: "kuzineler", dept: "pisirme", label: "Kuzineler", slug: "kuzineler" },
    { tip: "fritozler", dept: "pisirme", label: "Fritözler", slug: "fritozler" },
    { tip: "doner-ocaklari-", dept: "pisirme", label: "Döner Ocakları", slug: "doner-ocaklari-" },
    { tip: "tost-makineleri", dept: "pisirme", label: "Tost Makineleri", slug: "tost-makineleri" },
    { tip: "pilic-cevirme-makineleri", dept: "pisirme", label: "Piliç Çevirme", slug: "pilic-cevirme-makineleri" },
    { tip: "ocakbasi-izgara", dept: "pisirme", label: "Ocakbaşı Izgaralar", slug: "ocakbasi-izgara" },
    { tip: "tezgah-tipi-buzdolabi", dept: "sogutma", label: "Tezgah Tipi Buzdolapları", search: "tezgah tip|tezgahalt|counter" },
    { tip: "make-up-dolabi", dept: "sogutma", label: "Make Up Dolapları", search: "make up|make-up|makyaj" },
    { tip: "dik-tip-buzdolap", dept: "sogutma", label: "Dik Tip Buzdolaplar", search: "dik tip|dik buzdolab|upright" },
    { tip: "buz-makinesi", dept: "sogutma", label: "Buz Makineleri", search: "buz mak|ice maker|ice machine" },
    { tip: "derin-dondurucu", dept: "sogutma", label: "Derin Dondurucular", search: "derin dondur|freezer|dondurucu" },
    { tip: "dry_age_dolabi", dept: "sogutma", label: "Dry-Age Dolabı", search: "dry age|dry-age|olgunlaştır" },
    { tip: "blast-chiller", dept: "sogutma", label: "Blast Chiller", search: "blast|şok|sok|chiller|shock" },
    { tip: "soguk-oda", dept: "sogutma", label: "Soğuk Odalar", search: "soğuk oda|soguk oda|cold room" },
    { tip: "balik-teshir", dept: "sogutma", label: "Balık Teşhir Reyonları", search: "balık|balik|fish|teşhir" },
    { tip: "sarap-dolabi", dept: "sogutma", label: "Şarap Dolapları", search: "şarap|sarap|wine" },
    { tip: "espresso-makinesi", dept: "kahve", label: "Espresso Kahve Makineleri", search: "espresso" },
    { tip: "kahve-degirmeni", dept: "kahve", label: "Kahve Değirmenleri", search: "değirmen|degirmen|grinder|öğüt|ogut" },
    { tip: "filtre-kahve", dept: "kahve", label: "Filtre Kahve Makineleri", search: "filtre|batch brew|demleme" },
    { tip: "turk-kahve", dept: "kahve", label: "Türk Kahve Makineleri", search: "türk|turk|cezve" },
    { tip: "setalti-bulasik", dept: "yikama", label: "Setaltı Bulaşık Makineleri", search: "setaltı|set altı|tezgah altı|undercounter" },
    { tip: "giyotin-bulasik", dept: "yikama", label: "Giyotin Tip Bulaşık Makineleri", search: "giyotin|hood type" },
    { tip: "konveyorlu-bulasik", dept: "yikama", label: "Konveyörlü Bulaşık Makineleri", search: "konveyör|konveyor|tunnel|konveyörlü" },
    { tip: "tirnakli-bulasik", dept: "yikama", label: "Tırnaklı Bulaşık Makineleri", search: "tırnaklı|tirnakli|rack" },
    { tip: "kazan-yikama", dept: "yikama", label: "Kazan Yıkama Makineleri", search: "kazan yıkama|kettle|pot wash" },
    { tip: "et-hazirlik", dept: "hazirlik", label: "Et Hazırlık Ekipmanları", search: "et hazırlık|et hazirlik|kasap" },
    { tip: "et_kutugu", dept: "hazirlik", label: "Et Kütüğü", search: "kütük|kutuk|butcher block" },
    { tip: "kiyma_makinesi", dept: "hazirlik", label: "Et Kıyma Makinesi", search: "kıyma|kiyma|mincer" },
    { tip: "et_kemik_testeresi", dept: "hazirlik", label: "Et Kemik Testeresi", search: "kemik testere|bone saw" },
    { tip: "sebze-dograma", dept: "hazirlik", label: "Sebze Doğrama Makineleri", search: "sebze|doğrama|dograma|vegetable" },
    { tip: "hamur-hazirlik", dept: "hazirlik", label: "Hamur Hazırlık", search: "hamur|spiral|planet|yoğur" },
    { tip: "vakum-makinesi", dept: "hazirlik", label: "Vakum Makineleri", search: "vakum|vacuum" },
    { tip: "sous-vide", dept: "hazirlik", label: "Sous Vide", search: "sous vide|sous-vide" },
    { tip: "bar-blender", dept: "icecek", label: "Bar Blenderlar", search: "bar blender|blender|smoothie|buz kırıcı bar|buz kirici bar" },
    { tip: "portakal-sikma", dept: "icecek", label: "Portakal & Narenciye Sıkma", search: "portakal|narenciye|nar sık|nar sik|meyve suyu|juice|sıkma mak|sikma mak|sıkma pres|sikma pres" },
    { tip: "kati-meyve-sikacagi", dept: "icecek", label: "Katı Meyve Sıkacakları", search: "katı meyve|kati meyve|meyve presi|cold press" },
    { tip: "soguk-dispenser", dept: "icecek", label: "Soğuk İçecek Dispenseri", search: "soğuk içecek|soguk icecek|fıskiyeli|fiskiyeli|soğuk disp|soguk disp" },
    { tip: "limonata-serbet", dept: "icecek", label: "Limonata & Şerbet", search: "limonata|şerbet|serbet" },
    { tip: "ayran-makinesi", dept: "icecek", label: "Ayran Makineleri", search: "ayran|köpüklü ayran|kopuklu ayran" },
    { tip: "granita-slush", dept: "icecek", label: "Granita & Slush", search: "granita|slush|buzlaş|buzlas|ice slush" },
    { tip: "sicak-cikolata", dept: "icecek", label: "Sıcak Çikolata & Sahlep", search: "çikolata|cikolata|sahlep|salep|hot chocolate" },
    { tip: "sicak-icecek-disp", dept: "icecek", label: "Sıcak İçecek Dispenseri", search: "sıcak içecek|sicak icecek|sıcak disp|sicak disp" },
    { tip: "cay-makinesi", dept: "icecek", label: "Çay Makineleri", search: "çay mak|cay mak|çay makinesi|cay makinesi|demlik|hibrit çay|hibrit cay|smart çay|compact çay|turbo çay" },
    { tip: "cay-kazani", dept: "icecek", label: "Çay Kazanları", search: "çay kazan|cay kazan|çay kulesi|cay kulesi|çay kule" },
    { tip: "cay-otomat", dept: "icecek", label: "Çay Otomatları", search: "çay otomat|cay otomat" },
    { tip: "cay-ocagi", dept: "icecek", label: "Çay Ocakları & Semaverler", search: "çay ocağ|cay ocag|semaver|çay sema|cay sema" },
    { tip: "cay-sunum", dept: "icecek", label: "Çay Sunum & Jelli", search: "jelli çay|jelli cay|çay sunum|cay sunum|mini çay" },
    { tip: "buz-makinesi", dept: "icecek", label: "Buz Makineleri", slug: "icecek-berrak-buz-makineleri" },
    { tip: "berrak-buz", dept: "icecek", label: "Berrak & Küp Buz", search: "berrak buz|küp buz|kup buz|buz üret|buz mak" },
    { tip: "su-aritma", dept: "icecek", label: "Su Arıtma & Filtre", search: "su filt|arıtma|aritma|reverse osmos|su arıt" },
    { tip: "su-otomat", dept: "icecek", label: "Su Otomatları", search: "su otomat|içme suyu otomat|icme suyu otomat" },
    { tip: "icecek-otomat", dept: "icecek", label: "İçecek Otomatları", search: "içecek otomat|icecek otomat|yiyecek otomat|vending" },
    { tip: "kahve-sunum", dept: "icecek", label: "Kahve Sunum & Bardak Isıtıcı", search: "kahve fincan|bardak ısıt|bardak isit|sunum arabası|sunum arabasi|kahveci güzeli" },
    { tip: "cafe-ankastre", dept: "icecek", label: "Sıcak / Soğuk Ankastre", search: "ankastre|self servis|servis bankosu|nefeslik|sıcak self|soguk self" },
    { tip: "cafe-aksesuar", dept: "icecek", label: "Cafe Tezgah & Aksesuar", search: "ahşap ön|ahsap on|baza paslanmaz|küver|kuver|şampanya kovası|sampanya kovasi|tepsi kaydır" },
    { tip: "slug-cay", dept: "icecek", label: "Çay Ekipmanları (diğer)", slug: "cay-kazanlari-cay-makineleri-cay-otomatlari" },
    { tip: "slug-otom", dept: "icecek", label: "Yiyecek & İçecek Hattı", slug: "yiyecek-ve-icecek-otomatlari-" },
  ];

const byDept = {};
RAW.forEach((row) => {
  if (!byDept[row.dept]) byDept[row.dept] = [];
  byDept[row.dept].push(row);
});

function lc(s) {
  return String(s || '').toLocaleLowerCase('tr');
}

function parseKeys(row) {
  if (row.slug) return null;
  const s = row.search || row.label || row.tip;
  return String(s)
    .split('|')
    .map((p) => p.trim())
    .filter(Boolean);
}

function haystack(item) {
  const name = item.name || item.n || '';
  const brand = item.brand || item.b || '';
  return lc(name + ' ' + brand);
}

export function tileMatchItem(item, row) {
  const cat = item.category || item.c || '';
  if (row.slug && cat === row.slug) return true;
  const keys = parseKeys(row);
  if (keys && keys.length) {
    const hay = haystack(item);
    for (const k of keys) {
      if (hay.indexOf(lc(k)) !== -1) return true;
    }
  }
  return false;
}

export function productRank(dept, item) {
  const rows = byDept[dept] || [];
  for (let i = 0; i < rows.length; i++) {
    if (tileMatchItem(item, rows[i])) return i;
  }
  return 1e6;
}

function hashDeptSeed(str) {
  let h = 2166136261;
  const s = String(str || '');
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function deptRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function shuffleDeptList(dept, items, salt = 'products') {
  const arr = items.slice();
  const rnd = deptRng(hashDeptSeed(`${dept}:${salt}`));
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function sortCatalogItems(dept, items) {
  return shuffleDeptList(dept, items, 'products');
}
