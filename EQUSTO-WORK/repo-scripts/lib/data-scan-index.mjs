/**
 * public/data altındaki JSON kaynaklarını tarar → eşleştirme indeksi.
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { classifyProduct, catalogId } from './catalog-classify.mjs';

const CODE_RE = /\b([0-9]{2,4}[A-Z][0-9]\.[0-9]{2}[A-Z0-9]{2,6}\.[0-9]{2})\b/gi;

const SKIP_DIR = new Set(['dept', 'vitrum-drawings', 'templates', 'imt300', 'advanced-cuisine-clear-ice']);
const SKIP_FILE =
  /^(ekipmanlar|ekipmanlar\d|\.kariyer|.*backup.*|.*report.*|.*example.*|.*template.*|.*seo.*|.*ld.*|pfos-|vitrum-|eq-guide|homepage-|product-schema|pricing-policy|fiyatlar\.json|_sayfa-log|_pdf-images-map|_index\.json|ozti-missing|oztiryakiler-image-errors)/i;

export function normKey(brand, name) {
  const b = String(brand || '')
    .toLocaleLowerCase('tr')
    .replace(/[^a-z0-9ğüşıöç]+/gi, '');
  const n = String(name || '')
    .toLocaleLowerCase('tr')
    .replace(/[^a-z0-9ğüşıöç]+/gi, '');
  return b + '|' + n;
}

export function normCode(code) {
  return String(code || '')
    .trim()
    .toLowerCase()
    .replace(/\./g, '-');
}

export function extractProductCodes(text) {
  const out = [];
  const hay = String(text || '');
  let m;
  const re = new RegExp(CODE_RE.source, 'gi');
  while ((m = re.exec(hay)) !== null) out.push(m[1]);
  return out;
}

export function extractModelToken(name, brand) {
  const parts = String(name || '').trim().split(/\s+/);
  if (!parts.length) return '';
  const last = parts[parts.length - 1].toUpperCase();
  if (last.length >= 3 && /[A-Z]/.test(last) && /\d/.test(last)) return last;
  if (/atalay/i.test(brand || '') && parts.length >= 2) {
    const tail = parts.slice(-2).join(' ').toUpperCase();
    if (/^[A-Z]{2,}/.test(tail)) return tail.replace(/\s+/g, '-');
  }
  return '';
}

function normalizeImages(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((r) => {
      let s = String(r || '').replace(/\//g, '\\').trim();
      if (!s) return '';
      if (/^https?:\/\//i.test(s)) return s;
      if (/^oztiryakiler-images[\\/]/i.test(s)) return s;
      if (/^data[\\/]/i.test(s)) return s.replace(/^data[\\/]/i, '');
      if (!/^images[\\/]/i.test(s)) s = 'images\\' + s.replace(/^images[\\/]/i, '');
      return s;
    })
    .filter(Boolean);
}

function rowFromRecord(row, meta) {
  const name = String(row.name || row.ürün_adı || row.title || '').trim();
  const brand = String(row.brand || row.ürün_markası || meta.brandDefault || '').trim();
  if (!name) return null;

  let category = row.category || '';
  let dept = row.dept || '';
  if (!dept || !category) {
    const c = classifyProduct(row);
    if (!dept) dept = c.dept;
    if (!category || category === 'sanayi-ocaklari') category = c.category;
  }

  const images = normalizeImages(row.images || row.resimler || (row.localImage ? [row.localImage] : []));

  return {
    brand,
    name,
    category,
    dept,
    price: row.price != null ? String(row.price) : row.dealerPriceTRY != null ? formatTry(row.dealerPriceTRY) : '',
    specs: String(row.specs || row.açıklamalar_site || row.açıklamalar || row.excerpt || '').trim(),
    images,
    sku: String(row.sku || row.ürün_kodu || row.model || row.priceListCode || row.productCode || '').trim(),
    productCode: String(row.productCode || row.priceListCode || '').trim(),
    source: meta.source,
    sourceFile: meta.file,
    priority: meta.priority,
  };
}

function formatTry(n) {
  const v = Number(n);
  if (!Number.isFinite(v) || v <= 0) return 'Teklif için iletişim';
  const net = v;
  const gross = v * 1.2;
  const fmt = (x) =>
    x.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `₺${fmt(net)} + KDV\nKDV Dahil ₺${fmt(gross)}`;
}

function addToIndex(index, entry) {
  const keys = new Set();
  keys.add('nm:' + normKey(entry.brand, entry.name));
  if (entry.sku) keys.add('sku:' + entry.sku.toUpperCase());
  if (entry.productCode) {
    keys.add('code:' + entry.productCode);
    keys.add('coden:' + normCode(entry.productCode));
  }
  for (const code of extractProductCodes(entry.name + ' ' + entry.specs)) {
    keys.add('code:' + code);
    keys.add('coden:' + normCode(code));
  }

  for (const key of keys) {
    const prev = index.get(key);
    if (!prev || entry.priority > prev.priority) {
      index.set(key, { ...entry, matchKey: key });
    }
  }
}

function walkJsonFiles(dir, root, out) {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, ent.name);
    if (ent.isDirectory()) {
      if (!SKIP_DIR.has(ent.name)) walkJsonFiles(p, root, out);
      continue;
    }
    if (!ent.name.endsWith('.json')) continue;
    if (SKIP_FILE.test(ent.name)) continue;
    const rel = relative(root, p).replace(/\\/g, '/');
    if (rel.startsWith('dept/')) continue;
    out.push(p);
  }
}

function loadRows(file, dataRoot) {
  const rel = relative(dataRoot, file).replace(/\\/g, '/');
  let raw;
  try {
    raw = JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return [];
  }

  if (rel === 'oztiryakiler-wp-products.json' && raw.products) {
    return raw.products.map((p) => ({
      row: {
        name: p.priceListName || p.title,
        brand: 'Öztiryakiler Endüstriyel Mutfak',
        category: '',
        price: p.dealerPriceTRY != null ? formatTry(p.dealerPriceTRY) : '',
        specs: p.excerpt || '',
        images: p.localImage ? [p.localImage] : p.imageUrl ? [p.imageUrl] : [],
        productCode: p.productCode || p.priceListCode,
        sku: p.priceListCode || p.productCode,
      },
      meta: { source: 'ozti-wp', file: rel, priority: 50, brandDefault: 'Öztiryakiler' },
    }));
  }

  if (rel === 'oztiryakiler-price-overlay-bayi1.json' && raw.byProductCode) {
    return Object.entries(raw.byProductCode).map(([code, v]) => ({
      row: {
        name: v.listName || code,
        brand: 'Öztiryakiler Endüstriyel Mutfak',
        productCode: code,
        price: formatTry(v.price),
        specs: '',
        images: [],
      },
      meta: { source: 'ozti-price', file: rel, priority: 55, brandDefault: 'Öztiryakiler' },
    }));
  }

  let arr = Array.isArray(raw) ? raw : raw.products || raw.items || null;
  if (!arr || !Array.isArray(arr)) return [];

  let priority = 30;
  let source = 'data-json';
  if (rel.includes('fiyat-listeleri/atalay')) {
    priority = 80;
    source = 'atalay';
  } else if (rel === 'ekipmanlar1.json') {
    priority = 20;
    source = 'legacy1';
  } else if (rel.includes('proso')) {
    priority = 40;
    source = 'proso';
  }

  return arr.map((row) => ({
    row,
    meta: { source, file: rel, priority, brandDefault: row.brand || '' },
  }));
}

/** Görseller: data/images ve data/oztiryakiler-images basename indeksi */
export function buildImageIndex(dataRoot) {
  const byBase = new Map();
  const dirs = [
    { dir: join(dataRoot, 'images'), prefix: 'images\\' },
    { dir: join(dataRoot, 'oztiryakiler-images'), prefix: 'oztiryakiler-images\\' },
  ];
  for (const { dir, prefix } of dirs) {
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)) {
      if (!/\.(jpg|jpeg|png|webp|gif)$/i.test(f)) continue;
      const base = f.replace(/\.[^.]+$/, '').toLowerCase();
      byBase.set(base, prefix + f);
      const stem = base.replace(/_\d+$/, '');
      if (!byBase.has(stem)) byBase.set(stem, prefix + f);
    }
  }
  return byBase;
}

