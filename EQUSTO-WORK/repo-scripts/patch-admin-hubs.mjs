import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const adminPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'admin.html');
let h = fs.readFileSync(adminPath, 'utf8');

const tabReplacements = [
  ['data-tab="pdfimport">PDF / Excel Import', 'data-tab="pdfimport" data-hub="pfos">Liste / Proje Yükle'],
  ['data-tab="sorular">Proje / Liste Export', 'data-tab="sorular" data-hub="pfos">Giriş &amp; Soru Akışı'],
  ['data-tab="types">Konsept Tipleri', 'data-tab="types" data-hub="pfos">Konsept Tipleri'],
  ['data-tab="segment">Segmentler', 'data-tab="segment" data-hub="pfos">Segmentler'],
  ['data-tab="rules">Mr. Equsto — Kurallar', 'data-tab="rules" data-hub="pfos">Kurallar (Mr. Equsto)'],
  ['data-tab="sets">Ekipman Setleri', 'data-tab="sets" data-hub="pfos">Ekipman Setleri'],
  ['data-tab="fiyatmatris">Fiyat Matrisi', 'data-tab="fiyatmatris" data-hub="pfos">Fiyat Matrisi'],
  ['data-tab="products">Ürünler', 'data-tab="products" data-hub="pfos">Tip Sözlüğü &amp; Katalog'],
  ['data-tab="eticaret">E-Ticaret', 'data-tab="eticaret" data-hub="magaza">Mağaza Yönetimi'],
  ['data-tab="export">JSON Export', 'data-tab="export" data-hub="pfos">PFOS Veri Export'],
  ['data-tab="sogukoda">🧊 Soğuk Oda Hesap', 'data-tab="sogukoda" data-hub="pfos">Soğuk Oda Hesap'],
];

for (const [from, to] of tabReplacements) {
  if (h.includes(from)) h = h.replace(from, to);
}

if (!h.includes('id="admin-subtabs"')) {
  h = h.replace('<motion class="tabs">', '<div class="tabs" id="admin-subtabs">');
  h = h.replace('<div class="tabs">', '<motion class="tabs" id="admin-subtabs">', 1);
  h = h.replace('<motion class="tabs" id="admin-subtabs">', '<div class="tabs" id="admin-subtabs">');
}

const realOld = `  <motion class="stat"><div class="stat-val" id="s-products">0</div><div class="stat-sub" id="s-aktif"></div><div class="stat-lbl">Ürün</div></motion>
</div>

<div class="tabs" id="admin-subtabs">`;

const realOld2 = `  <div class="stat"><div class="stat-val" id="s-products">0</div><div class="stat-sub" id="s-aktif"></div><div class="stat-lbl">Ürün</div></div>
</div>

<div class="tabs">`;

const realNew = `  <div class="stat"><div class="stat-val" id="s-products">0</motion><div class="stat-sub" id="s-aktif"></div><div class="stat-lbl">PFOS ürün</div></div>
</div>
<div class="stats-bar" data-hub-stats="magaza">
  <div class="stat"><div class="stat-val" id="s-et-urun">—</div><div class="stat-lbl">Katalog ürün</div></div>
  <div class="stat"><div class="stat-val" id="s-et-teklif">—</div><div class="stat-lbl">Teklif</div></div>
  <div class="stat"><div class="stat-val" id="s-et-siparis">—</div><div class="stat-lbl">Sipariş</div></div>
  <div class="stat"><div class="stat-val" id="s-et-musteri">—</div><div class="stat-lbl">Müşteri</div></div>
  <motion class="stat"><div class="stat-val" id="s-et-kampanya">—</div><div class="stat-lbl">Kampanya</div></div>
  <div class="stat"><div class="stat-val" style="font-size:.95rem">equsto.com</div><div class="stat-lbl">Canlı vitrin</div></div>
</div>

<div class="tabs" id="admin-subtabs">`;

// Write clean version
const realNewClean = realNew.replace(/<\/?motion\b/g, (m) => m.replace(/motion/g, 'div'));

if (!h.includes('data-hub-stats="magaza"')) {
  if (h.includes(realOld2)) h = h.replace(realOld2, realNewClean);
  else if (h.includes('id="admin-subtabs"')) {
    h = h.replace(
      /  <div class="stat"><div class="stat-val" id="s-products">0<\/motion><div class="stat-sub" id="s-aktif"><\/div><div class="stat-lbl">Ürün<\/motion><\/div>\n<\/div>\n\n<div class="tabs" id="admin-subtabs">/,
      realNewClean.trimStart()
    );
  }
}

