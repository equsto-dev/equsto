# -*- coding: utf-8 -*-
"""PFOS — not al maddeleri: marka, teklif foto, elk/gaz, adim 05, sohbet UI."""
from pathlib import Path

ROOT = Path(r"c:\D Disk\EQUSTO-CURSOR")

# ── 1. pfos-zone-catalog.json ─────────────────────────────────────────────
cat_path = ROOT / "public/data/pfos-zone-catalog.json"
cat = cat_path.read_text(encoding="utf-8")
old_kombi = '''          "name": "Kombi fırın (Rational)",
          "dimensions": "10 GN 1/1",
          "classification": "ZRN",
          "m2_per_unit": null,
          "min_qty": 1,
          "tip_kodu": "kombi_firin_6t",'''
new_kombi = '''          "name": "Kombi fırın (Rational)",
          "marka": "Rational",
          "dimensions": "10 GN 1/1",
          "classification": "ZRN",
          "m2_per_unit": null,
          "min_qty": 1,
          "tip_kodu": "kombi_firin_6t",
          "elk_kw": 11.4,
          "gaz_kw": 0,'''
if old_kombi in cat:
    cat = cat.replace(old_kombi, new_kombi, 1)
    cat_path.write_text(cat, encoding="utf-8")
    print("catalog: kombi marka/elk ok")
else:
    print("catalog: kombi block skip")

# ── 2. pfos-calc-engine.js ─────────────────────────────────────────────────
eng_path = ROOT / "public/pfos-calc-engine.js"
eng = eng_path.read_text(encoding="utf-8")

if "PFOS_TIP_BRAND" not in eng:
    eng = eng.replace(
        "  var TIP_MATCH_RULES = {",
        """  var PFOS_TIP_BRAND = { kombi_firin_6t: 'RATIONAL' };
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
    var m = String(name || '').match(/\\(([^)]+)\\)\\s*$/);
    return m ? String(m[1]).trim() : '';
  }

  function parseSpecsFromText(text) {
    var s = String(text || '');
    var out = { elk: 0, gaz: 0, enMm: null, boyMm: null, yukMm: null };
    if (!s) return out;
    var elkM =
      s.match(/(?:elektrik|güç|guc|enerji)[^\\d]{0,40}?(\\d+(?:[.,]\\d+)?)\\s*kw/i) ||
      s.match(/(\\d+(?:[.,]\\d+)?)\\s*kw\\b/i);
    if (elkM) out.elk = parseFloat(String(elkM[1]).replace(',', '.'));
    var gazM =
      s.match(/(?:doğalgaz|dogalgaz|gaz)[^\\d]{0,30}?(\\d+(?:[.,]\\d+)?)\\s*kw/i);
    if (gazM) out.gaz = parseFloat(String(gazM[1]).replace(',', '.'));
    var dimM =
      s.match(/(?:ölçü|olcu|ölçüler)[^\\d]{0,20}?(\\d+(?:[.,]\\d+)?)\\s*[x×*]\\s*(\\d+(?:[.,]\\d+)?)\\s*[x×*]\\s*(\\d+(?:[.,]\\d+)?)/i) ||
      s.match(/(\\d+(?:[.,]\\d+)?)\\s*[x×*]\\s*(\\d+(?:[.,]\\d+)?)\\s*[x×*]\\s*(\\d+(?:[.,]\\d+)?)\\s*(?:cm|mm)?/i);
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

  var TIP_MATCH_RULES = {""",
        1,
    )

eng = eng.replace(
    """    var rule = TIP_MATCH_RULES[tip];
    if (rule && rule(name)) return true;
    var terms = TIP_SEARCH_TERMS[tip] || [tip.replace(/_/g, ' ')];
    return terms.some(function (t) {
      return name.indexOf(normShopName(t)) >= 0;
    });""",
    """    var rule = TIP_MATCH_RULES[tip];
    if (rule) return rule(name);
    var terms = TIP_SEARCH_TERMS[tip] || [tip.replace(/_/g, ' ')];
    return terms.some(function (t) {
      return name.indexOf(normShopName(t)) >= 0;
    });""",
)

eng = eng.replace(
    """        rows.push({
          id: p.id || '',
          tip_kodu: p.tip_kodu || '',
          tag: tag,
          name: p.name || '',
          dim: p.dimensions || p.dim || '',
          qty: qty,
          unit: unit,
          unit_try: unit,
          price_source: pr.kaynak,
          total: qty * unit,
          m2_per_unit: p.m2_per_unit,
        });""",
    """        rows.push({
          id: p.id || '',
          tip_kodu: p.tip_kodu || '',
          tag: tag,
          name: p.name || '',
          marka: p.marka || parseMarkaFromName(p.name),
          dim: p.dimensions || p.dim || '',
          qty: qty,
          unit: unit,
          unit_try: unit,
          price_source: pr.kaynak,
          total: qty * unit,
          m2_per_unit: p.m2_per_unit,
          elk: Number(p.elk_kw) || 0,
          gaz: Number(p.gaz_kw) || 0,
        });""",
)

