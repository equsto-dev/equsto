;(function (global) {
  'use strict';

  /**
   * PFOS lokasyon: nakliye tahmini + Equsto veri bankası (lokasyon × konsept × ürün/marka).
   * Tam cadde adresi yalnızca teklif gönderiminde saklanır; insight olaylarında şehir/ilçe yeterlidir.
   */

  var BOLGE_KATSAYI = {
    sehirici: 1,
    marmara: 1,
    ege: 1.15,
    akdeniz: 1.15,
    icanadolu: 1.2,
    b_karadeniz: 1.25,
    d_karadeniz: 1.3,
    dogu: 1.3,
    guneydogu: 1.35,
  };

  var SEHIR_BOLGE = {
    İstanbul: 'sehirici',
    Kocaeli: 'marmara',
    Sakarya: 'marmara',
    Tekirdağ: 'marmara',
    Edirne: 'marmara',
    Kırklareli: 'marmara',
    Bursa: 'marmara',
    Yalova: 'marmara',
    Bilecik: 'marmara',
    Balıkesir: 'ege',
    Çanakkale: 'ege',
    İzmir: 'ege',
    Manisa: 'ege',
    Aydın: 'ege',
    Muğla: 'ege',
    Denizli: 'ege',
    Uşak: 'ege',
    Kütahya: 'ege',
    Antalya: 'akdeniz',
    Mersin: 'akdeniz',
    Adana: 'akdeniz',
    Hatay: 'akdeniz',
    Osmaniye: 'akdeniz',
    Kahramanmaraş: 'akdeniz',
    Burdur: 'akdeniz',
    Isparta: 'akdeniz',
    Ankara: 'icanadolu',
    Eskişehir: 'icanadolu',
    Konya: 'icanadolu',
    Kayseri: 'icanadolu',
    Sivas: 'icanadolu',
    Yozgat: 'icanadolu',
    Kırıkkale: 'icanadolu',
    Kırşehir: 'icanadolu',
    Nevşehir: 'icanadolu',
    Aksaray: 'icanadolu',
    Niğde: 'icanadolu',
    Çankırı: 'icanadolu',
    Karaman: 'icanadolu',
    Zonguldak: 'b_karadeniz',
    Karabük: 'b_karadeniz',
    Bartın: 'b_karadeniz',
    Kastamonu: 'b_karadeniz',
    Sinop: 'b_karadeniz',
    Samsun: 'b_karadeniz',
    Çorum: 'b_karadeniz',
    Amasya: 'b_karadeniz',
    Tokat: 'b_karadeniz',
    Trabzon: 'd_karadeniz',
    Rize: 'd_karadeniz',
    Artvin: 'd_karadeniz',
    Giresun: 'd_karadeniz',
    Ordu: 'd_karadeniz',
    Gümüşhane: 'd_karadeniz',
    Bayburt: 'd_karadeniz',
    Erzurum: 'dogu',
    Erzincan: 'dogu',
    Kars: 'dogu',
    Ardahan: 'dogu',
    Iğdır: 'dogu',
    Ağrı: 'dogu',
    Van: 'dogu',
    Muş: 'dogu',
    Bitlis: 'dogu',
    Hakkari: 'dogu',
    Bingöl: 'dogu',
    Tunceli: 'dogu',
    Elazığ: 'dogu',
    Malatya: 'dogu',
    Diyarbakır: 'guneydogu',
    Şanlıurfa: 'guneydogu',
    Gaziantep: 'guneydogu',
    Kilis: 'guneydogu',
    Adıyaman: 'guneydogu',
    Mardin: 'guneydogu',
    Batman: 'guneydogu',
    Siirt: 'guneydogu',
    Şırnak: 'guneydogu',
  };

  var HEAVY_KOD = {
    'EQ-PIS-001': 3,
    'EQ-PIS-012': 2.5,
    'EQ-PIS-014': 2,
    'EQ-YIK-001': 3,
    'EQ-YIK-002': 2,
    'EQ-CAT-001': 2,
    'EQ-STK-001': 2,
    'EQ-SOG-010': 2.5,
    'EQ-SOG-003': 1.5,
    'EQ-BKR-001': 2,
    'EQ-BKR-003': 2,
  };

  var bolgeLoadPromise = null;

  function loadBolgeConfig() {
    if (bolgeLoadPromise) return bolgeLoadPromise;
    bolgeLoadPromise = fetch('/data/pfos-nakliye-bolgeler.json', { cache: 'default' })
      .then(function (r) {
        if (!r.ok) return null;
        return r.json();
      })
      .then(function (j) {
        if (j && j.bolge_katsayi) BOLGE_KATSAYI = j.bolge_katsayi;
        if (j && j.sehir_bolge) SEHIR_BOLGE = j.sehir_bolge;
      })
      .catch(function () {});
    return bolgeLoadPromise;
  }

  loadBolgeConfig();

  function normSehir(s) {
    return String(s || '')
      .trim()
      .replace(/\s+/g, ' ');
  }

  function bolgeForSehir(sehir) {
    var s = normSehir(sehir);
    if (!s) return 'marmara';
    if (SEHIR_BOLGE[s]) return SEHIR_BOLGE[s];
    var low = s.toLocaleLowerCase('tr-TR');
    var keys = Object.keys(SEHIR_BOLGE);
    for (var i = 0; i < keys.length; i++) {
      if (keys[i].toLocaleLowerCase('tr-TR') === low) return SEHIR_BOLGE[keys[i]];
    }
    return 'icanadolu';
  }

  function katsayiForBolge(bolge) {
    var k = BOLGE_KATSAYI[bolge];
    return Number.isFinite(k) && k > 0 ? k : 1.2;
  }

  function readFromDom(D) {
    D = D || {};
    var sehir =
      normSehir(D.sehir) ||
      normSehir((document.getElementById('adres-sehir') || {}).value) ||
      normSehir((document.getElementById('sehir-inp') || {}).value);
    var ilce = String((document.getElementById('adres-ilce') || {}).value || '').trim();
    var mahalle = String((document.getElementById('adres-mahalle') || {}).value || '').trim();
    var cadde = String((document.getElementById('adres-cadde') || {}).value || '').trim();
    var bolge = bolgeForSehir(sehir);
    return {
      sehir: sehir,
      ilce: ilce,
      mahalle: mahalle,
      cadde: cadde,
      bolge: bolge,
      bolge_katsayi: katsayiForBolge(bolge),
      province_id: D.provinceId != null ? D.provinceId : null,
      district_id: D.districtId != null ? D.districtId : null,
      adres_tamam: !!(sehir && ilce && mahalle && cadde && cadde.length >= 2),
    };
  }

  function lineWeight(row) {
    if (!row) return 1;
    var kod = row.kod || '';
    if (HEAVY_KOD[kod]) return HEAVY_KOD[kod];
    var ad = String(row.ad || '').toLocaleLowerCase('tr-TR');
    if (/bulaşık|konveksiyon|soğuk oda|kombi|fırın|buzdolabı|tezgah tip/i.test(ad)) return 1.8;
    return 1;
  }

  function estimateNakliye(opts) {
    opts = opts || {};
    var lok = opts.lokasyon || {};
    var rows = opts.rows || [];
    var alan = Math.max(0, Number(opts.alan_m2) || 0);
    var ekipmanToplam = Math.max(0, Number(opts.ekipman_toplam_tl) || 0);

    if (!lok.sehir) {
      return {
        tutar: 0,
        gecerli: false,
        not: 'Şehir seçilmedi',
        bolge: null,
        bolge_katsayi: 1,
      };
    }

    var bolge = lok.bolge || bolgeForSehir(lok.sehir);
    var katsayi = lok.bolge_katsayi || katsayiForBolge(bolge);

    var adetToplam = 0;
    var agirlik = 0;
    rows.forEach(function (r) {
      var a = Math.max(1, Math.round(Number(r.adet) || 1));
      adetToplam += a;
      agirlik += lineWeight(r) * a;
    });

    var taban = bolge === 'sehirici' ? 4200 : 5200;
    var satirPayi = Math.round(agirlik * 520);
    var hacimPayi = Math.round(Math.sqrt(Math.max(alan, 40)) * 180);
    var degerPayi = ekipmanToplam > 0 ? Math.round(ekipmanToplam * 0.028) : 0;
    var montaj = alan >= 150 ? 9500 : alan >= 80 ? 6500 : 4200;

    var ham = (taban + satirPayi + hacimPayi + degerPayi + montaj) * katsayi;
    var tutar = Math.round(ham / 100) * 100;

    return {
      tutar: tutar,
      gecerli: true,
      bolge: bolge,
      bolge_katsayi: katsayi,
      montaj_tl: Math.round(montaj * katsayi / 100) * 100,
      not:
        lok.ilce
          ? lok.sehir + ' / ' + lok.ilce + ' · ' + bolge + ' bölgesi'
          : lok.sehir + ' · ' + bolge + ' bölgesi',
      kalem_sayisi: rows.length,
      adet_toplam: adetToplam,
    };
  }

  function rowsToProducts(rows) {
    return (rows || []).map(function (r) {
      return {
        kod: r.kod || '',
        ad: r.ad || '',
        marka: r.marka || r.pfB || '',
        model: r.pfN || '',
        tip_kodu: r.tip_kodu || '',
        adet: Math.max(1, Math.round(Number(r.adet) || 1)),
        bolum: r.pfDept || r.zoneKey || r.zone || '',
      };
    });
  }

  function zonesToInsight(zones) {
    return (zones || []).map(function (z) {
      return {
        key: z.key || z.id || '',
        label: z.label || z.name || '',
        m2: z.m2 != null ? z.m2 : z.alan_m2,
      };
    });
  }

  function isletmeFromD(D) {
    D = D || {};
    return {
      meslek: D.meslek || '',
      konsept: D.konsept || '',
      franchise: D.franchise || '',
      dukkan: D.dukkan || '',
      alt: D.alt || '',
      kap: D.kap || '',
      serv: D.serv || '',
      sark: D.sark || '',
      menu: (D.menu || []).slice(),
      pisir: (D.pisir || []).slice(),
    };
  }

  function lokasyonInsight(lok) {
    lok = lok || {};
    return {
      sehir: lok.sehir || '',
      ilce: lok.ilce || '',
      bolge: lok.bolge || '',
      bolge_katsayi: lok.bolge_katsayi || 1,
      province_id: lok.province_id,
      district_id: lok.district_id,
    };
  }

  function sessionId() {
    var k = 'pfos_sid';
    try {
      var s = sessionStorage.getItem(k);
      if (!s) {
        s = 'pf_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
        sessionStorage.setItem(k, s);
      }
      return s;
    } catch (e) {
      return 'pf_anon';
    }
  }

  function buildInsightPayload(opts) {
    opts = opts || {};
    var D = opts.D || {};
    var lok = opts.lokasyon || readFromDom(D);
    var rows = opts.rows || [];
    var nak = opts.nakliye || estimateNakliye({
      lokasyon: lok,
      rows: rows,
      alan_m2: D.alan,
      ekipman_toplam_tl: opts.ekipman_toplam_tl,
    });
    var zones = opts.bolgeler || opts.zones || [];

    return {
      kaynak: 'pfos',
      olay: opts.event || 'proje_anlik',
      oturum_id: sessionId(),
      zaman: new Date().toISOString(),
      lokasyon: lokasyonInsight(lok),
      isletme: isletmeFromD(D),
      alan_m2: Number(D.alan) || 0,
      mutfak_bolgeleri: zonesToInsight(zones),
      urunler: rowsToProducts(rows),
      marka_modeller: rowsToProducts(rows)
        .filter(function (p) {
          return p.marka || p.model;
        })
        .map(function (p) {
          return { marka: p.marka, model: p.model || p.ad, kod: p.kod, adet: p.adet };
        }),
      nakliye_tahmin_tl: nak.gecerli ? nak.tutar : 0,
      nakliye: nak,
      tahmini_ekipman_tl: Math.round(Number(opts.ekipman_toplam_tl) || 0),
    };
  }

  global.EqustoPfosLocation = {
    loadBolgeConfig: loadBolgeConfig,
    bolgeForSehir: bolgeForSehir,
    readFromDom: readFromDom,
    estimateNakliye: estimateNakliye,
    rowsToProducts: rowsToProducts,
    buildInsightPayload: buildInsightPayload,
    sessionId: sessionId,
    lokasyonInsight: lokasyonInsight,
  };
})(typeof window !== 'undefined' ? window : globalThis);
