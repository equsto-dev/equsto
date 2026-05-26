/**
 * ekipmanlar.json doğrulama (yeni katalog sonrası).
 *   node scripts/validate-catalog.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadTaxonomy, deptForCategory } from './lib/catalog-classify.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const CATALOG = join(root, 'public', 'data', 'ekipmanlar.json');

function main() {
  if (!existsSync(CATALOG)) {
    console.error('Yok:', CATALOG);
    process.exit(1);
  }
  const tax = loadTaxonomy();
  const arr = JSON.parse(readFileSync(CATALOG, 'utf8'));
  if (!Array.isArray(arr)) {
    console.error('ekipmanlar.json dizi olmalı');
    process.exit(1);
  }

  let noId = 0;
  let noDept = 0;
  let deptMismatch = 0;
  let unknownCat = 0;
  let dupId = 0;
  const ids = new Set();
  const byDept = {};
  const byCat = {};

  for (const p of arr) {
    if (!p.id) noId++;
    if (!p.dept) noDept++;
    const cat = String(p.category || '');
    if (!tax.slugToDept[cat] && cat !== tax.defaultCategory) unknownCat++;
    if (p.dept && cat && deptForCategory(cat) !== p.dept) deptMismatch++;
    if (p.id) {
      if (ids.has(p.id)) dupId++;
      ids.add(p.id);
    }
    byDept[p.dept || '?'] = (byDept[p.dept || '?'] || 0) + 1;
    byCat[cat || '?'] = (byCat[cat || '?'] || 0) + 1;
  }

  const sanayiShare = ((byCat['sanayi-ocaklari'] || 0) / arr.length) * 100;

  console.log('[validate] Ürün:', arr.length);
  console.log('[validate] dept dağılımı:', byDept);
  console.log('[validate] Eksik id:', noId, '| eksik dept:', noDept);
  console.log('[validate] dept≠slugToDept:', deptMismatch);
  console.log('[validate] Bilinmeyen category:', unknownCat);
  console.log('[validate] Çift id:', dupId);
  console.log('[validate] sanayi-ocaklari payı:', sanayiShare.toFixed(1) + '%');

  const fail =
    noId > arr.length * 0.01 ||
    noDept > 0 ||
    dupId > 0 ||
    unknownCat > arr.length * 0.05 ||
    sanayiShare > 45;

  if (fail) {
    console.error('[validate] UYARI: eşik aşıldı — katalog gözden geçirin.');
    process.exit(2);
  }
  console.log('[validate] OK');
}

main();
