/**
 * ATALAY 2025 YERLİ JSON → ekipmanlar.json (%50 indirimli, EUR→TRY)
 *
 *   npm run import:atalay-ekipmanlar
 *   EQUSTO_EUR_TRY=58.5 npm run import:atalay-ekipmanlar
 */
import { readFileSync, writeFileSync, copyFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ATALAY_SRC = join(root, 'public', 'data', 'fiyat-listeleri', 'atalay', '2025-yerli', 'tum-urunler.json');
const EKIPMANLAR = join(root, 'public', 'data', 'ekipmanlar.json');
const BACKUP = join(root, 'public', 'data', `ekipmanlar.backup-${Date.now()}.json`);

const DISCOUNT = Number(process.env.EQUSTO_ATALAY_DISCOUNT || '0.5');
const EUR_TRY = Number(process.env.EQUSTO_EUR_TRY || '58.5');
const KDV = Number(process.env.EQUSTO_KDV_ORAN || '20');
const BRAND = 'Atalay Endüstriyel Mutfak Ekipmanları';

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
  const netEur = listEur * DISCOUNT;
  const netTry = netEur * EUR_TRY;
  const kdvDahil = netTry * (1 + KDV / 100);
  return `₺${fmtTry(netTry)} + KDV\nKDV Dahil ₺${fmtTry(kdvDahil)}`;
}

function mapCategory(item) {
  const sub = String(item.alt_kategori || '').toLocaleLowerCase('tr');
  const dept = item.dept || '';
  if (/kahve/.test(sub) || dept === 'kahve') return 'kahve-makineleri';
  if (/banket/.test(sub) || dept === 'sogutma') return 'banket-arabalari';
  if (/döner|doner|piliç|pilic|çevirme|cevirme|cağ|cag kebab|yatay et/.test(sub)) return 'doner-ocaklari-';
  if (/tost|waffle|krep/.test(sub)) return 'tost-makineleri';
  if (/piliç çevirme|pilic/.test(sub)) return 'pilic-cevirme-makineleri';
  if (/fritöz|fritoz/.test(sub)) return 'fritozler';
  if (/kuzine|gemi tipi/.test(sub)) return 'kuzineler';
  if (/ocak|wok|yer oca/.test(sub)) return 'sanayi-ocaklari';
  if (/benmari|kaynatma|makarna|patates|devrilir/.test(sub)) return 'benmariler-yemeklikler';
  if (/fırın|firin|pizza|kumpir|mayalandır|ekmek kızart|ekmek kizart|salamander/.test(sub)) {
    if (/pizza/.test(sub)) return 'sanayi-ocaklari';
    return 'sanayi-ocaklari';
  }
  if (/izgara|clam|konveyörlü izgara|konveyorlu izgara|amerikan|lavata/.test(sub)) {
    return 'sanayi-tipi-izgaralar';
  }
  if (/tezgah|ara tezgah|set altı|setaltı|set üstü mini/.test(sub)) return 'paslanmaz-urunler';
  return dept === 'pisirme' ? 'sanayi-ocaklari' : 'sanayi-ocaklari';
}

function buildName(item) {
  const model = String(item.model || '').trim();
  const sub = String(item.alt_kategori || '').split('/')[0].trim();
  const plate = item.plaka ? ` ${item.plaka}` : '';
  const dims = item.olculer_net_mm ? ` ${item.olculer_net_mm.replace(/ x /gi, 'x')}` : '';
  return `Atalay ${sub}${plate} ${model}${dims}`.replace(/\s+/g, ' ').trim();
}

function buildSpecs(item, listEur, saleEur) {
  const lines = [
    buildName(item),
    '',
    `Kaynak: ${item.liste || 'ATALAY 2025 YERLİ'}`,
    item.seri ? `Seri: ${item.seri}` : '',
    `Kategori: ${item.alt_kategori || ''}`,
    `Model: ${item.model || ''}`,
    item.plaka ? `Plaka: ${item.plaka}` : '',
    item.voltaj ? `Voltaj: ${item.voltaj}` : '',
    item.guc_kw ? `Güç (kW): ${item.guc_kw}` : '',
    item.olculer_net_mm ? `Net ölçüler (mm): ${item.olculer_net_mm}` : '',
    item.olculer_paket_mm ? `Paket ölçüleri (mm): ${item.olculer_paket_mm}` : '',
    item.agirlik_net ? `Net ağırlık: ${item.agirlik_net}` : '',
    item.agirlik_paket ? `Paket ağırlık: ${item.agirlik_paket}` : '',
    listEur != null ? `Liste fiyatı (EUR): ${listEur}` : '',
    saleEur != null ? `Equsto fiyatı (%${Math.round(DISCOUNT * 100)} indirimli EUR): ${saleEur.toFixed(2)}` : '',
    `Kur: 1 EUR = ${EUR_TRY} TRY (KDV %${KDV})`,
  ];
  return lines.filter(Boolean).join('\r\n');
}