const hubJs = `
// ── Admin hub: PFOS · Mağaza (pane id / data-tab aynı) ──
var ADMIN_HUB_DEFAULT_TAB = { pfos: 'pdfimport', magaza: 'eticaret' };
function adminHubForTab(tabId) {
  var el = document.querySelector('.tabs .tab[data-tab="' + tabId + '"]');
  return (el && el.dataset.hub) || 'pfos';
}
function setAdminHub(hub, opts) {
  opts = opts || {};
  hub = hub === 'magaza' ? 'magaza' : 'pfos';
  document.querySelectorAll('.admin-hub').forEach(function (btn) {
    var on = btn.dataset.adminHub === hub;
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-selected', on ? 'true' : 'false');
  });
  document.querySelectorAll('[data-hub-stats]').forEach(function (bar) {
    bar.classList.toggle('active', bar.dataset.hubStats === hub);
  });
  var visible = 0;
  document.querySelectorAll('.tabs .tab[data-hub]').forEach(function (t) {
    var show = t.dataset.hub === hub;
    t.style.display = show ? '' : 'none';
    if (show) visible++;
  });
  var tabBar = document.getElementById('admin-subtabs') || document.querySelector('.tabs');
  if (tabBar) tabBar.classList.toggle('tabs--magaza-only', hub === 'magaza' && visible <= 1);
  try { localStorage.setItem('equsto-admin-hub', hub); } catch (_) {}
  if (!opts.skipTab) {
    var target = opts.tabId;
    if (!target || adminHubForTab(target) !== hub) target = ADMIN_HUB_DEFAULT_TAB[hub];
    var tabEl = document.querySelector('.tabs .tab[data-tab="' + target + '"]');
    if (tabEl) tabEl.click();
  }
}
function updateMagazaHubStats() {
  function set(id, n) {
    var el = document.getElementById(id);
    if (el) el.textContent = typeof n === 'number' ? String(n) : (n || '—');
  }
  var prods = typeof products !== 'undefined' && Array.isArray(products) ? products : [];
  set('s-et-urun', prods.length || '—');
  if (typeof etTeklifler !== 'undefined' && Array.isArray(etTeklifler)) set('s-et-teklif', etTeklifler.length);
  if (typeof etSiparisler !== 'undefined' && Array.isArray(etSiparisler)) set('s-et-siparis', etSiparisler.length);
  if (typeof etMusteriler !== 'undefined' && Array.isArray(etMusteriler)) set('s-et-musteri', etMusteriler.length);
  if (typeof etKampanyalar !== 'undefined' && Array.isArray(etKampanyalar)) set('s-et-kampanya', etKampanyalar.length);
}
document.querySelectorAll('.admin-hub').forEach(function (btn) {
  btn.addEventListener('click', function () { setAdminHub(btn.dataset.adminHub || 'pfos'); });
});
`;

if (!h.includes('function setAdminHub')) {
  h = h.replace(
    '// ── Tabs ──────────────────────────────────────────────────────────────────────',
    hubJs + '\n// ── Tabs ──────────────────────────────────────────────────────────────────────'
  );
}

const oldTabBlock = `document.querySelectorAll('.tabs .tab').forEach(t=>{
  t.addEventListener('click',function(){
    document.querySelectorAll('.tabs .tab').forEach(x=>x.classList.remove('active'));
    document.querySelectorAll('.pane').forEach(x=>x.classList.remove('active'));
    this.classList.add('active');
    document.getElementById('pane-'+this.dataset.tab).classList.add('active');
    if(this.dataset.tab==='products')loadTipSozluguAPI();
    if(this.dataset.tab==='export')renderJSON();
    if(this.dataset.tab==='eticaret')renderFiyatlar();
    // v3 yeni sekmeler
    if(this.dataset.tab==='segment'){renderSegments();renderBolgeHaritasi();}
    if(this.dataset.tab==='fiyatmatris')renderFiyatMatris();
    if(this.dataset.tab==='types')renderKonseptKatalog();
  });
});`;

