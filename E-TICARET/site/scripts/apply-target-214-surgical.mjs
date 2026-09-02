import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DEPT_DIR = ROOT + '/public/data/dept';
const MASTER = ROOT + '/var/catalog/ekipmanlar.json';
const TARGET_FILE = process.env.TARGET_JSON || 'C:/Users/adema/AppData/Local/Temp/opencode/equsto/FINAL_214_UPDATE.json';

const DRY = process.argv.includes('--dry-run');
if (!fs.existsSync(TARGET_FILE)) { console.error('TARGET_JSON bulunamadi:', TARGET_FILE); process.exit(1); }
const updates = JSON.parse(fs.readFileSync(TARGET_FILE, 'utf8'));
const deptTargets = new Map(updates.filter(r => r.source === 'dept').map(r => [String(r.sku), r]));
const masterTargets = new Map(updates.map(r => [String(r.sku), r]));

function fmtTry(n) { return `\u20ba${Math.round(n).toLocaleString('tr-TR')},00`; }

function findTopLevelObjects(text) {
  const objects = [];
  let i = 0, n = text.length;
  while (i < n) {
    if (text[i] === '{') {
      const start = i; let depth = 0, inStr = false, j = start;
      for (; j < n; j++) {
        const c = text[j];
        if (inStr) { if (c === '\\') { j++; continue; } if (c === '"') inStr = false; continue; }
        if (c === '"') { inStr = true; continue; }
        if (c === '{') depth++;
        else if (c === '}') { depth--; if (depth === 0) { objects.push({ start, end: j }); i = j + 1; break; } }
      }
      continue;
    }
    i++;
  }
  return objects;
}
const skuOf = (text, o) => { const m = text.slice(o.start, o.end + 1).match(/"sku"\s*:\s*"([^"]+)"/); return m ? m[1] : null; };

function patchObjectSlice(slice, target) {
  const newTl = Math.round(target.target);
  const newNet = Math.round(target.target / 1.2);
  const newHav = Math.round(target.target * 0.98);
  const newPrice = `${fmtTry(target.target)} KDV dahil`;
  let out = slice;
  out = out.replace(/("fiyat_tl"\s*:\s*)(\d+)/, (m, p, v) => (Number(v) === newTl ? m : p + newTl));
  out = out.replace(/("fiyat_tl_net"\s*:\s*)(\d+)/, (m, p, v) => (Number(v) === newNet ? m : p + newNet));
  out = out.replace(/("fiyat_havale_tl"\s*:\s*)(\d+)/, (m, p, v) => (Number(v) === newHav ? m : p + newHav));
  out = out.replace(/("price"\s*:\s*")((?:[^"\\]|\\.)*)(")/, (m, p, val, q) => (!/KDV dahil/i.test(val) || val === newPrice ? m : p + newPrice + q));
  return out;
}

function patchFile(filePath, targetMap) {
  const orig = fs.readFileSync(filePath, 'utf8');
  const replacements = [];
  for (const obj of findTopLevelObjects(orig)) {
    const sku = skuOf(orig, obj);
    const t = sku != null ? targetMap.get(String(sku)) : undefined;
    if (!t) continue;
    const slice = orig.slice(obj.start, obj.end + 1);
    const ns = patchObjectSlice(slice, t);
    if (ns !== slice) replacements.push({ sku, start: obj.start, end: obj.end + 1, text: ns });
  }
  if (!replacements.length) return [];
  replacements.sort((a, b) => b.start - a.start);
  let out = orig;
  for (const r of replacements) out = out.slice(0, r.start) + r.text + out.slice(r.end);
  if (!DRY) fs.writeFileSync(filePath, out, 'utf8');
  return replacements.map(r => r.sku);
}

const report = [];
if (!process.argv.includes('--master-only')) {
  for (const f of fs.readdirSync(DEPT_DIR).filter(f => f.endsWith('.json')).sort()) {
    const patched = patchFile(DEPT_DIR + '/' + f, deptTargets);
    if (patched.length) report.push({ file: f, n: patched.length });
  }
}
let master = [];
if (!process.argv.includes('--dept-only')) {
  master = patchFile(MASTER, masterTargets);
}
console.log((DRY ? '[DRY] ' : '[UYGULANDI] ') + 'dept: ' + JSON.stringify(report));
console.log((DRY ? '[DRY] ' : '[UYGULANDI] ') + 'master: ' + master.length + ' blok');
