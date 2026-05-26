/**
 * Yüksel PDF katalog ürünleri — görsel durumu raporu
 *   node scripts/report-yuksel-missing-images.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const CATALOG = path.join(ROOT, 'public', 'data', 'ekipmanlar.json');
const OUT_JSON = path.join(ROOT, 'public', 'data', 'yuksel-missing-images.json');
const OUT_CSV = path.join(ROOT, 'public', 'data', 'yuksel-missing-images.csv');

function diskOk(img) {
  if (!img) return false;
  const rel = String(img).replace(/^\//, '').replace(/^data\//, '');
  return fs.existsSync(path.join(ROOT, 'public', 'data', rel));
}

function imageRelPath(img) {
  return String(img || '').replace(/^\//, '').replace(/^data\//, '');
}

function csvEscape(s) {
  const t = String(s ?? '').replace(/"/g, '""');
  return /[",\n\r]/.test(t) ? `"${t}"` : t;
}

const catalog = JSON.parse(fs.readFileSync(CATALOG, 'utf8'));
const summary = { yerli: { total: 0, ok: 0, missing: 0 }, ithal: { total: 0, ok: 0, missing: 0 } };
const missing = [];

for (const p of catalog) {
  const kaynak = String(p.kaynak_fiyat_listesi || '');
  let src = null;
  if (kaynak.includes('yuksel-2025-yerli')) src = 'yerli';
  else if (kaynak.includes('yuksel-2025-ithal')) src = 'ithal';
  else continue;

  summary[src].total++;
  const img = (p.images || [])[0] || '';
  if (diskOk(img)) {
    summary[src].ok++;
    continue;
  }
  summary[src].missing++;
  const sku = String(p.sku || p.model || '').trim();
  missing.push({
    source: src,
    sku,
    model: p.model || '',
    brand: p.brand || '',
    name: p.name || '',
    category: p.category || '',
    dept: p.dept || '',
    page: p.page,
    image: img || null,
    searchQuery: buildSearchQuery(p),
  });
}

missing.sort((a, b) => {
  const pri = (x) => (/^(M\d|TTC|PZA|ASB|TTK|CA-|PZAD)/i.test(x.sku) ? 0 : 1);
  return pri(a) - pri(b) || String(a.sku).localeCompare(String(b.sku));
});

fs.writeFileSync(OUT_JSON, JSON.stringify({ at: new Date().toISOString(), summary, missing }, null, 2), 'utf8');

const header = 'source,sku,brand,name,searchQuery';
const lines = [header, ...missing.map((r) => [r.source, r.sku, r.brand, r.name, r.searchQuery].map(csvEscape).join(','))];
fs.writeFileSync(OUT_CSV, lines.join('\n') + '\n', 'utf8');

console.log('[yuksel-report]', summary);
console.log('[yuksel-report] Eksik liste:', missing.length, '→', OUT_JSON);

function buildSearchQuery(p) {
  const sku = String(p.sku || p.model || '').trim();
  const brand = /portabianco/i.test(p.brand || '') ? 'Portabianco' : 'Yüksel Endüstriyel';
  if (/^M\d{6,}$/i.test(sku)) return `Portashelf ${sku}`;
  if (sku && !/^\d+-X-/i.test(sku)) return `${brand} ${sku}`;
  const name = String(p.name || '').replace(/\s+/g, ' ').trim();
  return name.slice(0, 80) || brand;
}
