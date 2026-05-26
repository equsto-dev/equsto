/**
 * ekipmanlar.json — sıfırdan veya mevcut katalogdan yeniden sınıflandırma.
 *
 *   node scripts/rebuild-ekipmanlar.mjs --from current --dry-run
 *   node scripts/rebuild-ekipmanlar.mjs --from current --replace
 *   node scripts/rebuild-ekipmanlar.mjs --from atalay --replace
 *
 * Kaynaklar:
 *   current  — public/data/ekipmanlar.json (yalnızca dept/category/id yenilenir)
 *   atalay   — public/data/fiyat-listeleri/atalay/2025-yerli/tum-urunler.json
 *
 * Öztiryakiler/Kariyer: Equsto-ömer JSON yolları --ozti= --kariyer= ile (ileride genişletilir).
 */
import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { classifyProduct, catalogId, loadTaxonomy } from './lib/catalog-classify.mjs';
import { sanitizeCatalogProduct } from './lib/sanitize-vendor-leaks.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const CATALOG = join(root, 'public', 'data', 'ekipmanlar.json');

const DRY_RUN = process.argv.includes('--dry-run');
const REPLACE = process.argv.includes('--replace');
const KEEP_SPECIAL = !process.argv.includes('--no-keep-special');

function argValue(flag) {
  const a = process.argv.find((x) => x.startsWith(flag + '='));
  return a ? a.slice(flag.length + 1) : null;
}

function argFrom() {
  return argValue('--from') || 'current';
}

function loadArray(path) {
  const raw = JSON.parse(readFileSync(path, 'utf8'));
  if (Array.isArray(raw)) return raw;
  if (raw && Array.isArray(raw.products)) return raw.products;
  if (raw && Array.isArray(raw.items)) return raw.items;
  throw new Error('Dizi bekleniyor: ' + path);
}

function isSpecial(p) {
  return !!(p && (p.equstoPage || p.vendor || p._equstoSpecial));
}

function normalizeRow(p) {
  const { dept, category } = classifyProduct(p);
  const out = {
    id: p.id || catalogId(p),
    dept,
    category,
    brand: String(p.brand || p.ürün_markası || '').trim(),
    name: String(p.name || p.ürün_adı || '').trim(),
    price: p.price != null ? String(p.price) : 'Teklif için iletişim',
    specs: String(p.specs || p.açıklamalar_site || p.açıklamalar || '').trim(),
    images: Array.isArray(p.images) ? p.images : [],
  };
  if (p.sku || p.ürün_kodu) out.sku = String(p.sku || p.ürün_kodu).trim();
  if (p.model || p.model_numarası) out.model = String(p.model || p.model_numarası).trim();
  if (p.barcode || p.barkod) out.barcode = String(p.barcode || p.barkod).trim();
  if (p.sourceUrl || p.ürün_linki) out.sourceUrl = String(p.sourceUrl || p.ürün_linki).trim();
  if (p.equstoPage) out.equstoPage = p.equstoPage;
  if (p.vendor) out.vendor = p.vendor;
  return sanitizeCatalogProduct(out);
}

function loadFromCurrent() {
  if (!existsSync(CATALOG)) throw new Error('Yok: ' + CATALOG);
  return loadArray(CATALOG);
}

function loadFromAtalay() {
  const p =
    argValue('--atalay') ||
    join(root, 'public', 'data', 'fiyat-listeleri', 'atalay', '2025-yerli', 'tum-urunler.json');
  const rows = loadArray(p);
  return rows.map((item) => ({
    name: item.name || item.ad,
    brand: item.brand || 'Atalay Endüstriyel Mutfak Ekipmanları',
    category: item.category,
    kategori: item.kategori || item.alt_kategori,
    price: item.price,
    specs: item.specs || item.aciklama,
    images: item.images || item.resimler || [],
    sku: item.model || item.sku,
  }));
}

function main() {
  const tax = loadTaxonomy();
  const from = argFrom();
  let rows = [];

  if (from === 'current') rows = loadFromCurrent();
  else if (from === 'atalay') rows = loadFromAtalay();
  else throw new Error('--from current|atalay (şimdilik)');

  const stats = {
    in: rows.length,
    out: 0,
    skipped: 0,
    specialKept: 0,
    byDept: {},
    byCategory: {},
    reclassified: 0,
  };

  const out = [];
  const seen = new Set();

  for (const p of rows) {
    if (!p || (!p.name && !p.ürün_adı)) {
      stats.skipped++;
      continue;
    }
    if (KEEP_SPECIAL && isSpecial(p)) {
      const copy = { ...p };
      if (!copy.id) copy.id = catalogId(copy);
      if (!copy.dept) copy.dept = classifyProduct(copy).dept;
      const key = copy.id || catalogId(copy);
      if (!seen.has(key)) {
        seen.add(key);
        out.push(copy);
        stats.specialKept++;
        stats.out++;
      }
      continue;
    }

    const item = normalizeRow(p);
    const oldCat = String(p.category || '');
    if (oldCat && (oldCat !== item.category || p.dept !== item.dept)) stats.reclassified++;

    const key = item.id;
    if (seen.has(key)) continue;
    seen.add(key);

    stats.byDept[item.dept] = (stats.byDept[item.dept] || 0) + 1;
    stats.byCategory[item.category] = (stats.byCategory[item.category] || 0) + 1;
    out.push(item);
    stats.out++;
  }

  out.sort((a, b) => {
    const bd = (a.brand || '').localeCompare(b.brand || '', 'tr');
    if (bd) return bd;
    return (a.name || '').localeCompare(b.name || '', 'tr');
  });

  console.log('[rebuild-ekipmanlar] Kaynak:', from);
  console.log('[rebuild-ekipmanlar] Girdi:', stats.in, '→ Çıktı:', stats.out, 'atlanan:', stats.skipped);
  console.log('[rebuild-ekipmanlar] Yeniden sınıflandırılan (tahmini):', stats.reclassified);
  if (stats.specialKept) console.log('[rebuild-ekipmanlar] Özel satır korundu:', stats.specialKept);
  console.log('[rebuild-ekipmanlar] Departman:', stats.byDept);
  console.log(
    '[rebuild-ekipmanlar] En çok category:',
    Object.entries(stats.byCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
  );

  const sanayi = stats.byCategory['sanayi-ocaklari'] || 0;
  const firin = stats.byCategory['firinlar'] || 0;
  const uncls = stats.byCategory[tax.defaultCategory] || 0;
  console.log(
    '[rebuild-ekipmanlar] sanayi-ocaklari:',
    sanayi,
    '| firinlar:',
    firin,
    '|',
    tax.defaultCategory + ':',
    uncls
  );

  if (DRY_RUN) {
    console.log('[rebuild-ekipmanlar] --dry-run: dosya yazılmadı.');
    return;
  }

  if (!REPLACE) {
    console.log('[rebuild-ekipmanlar] Yazmak için --replace ekleyin.');
    return;
  }

  const backup = join(root, 'public', 'data', `ekipmanlar.backup-${Date.now()}.json`);
  if (existsSync(CATALOG)) {
    copyFileSync(CATALOG, backup);
    console.log('[rebuild-ekipmanlar] Yedek:', backup);
  }
  writeFileSync(CATALOG, JSON.stringify(out));
  console.log('[rebuild-ekipmanlar] Yazıldı:', CATALOG, '(' + out.length + ' ürün)');
  console.log('[rebuild-ekipmanlar] Sonraki: npm run data:dept && npm run data:validate');
}

main();
