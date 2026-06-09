import crypto from 'node:crypto';
import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { URL } from 'node:url';

/** cPanel Node 16 — global fetch yok; Google doğrulama ve nominatim için */
if (typeof globalThis.fetch !== 'function') {
  try {
    const undici = await import('undici');
    globalThis.fetch = undici.fetch;
    if (!globalThis.Headers && undici.Headers) globalThis.Headers = undici.Headers;
    if (!globalThis.Request && undici.Request) globalThis.Request = undici.Request;
    if (!globalThis.Response && undici.Response) globalThis.Response = undici.Response;
    console.log('[claude-api-proxy] fetch polyfill: undici (Node < 18)');
  } catch (e) {
    console.warn(
      '[claude-api-proxy] fetch yok ve undici kurulamadı — npm install undici veya Node 18+ kullanın:',
      e && e.message ? e.message : e,
    );
  }
}

import { tryHandleEqustoAuth, equstoAuthStartupLog } from './lib/equsto-auth.mjs';
import { parsePriceTLFromCatalog } from './lib/parse-price-tl.mjs';

const PORT = Number(process.env.PORT || 3001);
const HOST = (
  process.env.HOST ||
  process.env.EQUSTO_API_HOST ||
  (process.env.PORT && process.env.PORT !== '3001' ? '0.0.0.0' : '127.0.0.1')
).trim();
const API_PREFIX = '/api';
const API_BUILD = '20260520-auth-cart-token';

/** cPanel Node /api mount bazen /api önekini düşürür → /auth/config gelir */
function normalizePathname(pathname) {
  let p = pathname || '/';
  if (!p.startsWith('/')) p = '/' + p;
  if (p === '/auth' || p.startsWith('/auth/')) return API_PREFIX + p;
  return p;
}

function loadDotEnvIfPresent() {
  const root = process.cwd();
  const candidates = ['.env.local', '.env'];
  for (const name of candidates) {
    const p = path.join(root, name);
    if (!fs.existsSync(p)) continue;
    const txt = fs.readFileSync(p, 'utf8');
    for (const line of txt.split(/\r?\n/)) {
      const s = line.trim();
      if (!s || s.startsWith('#')) continue;
      const i = s.indexOf('=');
      if (i < 1) continue;
      const k = s.slice(0, i).trim();
      let v = s.slice(i + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (process.env[k] == null) process.env[k] = v;
    }
  }
}

loadDotEnvIfPresent();

/** Admin panel Bearer — .env EQUSTO_ADMIN_BEARER; bos ise API acik (geriye uyum) */
const ADMIN_BEARER = String(process.env.EQUSTO_ADMIN_BEARER || '').trim();
const ADMIN_PASSWORD = String(process.env.EQUSTO_ADMIN_PASSWORD || '').trim();
const ADMIN_RECOVERY_CODE = String(process.env.EQUSTO_ADMIN_RECOVERY_CODE || '').trim();
const ADMIN_DEV_BEARER = 'equsto2025';
const ADMIN_AUTH_PATHS = [
  path.join(process.cwd(), 'public', 'data', 'admin-auth.json'),
  path.join(process.cwd(), 'data', 'admin-auth.json'),
];

function sha256AdminPassword(pw) {
  return crypto.createHash('sha256').update(String(pw)).digest('hex');
}

function readAdminAuthFile() {
  for (const p of ADMIN_AUTH_PATHS) {
    if (!fs.existsSync(p)) continue;
    try {
      const j = JSON.parse(fs.readFileSync(p, 'utf8'));
      if (j && j.pw_sha256) return { hash: String(j.pw_sha256), path: p };
    } catch (_) {}
  }
  return null;
}

function writeAdminAuthFile(hash) {
  const payload = {
    pw_sha256: String(hash),
    updated_at: new Date().toISOString(),
  };
  for (const p of ADMIN_AUTH_PATHS) {
    try {
      fs.mkdirSync(path.dirname(p), { recursive: true });
      fs.writeFileSync(p, JSON.stringify(payload, null, 2), 'utf8');
    } catch (e) {
      console.warn('[claude-api-proxy] admin-auth yazilamadi:', p, e.message);
    }
  }
  return payload;
}

function verifyAdminPassword(pw) {
  const plain = String(pw || '').trim();
  if (!plain) return false;
  const file = readAdminAuthFile();
  if (file) return sha256AdminPassword(plain) === file.hash;
  const expected = ADMIN_PASSWORD || (ADMIN_BEARER ? '' : ADMIN_DEV_BEARER);
  return expected && plain === expected;
}

function parseAdminBearer(req) {
  const h = req.headers.authorization || req.headers.Authorization || '';
  const m = /^Bearer\s+(.+)$/i.exec(String(h));
  return m ? m[1].trim() : '';
}

function adminBearerOk(req) {
  if (!ADMIN_BEARER) return true;
  const t = parseAdminBearer(req);
  if (t === ADMIN_BEARER) return true;
  const host = String(req.headers.host || '');
  if (
    t === ADMIN_DEV_BEARER &&
    (host.includes('localhost') || host.includes('127.0.0.1') || host.startsWith('localhost:'))
  ) {
    return true;
  }
  return false;
}

function isPublicApiPath(pathname, method) {
  if (pathname === API_PREFIX || pathname === `${API_PREFIX}/`) return true;
  if (pathname === `${API_PREFIX}/auth` || pathname.startsWith(`${API_PREFIX}/auth/`)) return true;
  if (pathname.startsWith(`${API_PREFIX}/nominatim/`)) return true;
  if (pathname.startsWith(`${API_PREFIX}/photon/`)) return true;
  if (method === 'GET' && pathname === `${API_PREFIX}/vitrin-homepage`) return true;
  if (method === 'GET' && pathname === `${API_PREFIX}/eticaret-icerik`) return true;
  if (method === 'GET' && pathname === `${API_PREFIX}/fiyatlar`) return true;
  if (method === 'POST' && pathname === `${API_PREFIX}/admin/login`) return true;
  if (method === 'POST' && pathname === `${API_PREFIX}/admin/forgot-password`) return true;
  return false;
}

function shouldRequireAdminBearer(pathname, method) {
  if (!ADMIN_BEARER) return false;
  return !isPublicApiPath(pathname, method);
}

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
const DEFAULT_ANTHROPIC_MODEL = 'claude-sonnet-4-6';
const RETIRED_ANTHROPIC_MODELS = new Set([
  'claude-3-5-sonnet-20241022',
  'claude-3-5-sonnet-20240620',
  'claude-3-7-sonnet-20250219',
]);
function resolveAnthropicModel() {
  const raw = String(process.env.ANTHROPIC_MODEL || '').trim();
  if (!raw || RETIRED_ANTHROPIC_MODELS.has(raw)) return DEFAULT_ANTHROPIC_MODEL;
  return raw;
}
const ANTHROPIC_MODEL = resolveAnthropicModel();
const IMPORT_MAX_TOKENS = Math.min(
  64000,
  Math.max(4096, Number(process.env.ANTHROPIC_IMPORT_MAX_TOKENS || 16384) || 16384),
);
/** Kurumsal proxy / antivirüs HTTPS taraması sertifikayı bozduğunda (fetch: unable to verify the first certificate) */
const ANTHROPIC_INSECURE_TLS =
  process.env.EQUSTO_ANTHROPIC_INSECURE_TLS === '1' || process.env.EQUSTO_TLS_INSECURE === '1';
if (ANTHROPIC_INSECURE_TLS) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  console.warn(
    '[claude-api-proxy] TLS: NODE_TLS_REJECT_UNAUTHORIZED=0 (yalnızca bu Node süreci; antivirüs/kurumsal SSL için).',
  );
}

