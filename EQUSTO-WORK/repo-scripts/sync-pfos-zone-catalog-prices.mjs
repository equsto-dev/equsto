/**
 * PFOS zone kataloğu — tip_kodu + net liste fiyatı (TRY, KDV hariç)
 * Kaynak önceliği: 1) equsto-store fiyatlar  2) ekipmanlar.json medyan
 *
 *   node scripts/sync-pfos-zone-catalog-prices.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const CATALOG_PATH = path.join(ROOT, 'public', 'data', 'pfos-zone-catalog.json');
const STORE_PATH = path.join(ROOT, 'scripts', 'data', 'equsto-store.json');
const EKIPMAN_PATH = path.join(ROOT, 'public', 'data', 'ekipmanlar.json');

/** PFOS satır id → tip_sozlugu.tip_kodu */
const TIP_BY_PRODUCT_ID = {
  'am-kombi': 'kombi_firin_6t',
  'am-dav': 'davlumbaz_duvar',
  'am-ocak4': 'ocak_4gz',
  'am-cihazalti': 'tezgah_alti_buz_cek',
  'am-tezgah': 'calisma_tezgahi',
  'am-evye1': 'tezgah_evyeli',
  'am-raf': 'duvar_rafi',
  'am-dus': 'dus_sprey',
  'am-cop': 'cop_arabasi',
  'am-izgara': 'yer_izgara',
  'am-istif': 'istif_rafi',
  'am-tezgah-buz': 'tezgah_tip_buzdolabi',
  'am-evye2': 'tezgah_evyeli',
  'am-mikro': 'mikrodalga_firin',
  'am-servis': 'servis_rafi',
  'am-fritoz': 'fritoz_tek',
  'am-plate': 'char_broil',
  'am-salamander': 'salamander',
  'am-notr': 'tezgah_duz',
  'am-dilim': 'dilimleme_makinesi',
  'am-dik-buz': 'dik_tip_buzdolabi',
  'by-siyirma': 'cop_siyirma_tez',
  'by-giris': 'bym_giris_tez',
  'by-cikis': 'bym_cikis_tez',
  'by-dus': 'dus_sprey',
  'by-dav': 'davlumbaz',
  'by-kazan': 'evye',
  'by-cop': 'cop_arabasi',
  'by-istif': 'istif_rafi',
  'by-izgara': 'yer_izgara',
  'by-giyotin': 'bulasik_giyotin_1000',
};

/** tip_kodu → ekipmanlar.json adında aranacak kelimeler */
const SEARCH_TERMS = {
  kombi_firin_6t: ['kombi', 'konveksiyon', 'kombili'],
  davlumbaz_duvar: ['davlumbaz', 'duvar'],
  ocak_4gz: ['4', 'gözlü', 'gozlu', 'ocak', 'alevli'],
  tezgah_alti_buz_cek: ['cihazaltı', 'cihaz alti', 'tezgah altı', 'tezgahalti'],
  calisma_tezgahi: ['çalışma tezgah', 'calisma tezgah'],
  tezgah_evyeli: ['evyeli tezgah', 'tek evye', 'çift evye'],
  duvar_rafi: ['duvar raf'],
  dus_sprey: ['duş sprey', 'dus sprey'],
  cop_arabasi: ['çöp', 'cop kova'],
  yer_izgara: ['yer ızgar', 'yer izgar'],
  istif_rafi: ['istif raf', 'istif rafi', 'demonte'],
  tezgah_tip_buzdolabi: ['tezgah tipi buzdolab', 'tezgah tip buzdolab'],
  mikrodalga_firin: ['mikrodalga'],
  servis_rafi: ['servis arab', 'servis raf'],
  fritoz_tek: ['fritöz', 'fritoz'],
  char_broil: ['plate ızgar', 'plate izgar', 'charbroil', 'kontakt ızgar'],
  salamander: ['salamander'],
  tezgah_duz: ['nötr', 'notr', 'ara tezgah'],
  dilimleme_makinesi: ['dilimleme'],
  dik_tip_buzdolabi: ['dik tip buzdolab'],
  cop_siyirma_tez: ['sıyırma', 'siyirma', 'bulaşık sıyır'],
  bym_giris_tez: ['makine giriş', 'giris tezgah', 'giriş tezgah'],
  bym_cikis_tez: ['makine çıkış', 'cikis tezgah', 'çıkış tezgah'],
  davlumbaz: ['davlumbaz'],
  evye: ['kazan yıkama', 'kazan evye'],
  bulasik_giyotin_1000: ['giyotin', '1000 tabak', '1000 tb'],
};

/** tip_kodu → kural tabanlı ekipmanlar.json eşleşmesi (isim filtreleri) */
const MATCH_RULES = {
  calisma_tezgahi: (name) => name.includes('tezgah') && !name.includes('buzdolab') && !name.includes('evye'),
  duvar_rafi: (name) => name.includes('duvar') && name.includes('raf'),
  yer_izgara: (name) =>
    (name.includes('izgar') || name.includes('pleyt')) &&
    !name.includes('davlumbaz') &&
    !name.includes('bulasik'),
  istif_rafi: (name) => name.includes('istif') || (name.includes('raf') && name.includes('demonte')),
  mikrodalga_firin: (name) => name.includes('mikrodalga'),
  servis_rafi: (name) => name.includes('servis') && (name.includes('arab') || name.includes('termo')),
  char_broil: (name) => name.includes('kontakt') || name.includes('plate') || name.includes('plancha'),
  cop_siyirma_tez: (name) => name.includes('siyirma') || name.includes('on yikama'),
  bym_giris_tez: (name) => (name.includes('giris') || name.includes('giriş')) && name.includes('tezgah'),
  bym_cikis_tez: (name) => (name.includes('cikis') || name.includes('çıkış')) && name.includes('tezgah'),
};

