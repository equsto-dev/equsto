/**
 * public/data taraması → ekipmanlar.json kategori, görsel, fiyat eşleştirme.
 *
 *   node scripts/enrich-ekipmanlar-from-data.mjs --dry-run
 *   node scripts/enrich-ekipmanlar-from-data.mjs --apply
 */
import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildDataIndex,
  buildImageIndex,
  lookupIndex,
  imageFileExists,
  classifyProduct,
  catalogId,
} from './lib/data-scan-index.mjs';
import { classifyByName } from './lib/catalog-classify.mjs';
import { parsePriceTLFromCatalog } from './lib/parse-price-tl.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dataRoot = join(root, 'public', 'data');
const CATALOG = join(dataRoot, 'ekipmanlar.json');
const REPORT = join(dataRoot, 'enrich-report.json');

const DRY_RUN = process.argv.includes('--dry-run');
const APPLY = process.argv.includes('--apply');

function main() {
  if (!existsSync(CATALOG)) throw new Error('Yok: ' + CATALOG);

  console.log('[enrich] DATA klasörü taranıyor…');
  const { index, filesScanned } = buildDataIndex(dataRoot);
  const imageIndex = buildImageIndex(dataRoot);
  console.log('[enrich] JSON dosyası:', filesScanned, '| indeks anahtarı:', index.size);

  const catalog = JSON.parse(readFileSync(CATALOG, 'utf8'));
  const stats = {
    total: catalog.length,
    categoryUpdated: 0,
    deptAdded: 0,
    priceUpdated: 0,
    fiyatTlSet: 0,
    imageUpdated: 0,
    imageFixed: 0,
    matched: 0,
    unmatched: 0,
    bySource: {},
  };

  const out = [];

  for (const p of catalog) {
    const item = { ...p };
    if (!item.id) item.id = catalogId(item);

    const nameRule = classifyByName(item.name, item.category);
    if (nameRule) {
      if (nameRule.category !== item.category) {
        item.category = nameRule.category;
        stats.categoryUpdated++;
      }
      if (nameRule.dept !== item.dept) {
        item.dept = nameRule.dept;
        stats.deptAdded++;
      }
    }

    const hit = lookupIndex(index, item);
    if (hit && !nameRule) {
      stats.matched++;
      stats.bySource[hit.source] = (stats.bySource[hit.source] || 0) + 1;

      if (hit.category && hit.category !== item.category) {
        item.category = hit.category;
        stats.categoryUpdated++;
      }
      if (hit.dept && item.dept !== hit.dept) {
        item.dept = hit.dept;
        stats.deptAdded++;
      }
      if (hit.price && hit.price !== 'Teklif için iletişim') {
        const cur = String(item.price || '');
        if (!cur || /teklif|iletişim|fiyat alınız/i.test(cur)) {
          item.price = hit.price;
          stats.priceUpdated++;
        }
      }
      if (hit.images && hit.images.length) {
        const cur0 = item.images && item.images[0];
        const missing = !cur0 || !imageFileExists(dataRoot, cur0);
        if (missing) {
          item.images = hit.images;
          stats.imageUpdated++;
        }
      }
      if (!item._enrichSource) item._enrichSource = hit.source;
    } else if (!nameRule) {
      const c = classifyProduct(item);
      if (!item.dept) {
        item.dept = c.dept;
        stats.deptAdded++;
      }
      if (item.category === 'sanayi-ocaklari' && c.category !== 'sanayi-ocaklari') {
        item.category = c.category;
        stats.categoryUpdated++;
      }
      stats.unmatched++;
    } else {
      stats.matched++;
    }

    const img0 = item.images && item.images[0];
    if (img0 && !imageFileExists(dataRoot, img0)) {
      const base = String(img0)
        .replace(/^.*[\\/]/, '')
        .replace(/_\d+\.[^.]+$/i, '')
        .replace(/\.[^.]+$/i, '')
        .toLowerCase();
      const alt = imageIndex.get(base);
      if (alt) {
        item.images = [alt];
        stats.imageFixed++;
      }
    }

    const ft = parsePriceTLFromCatalog(item.price);
    if (ft > 0) {
      item.fiyat_tl = Math.round(ft * 100) / 100;
      stats.fiyatTlSet++;
    } else {
      delete item.fiyat_tl;
    }

    delete item._enrichSource;
    out.push(item);
  }

  const report = {
    at: new Date().toISOString(),
    filesScanned,
    indexKeys: index.size,
    stats,
    imageFilesIndexed: imageIndex.size,
  };

  console.log('[enrich] Sonuç:', JSON.stringify(stats, null, 2));

  if (DRY_RUN || !APPLY) {
    writeFileSync(REPORT, JSON.stringify(report, null, 2));
    console.log('[enrich] Rapor:', REPORT);
    if (!APPLY) console.log('[enrich] Uygulamak için: node scripts/enrich-ekipmanlar-from-data.mjs --apply');
    return;
  }

  const backup = join(dataRoot, `ekipmanlar.backup-${Date.now()}-enrich.json`);
  copyFileSync(CATALOG, backup);
  writeFileSync(CATALOG, JSON.stringify(out));
  writeFileSync(REPORT, JSON.stringify(report, null, 2));
  console.log('[enrich] Yedek:', backup);
  console.log('[enrich] Güncellendi:', CATALOG);
  console.log('[enrich] Sonraki: npm run data:dept && npm run data:validate');
}

main();