let dbUrunler = [];
let dbMusteriler = [];
let dbTeklifler = [];
let dbSiparisler = [];
let dbMarkalar = [];
let dbTipSozlugu = [];
let dbFiyatlar = {};
let dbProjeAkis = { questions: [], shopTypes: [], rules: [], eqSets: [], products: [] };
let dbGeriBildirim = [];
let dbProjeler = [];
/** PFOS: lokasyon × konsept × ürün/marka seçim anlık görüntüleri (veri bankası) */
let dbPfosInsights = [];
/** Ana sayfa vitrin (Mutbex akışı) — admin + vitrin JSON */
let dbVitrinHomepage = null;
/** Admin E-Ticaret içerik: banner, kampanya, kupon (equsto_et şeması) */
let dbEticaretIcerik = { k: [], kp: [], b: [], dy: [], r: [], a: {} };
let nextId = { urun: 1, musteri: 1, teklif: 1, siparis: 1, marka: 1, geri_bildirim: 1, proje: 1, pfos_insight: 1 };
let nextSetId = 1;

function resolveDataDir() {
  const candidates = [
    process.env.EQUSTO_DATA_DIR,
    path.join(process.cwd(), 'data'),
    path.join(process.cwd(), 'scripts', 'data'),
  ].filter(Boolean);
  for (const d of candidates) {
    try {
      if (fs.existsSync(d)) return d;
    } catch (_) {}
  }
  const fallback = path.join(process.cwd(), 'data');
  fs.mkdirSync(fallback, { recursive: true });
  return fallback;
}

const STORE_DIR = resolveDataDir();
const STORE_FILE = path.join(STORE_DIR, 'equsto-store.json');

function loadStore() {
  try {
    if (!fs.existsSync(STORE_FILE)) return;
    const raw = JSON.parse(fs.readFileSync(STORE_FILE, 'utf8') || '{}');
    if (Array.isArray(raw.musteriler)) dbMusteriler = raw.musteriler;
    if (Array.isArray(raw.teklifler)) dbTeklifler = raw.teklifler;
    if (Array.isArray(raw.siparisler)) dbSiparisler = raw.siparisler;
    if (Array.isArray(raw.markalar)) dbMarkalar = raw.markalar;
    if (raw.fiyatlar && typeof raw.fiyatlar === 'object') dbFiyatlar = raw.fiyatlar;
    if (raw.projeAkis && typeof raw.projeAkis === 'object') {
      dbProjeAkis = {
        questions: Array.isArray(raw.projeAkis.questions) ? raw.projeAkis.questions : [],
        shopTypes: Array.isArray(raw.projeAkis.shopTypes) ? raw.projeAkis.shopTypes : [],
        rules: Array.isArray(raw.projeAkis.rules) ? raw.projeAkis.rules : [],
        eqSets: Array.isArray(raw.projeAkis.eqSets) ? raw.projeAkis.eqSets : [],
        products: Array.isArray(raw.projeAkis.products) ? raw.projeAkis.products : [],
      };
    }
    if (raw.nextId && typeof raw.nextId === 'object') {
      for (const k of Object.keys(nextId)) {
        if (typeof raw.nextId[k] === 'number') nextId[k] = raw.nextId[k];
      }
    }
    if (typeof raw.nextSetId === 'number') nextSetId = raw.nextSetId;
    if (Array.isArray(raw.tipSozlugu)) {
      const extra = raw.tipSozlugu.filter((t) => t && (t.kaynak === 'api' || t.kaynak === 'import'));
      for (const t of extra) {
        if (!dbTipSozlugu.find((x) => x.tip_kodu === t.tip_kodu)) dbTipSozlugu.push(t);
      }
    }
    if (Array.isArray(raw.geriBildirim)) dbGeriBildirim = raw.geriBildirim;
    if (Array.isArray(raw.projeler)) dbProjeler = raw.projeler;
    if (Array.isArray(raw.pfosInsights)) dbPfosInsights = raw.pfosInsights;
    if (raw.vitrinHomepage && typeof raw.vitrinHomepage === 'object') dbVitrinHomepage = raw.vitrinHomepage;
    if (raw.eticaretIcerik && typeof raw.eticaretIcerik === 'object') {
      dbEticaretIcerik = {
        k: Array.isArray(raw.eticaretIcerik.k) ? raw.eticaretIcerik.k : [],
        kp: Array.isArray(raw.eticaretIcerik.kp) ? raw.eticaretIcerik.kp : [],
        b: Array.isArray(raw.eticaretIcerik.b) ? raw.eticaretIcerik.b : [],
        dy: Array.isArray(raw.eticaretIcerik.dy) ? raw.eticaretIcerik.dy : [],
        r: Array.isArray(raw.eticaretIcerik.r) ? raw.eticaretIcerik.r : [],
        a: raw.eticaretIcerik.a && typeof raw.eticaretIcerik.a === 'object' ? raw.eticaretIcerik.a : {},
      };
    }
    console.log(
      `[claude-api-proxy] store yüklendi: musteri=${dbMusteriler.length} teklif=${dbTeklifler.length} ` +
        `siparis=${dbSiparisler.length} marka=${dbMarkalar.length} fiyat=${Object.keys(dbFiyatlar).length} ` +
        `proje-akis: q=${dbProjeAkis.questions.length} r=${dbProjeAkis.rules.length} s=${dbProjeAkis.eqSets.length} ` +
        `corpus: projeler=${dbProjeler.length} pfos-insights=${dbPfosInsights.length}`,
    );
    exportFiyatlarPublic();
  } catch (e) {
    console.warn('[claude-api-proxy] store okunamadı:', e && e.message ? e.message : e);
  }
}

function exportFiyatlarPublic() {
  const payload = JSON.stringify(
    { success: true, data: dbFiyatlar, updated_at: new Date().toISOString() },
    null,
    0,
  );
  for (const rel of ['public/data/fiyatlar.json', 'dist/data/fiyatlar.json']) {
    try {
      const p = path.join(process.cwd(), rel);
      fs.mkdirSync(path.dirname(p), { recursive: true });
      fs.writeFileSync(p, payload, 'utf8');
    } catch (e) {
      console.warn('[claude-api-proxy] fiyatlar.json yazılamadı:', rel, e?.message || e);
    }
  }
}

let __saveTimer = null;
function saveStore() {
  if (__saveTimer) return;
  __saveTimer = setTimeout(() => {
    __saveTimer = null;
    try {
      if (!fs.existsSync(STORE_DIR)) fs.mkdirSync(STORE_DIR, { recursive: true });
      const data = {
        musteriler: dbMusteriler,
        teklifler: dbTeklifler,
        siparisler: dbSiparisler,
        markalar: dbMarkalar,
        fiyatlar: dbFiyatlar,
        tipSozlugu: dbTipSozlugu.filter((t) => t && (t.kaynak === 'api' || t.kaynak === 'import')),
        projeAkis: dbProjeAkis,
        geriBildirim: dbGeriBildirim,
        projeler: dbProjeler,
        pfosInsights: dbPfosInsights,
        vitrinHomepage: dbVitrinHomepage,
        eticaretIcerik: dbEticaretIcerik,
        nextId,
        nextSetId,
        saved_at: new Date().toISOString(),
      };
      const tmp = STORE_FILE + '.tmp';
      fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
      fs.renameSync(tmp, STORE_FILE);
      exportFiyatlarPublic();
    } catch (e) {
      console.warn('[claude-api-proxy] store yazılamadı:', e && e.message ? e.message : e);
    }
  }, 200);
}

function getEkipmanlarPath() {
  const envPath = String(process.env.EQUSTO_EKIPMANLAR_PATH || '').trim();
  const candidates = [
    envPath,
    path.join(process.cwd(), 'public', 'data', 'ekipmanlar.json'),
    path.join(process.cwd(), 'data', 'ekipmanlar.json'),
    path.join(process.cwd(), '..', 'public_html', 'data', 'ekipmanlar.json'),
  ].filter(Boolean);
  return candidates.find((p) => fs.existsSync(p)) || candidates[0];
}

