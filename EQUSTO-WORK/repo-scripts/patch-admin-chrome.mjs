import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const p = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'admin.html');
let h = fs.readFileSync(p, 'utf8');

h = h.replace(/<nav class="topnav"[\s\S]*?<\/nav>\s*/m, '');

const magTabsHtml = `
<div class="admin-magaza-tabs" id="admin-magaza-tabs" hidden>
  <button type="button" class="admin-mtab active" data-etpane="et-ozet">Özet</button>
  <button type="button" class="admin-mtab" data-etpane="et-urunler">Ürünler</button>
  <button type="button" class="admin-mtab" data-etpane="et-teklifler">Teklifler</button>
  <button type="button" class="admin-mtab" data-etpane="et-siparisler">Siparişler</button>
  <button type="button" class="admin-mtab" data-etpane="et-musteriler">Müşteriler</button>
  <button type="button" class="admin-mtab" data-etpane="et-fiyat">Fiyat &amp; Döviz</button>
  <button type="button" class="admin-mtab" data-etpane="et-kampanya">Kampanyalar</button>
  <button type="button" class="admin-mtab" data-etpane="et-icerik">İçerik &amp; SEO</button>
  <button type="button" class="admin-mtab" data-etpane="et-ayarlar">Ayarlar</button>
</div>
`;

if (!h.includes('admin-magaza-tabs')) {
  h = h.replace(
    /<\/div>\s*\n<div class="stats-bar active" data-hub-stats="pfos">/,
    '</button>\n</div>\n' + magTabsHtml + '\n<div class="stats-bar active" data-hub-stats="pfos">'
  );
}

h = h.replace(
  /\s*<div class="tab" data-tab="eticaret" data-hub="magaza">[^<]*<\/div>\s*/,
  '\n'
);

const setHubOld = `  var tabBar = document.getElementById('admin-subtabs') || document.querySelector('.tabs');
  if (tabBar) tabBar.classList.toggle('tabs--magaza-only', hub === 'magaza' && visible <= 1);
  try { localStorage.setItem('equsto-admin-hub', hub); } catch (_) {}
  if (!opts.skipTab) {
    var target = opts.tabId;
    if (!target || adminHubForTab(target) !== hub) target = ADMIN_HUB_DEFAULT_TAB[hub];
    var tabEl = document.querySelector('.tabs .tab[data-tab="' + target + '"]');
    if (tabEl) tabEl.click();
  }
}`;

const setHubNew = `  var tabBar = document.getElementById('admin-subtabs');
  var magBar = document.getElementById('admin-magaza-tabs');
  if (tabBar) tabBar.style.display = hub === 'magaza' ? 'none' : '';
  if (magBar) magBar.hidden = hub !== 'magaza';
  try { localStorage.setItem('equsto-admin-hub', hub); } catch (_) {}
  if (hub === 'magaza') {
    document.querySelectorAll('.tabs .tab').forEach(function (x) { x.classList.remove('active'); });
    document.querySelectorAll('.pane').forEach(function (x) { x.classList.remove('active'); });
    var etPane = document.getElementById('pane-eticaret');
    if (etPane) etPane.classList.add('active');
    var etId = opts.tabId && String(opts.tabId).indexOf('et-') === 0 ? opts.tabId : 'et-ozet';
    if (typeof showEtab === 'function') showEtab(null, etId);
    try { updateMagazaHubStats(); } catch (_) {}
  } else if (!opts.skipTab) {
    var target = opts.tabId;
    if (!target || adminHubForTab(target) !== hub) target = ADMIN_HUB_DEFAULT_TAB[hub];
    var tabEl = document.querySelector('.tabs .tab[data-tab="' + target + '"]');
    if (tabEl) tabEl.click();
  }
}`;

if (h.includes(setHubOld)) h = h.replace(setHubOld, setHubNew);

if (!h.includes("data-etpane")) {
  const magJs = `document.querySelectorAll('.admin-mtab').forEach(function (btn) {
  btn.addEventListener('click', function () {
    document.querySelectorAll('.admin-mtab').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
    var pid = btn.getAttribute('data-etpane');
    if (pid && typeof showEtab === 'function') showEtab(null, pid);
  });
});
`;
  h = h.replace(
    "document.querySelectorAll('.admin-hub').forEach(function (btn) {",
    magJs + "\ndocument.querySelectorAll('.admin-hub').forEach(function (btn) {"
  );
}

h = h.replace(
  /<button type="button" class="btn btn-ghost btn-sm" onclick="typeof eqGo==='function'\?eqGo\('pfos'\):location\.href='\/pfos\.html'">Proje Fabrikası<\/button>\s*/,
  ''
);

// hash: et-* panes
h = h.replace(
  `    if(!id||!/^[a-z0-9_-]+$/i.test(id))return;
    var tabEl=document.querySelector('.tabs .tab[data-tab="'+id+'"]');
    if(tabEl){
      setAdminHub(tabEl.dataset.hub||adminHubForTab(id),{skipTab:true,tabId:id});
      tabEl.click();
    }`,
  `    if(!id||!/^[a-z0-9_-]+$/i.test(id))return;
    if(id.indexOf('et-')===0){
      setAdminHub('magaza',{skipTab:true,tabId:id});
      return;
    }
    var tabEl=document.querySelector('.tabs .tab[data-tab="'+id+'"]');
    if(tabEl){
      setAdminHub(tabEl.dataset.hub||adminHubForTab(id),{skipTab:true,tabId:id});
      tabEl.click();
    }`
);

fs.writeFileSync(p, h);
console.log({
  noTopnav: !h.includes('Pişirme Ekipmanları'),
  magTabs: h.includes('admin-magaza-tabs'),
  setHub: h.includes("magBar.hidden"),
});
