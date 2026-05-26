import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const p = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'admin.html');
let h = fs.readFileSync(p, 'utf8');

if (!h.includes('data-hub-stats="magaza"')) {
  const re =
    /<div class="stat"><div class="stat-val" id="s-products">0<\/div><div class="stat-sub" id="s-aktif"><\/div><div class="stat-lbl">Ürün<\/div><\/div>\s*<\/div>\s*<div class="tabs" id="admin-subtabs">/;
  const ins = `  <div class="stat"><div class="stat-val" id="s-products">0</div><div class="stat-sub" id="s-aktif"></div><div class="stat-lbl">PFOS ürün</div></div>
</div>
<div class="stats-bar" data-hub-stats="magaza">
  <div class="stat"><div class="stat-val" id="s-et-urun">—</div><div class="stat-lbl">Katalog ürün</div></div>
  <div class="stat"><div class="stat-val" id="s-et-teklif">—</div><div class="stat-lbl">Teklif</div></div>
  <div class="stat"><div class="stat-val" id="s-et-siparis">—</div><div class="stat-lbl">Sipariş</div></div>
  <div class="stat"><div class="stat-val" id="s-et-musteri">—</div><div class="stat-lbl">Müşteri</div></div>
  <div class="stat"><div class="stat-val" id="s-et-kampanya">—</div><div class="stat-lbl">Kampanya</div></div>
  <div class="stat"><div class="stat-val" style="font-size:.95rem">equsto.com</div><div class="stat-lbl">Canlı vitrin</div></div>
</div>

<div class="tabs" id="admin-subtabs">`;
  const fixed = ins.replace(/div/g, 'div');
  const fixedRe =
    /<div class="stat"><div class="stat-val" id="s-products">0<\/div><div class="stat-sub" id="s-aktif"><\/div><div class="stat-lbl">Ürün<\/div><\/div>\s*<\/div>\s*<div class="tabs" id="admin-subtabs">/;
  if (fixedRe.test(h)) h = h.replace(fixedRe, fixed);
}

const oldTabs = `document.querySelectorAll('.tabs .tab').forEach(t=>{
  t.addEventListener('click',function(){
    document.querySelectorAll('.tabs .tab').forEach(x=>x.classList.remove('active'));
    document.querySelectorAll('.pane').forEach(x=>x.classList.remove('active'));
    this.classList.add('active');
    document.getElementById('pane-'+this.dataset.tab).classList.add('active');
    if(this.dataset.tab==='products')loadTipSozluguAPI();
    if(this.dataset.tab==='export')renderJSON();
    if(this.dataset.tab==='eticaret')renderFiyatlar();
    if(this.dataset.tab==='segment'){renderSegments();renderBolgeHaritasi();}
    if(this.dataset.tab==='fiyatmatris')renderFiyatMatris();
    if(this.dataset.tab==='types')renderKonseptKatalog();
  });
});`;

const newTabs = `function activateAdminTab(tabEl) {
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

if (h.includes(oldTabs)) h = h.replace(oldTabs, newTabs);

if (!h.includes("setAdminHub('pfos'")) {
  h = h.replace(
    '(function(){\n  function applyAdminHashTab(){',
    "(function(){\n  setAdminHub('pfos',{skipTab:true});\n  try{\n    var saved=localStorage.getItem('equsto-admin-hub');\n    if(!location.hash&&(saved==='magaza'||saved==='pfos')) setAdminHub(saved,{skipTab:true});\n  }catch(_){}\n  function applyAdminHashTab(){"
  );
}

const oldHash = `    var tabEl=document.querySelector('.tabs .tab[data-tab="'+id+'"]');
    if(tabEl)tabEl.click();`;
const newHash = `    var tabEl=document.querySelector('.tabs .tab[data-tab="'+id+'"]');
    if(tabEl){
      setAdminHub(tabEl.dataset.hub||adminHubForTab(id),{skipTab:true,tabId:id});
      tabEl.click();
    }`;
if (h.includes(oldHash)) h = h.replace(oldHash, newHash);

if (!h.includes('admin-hub-intro')) {
  const etBlock = `<div class="admin-hub-intro card" style="margin-bottom:16px;border-color:color-mix(in srgb, var(--gold) 28%, var(--border));">
  <div class="card-bd" style="padding:14px 16px">
    <div style="font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--gold2);margin-bottom:6px">Equsto Mağaza</div>
    <p style="font-size:13px;color:var(--muted);margin:0;line-height:1.5;max-width:56rem">Katalog, vitrin fiyatları, teklifler, siparişler, kampanyalar ve site ayarları. PFOS fiyatlandırma üstteki «Proje Fabrikası» bölümündedir.</p>
  </div>
</div>
`;
  h = h.replace('<div class="pane" id="pane-eticaret">\n<div class="et-tabs">', '<div class="pane" id="pane-eticaret">\n' + etBlock + '<div class="et-tabs">');
  h = h.replace(
    '<div class="pane active" id="pane-pdfimport">\n  <div class="admin-pfos admin-pfos--narrow">',
    `<div class="pane active" id="pane-pdfimport">
  <div class="admin-pfos admin-pfos--narrow">
    <div class="admin-hub-intro card" style="margin-bottom:14px;border-color:color-mix(in srgb, var(--gold) 28%, var(--border));">
      <div class="card-bd" style="padding:12px 16px">
        <div style="font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--gold2);margin-bottom:4px">Proje Fabrikası — liste / proje yükle</div>
        <p style="font-size:12px;color:var(--muted);margin:0;line-height:1.45">PDF, Excel veya metin listesi → analiz → kural seti ve katalog fiyatı. «Giriş &amp; Soru Akışı» sekmesinde listeni gönder / projeni yükle kartları da var.</p>
      </div>
    </div>
`
  );
}

if (!h.includes('try{updateMagazaHubStats')) {
  h = h.replace('function renderFiyatlar(){', 'function renderFiyatlar(){\n  try{updateMagazaHubStats();}catch(_){}');
}

// strip any accidental div tags from this script run
h = h.replace(/<\/?div\b/g, (m) => m.replace(/div/g, 'div'));

fs.writeFileSync(p, h);
console.log({
  magaza: h.includes('data-hub-stats="magaza"'),
  activate: h.includes('activateAdminTab'),
  intro: h.includes('admin-hub-intro'),
});