eng = eng.replace(
    """          lineTotal: birim * (Number(r.qty) || 1),
          elk: 0,
          gaz: 0,
          marka: '',
        });""",
    """          lineTotal: birim * (Number(r.qty) || 1),
          elk: Number(r.elk) || 0,
          gaz: Number(r.gaz) || 0,
          marka: r.marka || parseMarkaFromName(r.name) || '',
        });""",
)

old_enrich = """  function enrichRowShopFields(row, pool) {
    if (!row) return row;
    var out = Object.assign({}, row);
    if (!out.pfDept && out.pfZone) out.pfDept = ZONE_TO_DEPT[out.pfZone] || 'pisirme';
    if (out.pfB && out.pfN && out.pfDept) return out;

    var match = findShopMatch(out, pool);
    if (!match) return out;

    out.pfB = shopItemBrand(match);
    out.pfN = shopItemName(match);
    if (match.equstoPage) out.pfEqustoPage = match.equstoPage;
    out.pfDept = deptSegForItem(match, out.pfZone);
    if (!out.marka && out.pfB) out.marka = out.pfB;
    return out;
  }"""

new_enrich = """  function shopItemImages(it) {
    var raw = (it && (it.raw || it)) || {};
    return raw.images || it.images || [];
  }

  function shopImageUrl(it) {
    var imgs = shopItemImages(it);
    if (!imgs || !imgs.length) return '';
    var p = String(imgs[0]).replace(/\\\\/g, '/');
    if (/^https?:\\/\\//i.test(p)) return p;
    if (p.indexOf('/') === 0) return p;
    return '/data/' + p.replace(/^\\/?data\\//, '');
  }

  function enrichRowShopFields(row, pool) {
    if (!row) return row;
    var out = Object.assign({}, row);
    if (!out.pfDept && out.pfZone) out.pfDept = ZONE_TO_DEPT[out.pfZone] || 'pisirme';
    var lockedBrand = PFOS_TIP_BRAND[String(out.tip_kodu || '').trim()];
    if (lockedBrand) { out.pfB = lockedBrand; out.marka = lockedBrand; }

    var match = null;
    if (!(out.pfB && out.pfN && out.pfDept)) match = findShopMatch(out, pool);
    if (match) {
      if (!lockedBrand) {
        out.pfB = shopItemBrand(match);
        if (!out.marka) out.marka = out.pfB;
      }
      out.pfN = shopItemName(match);
      if (match.equstoPage) out.pfEqustoPage = match.equstoPage;
      out.pfDept = deptSegForItem(match, out.pfZone);
      var specs = parseSpecsFromText(
        (match.raw && match.raw.specs) || match.specs || shopItemName(match)
      );
      applyParsedSpecs(out, specs);
      var img = shopImageUrl(match);
      if (img) out.pfImage = img;
    }
    applyTipMeta(out);
    if (!out.marka && out.pfB) out.marka = out.pfB;
    return out;
  }"""

if old_enrich in eng:
    eng = eng.replace(old_enrich, new_enrich)
    print("calc-engine: enrich ok")
else:
    print("calc-engine: enrich SKIP")

eng_path.write_text(eng, encoding="utf-8")
print("calc-engine saved")

# ── 3. pfos-teklif-ui.js ───────────────────────────────────────────────────
ui_path = ROOT / "public/pfos-teklif-ui.js"
ui = ui_path.read_text(encoding="utf-8")

if "pfosRowImageHtml" not in ui:
    insert_after = "  function pfosDimMm(r) {\n    return escHtml(pfosDimMmPlain(r));\n  }"
    block = """  function pfosDimMm(r) {
    return escHtml(pfosDimMmPlain(r));
  }

  function pfosDimPart(r, key) {
    if (!r) return '\\u2014';
    var en = r.enMm != null ? r.enMm : r.en;
    var boy = r.boyMm != null ? r.boyMm : r.boy;
    var yuk = r.yukMm != null ? r.yukMm : r.yukseklikMm != null ? r.yukseklikMm : r.yuk;
    if (en != null && boy != null && yuk != null) {
      if (key === 'en') return escHtml(String(en));
      if (key === 'boy') return escHtml(String(boy));
      if (key === 'yuk') return escHtml(String(yuk));
    }
    var plain = pfosDimMmPlain(r);
    if (plain === '\\u2014') return plain;
    var m = String(plain).match(/(\\d+)\\u00d7(\\d+)\\u00d7(\\d+)/);
    if (!m) return '\\u2014';
    if (key === 'en') return escHtml(m[1]);
    if (key === 'boy') return escHtml(m[2]);
    if (key === 'yuk') return escHtml(m[3]);
    return '\\u2014';
  }

  function pfosRowImageHtml(r) {
    var url = String((r && (r.pfImage || r.image)) || '').trim();
    if (!url) return '<span class="pfos-v10-foto-ph" aria-hidden="true">\\u2014</span>';
    return (
      '<img class="pfos-v10-foto-img" src="' +
      escHtml(url) +
      '" alt="" loading="lazy" decoding="async">'
    );
  }"""
    ui = ui.replace(insert_after, block, 1)

