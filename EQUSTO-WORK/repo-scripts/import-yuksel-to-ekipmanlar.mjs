/**
 * YÜKSEL 2025 YERLİ → ekipmanlar.json (%55 iskonto, EUR→TRY)
 *
 *   npm run import:yuksel-ekipmanlar
 *   EQUSTO_YUKSEL_ISKONTO=0.55 EQUSTO_EUR_TRY=58.5 npm run import:yuksel-ekipmanlar
 */
import { readFileSync, writeFileSync, copyFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const YUKSEL_SRC = join(root, 'public', 'data', 'fiyat-listeleri', 'yuksel', '2025-yerli', 'tum-urunler.json');
const EKIPMANLAR = join(root, 'public', 'data', 'ekipmanlar.json');
const BACKUP = join(root, 'public', 'data', `ekipmanlar.backup-yuksel-${Date.now()}.json`);

/** %55 iskonto → net = liste × (1 − 0.55) */
const ISKONTO = Number(process.env.EQUSTO_YUKSEL_ISKONTO || '0.55');
const NET_MULT = Math.max(0, Math.min(1, 1 - ISKONTO));
const EUR_TRY = Number(process.env.EQUSTO_EUR_TRY || '58.5');
const KDV = Number(process.env.EQUSTO_KDV_ORAN || '20');
const BRAND = 'Yüksel Endüstriyel';
const BRAND_PORTABIANCO = 'PORTABIANCO';

function brandForPdf(item, cat) {
  const dept = mapDept(cat);
  if (dept === 'sogutma' || dept === 'yikama') return BRAND_PORTABIANCO;
  return BRAND;
}

function normModel(s) {
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

function priceFromEuro(listEur) {
  const netEur = listEur * NET_MULT;
  const netTry = netEur * EUR_TRY;
  const kdvDahil = netTry * (1 + KDV / 100);
  return `₺${fmtTry(netTry)} + KDV\nKDV Dahil ₺${fmtTry(kdvDahil)}`;
}

function mapCategory(item) {
  const sub = String(item.alt_kategori || '').toLocaleLowerCase('tr');
  const dept = item.dept || '';
  const folder = String(item.category || '').toLowerCase();

  if (dept === 'yikama' || /bulaşık|bulasik|dishwash/.test(sub)) return 'bulasik-makineleri';
  if (dept === 'davlumbaz' || /davlumbaz|filtre|hood/.test(sub)) return 'davlumbaz';
  if (dept === 'tasima' || /araba|taşıma|servis|çamaşır|tabak/.test(sub)) return 'tasima-arabalari';
  if (/yer süzgeç|gider/.test(sub)) return 'bulasik-makineleri';

  if (
    dept === 'sogutma' ||
    /buzdolab|soğut|refriger|portabianco|barista|pizza|tezgah|counter|make up|undercounter/.test(sub)
  ) {
    if (/pizza/.test(sub)) return 'sogutma-ekipmanlari';
    if (/derin|freezer/.test(sub)) return 'sogutma-ekipmanlari';
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
  const c = String(cat || '');
  if (c === 'bulasik-makineleri') return 'yikama';
  if (c === 'davlumbaz' || c === 'tasima-arabalari') return c === 'davlumbaz' ? 'davlumbaz' : 'tasima';
  if (c.includes('sogutma') || c === 'sogutma-ekipmanlari') return 'sogutma';
  if (c === 'paslanmaz-urunler') return 'istif';
  return 'pisirme';
}

function buildName(item) {
  const model = String(item.model || '').trim();
  const sub = String(item.alt_kategori || '').split('·')[0].trim().slice(0, 80);
  return `Yüksel ${sub} ${model}`.replace(/\s+/g, ' ').trim();
}

function buildSpecs(item, listEur, netEur) {
  const lines = [
    buildName(item),
    '',
    `Kaynak: ${item.liste || LISTE}`,
    `Kategori: ${item.alt_kategori || ''}`,
    `Model: ${item.model || ''}`,
    item.olculer_net_mm ? `Ölçü: ${item.olculer_net_mm}` : '',
    item.guc_kw ? `Güç: ${item.guc_kw}` : '',
    item.voltaj ? `Voltaj: ${item.voltaj}` : '',
    listEur != null ? `Liste fiyatı (EUR): ${listEur}` : '',
    netEur != null
      ? `Equsto net (%${Math.round(ISKONTO * 100)} iskonto, EUR): ${netEur.toFixed(2)}`
      : '',
    `Kur: 1 EUR = ${EUR_TRY} TRY (KDV %${KDV})`,
  ];
  return lines.filter(Boolean).join('\r\n');
}

const LISTE = 'YÜKSEL YERLİ - 2025';

function main() {
  if (!readFileSync(YUKSEL_SRC, 'utf8')) {
    console.error('Önce: npm run import:yuksel-2025');
    process.exit(1);
  }
  const yuksel = JSON.parse(readFileSync(YUKSEL_SRC, 'utf8'));
  const catalog = JSON.parse(readFileSync(EKIPMANLAR, 'utf8'));

  mkdirSync(dirname(BACKUP), { recursive: true });
  copyFileSync(EKIPMANLAR, BACKUP);
  console.log('[yuksel-import] Yedek:', BACKUP);

  const byKey = new Map();
  for (let i = 0; i < catalog.length; i++) {
    const p = catalog[i];
    const m = normModel(p.model || p.sku);
    const sku = normModel(p.sku);
    if (m && !byKey.has(m)) byKey.set(m, i);
    if (sku && !byKey.has(sku)) byKey.set(sku, i);
  }

  let yerliImg = {};
  let yerliImgMap = { models: {}, pages: {} };
  try {
    yerliImgMap = JSON.parse(
      readFileSync(
        join(root, 'public', 'data', 'fiyat-listeleri', 'yuksel', '2025-yerli', '_pdf-images-map.json'),
        'utf8',
      ),
    );
    yerliImg = yerliImgMap.models || {};
  } catch {
    /* */
  }

  let updated = 0;
  let added = 0;
  let skipped = 0;

  for (const item of yuksel) {
    const listEur = Number(item.fiyat_euro);
    if (!listEur || listEur <= 0) {
      skipped++;
      continue;
    }
    const netEur = Math.round(listEur * NET_MULT * 100) / 100;
    const cat = mapCategory(item);
    const modelKey = normModel(item.model);
    const skuKey = normModel(item.sku);
    const idx = byKey.get(modelKey) ?? byKey.get(skuKey);
    let imgRel = yerliImg[modelKey] || yerliImg[skuKey];
    if (!imgRel && item.page != null) {
      const pages = yerliImgMap?.pages || {};
      imgRel = pages[String(item.page)] || pages[item.page];
    }
    const images = imgRel ? [String(imgRel).replace(/\\/g, '/')] : [];

    const pdfBrand = brandForPdf(item, cat);
    const row = {
      category: cat,
      brand: pdfBrand,
      name:
        pdfBrand === BRAND_PORTABIANCO
          ? `Portabianco ${String(item.alt_kategori || '').split('·')[0].trim().slice(0, 80)} ${String(item.model || '').trim()}`.replace(/\s+/g, ' ').trim()
          : buildName(item),
      price: priceFromEuro(listEur),
      specs: buildSpecs(item, listEur, netEur),
      images,
      sku: String(item.sku || modelKey),
      model: String(item.model || '').trim(),
      liste_fiyati_eur: listEur,
      satis_eur_net: netEur,
      iskonto_oran: Math.round(ISKONTO * 100),
      kaynak_fiyat_listesi: item.kaynak || 'yuksel-2025-yerli-pdf',
      dept: mapDept(cat),
      page: item.page,
    };

    if (idx != null) {
      catalog[idx] = row;
      updated++;
    } else {
      catalog.push(row);
      const ni = catalog.length - 1;
      if (modelKey) byKey.set(modelKey, ni);
      if (skuKey) byKey.set(skuKey, ni);
      added++;
    }
  }

  writeFileSync(EKIPMANLAR, JSON.stringify(catalog));
  console.log(
    `[yuksel-import] İskonto %${Math.round(ISKONTO * 100)} → net çarpan ${NET_MULT}, EUR→TRY ${EUR_TRY}`,
  );
  console.log(`[yuksel-import] Güncellenen: ${updated}, yeni: ${added}, atlanan: ${skipped}`);
  console.log(`[yuksel-import] Toplam katalog: ${catalog.length}`);

  execSync('node scripts/build-dept-catalog.mjs', { cwd: root, stdio: 'inherit' });
  execSync('node scripts/generate-file-fallback.mjs', { cwd: root, stdio: 'inherit' });
  console.log('[yuksel-import] Bitti.');
}

main();