/** Admin fiyat listesi boşken — Equsto kural motoru referans TRY (KDV hariç) */
const REF_TRY_BY_TIP = {
  kombi_firin_6t: 780000,
  davlumbaz_duvar: 42000,
  ocak_4gz: 145000,
  tezgah_alti_buz_cek: 98000,
  calisma_tezgahi: 14000,
  tezgah_evyeli: 18000,
  duvar_rafi: 8500,
  dus_sprey: 4500,
  cop_arabasi: 3500,
  yer_izgara: 12000,
  istif_rafi: 9500,
  tezgah_tip_buzdolabi: 62000,
  mikrodalga_firin: 8500,
  servis_rafi: 6500,
  fritoz_tek: 45000,
  char_broil: 55000,
  salamander: 48000,
  tezgah_duz: 12000,
  dilimleme_makinesi: 38000,
  dik_tip_buzdolabi: 98000,
  cop_siyirma_tez: 22000,
  bym_giris_tez: 28000,
  bym_cikis_tez: 18000,
  davlumbaz: 18500,
  evye: 15000,
  bulasik_giyotin_1000: 720000,
};

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

function parseNetTryFromPrice(raw) {
  const s = String(raw || '');
  const m = s.match(/₺\s*([\d.,]+)/);
  if (!m) return 0;
  const n = parseFloat(m[1].replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
}

function median(nums) {
  const a = nums.filter((n) => n > 0).sort((x, y) => x - y);
  if (!a.length) return 0;
  const mid = Math.floor(a.length / 2);
  return a.length % 2 ? a[mid] : Math.round((a[mid - 1] + a[mid]) / 2);
}

function loadEkipmanlar() {
  if (!fs.existsSync(EKIPMAN_PATH)) return [];
  const raw = JSON.parse(fs.readFileSync(EKIPMAN_PATH, 'utf8'));
  return Array.isArray(raw) ? raw : [];
}

function priceFromEkipmanlar(tipKodu, items) {
  const terms = SEARCH_TERMS[tipKodu] || [tipKodu.replace(/_/g, ' ')];
  const rule = MATCH_RULES[tipKodu];
  const prices = [];
  for (const it of items) {
    const name = norm(it.name || it.ad || '');
    if (!name) continue;
    const hit =
      (rule && rule(name)) || terms.some((t) => name.includes(norm(t)));
    if (!hit) continue;
    const p = parseNetTryFromPrice(it.price);
    if (p > 0) prices.push(p);
  }
  return median(prices);
}

function main() {
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
  const store = fs.existsSync(STORE_PATH) ? JSON.parse(fs.readFileSync(STORE_PATH, 'utf8')) : {};
  const fiyatlar = store.fiyatlar && typeof store.fiyatlar === 'object' ? store.fiyatlar : {};
  const ekipmanlar = loadEkipmanlar();

  let fromListe = 0;
  let fromShop = 0;
  let missing = 0;

  for (const [zoneKey, zone] of Object.entries(catalog.catalog || {})) {
    for (const p of zone.products || []) {
      const tip = TIP_BY_PRODUCT_ID[p.id] || p.tip_kodu || '';
      p.tip_kodu = tip;

      let net = 0;
      let kaynak = '';

      if (tip && Number(fiyatlar[tip]) > 0) {
        net = Math.round(Number(fiyatlar[tip]));
        kaynak = 'fiyat_listesi';
        fromListe++;
      } else if (tip) {
        net = priceFromEkipmanlar(tip, ekipmanlar);
        if (net > 0) {
          kaynak = 'ekipmanlar_medyan';
          fromShop++;
        }
      }

      if (!net && tip && REF_TRY_BY_TIP[tip]) {
        net = REF_TRY_BY_TIP[tip];
        kaynak = 'referans_try';
      }

      if (net > 0) {
        p.unit_price_try = net;
        p.price_source = kaynak;
        delete p.unit_price_eur;
      } else {
        missing++;
        p.price_source = 'eksik';
      }
    }
  }

  catalog.price_sync = {
    at: new Date().toISOString(),
    currency: 'TRY',
    kdv: 'haric',
    from_fiyat_listesi: fromListe,
    from_ekipmanlar: fromShop,
    eksik: missing,
  };

  const tmp = CATALOG_PATH + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(catalog, null, 2) + '\n', 'utf8');
  fs.renameSync(tmp, CATALOG_PATH);

  const distPath = path.join(ROOT, 'dist', 'data', 'pfos-zone-catalog.json');
  if (fs.existsSync(path.dirname(distPath))) {
    fs.copyFileSync(CATALOG_PATH, distPath);
  }

  console.log('[sync-pfos-zone-catalog-prices] tamam');
  console.log('  fiyat listesi (store):', fromListe);
  console.log('  ekipmanlar medyan:   ', fromShop);
  console.log('  eksik:               ', missing);
  console.log('  →', CATALOG_PATH);
}

main();
