;(function () {
  'use strict';

  var _catalogBundle = null;
  var _fiyatMap = null;

  function getFiyatMap() {
    return _fiyatMap || window.PFOS_EQ_FIYATLAR || {};
  }

  /** Net birim fiyat (TRY, KDV hariç) — öncelik: API fiyat listesi → katalog unit_price_try */
  function resolveProductUnitTry(product) {
    var p = product || {};
    var tip = String(p.tip_kodu || '').trim();
    var map = getFiyatMap();
    if (tip && Number(map[tip]) > 0) {
      return { birim: Math.round(Number(map[tip])), kaynak: 'fiyat_listesi' };
    }
    if (Number(p.unit_price_try) > 0) {
      return {
        birim: Math.round(Number(p.unit_price_try)),
        kaynak: p.price_source || 'katalog_try',
      };
    }
    return { birim: 0, kaynak: 'eksik' };
  }

  function hydrateCatalogPrices(fiyatMap) {
    _fiyatMap = fiyatMap && typeof fiyatMap === 'object' ? fiyatMap : null;
    if (!_catalogBundle || !_catalogBundle.catalog) return;
    Object.keys(_catalogBundle.catalog).forEach(function (zk) {
      var block = _catalogBundle.catalog[zk];
      if (!block || !block.products) return;
      block.products.forEach(function (p) {
        var pr = resolveProductUnitTry(p);
        if (pr.birim > 0) {
          p.unit_price_try = pr.birim;
          p.price_source = pr.kaynak;
          delete p.unit_price_eur;
        }
      });
    });
  }

  function clamp(min, val, max) {
    var lo = min != null ? min : 1;
    var hi = max != null && isFinite(max) ? max : Infinity;
    return Math.min(hi, Math.max(lo, val));
  }

  function isSingletonM2(m2PerUnit) {
    return m2PerUnit == null || m2PerUnit === '' || !isFinite(Number(m2PerUnit)) || Number(m2PerUnit) <= 0;
  }

  /** Kategori m² — toplam m² × sabit pay (seçim sayısından bağımsız) */
  function categoryM2(totalM2, catKey) {
    var meta = getCategoryMeta(catKey);
    var share = meta && meta.share != null ? meta.share : 0.1;
    return Math.max(0, Math.round(Number(totalM2) * share));
  }

  function getCategoryMeta(catKey) {
    if (!_catalogBundle || !_catalogBundle.categories) return null;
    return _catalogBundle.categories[catKey] || null;
  }

  function getZoneDefsFromCatalog() {
    if (!_catalogBundle || !_catalogBundle.categories) return [];
    return Object.keys(_catalogBundle.categories).map(function (key) {
      var c = _catalogBundle.categories[key];
      return {
        key: key,
        name: c.name || key,
        icon: c.icon || '📦',
        color: c.color || '#888',
        share: c.share != null ? c.share : 0.1,
      };
    });
  }

  function qtyForProduct(catM2, product) {
    var p = product || {};
    var minQ = p.min_qty != null ? p.min_qty : 1;
    var maxQ = p.max_qty != null ? p.max_qty : Infinity;
    if (isSingletonM2(p.m2_per_unit)) {
      return clamp(minQ, minQ, maxQ);
    }
    var raw = Number(catM2) / Number(p.m2_per_unit);
    var q = Math.ceil(raw);
    if (!q || q < 1) q = minQ;
    return clamp(minQ, q, maxQ);
  }

  function sortRowsZrnFirst(rows) {
    return rows.slice().sort(function (a, b) {
      var ca = a.tag === 'OPS' ? 1 : 0;
      var cb = b.tag === 'OPS' ? 1 : 0;
      return ca - cb;
    });
  }

  /**
   * PFOS referans algoritması — katalog birincil, kod ikincil.
   * @param {number} totalM2
   * @param {string[]} selectedCategories
   * @returns {{ categories: Array, kpis: Object }}
   */
  function isDilimlemeProduct(p) {
    var tip = String((p && p.tip_kodu) || '').toLowerCase();
    if (tip === 'dilimleme_makinesi' || tip === 'dilimleme-makinesi') return true;
    var name = String((p && p.name) || '').toLowerCase();
    return name.indexOf('dilimleme') >= 0;
  }

  function isSarkuteriQuoteOpts(opts) {
    if (!opts || typeof opts !== 'object') return false;
    if (opts.sarkuteri === true) return true;
    var d = String(opts.dukkan || '').toLowerCase();
    var k = String(opts.konsept || '').toLowerCase();
    return (
      d.indexOf('şarküteri') >= 0 ||
      d.indexOf('sarkuteri') >= 0 ||
      k === 'şarküteri' ||
      k === 'sarkuteri' ||
      k === 'kasap'
    );
  }

  /** Sebze: asla; et: yalnız şarküteri/kasap zorunlu; diğer zone: yok */
  function productAllowedInZone(catKey, p, opts) {
    if (isDilimlemeProduct(p)) {
      if (catKey === 'sebze_hazirlik') return false;
      if (catKey === 'et_hazirlik') return isSarkuteriQuoteOpts(opts);
      return false;
    }
    var tag = p.classification || p.tag || 'ZRN';
    if (tag === 'OPS') return false;
    return true;
  }

  function isDilimlemeRow(r) {
    var tip = String((r && (r.tip_kodu || r.pfosUrunTipi)) || '').toLowerCase();
    if (tip === 'dilimleme_makinesi' || tip === 'dilimleme-makinesi') return true;
    return String((r && r.ad) || '').toLowerCase().indexOf('dilimleme') >= 0;
  }

  function applyDilimlemeZoneRules(rows, opts) {
    return (rows || []).filter(function (r) {
      if (!isDilimlemeRow(r)) return true;
      var zk =
        r.pfZone ||
        (typeof rowZone === 'function' ? rowZone(r) : '') ||
        'ana_mutfak';
      if (zk === 'sebze_hazirlik') return false;
      if (zk === 'et_hazirlik') return isSarkuteriQuoteOpts(opts);
      return false;
    });
  }

  function generateQuote(totalM2, selectedCategories, bolumM2Map, quoteOpts) {
    var m2 = Number(totalM2) || 0;
    if (m2 > 0 && m2 < 20) m2 = 20;
    var keys = (selectedCategories && selectedCategories.length
      ? selectedCategories.slice()
      : defaultZoneKeys()
    ).filter(Boolean);
    var bolumM2 =
      bolumM2Map && typeof bolumM2Map === 'object' ? bolumM2Map : null;
    var opts = quoteOpts && typeof quoteOpts === 'object' ? quoteOpts : null;

    var out = { categories: [], kpis: {} };
    var catalog = (_catalogBundle && _catalogBundle.catalog) || {};

    keys.forEach(function (catKey) {
      var meta = getCategoryMeta(catKey) || { name: catKey, share: 0.1 };
      var catM2 = categoryM2(m2, catKey);
      if (bolumM2 && Number(bolumM2[catKey]) > 0) {
        catM2 = Math.round(Number(bolumM2[catKey]));
      }
      var catProducts = (catalog[catKey] && catalog[catKey].products) || [];
      var rows = [];

      catProducts.forEach(function (p) {
        if (!productAllowedInZone(catKey, p, opts)) return;
        var tag = p.classification || p.tag || 'ZRN';
        if (isDilimlemeProduct(p) && catKey === 'et_hazirlik') tag = 'ZRN';
        var qty = qtyForProduct(catM2, p);
        rows.push({
          id: p.id || '',
          tip_kodu: p.tip_kodu || '',
          tag: tag,
          name: p.name || '',
          marka: p.marka || parseMarkaFromName(p.name),
          dim: p.dimensions || p.dim || '',
          qty: qty,
          unit: 0,
          unit_try: 0,
          price_source: 'eticaret',
          total: 0,
          m2_per_unit: p.m2_per_unit,
          elk: Number(p.elk_kw) || 0,
          gaz: Number(p.gaz_kw) || 0,
          imageUrl: p.imageUrl || (p.images && p.images[0]) || '',
        });
      });

      rows = sortRowsZrnFirst(rows);
      var zrnCount = rows.filter(function (r) {
        return r.tag === 'ZRN';
      }).length;
      var opsCount = rows.filter(function (r) {
        return r.tag === 'OPS';
      }).length;
      var catTotal = rows.reduce(function (s, r) {
        return s + r.total;
      }, 0);

      out.categories.push({
        key: catKey,
        label: meta.name || catKey,
        icon: meta.icon || '📦',
        color: meta.color || '#888',
        m2: catM2,
        zorunlu: zrnCount,
        ops: opsCount,
        zrn_count: zrnCount,
        ops_count: opsCount,
        total: catTotal,
        rows: rows,
      });
    });

    var urunCesidi = 0;
    var toplamAdet = 0;
    var zorunluMin = 0;
    var tahminiTop = 0;
    out.categories.forEach(function (c) {
      urunCesidi += c.rows.length;
      c.rows.forEach(function (r) {
        toplamAdet += r.qty;
        if (r.tag === 'ZRN') zorunluMin += r.total;
        tahminiTop += r.total;
      });
    });

    out.kpis = {
      total_m2: m2,
      kategori: keys.length,
      urun_cesidi: urunCesidi,
      toplam_adet: toplamAdet,
      zorunlu_min: zorunluMin,
      tahmini_toplam: tahminiTop,
      ops_sum: tahminiTop - zorunluMin,
    };

    return out;
  }

  function quoteToRows(quote) {
    var rows = [];
    (quote.categories || []).forEach(function (cat) {
      (cat.rows || []).forEach(function (r, i) {
        var kod = r.id ? 'PFOS-' + r.id : 'PFOS-' + cat.key + '-' + i;
        rows.push({
          kod: kod,
          tip_kodu: r.tip_kodu || '',
          ad: r.name,
          olcu: r.dim || '',
          adet: r.qty,
          birim: 0,
          fiyat_net: false,
          fiyat_kaynak: 'eticaret',
          fiyat_haric: false,
          pfClass: r.tag,
          pfZone: cat.key,
          pfCatM2: cat.m2,
          pfOptional: r.tag === 'OPS',
          lineTotal: 0,
          elk: Number(r.elk) || 0,
          gaz: Number(r.gaz) || 0,
          marka: r.marka || parseMarkaFromName(r.name) || '',
          imageUrl: r.imageUrl || '',
        });
      });
    });
    return rows;
  }

  function zonesFromQuote(quote) {
    return (quote.categories || [])
      .filter(function (c) {
        return c.rows && c.rows.length > 0;
      })
      .map(function (c) {
        return {
          key: c.key,
          label: c.label,
          icon: c.icon,
          color: c.color,
          m2: c.m2,
          zorunlu: c.zorunlu != null ? c.zorunlu : c.zrn_count,
          ops: c.ops != null ? c.ops : c.ops_count,
          total: c.total,
          rows: c.rows.map(function (r) {
            return {
              ad: r.name,
              olcu: r.dim,
              adet: r.qty,
              birim: r.unit,
              pfClass: r.tag,
              lineTotal: r.total,
            };
          }),
        };
      });
  }

  function setCatalog(bundle) {
    _catalogBundle = bundle || null;
  }

  function isCatalogReady() {
    return !!(_catalogBundle && _catalogBundle.categories && _catalogBundle.catalog);
  }

  /** Teklif / Excel bölüm sırası (mutfak projesi akışı) */
  var PFOS_ZONE_ORDER = [
    'ana_mutfak',
    'sebze_hazirlik',
    'et_hazirlik',
    'kuru_depo',
    'soguk_oda',
    'derin_dondurucu',
    'bulasikhane',
    'pastane',
    'bar',
    'acik_bufe',
    'show_mutfagi',
    'izgara_meze',
  ];

  function defaultZoneKeys() {
    return [
      'ana_mutfak',
      'sebze_hazirlik',
      'et_hazirlik',
      'kuru_depo',
      'soguk_oda',
      'derin_dondurucu',
      'bulasikhane',
    ];
  }

  var PFOS_ZONE_DEFS = getZoneDefsFromCatalog();

  var DEPT_TO_ZONE = {
    pisirme: 'ana_mutfak',
    sogutma: 'soguk_oda',
    yikama: 'bulasikhane',
    hazirlik: 'sebze_hazirlik',
    kahve: 'bar',
    diger: 'ana_mutfak',
  };

  var ZONE_TO_DEPT = {
    ana_mutfak: 'pisirme',
    sebze_hazirlik: 'hazirlik',
    et_hazirlik: 'hazirlik',
    kuru_depo: 'sogutma',
    soguk_oda: 'sogutma',
    derin_dondurucu: 'sogutma',
    bulasikhane: 'yikama',
    pastane: 'pisirme',
    bar: 'kahve',
    acik_bufe: 'pisirme',
    show_mutfagi: 'pisirme',
    izgara_meze: 'pisirme',
  };

  function inferHazirlikZone(row) {
    var tip = String((row && row.tip_kodu) || '').toLowerCase();
    var name = String((row && (row.ad || row.pfN || '')) || '').toLowerCase();
    var blob = tip + ' ' + name;
    if (/dilimleme/.test(blob)) return 'et_hazirlik';
    if (/kiyma|kemik|et[\s_-]|meat|steak|testere/.test(blob)) {
      return 'et_hazirlik';
    }
    return 'sebze_hazirlik';
  }

  function inferStorageZone(row) {
    var name = String(
      (row && (row.ad || row.pfN || row.olcu || row.olcuMm || '')) || ''
    ).toLowerCase();
    var tip = String((row && row.tip_kodu) || '').toLowerCase();
    if (/derin|dondurucu|derin_dondurucu|-18|deep\s*fre|deepfrez|sandik\s*tip|sandık\s*tip/.test(name + ' ' + tip)) {
      return 'derin_dondurucu';
    }
    if (/kuru\s*depo|istif\s*raf|ambalaj\s*depo|kuru depo/.test(name)) {
      return 'kuru_depo';
    }
    if (/so[gğ]uk\s*oda|0\/\+5|\+2\/\+8|\+4\/\+12/.test(name)) {
      return 'soguk_oda';
    }
    if (/dik_tip|tezgah_tip|tezgah_alti|buzdolab/.test(tip)) {
      return 'soguk_oda';
    }
    return 'soguk_oda';
  }

  function normalizeZoneKey(key, row) {
    var k = String(key || '').trim();
    if (!k || k === 'hazirlik') return inferHazirlikZone(row || {});
    if (k === 'depolama') return 'kuru_depo';
    return k;
  }

  function zoneOrderIndex(key) {
    var k = normalizeZoneKey(key, {});
    var i = PFOS_ZONE_ORDER.indexOf(k);
    return i >= 0 ? i : 999;
  }

  function sortZones(zones) {
    return (zones || []).slice().sort(function (a, b) {
      return zoneOrderIndex(a.key) - zoneOrderIndex(b.key);
    });
  }

  /** tip_kodu → ekipmanlar.json adında aranacak kelimeler (sync script ile uyumlu) */
  var TIP_SEARCH_TERMS = {
    kombi_firin_6t: ['kombili', 'icombi', 'konveksiyon', 'combi'],
    davlumbaz_duvar: ['davlumbaz', 'duvar'],
    ocak_4gz: ['4', 'gözlü', 'gozlu', 'ocak', 'alevli'],
    tezgah_alti_buz_cek: ['cihazaltı', 'cihaz alti', 'tezgah altı', 'tezgahalti'],
    calisma_tezgahi: ['çalışma tezgah', 'calisma tezgah'],
    tezgah_evyeli: ['evyeli tezgah', 'tek evye', 'çift evye'],
    duvar_rafi: ['duvar raf'],
    dus_sprey: ['duş sprey', 'dus sprey'],
    cop_arabasi: ['çöp', 'cop kova'],
    yer_izgara: ['yer ızgar', 'yer izgar'],
    istif_rafi: ['istif raf', 'istif rafi', 'demonte'],
    tezgah_tip_buzdolabi: ['tezgah tipi buzdolab', 'tezgah tip buzdolab'],
    mikrodalga_firin: ['mikrodalga'],
    servis_rafi: ['servis arab', 'servis raf'],
    fritoz_tek: ['fritöz', 'fritoz'],
    char_broil: ['plate ızgar', 'plate izgar', 'charbroil', 'kontakt ızgar'],
    salamander: ['salamander'],
    tezgah_duz: ['nötr', 'notr', 'ara tezgah'],
    dilimleme_makinesi: ['dilimleme', 'gıda dilimleme', 'gida dilimleme'],
    kiyma_makinesi: ['kıyma', 'kiyma', 'et kıyma'],
    kemik_testere: ['kemik testere', 'kemik tester'],
    vakum_makinesi: ['vakum', 'vakuum'],
    dik_tip_buzdolabi: ['dik tip buzdolab'],
    cop_siyirma_tez: ['sıyırma', 'siyirma', 'bulaşık sıyır'],
    bym_giris_tez: ['makine giriş', 'giris tezgah', 'giriş tezgah'],
    bym_cikis_tez: ['makine çıkış', 'cikis tezgah', 'çıkış tezgah'],
    davlumbaz: ['davlumbaz'],
    evye: ['kazan yıkama', 'kazan evye'],
    bulasik_giyotin_1000: ['giyotin', '1000 tabak', '1000 tb'],
    bulasik_sepet: ['sepet tip', 'kapaklı bulaşık', 'kapakli bulasik'],
    bulasik_tunel: ['tünel', 'tunel tip', 'konveyörlü bulaşık'],
    patates_soyma: ['patates soy', 'soyma makin'],
    depo_dolabi: ['kuru depo', 'depo dolab', 'storeroom'],
    sogutma_tezgah: ['soğutmalı tezgah', 'sogutmali tezgah', 'hazırlık buzdolab'],
    et_teshir_dolabi: ['teşhir dolab', 'teshir dolab', 'vitrin dolab'],
    dry_age_dolabi: ['dry age', 'dry-age', 'dry aged'],
    derin_dondurucu_dik: ['derin dondurucu', 'deep freeze'],
    derin_dondurucu_sandik: ['sandık tip', 'sandik tip', 'chest freezer'],
    spiral_hamur: ['spiral', 'hamur yoğur'],
    hamur_acma: ['hamur aç', 'hamur ac'],
    raf_firin: ['raflı fırın', 'rafli firin', 'pastane fırın'],
    espresso_makinasi: ['espresso', '2 gruplu', '2 grupl'],
    kahve_degirmeni: ['değirmen', 'degirmen', 'kahve öğüt'],
    bar_blender: ['bar blender', 'mikser bar'],
    bar_buzdolabi: ['bar altı', 'bar alti', 'bar buzdolab'],
    buz_makinesi: ['buz makin', 'küp buz', 'kup buz'],
    sarap_dolabi: ['şarap dolab', 'sarap dolab'],
    bardak_yikama: ['bardak yık', 'bardak yik', 'undercounter'],
    benmari_set: ['benmari', 'bain marie', 'sos set'],
    teshir_vitrin: ['teşhir vitrin', 'teshir vitrin', 'soğuk vitrin'],
  };

  /** Marka kilidi yalnızca katalogda doğrulanmış ürünler için */
  var PFOS_TIP_BRAND = {};
  var PFOS_TIP_POWER = {
    kombi_firin_6t: { elk: 11.4, gaz: 0 },
    davlumbaz_duvar: { elk: 2.2, gaz: 0 },
    ocak_4gz: { elk: 0, gaz: 24 },
    fritoz_tek: { elk: 18.5, gaz: 0 },
    char_broil: { elk: 0, gaz: 18 },
    salamander: { elk: 3.6, gaz: 0 },
    bulasik_giyotin_1000: { elk: 8.7, gaz: 0 },
    tezgah_tip_buzdolabi: { elk: 0.32, gaz: 0 },
    dik_tip_buzdolabi: { elk: 0.65, gaz: 0 },
  };

  function parseMarkaFromName(name) {
    var m = String(name || '').match(/\(([^)]+)\)\s*$/);
    return m ? String(m[1]).trim() : '';
  }

  function parseSpecsFromText(text) {
    var s = String(text || '');
    var out = { elk: 0, gaz: 0, enMm: null, boyMm: null, yukMm: null };
    if (!s) return out;
    var elkM =
      s.match(/(?:elektrik|güç|guc|enerji)[^\d]{0,40}?(\d+(?:[.,]\d+)?)\s*kw/i) ||
      s.match(/(\d+(?:[.,]\d+)?)\s*kw\b/i);
    if (elkM) out.elk = parseFloat(String(elkM[1]).replace(',', '.'));
    var gazM =
      s.match(/(?:doğalgaz|dogalgaz|gaz)[^\d]{0,30}?(\d+(?:[.,]\d+)?)\s*kw/i);
    if (gazM) out.gaz = parseFloat(String(gazM[1]).replace(',', '.'));
    var dimM =
      s.match(/(?:ölçü|olcu|ölçüler)[^\d]{0,20}?(\d+(?:[.,]\d+)?)\s*[x×*]\s*(\d+(?:[.,]\d+)?)\s*[x×*]\s*(\d+(?:[.,]\d+)?)/i) ||
      s.match(/(\d+(?:[.,]\d+)?)\s*[x×*]\s*(\d+(?:[.,]\d+)?)\s*[x×*]\s*(\d+(?:[.,]\d+)?)\s*(?:cm|mm)?/i);
    if (dimM) {
      function n(v) { return Math.round(parseFloat(String(v).replace(',', '.'))); }
      var a = n(dimM[1]), b = n(dimM[2]), c = n(dimM[3]);
      var isCm = /cm/i.test(dimM[0]) || Math.max(a, b, c) <= 250;
      if (isCm) { a *= 10; b *= 10; c *= 10; }
      out.enMm = a; out.boyMm = b; out.yukMm = c;
    }
    return out;
  }

  function applyParsedSpecs(out, specs) {
    if (!specs) return out;
    if (!out.elk && specs.elk > 0) out.elk = specs.elk;
    if (!out.gaz && specs.gaz > 0) out.gaz = specs.gaz;
    if (out.enMm == null && specs.enMm != null) out.enMm = specs.enMm;
    if (out.boyMm == null && specs.boyMm != null) out.boyMm = specs.boyMm;
    if (out.yukMm == null && specs.yukMm != null) out.yukMm = specs.yukMm;
    return out;
  }

  function applyTipMeta(out) {
    var tip = String(out.tip_kodu || '').trim();
    if (!tip) return out;
    var brand = PFOS_TIP_BRAND[tip];
    if (brand) { out.pfB = brand; out.marka = brand; }
    var pow = PFOS_TIP_POWER[tip];
    if (pow) {
      if (!out.elk && pow.elk > 0) out.elk = pow.elk;
      if (!out.gaz && pow.gaz > 0) out.gaz = pow.gaz;
    }
    return out;
  }

  /** combi / kombi / kombili → fırın (soğutma, kombin, kombine vb. hariç) */
  function isCombiOvenName(name) {
    var n = normShopName(name);
    if (!n) return false;
    var hasCombi =
      n.indexOf('icombi') >= 0 ||
      n.indexOf('kombili') >= 0 ||
      /\bcombi\b/.test(n) ||
      /\bkombi\b/.test(n) ||
      (n.indexOf('kombi') >= 0 && n.indexOf('kombin') < 0 && n.indexOf('kombine') < 0);
    if (!hasCombi && !n.includes('konveks')) return false;
    if (n.includes('buzdolab') || n.includes('dondurucu')) return false;
    if (n.includes('kombi tip')) return false;
    if (n.includes('kombin') && !n.includes('kombili')) return false;
    if (n.includes('kombine')) return false;
    if (n.includes('blender') || n.includes('mikser') || n.includes('karistirici')) return false;
    if (n.includes('dilimleme')) return false;
    return hasCombi || n.includes('konveks');
  }

  var TIP_MATCH_RULES = {
    kombi_firin_6t: function (name) {
      return isCombiOvenName(name);
    },
    ocak_4gz: function (name) {
      return (
        name.includes('ocak') &&
        name.includes('4') &&
        (name.includes('gözlü') || name.includes('gozlu') || name.includes('göz')) &&
        !name.includes('teşhir') &&
        !name.includes('teshir')
      );
    },
    bulasik_giyotin_1000: function (name) {
      return (
        name.includes('giyotin') &&
        (name.includes('bulaşık') || name.includes('bulasik') || name.includes('tabak')) &&
        !name.includes('ananas')
      );
    },
    calisma_tezgahi: function (name) {
      return name.includes('tezgah') && !name.includes('buzdolab') && !name.includes('evye');
    },
    duvar_rafi: function (name) {
      return name.includes('duvar') && name.includes('raf');
    },
    davlumbaz_duvar: function (name) {
      if (name.includes('eech') || name.includes('cheftop') || name.includes('cheft')) {
        return false;
      }
      if (name.includes('ultravent') || name.includes('yogusturma')) return false;
      return (
        name.includes('davlumbaz') &&
        (name.includes('duvar') || name.includes('duvar tipi')) &&
        !name.includes('izgar')
      );
    },
    davlumbaz: function (name) {
      return name.includes('davlumbaz');
    },
    cop_arabasi: function (name) {
      return (
        (name.includes('cop') ||
          name.includes('çöp') ||
          name.includes('kova') ||
          name.includes('dezenfektan')) &&
        !name.includes('siyirma')
      );
    },
    yer_izgara: function (name) {
      return (
        (name.includes('yer izgar') ||
          name.includes('yer ızgar') ||
          (name.includes('izgar') && name.includes('yer'))) &&
        !name.includes('istif') &&
        !name.includes('tabl') &&
        !name.includes('raf') &&
        !name.includes('davlumbaz') &&
        !name.includes('bulasik')
      );
    },
    istif_rafi: function (name) {
      return name.includes('istif') || (name.includes('raf') && name.includes('demonte'));
    },
    mikrodalga_firin: function (name) {
      return name.includes('mikrodalga');
    },
    servis_rafi: function (name) {
      return name.includes('servis') && (name.includes('arab') || name.includes('termo'));
    },
    char_broil: function (name) {
      return name.includes('kontakt') || name.includes('plate') || name.includes('plancha');
    },
    cop_siyirma_tez: function (name) {
      return name.includes('siyirma') || name.includes('on yikama');
    },
    bym_giris_tez: function (name) {
      return (name.includes('giris') || name.includes('giriş')) && name.includes('tezgah');
    },
    bym_cikis_tez: function (name) {
      return (name.includes('cikis') || name.includes('çıkış')) && name.includes('tezgah');
    },
    fritoz_tek: function (name) {
      return name.includes('fritoz') || name.includes('fritöz');
    },
    tezgah_tip_buzdolabi: function (name) {
      return (
        name.includes('tezgah') &&
        name.includes('buzdolab') &&
        !name.includes('kombi tip')
      );
    },
    dik_tip_buzdolabi: function (name) {
      return (
        name.includes('dik') &&
        name.includes('buzdolab') &&
        !name.includes('kombi tip')
      );
    },
  };

  function normShopName(s) {
    return String(s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ');
  }

  function parseShopPriceTry(priceStrOrItem) {
    if (priceStrOrItem && typeof priceStrOrItem === 'object') {
      var raw = priceStrOrItem.raw || priceStrOrItem;
      var ft = Number(raw.fiyat_tl);
      if (Number.isFinite(ft) && ft > 0) return Math.round(ft);
      return parseShopPriceTry(raw.price || priceStrOrItem.price || priceStrOrItem.p);
    }
    var s = String(priceStrOrItem || '');
    var m = s.match(/₺\s*([\d.,]+)/);
    if (!m) return 0;
    var n = parseFloat(m[1].replace(/\./g, '').replace(',', '.'));
    return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
  }

  function isRowHaric(row) {
    return !!(row && (row.fiyat_haric === true || row.fiyat_kaynak === 'haric'));
  }

  function rowLineTotal(row) {
    if (!row || isRowHaric(row)) return 0;
    if (row.lineTotal != null) return Math.round(Number(row.lineTotal)) || 0;
    var adet = Math.max(1, Number(row.adet) || 1);
    var birim = Math.round(Number(row.birim) || 0);
    return birim > 0 ? birim * adet : 0;
  }

  function shopItemBrand(it) {
    return String((it && (it.brand || it.b)) || '').trim();
  }

  function shopItemName(it) {
    return String((it && (it.name || it.n)) || '').trim();
  }

  function shopItemCategory(it) {
    return String((it && (it.category || it.c)) || '').trim();
  }

  function itemMatchesTip(it, tipKodu) {
    var tip = String(tipKodu || '').trim();
    if (!tip) return false;
    var name = normShopName(shopItemName(it));
    if (!name) return false;
    var rule = TIP_MATCH_RULES[tip];
    if (rule) return rule(name);
    var terms = TIP_SEARCH_TERMS[tip] || [tip.replace(/_/g, ' ')];
    return terms.some(function (t) {
      return name.indexOf(normShopName(t)) >= 0;
    });
  }

  var _pfosShopIndex = null;
  var PFOS_MATCH_MIN_SCORE = 72;

  var TIP_SHOP_CATS = {
    kombi_firin_6t: ['kuzineler', 'sanayi-ocaklari'],
    fritoz_tek: ['fritozler'],
    char_broil: ['sanayi-tipi-izgaralar', 'ocakbasi-izgara'],
    salamander: ['sanayi-ocaklari', 'kuzineler'],
    ocak_4gz: ['sanayi-ocaklari', 'kuzineler'],
    davlumbaz_duvar: ['davlumbaz'],
    davlumbaz: ['davlumbaz'],
    cop_arabasi: ['yardimci-ekipmanlar', 'araba'],
    tezgah_evyeli: ['tezgah'],
    tezgah_duz: ['tezgah', 'set-ustu-mutfak'],
    calisma_tezgahi: ['tezgah', 'hazirlik'],
    duvar_rafi: ['istif', 'tasima'],
    tezgah_tip_buzdolabi: ['sogutma-ekipmanlari'],
    dik_tip_buzdolabi: ['sogutma-ekipmanlari'],
    bulasik_giyotin_1000: ['bulasik-makineleri'],
    dilimleme_makinesi: ['et-hazirlik-makineleri', 'hamur-hazirlik-makineleri'],
    kiyma_makinesi: ['et-hazirlik-makineleri'],
    kemik_testere: ['et-hazirlik-makineleri'],
    vakum_makinesi: ['yardimci-ekipmanlar', 'et-hazirlik-makineleri'],
    mikrodalga_firin: ['sanayi-ocaklari'],
    patates_soyma: ['hamur-hazirlik-makineleri', 'et-hazirlik-makineleri'],
    depo_dolabi: ['istif', 'tasima', 'sogutma-ekipmanlari'],
    sogutma_tezgah: ['sogutma-ekipmanlari', 'tezgah'],
    et_teshir_dolabi: ['sogutma-ekipmanlari', 'vitrin'],
    dry_age_dolabi: ['sogutma-ekipmanlari'],
    derin_dondurucu_dik: ['sogutma-ekipmanlari', 'derin-dondurucu'],
    derin_dondurucu_sandik: ['sogutma-ekipmanlari', 'derin-dondurucu'],
    spiral_hamur: ['hamur-hazirlik-makineleri'],
    hamur_acma: ['hamur-hazirlik-makineleri'],
    raf_firin: ['firinlar', 'kuzineler'],
    espresso_makinasi: ['espresso-makineleri', 'kahve-makineleri'],
    kahve_degirmeni: ['kahve-makineleri'],
    bar_blender: ['yardimci-ekipmanlar'],
    bar_buzdolabi: ['sogutma-ekipmanlari'],
    buz_makinesi: ['buz-makineleri', 'icecek'],
    sarap_dolabi: ['sogutma-ekipmanlari'],
    bardak_yikama: ['bulasik-makineleri'],
    benmari_set: ['benmariler', 'sanayi-ocaklari'],
    teshir_vitrin: ['sogutma-ekipmanlari', 'vitrin'],
    bulasik_sepet: ['bulasik-makineleri'],
    bulasik_tunel: ['bulasik-makineleri'],
  };

  function tipDeptHint(tip, row) {
    if (row && row.pfZone && ZONE_TO_DEPT[row.pfZone]) return ZONE_TO_DEPT[row.pfZone];
    var t = String(tip || '');
    if (/buzdolab|sogut|dondurucu|tezgah_tip_buz|dik_tip_buz/.test(t)) return 'sogutma';
    if (/bulasik|yikama|bym_|cop_siyirma/.test(t)) return 'yikama';
    if (/espresso|kahve/.test(t)) return 'kahve';
    if (row && row.pfDept) return row.pfDept;
    return 'pisirme';
  }

  function normalizeImagePath(p) {
    var s = String(p || '').replace(/\\/g, '/').trim();
    if (!s) return '';
    if (/^https?:\/\//i.test(s)) return s;
    if (s.indexOf('/') === 0) return s;
    return '/data/' + s.replace(/^\/?data\//, '');
  }

  function buildShopIndex(pool) {
    var items = pool || [];
    var byTip = {};
    var bySku = {};
    var byBrandName = {};
    var byDept = { pisirme: [], sogutma: [], yikama: [], hazirlik: [], kahve: [], icecek: [] };
    items.forEach(function (it) {
      var raw = (it.raw || it) || {};
      var tip = String(raw.tip_kodu || it.tip_kodu || '').trim();
      if (tip) {
        if (!byTip[tip]) byTip[tip] = [];
        byTip[tip].push(it);
      }
      var sku = String(raw.sku || it.sku || '').trim();
      if (sku) bySku[normShopName(sku)] = it;
      var bk =
        normShopName(shopItemBrand(it)) + '|' + normShopName(shopItemName(it));
      byBrandName[bk] = it;
      var dept = deptSegForItem(it, null) || 'pisirme';
      if (!byDept[dept]) byDept[dept] = [];
      byDept[dept].push(it);
    });
    _pfosShopIndex = {
      pool: items,
      byTip: byTip,
      bySku: bySku,
      byBrandName: byBrandName,
      byDept: byDept,
    };
    return _pfosShopIndex;
  }

  function getTipShopLink(tip) {
    var links =
      (typeof window !== 'undefined' && window.__PFOS_TIP_SHOP_LINKS__) || {};
    return links[String(tip || '').trim()] || null;
  }

  function scoreShopCandidate(row, it, tip) {
    var score = 0;
    var name = normShopName(shopItemName(it));
    if (!name) return -9999;
    var wantDept = tipDeptHint(tip, row);
    var gotDept = deptSegForItem(it, row && row.pfZone);
    if (wantDept && gotDept && wantDept !== gotDept) score -= 520;

    var link = getTipShopLink(tip);
    if (link) {
      var lsku = normShopName(link.sku || '');
      var raw = it.raw || it;
      if (lsku && normShopName(raw.sku || it.sku) === lsku) score += 280;
      if (
        link.brand &&
        link.name &&
        normShopName(shopItemBrand(it)) === normShopName(link.brand) &&
        normShopName(shopItemName(it)) === normShopName(link.name)
      ) {
        score += 300;
      }
    }

    var rawTip = String((it.raw || it).tip_kodu || it.tip_kodu || '').trim();
    if (tip && rawTip && rawTip === tip) score += 240;

    if (tip && TIP_MATCH_RULES[tip]) {
      if (itemMatchesTip(it, tip)) score += 140;
      else score -= 800;
    } else if (tip) {
      var terms = TIP_SEARCH_TERMS[tip] || [];
      var termHit = terms.some(function (term) {
        return name.indexOf(normShopName(term)) >= 0;
      });
      if (termHit) score += 90;
    }

    var cats = TIP_SHOP_CATS[tip];
    if (cats && cats.length) {
      var cat = normShopName(shopItemCategory(it));
      if (cats.some(function (c) { return cat.indexOf(normShopName(c)) >= 0; })) {
        score += 45;
      }
    }

    var locked = PFOS_TIP_BRAND[tip];
    if (locked) {
      var lb = normShopName(locked);
      if (normShopName(shopItemBrand(it)).indexOf(lb) >= 0) score += 55;
    }

    var pref = row && row._pfosPrefBrand ? normShopName(row._pfosPrefBrand) : '';
    if (pref) {
      var ib = normShopName(shopItemBrand(it));
      if (ib === pref || ib.indexOf(pref) >= 0 || pref.indexOf(ib) >= 0) score += 220;
      else score -= 120;
    }

    if (shopItemImages(it).length) score += 18;

    var target = Number(row && row.birim) || 0;
    var p = parseShopPriceTry(it.price || it.p);
    if (target > 0 && p > 0) {
      var rel = Math.abs(p - target) / target;
      if (rel < 0.15) score += 28;
      else if (rel < 0.35) score += 12;
    }

    return score;
  }

  function pickBestShopMatch(candidates, row, tip) {
    if (!candidates || !candidates.length) return null;
    var best = null;
    var bestScore = -Infinity;
    for (var i = 0; i < candidates.length; i++) {
      var sc = scoreShopCandidate(row, candidates[i], tip);
      if (sc > bestScore) {
        bestScore = sc;
        best = candidates[i];
      }
    }
    if (bestScore < PFOS_MATCH_MIN_SCORE) return null;
    return best;
  }

  function deptSegForItem(it, pfZone) {
    if (typeof window !== 'undefined' && typeof window.eqCategoryToUrunlerSeg === 'function') {
      var seg = window.eqCategoryToUrunlerSeg(shopItemCategory(it));
      if (seg) return seg;
    }
    if (pfZone && ZONE_TO_DEPT[pfZone]) return ZONE_TO_DEPT[pfZone];
    return 'pisirme';
  }

  function findShopMatch(row, pool, opts) {
    if (!row) return null;
    var items = pool || [];
    if (!items.length) return null;
    if (!_pfosShopIndex || _pfosShopIndex.pool !== items) buildShopIndex(items);

    var tip = String(row.tip_kodu || '').trim();
    var lockedTipBrand = PFOS_TIP_BRAND[tip] || '';
    var prefBrand =
      opts && opts.forcedBrand
        ? String(opts.forcedBrand).trim()
        : lockedTipBrand
          ? String(lockedTipBrand).trim()
          : row._pfosPrefBrand
            ? String(row._pfosPrefBrand).trim()
            : '';
    var idx = _pfosShopIndex;
    var candidates = [];

    var link = getTipShopLink(tip);
    if (link && link.sku && idx.bySku[normShopName(link.sku)]) {
      return idx.bySku[normShopName(link.sku)];
    }
    if (link && link.brand && link.name) {
      var lk = normShopName(link.brand) + '|' + normShopName(link.name);
      if (idx.byBrandName[lk]) return idx.byBrandName[lk];
    }

    if (row.pfB && row.pfN) {
      var bk = normShopName(row.pfB) + '|' + normShopName(row.pfN);
      if (idx.byBrandName[bk]) return idx.byBrandName[bk];
    }

    if (tip && idx.byTip[tip] && idx.byTip[tip].length) {
      candidates = idx.byTip[tip].slice();
    } else if (tip) {
      var wantDept = tipDeptHint(tip, row);
      candidates = (idx.byDept[wantDept] || items).filter(function (it) {
        return itemMatchesTip(it, tip);
      });
    }

    if (prefBrand && candidates.length) {
      var prefN = normShopName(prefBrand);
      var byBrand = candidates.filter(function (it) {
        var ib = normShopName(shopItemBrand(it));
        return ib === prefN || ib.indexOf(prefN) >= 0 || prefN.indexOf(ib) >= 0;
      });
      if (byBrand.length) candidates = byBrand;
      else if (lockedTipBrand) return null;
    }

    if (candidates.length) {
      var rowSc = prefBrand ? Object.assign({}, row, { _pfosPrefBrand: prefBrand }) : row;
      var best = pickBestShopMatch(candidates, rowSc, tip);
      if (best) return best;
    }

    return null;
  }

  function isTipBrandLocked(tip) {
    return !!PFOS_TIP_BRAND[String(tip || '').trim()];
  }

  function listShopBrands(pool, extra) {
    var seen = {};
    var out = [];
    function add(b) {
      var t = String(b || '').trim();
      if (!t || t.length < 2) return;
      var k = t.toLocaleLowerCase('tr-TR');
      if (seen[k]) return;
      seen[k] = 1;
      out.push(t);
    }
    (pool || []).forEach(function (it) {
      add(shopItemBrand(it));
    });
    (extra || []).forEach(add);
    [
      'RATIONAL',
      'Öztiryakiler',
      'Kayalar',
      'Unox',
      'Electrolux',
      'True',
      'Scotsman',
      'Iceinox',
      'Empero',
    ].forEach(add);
    return out.sort(function (a, b) {
      return a.localeCompare(b, 'tr');
    });
  }

  function applyZoneBrand(rows, zoneKey, brand, pool) {
    var zk = String(zoneKey || '').trim();
    var b = String(brand || '').trim();
    if (!zk || !b) return rows || [];
    return (rows || []).map(function (r) {
      var rz = rowZone(r);
      if (rz !== zk) return r;
      var tip = String(r.tip_kodu || '').trim();
      if (isTipBrandLocked(tip)) return r;
      var copy = Object.assign({}, r, { _pfosPrefBrand: b, pfB: b, marka: b });
      return enrichRowShopFields(copy, pool, { forcedBrand: b });
    });
  }

  function shopItemImages(it) {
    var raw = (it && (it.raw || it)) || {};
    return raw.images || it.images || [];
  }

  function shopImageUrl(it) {
    var imgs = shopItemImages(it);
    if (!imgs || !imgs.length) return '';
    return normalizeImagePath(imgs[0]);
  }

  function enrichRowShopFields(row, pool, opts) {
    if (!row) return row;
    opts = opts || {};
    var out = Object.assign({}, row);
    if (!opts.preservePrice) {
      out.birim = 0;
      out.lineTotal = null;
      out.fiyat_net = false;
      out.fiyat_kaynak = 'eticaret';
      out.fiyat_haric = false;
    }
    if (!out.pfDept && out.pfZone) out.pfDept = ZONE_TO_DEPT[out.pfZone] || 'pisirme';
    var tip = String(out.tip_kodu || '').trim();
    var lockedBrand = PFOS_TIP_BRAND[tip];
    var forcedBrand = opts.forcedBrand ? String(opts.forcedBrand).trim() : '';
    if (lockedBrand) {
      out.pfB = lockedBrand;
      out.marka = lockedBrand;
    } else if (forcedBrand) {
      out.pfB = forcedBrand;
      out.marka = forcedBrand;
      out._pfosPrefBrand = forcedBrand;
    } else if (out.marka && !out.pfB) {
      out.pfB = out.marka;
    }

    var matchOpts = opts;
    if (lockedBrand) {
      matchOpts = Object.assign({}, opts, { forcedBrand: lockedBrand });
    }
    var match = findShopMatch(out, pool, matchOpts);
    if (match) {
      var shopBrand = shopItemBrand(match);
      var shopName = shopItemName(match);
      var raw = (match.raw || match) || {};
      if (!lockedBrand) {
        out.pfB = shopBrand;
        if (!out.marka) out.marka = shopBrand;
        out.pfN = shopName;
      } else {
        out.pfShopModel = shopName;
        if (!out.pfN) out.pfN = shopName;
      }
      if (raw.sku || raw.model) out.pfSku = String(raw.sku || raw.model).trim();
      if (match.equstoPage) out.pfEqustoPage = match.equstoPage;
      out.pfDept = deptSegForItem(match, out.pfZone);
      var shopPrice = parseShopPriceTry(match);
      var adetShop = Math.max(1, Number(out.adet) || 1);
      if (shopPrice > 0) {
        out.birim = shopPrice;
        out.fiyat_net = true;
        out.fiyat_haric = false;
        out.fiyat_kaynak = 'eticaret';
        out.lineTotal = shopPrice * adetShop;
      }
      var specText = String(
        (match.raw && match.raw.specs) || match.specs || ''
      ).trim();
      if (specText) out.pfSpecs = specText;
      var specs = parseSpecsFromText(specText || shopName);
      applyParsedSpecs(out, specs);
      var imgs = shopItemImages(match);
      if (imgs && imgs.length) {
        out.pfImages = imgs
          .map(function (u) {
            return normalizeImagePath(u);
          })
          .filter(Boolean);
        if (out.pfImages.length) out.pfImage = out.pfImages[0];
      } else {
        var img = shopImageUrl(match);
        if (img) out.pfImage = img;
      }
      out.pfShopMatch = true;
    }

    if (
      !opts.preservePrice &&
      !(Number(out.birim) > 0 && out.fiyat_kaynak === 'eticaret')
    ) {
      out.fiyat_haric = true;
      out.birim = 0;
      out.lineTotal = 0;
      out.fiyat_net = false;
      out.fiyat_kaynak = 'haric';
    }

    if (!out.pfImage && out.imageUrl) out.pfImage = normalizeImagePath(out.imageUrl);

    applyTipMeta(out);
    if (!out.marka && out.pfB) out.marka = out.pfB;
    return out;
  }

  function enrichRowsShopLinks(rows, pool) {
    return (rows || []).map(function (r) {
      return enrichRowShopFields(r, pool);
    });
  }

  function zoneDef(key) {
    var defs = getZoneDefsFromCatalog();
    for (var i = 0; i < defs.length; i++) {
      if (defs[i].key === key) return defs[i];
    }
    return { key: key, name: key, icon: '📦', color: '#888', share: 0.1 };
  }

  function rowZone(row) {
    if (row && row.pfZone) {
      var z = normalizeZoneKey(row.pfZone, row);
      if (row.pfZone === 'hazirlik') return inferHazirlikZone(row);
      if (row.pfZone === 'soguk_oda' || row.pfZone === 'depolama') {
        return inferStorageZone(row);
      }
      return z;
    }
    var d = String((row && row.pfDept) || '')
      .trim()
      .toLowerCase();
    if (d === 'hazirlik') return inferHazirlikZone(row);
    if (d === 'sogutma') return inferStorageZone(row);
    return DEPT_TO_ZONE[d] || 'ana_mutfak';
  }

  function classifyRow(row) {
    if (row && row.pfClass) return row.pfClass;
    if (row && row.pfOptional) return 'OPS';
    return 'ZRN';
  }

  function groupByZones(rows, selectedKeys, alan) {
    /* Tek motor / API satırları — pfZone ile grupla (yeniden generateQuote yok) */
    if (rows && rows.length && rows.some(function (r) {
      return r && r.pfZone;
    })) {
      var zoneMap = {};
      (rows || []).forEach(function (r) {
        var zk = rowZone(r);
        if (!zoneMap[zk]) {
          var d = zoneDef(zk);
          zoneMap[zk] = {
            key: zk,
            label: (r.pfZoneLabel || d.name),
            icon: d.icon,
            color: d.color,
            m2: r.pfCatM2 != null ? r.pfCatM2 : categoryM2(Number(alan) || 0, zk),
            rows: [],
            zorunlu: 0,
            ops: 0,
            total: 0,
          };
        }
        var tag = classifyRow(r);
        var line = rowLineTotal(r);
        zoneMap[zk].rows.push(
          Object.assign({}, r, { pfClass: tag, lineTotal: line })
        );
        if (tag === 'OPS') zoneMap[zk].ops += 1;
        else zoneMap[zk].zorunlu += 1;
        zoneMap[zk].total += line;
      });
      var apiZones = Object.keys(zoneMap).map(function (k) {
        return zoneMap[k];
      });
      apiZones.forEach(function (z) {
        z.rows.sort(function (a, b) {
          var ca = a.pfClass === 'OPS' ? 1 : 0;
          var cb = b.pfClass === 'OPS' ? 1 : 0;
          return ca - cb;
        });
      });
      return sortZones(apiZones.filter(function (z) {
        return z.rows.length > 0;
      }));
    }

    if (isCatalogReady()) {
      var quote = generateQuote(alan, selectedKeys);
      var zoned = quote.categories
        .filter(function (c) {
          return c.rows && c.rows.length > 0;
        })
        .map(function (cat) {
          var zRows = cat.rows.map(function (r) {
            var priced = (rows || []).find(function (row) {
              return rowZone(row) === cat.key && row.ad === r.name;
            });
            var adet = priced ? priced.adet : r.qty;
            var birim = priced ? priced.birim : r.unit;
            return Object.assign({}, priced || {}, {
              ad: r.name,
              olcu: r.dim,
              adet: adet,
              birim: birim,
              tip_kodu: (priced && priced.tip_kodu) || r.tip_kodu || '',
              pfZone: cat.key,
              pfClass: r.tag,
              lineTotal: (Number(birim) || 0) * (Number(adet) || 1),
            });
          });
          var total = zRows.reduce(function (s, row) {
            return s + (row.lineTotal || 0);
          }, 0);
          return {
            key: cat.key,
            label: cat.label,
            icon: cat.icon,
            color: cat.color,
            m2: cat.m2,
            zorunlu: cat.zorunlu,
            ops: cat.ops,
            total: total,
            rows: zRows,
          };
        })
      return sortZones(zoned);
    }

    var keys =
      selectedKeys && selectedKeys.length ? selectedKeys.slice() : defaultZoneKeys();
    var m2 = Number(alan) || 0;
    if (m2 > 0 && m2 < 20) m2 = 20;
    var zones = keys.map(function (key) {
      var def = zoneDef(key);
      return {
        key: key,
        label: def.name,
        icon: def.icon,
        color: def.color,
        m2: categoryM2(m2, key),
        rows: [],
        zorunlu: 0,
        ops: 0,
        total: 0,
      };
    });
    var zoneMap = {};
    zones.forEach(function (z) {
      zoneMap[z.key] = z;
    });

    (rows || []).forEach(function (r) {
      var zk = rowZone(r);
      if (!zoneMap[zk]) {
        var d = zoneDef(zk);
        zoneMap[zk] = {
          key: zk,
          label: d.name,
          icon: d.icon,
          color: d.color,
          m2: r.pfCatM2 != null ? r.pfCatM2 : categoryM2(m2, zk),
          rows: [],
          zorunlu: 0,
          ops: 0,
          total: 0,
        };
        zones.push(zoneMap[zk]);
      }
      var tag = classifyRow(r);
      var line = (Number(r.birim) || 0) * (Number(r.adet) || 1);
      zoneMap[zk].rows.push(
        Object.assign({}, r, {
          pfClass: tag,
          lineTotal: line,
        })
      );
      if (tag === 'OPS') zoneMap[zk].ops += 1;
      else zoneMap[zk].zorunlu += 1;
      zoneMap[zk].total += line;
    });

    zones.forEach(function (z) {
      z.rows.sort(function (a, b) {
        var ca = a.pfClass === 'OPS' ? 1 : 0;
        var cb = b.pfClass === 'OPS' ? 1 : 0;
        return ca - cb;
      });
    });

    return zones.filter(function (z) {
      return z.rows.length > 0;
    });
  }

  function quoteTotals(rows) {
    var zrn = 0;
    var ops = 0;
    var adet = 0;
    (rows || []).forEach(function (r) {
      var line = rowLineTotal(r);
      adet += Number(r.adet) || 1;
      if (classifyRow(r) === 'OPS') ops += line;
      else zrn += line;
    });
    return { zorunluMin: zrn, opsSum: ops, tahminiToplam: zrn + ops, toplamAdet: adet };
  }

  /** Eski yol — kural motoru satırları için (katalog yokken) */
  function applyM2ToRows(rows, alan) {
    return (rows || []).map(function (r) {
      var copy = Object.assign({}, r);
      var zk = rowZone(copy);
      var catM2 = categoryM2(alan, zk);
      if (copy.m2_per_unit != null && isFinite(copy.m2_per_unit)) {
        copy.adet = qtyForProduct(catM2, {
          m2_per_unit: copy.m2_per_unit,
          min_qty: copy.min_qty,
          max_qty: copy.max_qty,
        });
      }
      copy.pfZone = zk;
      copy.pfCatM2 = catM2;
      return copy;
    });
  }

  window.EqustoPfosCalc = {
    setCatalog: function (bundle) {
      setCatalog(bundle);
      hydrateCatalogPrices(getFiyatMap());
    },
    hydrateCatalogPrices: hydrateCatalogPrices,
    resolveProductUnitTry: resolveProductUnitTry,
    isCatalogReady: isCatalogReady,
    getCatalog: function () {
      return _catalogBundle;
    },
    generateQuote: generateQuote,
    isDilimlemeRow: isDilimlemeRow,
    applyDilimlemeZoneRules: applyDilimlemeZoneRules,
    isSarkuteriQuoteOpts: isSarkuteriQuoteOpts,
    quoteToRows: quoteToRows,
    zonesFromQuote: zonesFromQuote,
    categoryM2: categoryM2,
    qtyForProduct: qtyForProduct,
    get PFOS_ZONE_DEFS() {
      return getZoneDefsFromCatalog();
    },
    defaultZoneKeys: defaultZoneKeys,
    PFOS_ZONE_ORDER: PFOS_ZONE_ORDER,
    sortZones: sortZones,
    applyM2ToRows: applyM2ToRows,
    groupByZones: groupByZones,
    quoteTotals: quoteTotals,
    rowZone: rowZone,
    classifyRow: classifyRow,
    ZONE_TO_DEPT: ZONE_TO_DEPT,
    enrichRowShopFields: enrichRowShopFields,
    enrichRowsShopLinks: enrichRowsShopLinks,
    findShopMatch: findShopMatch,
    parseShopPriceTry: parseShopPriceTry,
    isRowHaric: isRowHaric,
    rowLineTotal: rowLineTotal,
    isTipBrandLocked: isTipBrandLocked,
    listShopBrands: listShopBrands,
    applyZoneBrand: applyZoneBrand,
    buildShopIndex: buildShopIndex,
    rebuildShopIndex: function (pool) {
      return buildShopIndex(pool || []);
    },
  };
})();
