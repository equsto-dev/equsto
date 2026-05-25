;(function () {
  'use strict';

  var PF_FORM_NO = 'F-220 (D:01.2018)';
  var INOKSAN_COLS = 16;
  var INOKSAN_THEAD =
    '<th>B\u00f6l.</th><th>Grup</th><th>Poz</th><th>EK</th><th>Stok no</th>' +
    '<th>Tan\u0131m\u0131</th><th>Kaynak</th>' +
    '<th class="num">Boy</th><th class="num">En</th><th class="num">Y\u00fck.</th>' +
    '<th class="num">Elk. kW</th><th class="num">Gaz kW</th>' +
    '<th class="num">Adet</th><th class="num">Sat\u0131\u015f</th><th class="num">Toplam Sat\u0131\u015f</th>' +
    '<th>D\u00f6viz</th>';

  function parseDimParts(r) {
    if (!r) return null;
    var en = r.enMm != null ? r.enMm : r.en;
    var boy = r.boyMm != null ? r.boyMm : r.boy;
    var yuk = r.yukMm != null ? r.yukMm : r.yukseklikMm != null ? r.yukseklikMm : r.yuk;
    if (en != null && boy != null && yuk != null) {
      return { en: en, boy: boy, yuk: yuk };
    }
    var plain = pfosDimMmPlain(r);
    if (plain === '\u2014') return null;
    var m = String(plain).match(/(\d+)\u00d7(\d+)\u00d7(\d+)/);
    if (!m) return null;
    return { en: m[1], boy: m[2], yuk: m[3] };
  }

  function pfosInoksanDim(r) {
    var p = parseDimParts(r);
    if (!p) return { boy: '\u2014', en: '\u2014', yuk: '\u2014' };
    return {
      boy: escHtml(String(p.boy)) + ' X',
      en: escHtml(String(p.en)) + ' X',
      yuk: escHtml(String(p.yuk)),
    };
  }

  function tanimBaslikHtml(r) {
    var stok = String((r && (r.tip_kodu || r.kod)) || '').trim();
    var ad = String((r && r.ad) || '').trim();
    var parts = ['A.'];
    if (ad) parts.push(ad.toLocaleUpperCase('tr-TR'));
    else if (r && r.pfN) parts.push(String(r.pfN).toLocaleUpperCase('tr-TR'));
    if (stok && (!ad || ad.toLowerCase().indexOf(stok.toLowerCase()) === -1)) {
      parts.push(stok);
    } else if (stok && !ad) {
      parts.push(stok);
    }
    return escHtml(parts.join(' ').replace(/\s+/g, ' ').trim());
  }

  function eurFromTl(tl, ctx) {
    var kur = ctx && ctx.eurTry > 0 ? Number(ctx.eurTry) : 52.8238;
    return (Number(tl) || 0) / kur;
  }

  function specBlockHtml(r) {
    var bullets = pfosCatalogSpecBullets(r);
    var lead = bullets.length ? bullets.shift() : '';
    var body = bullets
      .map(function (t) {
        return '\u2022  ' + escHtml(t);
      })
      .join('<br>');
    var html = '';
    if (lead) {
      html += '<div class="pfos-v10-spec__lead"><strong>' + escHtml(lead) + '</strong></div>';
    }
    if (body) {
      html += '<div class="pfos-v10-spec__body">' + body + '</div>';
    }
    if (!html) {
      var lines = [];
      if (r.ad) lines.push('\u2022  ' + r.ad);
      var dim = pfosDimMmPlain(r);
      if (dim !== '\u2014') lines.push('\u2022  \u00d6l\u00e7\u00fc: ' + dim);
      if (r.tip_kodu) lines.push('\u2022  Stok: ' + r.tip_kodu);
      html = lines.map(escHtml).join('<br>') || escHtml('\u2022  PFOS katalog kalemi');
    }
    return html;
  }


  function pfosFmtMoney(n, cur) {
    var v = Math.round(Number(n) || 0);
    var s = new Intl.NumberFormat('tr-TR').format(v);
    if (cur === 'EUR') return s + ' \u20ac';
    return s + ' \u20ba';
  }

  function pfosFmtRowPrice(row, cur, which) {
    var r = row || {};
    if (
      r.fiyat_haric === true ||
      r.fiyat_kaynak === 'haric' ||
      (window.EqustoPfosPricing &&
        typeof EqustoPfosPricing.isRowHaric === 'function' &&
        EqustoPfosPricing.isRowHaric(r))
    ) {
      return 'hari\u00e7';
    }
    var amount = Number(r.birim) || 0;
    if (which === 'line') {
      amount =
        window.EqustoPfosCalc && typeof EqustoPfosCalc.rowLineTotal === 'function'
          ? EqustoPfosCalc.rowLineTotal(r)
          : r.lineTotal != null
            ? r.lineTotal
            : amount * (Number(r.adet) || 1);
    }
    return pfosFmtMoney(amount, cur);
  }

  function pfosFmtProformaMoney(n, cur) {
    var v = Number(n) || 0;
    if (cur === 'EUR') {
      return v.toLocaleString('de-DE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.round(v));
  }

  function escHtml(s) {
    if (typeof window.esc === 'function') return window.esc(s);
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function rowNameHtml(r) {
    if (typeof window.pfEqNameCellHtml === 'function') return window.pfEqNameCellHtml(r);
    return escHtml(r.ad || r.kod || '');
  }

  function pad2(n) {
    return ('0' + n).slice(-2);
  }

  function todayTr() {
    var d = new Date();
    return pad2(d.getDate()) + '.' + pad2(d.getMonth() + 1) + '.' + d.getFullYear();
  }

  function proformaNo(ctx) {
    if (ctx && ctx.proformaNo) return String(ctx.proformaNo);
    var d = new Date();
    return (
      '' +
      d.getFullYear() +
      pad2(d.getMonth() + 1) +
      pad2(d.getDate()) +
      String(Math.floor(Math.random() * 900) + 100)
    );
  }

  function isinAdi(ctx) {
    var c = ctx || {};
    var parts = [c.franchise, c.konsept, c.dukkan, c.alt, c.sehir].filter(Boolean);
    if (parts.length) return parts.join(' ');
    return 'Equsto Proje Fabrikası Teklifi';
  }

  function pfosDimMm(r) {
    return escHtml(pfosDimMmPlain(r));
  }

  function pfosDimPart(r, key) {
    if (!r) return '\u2014';
    var en = r.enMm != null ? r.enMm : r.en;
    var boy = r.boyMm != null ? r.boyMm : r.boy;
    var yuk = r.yukMm != null ? r.yukMm : r.yukseklikMm != null ? r.yukseklikMm : r.yuk;
    if (en != null && boy != null && yuk != null) {
      if (key === 'en') return escHtml(String(en));
      if (key === 'boy') return escHtml(String(boy));
      if (key === 'yuk') return escHtml(String(yuk));
    }
    var plain = pfosDimMmPlain(r);
    if (plain === '\u2014') return plain;
    var m = String(plain).match(/(\d+)\u00d7(\d+)\u00d7(\d+)/);
    if (!m) return '\u2014';
    if (key === 'en') return escHtml(m[1]);
    if (key === 'boy') return escHtml(m[2]);
    if (key === 'yuk') return escHtml(m[3]);
    return '\u2014';
  }

  function pfosRowImages(r) {
    var list = [];
    if (r && r.pfImages && r.pfImages.length) {
      r.pfImages.forEach(function (u) {
        var s = String(u || '').trim();
        if (s && list.indexOf(s) === -1) list.push(s);
      });
    }
    var one = String((r && (r.pfImage || r.image)) || '').trim();
    if (one && list.indexOf(one) === -1) list.unshift(one);
    return list;
  }

  function pfosRowImageHtml(r, opts) {
    opts = opts || {};
    var url = pfosRowImages(r)[0] || '';
    var cls = opts.thumbClass || 'pfos-v10-foto-img';
    if (!url) {
      return '<span class="pfos-v10-foto-ph" aria-hidden="true">\u2014</span>';
    }
    if (opts.zoomable) {
      return (
        '<button type="button" class="pfos-teklif-zoom pfos-teklif-zoom--thumb" data-img="' +
        escHtml(url) +
        '" title="B\u00fcy\u00fct">' +
        '<img class="' +
        cls +
        '" src="' +
        escHtml(url) +
        '" alt="" loading="lazy" decoding="async"></button>'
      );
    }
    return (
      '<img class="' +
      cls +
      '" src="' +
      escHtml(url) +
      '" alt="" loading="lazy" decoding="async">'
    );
  }

  function pfosCatalogSpecBullets(r) {
    var raw = String((r && r.pfSpecs) || '').trim();
    var lines = [];
    if (raw) {
      lines = raw
        .replace(/\r/g, '')
        .split(/\n+/)
        .map(function (s) {
          return s.replace(/^[\s\u2022\u00b7\-–—]+/, '').trim();
        })
        .filter(function (s) {
          if (!s || s.length < 4) return false;
          if (/^f[iı]yat\s+al/i.test(s)) return false;
          return true;
        });
      var name = String((r.pfN || r.ad) || '').trim();
      if (lines.length && name && lines[0].toLocaleLowerCase('tr-TR') === name.toLocaleLowerCase('tr-TR')) {
        lines.shift();
      }
    }
    if (!lines.length) {
      if (r.ad) lines.push(r.ad);
      var dim = pfosDimMmPlain(r);
      if (dim !== '\u2014') lines.push('\u00d6l\u00e7\u00fc: ' + dim);
      if (r.tip_kodu) lines.push('Stok / tip: ' + r.tip_kodu);
      if (r.pfB || r.marka) lines.push('Marka: ' + (r.pfB || r.marka));
      if (!r.pfShopMatch) {
        lines.push(
          'Equsto katalogunda bu kalem için otomatik ürün eşleşmesi yok; PFOS referans fiyatı kullanıldı.',
        );
      }
    }
    return lines.slice(0, 18);
  }

  function buildTeklifDetailHtml(r, idx) {
    var imgs = pfosRowImages(r);
    var bullets = pfosCatalogSpecBullets(r);
    var chips = [
      ['Stok', String(r.tip_kodu || r.kod || '').trim()],
      ['Marka', String(r.pfB || r.marka || '').trim()],
      ['Model', modelFromRow(r)],
      ['\u00d6l\u00e7\u00fc', pfosDimMmPlain(r)],
      ['Elk.', pfosFmtKwElk(r)],
      ['Gaz', pfosFmtKwGaz(r)],
      ['Adet', String(Number(r.adet) || 1)],
    ].filter(function (pair) {
      return pair[1] && pair[1] !== '\u2014' && pair[1] !== '0' && pair[1] !== '0.0';
    });

    var gallery =
      imgs.length > 0
        ? '<div class="pfos-teklif-gallery" role="list">' +
          imgs
            .map(function (url, gi) {
              return (
                '<button type="button" class="pfos-teklif-zoom pfos-teklif-gallery__btn' +
                (gi === 0 ? ' is-active' : '') +
                '" data-img="' +
                escHtml(url) +
                '" role="listitem" title="B\u00fcy\u00fct">' +
                '<img src="' +
                escHtml(url) +
                '" alt="" loading="lazy" decoding="async"></button>'
              );
            })
            .join('') +
          '</div>'
        : '<div class="pfos-teklif-noimg">Katalog foto\u011fraf\u0131 yok</div>';

    var chipsHtml = chips
      .map(function (pair) {
        return (
          '<span class="pfos-teklif-chip"><span class="pfos-teklif-chip__k">' +
          escHtml(pair[0]) +
          '</span><span class="pfos-teklif-chip__v">' +
          escHtml(pair[1]) +
          '</span></span>'
        );
      })
      .join('');

    var specsHtml = bullets
      .map(function (t) {
        return '<li>' + escHtml(t) + '</li>';
      })
      .join('');

    var page =
      r.pfEqustoPage || r.equstoPage
        ? '<a class="pfos-teklif-page" href="' +
          escHtml(r.pfEqustoPage || r.equstoPage) +
          '" target="_blank" rel="noopener noreferrer">Equsto \u00fcr\u00fcn sayfas\u0131 \u2192</a>'
        : '';

    return (
      '<div class="pfos-teklif-detail__panel" id="pfos-teklif-detail-' +
      idx +
      '">' +
      '<div class="pfos-teklif-detail__media">' +
      gallery +
      '</div>' +
      '<div class="pfos-teklif-detail__body">' +
      '<div class="pfos-teklif-chips">' +
      chipsHtml +
      '</div>' +
      (specsHtml
        ? '<ul class="pfos-teklif-specs">' + specsHtml + '</ul>'
        : '') +
      page +
      '</div></div></div>'
    );
  }

  var teklifLightboxEl = null;

  function ensureTeklifLightbox() {
    if (teklifLightboxEl) return teklifLightboxEl;
    teklifLightboxEl = document.createElement('div');
    teklifLightboxEl.className = 'pfos-teklif-lightbox';
    teklifLightboxEl.hidden = true;
    teklifLightboxEl.innerHTML =
      '<button type="button" class="pfos-teklif-lightbox__close" aria-label="Kapat">\u00d7</button>' +
      '<img class="pfos-teklif-lightbox__img" alt="">';
    document.body.appendChild(teklifLightboxEl);
    teklifLightboxEl.addEventListener('click', function (ev) {
      if (
        ev.target === teklifLightboxEl ||
        ev.target.classList.contains('pfos-teklif-lightbox__close')
      ) {
        closeTeklifLightbox();
      }
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') closeTeklifLightbox();
    });
    return teklifLightboxEl;
  }

  function openTeklifLightbox(url) {
    if (!url) return;
    var lb = ensureTeklifLightbox();
    lb.querySelector('.pfos-teklif-lightbox__img').src = url;
    lb.hidden = false;
    document.body.classList.add('pfos-teklif-lightbox-open');
  }

  function closeTeklifLightbox() {
    if (!teklifLightboxEl) return;
    teklifLightboxEl.hidden = true;
    teklifLightboxEl.querySelector('.pfos-teklif-lightbox__img').src = '';
    document.body.classList.remove('pfos-teklif-lightbox-open');
  }

  function toggleTeklifRow(row) {
    if (!row) return;
    var idx = row.getAttribute('data-pfos-idx');
    var detail = row.parentNode.querySelector(
      '.pfos-teklif-detail-row[data-pfos-detail="' + idx + '"]'
    );
    var open = !row.classList.contains('is-open');
    row.classList.toggle('is-open', open);
    row.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (detail) detail.hidden = !open;
  }

  function installTeklifInteractivity(root) {
    root = root || document.getElementById('teklif-tbl-wrap');
    if (!root || root.dataset.pfosTeklifBound === '1') return;
    root.dataset.pfosTeklifBound = '1';

    root.addEventListener('click', function (ev) {
      var zoom = ev.target.closest('.pfos-teklif-zoom');
      if (zoom) {
        ev.preventDefault();
        ev.stopPropagation();
        var url = zoom.getAttribute('data-img') || '';
        openTeklifLightbox(url);
        var gal = zoom.closest('.pfos-teklif-gallery');
        if (gal) {
          gal.querySelectorAll('.pfos-teklif-gallery__btn').forEach(function (b) {
            b.classList.toggle('is-active', b === zoom);
          });
        }
        return;
      }
      var row = ev.target.closest('.pfos-teklif-row');
      if (!row || ev.target.closest('a')) return;
      if (ev.target.closest('.pfos-teklif-toggle')) {
        ev.preventDefault();
        toggleTeklifRow(row);
        return;
      }
      toggleTeklifRow(row);
    });

    root.addEventListener('keydown', function (ev) {
      if (ev.key !== 'Enter' && ev.key !== ' ') return;
      var row = ev.target.closest('.pfos-teklif-row');
      if (!row) return;
      ev.preventDefault();
      toggleTeklifRow(row);
    });
  }

  function pfosFmtKwElk(r) {
    var v = Number(r && r.elk) || 0;
    return v > 0 ? v.toFixed(1) : '\u2014';
  }

  function pfosFmtKwGaz(r) {
    var v = Number(r && r.gaz) || 0;
    return v > 0 ? String(Math.round(v)) : '\u2014';
  }

  function stokNo(r) {
    if (r && r.pfSku) return escHtml(String(r.pfSku));
    return escHtml(r.tip_kodu || r.stokNo || r.kod || '');
  }

  function kaynak(r) {
    var m = String(r.pfB || r.marka || r.kaynak || '').trim();
    if (!m) return '\u2014';
    var cut = m.indexOf(' / ');
    if (cut > 0) m = m.slice(0, cut);
    return escHtml(m);
  }

  function curLabel(cur) {
    return cur === 'EUR' ? 'EUR' : 'TRY';
  }

  function pfosProformaSartlarItems() {
    return [
      'Teklifimiz 5 (BE\u015e) G\u00fcn ge\u00e7erlidir.',
      'Fiyatlar\u0131m\u0131za KDV dahil de\u011fil, faturada ayr\u0131ca eklenecektir.',
      'Proformada da yer ald\u0131\u011f\u0131 gibi faturam\u0131z EUR olarak kesilecektir.',
      'Ürünlerin bedeli döviz olarak kararlaştırılmış olup yasal düzenlemeler uyarınca bedelin TL olarak tahsil edilmesi gerektiği durumlarda oluşan kur ve vade farkları İNOKSAN tarafından müşteriye ayrıca fatura edilecektir.',
      'Kesilen TL satış faturaları için Türkiye Cumhuriyet Merkez Bankası Döviz Satış kuru baz alınarak işlem yapılacaktır. Fatura kesim tarihindeki TCMB Satış kuru baz alınacaktır.',
      "ÖTV'ye tabi ürünler için hesaplanacak ÖTV teklifimize dahil değildir, faturada ayrıca eklenecektir.",
      'Ödeme; Siparişte % 50 Peşin Banka havalesi, Kalanı Mal tesliminden önce Banka Havalesi şeklindedir. Teklifte yer alan ithal ve peşin tahsilattaki ticari ürünlerin bedeli ayrıca nakit olarak alınacaktır.',
      'Ödeme şartlarının yerine getirilmesi ile birlikte teklif sipariş statüsüne geçer. Aksi takdirde teslim süresinin revize edilmesi gerekecektir.',
      "Montaj İnoksan'a aittir.",
      'Her türlü tesisat ve malzemesi alıcıya aittir.',
      'Nakliye ve nakliye sigortası satıcıya aittir. Forklif, TRANSPALET vb. Alıcıya aittir.',
      'Her türlü yatay ve dikey taşımacılık alıcıya aittir. Kamyon üstü teslimdir. Mutfak katına çıkartılmalıdır.',
      'Teslim Yeri; Müşteri adresidir.',
      "Teslim Süresi; Mal teslimi kesin siparişinizi takiben 7 ile 9 hafta'dır. Görüşülecektir.",
      'Soğuk odalarda dış ünite mesafesi 10-12 metre olarak fiyatlandırılmıştır. Mesafenin artması durumunda doğacak fiyat artışı fiyatlara yansıtılacaktır.',
      'Yukarıdaki hususlar ve/veya iş kapsamında değişiklik, sipariş miktarında artış veya azalma olması durumunda karşılıklı mutabakata varılarak, revize edilir.',
      'Ölçü bekler çözümünün sipariş geçildikten sonraki 1 ay içinde tamamlanması gerekmektedir. Bu süre zarfında detayları verilmeyen siparişler iptal edilecektir. Ölçü bekler çözümü sonrası ürünlerin teslim tarihi en az 3-4 hafta olarak belirlenir.',
      "Taraflar, tuttukları cari hesaba ilişkin mutabakatlarını TTK'da belirtildiği üzere yazılı bir şekilde gerçekleştirebilecekleri gibi elektronik ortamda da e-posta ya da çeşitli yazılımlar vasıtasıyla da gerçekleştirebileceklerdir. Bu kapsamda taraflar, dijital ortamda gerçekleştirilen cari hesap mutabakatlarının da yazılı bir şekilde gerçekleştirilmiş mutabakat gibi sonuç doğuracağını ve tarafları bağlayacağını kabul etmektedir.",
      'Zamanında ödenmeyen vadesi geçmiş bedel için vade dolum tarihi itibariyle aylık olarak %5 vade farkı uygulanır.',
      "Siparişinize ait depoda 1 aydan fazla bekleyen mallar için aylık depodaki sipariş bedelinin %5'i kadar depo kirası uygulanacaktır.",
      'Ölçü bekler çözümünün sözleşme imzalandıktan sonraki 3 ay içinde tamamlanması gerekmektedir. Bu süre zarfında detayları verilmeyen siparişler güncel fiyatlar üzerinden sizlere bildirilecektir. Ölçü bekler çözümü sonrası ürünlerin teslim tarihi en az 3-4 hafta olarak belirlenir.',
    ];
  }

  function pfosDimMmPlain(r) {
    if (!r) return '\u2014';
    if (r.olcuMm) return String(r.olcuMm);
    var en = r.enMm != null ? r.enMm : r.en;
    var boy = r.boyMm != null ? r.boyMm : r.boy;
    var yuk = r.yukMm != null ? r.yukMm : r.yukseklikMm != null ? r.yukseklikMm : r.yuk;
    if (en != null && boy != null && yuk != null) {
      return String(en) + '\u00d7' + String(boy) + '\u00d7' + String(yuk) + ' mm';
    }
    var raw = r.olcu || r.olcuText || r.dimensions || '';
    if (!raw) return '\u2014';
    var m = String(raw).match(
      /(\d+(?:[.,]\d+)?)\s*[x\u00d7X*]\s*(\d+(?:[.,]\d+)?)\s*[x\u00d7X*]\s*(\d+(?:[.,]\d+)?)/i
    );
    if (!m) return String(raw);
    function num(s) {
      return Math.round(parseFloat(String(s).replace(',', '.')));
    }
    var a = num(m[1]);
    var b = num(m[2]);
    var c = num(m[3]);
    var isCm = /cm/i.test(raw) || Math.max(a, b, c) <= 250;
    if (isCm) {
      a *= 10;
      b *= 10;
      c *= 10;
    }
    return a + '\u00d7' + b + '\u00d7' + c + ' mm';
  }

  function tanimBaslikPlain(r) {
    var stok = stokNoPlain(r);
    var ad = rowNamePlain(r);
    var parts = ['A.'];
    if (ad) parts.push(ad.toLocaleUpperCase('tr-TR'));
    if (stok && (!ad || ad.toLowerCase().indexOf(stok.toLowerCase()) === -1)) {
      parts.push(stok);
    } else if (stok && !ad) {
      parts.push(stok);
    }
    return parts.join(' ').replace(/\s+/g, ' ').trim();
  }

  function rowNamePlain(r) {
    return String((r && (r.ad || r.kod)) || '');
  }

  function stokNoPlain(r) {
    if (r && r.pfSku) return String(r.pfSku);
    return String((r && (r.tip_kodu || r.stokNo || r.kod)) || '');
  }

  function kaynakPlain(r) {
    var m = String((r && (r.pfB || r.marka || r.kaynak)) || '').trim();
    if (!m) return '\u2014';
    var cut = m.indexOf(' / ');
    if (cut > 0) m = m.slice(0, cut);
    return m;
  }

  function lineTotalRow(r) {
    if (window.EqustoPfosCalc && typeof EqustoPfosCalc.rowLineTotal === 'function') {
      return EqustoPfosCalc.rowLineTotal(r);
    }
    if (r.fiyat_haric || r.fiyat_kaynak === 'haric') return 0;
    return r.lineTotal != null
      ? r.lineTotal
      : (Number(r.birim) || 0) * (Number(r.adet) || 1);
  }

  function collectProformaLines(rows, ctx) {
    var calc = window.EqustoPfosCalc;
    var zones =
      calc && calc.groupByZones
        ? calc.groupByZones(rows, (ctx && ctx.pfosZones) || null, ctx && ctx.alan)
        : [];
    var lines = [];
    var totals = { elk: 0, gaz: 0, grand: 0 };
    function addItem(r, bol, grup, poz, ek) {
      var adet = Number(r.adet) || 1;
      var birim = Number(r.birim) || 0;
      var line = lineTotalRow(r);
      totals.elk += (Number(r.elk) || 0) * adet;
      totals.gaz += (Number(r.gaz) || 0) * adet;
      totals.grand += line;
      lines.push({
        kind: 'item',
        bol: bol,
        grup: grup,
        poz: poz,
        ek: ek,
        r: r,
        adet: adet,
        birim: birim,
        line: line,
      });
      if (r.davlumbaz) {
        lines.push({
          kind: 'note',
          text:
            'Yangın söndürme sistemi zorunludur. Lütfen yetkili firma ile görüşün.',
        });
      }
    }

    if (zones.length) {
      zones.forEach(function (z, zi) {
        var bolNo = pad2(zi + 1);
        var pozInZone = 0;
        lines.push({
          kind: 'bol',
          bolNo: bolNo + '.',
          label: String(z.label || z.key || 'BÖLÜM').toLocaleUpperCase('tr-TR'),
        });
        (z.rows || []).forEach(function (r) {
          pozInZone += 1;
          addItem(r, bolNo, 'A', pad2(pozInZone), '');
        });
      });
    } else {
      (rows || []).forEach(function (r, i) {
        addItem(r, i === 0 ? '01' : '01', 'A', pad2(i + 1), '');
      });
    }

    return { lines: lines, totals: totals };
  }

  var PF_EXCEL_HEADERS = [
    'Böl.', 'Grup', 'Poz', 'EK', 'Stok no', 'Tanımı', 'Kaynak',
    'Boy', 'En', 'Yük.', 'Adet', 'Satış', 'Toplam Satış', 'Döviz',
  ];

  function buildProformaExcelAoa(rows, ctx) {
    var c = Object.assign({}, ctx || {}, { currency: (ctx && ctx.currency) || 'TRY' });
    var cur = c.currency || 'TRY';
    var collected = collectProformaLines(rows, c);
    var aoa = [];

    aoa.push(['Form No: ' + PF_FORM_NO]);
    aoa.push(['Tarih', c.tarih || todayTr()]);
    aoa.push(['Proforma No', proformaNo(c)]);
    aoa.push(['İşin Adı', isinAdi(c)]);
    aoa.push(['PROFORMA FATURA']);
    aoa.push([]);

    aoa.push(PF_EXCEL_HEADERS.slice());

    collected.lines.forEach(function (ln) {
      if (ln.kind === 'bol') {
        aoa.push([ln.bolNo, ln.label, '', '', '', '', '', '', '', '', '', '', '', '']);
        return;
      }
      if (ln.kind === 'grup') {
        aoa.push(['', ln.label, '', '', '', '', '', '', '', '', '', '', '', '']);
        return;
      }
      if (ln.kind === 'note') {
        aoa.push(['', '', '', '', '', ln.text, '', '', '', '', '', '', '', '']);
        return;
      }
      var r = ln.r;
      var dims = parseDimParts(r);
      var haric = pfosFmtRowPrice(r, 'TRY', 'unit') === 'hari\u00e7';
      var birimCell = haric
        ? 'hari\u00e7'
        : pfosFmtProformaMoney(eurFromTl(ln.birim, c), 'EUR');
      var lineCell = haric
        ? 'hari\u00e7'
        : pfosFmtProformaMoney(eurFromTl(ln.line, c), 'EUR');
      aoa.push([
        ln.bol, ln.grup, ln.poz, ln.ek || '',
        stokNoPlain(r), tanimBaslikPlain(r), kaynakPlain(r),
        dims ? String(dims.boy) + ' X' : '',
        dims ? String(dims.en) + ' X' : '',
        dims ? String(dims.yuk) : '',
        ln.adet,
        birimCell,
        lineCell,
        'EUR',
      ]);

    });

    aoa.push([]);
    aoa.push([
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      'Sütun toplamları →',
      collected.totals.elk.toFixed(1) + ' kW',
      Math.round(collected.totals.gaz) + ' kW',
      '',
      '',
      '',
      '',
    ]);
    aoa.push([
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      'GENEL TOPLAM (KDV Hariç)',
      pfosFmtProformaMoney(collected.totals.grand, cur),
      curLabel(cur),
    ]);
    aoa.push([
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      'TOPLAM :',
      pfosFmtProformaMoney(collected.totals.grand, cur),
      curLabel(cur),
    ]);
    aoa.push([]);
    aoa.push(['ŞARTLAR']);
    pfosProformaSartlarItems().forEach(function (t) {
      aoa.push(['* ' + t]);
    });

    return { aoa: aoa, proformaNo: proformaNo(c) };
  }

  function ensureXlsx(cb) {
    if (window.XLSX) {
      cb();
      return;
    }
    var s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    s.onload = cb;
    s.onerror = function () {
      alert('Excel kütüphanesi yüklenemedi. İnternet bağlantınızı kontrol edin.');
    };
    document.head.appendChild(s);
  }

  function downloadProformaExcel(rows, ctx) {
    if (
      window.EqustoPfosTeklifExcel &&
      (typeof EqustoPfosTeklifExcel.downloadTeklifV12Excel === 'function' ||
        typeof EqustoPfosTeklifExcel.downloadTeklifV10Excel === 'function')
    ) {
      var dl =
        EqustoPfosTeklifExcel.downloadTeklifV12Excel ||
        EqustoPfosTeklifExcel.downloadTeklifV10Excel;
      dl(rows, ctx);
      return;
    }
    ensureXlsx(function () {
      var built = buildProformaExcelAoa(rows, ctx);
      var ws = XLSX.utils.aoa_to_sheet(built.aoa);
      ws['!cols'] = [
        { wch: 6 },
        { wch: 8 },
        { wch: 5 },
        { wch: 4 },
        { wch: 14 },
        { wch: 42 },
        { wch: 16 },
        { wch: 18 },
        { wch: 9 },
        { wch: 8 },
        { wch: 6 },
        { wch: 12 },
        { wch: 14 },
        { wch: 6 },
      ];
      var wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Proforma');
      XLSX.writeFile(wb, 'proforma-' + built.proformaNo + '.xlsx');
    });
  }

  function buildPfosProformaHeaderHtml(ctx) {
    var c = ctx || {};
    var cur = c.currency || 'TRY';
    return (
      '<header class="pfos-pf-hd">' +
      '<div class="pfos-pf-hd__form">Form No: ' +
      escHtml(PF_FORM_NO) +
      '</div>' +
      '<div class="pfos-pf-hd__grid">' +
      '<div class="pfos-pf-hd__row"><span class="lbl">Tarih</span><span class="sep">:</span><span class="val">' +
      escHtml(c.tarih || todayTr()) +
      '</span></div>' +
      '<div class="pfos-pf-hd__row"><span class="lbl">Proforma No</span><span class="sep">:</span><span class="val">' +
      escHtml(proformaNo(c)) +
      '</span></div>' +
      '<div class="pfos-pf-hd__row pfos-pf-hd__row--wide"><span class="lbl">\u0130\u015fin Ad\u0131</span><span class="sep">:</span><span class="val">' +
      escHtml(isinAdi(c)) +
      '</span></div>' +
      '</div>' +
      '<h2 class="pfos-pf-hd__title">PROFORMA FATURA</h2>' +
      '<p class="pfos-pf-hd__meta">Fiyatlar ' +
      escHtml(curLabel(cur)) +
      ', KDV hari\u00e7' +
      (c.alan ? ' \u00b7 ' + escHtml(String(c.alan)) + ' m\u00b2' : '') +
      '</p></header>'
    );
  }

  function buildPfosProformaTableHtml(rows, ctx, cur) {
    var c = Object.assign({}, ctx || {});
    var currency = 'EUR';
    var calc = window.EqustoPfosCalc;
    var zones =
      calc && calc.groupByZones
        ? calc.groupByZones(rows, c.pfosZones, c.alan)
        : [];
    var COLS = INOKSAN_COLS;
    var tbody = '';
    var grand = 0;

    function lineTotal(r) {
      return lineTotalRow(r);
    }

    function productRows(r, bol, grup, poz, ek) {
      var adet = Number(r.adet) || 1;
      var haric = pfosFmtRowPrice(r, currency, 'unit') === 'hari\u00e7';
      var birimCell = haric
        ? 'hari\u00e7'
        : pfosFmtProformaMoney(eurFromTl(Number(r.birim) || 0, c), currency);
      var lineCell = haric
        ? 'hari\u00e7'
        : pfosFmtProformaMoney(eurFromTl(lineTotal(r), c), currency);
      var dim = pfosInoksanDim(r);
      if (!haric) grand += eurFromTl(lineTotal(r), c);
      tbody +=
        '<tr class="pfos-pf-row">' +
        '<td class="c-bol">' +
        escHtml(bol) +
        '</td>' +
        '<td class="c-grp">' +
        escHtml(grup) +
        '</td>' +
        '<td class="c-poz">' +
        escHtml(poz) +
        '</td>' +
        '<td class="c-ek">' +
        escHtml(ek) +
        '</td>' +
        '<td class="c-stok">' +
        stokNo(r) +
        '</td>' +
        '<td class="c-tanim">' +
        tanimBaslikHtml(r) +
        '</td>' +
        '<td class="c-kaynak">' +
        kaynak(r) +
        '</td>' +
        '<td class="c-dim c-num">' +
        dim.boy +
        '</td>' +
        '<td class="c-dim c-num">' +
        dim.en +
        '</td>' +
        '<td class="c-dim c-num">' +
        dim.yuk +
        '</td>' +
        '<td class="c-num c-adet">' +
        escHtml(String(adet)) +
        '</td>' +
        '<td class="c-num c-birim">' +
        birimCell +
        '</td>' +
        '<td class="c-num c-toplam">' +
        lineCell +
        '</td>' +
        '<td class="c-doviz">EUR</td></tr>';
      tbody +=
        '<tr class="pfos-pf-spec">' +
        '<td class="c-foto" colspan="7">' +
        pfosRowImageHtml(r) +
        '</td>' +
        '<td class="c-spec" colspan="7">' +
        specBlockHtml(r) +
        '</td></tr>';
    }

    if (zones.length) {
      zones.forEach(function (z, zi) {
        var bolNo = pad2(zi + 1);
        var bolLabel = String(z.label || z.key || 'B\u00d6L\u00dcM').toLocaleUpperCase('tr-TR');
        var pozInZone = 0;
        tbody +=
          '<tr class="pfos-pf-bol"><td colspan="' +
          COLS +
          '">' +
          escHtml(bolNo + '. ' + bolLabel) +
          '</td></tr>';
        (z.rows || []).forEach(function (r) {
          pozInZone += 1;
          productRows(r, bolNo, 'A', pad2(pozInZone), '');
        });
      });
    } else {
      (rows || []).forEach(function (r, i) {
        productRows(r, i === 0 ? '01' : '01', 'A', pad2(i + 1), '');
      });
    }

    var tfoot =
      '<tfoot>' +
      '<tr class="pfos-pf-total"><td colspan="12" class="r"><b>GENEL TOPLAM (KDV Hari\u00e7)</b></td>' +
      '<td class="c-num"><b>' +
      pfosFmtProformaMoney(grand, currency) +
      '</b></td>' +
      '<td class="c-doviz"><b>EUR</b></td></tr></tfoot>';

    return (
      '<div class="pfos-pf-tbl-wrap pfos-inoksan-tbl-wrap">' +
      '<table class="pfos-pf-tbl pfos-inoksan-tbl" aria-label="Proforma ekipman listesi">' +
      '<thead><tr>' +
      INOKSAN_THEAD +
      '</tr></thead><tbody>' +
      tbody +
      '</tbody>' +
      tfoot +
      '</table></div>'
    );
  }


  function buildPfosSartlarHtml(extraStyle) {
    var st = extraStyle ? ' style="' + extraStyle + '"' : '';
    var lis = pfosProformaSartlarItems()
      .map(function (t) {
        return '<li>' + escHtml(t) + '</li>';
      })
      .join('');
    return (
      '<div class="pfos-pf-sartlar sartlar"' +
      st +
      '><div class="sartlar-title pfos-pf-sartlar__title">\u015eartlar\u0131m\u0131z</div>' +
      '<ul class="pfos-pf-sartlar__list">' +
      lis +
      '</ul></div>'
    );
  }

  function pad3(n) {
    return ('00' + n).slice(-3);
  }

  function teklifNoV10(ctx) {
    if (ctx && ctx.proformaNo) return String(ctx.proformaNo);
    var d = new Date();
    return 'EQS-' + d.getFullYear() + '-' + pad3(Math.floor(Math.random() * 900) + 100);
  }

  function musteriAdi(ctx) {
    var c = ctx || {};
    return c.musteri || c.meslek || c.adSoyad || '\u2014';
  }

  function modelFromRow(r) {
    var b = String((r && (r.pfB || r.marka)) || '').trim();
    var n = String((r && r.pfN) || '').trim();
    if (!n) return String((r && (r.tip_kodu || r.kod)) || '\u2014');
    if (b && n.toLowerCase().indexOf(b.toLowerCase()) === 0) {
      return n.slice(b.length).replace(/^[\s\-–—]+/, '').trim() || n;
    }
    return n;
  }

  function shortDescPlain(r) {
    var g = String((r && (r.pfN || r.ad)) || '').trim();
    if (g.length > 120) return g.slice(0, 117) + '\u2026';
    return g || '\u2014';
  }

  function specBulletsHtml(r) {
    var lines = [];
    if (r.ad) lines.push('\u2022  ' + r.ad);
    if (r.olcu || r.olcuText) lines.push('\u2022  \u00d6l\u00e7\u00fc: ' + pfosDimMmPlain(r));
    if (r.tip_kodu) lines.push('\u2022  Stok / tip: ' + r.tip_kodu);
    if (r.pfB || r.marka) lines.push('\u2022  Marka: ' + (r.pfB || r.marka));
    if (!lines.length) lines.push('\u2022  PFOS katalog kalemi');
    return lines.map(escHtml).join('<br>');
  }

  function pfosTeklifV10SartlarItems() {
    return [
      'Teklifimiz 7 (YED\u0130) g\u00fcn ge\u00e7erlidir.',
      'Fiyatlar\u0131m\u0131za KDV dahil de\u011fil, faturada ayr\u0131ca eklenecektir.',
      'Faturam\u0131z TL olarak kesilecektir. Tutarlar PFOS net liste fiyatlar\u0131d\u0131r (KDV hari\u00e7).',
      '\u00d6deme; sipari\u015fte %50 pe\u015fin banka havalesi, kalan\u0131 mal tesliminden \u00f6nce banka havalesi \u015feklindedir.',
      'Montaj sat\u0131c\u0131ya aittir. Tesisat ve sarf malzemesi al\u0131c\u0131ya aittir.',
      'Nakliye sat\u0131c\u0131ya aittir. Ta\u015f\u0131ma al\u0131c\u0131ya aittir.',
      'Teslim yeri m\u00fc\u015fteri adresidir.',
      'Teslim s\u00fcresi: kesin sipari\u015ften sonra 6-8 hafta.',
      'Zaman\u0131nda \u00f6denmeyen bedel i\u00e7in ayl\u0131k %5 vade fark\u0131 uygulan\u0131r.',
    ];
  }

  function buildPfosTeklifV10Html(rows, amt, opts, ctx) {
    var c = Object.assign({}, ctx || {});
    var currency = 'EUR';
    var calc = window.EqustoPfosCalc;
    var zones =
      calc && calc.groupByZones
        ? calc.groupByZones(rows, c.pfosZones, c.alan)
        : [];
    var COLS = INOKSAN_COLS;
    var tbody = '';
    var grand = 0;
    var pozGlobal = 0;

    function lineTotal(r) {
      return lineTotalRow(r);
    }

    function productRows(r, bol, grup, poz, ek) {
      var adet = Number(r.adet) || 1;
      var haric = pfosFmtRowPrice(r, currency, 'unit') === 'hari\u00e7';
      var birimCell = haric
        ? 'hari\u00e7'
        : pfosFmtProformaMoney(eurFromTl(Number(r.birim) || 0, c), currency);
      var lineCell = haric
        ? 'hari\u00e7'
        : pfosFmtProformaMoney(eurFromTl(lineTotal(r), c), currency);
      var dim = pfosInoksanDim(r);
      if (!haric) grand += eurFromTl(lineTotal(r), c);
      tbody +=
        '<tr class="pfos-v10-item">' +
        '<td class="c-bol">' +
        escHtml(bol) +
        '</td>' +
        '<td class="c-grp">' +
        escHtml(grup) +
        '</td>' +
        '<td class="c-poz">' +
        escHtml(poz) +
        '</td>' +
        '<td class="c-ek">' +
        escHtml(ek) +
        '</td>' +
        '<td class="c-stok">' +
        stokNo(r) +
        '</td>' +
        '<td class="c-tanim">' +
        tanimBaslikHtml(r) +
        '</td>' +
        '<td class="c-kaynak">' +
        kaynak(r) +
        '</td>' +
        '<td class="c-dim c-num">' +
        dim.boy +
        '</td>' +
        '<td class="c-dim c-num">' +
        dim.en +
        '</td>' +
        '<td class="c-dim c-num">' +
        dim.yuk +
        '</td>' +
        '<td class="c-num c-adet">' +
        escHtml(String(adet)) +
        '</td>' +
        '<td class="c-num c-birim">' +
        birimCell +
        '</td>' +
        '<td class="c-num c-toplam">' +
        lineCell +
        '</td>' +
        '<td class="c-doviz">EUR</td></tr>';
      tbody +=
        '<tr class="pfos-v10-spec">' +
        '<td class="c-foto" colspan="7">' +
        pfosRowImageHtml(r) +
        '</td>' +
        '<td class="c-spec" colspan="7">' +
        specBlockHtml(r) +
        '</td></tr>';
    }

    if (zones.length) {
      zones.forEach(function (z, zi) {
        var bolNo = pad2(zi + 1);
        var bolLabel = String(z.label || z.key || 'B\u00d6L\u00dcM').toLocaleUpperCase('tr-TR');
        var pozInZone = 0;
        tbody +=
          '<tr class="pfos-v10-zone"><td colspan="' +
          COLS +
          '">' +
          escHtml(bolNo + '. ' + bolLabel) +
          '</td></tr>';
        (z.rows || []).forEach(function (r) {
          pozInZone += 1;
          productRows(r, bolNo, 'A', pad2(pozInZone), '');
        });
      });
    } else {
      (rows || []).forEach(function (r, i) {
        productRows(r, i === 0 ? '01' : '01', 'A', pad2(i + 1), '');
      });
    }

    var kur = c.eurTry > 0 ? Number(c.eurTry) : 52.8238;
    var kurHint =
      'EUR \u2014 TCMB Efektif Sat\u0131\u015f Kuru ' +
      kur.toLocaleString('tr-TR', {
        minimumFractionDigits: 4,
        maximumFractionDigits: 4,
      }) +
      ' (KDV hari\u00e7)';

    var sartlar = pfosTeklifV10SartlarItems()
      .map(function (t, i) {
        return '<li><span class="n">' + pad2(i + 1) + '.</span> ' + escHtml(t) + '</li>';
      })
      .join('');

    return (
      '<div class="pfos-v10"><div class="pfos-v10-sheet">' +
      '<div class="pfos-v10-top"><div class="pfos-v10-top__title">PROFORMA FATURA</div>' +
      '<div class="pfos-v10-top__no"><span>Say\u0131:</span> <strong>' +
      escHtml(teklifNoV10(c)) +
      '</strong></div></div>' +
      '<div class="pfos-v10-meta"><div><span>Proje:</span> ' +
      escHtml(isinAdi(c)) +
      '</div><div><span>M\u00fc\u015fteri:</span> ' +
      escHtml(musteriAdi(c)) +
      '</div><div><span>Tarih:</span> ' +
      escHtml(c.tarih || todayTr()) +
      '</div><div class="pfos-v10-kur">' +
      escHtml(kurHint) +
      '</div></div>' +
      '<div class="pfos-v10-tbl-wrap pfos-inoksan-tbl-wrap"><table class="pfos-pf-tbl pfos-inoksan-tbl">' +
      '<thead><tr>' +
      INOKSAN_THEAD +
      '</tr></thead><tbody>' +
      tbody +
      '</tbody><tfoot class="pfos-v10-tfoot"><tr><td colspan="12" class="lbl">GENEL TOPLAM (KDV HAR\u0130\u00c7)</td><td class="c-num"><b>' +
      pfosFmtProformaMoney(grand, currency) +
      '</b></td><td class="c-doviz"><b>EUR</b></td></tr></tfoot></table></div>' +
      '<div class="pfos-v10-sartlar"><div class="pfos-v10-sartlar__title">\u015eARTLARIMIZ</div><ul class="pfos-v10-sartlar__list">' +
      sartlar +
      '</ul></div>' +
      '<div class="pfos-v10-foot pfos-v10-foot--inoksan"><span>Form No: ' +
      escHtml(PF_FORM_NO) +
      '</span><span>EQUSTO</span></div></div></div>'
    );
  }


  function getPfosV10PrintCss() {
    var out = '';
    document.querySelectorAll('style').forEach(function (s) {
      var t = s.textContent || '';
      if (t.indexOf('.pfos-v10') !== -1) out += t;
    });
    return out + 'body{margin:12mm;font-family:system-ui,sans-serif}@page{margin:12mm}';
  }

  function printTeklifV10(rows, ctx) {
    var html = buildPfosTeklifV10Html(rows, 0, {}, ctx || {});
    var w = window.open('', '_blank');
    if (!w) {
      alert('Pop-up engellendi. localhost i\u00e7in pop-up izni verin veya Excel indirin.');
      return;
    }
    w.document.open();
    w.document.write(
      '<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8"><title>Teklif</title><style>' +
        getPfosV10PrintCss() +
        '</style></head><body>' +
        html +
        '<script>window.onload=function(){setTimeout(function(){window.focus();window.print();},500);};<\/script></body></html>'
    );
    w.document.close();
  }

  function buildPfosTeklifHtml(rows, amt, opts, ctx) {
    return buildPfosTeklifV10Html(rows, amt, opts, ctx);
  }

  function buildPfosKpiStripHtml(rows, ctx) {
    var c = ctx || {};
    var cur = c.currency || 'TRY';
    var calc = window.EqustoPfosCalc;
    var totals =
      calc && calc.quoteTotals
        ? calc.quoteTotals(rows)
        : { tahminiToplam: 0, toplamAdet: 0 };
    var zones =
      calc && calc.groupByZones
        ? calc.groupByZones(rows, c.pfosZones, c.alan)
        : [];
    var catCount =
      c.pfosZones && c.pfosZones.length ? c.pfosZones.length : zones.length;
    var alan = Number(c.alan) || 0;

    return (
      '<section class="pfos-kpi-strip" aria-label="Proje \u00f6zet metrikleri">' +
      '<div class="pfos-kpi-cell pfos-kpi-cell--accent"><div class="pfos-kpi-value">' +
      escHtml(String(alan)) +
      '</div><div class="pfos-kpi-label">Toplam m\u00b2</div></div>' +
      '<div class="pfos-kpi-cell pfos-kpi-cell--accent"><div class="pfos-kpi-value">' +
      catCount +
      '</div><div class="pfos-kpi-label">Kategori</div></div>' +
      '<div class="pfos-kpi-cell"><div class="pfos-kpi-value">' +
      (rows || []).length +
      '</div><div class="pfos-kpi-label">\u00dcr\u00fcn \u00e7e\u015fidi</div></div>' +
      '<div class="pfos-kpi-cell"><div class="pfos-kpi-value">' +
      totals.toplamAdet +
      '</div><div class="pfos-kpi-label">Toplam adet</div></div>' +
      '<div class="pfos-kpi-cell pfos-kpi-cell--primary"><div class="pfos-kpi-value">' +
      pfosFmtMoney(totals.tahminiToplam, cur) +
      '</div><div class="pfos-kpi-label">Tahmini toplam</div></div>' +
      '</section>'
    );
  }

  function zoneDominantBrand(rows) {
    var counts = {};
    (rows || []).forEach(function (r) {
      var b = String((r && (r.pfB || r.marka)) || '').trim();
      if (!b) return;
      var k = b.toLocaleLowerCase('tr-TR');
      counts[k] = (counts[k] || 0) + 1;
      if (!counts[k + '__lbl']) counts[k + '__lbl'] = b;
    });
    var best = '';
    var bestN = 0;
    Object.keys(counts).forEach(function (k) {
      if (k.indexOf('__lbl') >= 0) return;
      if (counts[k] > bestN) {
        bestN = counts[k];
        best = counts[k + '__lbl'] || k;
      }
    });
    return best;
  }

  function buildBrandSelectOptions(current, options, rows) {
    var seen = {};
    var html = '';
    function add(val) {
      var v = String(val || '').trim();
      if (!v) return;
      var k = v.toLocaleLowerCase('tr-TR');
      if (seen[k]) return;
      seen[k] = 1;
      var sel =
        current && current.toLocaleLowerCase('tr-TR') === k ? ' selected' : '';
      html +=
        '<option value="' + escHtml(v) + '"' + sel + '>' + escHtml(v) + '</option>';
    }
    html += '<option value="">Marka seçin…</option>';
    if (current) add(current);
    (options || []).forEach(add);
    var dom = zoneDominantBrand(rows);
    if (dom) add(dom);
    return html;
  }

  function buildPfosZoneBrandBarHtml(zones, ctx) {
    ctx = ctx || {};
    if (!zones || !zones.length) return '';
    var brandByZone = ctx.pfosBrandByZone || {};
    var brandOptions = ctx.pfosBrandOptions || [];
    var parts = zones
      .map(function (z) {
        var cur = brandByZone[z.key] || zoneDominantBrand(z.rows) || '';
        return (
          '<label class="pfos-zone-marka">' +
          '<span class="pfos-zone-marka__lbl">' +
          escHtml(z.label || z.key) +
          '</span>' +
          '<select class="pfos-cat-marka" data-zone="' +
          escHtml(z.key) +
          '">' +
          buildBrandSelectOptions(cur, brandOptions, z.rows) +
          '</select></label>'
        );
      })
      .join('');
    return (
      '<section class="pfos-teklif-marka-bar" aria-label="Kategori marka seçimi">' +
      '<p class="pfos-teklif-marka-hint">Kategori markası değişince o bölümdeki tüm makineler aynı markaya göre yeniden eşleşir.</p>' +
      '<div class="pfos-teklif-marka-grid">' +
      parts +
      '</div></section>'
    );
  }

  function buildPfosCategoryBlocksHtml(zones, ctxOrCur, ctxMaybe) {
    var ctx =
      ctxOrCur && typeof ctxOrCur === 'object' && (ctxOrCur.pfosZones || ctxOrCur.pfosBrandByZone)
        ? ctxOrCur
        : ctxMaybe || {};
    var cur =
      typeof ctxOrCur === 'string' ? ctxOrCur : ctx.currency || 'TRY';
    var brandByZone = ctx.pfosBrandByZone || {};
    var brandOptions = ctx.pfosBrandOptions || [];
    return (zones || [])
      .map(function (z, gi) {
        var open = gi === 0 ? ' open' : '';
        var curBrand = brandByZone[z.key] || zoneDominantBrand(z.rows) || '';
        var tbody = '';
        (z.rows || []).forEach(function (r) {
          var line = lineTotalRow(r);
          var olcu = r.olcu || r.olcuText || '\u2014';
          var marka = String((r.pfB || r.marka) || '').trim() || '\u2014';
          tbody +=
            '<tr>' +
            '<td>' +
            rowNameHtml(r) +
            '</td>' +
            '<td class="col-marka">' +
            escHtml(marka) +
            '</td>' +
            '<td class="dim">' +
            escHtml(olcu) +
            '</td>' +
            '<td class="num">' +
            escHtml(String(r.adet)) +
            '</td>' +
            '<td class="num">' +
            pfosFmtRowPrice(r, cur, 'unit') +
            '</td>' +
            '<td class="num">' +
            pfosFmtRowPrice(r, cur, 'line') +
            '</td></tr>';
          if (r.davlumbaz) {
            tbody +=
              '<tr class="pfos-cat__note"><td colspan="6">\u26a0 Yang\u0131n s\u00f6nd\u00fcrme sistemi zorunludur. L\u00fctfen yetkili firma ile g\u00f6r\u00fc\u015f\u00fcn.</td></tr>';
          }
        });
        return (
          '<details class="pfos-cat"' +
          open +
          ' style="--pfos-zone-color:' +
          escHtml(z.color || '#888') +
          '">' +
          '<summary class="pfos-cat__head">' +
          '<div class="pfos-cat__title">' +
          '<span class="pfos-cat__icon" aria-hidden="true">' +
          (z.icon || '\ud83d\udce6') +
          '</span>' +
          '<span class="pfos-cat__name">' +
          escHtml(z.label || z.key) +
          '</span></div>' +
          '<div class="pfos-cat__meta">' +
          '<span class="pfos-cat__badge">' +
          escHtml(String(z.m2 != null ? z.m2 : '\u2014')) +
          ' m\u00b2</span>' +
          '<span class="pfos-cat__total">' +
          pfosFmtMoney(z.total, cur) +
          '</span>' +
          '<span class="pfos-cat__chevron" aria-hidden="true"></span></div></summary>' +
          '<div class="pfos-cat__body"><table class="pfos-cat__table"><thead><tr>' +
          '<th>\u00dcr\u00fcn ad\u0131</th><th>Marka</th><th>\u00d6l\u00e7\u00fc</th><th class="num">Ad.</th><th class="num">Birim</th><th class="num">Toplam</th>' +
          '</tr></thead><tbody>' +
          tbody +
          '</tbody></table>' +
          '<div class="pfos-cat__foot"><span class="pfos-cat__foot-label">Kategori toplam\u0131</span><span class="pfos-cat__foot-value">' +
          pfosFmtMoney(z.total, cur) +
          '</span></div></div></details>'
        );
      })
      .join('');
  }

  window.EqustoPfosTeklifUi = {
    buildPfosTeklifHtml: buildPfosTeklifHtml,
    buildPfosTeklifV10Html: buildPfosTeklifV10Html,
    installTeklifInteractivity: installTeklifInteractivity,
    printTeklifV10: printTeklifV10,
    buildPfosProformaHeaderHtml: buildPfosProformaHeaderHtml,
    buildPfosProformaTableHtml: buildPfosProformaTableHtml,
    buildPfosKpiStripHtml: buildPfosKpiStripHtml,
    buildPfosCategoryBlocksHtml: buildPfosCategoryBlocksHtml,
    buildProformaExcelAoa: buildProformaExcelAoa,
    downloadProformaExcel: downloadProformaExcel,
    pfosProformaSartlarItems: pfosProformaSartlarItems,
    pfosFmtMoney: pfosFmtMoney,
    pfosFmtRowPrice: pfosFmtRowPrice,
    pfosDimMm: pfosDimMm,
  };
})();