function readEkipmanlarArray() {
  const p = getEkipmanlarPath();
  if (!fs.existsSync(p)) return [];
  const raw = JSON.parse(fs.readFileSync(p, 'utf8'));
  if (Array.isArray(raw)) return raw;
  if (raw && Array.isArray(raw.items)) return raw.items;
  return [];
}

function writeEkipmanlarArray(arr) {
  const p = getEkipmanlarPath();
  fs.mkdirSync(path.dirname(p), { recursive: true });
  let payload;
  if (fs.existsSync(p)) {
    try {
      const raw = JSON.parse(fs.readFileSync(p, 'utf8'));
      if (raw && !Array.isArray(raw) && Array.isArray(raw.items)) {
        payload = JSON.stringify({ ...raw, items: arr });
      } else {
        payload = JSON.stringify(arr);
      }
    } catch (_) {
      payload = JSON.stringify(arr);
    }
  } else {
    payload = JSON.stringify(arr);
  }
  const tmp = p + '.tmp';
  fs.writeFileSync(tmp, payload, 'utf8');
  fs.renameSync(tmp, p);
}

function loadEkipmanlar() {
  const p = getEkipmanlarPath();
  if (!fs.existsSync(p)) {
    console.warn('[claude-api-proxy] ekipmanlar.json bulunamadı, boş başlıyor');
    return;
  }
  try {
    const rows = readEkipmanlarArray();
    dbUrunler = rows.map((x, i) => ({
        id: i + 1,
        ad: x.name || x.ad || '',
        tip_kodu: x.tip_kodu || '',
        kategori: x.category || x.kategori || '',
        marka_id: x.brand || x.marka_id || '',
        marka_ad: x.brand || x.marka_ad || '',
        model: x.model || '',
        sku: x.sku || `EQ-${String(i + 1).padStart(5, '0')}`,
        stok: x.stok ?? 1,
        fiyat_tl:
          x.fiyat_tl != null && Number(x.fiyat_tl) > 0
            ? Number(x.fiyat_tl)
            : parsePriceTLFromCatalog(x.price),
        el_guc: x.el_guc || '',
        gaz_guc: x.gaz_guc || '',
        aciklama: String(x.specs != null ? x.specs : x.aciklama != null ? x.aciklama : '')
          .replace(/[\r\n]+/g, ' ')
          .trim()
          .slice(0, 500),
        gorsel_url: Array.isArray(x.images) ? (x.images[0] || '') : (x.gorsel_url || ''),
        durum: 'aktif',
        proje_fab_aktif: false,
      }));
      nextId.urun = dbUrunler.length + 1;
      dbTipSozlugu = rebuildTipSozluguFromUrunler();
    console.log(`[claude-api-proxy] ekipmanlar.json yüklendi: ${dbUrunler.length} ürün (${p})`);
  } catch (e) {
    console.warn('[claude-api-proxy] ekipmanlar.json okunamadı:', e.message);
  }
}
loadEkipmanlar();
loadStore();

const SERVER_STARTED = Date.now();

function fileStatSafe(p) {
  try {
    if (!fs.existsSync(p)) return { path: p, exists: false };
    const st = fs.statSync(p);
    return {
      path: p,
      exists: true,
      size_bytes: st.size,
      mtime: st.mtime.toISOString(),
    };
  } catch (e) {
    return { path: p, exists: false, error: e && e.message ? e.message : String(e) };
  }
}

async function probePostgres() {
  const hasUrl = !!(process.env.DATABASE_URL || process.env.PGHOST);
  if (!hasUrl) {
    return {
      configured: false,
      connected: null,
      ping_ms: null,
      database: null,
      note: 'Canlı veri JSON deposundan; PostgreSQL yalnızca export script için (.env).',
    };
  }
  const t0 = performance.now();
  try {
    const pgMod = await import('pg');
    const Pool = pgMod.default?.Pool || pgMod.Pool;
    const cfg = process.env.DATABASE_URL
      ? { connectionString: process.env.DATABASE_URL }
      : {
          host: process.env.PGHOST || '127.0.0.1',
          port: Number(process.env.PGPORT || 5432),
          user: process.env.PGUSER || 'postgres',
          password: process.env.PGPASSWORD || '',
          database: process.env.PGDATABASE || 'equsto',
        };
    const pool = new Pool({ ...cfg, max: 1, connectionTimeoutMillis: 2500, idleTimeoutMillis: 1000 });
    await pool.query('SELECT 1 AS ok');
    await pool.end();
    const ping = Math.round(performance.now() - t0);
    const dbName = cfg.database || (cfg.connectionString ? '(connectionString)' : '?');
    return {
      configured: true,
      connected: true,
      ping_ms: ping,
      database: dbName,
      note: 'İsteğe bağlı; admin verisi JSON deposunda tutulur.',
    };
  } catch (e) {
    return {
      configured: true,
      connected: false,
      ping_ms: Math.round(performance.now() - t0),
      database: process.env.PGDATABASE || 'equsto',
      error: e && e.message ? e.message : String(e),
      note: 'PostgreSQL yapılandırılmış ama bağlantı başarısız.',
    };
  }
}

async function collectAdminPerf() {
  const t0 = performance.now();
  let storeReadMs = null;
  let savedAt = null;
  try {
    const rt0 = performance.now();
    if (fs.existsSync(STORE_FILE)) {
      const raw = JSON.parse(fs.readFileSync(STORE_FILE, 'utf8') || '{}');
      savedAt = raw.saved_at || null;
    }
    storeReadMs = Math.round((performance.now() - rt0) * 10) / 10;
  } catch (_) {
    storeReadMs = null;
  }

  const ekipmanPaths = [
    path.join(process.cwd(), 'public', 'data', 'ekipmanlar.json'),
    path.join(process.cwd(), 'data', 'ekipmanlar.json'),
  ];
  const ekipmanPath = ekipmanPaths.find((p) => fs.existsSync(p)) || ekipmanPaths[0];

  const files = [
    { key: 'store', label: 'equsto-store.json', ...fileStatSafe(STORE_FILE) },
    { key: 'ekipmanlar', label: 'ekipmanlar.json', ...fileStatSafe(ekipmanPath) },
    {
      key: 'fiyatlar',
      label: 'fiyatlar.json',
      ...fileStatSafe(path.join(process.cwd(), 'public', 'data', 'fiyatlar.json')),
    },
  ];

  const mem = process.memoryUsage();
  const sampleT0 = performance.now();
  const _touch = dbUrunler.length + dbMusteriler.length + dbTeklifler.length;
  const sampleQueryMs = Math.round((performance.now() - sampleT0) * 100) / 100;
  void _touch;

  const postgres = await probePostgres();

  return {
    engine: 'json-store',
    engine_label: 'JSON dosya deposu (bellek + equsto-store.json)',
    generated_at: new Date().toISOString(),
    build: API_BUILD,
    uptime_sec: Math.round((Date.now() - SERVER_STARTED) / 1000),
    memory_mb: Math.round((mem.rss / 1024 / 1024) * 10) / 10,
    store_dir: STORE_DIR,
    store_read_ms: storeReadMs,
    saved_at: savedAt,
    files,
    counts: {
      urunler: dbUrunler.length,
      musteriler: dbMusteriler.length,
      teklifler: dbTeklifler.length,
      siparisler: dbSiparisler.length,
      markalar: dbMarkalar.length,
      fiyatlar: Object.keys(dbFiyatlar).length,
      proje_akis_urun: dbProjeAkis.products?.length || 0,
      proje_akis_kural: dbProjeAkis.rules?.length || 0,
      projeler: dbProjeler.length,
      pfos_insights: dbPfosInsights.length,
      geri_bildirim: dbGeriBildirim.length,
      tip_sozlugu: dbTipSozlugu.length,
    },
    latency_ms: {
      store_file_read: storeReadMs,
      memory_sample: sampleQueryMs,
      total_collect: Math.round((performance.now() - t0) * 10) / 10,
    },
    postgres,
    anthropic_key_set: !!ANTHROPIC_API_KEY,
  };
}