const newTabBlock = `function activateAdminTab(tabEl) {
  if (!tabEl || !tabEl.dataset.tab) return;
  document.querySelectorAll('.tabs .tab').forEach(function (x) { x.classList.remove('active'); });
  document.querySelectorAll('.pane').forEach(function (x) { x.classList.remove('active'); });
  tabEl.classList.add('active');
  var pane = document.getElementById('pane-' + tabEl.dataset.tab);
  if (pane) pane.classList.add('active');
  var hub = tabEl.dataset.hub || adminHubForTab(tabEl.dataset.tab);
  setAdminHub(hub, { skipTab: true, tabId: tabEl.dataset.tab });
  var id = tabEl.dataset.tab;
  if (id === 'products') loadTipSozluguAPI();
  if (id === 'export') renderJSON();
  if (id === 'eticaret') { renderFiyatlar(); updateMagazaHubStats(); }
  if (id === 'segment') { renderSegments(); renderBolgeHaritasi(); }
  if (id === 'fiyatmatris') renderFiyatMatris();
  if (id === 'types') renderKonseptKatalog();
}
document.querySelectorAll('.tabs .tab').forEach(function (t) {
  t.addEventListener('click', function () { activateAdminTab(this); });
});`;

if (h.includes(oldTabBlock)) h = h.replace(oldTabBlock, newTabBlock);

const oldHash = `    var tabEl=document.querySelector('.tabs .tab[data-tab="'+id+'"]');
    if(tabEl)tabEl.click();`;

const newHash = `    var tabEl=document.querySelector('.tabs .tab[data-tab="'+id+'"]');
    if(tabEl){
      setAdminHub(tabEl.dataset.hub||adminHubForTab(id),{skipTab:true,tabId:id});
      tabEl.click();
    }`;

if (h.includes(oldHash)) h = h.replace(oldHash, newHash);

const oldInit = `(function(){
  function applyAdminHashTab(){`;
const newInit = `(function(){
  try {
    var saved=localStorage.getItem('equsto-admin-hub');
    if(!location.hash && (saved==='magaza'||saved==='pfos')) setAdminHub(saved,{skipTab:true});
  } catch(_){}
  function applyAdminHashTab(){`;

if (h.includes(oldInit) && !h.includes("equsto-admin-hub")) {
  h = h.replace(oldInit, newInit);
}

if (!h.includes('admin-hub-intro') && h.includes('<div class="pane" id="pane-eticaret">')) {
  const etIntro = `<motion class="admin-hub-intro card" style="margin-bottom:16px;border-color:color-mix(in srgb, var(--gold) 28%, var(--border));">
  <div class="card-bd" style="padding:14px 16px">
    <div style="font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--gold2);margin-bottom:6px">Equsto Mağaza</div>
    <p style="font-size:13px;color:var(--muted);margin:0;line-height:1.5;max-width:56rem">Katalog, vitrin fiyatları, teklifler, siparişler, kampanyalar ve site ayarları. PFOS fiyatlandırma ayrı bölümdedir.</p>
  </div>
</div>
`;
  h = h.replace(
    '<div class="pane" id="pane-eticaret">\n<div class="et-tabs">',
    '<div class="pane" id="pane-eticaret">\n' + etIntro.replace(/motion/g, 'motion') + '\n<div class="et-tabs">'
  );
}

if (!h.includes('Proje Fabrikası — liste') && h.includes('id="pane-pdfimport"')) {
  const pfosBanner = `    <div class="admin-hub-intro card" style="margin-bottom:14px;border-color:color-mix(in srgb, var(--gold) 28%, var(--border));">
      <div class="card-bd" style="padding:12px 16px">
        <div style="font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--gold2);margin-bottom:4px">Proje Fabrikası — liste / proje yükle</div>
        <p style="font-size:12px;color:var(--muted);margin:0;line-height:1.45">PDF, Excel veya proje notları → analiz → kural seti ve katalog fiyatı. Soru akışı ve kurallar alt sekmelerde.</p>
      </div>
    </div>

`;
  h = h.replace(
    '<div class="pane active" id="pane-pdfimport">\n  <div class="admin-pfos admin-pfos--narrow">',
    '<div class="pane active" id="pane-pdfimport">\n  <div class="admin-pfos admin-pfos--narrow">\n' + pfosBanner
  );
}

h = h.replace(/<\/?motion\b/g, (m) => m.replace(/motion/g, 'div'));

fs.writeFileSync(adminPath, h);
console.log('[patch-admin-hubs] done');
