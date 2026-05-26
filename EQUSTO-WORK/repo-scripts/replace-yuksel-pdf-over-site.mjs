/**
 * YÜKSEL YERLİ + İTHAL PDF → eşleşen sitedeki kayıtları kaldır, PDF sürümünü koy (fiyat + görsel).
 *
 *   npm run replace:yuksel-pdf-over-site
 */
import { readFileSync, writeFileSync, copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const EKIPMANLAR = join(root, 'public', 'data', 'ekipmanlar.json');
const YERLI_JSON = join(root, 'public', 'data', 'fiyat-listeleri', 'yuksel', '2025-yerli', 'tum-urunler.json');
const ITHAL_JSON = join(root, 'public', 'data', 'fiyat-listeleri', 'yuksel', '2025-ithal', 'tum-urunler.json');
const YERLI_IMG = join(root, 'public', 'data', 'fiyat-listeleri', 'yuksel', '2025-yerli', '_pdf-images-map.json');
const ITHAL_IMG = join(root, 'public', 'data', 'fiyat-listeleri', 'yuksel', '2025-ithal', '_pdf-images-map.json');
const BACKUP = join(root, 'public', 'data', `ekipmanlar.backup-yuksel-replace-${Date.now()}.json`);

const ISKONTO_YERLI = Number(process.env.EQUSTO_YUKSEL_ISKONTO || '0.55');
const ISKONTO_ITHAL = Number(process.env.EQUSTO_YUKSEL_ITHAL_ISKONTO ?? '0.35');
const EUR_TRY = Number(process.env.EQUSTO_EUR_TRY || '58.5');
const KDV = Number(process.env.EQUSTO_KDV_ORAN || '20');
const BRAND_YERLI = 'Yüksel Endüstriyel';
const BRAND_PORTABIANCO = 'PORTABIANCO';

function pdfBrand(item, cat) {
  const dept = item.dept || mapDept(cat);
  if (dept === 'sogutma' || dept === 'yikama') return BRAND_PORTABIANCO;
  return BRAND_YERLI;
}

function normKey(s) {
  return String(s || '')
    .toUpperCase()
    .replace(/İ/g, 'I')
    .replace(/Ğ/g, 'G')
    .replace(/Ü/g, 'U')
    .replace(/Ş/g, 'S')
    .replace(/Ö/g, 'O')
    .replace(/Ç/g, 'C')
    .replace(/\s+/g, '')
    .replace(/[^A-Z0-9]/g, '');
}

function fmtTry(n) {
  const parts = n.toFixed(2).split('.');
  const int = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${int},${parts[1]}`;
}

function priceFromEuro(listEur, netMult) {
  const netEur = listEur * netMult;
  const netTry = netEur * EUR_TRY;
  const kdvDahil = netTry * (1 + KDV / 100);
  return `₺${fmtTry(netTry)} + KDV\nKDV Dahil ₺${fmtTry(kdvDahil)}`;
}

function mapCategoryYerli(item) {
  const sub = String(item.alt_kategori || '').toLocaleLowerCase('tr');
  const dept = item.dept || '';
  const folder = String(item.category || '').toLowerCase();
  if (dept === 'yikama' || /bulaşık|bulasik|dishwash/.test(sub)) return 'bulasik-makineleri';
  if (dept === 'davlumbaz' || /davlumbaz|filtre|hood/.test(sub)) return 'davlumbaz';
  if (dept === 'tasima' || /araba|taşıma|servis|çamaşır|tabak/.test(sub)) return 'tasima-arabalari';
  if (/yer süzgeç|gider/.test(sub)) return 'bulasik-makineleri';
  if (dept === 'sogutma' || /buzdolab|soğut|refriger|portabianco|barista|pizza|tezgah|counter|make up|undercounter/.test(sub)) {
    return 'sogutma-ekipmanlari';
  }
  if (dept === 'istif' || /portashelf|tel raf|raf|shelf|ayak/.test(sub) || folder.includes('portashelf')) {
    return 'paslanmaz-urunler';
  }
  if (dept === 'pisirme' || /fırın|firin|ocak|izgara/.test(sub)) {
    if (/fritöz|fritoz/.test(sub)) return 'fritozler';
    if (/izgara/.test(sub)) return 'sanayi-tipi-izgaralar';
    return 'sanayi-ocaklari';
  }
  return 'paslanmaz-urunler';
}

function mapDept(cat) {
  if (cat === 'bulasik-makineleri') return 'yikama';
  if (cat === 'davlumbaz' || cat === 'tasima-arabalari') return cat === 'davlumbaz' ? 'davlumbaz' : 'tasima';
  if (cat.includes('sogutma') || cat === 'sogutma-ekipmanlari') return 'sogutma';
  if (cat === 'paslanmaz-urunler') return 'istif';
  return 'pisirme';
}

function buildYerliRow(item, listEur, netEur, images) {
  const cat = mapCategoryYerli(item);
  const sub = String(item.alt_kategori || '').split('·')[0].trim().slice(0, 80);
  const model = String(item.model || '').trim();
  const name = `Yüksel ${sub} ${model}`.replace(/\s+/g, ' ').trim();
  const specs = [
    name,
    '',
    `Kaynak: ${item.liste || 'YÜKSEL YERLİ - 2025'}`,
    `Kategori: ${item.alt_kategori || ''}`,
    `Model: ${model}`,
    item.olculer_net_mm ? `Ölçü: ${item.olculer_net_mm}` : '',
    item.guc_kw ? `Güç: ${item.guc_kw}` : '',
    item.voltaj ? `Voltaj: ${item.voltaj}` : '',
    listEur != null ? `Liste fiyatı (EUR): ${listEur}` : '',
    netEur != null ? `Equsto net (%${Math.round(ISKONTO_YERLI * 100)} iskonto, EUR): ${netEur.toFixed(2)}` : '',
    `Kur: 1 EUR = ${EUR_TRY} TRY (KDV %${KDV})`,
  ]
    .filter(Boolean)
    .join('\r\n');
  const brand = pdfBrand(item, cat);
  const displayName = brand === BRAND_PORTABIANCO ? `Portabianco ${sub} ${model}`.replace(/\s+/g, ' ').trim() : name;
  return {
    category: cat,
    brand,
    name: displayName,
    price: priceFromEuro(listEur, 1 - ISKONTO_YERLI),
    specs,
    images: images.length ? images : [],
    sku: String(item.sku || normKey(model)),
    model,
    liste_fiyati_eur: listEur,
    satis_eur_net: netEur,
    iskonto_oran: Math.round(ISKONTO_YERLI * 100),
    kaynak_fiyat_listesi: item.kaynak || 'yuksel-2025-yerli-pdf',
    dept: mapDept(cat),
    page: item.page,
  };
}

function buildIthalRow(item, listEur, netEur, images) {
  const specs = [
    item.name,
    '',
    `Kaynak: ${item.liste || 'YÜKSEL İTHAL - 2025'}`,
    item.alt_kategori ? `Bölüm: ${item.alt_kategori}` : '',
    item.model ? `Referans: ${item.model}` : '',
    item.page ? `Sayfa: ${item.page}` : '',
    listEur != null ? `Liste fiyatı (EUR): ${listEur}` : '',
    netEur != null ? `Equsto net (%${Math.round(ISKONTO_ITHAL * 100)} iskonto, EUR): ${netEur.toFixed(2)}` : '',
    `Kur: 1 EUR = ${EUR_TRY} TRY (KDV %${KDV})`,
  ]
    .filter(Boolean)
    .join('\r\n');
  const cat = item.category;
  const dept = item.dept || 'hazirlik';
  const brand = dept === 'sogutma' || dept === 'yikama' ? BRAND_PORTABIANCO : item.brand;
  const displayName =
    brand === BRAND_PORTABIANCO
      ? String(item.name || '').replace(/Yüksel Endüstriyel \(ithal\)/i, 'Portabianco').trim()
      : item.name;
  return {
    category: cat,
    brand,
    name: displayName,
    price: priceFromEuro(listEur, 1 - ISKONTO_ITHAL),
    specs,
    images: images.length ? images : [],
    sku: String(item.sku || normKey(item.model)),
    model: String(item.model || item.sku || '').trim(),
    liste_fiyati_eur: listEur,
    satis_eur_net: netEur,
    iskonto_oran: Math.round(ISKONTO_ITHAL * 100),
    kaynak_fiyat_listesi: item.kaynak || 'yuksel-2025-ithal-pdf',
    dept: item.dept,
    page: item.page,
  };
}

function pdfImage(item, source, yerliModels, yerliPages, ithalModels, ithalPages) {
  const key = normKey(item.sku || item.model);
  if (source === 'yerli') {
    let rel = yerliModels[key];
    if (!rel && item.page != null) {
      rel = yerliPages[String(item.page)] || yerliPages[item.page];
    }
    return rel ? [rel.replace(/\\/g, '/')] : [];
  }
  const rel = ithalModels[key] || (item.page != null ? ithalPages[String(item.page)] || ithalPages[item.page] : null);
  return rel ? [rel.replace(/\\/g, '/')] : [];
}

function indexByKey(catalog) {
  const byKey = new Map();
  for (let i = 0; i < catalog.length; i++) {
    const p = catalog[i];
    const keys = new Set();
    const sku = normKey(p.sku);
    const model = normKey(p.model);
    if (sku) keys.add(sku);
    if (model) keys.add(model);
    for (const k of keys) {
      if (!byKey.has(k)) byKey.set(k, []);
      const arr = byKey.get(k);
      if (!arr.includes(i)) arr.push(i);
    }
  }
  return byKey;
}

function main() {
  for (const p of [YERLI_JSON, ITHAL_JSON]) {
    if (!existsSync(p)) {
      console.error('Eksik:', p);
      process.exit(1);
    }
  }

  const catalog = JSON.parse(readFileSync(EKIPMANLAR, 'utf8'));
  mkdirSync(dirname(BACKUP), { recursive: true });
  copyFileSync(EKIPMANLAR, BACKUP);
  console.log('[yuksel-replace] Yedek:', BACKUP);

  const yerli = JSON.parse(readFileSync(YERLI_JSON, 'utf8'));
  const ithal = JSON.parse(readFileSync(ITHAL_JSON, 'utf8'));
  const yerliImg = existsSync(YERLI_IMG)
    ? JSON.parse(readFileSync(YERLI_IMG, 'utf8'))
    : { models: {}, pages: {} };
  const ithalImg = existsSync(ITHAL_IMG) ? JSON.parse(readFileSync(ITHAL_IMG, 'utf8')) : { models: {}, pages: {} };

  const byKey = indexByKey(catalog);
  const toRemove = new Set();
  let replaced = 0;
  let added = 0;
  let removed = 0;

  const pdfItems = [
    ...yerli.map((item) => ({ item, source: 'yerli' })),
    ...ithal.map((item) => ({ item, source: 'ithal' })),
  ];

  for (const { item, source } of pdfItems) {
    const listEur = Number(item.fiyat_euro);
    if (!listEur || listEur <= 0) continue;

    const key = normKey(item.sku || item.model);
    if (!key) continue;

    const netMult = source === 'yerli' ? 1 - ISKONTO_YERLI : 1 - ISKONTO_ITHAL;
    const netEur = Math.round(listEur * netMult * 100) / 100;
    const images = pdfImage(
      item,
      source,
      yerliImg.models || {},
      yerliImg.pages || {},
      ithalImg.models || {},
      ithalImg.pages || {},
    );
    const row =
      source === 'yerli'
        ? buildYerliRow(item, listEur, netEur, images)
        : buildIthalRow(item, listEur, netEur, images);

    const indices = [...(byKey.get(key) || [])].sort((a, b) => a - b);

    if (indices.length > 0) {
      catalog[indices[0]] = row;
      replaced++;
      for (let j = 1; j < indices.length; j++) {
        toRemove.add(indices[j]);
      }
      byKey.set(key, [indices[0]]);
    } else {
      const ni = catalog.length;
      catalog.push(row);
      byKey.set(key, [ni]);
      added++;
    }
  }

  const pdfKeys = new Set(pdfItems.map(({ item }) => normKey(item.sku || item.model)).filter(Boolean));

  for (let i = 0; i < catalog.length; i++) {
    if (toRemove.has(i)) continue;
    const p = catalog[i];
    const k = normKey(p.sku || p.model);
    if (!k || !pdfKeys.has(k)) continue;
    const kaynak = String(p.kaynak_fiyat_listesi || '');
    if (kaynak.includes('yuksel-2025-yerli') || kaynak.includes('yuksel-2025-ithal')) continue;
    toRemove.add(i);
    removed++;
  }

  const sorted = [...toRemove].sort((a, b) => b - a);
  for (const idx of sorted) {
    catalog.splice(idx, 1);
  }

  writeFileSync(EKIPMANLAR, JSON.stringify(catalog));
  console.log(`[yuksel-replace] PDF yerine yazılan: ${replaced}, yeni: ${added}, silinen site kopyası: ${sorted.length} (eski marka: ${removed})`);
  console.log(`[yuksel-replace] Toplam katalog: ${catalog.length}`);

  execSync('node scripts/build-dept-catalog.mjs', { cwd: root, stdio: 'inherit' });
  execSync('node scripts/generate-file-fallback.mjs', { cwd: root, stdio: 'inherit' });
  console.log('[yuksel-replace] Bitti.');
}

main();
