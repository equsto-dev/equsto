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
      return r.lineTotal != null
        ? r.lineTotal
        : (Number(r.birim) || 0) * (Number(r.adet) || 1);
    }

    function productRows(r, bol, grup, poz, ek) {
      var adet = Number(r.adet) || 1;
      var birimEur = eurFromTl(Number(r.birim) || 0, c);
      var lineEur = eurFromTl(lineTotal(r), c);
      var dim = pfosInoksanDim(r);
      grand += lineEur;
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
        pfosFmtProformaMoney(birimEur, currency) +
        '</td>' +
        '<td class="c-num c-toplam">' +
        pfosFmtProformaMoney(lineEur, currency) +
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
        var bolNo = pad2(zi + 1) + '.';
        var bolLabel = String(z.label || z.key || 'B\u00d6L\u00dcM').toLocaleUpperCase('tr-TR');
        tbody +=
          '<tr class="pfos-v10-zone"><td colspan="' +
          COLS +
          '">' +
          escHtml(bolNo + ' ' + bolLabel) +
          '</td></tr>';
        (z.rows || []).forEach(function (r) {
          pozGlobal += 1;
          productRows(r, '', 'A', pad2(pozGlobal), '');
        });
      });
    } else {
      (rows || []).forEach(function (r, i) {
        pozGlobal += 1;
        productRows(r, i === 0 ? '01.' : '', 'A', pad2(pozGlobal), '');
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