function slugFromName(name) {
  return String(name || '')
    .toLocaleLowerCase('tr')
    .replace(/[^a-z0-9ğüşıöç]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

function main() {
  if (!readFileSync(ATALAY_SRC, 'utf8')) {
    console.error('Önce: npm run import:atalay-2025');
    process.exit(1);
  }
  const atalay = JSON.parse(readFileSync(ATALAY_SRC, 'utf8'));
  const catalog = JSON.parse(readFileSync(EKIPMANLAR, 'utf8'));
  if (!Array.isArray(catalog) || !Array.isArray(atalay)) {
    console.error('JSON dizi olmalı');
    process.exit(1);
  }

  mkdirSync(dirname(BACKUP), { recursive: true });
  copyFileSync(EKIPMANLAR, BACKUP);
  console.log('[atalay-import] Yedek:', BACKUP);

  const byModel = new Map();
  const bySku = new Map();
  for (let i = 0; i < catalog.length; i++) {
    const p = catalog[i];
    if (!p || !String(p.brand || '').toLocaleLowerCase('tr').includes('atalay')) continue;
    const m = normModel(p.model || extractModelFromName(p.name));
    if (m) byModel.set(m, i);
    const sku = normModel(p.sku);
    if (sku) bySku.set(sku, i);
  }

  let updated = 0;
  let added = 0;
  let skipped = 0;

  for (const item of atalay) {
    const listEur = Number(item.fiyat_euro);
    if (!listEur || listEur <= 0) {
      skipped++;
      continue;
    }
    const saleEur = Math.round(listEur * DISCOUNT * 100) / 100;
    const modelKey = normModel(item.model);
    const skuKey = normModel(item.sku);
    const idx = byModel.get(modelKey) ?? bySku.get(skuKey);

    const row = {
      category: mapCategory(item),
      brand: BRAND,
      name: buildName(item),
      price: priceFromEuro(listEur),
      specs: buildSpecs(item, listEur, saleEur),
      images: [],
      sku: String(item.sku || modelKey).replace(/\s+/g, ''),
      model: String(item.model || '').trim(),
      liste_fiyati_eur: listEur,
      satis_eur_indirimli: saleEur,
      iskonto_oran: Math.round(DISCOUNT * 100),
      kaynak_fiyat_listesi: item.kaynak || 'atalay-2025-yerli-pdf',
      el_guc: item.el_guc || '',
      gaz_guc: item.gaz_guc || '',
      voltaj: item.voltaj || '',
      guc_kw: item.guc_kw || '',
    };

    if (idx != null) {
      const prev = catalog[idx];
      if (prev.images && prev.images.length) row.images = prev.images;
      if (prev.sourceUrl) row.sourceUrl = prev.sourceUrl;
      if (prev.barcode) row.barcode = prev.barcode;
      catalog[idx] = { ...prev, ...row };
      updated++;
    } else {
      catalog.push(row);
      const ni = catalog.length - 1;
      if (modelKey) byModel.set(modelKey, ni);
      if (skuKey) bySku.set(skuKey, ni);
      added++;
    }
  }

  writeFileSync(EKIPMANLAR, JSON.stringify(catalog));
  console.log(`[atalay-import] EUR→TRY kur: ${EUR_TRY}, indirim: %${Math.round(DISCOUNT * 100)}`);
  console.log(`[atalay-import] Güncellenen: ${updated}, yeni: ${added}, atlanan (fiyatsız): ${skipped}`);
  console.log(`[atalay-import] Toplam katalog: ${catalog.length}`);

  console.log('[atalay-import] dept JSON yenileniyor…');
  execSync('node scripts/build-dept-catalog.mjs', { cwd: root, stdio: 'inherit' });
  console.log('[atalay-import] file fallback…');
  execSync('node scripts/generate-file-fallback.mjs', { cwd: root, stdio: 'inherit' });
  console.log('[atalay-import] Bitti. Canlı: ekipmanlar.json + data/dept/*.json yükleyin.');
}

function extractModelFromName(name) {
  const m = String(name || '').match(/\b([EA]?\s?[A-Z]{2,}[\s-]?\d{2,}[\w/.-]*)\b/i);
  return m ? m[1].trim() : '';
}

main();
