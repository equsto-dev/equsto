/**
 * Admin — Ana sayfa vitrin (Mutbex akışı) düzenleyici.
 * Kaynak: GET/POST /api/vitrin-homepage + public/data/homepage-vitrin.json
 */
(function () {
  'use strict';

  var vitrinCfg = null;
  var vitrinDirty = false;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/"/g, '&quot;');
  }

  function apiBase() {
    if (typeof PRODUCTS_API_BASE === 'string' && PRODUCTS_API_BASE) return PRODUCTS_API_BASE;
    if (typeof window.EQUSTO_API_BASE === 'string') return window.EQUSTO_API_BASE.replace(/\/$/, '');
    return '/api';
  }

  async function vitrinFetch(method, body) {
    if (typeof api === 'function') {
      try {
        return await api(method, '/vitrin-homepage', body);
      } catch (e) {
        if (method === 'GET') throw e;
      }
    }
    var url = apiBase() + '/vitrin-homepage';
    var opt = {
      method: method,
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    };
    if (window.EQUSTO_ADMIN_BEARER) opt.headers.Authorization = 'Bearer ' + window.EQUSTO_ADMIN_BEARER;
    if (body) opt.body = JSON.stringify(body);
    var r = await fetch(url, opt);
    var j = await r.json();
    if (!r.ok || j.success === false) throw new Error((j && j.error) || 'API hata ' + r.status);
    return j;
  }

  async function loadVitrinAdmin() {
    var st = document.getElementById('vitrin-status');
    if (st) st.textContent = 'Yükleniyor…';
    try {
      var res = await vitrinFetch('GET');
      vitrinCfg = (res && res.data) || res || {};
      vitrinDirty = false;
      renderVitrinAdmin();
      if (st) st.textContent = 'Kaynak: API · ' + (vitrinCfg.updated || '—');
    } catch (_) {
      try {
        var r2 = await fetch('/data/homepage-vitrin.json', { cache: 'no-store' });
        vitrinCfg = await r2.json();
        vitrinDirty = false;
        renderVitrinAdmin();
        if (st) st.textContent = 'Kaynak: dosya (API kapalı)';
      } catch (e2) {
        vitrinCfg = { version: '1.0', layout: {}, heroSlides: [], stories: [], ticker: [] };
        renderVitrinAdmin();
        if (st) st.textContent = 'Hata: ' + (e2.message || e2);
      }
    }
  }

  async function saveVitrinAdmin() {
    var st = document.getElementById('vitrin-status');
    try {
      collectRailsToCfg();
      syncVitrinFromForm();
      vitrinCfg.updated = new Date().toISOString().slice(0, 10);
      await vitrinFetch('POST', vitrinCfg);
      vitrinDirty = false;
      if (st) st.textContent = 'Kaydedildi · ' + vitrinCfg.updated;
      alert('Vitrin kaydedildi. Ana sayfada Ctrl+F5 ile yenileyin.');
    } catch (e) {
      if (st) st.textContent = 'Kayıt hatası';
      alert('Kayıt hatası: ' + (e.message || e));
    }
  }

  function syncVitrinFromForm() {
    if (!vitrinCfg) vitrinCfg = {};
    vitrinCfg.layout = vitrinCfg.layout || {};
    ['showWorldFirstBanner', 'showPlatformHero', 'showMutbexTicker', 'showMutbexCarousel', 'showMutbexStories', 'showMutbexSpotlight'].forEach(function (k) {
      var el = document.getElementById('v-' + k);
      if (el) vitrinCfg.layout[k] = !!el.checked;
    });
    var pt = document.getElementById('v-pageTitle');
    if (pt) vitrinCfg.pageTitle = pt.value.trim();
    var st = document.getElementById('v-spotlightTitle');
    if (st) vitrinCfg.spotlightTitle = st.value.trim();
    var raw = document.getElementById('v-json-advanced');
    if (raw && raw.value.trim()) {
      try {
        var parsed = JSON.parse(raw.value);
        vitrinCfg = parsed;
      } catch (_) {}
    }
  }

  function slideRow(s, i) {
    return (
      '<tr data-vslide="' +
      i +
      '"><td><input type="checkbox" class="v-slide-aktif" ' +
      (s.aktif !== false ? 'checked' : '') +
      '></td><td><input class="v-slide-title" value="' +
      esc(s.title || '') +
      '" style="width:100%"></td><td><input class="v-slide-sub" value="' +
      esc(s.subtitle || '') +
      '" style="width:100%"></td><td><input class="v-slide-href" value="' +
      esc(s.href || '') +
      '" style="width:100%;font-family:var(--mono);font-size:11px"></td><td><input class="v-slide-img" value="' +
      esc(s.image || '') +
      '" style="width:100%;font-family:var(--mono);font-size:11px"></td><td><button type="button" class="btn btn-danger btn-xs v-slide-del">Sil</button></td></tr>'
    );
  }

  function collectSlides() {
    var rows = document.querySelectorAll('#vitrin-slides tbody tr[data-vslide]');
    var out = [];
    rows.forEach(function (tr, idx) {
      out.push({
        aktif: !!tr.querySelector('.v-slide-aktif')?.checked,
        title: tr.querySelector('.v-slide-title')?.value?.trim() || '',
        subtitle: tr.querySelector('.v-slide-sub')?.value?.trim() || '',
        href: tr.querySelector('.v-slide-href')?.value?.trim() || '#',
        image: tr.querySelector('.v-slide-img')?.value?.trim() || '',
        sort: idx + 1,
      });
    });
    return out;
  }

  function renderVitrinAdmin() {
    var root = document.getElementById('et-vitrin-root');
    if (!root || !vitrinCfg) return;
    var L = vitrinCfg.layout || {};
    root.innerHTML =
      '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:14px">' +
      '<span id="vitrin-status" style="font-size:12px;color:var(--muted);flex:1"></span>' +
      '<button type="button" class="btn btn-ghost btn-sm" onclick="loadVitrinAdmin()">↺ Yenile</button>' +
      '<button type="button" class="btn btn-gold btn-sm" onclick="saveVitrinAdmin()">Kaydet & vitrine yayınla</button>' +
      '<a class="btn btn-ghost btn-sm" href="/" target="_blank" rel="noopener">Vitrini aç →</a>' +
      '</div>' +
      '<div class="card" style="margin-bottom:14px"><div class="card-hd"><span style="font-weight:600;font-size:13px">Görünürlük (Mutbex / Equsto)</span></div><div class="card-bd" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px">' +
      checkbox('showWorldFirstBanner', '«DÜNYADA BİR İLK!» banner', L) +
      checkbox('showPlatformHero', '4\'lü platform hero (PFOS / Yer Sofrası / Bar Design)', L) +
      checkbox('showMutbexTicker', 'Üst ticker (9 taksit, kargo…)', L) +
      checkbox('showMutbexCarousel', 'Mutbex slider (kapalı = yalnız 4\'lü hero)', L) +
      checkbox('showMutbexStories', 'Kategori story halkaları', L) +
      checkbox('showMutbexSpotlight', 'Haftanın öne çıkanları', L) +
      '</div></div>' +
      '<div class="row" style="gap:14px;margin-bottom:14px">' +
      '<div class="field" style="flex:1"><label>Sayfa H1</label><input id="v-pageTitle" value="' +
      esc(vitrinCfg.pageTitle || '') +
      '"></div>' +
      '<div class="field" style="flex:1"><label>Spotlight başlığı</label><input id="v-spotlightTitle" value="' +
      esc(vitrinCfg.spotlightTitle || '') +
      '"></div></div>' +
      '<div class="section-lbl">Hero slider slaytları</div>' +
      '<p style="font-size:12px;color:var(--muted);margin:4px 0 10px">Mutbex carousel açıkken kullanılır. Gradient için image boş bırakın; href: pfos.html, bar-design.html veya marka URL.</p>' +
      '<div id="vitrin-slides" style="overflow:auto;border:1px solid var(--border);border-radius:6px;margin-bottom:10px">' +
      '<table class="et-tbl"><thead><tr><th></th><th>Başlık</th><th>Alt metin</th><th>Link</th><th>Görsel URL</th><th></th></tr></thead><tbody>' +
      (vitrinCfg.heroSlides || []).map(slideRow).join('') +
      '</tbody></table></div>' +
      '<button type="button" class="btn btn-ghost btn-sm" id="v-slide-add">+ Slayt</button>' +
      '<div class="section-lbl" style="margin-top:18px">Ürün rayları (SKU listesi)</div>' +
      '<p style="font-size:12px;color:var(--muted);margin:4px 0 8px">Boş = otomatik katalog. SKU virgülle: kampanyalı, en çok satan, yeni.</p>' +
      railField('kampanyali', vitrinCfg) +
      railField('cokSatan', vitrinCfg) +
      railField('yeni', vitrinCfg) +
      spotlightField(vitrinCfg) +
      '<details style="margin-top:16px"><summary style="cursor:pointer;font-size:13px;font-weight:600">Gelişmiş JSON</summary>' +
      '<textarea id="v-json-advanced" rows="12" style="width:100%;margin-top:8px;font-family:var(--mono);font-size:11px">' +
      esc(JSON.stringify(vitrinCfg, null, 2)) +
      '</textarea></details>';

    root.innerHTML = root.innerHTML
      .split('<div class="row"')
      .join('<div class="row"')
      .split('</div></div>')
      .join('</div></div>')
      .split('<div class="row"')
      .join('<div class="row"')
      .split('</div>')
      .join('</div>')
      .split('<div ')
      .join('<div ');

    document.getElementById('v-slide-add')?.addEventListener('click', function () {
      if (!vitrinCfg.heroSlides) vitrinCfg.heroSlides = [];
      vitrinCfg.heroSlides.push({ title: 'Yeni slayt', subtitle: '', href: '#', image: '', aktif: true, sort: vitrinCfg.heroSlides.length + 1 });
      vitrinCfg.heroSlides = collectSlides();
      renderVitrinAdmin();
    });
    root.querySelectorAll('.v-slide-del').forEach(function (btn) {
      btn.addEventListener('click', function () {
        vitrinCfg.heroSlides = collectSlides();
        var tr = btn.closest('tr');
        var i = Number(tr?.dataset?.vslide);
        if (!Number.isNaN(i)) vitrinCfg.heroSlides.splice(i, 1);
        renderVitrinAdmin();
      });
    });
    loadVitrinAdmin._rendered = true;
  }

  function checkbox(id, label, L) {
    return (
      '<label style="display:flex;gap:8px;align-items:flex-start;text-transform:none;font-size:12px">' +
      '<input type="checkbox" id="v-' +
      id +
      '" ' +
      (L[id] !== false ? 'checked' : '') +
      '>' +
      esc(label) +
      '</label>'
    );
  }

  function railField(key, cfg) {
    var rails = cfg.rails || {};
    var r = rails[key] || { mode: 'auto', skus: [] };
    var skuStr = Array.isArray(r.skus) ? r.skus.join(', ') : '';
    return (
      '<div class="field" style="margin-bottom:8px"><label>' +
      esc(key) +
      ' — SKU (virgül)</label><input class="v-rail-sku" data-rail="' +
      esc(key) +
      '" value="' +
      esc(skuStr) +
      '" placeholder="Boş = otomatik" style="width:100%;font-family:var(--mono);font-size:11px"></div>'
    );
  }

  function spotlightField(cfg) {
    var sp = cfg.spotlight || { mode: 'auto', skus: [] };
    var skuStr = Array.isArray(sp.skus) ? sp.skus.join(', ') : '';
    return (
      '<div class="field" style="margin-bottom:8px"><label>Spotlight — SKU (virgül)</label><input id="v-spot-sku" value="' +
      esc(skuStr) +
      '" placeholder="Boş = otomatik" style="width:100%;font-family:var(--mono);font-size:11px"></div>'
    );
  }

  function collectRailsToCfg() {
    vitrinCfg.rails = vitrinCfg.rails || {};
    document.querySelectorAll('.v-rail-sku').forEach(function (inp) {
      var key = inp.dataset.rail;
      if (!key) return;
      var skus = inp.value
        .split(/[,;\n]+/)
        .map(function (s) {
          return s.trim();
        })
        .filter(Boolean);
      vitrinCfg.rails[key] = { mode: skus.length ? 'skus' : 'auto', skus: skus, limit: 18 };
    });
    var sp = document.getElementById('v-spot-sku');
    if (sp) {
      var s2 = sp.value
        .split(/[,;\n]+/)
        .map(function (s) {
          return s.trim();
        })
        .filter(Boolean);
      vitrinCfg.spotlight = { mode: s2.length ? 'skus' : 'auto', skus: s2, limit: 8 };
    }
    vitrinCfg.heroSlides = collectSlides();
  }

  var g = typeof window !== 'undefined' ? window : self;
  g.loadVitrinAdmin = loadVitrinAdmin;
  g.saveVitrinAdmin = saveVitrinAdmin;
  g.renderVitrinAdmin = renderVitrinAdmin;

  document.addEventListener('click', function (e) {
    var tab = e.target.closest && e.target.closest('.etab[data-et-vitrin]');
    if (tab) setTimeout(loadVitrinAdmin, 0);
  });
})();
