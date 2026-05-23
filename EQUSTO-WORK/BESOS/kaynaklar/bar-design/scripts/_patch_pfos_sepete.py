# -*- coding: utf-8 -*-
from pathlib import Path

p = Path(r"c:\D Disk\EQUSTO-CURSOR\public\pfos.html")
text = p.read_text(encoding="utf-8")

card = (
    '          <div class="ac-c" onclick="pfosSepeteKatalog()">'
    '<span class="icon">🛒</span>'
    '<motion class="lbl">Seçilen ürünleri sepete ekle</div>'
    '<div class="sub">Teklif kalemleri · site kataloğu (ekipmanlar.json)</div>'
    "</div>\n"
)
card = (
    '          <div class="ac-c" onclick="pfosSepeteKatalog()">'
    '<span class="icon">🛒</span>'
    '<div class="lbl">Seçilen ürünleri sepete ekle</div>'
    '<div class="sub">Teklif kalemleri · site kataloğu (ekipmanlar.json)</div>'
    "</div>\n"
)

fn = """function pfosSepeteKatalog(){
  pfosEnsureCatalogPool().then(function(){
    if(!window.EqustoCart||typeof EqustoCart.addPfosRows!=='function'){
      pfModalAc('Sepet yüklenemedi','Sayfayı yenileyip tekrar deneyin.',true);
      return;
    }
    var rows=pfosPriceRows(buildEkipmanList());
    if(!rows||!rows.length){
      pfModalAc('Liste boş','Önce teklif listesine ürün ekleyin.',true);
      return;
    }
    EqustoCart.addPfosRows(rows,{replace:false}).then(function(){
      EqustoCart.openPanel();
    });
  });
}

"""

if "function pfosSepeteKatalog" not in text:
    anchor = "function excelIndir(){"
    if anchor not in text:
        raise SystemExit("excelIndir anchor missing")
    text = text.replace(anchor, fn + anchor, 1)

if 'onclick="pfosSepeteKatalog()"' not in text:
    marker = '        <div id="teklif-tbl-wrap"></div>'
    idx = text.find(marker)
    if idx < 0:
        raise SystemExit("teklif-tbl-wrap marker missing")
    text = text[:idx] + card + text[idx:]

# PFOS katalog havuzu: tam site kataloğu (EqustoShopCatalog veya ecom-data)
old_pool = """function pfosEnsureCatalogPool() {
  if (window.__PFOS_CATALOG_READY__) return Promise.resolve();
  if (!window.EqustoShopCatalog || typeof EqustoShopCatalog.load !== 'function') {
    window.__PFOS_CATALOG_READY__ = true;
    return Promise.resolve();
  }
  return Promise.all([EqustoShopCatalog.load(), pfosLoadTipShopLinks()])
    .then(function (results) {
      const all = results[0];
      const list = Array.isArray(all) ? all : [];
      window.__PFOS_CATALOG_POOL__ = list.map(pfosNormPoolItem).filter(Boolean);
      if (window.EqustoPfosCalc && typeof EqustoPfosCalc.rebuildShopIndex === 'function') {
        EqustoPfosCalc.rebuildShopIndex(window.__PFOS_CATALOG_POOL__);
      }
      window.__PFOS_CATALOG_READY__ = true;
    })
    .catch(function () {
      window.__PFOS_CATALOG_POOL__ = [];
      window.__PFOS_CATALOG_READY__ = true;
    });
}"""

new_pool = """function pfosEnsureCatalogPool() {
  if (window.__PFOS_CATALOG_READY__) return Promise.resolve();
  function applyList(all) {
    const list = Array.isArray(all) ? all : [];
    window.__PFOS_CATALOG_POOL__ = list.map(pfosNormPoolItem).filter(Boolean);
    if (window.EqustoPfosCalc && typeof EqustoPfosCalc.rebuildShopIndex === 'function') {
      EqustoPfosCalc.rebuildShopIndex(window.__PFOS_CATALOG_POOL__);
    }
    window.__PFOS_CATALOG_READY__ = true;
  }
  function loadAll() {
    if (window.EqustoShopCatalog && typeof EqustoShopCatalog.load === 'function') {
      return EqustoShopCatalog.load();
    }
    if (window.EqustoEcomData && typeof EqustoEcomData.loadEkipmanlar === 'function') {
      return EqustoEcomData.loadEkipmanlar();
    }
    return fetch('/data/ekipmanlar.json', { cache: 'default', headers: { Accept: 'application/json' } })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
  }
  return Promise.all([loadAll(), pfosLoadTipShopLinks()])
    .then(function (results) { applyList(results[0]); })
    .catch(function () {
      window.__PFOS_CATALOG_POOL__ = [];
      window.__PFOS_CATALOG_READY__ = true;
    });
}"""

if old_pool in text:
    text = text.replace(old_pool, new_pool, 1)

p.write_text(text, encoding="utf-8")
print("patched", p)