export function buildDataIndex(dataRoot) {
  const index = new Map();
  const files = [];
  walkJsonFiles(dataRoot, dataRoot, files);

  for (const file of files) {
    const batches = loadRows(file, dataRoot);
    for (const { row, meta } of batches) {
      const entry = rowFromRecord(row, meta);
      if (entry) addToIndex(index, entry);
    }
  }

  return { index, filesScanned: files.length };
}

export function lookupIndex(index, product) {
  const tries = [];
  tries.push('nm:' + normKey(product.brand, product.name));
  const model = extractModelToken(product.name, product.brand);
  if (model) tries.push('sku:' + model.toUpperCase());
  if (product.sku) tries.push('sku:' + String(product.sku).toUpperCase());
  const codes = extractProductCodes((product.name || '') + ' ' + (product.specs || ''));
  for (const c of codes) {
    tries.push('code:' + c);
    tries.push('coden:' + normCode(c));
  }

  let best = null;
  for (const t of tries) {
    const hit = index.get(t);
    if (hit && (!best || hit.priority > best.priority)) best = hit;
  }
  return best;
}

export function imageFileExists(dataRoot, relPath) {
  if (!relPath) return false;
  const s = String(relPath).replace(/\//g, '\\');
  if (/^https?:/i.test(s)) return true;
  const p = join(dataRoot, s.replace(/^images\\/, 'images\\').replace(/^oztiryakiler-images\\/, 'oztiryakiler-images\\'));
  try {
    return existsSync(p) && statSync(p).isFile();
  } catch {
    return false;
  }
}

export { catalogId, classifyProduct };
