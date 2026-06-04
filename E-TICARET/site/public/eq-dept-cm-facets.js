/**
 * Cafemarkt tarzı departman filtreleri sol filtre (Kategoriler, Marka, Model, Enerji, Fiyat).
 */
(function (global) {
  'use strict';

  function __facetT(k, fb, vars) {
    var s = fb || k;
    try {
      if (typeof global.eqT === 'function') {
        var v = global.eqT(k, null);
        if (v != null && v !== k) s = v;
      }
    } catch (_) {}
    if (vars) {
      Object.keys(vars).forEach(function (kk) {
        var val = vars[kk];
        s = String(s).replace(new RegExp('\\{' + kk + '\\}', 'g'), val);
      });
    }
    return s;
  }

  function tipNavSubKey(tipId) {
    if (!tipId) return '';
    return 'nav.sub.' + String(tipId).replace(/-/g, '_');
  }

  function energyFacetLabel(e) {
    if (!e || !e.id) return '';
    return __facetT('plp.energy_' + e.id, e.label);
  }

  function priceLocale() {
    return global.eqLang === 'en' ? 'en-US' : 'tr-TR';
  }

  var ENERGY_TYPES = [
    { id: 'elektrik', label: 'Elektrikli', keys: ['elektrikli', 'elektrik', 'electric'] },
    { id: 'dogalgaz', label: 'Doğalgazlı', keys: ['doğalgaz', 'dogalgaz', 'doğal gaz', 'dogal gaz'] },
    { id: 'gazli', label: 'Gazlı', keys: ['gazlı', 'gazli'] },
    { id: 'lpg', label: 'LPG', keys: ['lpg', 'tüp gaz', 'tup gaz'] },
    { id: 'induksiyon', label: 'İndüksiyonlu', keys: ['indüksiyon', 'induksiyon', 'induction'] },
  ];

  var MODEL_CAP = 48;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/"/g, '&quot;');
  }

  function lc(s) {
    return String(s || '').toLocaleLowerCase('tr');
  }

  function parsePriceNum(p) {
    var s = String(p || '').replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '');
    var n = parseFloat(s);
    return isNaN(n) ? 0 : n;
  }

  function extractModel(name, brand) {
    var n = String(name || '').trim();
    var b = String(brand || '').trim();
    var crm = n.match(/(?:SOĞUK\s+ODA|COLD\s+ROOM)\s+(\d{3})[×x*]/i);
    if (crm) return 'ROOM ' + crm[1];
    if (b && n.indexOf(b) === 0) n = n.slice(b.length).trim();
    if (n.indexOf(' - ') > 0) n = n.split(' - ')[0].trim();
    var m = n.match(/\b([A-Z]{1,4}[\s-]?\d{2,5}[\w./-]*)\b/);
    if (m) return m[1].replace(/\s+/g, ' ').trim();
    m = n.match(/\b([A-Z]\d{2,}[\w.-]*)\b/);
    if (m) return m[1].trim();
    m = n.match(/\b([A-Z]{2,}\d+[A-Z0-9.-]*)\b/i);
    return m ? m[1].trim() : '';
  }

  /** Öztiryakiler bayi kataloğunda üretici adı ürün adının başında (Rational, Unox, …). */
  var OEM_RESELLER = /^öztiryakiler(?:\s+endüstriyel\s+mutfak)?$/i;
  var OEM_PREFIXES_BASE = [
    'Electrolux Professional',
    'ROBOT COUPE',
    'Rational',
    'Winterhalter',
    'Hobart',
    'Hoshizaki',
    'HOSHIZAKI',
    'Unox',
    'WMF',
    'Nuova Simonelli',
    'NUOVA SIMONELLI',
    'NUOSI',
    'Bravilor Bonamat',
    'BRAVILOR',
    'Ateşe',
    'ATS',
    'FAC',
    'SANTOS',
    'Electrolux',
    'ELECTROLUX',
    'İnoksan',
    'Inoksan',
    'Zanussi',
    'SIMAG',
    'Simag',
    'Vitrifrigo',
    'VITRIFRIGO',
    'Berkel',
    'BERKEL',
    'Dualit',
    'DUALIT',
    'MenuMaster',
    'MENUMaster',
    'Imperia',
    'IMPERIA',
    'Hamilton Beach',
    'HAMILTON BEACH',
    'Swedlinghaus',
    'Vesta',
    'Bartscher',
    'Copmak',
    'COPMAK',
    'Blanco',
    'BLANCO',
    'Alkan',
    'ALKAN',
    'Tribeca',
    'TRIBECA',
    'Fantom',
    'FANTOM',
    'PlateMate',
    'PLATEMATE',
    'OKY',
    'AMX',
    'OEK',
    'GIA',
    'Lava',
    'LAVA',
    'OBA',
  ];
  /** Katalog / fiyat listesi yazımı → filtre etiketi */
  var OEM_LABEL_CANON = {
    wmf: 'WMF',
    'nuova simonelli': 'Nuova Simonelli',
    nuosi: 'Nuova Simonelli',
    bravilor: 'Bravilor Bonamat',
    'bravilor bonamat': 'Bravilor Bonamat',
    ateşe: 'Ateşe',
    atese: 'Ateşe',
    ats: 'Ateşe',
    simag: 'SIMAG',
    hoshizaki: 'Hoshizaki',
    vitrifrigo: 'Vitrifrigo',
    berkel: 'Berkel',
    dualit: 'Dualit',
    menumaster: 'MenuMaster',
    imperia: 'Imperia',
    'hamilton beach': 'Hamilton Beach',
    swedlinghaus: 'Swedlinghaus',
    vesta: 'Vesta',
    bartscher: 'Bartscher',
    copmak: 'Copmak',
    blanco: 'Blanco',
    alkan: 'Alkan',
    tribeca: 'Tribeca',
    fantom: 'Fantom',
    platemate: 'PlateMate',
    oky: 'OKY',
    amx: 'AMX',
    oek: 'OEK',
    gia: 'GIA',
    lava: 'Lava',
    oba: 'OBA',
    fac: 'FAC',
    santos: 'SANTOS',
  };
  /** Kısa önekler yalnızca ad başında; uzun markalar ad içinde de aranır. */
  var OEM_WORD_BOUNDARY_MIN = 4;
  var oemPrefixCache = null;

  function normalizeOemLabel(prefix) {
    var key = lc(String(prefix || '').trim());
    if (OEM_LABEL_CANON[key]) return OEM_LABEL_CANON[key];
    return String(prefix || '').trim();
  }

  function oemNamePrefixes() {
    if (oemPrefixCache) return oemPrefixCache;
    var seen = {};
    var list = [];
    function add(n) {
      n = String(n || '').trim();
      if (!n || OEM_RESELLER.test(lc(n)) || seen[n]) return;
      seen[n] = true;
      list.push(n);
    }
    OEM_PREFIXES_BASE.forEach(add);
    [global.__EQUSTO_FACET_OEM_MARKALAR, global.__EQUSTO_MARKA_BOYUT_SIRASI, global.__EQUSTO_REF_MARKALAR_SIRASI].forEach(
      function (arr) {
        if (arr && Array.isArray(arr)) arr.forEach(add);
      }
    );
    list.sort(function (a, b) {
      return b.length - a.length;
    });
    oemPrefixCache = list;
    return list;
  }

  /** Filtre etiketi: «Atalay Endüstriyel…» → «Atalay», «Öztiryakiler Endüstriyel…» → «Öztiryakiler». */
  function canonicalFacetBrand(brand) {
    var b = String(brand || '').trim();
    if (!b) return '';
    var bl = lc(b);
    if (bl.indexOf('atalay') === 0) return 'Atalay';
    if (bl.indexOf('oztiryakiler') === 0 || bl.indexOf('öztiryakiler') === 0) return 'Öztiryakiler';
    if (bl.indexOf('proso') === 0) return 'Proso';
    if (bl.indexOf('caglayan') === 0 || bl.indexOf('çağlayan') === 0) return 'Çağlayan';
    return b;
  }

  function facetBrandKey(brand) {
    return canonicalFacetBrand(brand) || String(brand || '').trim();
  }

  /** Tek marka seçiliyken kategori etiketinden marka önekini düşür (ör. «Proso Sütlükler» → «Sütlükler»). */
  function facetTileDisplayLabel(label, state, tileId) {
    var text = String(label || '').trim();
    if (tileId && global.eqLang === 'en' && typeof global.eqT === 'function') {
      var subKey = tipNavSubKey(tileId);
      var tr = global.eqT(subKey, null);
      if (tr != null && tr !== subKey) text = tr;
    }
    var brands = state && state.brands ? state.brands : [];
    if (brands.length !== 1 || !text) return text;
    var b = facetBrandKey(brands[0]);
    if (!b) return text;
    var re = new RegExp('^' + b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s+', 'i');
    var out = text.replace(re, '').trim();
    return out || text;
  }

  function stripOztiLeadName(name) {
    var n = String(name || '').trim();
    var m = n.match(
      /^(?:ÖZTİRYAKİLER|OZTIRYAKILER|Öztiryakiler|Oztiryakiler)(?:\s+(?:Endüstriyel\s+Mutfak|ENDÜSTRIYEL\s+MUTFAK|Endustriyel\s+Mutfak|ENDUSTRIYEL\s+MUTFAK))?\s+/i
    );
    if (m) return n.slice(m[0].length).trim();
    return n;
  }

  function oemWordRe(prefix) {
    var pu = String(prefix || '').trim();
    if (!pu) return null;
    var esc = pu.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp('(^|\\s)' + esc + '(\\s|$|[./,-])', 'i');
  }

  function prefixMatchesOemName(prefix, nl, nu) {
    var pl = lc(prefix);
    if (!pl) return false;
    if (nl.indexOf(pl) === 0) return true;
    if (pl.length >= OEM_WORD_BOUNDARY_MIN || pl.indexOf(' ') >= 0) {
      var re = oemWordRe(prefix);
      return !!(re && re.test(nu));
    }
    return false;
  }

  function findOemBrandInName(name) {
    var n = String(name || '').trim();
    if (!n) return '';
    var scan = stripOztiLeadName(n);
    var namesToTry = scan === n ? [n] : [scan, n];
    var prefixes = oemNamePrefixes();
    for (var ni = 0; ni < namesToTry.length; ni++) {
      var nl = lc(namesToTry[ni]);
      var nu = namesToTry[ni].toLocaleUpperCase('tr');
      if (/\bRATIONAL\b/.test(nu)) return 'Rational';
      for (var pi = 0; pi < prefixes.length; pi++) {
        var p = prefixes[pi];
        if (prefixMatchesOemName(p, nl, nu)) return normalizeOemLabel(p);
      }
    }
    return '';
  }

  function resolveFacetBrand(brand, name, sku) {
    var raw = String(brand || '').trim();
    if (!raw) return '';
    var n = String(name || '').trim();
    var kod = String(sku || '').trim();
    if (OEM_RESELLER.test(lc(raw)) && (n || kod)) {
      if (/^9890\.|^5RRX\./i.test(kod)) return 'Rational';
      if (/^9912\.|^9805\.(SDE|SV|SPN)/i.test(kod) && /\bSIMAG\b/i.test(n.toLocaleUpperCase('tr'))) return 'SIMAG';
      var oem = findOemBrandInName(n);
      if (oem) return facetBrandKey(oem);
    }
    return facetBrandKey(raw);
  }

  function productBrand(u) {
    if (!u) return '';
    if (window.EqDeptTips && typeof window.EqDeptTips.isSogukOdaProduct === 'function' && window.EqDeptTips.isSogukOdaProduct(u)) {
      return '';
    }
    var fb = String((u.fb || '')).trim();
    if (fb) return facetBrandKey(fb);
    var sku = u.raw && (u.raw.sku || u.raw.urun_kodu || u.raw.model);
    return facetBrandKey(resolveFacetBrand(u.b, u.n, sku));
  }

  function matchEnergy(u, energyId) {
    var row = null;
    for (var i = 0; i < ENERGY_TYPES.length; i++) {
      if (ENERGY_TYPES[i].id === energyId) {
        row = ENERGY_TYPES[i];
        break;
      }
    }
    if (!row) return false;
    var hay = lc(u.n) + ' ' + lc((u.raw && u.raw.specs) || '');
    for (var k = 0; k < row.keys.length; k++) {
      if (hay.indexOf(lc(row.keys[k])) !== -1) return true;
    }
    return false;
  }

  function mount(host, opts) {
    if (!host) return;
    opts = opts || {};
    var showEnergy = opts.showEnergy === true || opts.dept === 'pisirme';
    var all = opts.allProducts || [];
    var state = opts.state || {};
    var tiles = opts.tiles || [];
    var tileMatch = opts.tileMatch;
    var getPool = opts.getPoolForCounts || function () {
      return all;
    };
    var onChange = typeof opts.onChange === 'function' ? opts.onChange : function () {};
    var activeTiles = Array.isArray(state.activeTiles)
      ? state.activeTiles
      : state.activeTile
        ? [state.activeTile]
        : [];

    function tallyCounts(pool) {
      var brandCounts = {};
      var modelCounts = {};
      var energyCounts = {};
      var priceMinAll = Infinity;
      var priceMaxAll = 0;
      pool.forEach(function (u) {
        var b = productBrand(u);
        if (b) brandCounts[b] = (brandCounts[b] || 0) + 1;
        var model = extractModel(u.n, u.b);
        if (model) modelCounts[model] = (modelCounts[model] || 0) + 1;
        ENERGY_TYPES.forEach(function (e) {
          if (matchEnergy(u, e.id)) energyCounts[e.id] = (energyCounts[e.id] || 0) + 1;
        });
        var pr = parsePriceNum(u.p);
        if (pr > 0) {
          if (pr < priceMinAll) priceMinAll = pr;
          if (pr > priceMaxAll) priceMaxAll = pr;
        }
      });
      if (!isFinite(priceMinAll)) priceMinAll = 0;
      return { brandCounts: brandCounts, modelCounts: modelCounts, energyCounts: energyCounts, priceMinAll: priceMinAll, priceMaxAll: priceMaxAll };
    }

    var brandTally = tallyCounts(getPool('brand'));
    var modelTally = tallyCounts(getPool('model'));
    var energyTally = tallyCounts(getPool('energy'));
    var priceTally = tallyCounts(getPool('price'));
    var brandCounts = brandTally.brandCounts;
    var modelCounts = modelTally.modelCounts;
    var energyCounts = energyTally.energyCounts;
    var priceMinAll = priceTally.priceMinAll;
    var priceMaxAll = priceTally.priceMaxAll;

    var brands = Object.keys(brandCounts);
    (state.brands || []).forEach(function (b) {
      var k = facetBrandKey(b);
      if (k && brands.indexOf(k) < 0) brands.push(k);
    });
    brands.sort(function (a, b) {
      return (brandCounts[b] || 0) - (brandCounts[a] || 0);
    });
    var curated = null;
    if (global.__EQUSTO_MARKA_BOYUT_SIRASI && Array.isArray(global.__EQUSTO_MARKA_BOYUT_SIRASI)) {
      curated = {};
      global.__EQUSTO_MARKA_BOYUT_SIRASI.forEach(function (k, i) {
        k = String(k || '').trim();
        if (k) curated[k] = i;
      });
      brands.sort(function (a, b) {
        var ia = Object.prototype.hasOwnProperty.call(curated, a) ? curated[a] : 1e9;
        var ib = Object.prototype.hasOwnProperty.call(curated, b) ? curated[b] : 1e9;
        if (ia !== ib) return ia - ib;
        return brandCounts[b] - brandCounts[a];
      });
    }

    var models = Object.keys(modelCounts)
      .sort(function (a, b) {
        return modelCounts[b] - modelCounts[a];
      })
      .slice(0, MODEL_CAP);

    var tilePool = getPool('tile');
    var tileItems = [];
    tiles.forEach(function (tile) {
      if (!tile || !tile.id) return;
      var n = 0;
      tilePool.forEach(function (u) {
        if (tileMatch && tileMatch(u, tile)) n++;
      });
      if (n) tileItems.push({ tile: tile, count: n });
    });

    var html = '';

    html += '<div class="eq-cm-selected" id="eq-dept-cm-selected" hidden>';
    html += '<div class="eq-cm-selected__hd">' + esc(__facetT('plp.facet_selected', 'Seçilen Filtreler')) + '</div>';
    html += '<div class="eq-cm-selected__chips" id="eq-dept-cm-chips"></div>';
    html +=
      '<button type="button" class="eq-cm-selected__clear" id="eq-dept-cm-clear-all">' +
      esc(__facetT('plp.facet_clear_all', 'HEPSİNİ SİL')) +
      '</button></div>';

    if (tileItems.length) {
      html +=
        '<details class="eq-cm-facet" open><summary class="eq-cm-facet__hd">' +
        esc(__facetT('plp.facet_categories', 'Kategoriler')) +
        '</summary><div class="eq-cm-facet__body"><ul class="eq-cm-facet__list">';
      tileItems.forEach(function (row) {
        var tid = row.tile.id;
        var checked = activeTiles.indexOf(tid) >= 0 ? ' checked' : '';
        html +=
          '<li class="eq-cm-facet__item"><label class="eq-cm-facet__label">' +
          '<input type="checkbox" name="eq-dept-cm-cat" value="' +
          esc(tid) +
          '"' +
          checked +
          '><span>' +
          esc(facetTileDisplayLabel(row.tile.label, state, row.tile.id)) +
          '</span><span class="eq-cm-facet__count">(' +
          row.count +
          ')</span></label></li>';
      });
      html += '</ul></div></details>';
    }

    var energyRows = ENERGY_TYPES.filter(function (e) {
      return energyCounts[e.id] > 0;
    });
    if (showEnergy && energyRows.length) {
      html +=
        '<details class="eq-cm-facet" open><summary class="eq-cm-facet__hd">' +
        esc(__facetT('plp.facet_energy', 'Enerji / Yakıt')) +
        '</summary><div class="eq-cm-facet__body"><ul class="eq-cm-facet__list">';
      energyRows.forEach(function (e) {
        var checked = (state.energy || []).indexOf(e.id) >= 0 ? ' checked' : '';
        html +=
          '<li class="eq-cm-facet__item"><label class="eq-cm-facet__label">' +
          '<input type="checkbox" name="eq-dept-cm-energy" value="' +
          esc(e.id) +
          '"' +
          checked +
          '><span>' +
          esc(energyFacetLabel(e)) +
          '</span><span class="eq-cm-facet__count">(' +
          energyCounts[e.id] +
          ')</span></label></li>';
      });
      html += '</ul></div></details>';
    }

    html +=
      '<details class="eq-cm-facet" open><summary class="eq-cm-facet__hd">' +
      esc(__facetT('plp.facet_brand', 'Marka')) +
      '</summary>' +
      '<div class="eq-cm-facet__body">' +
      '<input type="search" class="eq-cm-facet__search" id="eq-dept-cm-brand-q" placeholder="' +
      esc(__facetT('plp.facet_brand_ph', 'Marka ara')) +
      '" autocomplete="off">' +
      '<ul class="eq-cm-facet__list" id="eq-dept-cm-brand-list">';
    brands.slice(0, 80).forEach(function (b) {
      var label = facetBrandKey(b);
      var checked =
        (state.brands || []).some(function (sb) {
          return facetBrandKey(sb) === label;
        })
          ? ' checked'
          : '';
      html +=
        '<li class="eq-cm-facet__item" data-brand-label="' +
        esc(lc(label)) +
        '"><label class="eq-cm-facet__label">' +
        '<input type="checkbox" name="eq-dept-cm-brand" value="' +
        esc(label) +
        '"' +
        checked +
        '><span>' +
        esc(label) +
        '</span><span class="eq-cm-facet__count">(' +
        brandCounts[b] +
        ')</span></label></li>';
    });
    html += '</ul></div></details>';

    if (models.length) {
      html +=
        '<details class="eq-cm-facet" open><summary class="eq-cm-facet__hd">' +
        esc(__facetT('plp.facet_model', 'Model')) +
        '</summary>' +
        '<div class="eq-cm-facet__body">' +
        '<input type="search" class="eq-cm-facet__search" id="eq-dept-cm-model-q" placeholder="' +
        esc(__facetT('plp.facet_model_ph', 'Model ara')) +
        '" autocomplete="off">' +
        '<ul class="eq-cm-facet__list" id="eq-dept-cm-model-list">';
      models.forEach(function (m) {
        var checked = (state.models || []).indexOf(m) >= 0 ? ' checked' : '';
        html +=
          '<li class="eq-cm-facet__item" data-model-label="' +
          esc(lc(m)) +
          '"><label class="eq-cm-facet__label">' +
          '<input type="checkbox" name="eq-dept-cm-model" value="' +
          esc(m) +
          '"' +
          checked +
          '><span>' +
          esc(m) +
          '</span><span class="eq-cm-facet__count">(' +
          modelCounts[m] +
          ')</span></label></li>';
      });
      html += '</ul></div></details>';
    }

    html +=
      '<details class="eq-cm-facet" open><summary class="eq-cm-facet__hd">' +
      esc(__facetT('plp.facet_price', 'Fiyat')) +
      '</summary>' +
      '<div class="eq-cm-facet__body">' +
      '<div class="eq-cm-facet__price-row">' +
      '<input type="number" id="eq-dept-cm-price-min" min="0" step="1" placeholder="Min" value="' +
      (state.priceMin !== '' && state.priceMin != null ? esc(String(state.priceMin)) : '') +
      '"><span>–</span>' +
      '<input type="number" id="eq-dept-cm-price-max" min="0" step="1" placeholder="Max" value="' +
      (state.priceMax !== '' && state.priceMax != null ? esc(String(state.priceMax)) : '') +
      '"></div>' +
      '<button type="button" class="eq-cm-facet__apply" id="eq-dept-cm-price-apply">' +
      esc(__facetT('plp.facet_apply', 'Seçimi Filtrele')) +
      '</button>';
    if (priceMaxAll > 0) {
      html +=
        '<p class="eq-cm-facet__range-hint">' +
        esc(Math.floor(priceMinAll).toLocaleString(priceLocale())) +
        ' – ' +
        esc(Math.ceil(priceMaxAll).toLocaleString(priceLocale())) +
        ' TL</p>';
    }
    html += '</div></details>';

    host.innerHTML = html;

    function bindSearch(inputId, listId, attr) {
      var inp = host.querySelector(inputId);
      if (!inp) return;
      inp.addEventListener('input', function () {
        var q = inp.value.trim().toLowerCase();
        host.querySelectorAll(listId + ' [' + attr + ']').forEach(function (li) {
          var lbl = li.getAttribute(attr) || '';
          li.style.display = !q || lbl.indexOf(q) >= 0 ? '' : 'none';
        });
      });
    }
    bindSearch('#eq-dept-cm-brand-q', '#eq-dept-cm-brand-list', 'data-brand-label');
    bindSearch('#eq-dept-cm-model-q', '#eq-dept-cm-model-list', 'data-model-label');

    host.querySelectorAll('input[name="eq-dept-cm-cat"]').forEach(function (inp) {
      inp.addEventListener('change', function () {
        state.activeTiles = [];
        host.querySelectorAll('input[name="eq-dept-cm-cat"]:checked').forEach(function (c) {
          state.activeTiles.push(c.value);
        });
        onChange('tile');
      });
    });

    host.querySelectorAll('input[name="eq-dept-cm-brand"]').forEach(function (inp) {
      inp.addEventListener('change', function () {
        state.brands = [];
        host.querySelectorAll('input[name="eq-dept-cm-brand"]:checked').forEach(function (c) {
          state.brands.push(c.value);
        });
        onChange('brand');
      });
    });

    host.querySelectorAll('input[name="eq-dept-cm-model"]').forEach(function (inp) {
      inp.addEventListener('change', function () {
        state.models = [];
        host.querySelectorAll('input[name="eq-dept-cm-model"]:checked').forEach(function (c) {
          state.models.push(c.value);
        });
        onChange('model');
      });
    });

    host.querySelectorAll('input[name="eq-dept-cm-energy"]').forEach(function (inp) {
      inp.addEventListener('change', function () {
        state.energy = [];
        host.querySelectorAll('input[name="eq-dept-cm-energy"]:checked').forEach(function (c) {
          state.energy.push(c.value);
        });
        onChange('energy');
      });
    });

    var applyPrice = host.querySelector('#eq-dept-cm-price-apply');
    if (applyPrice) {
      applyPrice.addEventListener('click', function () {
        var mn = host.querySelector('#eq-dept-cm-price-min');
        var mx = host.querySelector('#eq-dept-cm-price-max');
        state.priceMin = mn && mn.value !== '' ? Number(mn.value) : '';
        state.priceMax = mx && mx.value !== '' ? Number(mx.value) : '';
        onChange('price');
      });
    }

    var clearAll = host.querySelector('#eq-dept-cm-clear-all');
    if (clearAll) {
      clearAll.addEventListener('click', function () {
        onChange('clear');
      });
    }
  }

  function renderSelectedChips(container, state, tiles, tileMatch, onRemove) {
    if (!container) return;
    var chips = [];
    var activeTiles = Array.isArray(state.activeTiles)
      ? state.activeTiles
      : state.activeTile
        ? [state.activeTile]
        : [];
    activeTiles.forEach(function (tid) {
      var label = tid;
      for (var i = 0; i < tiles.length; i++) {
        if (tiles[i].id === tid) {
          label = facetTileDisplayLabel(tiles[i].label, state, tid);
          break;
        }
      }
      chips.push({ type: 'tile', value: tid, text: label });
    });
    (state.brands || []).forEach(function (b) {
      var label = facetBrandKey(b);
      chips.push({ type: 'brand', value: label, text: label });
    });
    (state.models || []).forEach(function (m) {
      chips.push({ type: 'model', value: m, text: m });
    });
    (state.energy || []).forEach(function (eid) {
      var lbl = eid;
      ENERGY_TYPES.forEach(function (e) {
        if (e.id === eid) lbl = energyFacetLabel(e);
      });
      chips.push({ type: 'energy', value: eid, text: lbl });
    });
    if (state.priceMin !== '' && state.priceMin != null) {
      chips.push({
        type: 'priceMin',
        value: state.priceMin,
        text: __facetT('plp.chip_price_min', 'Min {n} TL', { n: state.priceMin }),
      });
    }
    if (state.priceMax !== '' && state.priceMax != null) {
      chips.push({
        type: 'priceMax',
        value: state.priceMax,
        text: __facetT('plp.chip_price_max', 'Max {n} TL', { n: state.priceMax }),
      });
    }

    var wrap = container.closest('.eq-cm-selected');
    if (!wrap) return;
    if (!chips.length) {
      wrap.hidden = true;
      container.innerHTML = '';
      return;
    }
    wrap.hidden = false;
    container.innerHTML = chips
      .map(function (c) {
        return (
          '<button type="button" class="eq-cm-chip" data-chip-type="' +
          esc(c.type) +
          '" data-chip-value="' +
          esc(c.value) +
          '">' +
          esc(c.text) +
          ' <span aria-hidden="true">×</span></button>'
        );
      })
      .join('');
    container.querySelectorAll('.eq-cm-chip').forEach(function (btn) {
      btn.addEventListener('click', function () {
        onRemove(btn.getAttribute('data-chip-type'), btn.getAttribute('data-chip-value'));
      });
    });
  }

  global.EqDeptCmFacets = {
    mount: mount,
    renderSelectedChips: renderSelectedChips,
    extractModel: extractModel,
    matchEnergy: matchEnergy,
    parsePriceNum: parsePriceNum,
    resolveFacetBrand: resolveFacetBrand,
    facetBrandKey: facetBrandKey,
    facetTileDisplayLabel: facetTileDisplayLabel,
    canonicalFacetBrand: canonicalFacetBrand,
    productBrand: productBrand,
  };
})(typeof window !== 'undefined' ? window : global);