/** Ürün kaydında tip_kodu + fiyat_tl varsa liste fiyatı haritasına yansıt */
function syncFiyatFromUrun(urun) {
  const tip = String((urun && urun.tip_kodu) || '').trim();
  const fv = Number(urun && urun.fiyat_tl);
  if (!tip || !Number.isFinite(fv) || fv <= 0) return;
  dbFiyatlar[tip] = fv;
}

function rebuildTipSozluguFromUrunler() {
  const byTip = new Map();
  for (const u of dbUrunler) {
    const k = String(u.tip_kodu || '').trim();
    if (!k) continue;
    if (!byTip.has(k)) {
      byTip.set(k, {
        tip_kodu: k,
        aciklama: u.ad || k,
        kategori: u.kategori || 'diger',
        kaynak: 'katalog',
        frekans: 1,
      });
    } else {
      byTip.get(k).frekans += 1;
    }
  }
  return [...byTip.values()];
}

function sendJson(res, status, obj) {
  let body;
  try {
    body = JSON.stringify(obj, (_k, v) => (typeof v === 'bigint' ? v.toString() : v));
  } catch (e) {
    const msg = e && e.message ? e.message : String(e);
    console.error('[claude-api-proxy] JSON.stringify hatası:', msg);
    res.writeHead(500, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    });
    res.end(JSON.stringify({ success: false, error: 'Yanıt serileştirilemedi: ' + msg }));
    return;
  }
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  });
  res.end(body);
}

function sendOptions(res) {
  res.writeHead(204, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Max-Age': '86400',
  });
  res.end();
}

function readBody(req, maxBytes = 20 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on('data', (c) => {
      const buf = Buffer.isBuffer(c) ? c : Buffer.from(c);
      total += buf.length;
      if (total > maxBytes) {
        reject(new Error('REQUEST_BODY_TOO_LARGE'));
        return;
      }
      chunks.push(buf);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function parseBody(raw) {
  const s = Buffer.isBuffer(raw) ? raw.toString('utf8') : (raw || '');
  try {
    return s ? JSON.parse(s) : {};
  } catch (_) {
    return null;
  }
}

const ANTHROPIC_REQ_MS = Math.min(900000, Math.max(120000, Number(process.env.EQUSTO_ANTHROPIC_TIMEOUT_MS || 600000) || 600000));
const ANTHROPIC_WRITE_CHUNK = 2 * 1024 * 1024;

/** Yerleşik fetch Node bazı sürümlerde node:undici ister; Anthropic için yalnızca https kullanıyoruz. */
function anthropicHttpsPost(bodyStr, insecureTls) {
  const u = new URL('https://api.anthropic.com/v1/messages');
  const headers = {
    'content-type': 'application/json',
    'x-api-key': ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01',
    'content-length': Buffer.byteLength(bodyStr, 'utf8'),
  };
  const agent = insecureTls ? new https.Agent({ rejectUnauthorized: false }) : undefined;
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: u.hostname,
        port: 443,
        path: u.pathname,
        method: 'POST',
        headers,
        agent,
      },
      (res) => {
        res.on('error', reject);
        const chunks = [];
        res.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8');
          resolve({ statusCode: res.statusCode || 0, text });
        });
      },
    );
    req.on('error', reject);
    req.setTimeout(ANTHROPIC_REQ_MS, () => {
      req.destroy(new Error(`Anthropic isteği zaman aşımı (${Math.round(ANTHROPIC_REQ_MS / 1000)} sn)`));
    });

    let offset = 0;
    function writeNext() {
      if (offset >= bodyStr.length) {
        req.end();
        return;
      }
      const end = Math.min(offset + ANTHROPIC_WRITE_CHUNK, bodyStr.length);
      const slice = bodyStr.slice(offset, end);
      offset = end;
      const ok = req.write(slice, 'utf8');
      if (offset >= bodyStr.length) {
        if (!ok) req.once('drain', () => req.end());
        else req.end();
        return;
      }
      if (!ok) req.once('drain', writeNext);
      else writeNext();
    }
    writeNext();
  });
}

