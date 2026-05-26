import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const p = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'pfos.html');
let h = fs.readFileSync(p, 'utf8');

const scriptBlock = `<script src="/eq-shop-catalog-bootstrap.js"></script>
<script src="/equsto-engine.js"></script>
<script src="/pfos-rule-engine.js"></script>
<script>
/* PFOS v2 Faz 1 — kural motoru + katalog fiyat köprüsü */
(function () {
  window.__PFOS_KEY_KATEGORI__ = { keys: {} };
  window.PFOS_EQ_FIYATLAR = {};
  fetch('/data/pfos-key-to-kategori.json', { cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (j) { window.__PFOS_KEY_KATEGORI__ = j || { keys: {} }; })
    .catch(function () {});
  var apiBase = (function () {
    if (typeof window.EQUSTO_API_BASE === 'string') return window.EQUSTO_API_BASE.replace(/\\/$/, '');
    var host = (location.hostname || '').toLowerCase();
    if (host === '127.0.0.1' || host === 'localhost') return 'http://127.0.0.1:3001/api';
    return '/api';
  })();
  fetch(apiBase + '/fiyatlar', { cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (j) {
      if (j && j.success && j.data && typeof j.data === 'object') window.PFOS_EQ_FIYATLAR = j.data;
    })
    .catch(function () {});
  if (window.EqustoPfosRuleEngine && EqustoPfosRuleEngine.init) EqustoPfosRuleEngine.init();
})();
</script>`;

if (!h.includes('pfos-rule-engine.js')) {
  h = h.replace(
    /<script src="\/eq-shop-catalog-bootstrap\.js"><\/script>\s*/,
    scriptBlock + '\n'
  );
}

const helpers = `
// ── PFOS v2: katalog fiyat çözümleyici ───────────────────────────────────────
window.__PFOS_CATALOG_POOL__ = [];
window.__PFOS_CATALOG_READY__ = false;

function pfosEnsureCatalogPool() {
  if (window.__PFOS_CATALOG_READY__) return Promise.resolve();
  if (!window.EqustoShopCatalog || typeof EqustoShopCatalog.load !== 'function') {
    window.__PFOS_CATALOG_READY__ = true;
    return Promise.resolve();
  }
  return EqustoShopCatalog.load()
    .then(function (all) {
      window.__PFOS_CATALOG_POOL__ = Array.isArray(all) ? all : [];
      window.__PFOS_CATALOG_READY__ = true;
    })
    .catch(function () {
      window.__PFOS_CATALOG_POOL__ = [];
      window.__PFOS_CATALOG_READY__ = true;
    });
}

function pfosNorm(s) {
  return String(s == null ? '' : s).trim().toLocaleLowerCase('tr');
}

function pfosFindCatalogProduct(row) {
  const pool = window.__PFOS_CATALOG_POOL__ || [];
  if (!pool.length || !row) return null;
  if (row.pfB && row.pfN) {
    const b = pfosNorm(row.pfB);
    const n = pfosNorm(row.pfN);
    const exact = pool.find(function (p) {
      return pfosNorm(p.b) === b && pfosNorm(p.n) === n;
    });
    if (exact) return exact;
  }
  if (row.pfDept) {
    const dept = pfosNorm(row.pfDept);
    const active = pool.filter(function (p) {
      return p && (p.proje_fab_aktif === true || p.pfos_aktif === true);
    });
    const src = active.length ? active : pool;
    return (
      src.find(function (p) {
        const pk = pfosNorm(p.kategori || p.category || '');
        return pk === dept || pk.indexOf(dept) >= 0;
      }) || null
    );
  }
  return null;
}

function pfosParsePriceTL(raw) {
  if (window.EqustoEngine && typeof EqustoEngine.parsePriceTL === 'function') {
    return EqustoEngine.parsePriceTL(raw);
  }
  const s = String(raw || '')
    .replace(/\\s/g, '')
    .replace(/\\.(?=\\d{3})/g, '')
    .replace(',', '.');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

function pfosResolveRowPrice(row) {
  const amt = tahmini();
  let birim = 0;
  let kaynak = 'tahmin';
  const prod = pfosFindCatalogProduct(row);
  const fiyatMap = window.PFOS_EQ_FIYATLAR || {};
  if (prod && prod.tip_kodu && Number(fiyatMap[prod.tip_kodu]) > 0) {
    birim = Number(fiyatMap[prod.tip_kodu]);
    kaynak = 'matris';
  } else if (prod && prod.p) {
    birim = pfosParsePriceTL(prod.p);
    if (birim > 0) kaynak = 'katalog';
  }
  if (!birim && row && row.pct) {
    birim = Math.round((amt * row.pct) / 100) * 100 || Math.round(amt * row.pct);
    kaynak = 'tahmini_pay';
  }
  return { birim: birim, kaynak: kaynak, prod: prod };
}

function pfosPriceRows(rows) {
  return (rows || []).map(function (r) {
    const pr = pfosResolveRowPrice(r);
    const out = Object.assign({}, r, { birim: pr.birim, fiyat_kaynak: pr.kaynak });
    if (pr.prod) {
      if (pr.prod.tip_kodu) out.tip_kodu = pr.prod.tip_kodu;
      if (pr.prod.n && !out.catalogAd) out.catalogAd = pr.prod.n;
      if (pr.prod.b && !out.catalogMarka) out.catalogMarka = pr.prod.b;
    }
    return out;
  });
}

`;

if (!h.includes('pfosPriceRows')) {
  h = h.replace(
    '// ── Ekipman Listesi Oluşturucu (konsept + dükkan + pisir bazlı) ─',
    helpers + '// ── Ekipman Listesi Oluşturucu (konsept + dükkan + pisir bazlı) ─'
  );
}

const buildStart = h.indexOf('function buildEkipmanList(){');
const buildEnd = h.indexOf('/** Pişirme seçenekleri', buildStart);
if (buildStart >= 0 && buildEnd > buildStart) {
  const replacement = `function buildEkipmanList(){
  const ctx = {
    konsept: D.konsept,
    dukkan: D.dukkan || '',
    alt: D.alt || '',
    pisir: D.pisir || [],
  };
  if (window.EqustoPfosRuleEngine && typeof EqustoPfosRuleEngine.buildList === 'function') {
    return EqustoPfosRuleEngine.buildList(ctx, EQ_ITEMS);
  }
  return [];
}

`;
  h = h.slice(0, buildStart) + replacement + h.slice(buildEnd);
}

h = h.replace(
  'const rows=buildEkipmanList().map(r=>({...r,birim:Math.round(amt*r.pct/100)*100||Math.round(amt*r.pct)}));',
  'const rows=pfosPriceRows(buildEkipmanList());'
);

h = h.replace(
  'const rows=buildEkipmanList().map(r=>({...r, birim:Math.round(amt*r.pct/100)*100||Math.round(amt*r.pct)}));',
  'const rows=pfosPriceRows(buildEkipmanList());'
);

if (!h.includes('pfosEnsureCatalogPool()')) {
  h = h.replace(
    '  loadPfosProjects().then(function(){ refreshKonseptRail(); });',
    '  pfosEnsureCatalogPool();\n  loadPfosProjects().then(function(){ refreshKonseptRail(); });'
  );
}

fs.writeFileSync(p, h);
console.log('patched pfos.html — faz1 bridge');
