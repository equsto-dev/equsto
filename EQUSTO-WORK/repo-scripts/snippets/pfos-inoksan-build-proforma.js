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
        pfosFmtProformaMoney(birimEur, currency) +
        '</td>' +
        '<td class="c-num c-toplam">' +
        pfosFmtProformaMoney(lineEur, currency) +
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
        var bolNo = pad2(zi + 1) + '.';
        var bolLabel = String(z.label || z.key || 'B\u00d6L\u00dcM').toLocaleUpperCase('tr-TR');
        tbody +=
          '<tr class="pfos-pf-bol"><td colspan="' +
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