async function anthropicMessagesCreate(payload) {
  if (!ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY eksik (.env dosyasına ekleyin)');

  let bodyStr;
  try {
    bodyStr = JSON.stringify(payload);
  } catch (e) {
    const m = e && e.message ? e.message : String(e);
    throw new Error(`İstek gövdesi oluşturulamadı (PDF çok büyük / bellek): ${m}`);
  }

  function isTlsFail(e) {
    const cause = e && e.cause ? String(e.cause.message || e.cause) : '';
    const all = `${e && e.message ? e.message : ''} ${cause}`;
    return /certificate|verify|TLS|SSL|UNABLE_TO_VERIFY|unable to verify/i.test(all);
  }

  let insecure = ANTHROPIC_INSECURE_TLS;
  let r;
  try {
    r = await anthropicHttpsPost(bodyStr, insecure);
  } catch (e) {
    if (!insecure && isTlsFail(e)) {
      console.warn(
        '[claude-api-proxy] TLS başarısız — gevşek TLS ile bir kez yeniden deneniyor. Kalıcı: .env EQUSTO_ANTHROPIC_INSECURE_TLS=1',
      );
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
      insecure = true;
      r = await anthropicHttpsPost(bodyStr, true);
    } else {
      const cause = e && e.cause ? String(e.cause.message || e.cause) : '';
      const detail = `${e.message || String(e)}` + (cause ? ` (${cause})` : '');
      let hint = '';
      if (isTlsFail(e)) {
        hint =
          ' Kurumsal ağ veya antivirüs. .env: EQUSTO_ANTHROPIC_INSECURE_TLS=1 sonra npm run api yeniden başlatın.';
      }
      throw new Error(`Anthropic ağına bağlanılamadı: ${detail}.${hint}`);
    }
  }

  const { statusCode, text } = r;
  if (statusCode < 200 || statusCode >= 300) {
    throw new Error(`Anthropic HTTP ${statusCode}: ${text.slice(0, 800)}`);
  }
  try {
    return JSON.parse(text);
  } catch (_) {
    throw new Error(`Anthropic yanıtı JSON değil (HTTP ${statusCode}). Başlangıç: ${text.slice(0, 400)}`);
  }
}

function extractTextFromClaude(resp) {
  const blocks = resp && Array.isArray(resp.content) ? resp.content : [];
  return blocks
    .filter((b) => b && b.type === 'text' && typeof b.text === 'string')
    .map((b) => b.text)
    .join('\n')
    .trim();
}

function tryParseJsonArray(text) {
  if (!text) return null;
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start >= 0 && end > start) {
    try {
      const j = JSON.parse(text.slice(start, end + 1));
      return Array.isArray(j) ? j : null;
    } catch (_) {
      return null;
    }
  }
  return null;
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') return sendOptions(res);

    const url = req.url || '';
    const pathname = normalizePathname(url.split('?')[0] || url);
    const method = req.method;

    if (method === 'GET' && (pathname === API_PREFIX || pathname === `${API_PREFIX}/`)) {
      return sendJson(res, 200, {
        success: true,
        service: 'equsto-claude-api-proxy',
        build: API_BUILD,
        auth: 'GET /api/auth/config, POST /api/auth/login, /register, /google, /apple',
        try: 'GET /api/urunler, GET /api/admin/perf, GET /api/nominatim/search (cadde proxy)',
        admin: 'http://127.0.0.1:5173/admin.html (npm run dev ile; port Vite çıktısına göre değişebilir)',
        admin_bearer: ADMIN_BEARER ? 'required' : 'optional',
      });
    }

    if (shouldRequireAdminBearer(pathname, method) && !adminBearerOk(req)) {
      return sendJson(res, 401, { success: false, error: 'Yetkisiz erişim' });
    }

    if (method === 'POST' && pathname === `${API_PREFIX}/admin/login`) {
      const body = parseBody(await readBody(req));
      const pw = String((body && body.password) || '').trim();
      if (!verifyAdminPassword(pw)) {
        return sendJson(res, 401, { success: false, error: 'Şifre hatalı' });
      }
      const token = ADMIN_BEARER || ADMIN_DEV_BEARER;
      return sendJson(res, 200, { success: true, token });
    }

    if (method === 'POST' && pathname === `${API_PREFIX}/admin/forgot-password`) {
      const body = parseBody(await readBody(req));
      const code = String((body && body.recovery_code) || '').trim();
      const pw = String((body && body.password) || '').trim();
      const pw2 = String((body && body.password_confirm) || '').trim();
      if (!ADMIN_RECOVERY_CODE) {
        return sendJson(res, 503, {
          success: false,
          error: 'Kurtarma kodu sunucuda tanımlı değil (EQUSTO_ADMIN_RECOVERY_CODE)',
        });
      }
      if (code !== ADMIN_RECOVERY_CODE) {
        return sendJson(res, 401, { success: false, error: 'Kurtarma kodu hatalı' });
      }
      if (!pw || pw.length < 8) {
        return sendJson(res, 400, {
          success: false,
          error: 'Yeni şifre en az 8 karakter olmalı',
        });
      }
      if (pw !== pw2) {
        return sendJson(res, 400, { success: false, error: 'Şifreler eşleşmiyor' });
      }
      const hash = sha256AdminPassword(pw);
      writeAdminAuthFile(hash);
      const token = ADMIN_BEARER || ADMIN_DEV_BEARER;
      return sendJson(res, 200, {
        success: true,
        token,
        pw_sha256: hash,
        message: 'Şifre güncellendi. Yeni şifre ile giriş yapabilirsiniz.',
      });
    }

    if (method === 'GET' && pathname === `${API_PREFIX}/admin/perf`) {
      const data = await collectAdminPerf();
      return sendJson(res, 200, { success: true, data });
    }

    if (method === 'GET' && pathname === `${API_PREFIX}/urunler`) {
      return sendJson(res, 200, { success: true, data: dbUrunler });
    }

    if (method === 'POST' && pathname === `${API_PREFIX}/urunler`) {
      const body = parseBody(await readBody(req));
      if (!body) return sendJson(res, 400, { success: false, error: 'Invalid JSON' });
      const urun = { id: nextId.urun++, durum: 'aktif', ...body };
      dbUrunler.push(urun);
      syncFiyatFromUrun(urun);
      saveStore();
      return sendJson(res, 201, { success: true, data: urun });
    }

    if (method === 'PUT' && pathname.startsWith(`${API_PREFIX}/urunler/`)) {
      const id = Number(pathname.split('/').pop());
      if (!Number.isFinite(id)) return sendJson(res, 400, { success: false, error: 'invalid id' });
      const body = parseBody(await readBody(req));
      if (!body) return sendJson(res, 400, { success: false, error: 'Invalid JSON' });
      const idx = dbUrunler.findIndex((u) => u.id === id);
      if (idx < 0) return sendJson(res, 404, { success: false, error: 'urun bulunamadi' });
      const prev = dbUrunler[idx];
      const urun = {
        ...prev,
        ...body,
        id: prev.id,
        ad: body.ad != null ? body.ad : prev.ad,
        fiyat_tl:
          body.fiyat_tl != null ? Number(body.fiyat_tl) || 0 : prev.fiyat_tl,
        tip_kodu: body.tip_kodu != null ? String(body.tip_kodu).trim() : prev.tip_kodu,
      };
      dbUrunler[idx] = urun;
      syncFiyatFromUrun(urun);
      saveStore();
      return sendJson(res, 200, { success: true, data: urun });
    }

    if (method === 'POST' && pathname === `${API_PREFIX}/urunler/bulk`) {
      const body = parseBody(await readBody(req));
      if (!body || !Array.isArray(body.data)) return sendJson(res, 400, { success: false, error: 'data[] required' });
      const added = body.data.map((u) => ({ id: nextId.urun++, durum: 'aktif', ...u }));
      dbUrunler.push(...added);
      saveStore();
      return sendJson(res, 201, { success: true, count: added.length });
    }

    if (method === 'DELETE' && pathname.startsWith(`${API_PREFIX}/urunler/katalog/`)) {
      const index = parseInt(pathname.slice(`${API_PREFIX}/urunler/katalog/`.length), 10);
      if (!Number.isInteger(index) || index < 0) {
        return sendJson(res, 400, { success: false, error: 'Geçersiz katalog indeksi' });
      }
      const arr = readEkipmanlarArray();
      if (index >= arr.length) {
        return sendJson(res, 404, { success: false, error: 'Katalog indeksi aralık dışı' });
      }
      arr.splice(index, 1);
      writeEkipmanlarArray(arr);
      loadEkipmanlar();
      return sendJson(res, 200, { success: true, deleted: 1, index, remaining: arr.length });
    }

    if (method === 'DELETE' && url.startsWith(`${API_PREFIX}/urunler/`)) {
      const id = parseInt(url.split('/').pop(), 10);
      const before = dbUrunler.length;
      dbUrunler = dbUrunler.filter((u) => u.id !== id);
      saveStore();
      return sendJson(res, 200, { success: true, deleted: before - dbUrunler.length });
    }

    if (method === 'GET' && pathname === `${API_PREFIX}/musteriler`) {
      return sendJson(res, 200, { success: true, data: dbMusteriler });
    }

    if (method === 'POST' && pathname === `${API_PREFIX}/musteriler`) {
      const body = parseBody(await readBody(req));
      if (!body) return sendJson(res, 400, { success: false, error: 'Invalid JSON' });
      const m = { id: nextId.musteri++, created_at: new Date().toISOString(), ...body };
      dbMusteriler.push(m);
      saveStore();
      return sendJson(res, 201, { success: true, data: m });
    }

    if (method === 'GET' && pathname === `${API_PREFIX}/teklifler`) {
      return sendJson(res, 200, { success: true, data: dbTeklifler });
    }

    if (method === 'POST' && pathname === `${API_PREFIX}/teklifler`) {
      const body = parseBody(await readBody(req));
      if (!body) return sendJson(res, 400, { success: false, error: 'Invalid JSON' });
      const t = {
        id: nextId.teklif++,
        ref_no: `TKL-${String(nextId.teklif).padStart(4, '0')}`,
        created_at: new Date().toISOString(),
        durum: 'taslak',
        ...body,
      };
      dbTeklifler.push(t);
      if (body.veri_bankasi && typeof body.veri_bankasi === 'object') {
        dbPfosInsights.push({
          id: nextId.pfos_insight++,
          created_at: t.created_at,
          olay: 'teklif_gonder',
          teklif_ref: t.ref_no,
          ...body.veri_bankasi,
        });
      }
      saveStore();
      return sendJson(res, 201, { success: true, data: t });
    }

    if (method === 'GET' && pathname === `${API_PREFIX}/pfos-insights`) {
      const limit = Math.min(500, Math.max(1, parseInt(new URL(req.url, 'http://x').searchParams.get('limit') || '100', 10) || 100));
      const data = dbPfosInsights.slice(-limit).reverse();
      return sendJson(res, 200, { success: true, count: data.length, data });
    }

    if (method === 'POST' && pathname === `${API_PREFIX}/pfos-insights`) {
      const body = parseBody(await readBody(req));
      if (!body || typeof body !== 'object') {
        return sendJson(res, 400, { success: false, error: 'Invalid JSON' });
      }
      const lok = body.lokasyon && typeof body.lokasyon === 'object' ? body.lokasyon : {};
      if (!String(lok.sehir || '').trim()) {
        return sendJson(res, 400, { success: false, error: 'lokasyon.sehir gerekli' });
      }
      const row = {
        id: nextId.pfos_insight++,
        created_at: new Date().toISOString(),
        ...body,
      };
      dbPfosInsights.push(row);
      if (dbPfosInsights.length > 8000) dbPfosInsights = dbPfosInsights.slice(-6000);
      saveStore();
      return sendJson(res, 201, { success: true, data: { id: row.id } });
    }

    if (method === 'GET' && pathname === `${API_PREFIX}/nominatim/search`) {
      const u = new URL(req.url || '', 'http://127.0.0.1');
      const qs = u.search || '';
      const target = `https://nominatim.openstreetmap.org/search${qs}`;
      try {
        const upstream = await fetch(target, {
          headers: {
            'User-Agent': 'Equsto/1.0 (PFOS cadde; https://equsto.com)',
            'Accept-Language': req.headers['accept-language'] || 'tr-TR,tr;q=0.9',
          },
        });
        const text = await upstream.text();
        res.writeHead(upstream.status, {
          'Content-Type': upstream.headers.get('content-type') || 'application/json',
          'Access-Control-Allow-Origin': '*',
        });
        res.end(text);
        return;
      } catch (e) {
        return sendJson(res, 502, {
          success: false,
          error: 'Nominatim proxy hatası: ' + (e && e.message ? e.message : String(e)),
        });
      }
    }

    if (method === 'GET' && pathname === `${API_PREFIX}/photon/api`) {
      const u = new URL(req.url || '', 'http://127.0.0.1');
      const qs = u.search || '';
      const target = `https://photon.komoot.io/api/${qs}`;
      try {
        const upstream = await fetch(target, {
          headers: {
            'Accept-Language': req.headers['accept-language'] || 'tr-TR,tr;q=0.9',
          },
        });
        const text = await upstream.text();
        res.writeHead(upstream.status, {
          'Content-Type': upstream.headers.get('content-type') || 'application/json',
          'Access-Control-Allow-Origin': '*',
        });
        res.end(text);
        return;
      } catch (e) {
        return sendJson(res, 502, {
          success: false,
          error: 'Photon proxy hatası: ' + (e && e.message ? e.message : String(e)),
        });
      }
    }

    if (method === 'PUT' && url.startsWith(`${API_PREFIX}/teklifler/`)) {
      const id = parseInt(url.split('/').pop(), 10);
      const body = parseBody(await readBody(req));
      const idx = dbTeklifler.findIndex((t) => t.id === id);
      if (idx === -1) return sendJson(res, 404, { success: false, error: 'Not found' });
      dbTeklifler[idx] = { ...dbTeklifler[idx], ...body };
      saveStore();
      return sendJson(res, 200, { success: true, data: dbTeklifler[idx] });
    }

    if (method === 'GET' && pathname === `${API_PREFIX}/siparisler`) {
      return sendJson(res, 200, { success: true, data: dbSiparisler });
    }

    if (method === 'POST' && pathname === `${API_PREFIX}/siparisler`) {
      const body = parseBody(await readBody(req));
      if (!body) return sendJson(res, 400, { success: false, error: 'Invalid JSON' });
      const s = {
        id: nextId.siparis++,
        siparis_no: `SIP-${String(nextId.siparis).padStart(4, '0')}`,
        created_at: new Date().toISOString(),
        durum: 'bekliyor',
        ...body,
      };
      dbSiparisler.push(s);
      saveStore();
      return sendJson(res, 201, { success: true, data: s });
    }

    if (method === 'GET' && pathname === `${API_PREFIX}/fiyatlar`) {
      return sendJson(res, 200, { success: true, data: dbFiyatlar });
    }

    if (method === 'POST' && pathname === `${API_PREFIX}/fiyatlar`) {
      const body = parseBody(await readBody(req));
      if (!body) return sendJson(res, 400, { success: false, error: 'Invalid JSON' });
      const map = body.fiyatlar && typeof body.fiyatlar === 'object' ? body.fiyatlar : body;
      const next = {};
      for (const k of Object.keys(map || {})) {
        const v = Number(map[k]);
        if (Number.isFinite(v) && v > 0) next[String(k).trim()] = v;
      }
      dbFiyatlar = next;
      saveStore();
      return sendJson(res, 200, { success: true, count: Object.keys(dbFiyatlar).length });
    }

    if (method === 'PUT' && pathname.startsWith(`${API_PREFIX}/fiyatlar/`)) {
      const k = decodeURIComponent(pathname.split('/').pop() || '').trim();
      if (!k) return sendJson(res, 400, { success: false, error: 'tip_kodu gerekli' });
      const body = parseBody(await readBody(req));
      const v = Number(body && (body.liste ?? body.value ?? body.fiyat));
      if (!Number.isFinite(v) || v <= 0) {
        delete dbFiyatlar[k];
        saveStore();
        return sendJson(res, 200, { success: true, deleted: true, tip_kodu: k });
      }
      dbFiyatlar[k] = v;
      saveStore();
      return sendJson(res, 200, { success: true, tip_kodu: k, liste: v });
    }

    if (method === 'DELETE' && pathname.startsWith(`${API_PREFIX}/fiyatlar/`)) {
      const k = decodeURIComponent(pathname.split('/').pop() || '').trim();
      if (!k) return sendJson(res, 400, { success: false, error: 'tip_kodu gerekli' });
      const existed = Object.prototype.hasOwnProperty.call(dbFiyatlar, k);
      delete dbFiyatlar[k];
      saveStore();
      return sendJson(res, 200, { success: true, deleted: existed });
    }

    if (method === 'GET' && pathname === `${API_PREFIX}/eticaret-icerik`) {
      return sendJson(res, 200, { success: true, data: dbEticaretIcerik });
    }

    if (method === 'POST' && pathname === `${API_PREFIX}/eticaret-icerik`) {
      const body = parseBody(await readBody(req));
      if (!body || typeof body !== 'object') {
        return sendJson(res, 400, { success: false, error: 'Invalid JSON' });
      }
      dbEticaretIcerik = {
        k: Array.isArray(body.k) ? body.k : [],
        kp: Array.isArray(body.kp) ? body.kp : [],
        b: Array.isArray(body.b) ? body.b : [],
        dy: Array.isArray(body.dy) ? body.dy : [],
        r: Array.isArray(body.r) ? body.r : [],
        a: body.a && typeof body.a === 'object' ? body.a : {},
      };
      saveStore();
      return sendJson(res, 200, {
        success: true,
        counts: {
          kampanya: dbEticaretIcerik.k.length,
          banner: dbEticaretIcerik.b.length,
        },
      });
    }

    if (method === 'GET' && pathname === `${API_PREFIX}/vitrin-homepage`) {
      if (!dbVitrinHomepage) {
        const fallback = path.join(process.cwd(), 'public', 'data', 'homepage-vitrin.json');
        try {
          if (fs.existsSync(fallback)) {
            dbVitrinHomepage = JSON.parse(fs.readFileSync(fallback, 'utf8'));
          }
        } catch (_) {}
      }
      return sendJson(res, 200, { success: true, data: dbVitrinHomepage || {} });
    }

    if (method === 'POST' && pathname === `${API_PREFIX}/vitrin-homepage`) {
      const body = parseBody(await readBody(req));
      if (!body || typeof body !== 'object') {
        return sendJson(res, 400, { success: false, error: 'Invalid JSON' });
      }
      dbVitrinHomepage = body;
      dbVitrinHomepage.updated = new Date().toISOString().slice(0, 10);
      saveStore();
      try {
        const out = path.join(process.cwd(), 'public', 'data', 'homepage-vitrin.json');
        fs.writeFileSync(out, JSON.stringify(dbVitrinHomepage, null, 2), 'utf8');
      } catch (e) {
        console.warn('[claude-api-proxy] vitrin json yazılamadı:', e && e.message ? e.message : e);
      }
      return sendJson(res, 200, { success: true, updated: dbVitrinHomepage.updated });
    }

    if (method === 'GET' && pathname === `${API_PREFIX}/proje-akis`) {
      return sendJson(res, 200, { success: true, data: { ...dbProjeAkis, projeler: dbProjeler } });
    }

    if (method === 'POST' && pathname === `${API_PREFIX}/proje-akis`) {
      const body = parseBody(await readBody(req));
      if (!body) return sendJson(res, 400, { success: false, error: 'Invalid JSON' });
      dbProjeAkis = {
        questions: Array.isArray(body.questions) ? body.questions : (dbProjeAkis.questions || []),
        shopTypes: Array.isArray(body.shopTypes) ? body.shopTypes : (dbProjeAkis.shopTypes || []),
        rules: Array.isArray(body.rules) ? body.rules : (dbProjeAkis.rules || []),
        eqSets: Array.isArray(body.eqSets) ? body.eqSets : (dbProjeAkis.eqSets || []),
        products: Array.isArray(body.products) ? body.products : (dbProjeAkis.products || []),
      };
      saveStore();
      return sendJson(res, 200, {
        success: true,
        counts: {
          questions: dbProjeAkis.questions.length,
          shopTypes: dbProjeAkis.shopTypes.length,
          rules: dbProjeAkis.rules.length,
          eqSets: dbProjeAkis.eqSets.length,
          products: dbProjeAkis.products.length,
        },
      });
    }

    // ── Corpus: yüklenen proje listeleri (öğrenen ekipman motoru) ─────────────
    if (method === 'GET' && pathname === `${API_PREFIX}/projeler`) {
      return sendJson(res, 200, { success: true, data: dbProjeler });
    }

    if (method === 'POST' && pathname === `${API_PREFIX}/projeler`) {
      const body = parseBody(await readBody(req));
      if (!body) return sendJson(res, 400, { success: false, error: 'Invalid JSON' });
      const context = body.context && typeof body.context === 'object' ? body.context : null;
      const equipment = Array.isArray(body.equipment) ? body.equipment : null;
      if (!context || !equipment || !equipment.length) {
        return sendJson(res, 400, { success: false, error: 'context (object) ve equipment ([]) zorunlu' });
      }
      const item = {
        id: nextId.proje++,
        context: {
          konsept: String(context.konsept || ''),
          dukkan: String(context.dukkan || ''),
          alt_tip: String(context.alt_tip || ''),
          alan_m2: Number(context.alan_m2) || 0,
          m2_mutfak: Number(context.m2_mutfak) || 0,
          m2_yikama: Number(context.m2_yikama) || 0,
          m2_depo: Number(context.m2_depo) || 0,
          gunluk_kapak: Number(context.gunluk_kapak) || 0,
          pisir: Array.isArray(context.pisir) ? context.pisir : [],
          menu: Array.isArray(context.menu) ? context.menu : [],
          altyapi: Array.isArray(context.altyapi) ? context.altyapi : [],
          lokasyon: String(context.lokasyon || ''),
          sehir: String(context.sehir || ''),
          meslek: String(context.meslek || ''),
        },
        equipment: equipment.map((e) => ({
          tip_kodu: String(e.tip_kodu || ''),
          ad: String(e.ad || e.aciklama || ''),
          kategori: String(e.kategori || 'diger'),
          adet: Number(e.adet) || 1,
          birim_tl: Number(e.birim_tl) || 0,
          marka: String(e.marka || ''),
          model: String(e.model || ''),
        })).filter((e) => e.tip_kodu),
        kaynak: String(body.kaynak || 'pdf-import'),
        source_file: String(body.source_file || ''),
        created_at: new Date().toISOString(),
      };
      if (!item.equipment.length) {
        return sendJson(res, 400, { success: false, error: 'tip_kodu içeren en az 1 ekipman gerekli' });
      }
      dbProjeler.push(item);
      saveStore();
      return sendJson(res, 201, { success: true, data: { id: item.id, equipment_count: item.equipment.length } });
    }

    if (method === 'DELETE' && pathname.startsWith(`${API_PREFIX}/projeler/`)) {
      const id = Number(pathname.split('/').pop());
      if (!Number.isFinite(id)) return sendJson(res, 400, { success: false, error: 'invalid id' });
      const before = dbProjeler.length;
      dbProjeler = dbProjeler.filter((p) => p.id !== id);
      saveStore();
      return sendJson(res, 200, { success: true, deleted: before - dbProjeler.length });
    }

    if (method === 'GET' && pathname === `${API_PREFIX}/teklif-geri-bildirim`) {
      return sendJson(res, 200, { success: true, data: dbGeriBildirim });
    }

    if (method === 'POST' && pathname === `${API_PREFIX}/teklif-geri-bildirim`) {
      const body = parseBody(await readBody(req));
      if (!body) return sendJson(res, 400, { success: false, error: 'Invalid JSON' });
      const oy = String(body.oy || '').toLowerCase();
      if (oy !== 'iyi' && oy !== 'kotu' && oy !== 'iyi'.normalize()) {
        if (oy !== 'iyi' && oy !== 'kotu') {
          return sendJson(res, 400, { success: false, error: "oy: 'iyi' veya 'kotu' olmalı" });
        }
      }
      const item = {
        id: nextId.geri_bildirim++,
        teklif_id: body.teklif_id || null,
        teklif_ref: body.teklif_ref || '',
        oy: oy,
        not: String(body.not || '').slice(0, 2000),
        proje_ozet: body.proje_ozet || null,
        kaynak: body.kaynak || 'index-soru-seti',
        created_at: new Date().toISOString(),
      };
      dbGeriBildirim.push(item);
      saveStore();
      return sendJson(res, 200, { success: true, data: { id: item.id } });
    }

    if (method === 'GET' && pathname === `${API_PREFIX}/markalar`) {
      if (dbMarkalar.length === 0) {
        const markSet = new Map();
        for (const u of dbUrunler) {
          if (u.marka_id && !markSet.has(u.marka_id)) {
            markSet.set(u.marka_id, { id: markSet.size + 1, ad: u.marka_ad || u.marka_id, slug: u.marka_id });
          }
        }
        return sendJson(res, 200, { success: true, data: [...markSet.values()] });
      }
      return sendJson(res, 200, { success: true, data: dbMarkalar });
    }

    if (method === 'GET' && pathname === `${API_PREFIX}/proje/tip-sozlugu`) {
      if (!dbTipSozlugu.length) dbTipSozlugu = rebuildTipSozluguFromUrunler();
      return sendJson(res, 200, { success: true, data: dbTipSozlugu });
    }

    if (method === 'PUT' && pathname.startsWith(`${API_PREFIX}/proje/tip-sozlugu/`)) {
      const tipKodu = decodeURIComponent(pathname.split('/').pop() || '');
      const body = parseBody(await readBody(req));
      if (!body) return sendJson(res, 400, { success: false, error: 'Invalid JSON' });
      const idx = dbTipSozlugu.findIndex((t) => t.tip_kodu === tipKodu);
      if (idx >= 0) {
        dbTipSozlugu[idx] = { ...dbTipSozlugu[idx], ...body, tip_kodu: tipKodu };
      } else {
        dbTipSozlugu.push({
          tip_kodu: tipKodu,
          aciklama: body.aciklama || tipKodu,
          kategori: body.kategori || 'diger',
          kaynak: 'api',
          frekans: 0,
          ...body,
        });
      }
      saveStore();
      return sendJson(res, 200, { success: true });
    }

    function getCategoryOverridesPath() {
      const envPath = String(process.env.EQUSTO_CATEGORY_OVERRIDES_PATH || '').trim();
      const candidates = [
        envPath,
        path.join(process.cwd(), '..', 'public_html', 'data', 'product-category-overrides.json'),
        path.join(process.cwd(), 'public', 'data', 'product-category-overrides.json'),
        path.join(process.cwd(), 'data', 'product-category-overrides.json'),
      ].filter(Boolean);
      return candidates.find((p) => fs.existsSync(p)) || candidates[0];
    }

    if (method === 'GET' && pathname === `${API_PREFIX}/category-overrides`) {
      try {
        const catPath = getCategoryOverridesPath();
        if (!fs.existsSync(catPath)) {
          return sendJson(res, 200, { version: 1, updated: null, slugMap: {}, products: {} });
        }
        const raw = JSON.parse(fs.readFileSync(catPath, 'utf8'));
        return sendJson(res, 200, raw);
      } catch (e) {
        return sendJson(res, 500, { success: false, error: e.message || String(e) });
      }
    }

    if (method === 'PUT' && pathname === `${API_PREFIX}/category-overrides`) {
      const body = parseBody(await readBody(req));
      if (!body || typeof body !== 'object') {
        return sendJson(res, 400, { success: false, error: 'JSON gövdesi gerekli' });
      }
      try {
        const out = {
          version: 1,
          updated: new Date().toISOString(),
          slugMap: body.slugMap && typeof body.slugMap === 'object' ? body.slugMap : {},
          products: body.products && typeof body.products === 'object' ? body.products : {},
        };
        const catPath = getCategoryOverridesPath();
        fs.mkdirSync(path.dirname(catPath), { recursive: true });
        const tmp = catPath + '.tmp';
        fs.writeFileSync(tmp, JSON.stringify(out, null, 2) + '\n', 'utf8');
        fs.renameSync(tmp, catPath);
        return sendJson(res, 200, { success: true, updated: out.updated, path: catPath });
      } catch (e) {
        return sendJson(res, 500, { success: false, error: e.message || String(e) });
      }
    }

    if (method === 'POST' && pathname === `${API_PREFIX}/import/kaydet`) {
      const body = parseBody(await readBody(req));
      if (!body || !Array.isArray(body.ekipmanlar)) {
        return sendJson(res, 400, { success: false, error: 'ekipmanlar[] gerekli' });
      }
      let eklendi = 0;
      let guncellendi = 0;
      if (!dbTipSozlugu.length) dbTipSozlugu = rebuildTipSozluguFromUrunler();
      for (const row of body.ekipmanlar) {
        const k = String(row.tip_kodu || '').trim();
        if (!k) continue;
        const ex = dbTipSozlugu.find((t) => t.tip_kodu === k);
        if (ex) {
          ex.aciklama = row.ham_isim || ex.aciklama;
          ex.kategori = row.kategori || ex.kategori;
          guncellendi++;
        } else {
          dbTipSozlugu.push({
            tip_kodu: k,
            aciklama: row.ham_isim || k,
            kategori: row.kategori || 'diger',
            kaynak: 'import',
            frekans: 0,
          });
          eklendi++;
        }
      }
      saveStore();
      return sendJson(res, 200, { success: true, eklendi, guncellendi });
    }

    if (method === 'POST' && pathname === `${API_PREFIX}/import/set-kaydet`) {
      const body = parseBody(await readBody(req));
      if (!body || !Array.isArray(body.ekipmanlar)) {
        return sendJson(res, 400, { success: false, error: 'ekipmanlar[] gerekli' });
      }
      const setId = `set_${nextSetId++}`;
      const n = body.ekipmanlar.length;
      return sendJson(res, 200, {
        success: true,
        mesaj: `Proje seti kaydedildi (${n} kalem).`,
        set_id: setId,
        eslesen: n,
        eslesmez: 0,
      });
    }

    if (await tryHandleEqustoAuth(req, res, { API_PREFIX, method, pathname, readBody, parseBody, sendJson })) {
      return;
    }

    if (method === 'POST' && pathname.startsWith(`${API_PREFIX}/import/analiz`)) {
      let rawBuf;
      try {
        rawBuf = await readBody(req, 72 * 1024 * 1024);
      } catch (e) {
        if (e && e.message === 'REQUEST_BODY_TOO_LARGE') {
          return sendJson(res, 413, {
            success: false,
            error:
              'PDF isteği çok büyük (yaklaşık 72 MB üstü). Dosyayı sıkıştırın veya planı iki parça yükleyin.',
          });
        }
        throw e;
      }
      const body = parseBody(rawBuf);
      if (!body) return sendJson(res, 400, { success: false, error: 'Geçersiz JSON gövdesi' });

      const {
        dosya_base64,
        dosya_tip = 'application/pdf',
        system_prompt = '',
        user_prompt = 'Dosyayı analiz et:',
      } = body;
      if (!dosya_base64) return sendJson(res, 400, { success: false, error: 'dosya_base64 gerekli' });

      const resp = await anthropicMessagesCreate({
        model: ANTHROPIC_MODEL,
        max_tokens: IMPORT_MAX_TOKENS,
        temperature: 0.2,
        system: system_prompt,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'document', source: { type: 'base64', media_type: dosya_tip, data: dosya_base64 } },
              { type: 'text', text: user_prompt },
            ],
          },
        ],
      });

      const txt = extractTextFromClaude(resp);
      const arr = tryParseJsonArray(txt);
      if (!arr) {
        return sendJson(res, 200, {
          success: false,
          error: 'Claude geçerli JSON dizi döndürmedi. Yanıtın başı:',
          raw: txt.slice(0, 2500),
        });
      }

      const data = arr.map((x) => ({
        ham_isim: x.ham_isim ?? x.name ?? '',
        tip_kodu: x.tip_kodu ?? x.tip ?? '',
        kategori: x.kategori ?? x.cat ?? 'diger',
        adet: x.adet ?? 1,
        sozlukte_var: x.durum === 'eslesti' || false,
      }));
      return sendJson(res, 200, { success: true, data });
    }

    return sendJson(res, 404, { success: false, error: 'Not found' });
  } catch (e) {
    const msg = e && e.message ? e.message : String(e);
    console.error('[claude-api-proxy]', req.method, req.url, msg);
    const upstream =
      /^Anthropic HTTP \d/.test(msg) ||
      /Anthropic yanıtı JSON değil/i.test(msg) ||
      /Anthropic ağına bağlanılamadı/i.test(msg);
    const status = upstream ? 502 : 500;
    return sendJson(res, status, {
      success: false,
      error: msg,
      hint:
        'Tarayıcıda Network → ilgili istek → Response içindeki "error" metnini okuyun; ayrıca `npm run api` terminalindeki satıra bakın.',
    });
  }
});

