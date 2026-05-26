// PG'deki CRM/admin verisini (markalar, tip sozlugu, musteri, teklif, set, kural, soru)
// scripts/data/equsto-store.json icine merger eder. Mevcut alanlari (projeAkis.products,
// geriBildirim, projeler) ezmez. Calistirma: node scripts/export-pg-to-store.mjs
//
// Kaynak: .env DATABASE_URL veya PGHOST/PGUSER/PGPASSWORD/PGDATABASE.

import fs from 'node:fs';
import path from 'node:path';
import { Client } from 'pg';

function loadDotEnvIfPresent() {
  const candidates = ['.env.local', '.env'];
  for (const name of candidates) {
    const p = path.join(process.cwd(), name);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
      const s = line.trim();
      if (!s || s.startsWith('#')) continue;
      const i = s.indexOf('=');
      if (i < 1) continue;
      const k = s.slice(0, i).trim();
      let v = s.slice(i + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      if (process.env[k] == null) process.env[k] = v;
    }
  }
}
loadDotEnvIfPresent();

const STORE_DIR = path.join(process.cwd(), 'scripts', 'data');
const STORE_FILE = path.join(STORE_DIR, 'equsto-store.json');

function tsTag() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function readStore() {
  if (!fs.existsSync(STORE_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(STORE_FILE, 'utf8') || '{}');
  } catch (e) {
    console.error('[export] mevcut store okunamadi:', e.message);
    return {};
  }
}

function backupStore() {
  if (!fs.existsSync(STORE_FILE)) return null;
  const bk = path.join(STORE_DIR, `equsto-store.backup-${tsTag()}.json`);
  fs.copyFileSync(STORE_FILE, bk);
  return bk;
}

function writeStoreAtomic(obj) {
  if (!fs.existsSync(STORE_DIR)) fs.mkdirSync(STORE_DIR, { recursive: true });
  const tmp = STORE_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2), 'utf8');
  fs.renameSync(tmp, STORE_FILE);
}

function strip_(row) {
  const out = {};
  for (const k of Object.keys(row)) {
    const nk = k.endsWith('_') ? k.slice(0, -1) : k;
    out[nk] = row[k];
  }
  return out;
}

