/**
 * YÜKSEL İTHAL 2025 → ekipmanlar.json (%35 iskonto, EUR→TRY)
 *
 *   npm run import:yuksel-ithal-ekipmanlar
 *   EQUSTO_YUKSEL_ITHAL_ISKONTO=0.35 EQUSTO_EUR_TRY=58.5 npm run import:yuksel-ithal-ekipmanlar
 */
import { readFileSync, writeFileSync, copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(root, 'public', 'data', 'fiyat-listeleri', 'yuksel', '2025-ithal', 'tum-urunler.json');
const EKIPMANLAR = join(root, 'public', 'data', 'ekipmanlar.json');
const BACKUP = join(root, 'public', 'data', `ekipmanlar.backup-yuksel-ithal-${Date.now()}.json`);

/** İthal liste: varsayılan %35 (yerli %55 ile karışmasın — EQUSTO_YUKSEL_ISKONTO kullanılmaz) */
const ISKONTO = Number(process.env.EQUSTO_YUKSEL_ITHAL_ISKONTO ?? '0.35');
const NET_MULT = Math.max(0, Math.min(1, 1 - ISKONTO));
const EUR_TRY = Number(process.env.EQUSTO_EUR_TRY || '58.5');
const KDV = Number(process.env.EQUSTO_KDV_ORAN || '20');

function normSku(s) {
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

function buildSpecs(item, listEur, netEur) {
  const lines = [
    item.name,
    '',
    `Kaynak: ${item.liste || 'YÜKSEL İTHAL - 2025'}`,
    item.alt_kategori ? `Bölüm: ${item.alt_kategori}` : '',
    item.model ? `Referans: ${item.model}` : '',
    item.page ? `Sayfa: ${item.page}` : '',
    listEur != null ? `Liste fiyatı (EUR): ${listEur}` : '',
    netEur != null ? `Equsto net (%${Math.round(ISKONTO * 100)} iskonto, EUR): ${netEur.toFixed(2)}` : '',
    `Kur: 1 EUR = ${EUR_TRY} TRY (KDV %${KDV})`,
  ];
  return lines.filter(Boolean).join('\r\n');
}

function main() {
  if (!existsSync(SRC)) {
    console.error('Once: npm run import:yuksel-ithal-2025');
    process.exit(1);
  }
  const rows = JSON.parse(readFileSync(SRC, 'utf8'));
  const catalog = JSON.parse(readFileSync(EKIPMANLAR, 'utf8'));

  mkdirSync(dirname(BACKUP), { recursive: true });
  copyFileSync(EKIPMANLAR, BACKUP);
  console.log('[yuksel-ithal] Yedek:', BACKUP);

  const byKey = new Map();
  for (let i = 0; i < catalog.length; i++) {
    const p = catalog[i];
    const sku = normSku(p.sku || p.model);
    if (sku && !byKey.has(sku)) byKey.set(sku, i);
  }

  let ithalImg = { models: {}, pages: {} };
  try {
    ithalImg = JSON.parse(
      readFileSync(
        join(root, 'public', 'data', 'fiyat-listeleri', 'yuksel', '2025-ithal', '_pdf-images-map.json'),
        'utf8',
      ),
    );
  } catch {
    /* */
  }

  let updated = 0;
  let added = 0;
  let skipped = 0;

  for (const item of rows) {
    const listEur = Number(item.fiyat_euro);
    if (!listEur || listEur <= 0) {
      skipped++;
      continue;
    }
    const netEur = Math.round(listEur * NET_MULT * 100) / 100;
    const skuKey = normSku(item.sku || item.model);
    const idx = byKey.get(skuKey);
    const imgRel =
      ithalImg.models?.[skuKey] ||
      (item.page != null ? ithalImg.pages?.[String(item.page)] || ithalImg.pages?.[item.page] : null);
    const images = imgRel ? [String(imgRel).replace(/\\/g, '/')] : [];

    const row = {
      category: item.category,
      brand: item.brand,
      name: item.name,
      price: priceFromEuro(listEur),
      specs: buildSpecs(item, listEur, netEur),
      images,
      sku: String(item.sku || skuKey),
      model: String(item.model || item.sku || '').trim(),
      liste_fiyati_eur: listEur,
      satis_eur_net: netEur,
      iskonto_oran: Math.round(ISKONTO * 100),
      kaynak_fiyat_listesi: item.kaynak || 'yuksel-2025-ithal-pdf',
      dept: item.dept,
      page: item.page,
    };

    if (idx != null) {
      catalog[idx] = row;
      updated++;
    } else {
      catalog.push(row);
      const ni = catalog.length - 1;
      byKey.set(skuKey, ni);
      added++;
    }
  }

  writeFileSync(EKIPMANLAR, JSON.stringify(catalog));
  console.log(`[yuksel-ithal] Iskonto %${Math.round(ISKONTO * 100)}, net carpani ${NET_MULT}, EUR->TRY ${EUR_TRY}`);
  console.log(`[yuksel-ithal] Guncellenen: ${updated}, yeni: ${added}, atlanan: ${skipped}`);
  console.log(`[yuksel-ithal] Toplam katalog: ${catalog.length}`);

  execSync('node scripts/build-dept-catalog.mjs', { cwd: root, stdio: 'inherit' });
  execSync('node scripts/generate-file-fallback.mjs', { cwd: root, stdio: 'inherit' });
  console.log('[yuksel-ithal] Bitti.');
}

main();
