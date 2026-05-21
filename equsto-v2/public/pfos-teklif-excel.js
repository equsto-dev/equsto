;(function () {
  'use strict';

  var TEMPLATE_URL = '/data/templates/equsto_teklif_v13.xlsx';
  var PRODUCT_BLOCK_START = 5;
  var PRODUCT_BLOCK_ROWS = 16;
  var DATA_TEMPLATE_ROW = 6;
  var SPEC_TEMPLATE_ROW = 7;
  var SECTION_TEMPLATE_ROW = 5;
  var KW_TOTAL_TEMPLATE_ROW = 18;
  var SUBTOTAL_TEMPLATE_ROW = 19;
  var GRAND_TEMPLATE_ROW = 20;

  function pad2(n) {
    return ('0' + n).slice(-2);
  }

  function pad3(n) {
    return ('00' + n).slice(-3);
  }

  function todayTr() {
    var d = new Date();
    return pad2(d.getDate()) + '.' + pad2(d.getMonth() + 1) + '.' + d.getFullYear();
  }

  function teklifNo(ctx) {
    if (ctx && ctx.proformaNo) return String(ctx.proformaNo);
    var d = new Date();
    return (
      'EQS-' +
      d.getFullYear() +
      '-' +
      pad3(Math.floor(Math.random() * 900) + 100)
    );
  }

  function isinAdi(ctx) {
    var c = ctx || {};
    var parts = [c.franchise, c.konsept, c.dukkan, c.alt].filter(Boolean);
    if (c.sehir) parts.push(c.sehir);
    if (parts.length) return parts.join(' \u2014 ');
    return 'Equsto Proje Fabrikası Teklifi';
  }

  function musteriAdi(ctx) {
    var c = ctx || {};
    return c.musteri || c.meslek || c.adSoyad || '\u2014';
  }

  function parseDimParts(r) {
    if (!r) return null;
    var en = r.enMm != null ? r.enMm : r.en;
    var boy = r.boyMm != null ? r.boyMm : r.boy;
    var yuk =
      r.yukMm != null
        ? r.yukMm
        : r.yukseklikMm != null
          ? r.yukseklikMm
          : r.yuk;
    if (en != null && boy != null && yuk != null) {
      return { boy: boy, en: en, yuk: yuk };
    }
    var raw = r.olcuMm || r.olcu || r.olcuText || r.dimensions || '';
    if (!raw) return null;
    var m = String(raw).match(
      /(\d+(?:[.,]\d+)?)\s*[x\u00d7X*]\s*(\d+(?:[.,]\d+)?)\s*[x\u00d7X*]\s*(\d+(?:[.,]\d+)?)/i
    );
    if (!m) return null;
    return { en: m[1], boy: m[2], yuk: m[3] };
  }

  function olcuMmCell(r) {
    var p = parseDimParts(r);
    if (!p) return '\u2014';
    return String(p.en) + '\u00d7' + String(p.boy) + '\u00d7' + String(p.yuk);
  }

  function pfosRowImageUrl(r) {
    return String((r && (r.pfImage || r.image)) || '').trim();
  }

  function tanimBaslik(r, pozNum) {
    var stok = String((r && (r.tip_kodu || r.kod)) || '').trim();
    var ad = String((r && r.ad) || '').trim();
    var grup = 'A';
    var parts = ['A.'];
    if (ad) parts.push(ad.toLocaleUpperCase('tr-TR'));
    else if (r && r.pfN) parts.push(String(r.pfN).toLocaleUpperCase('tr-TR'));
    if (stok && ad.toLowerCase().indexOf(stok.toLowerCase()) === -1) {
      parts.push(stok);
    } else if (stok && !ad) {
      parts.push(stok);
    }
    return parts.join(' ').replace(/\s+/g, ' ').trim();
  }

  function specBullets(r) {
    var lines = [];
    var short = String((r && (r.pfN || r.desc || r.aciklama)) || '').trim();
    if (short) lines.push(short);
    if (r.ad && short !== r.ad) lines.push('\u2022  ' + r.ad);
    var dims = parseDimParts(r);
    if (dims) {
      lines.push(
        '\u2022  \u00d6l\u00e7\u00fc (mm): ' +
          dims.en +
          '\u00d7' +
          dims.boy +
          '\u00d7' +
          dims.yuk
      );
    }
    if (r.tip_kodu) lines.push('\u2022  Stok: ' + r.tip_kodu);
    if (r.pfB || r.marka) lines.push('\u2022  Marka: ' + (r.pfB || r.marka));
    if (r.elk > 0) lines.push('\u2022  Elektrik: ' + r.elk + ' kW');
    if (r.gaz > 0) lines.push('\u2022  Gaz: ' + r.gaz + ' kW');
    if (!lines.length) lines.push('\u2022  PFOS katalog kalemi');
    return lines.join('\n');
  }

  function eurUnit(r, ctx) {
    var kur = ctx && ctx.eurTry > 0 ? Number(ctx.eurTry) : null;
    var tl = Number(r.birim) || 0;
    if (kur && kur > 0 && tl > 0) return Math.round((tl / kur) * 100) / 100;
    return tl > 0 ? tl : 0;
  }

  function ensureExcelJS(cb) {
    if (window.ExcelJS) {
      cb();
      return;
    }
    var s = document.createElement('script');
    s.src =
      'https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js';
    s.onload = cb;
    s.onerror = function () {
      alert('Excel k\u00fct\u00fcphanesi (ExcelJS) y\u00fcklenemedi.');
    };
    document.head.appendChild(s);
  }

  function captureRowStyle(ws, rowNum) {
    var styles = {};
    var row = ws.getRow(rowNum);
    row.eachCell({ includeEmpty: true }, function (cell, col) {
      styles[col] = cell.style
        ? JSON.parse(JSON.stringify(cell.style))
        : {};
    });
    return { height: row.height, styles: styles };
  }

  function applyRowStyle(ws, rowNum, tpl) {
    if (!tpl) return;
    var dst = ws.getRow(rowNum);
    if (tpl.height) dst.height = tpl.height;
    Object.keys(tpl.styles || {}).forEach(function (col) {
      ws.getCell(rowNum, Number(col)).style = tpl.styles[col];
    });
  }

  function loadEurTryRate(cb) {
    fetch('/data/equsto-eur-try-rate.json', { cache: 'no-store' })
      .then(function (res) {
        return res.ok ? res.json() : null;
      })
      .then(function (data) {
        var rate = data && data.rate != null ? Number(data.rate) : null;
        cb(rate && rate > 0 ? rate : null);
      })
      .catch(function () {
        cb(null);
      });
  }

  function fillHeader(ws, ctx) {
    var c = ctx || {};
    var tarih = c.tarih || todayTr();
    var kur = c.eurTry != null && c.eurTry > 0 ? Number(c.eurTry) : 1;
    ws.getCell('J1').value = teklifNo(c);
    ws.getCell('C2').value = isinAdi(c);
    ws.getCell('H2').value = musteriAdi(c);
    ws.getCell('J2').value = tarih;
    ws.getCell('A3').value = 'TCMB Efektif Sat\u0131\u015f Kuru \u2013 ' + tarih;
    /* v13 şablon: I3=EUR/TRY etiketi, J3=kur (₺ formatı); K3:N3 birleşik — dokunma */
    ws.getCell('I3').value = 'EUR/TRY';
    var kurCell = ws.getCell('J3');
    kurCell.value = kur;
    kurCell.numFmt = '"\u20ba"#,##0.00';
  }

  function buildProductBlock(ws, rows, ctx) {
    var calc = window.EqustoPfosCalc;
    var zones =
      calc && calc.groupByZones
        ? calc.groupByZones(rows, (ctx && ctx.pfosZones) || null, ctx && ctx.alan)
        : [];

    var dataTpl = captureRowStyle(ws, DATA_TEMPLATE_ROW);
    var specTpl = captureRowStyle(ws, SPEC_TEMPLATE_ROW);
    var sectionTpl = captureRowStyle(ws, SECTION_TEMPLATE_ROW);
    var kwTpl = captureRowStyle(ws, KW_TOTAL_TEMPLATE_ROW);
    var subTpl = captureRowStyle(ws, SUBTOTAL_TEMPLATE_ROW);
    var grandTpl = captureRowStyle(ws, GRAND_TEMPLATE_ROW);

    ws.spliceRows(PRODUCT_BLOCK_START, PRODUCT_BLOCK_ROWS);

    var rowNum = PRODUCT_BLOCK_START;
    var sumRefs = [];
    var elkKwRefs = [];
    var gazKwRefs = [];
    var adetRefs = [];

    zones.forEach(function (z, zi) {
      var bolNo = pad2(zi + 1);
      var pozInZone = 0;
      ws.insertRow(rowNum, []);
      applyRowStyle(ws, rowNum, sectionTpl);
      try {
        ws.mergeCells('A' + rowNum + ':N' + rowNum);
      } catch (_) {}
      ws.getCell('A' + rowNum).value =
        bolNo + '. ' + String(z.label || z.key || 'B\u00d6L\u00dcM').toLocaleUpperCase('tr-TR');
      rowNum++;

      (z.rows || []).forEach(function (r) {
        pozInZone += 1;
        var adet = Number(r.adet) || 1;
        var birimEur = eurUnit(r, ctx);
        var stok = r.tip_kodu || r.kod || '';

        ws.insertRow(rowNum, []);
        applyRowStyle(ws, rowNum, dataTpl);
        var dr = rowNum;
        ws.getCell('A' + dr).value = bolNo;
        ws.getCell('B' + dr).value = 'A';
        ws.getCell('C' + dr).value = pad2(pozInZone);
        ws.getCell('D' + dr).value = '';
        ws.getCell('E' + dr).value = stok;
        ws.getCell('F' + dr).value = tanimBaslik(r, pozInZone);
        ws.getCell('G' + dr).value = r.pfB || r.marka || '';
        ws.getCell('H' + dr).value = olcuMmCell(r);
        ws.getCell('I' + dr).value = Number(r.elk) || 0;
        ws.getCell('I' + dr).numFmt = '0.0';
        ws.getCell('J' + dr).value = Number(r.gaz) || 0;
        ws.getCell('J' + dr).numFmt = '0.0';
        ws.getCell('K' + dr).value = adet;
        ws.getCell('L' + dr).value = birimEur;
        ws.getCell('L' + dr).numFmt = '#,##0.00';
        ws.getCell('M' + dr).value = { formula: 'K' + dr + '*L' + dr };
        ws.getCell('M' + dr).numFmt = '#,##0.00';
        ws.getCell('N' + dr).value = 'EUR';
        sumRefs.push('M' + dr);
        elkKwRefs.push('I' + dr + '*K' + dr);
        gazKwRefs.push('J' + dr + '*K' + dr);
        adetRefs.push('K' + dr);
        rowNum++;

        ws.insertRow(rowNum, []);
        applyRowStyle(ws, rowNum, specTpl);
        var sr = rowNum;
        var imgUrl = pfosRowImageUrl(r);
        try {
          ws.mergeCells('A' + sr + ':G' + sr);
          ws.mergeCells('H' + sr + ':N' + sr);
        } catch (_) {}
        ws.getCell('A' + sr).value = imgUrl
          ? 'Foto\u011fraf\n' + imgUrl
          : '\ud83d\udcf7\nFoto\u011fraf';
        ws.getCell('H' + sr).value = specBullets(r);
        ws.getCell('H' + sr).alignment = {
          vertical: 'top',
          wrapText: true,
        };
        rowNum++;
      });
    });

    var sumFormula = sumRefs.length ? sumRefs.join('+') : '0';
    var elkSum = elkKwRefs.length ? elkKwRefs.join('+') : '0';
    var gazSum = gazKwRefs.length ? gazKwRefs.join('+') : '0';
    var adetSum = adetRefs.length ? 'SUM(' + adetRefs.join(',') + ')' : '0';

    ws.insertRow(rowNum, []);
    applyRowStyle(ws, rowNum, kwTpl);
    var kwRow = rowNum;
    ws.getCell('H' + kwRow).value = 'S\u00fctun toplamlar\u0131 \u2192';
    ws.getCell('I' + kwRow).value = { formula: elkSum };
    ws.getCell('J' + kwRow).value = { formula: gazSum };
    ws.getCell('K' + kwRow).value = { formula: adetSum };
    rowNum++;

    ws.insertRow(rowNum, []);
    applyRowStyle(ws, rowNum, subTpl);
    ws.getCell('F' + rowNum).value = 'A. TOPLAM';
    ws.getCell('M' + rowNum).value = { formula: sumFormula };
    ws.getCell('M' + rowNum).numFmt = '#,##0.00';
    ws.getCell('N' + rowNum).value = 'EUR';
    var totalRow = rowNum;
    rowNum++;

    ws.insertRow(rowNum, []);
    applyRowStyle(ws, rowNum, grandTpl);
    ws.getCell('F' + rowNum).value = 'GENEL TOPLAM  (KDV HAR\u0130\u00c7)';
    ws.getCell('M' + rowNum).value = { formula: 'M' + totalRow };
    ws.getCell('M' + rowNum).numFmt = '#,##0.00';
    ws.getCell('N' + rowNum).value = 'EUR';

    return rowNum;
  }

  function downloadTeklifV12Excel(rows, ctx) {
    ensureExcelJS(function () {
      loadEurTryRate(function (eurTry) {
        var mergedCtx = Object.assign({}, ctx || {});
        if (eurTry) mergedCtx.eurTry = eurTry;
        fetch(TEMPLATE_URL, { cache: 'no-store' })
          .then(function (res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.arrayBuffer();
          })
          .then(function (buf) {
            var wb = new window.ExcelJS.Workbook();
            return wb.xlsx.load(buf).then(function () {
              var ws = wb.worksheets[0];
              fillHeader(ws, mergedCtx);
              buildProductBlock(ws, rows, mergedCtx);
              return wb.xlsx.writeBuffer();
            });
          })
          .then(function (buffer) {
            var no = teklifNo(mergedCtx);
            var blob = new Blob([buffer], {
              type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            var a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'equsto-teklif-' + no + '.xlsx';
            document.body.appendChild(a);
            a.click();
            setTimeout(function () {
              URL.revokeObjectURL(a.href);
              a.remove();
            }, 400);
          })
          .catch(function (err) {
            console.error(err);
            alert(
              'Teklif Excel dosyas\u0131 olu\u015fturulamad\u0131. \u015eablon y\u00fcklendi mi kontrol edin.'
            );
          });
      });
    });
  }

  function downloadTeklifV10Excel(rows, ctx) {
    downloadTeklifV12Excel(rows, ctx);
  }

  window.EqustoPfosTeklifExcel = {
    downloadTeklifV12Excel: downloadTeklifV12Excel,
    downloadTeklifV10Excel: downloadTeklifV12Excel,
    templateUrl: TEMPLATE_URL,
  };
})();