# Replace v10 table - COLS 13 -> 15, add boy/en/yuk columns
ui = ui.replace("    var COLS = 13;", "    var COLS = 15;")

old_add = """      tbody +=
        '<tr class="pfos-v10-item"><td class="c-foto">\\ud83d\\udcf7</td>' +
        '<td class="c-poz">' + escHtml(poz) + '</td>' +
        '<td class="c-stok">' + stokNo(r) + '</td>' +
        '<td class="c-ad">' + rowNameHtml(r) + '</td>' +
        '<td class="c-marka">' + escHtml(r.pfB || r.marka || '') + '</td>' +
        '<td class="c-model">' + escHtml(modelFromRow(r)) + '</td>' +
        '<td class="c-acikl">' + escHtml(shortDescPlain(r)) + '</td>' +
        '<td class="c-num">' + adet + '</td>' +
        '<td class="c-olcu">' + pfosDimMm(r) + '</td>' +
        '<td class="c-num">' + pfosFmtKwElk(r) + '</td>' +
        '<td class="c-num">' + pfosFmtKwGaz(r) + '</td>' +
        '<td class="c-num">' + pfosFmtProformaMoney(birim, cur) + '</td>' +
        '<td class="c-num">' + pfosFmtProformaMoney(line, cur) + '</td></tr>';"""

new_add = """      tbody +=
        '<tr class="pfos-v10-item"><td class="c-foto">' + pfosRowImageHtml(r) + '</td>' +
        '<td class="c-poz">' + escHtml(poz) + '</td>' +
        '<td class="c-stok">' + stokNo(r) + '</td>' +
        '<td class="c-ad">' + rowNameHtml(r) + '</td>' +
        '<td class="c-marka">' + escHtml(r.pfB || r.marka || '') + '</td>' +
        '<td class="c-model">' + escHtml(modelFromRow(r)) + '</td>' +
        '<td class="c-acikl">' + escHtml(shortDescPlain(r)) + '</td>' +
        '<td class="c-num">' + adet + '</td>' +
        '<td class="c-dim c-num">' + pfosDimPart(r, 'boy') + '</td>' +
        '<td class="c-dim c-num">' + pfosDimPart(r, 'en') + '</td>' +
        '<td class="c-dim c-num">' + pfosDimPart(r, 'yuk') + '</td>' +
        '<td class="c-num">' + pfosFmtKwElk(r) + '</td>' +
        '<td class="c-num">' + pfosFmtKwGaz(r) + '</td>' +
        '<td class="c-num">' + pfosFmtProformaMoney(birim, cur) + '</td>' +
        '<td class="c-num">' + pfosFmtProformaMoney(line, cur) + '</td></tr>';"""

if old_add in ui:
    ui = ui.replace(old_add, new_add)

ui = ui.replace(
    "'<tr class=\"pfos-v10-spec\"><td class=\"c-foto\">\\ud83d\\udcf7</td><td colspan=\"' +",
    "'<tr class=\"pfos-v10-spec\"><td class=\"c-foto\">' + pfosRowImageHtml(r) + '</td><td colspan=\"' +",
)

ui = ui.replace(
    "'<th>Foto</th><th>Grup/Poz</th><th>Stok</th><th>\\u00dcr\\u00fcn</th><th>Marka</th><th>Model</th>' +\n      '<th>A\\u00e7\\u0131klama</th><th class=\"num\">Adet</th><th>\\u00d6l\\u00e7\\u00fc</th>' +\n      '<th class=\"num\">Elk</th><th class=\"num\">Gaz</th><th class=\"num\">Birim</th><th class=\"num\">Tutar</th>' +",
    "'<th>Foto</th><th>Grup/Poz</th><th>Stok</th><th>\\u00dcr\\u00fcn</th><th>Marka</th><th>Model</th>' +\n      '<th>A\\u00e7\\u0131klama</th><th class=\"num\">Adet</th><th class=\"num\">Boy</th><th class=\"num\">En</th><th class=\"num\">Y\\u00fck</th>' +\n      '<th class=\"num\">Elk</th><th class=\"num\">Gaz</th><th class=\"num\">Birim</th><th class=\"num\">Tutar</th>' +",
)

ui = ui.replace(
    "'<tr><td colspan=\"12\" class=\"lbl\">GENEL TOPLAM (KDV HAR\\u0130\\u00c7)</td><td class=\"c-num\"><b>' +",
    "'<tr><td colspan=\"14\" class=\"lbl\">GENEL TOPLAM (KDV HAR\\u0130\\u00c7)</td><td class=\"c-num\"><b>' +",
)

ui_path.write_text(ui, encoding="utf-8")
print("teklif-ui saved")

print("done")
