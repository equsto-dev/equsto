
  var INOKSAN_COLS = 14;
  var INOKSAN_THEAD =
    '<th>B\u00f6l.</th><th>Grup</th><th>Poz</th><th>EK</th><th>Stok no</th>' +
    '<th>Tan\u0131m\u0131</th><th>Kaynak</th>' +
    '<th class="num">Boy</th><th class="num">En</th><th class="num">Y\u00fck.</th>' +
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
