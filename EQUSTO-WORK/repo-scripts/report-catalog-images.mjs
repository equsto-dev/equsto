/**
 * Katalog images[] ↔ public/data/images dosya varlığı raporu.
 *   node scripts/report-catalog-images.mjs
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const catalog = join(root, 'public', 'data', 'ekipmanlar.json');
const imgDir = join(root, 'public', 'data', 'images');
const out = join(root, 'public', 'data', 'image-missing-local.json');

const arr = JSON.parse(readFileSync(catalog, 'utf8'));
const onDisk = new Set(readdirSync(imgDir));
let ok = 0;
const missing = [];

for (const p of arr) {
  const rel = p.images && p.images[0];
  if (!rel) continue;
  const fn = String(rel).replace(/\\/g, '/').split('/').pop();
  if (onDisk.has(fn)) ok++;
  else missing.push({ brand: p.brand, name: p.name, file: fn });
}

writeFileSync(out, JSON.stringify({ at: new Date().toISOString(), ok, missing: missing.length, items: missing.slice(0, 500) }, null, 2));
console.log('[report] Katalog görseli:', ok + missing.length, '| diskte var:', ok, '| eksik:', missing.length);
console.log('[report] Örnek eksik:', missing.slice(0, 5).map((x) => x.file));
console.log('[report] Detay:', out);
