/**
 * eq-dept-tips.js RAW → dept-plp-rank.mjs senkronu
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tipsPath = join(root, 'public', 'eq-dept-tips.js');
const outPath = join(root, 'scripts', 'dept-plp-rank.mjs');

const src = readFileSync(tipsPath, 'utf8');
const m = src.match(/var RAW = (\[[\s\S]*?\]);/);
if (!m) throw new Error('RAW not found in eq-dept-tips.js');

const header = `/**
 * Mutbex / Cafemarkt vitrin sırası — build için.
 * Kaynak: public/eq-dept-tips.js — npm run data:dept öncesi: node scripts/sync-dept-plp-rank.mjs
 */
export const RAW = `;

writeFileSync(
  outPath,
  header +
    m[1] +
    `;

const byDept = {};
RAW.forEach((row) => {
  if (!byDept[row.dept]) byDept[row.dept] = [];
  byDept[row.dept].push(row);
});

function lc(s) {
  return String(s || '').toLocaleLowerCase('tr');
}

function parseKeys(row) {
  if (row.slug) return null;
  const s = row.search || row.label || row.tip;
  return String(s)
    .split('|')
    .map((p) => p.trim())
    .filter(Boolean);
}

function haystack(item) {
  const name = item.name || item.n || '';
  const brand = item.brand || item.b || '';
  return lc(name + ' ' + brand);
}

export function tileMatchItem(item, row) {
  const cat = item.category || item.c || '';
  if (row.slug && cat === row.slug) return true;
  const keys = parseKeys(row);
  if (keys && keys.length) {
    const hay = haystack(item);
    for (const k of keys) {
      if (hay.indexOf(lc(k)) !== -1) return true;
    }
  }
  return false;
}

export function productRank(dept, item) {
  const rows = byDept[dept] || [];
  for (let i = 0; i < rows.length; i++) {
    if (tileMatchItem(item, rows[i])) return i;
  }
  return 1e6;
}

function hashDeptSeed(str) {
  let h = 2166136261;
  const s = String(str || '');
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function deptRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function shuffleDeptList(dept, items, salt = 'products') {
  const arr = items.slice();
  const rnd = deptRng(hashDeptSeed(dept + ':' + salt));
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function sortCatalogItems(dept, items) {
  return shuffleDeptList(dept, items, 'products');
}
`
);

console.log('Synced', outPath);