server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error(
      `[claude-api-proxy] Port ${PORT} dolu (EADDRINUSE). Başka bir pencerede zaten \`npm run api\` çalışıyor olabilir.\n` +
        `  PowerShell: Get-NetTCPConnection -LocalPort ${PORT} | Select OwningProcess\n` +
        `  veya: netstat -ano | findstr ":${PORT}"\n` +
        `  Sonra: Stop-Process -Id <PID> -Force`,
    );
    process.exit(1);
  }
  console.error('[claude-api-proxy] Sunucu hatası:', err);
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  server.timeout = 0;
  if ('requestTimeout' in server) server.requestTimeout = 900000;
  if ('headersTimeout' in server) server.headersTimeout = 180000;
  console.log(`[claude-api-proxy] listening on http://${HOST}:${PORT}${API_PREFIX} (build ${API_BUILD})`);
  console.log(`[claude-api-proxy] model=${ANTHROPIC_MODEL} import_max_tokens=${IMPORT_MAX_TOKENS}`);
  console.log(`[claude-api-proxy] ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY ? 'set' : 'missing'}`);
  console.log(`[claude-api-proxy] EQUSTO_ADMIN_BEARER=${ADMIN_BEARER ? 'set' : 'missing (admin API acik)'}`);
  void equstoAuthStartupLog();
});
