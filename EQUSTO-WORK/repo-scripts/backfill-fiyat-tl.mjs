/**
 * ekipmanlar.json → her ürüne fiyat_tl (sayısal TL) yazar.
 *
 *   node scripts/backfill-fiyat-tl.mjs --dry-run
 *   node scripts/backfill-fiyat-tl.mjs --apply
 */
import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsePriceTLFromCatalog } from './lib/parse-price-tl.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const CATALOG = join(root, 'public/data/ekipmanlar.json');
const APPLY = process.argv.includes('--apply');

const catalog = JSON.parse(readFileSync(CATALOG, 'utf8'));
let set = 0;
let cleared = 0;
let unchanged = 0;

for (const item of catalog) {
  const n = parsePriceTLFromCatalog(item.price);
  if (n > 0) {
    if (item.fiyat_tl !== n) set++;
    item.fiyat_tl = Math.round(n * 100) / 100;
  } else {
    if (item.fiyat_tl != null) cleared++;
    delete item.fiyat_tl;
    unchanged++;
  }
}

console.log('[backfill-fiyat-tl] ürün:', catalog.length);
console.log('[backfill-fiyat-tl] fiyat_tl yazıldı/güncellendi:', set);
console.log('[backfill-fiyat-tl] fiyat_tl silindi (teklif vb.):', cleared);

if (!APPLY) {
  console.log('[backfill-fiyat-tl] Uygulamak için: node scripts/backfill-fiyat-tl.mjs --apply');
  process.exit(0);
}

const backup = join(root, 'public/data', `ekipmanlar.backup-${Date.now()}-fiyat-tl.json`);
copyFileSync(CATALOG, backup);
writeFileSync(CATALOG, JSON.stringify(catalog));
console.log('[backfill-fiyat-tl] Yedek:', backup);
console.log('[backfill-fiyat-tl] Güncellendi:', CATALOG);
console.log('[backfill-fiyat-tl] Sonraki: npm run data:dept');