async function main() {
  const cfg = process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.PGHOST || 'localhost',
        port: Number(process.env.PGPORT || 5432),
        user: process.env.PGUSER || 'postgres',
        password: process.env.PGPASSWORD || '',
        database: process.env.PGDATABASE || 'equsto',
      };

  const client = new Client(cfg);
  await client.connect();
  console.log('[export] PG baglandi:', cfg.connectionString ? cfg.connectionString.replace(/:[^:@/]+@/, ':***@') : `${cfg.user}@${cfg.host}/${cfg.database}`);

  const out = readStore();
  const bk = backupStore();
  if (bk) console.log('[export] yedek alindi:', path.basename(bk));

  const report = { eklendi: {}, korundu: {} };

  // 1) markalar (PG -> markalar[])
  const markalar = (await client.query('SELECT * FROM markalar ORDER BY ad')).rows.map(strip_);
  if (!Array.isArray(out.markalar) || out.markalar.length === 0) {
    out.markalar = markalar;
    report.eklendi.markalar = markalar.length;
  } else {
    report.korundu.markalar = out.markalar.length;
  }

  // 2) tip_sozlugu -> tipSozlugu[]  (kaynak='import' yap ki backend gorebilsin)
  const tipSozlugu = (await client.query('SELECT * FROM tip_sozlugu ORDER BY tip_kodu')).rows.map(strip_).map((t) => ({
    ...t,
    kaynak: t.kaynak || 'import',
  }));
  if (!Array.isArray(out.tipSozlugu) || out.tipSozlugu.length === 0) {
    out.tipSozlugu = tipSozlugu;
    report.eklendi.tipSozlugu = tipSozlugu.length;
  } else {
    report.korundu.tipSozlugu = out.tipSozlugu.length;
  }

  // 3) musteriler
  const musteriler = (await client.query('SELECT * FROM musteriler ORDER BY created_at')).rows.map(strip_);
  if (!Array.isArray(out.musteriler) || out.musteriler.length === 0) {
    out.musteriler = musteriler;
    report.eklendi.musteriler = musteriler.length;
  } else {
    report.korundu.musteriler = out.musteriler.length;
  }

  // 4) teklifler (+ teklif_kalemleri inline)
  const teklifler = (await client.query('SELECT * FROM teklifler ORDER BY created_at')).rows.map(strip_);
  const kalemler = (await client.query('SELECT * FROM teklif_kalemleri')).rows.map(strip_);
  const kalemMap = new Map();
  for (const k of kalemler) {
    if (!kalemMap.has(k.teklif_id)) kalemMap.set(k.teklif_id, []);
    kalemMap.get(k.teklif_id).push(k);
  }
  for (const t of teklifler) t.kalemler = kalemMap.get(t.id) || [];
  if (!Array.isArray(out.teklifler) || out.teklifler.length === 0) {
    out.teklifler = teklifler;
    report.eklendi.teklifler = teklifler.length;
    report.eklendi['teklifler.kalemler'] = kalemler.length;
  } else {
    report.korundu.teklifler = out.teklifler.length;
  }

  // 5) projeAkis: questions / rules / eqSets (PG: sorular / kurallar / ekipman_setleri+set_urunler)
  if (!out.projeAkis || typeof out.projeAkis !== 'object') {
    out.projeAkis = { questions: [], shopTypes: [], rules: [], eqSets: [], products: [] };
  }

  const sorular = (await client.query('SELECT * FROM sorular ORDER BY sira')).rows.map(strip_);
  if (!Array.isArray(out.projeAkis.questions) || out.projeAkis.questions.length === 0) {
    out.projeAkis.questions = sorular;
    report.eklendi['projeAkis.questions'] = sorular.length;
  } else {
    report.korundu['projeAkis.questions'] = out.projeAkis.questions.length;
  }

  const kurallar = (await client.query('SELECT * FROM kurallar')).rows.map(strip_);
  if (!Array.isArray(out.projeAkis.rules) || out.projeAkis.rules.length === 0) {
    out.projeAkis.rules = kurallar;
    report.eklendi['projeAkis.rules'] = kurallar.length;
  } else {
    report.korundu['projeAkis.rules'] = out.projeAkis.rules.length;
  }

  const setler = (await client.query('SELECT * FROM ekipman_setleri')).rows.map(strip_);
  const setUrunler = (await client.query('SELECT * FROM set_urunler')).rows;
  const setUrunMap = new Map();
  for (const su of setUrunler) {
    if (!setUrunMap.has(su.set_id)) setUrunMap.set(su.set_id, []);
    setUrunMap.get(su.set_id).push({ urun_id: su.urun_id, adet: su.adet });
  }
  for (const s of setler) s.urunler = setUrunMap.get(s.id) || [];
  if (!Array.isArray(out.projeAkis.eqSets) || out.projeAkis.eqSets.length === 0) {
    out.projeAkis.eqSets = setler;
    report.eklendi['projeAkis.eqSets'] = setler.length;
    report.eklendi['projeAkis.eqSets.urunler'] = setUrunler.length;
  } else {
    report.korundu['projeAkis.eqSets'] = out.projeAkis.eqSets.length;
  }

  // 6) Korunan alanlar (sadece raporlama)
  report.korundu['projeAkis.products'] = out.projeAkis.products?.length || 0;
  report.korundu.geriBildirim = (out.geriBildirim || []).length;
  report.korundu.projeler = (out.projeler || []).length;
  report.korundu.fiyatlar = Object.keys(out.fiyatlar || {}).length;

  // Saved-at imzasi
  out.saved_at = new Date().toISOString();
  out.export_pg = { at: out.saved_at, src: cfg.database || cfg.connectionString };

  writeStoreAtomic(out);
  await client.end();

  console.log('\n=== Eklenen kayitlar ===');
  for (const [k, v] of Object.entries(report.eklendi)) console.log(`  ${k.padEnd(30)} ${v}`);
  console.log('\n=== Korunan (mevcut, dokunulmadi) ===');
  for (const [k, v] of Object.entries(report.korundu)) console.log(`  ${k.padEnd(30)} ${v}`);
  console.log('\n[export] tamam:', STORE_FILE);
}

main().catch((e) => {
  console.error('[export] HATA:', e.message);
  process.exit(1);
});
