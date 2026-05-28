/**
 * EqustoEngine — Aşama 1: Schema tekleştirme (admin ↔ index)
 *
 * Görev:
 *   - /api/proje-akis'ten admin'in tanımladığı schema'yı (questions, shopTypes, rules,
 *     eqSets, products) yükle.
 *   - Schema.questions dizisinden DOM form üret (admin'deki DEFAULT_QUESTIONS yapısıyla
 *     uyumlu: select | select_conditional | multi_select | number | text | optional_select).
 *   - Cevapları admin question id'lerinden (q_meslek, q_konsept, q_dukkan_turu, ...) okuyup
 *     anasayfa motor girdisine (konsept, alan_m2, pisir, ...) eşle.
 *
 * Bu dosya hem admin.html hem index.html tarafından <script src="equsto-engine.js"> ile
 * yüklenir; tek-kaynak prensibinin altyapısıdır. Rule motoru ve eqSets eşleşmesi sonraki
 * aşamada bağlanır (Aşama 3).
 */
(function (global) {
  'use strict';

  var SCHEMA = null;
  var __mode = 'init'; // 'init' | 'schema' | 'fallback'

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function lbl(s) {
    if (typeof global.eqPfosLabel === 'function') return global.eqPfosLabel(s);
    return s;
  }

  function isTruthy(v) {
    if (v === true) return true;
    if (typeof v === 'string') return v.toLowerCase() === 'true' || v === '1';
    return false;
  }

  async function loadSchema(apiBase) {
    var base = apiBase || '';
    try {
      var ctrl = new AbortController();
      var to = setTimeout(function () { ctrl.abort(); }, 6000);
      var r = await fetch(base + '/proje-akis', { signal: ctrl.signal });
      clearTimeout(to);
      if (!r.ok) return null;
      var j = await r.json();
      if (j && j.success && j.data && Array.isArray(j.data.questions) && j.data.questions.length > 0) {
        SCHEMA = j.data;
        return SCHEMA;
      }
    } catch (_) { /* sessiz */ }
    return null;
  }

  function renderQuestion(q, opts) {
    opts = opts || {};
    var id = 'eqs_' + q.id;
    var req = isTruthy(q.required);
    var reqAttr = req ? ' required' : '';
    var reqStar = req ? ' <span style="color:#c0392b;">*</span>' : '';
    var noteHtml = q.note ? '<small style="font-weight:500;color:var(--eq-text-subtle,#9aa1ad);font-size:10px;font-style:italic;line-height:1.3;display:block;margin-top:2px;">' + esc(q.note) + '</small>' : '';
    var cls = opts.fullWidthIds && opts.fullWidthIds.indexOf(q.id) >= 0 ? ' class="full"' : '';

    if (q.type === 'multi_select') {
      var chips = (q.options || []).map(function (o) {
        return '<span class="eq-chip" data-eq-multi="' + esc(q.id) + '" data-val="' + esc(o) + '" tabindex="0" role="button">' + esc(lbl(o)) + '</span>';
      }).join('');
      return '<label class="full" data-qid="' + esc(q.id) + '">' + esc(lbl(q.text)) + reqStar +
        '<div class="eq-chip-grid" data-qid="' + esc(q.id) + '">' + chips + '</div>' + noteHtml + '</label>';
    }
    if (q.type === 'select') {
      var optsHtml = '<option value="">— Seçiniz —</option>' + (q.options || []).map(function (o) {
        return '<option value="' + esc(o) + '">' + esc(lbl(o)) + '</option>';
      }).join('');
      return '<label' + cls + ' data-qid="' + esc(q.id) + '">' + esc(lbl(q.text)) + reqStar +
        '<select id="' + id + '" data-qid="' + esc(q.id) + '"' + reqAttr + '>' + optsHtml + '</select>' + noteHtml + '</label>';
    }
    if (q.type === 'select_conditional') {
      var depend = q.dependsOn || 'q_konsept';
      return '<label' + cls + ' data-qid="' + esc(q.id) + '" data-conditional="1" data-depends="' + esc(depend) + '">' + esc(lbl(q.text)) + reqStar +
        '<select id="' + id + '" data-qid="' + esc(q.id) + '"' + reqAttr + '><option value="">— Önce üst soruyu seçin —</option></select>' + noteHtml + '</label>';
    }
    if (q.type === 'optional_select') {
      var optsHtml2 = '<option value="">— (opsiyonel) —</option>' + (q.options || []).map(function (o) {
        return '<option value="' + esc(o) + '">' + esc(lbl(o)) + '</option>';
      }).join('');
      return '<label' + cls + ' data-qid="' + esc(q.id) + '">' + esc(lbl(q.text)) +
        '<select id="' + id + '" data-qid="' + esc(q.id) + '">' + optsHtml2 + '</select>' + noteHtml + '</label>';
    }
    if (q.type === 'number') {
      return '<label' + cls + ' data-qid="' + esc(q.id) + '">' + esc(lbl(q.text)) + reqStar +
        '<input id="' + id + '" data-qid="' + esc(q.id) + '" type="number" min="0" inputmode="numeric"' + reqAttr + '>' + noteHtml + '</label>';
    }
    if (q.type === 'text') {
      return '<label' + cls + ' data-qid="' + esc(q.id) + '">' + esc(lbl(q.text)) + reqStar +
        '<input id="' + id + '" data-qid="' + esc(q.id) + '" type="text"' + reqAttr + '>' + noteHtml + '</label>';
    }
    return '';
  }

  function bindConditional(container, q) {
    var wrap = container.querySelector('label[data-qid="' + q.id + '"][data-conditional="1"]');
    if (!wrap) return;
    var sel = wrap.querySelector('select');
    if (!sel) return;
    var depend = wrap.getAttribute('data-depends') || 'q_konsept';
    var parent = container.querySelector('select[data-qid="' + depend + '"]');
    if (!parent) return;
    var fill = function () {
      var v = parent.value;
      var list = (q.branches && q.branches[v]) || [];
      sel.innerHTML = '<option value="">' + (list.length ? '— Seçiniz —' : '— Önce üst soruyu seçin —') + '</option>' +
        list.map(function (o) { return '<option value="' + esc(o) + '">' + esc(lbl(o)) + '</option>'; }).join('');
    };
    parent.addEventListener('change', fill);
    fill();
  }

  function bindMultiChips(container, onChange) {
    container.querySelectorAll('.eq-chip-grid').forEach(function (grid) {
      grid.addEventListener('click', function (e) {
        var c = e.target.closest('.eq-chip');
        if (!c) return;
        c.classList.toggle('active');
        if (typeof onChange === 'function') onChange();
      });
      grid.addEventListener('keydown', function (e) {
        if (e.key !== ' ' && e.key !== 'Enter') return;
        var c = document.activeElement && document.activeElement.closest('.eq-chip');
        if (!c || !grid.contains(c)) return;
        e.preventDefault();
        c.classList.toggle('active');
        if (typeof onChange === 'function') onChange();
      });
    });
  }

  /**
   * Schema'ya göre verilen container'a form alanlarını basar.
   * opts:
   *   - skipIds: bu id'leri atla (örn. ['q_karar'] — anasayfa için anlamsız)
   *   - fullWidthIds: bu id'leri tam-genişlik label olarak çıkar
   *   - onChange: form değişiminde tetiklenecek (localStorage save vb.)
   * Döner: true (başarılı), false (schema yok ya da render edilemedi)
   */
  function renderForm(container, schema, opts) {
    if (!container || !schema || !Array.isArray(schema.questions) || schema.questions.length === 0) {
      __mode = 'fallback';
      return false;
    }
    opts = opts || {};
    var skip = opts.skipIds || [];
    var questions = schema.questions.filter(function (q) { return q && q.id && skip.indexOf(q.id) < 0; });
    container.innerHTML = questions.map(function (q) { return renderQuestion(q, opts); }).join('');
    questions.forEach(function (q) {
      if (q.type === 'select_conditional') bindConditional(container, q);
    });
    bindMultiChips(container, opts.onChange);
    if (typeof opts.onChange === 'function') {
      container.addEventListener('change', opts.onChange);
      container.addEventListener('input', opts.onChange);
    }
    __mode = 'schema';
    return true;
  }

  function readAnswers(container) {
    var out = {};
    if (!container) return out;
    container.querySelectorAll('select[data-qid], input[data-qid]').forEach(function (el) {
      var qid = el.getAttribute('data-qid');
      var v = (el.value || '').trim();
      if (el.type === 'number') {
        var n = parseFloat(v);
        out[qid] = Number.isFinite(n) ? n : null;
      } else {
        out[qid] = v;
      }
    });
    var byMulti = {};
    container.querySelectorAll('.eq-chip-grid[data-qid]').forEach(function (g) {
      var qid = g.getAttribute('data-qid');
      byMulti[qid] = [];
    });
    container.querySelectorAll('.eq-chip.active[data-eq-multi]').forEach(function (c) {
      var qid = c.getAttribute('data-eq-multi');
      (byMulti[qid] = byMulti[qid] || []).push(c.getAttribute('data-val'));
    });
    Object.keys(byMulti).forEach(function (k) { out[k] = byMulti[k]; });
    return out;
  }

  function setAnswers(container, answers) {
    if (!container || !answers) return;
    Object.keys(answers).forEach(function (qid) {
      var v = answers[qid];
      if (Array.isArray(v)) {
        v.forEach(function (val) {
          var sel = '.eq-chip[data-eq-multi="' + qid + '"][data-val="' + (window.CSS && CSS.escape ? CSS.escape(val) : val) + '"]';
          var c = container.querySelector(sel);
          if (c) c.classList.add('active');
        });
      } else {
        var el = container.querySelector('[data-qid="' + qid + '"]');
        if (el && 'value' in el && v != null) {
          el.value = v;
          if (el.tagName === 'SELECT') {
            try { el.dispatchEvent(new Event('change', { bubbles: true })); } catch (_) {}
          }
        }
      }
    });
  }

  /**
   * Admin'in schema cevaplarını (q_meslek/q_konsept/q_dukkan_turu/q_m2/...) anasayfa motor
   * girdisine eşler. Bilinmeyen q_id'ler 'ek' altında muhafaza edilir.
   */
  function adapt(answers) {
    if (!answers) answers = {};
    var copy = {};
    Object.keys(answers).forEach(function (k) { copy[k] = answers[k]; });
    var known = ['q_meslek','q_konsept','q_dukkan_turu','q_alt_tip','q_ne_pisireceksin','q_pisir_hatlari','q_kapasite','q_m2','q_m2_mutfak','q_m2_yikama','q_m2_depo','q_lokasyon','q_cadde','q_acik_adres','q_karar','q_elektrik_gaz','q_franchise_marka'];
    var ek = {};
    Object.keys(copy).forEach(function (k) {
      if (known.indexOf(k) < 0) ek[k] = copy[k];
    });
    return {
      meslek: copy.q_meslek || '',
      konsept: copy.q_konsept || '',
      konsept_label: copy.q_konsept || '',
      dukkan: copy.q_dukkan_turu || '',
      alt_tip: copy.q_alt_tip || '',
      pisir: copy.q_ne_pisireceksin || [],
      pisir_hatlari: copy.q_pisir_hatlari || [],
      kapasite: copy.q_kapasite || '',
      alan_m2: Number(copy.q_m2) || 0,
      m2_mutfak: Number(copy.q_m2_mutfak) || 0,
      m2_yikama: Number(copy.q_m2_yikama) || 0,
      m2_depo: Number(copy.q_m2_depo) || 0,
      sehir: copy.q_lokasyon || '',
      ilce: '',
      mahalle: '',
      cadde: copy.q_cadde || '',
      sokak: '',
      acik_adres: copy.q_acik_adres || '',
      gunluk_kapak: 0,
      elektrik_gaz: copy.q_elektrik_gaz || [],
      franchise_marka: copy.q_franchise_marka || '',
      karar: copy.q_karar || '',
      ek: ek
    };
  }

  function mode() { return __mode; }
  function isSchemaMode() { return __mode === 'schema'; }

  // ── KURAL MOTORU ────────────────────────────────────────────────────────────
  // admin.html'deki evaluateRules ile aynı mantık; rules dizisi schema'dan gelir.
  function _getField(obj, path) {
    if (!obj) return undefined;
    return String(path || '').split('.').reduce(function (o, k) { return o == null ? o : o[k]; }, obj);
  }
  function _evalCond(c, input) {
    var val = _getField(input, c.field);
    if (val === undefined || val === null) return false;
    if (c.op === 'eq')  return val == c.value;
    if (c.op === 'neq') return val != c.value;
    if (c.op === 'lt')  return Number(val) <  Number(c.value);
    if (c.op === 'lte') return Number(val) <= Number(c.value);
    if (c.op === 'gt')  return Number(val) >  Number(c.value);
    if (c.op === 'gte') return Number(val) >= Number(c.value);
    if (c.op === 'in')  return Array.isArray(c.value) && c.value.indexOf(val) >= 0;
    return false;
  }
  function _triggerFired(rule, input) {
    if (!rule || !rule.trigger || !Array.isArray(rule.trigger.conditions)) return false;
    var conds = rule.trigger.conditions.map(function (c) { return _evalCond(c, input); });
    return rule.trigger.logic === 'AND' ? conds.every(Boolean) : conds.some(Boolean);
  }

  function runRules(input, rules) {
    var result = { status: 'OK', blocks: [], warnings: [], forced: [], restricts: [], calcs: {}, trace: [] };
    if (!Array.isArray(rules) || !rules.length) return result;
    var sorted = rules.slice().sort(function (a, b) { return (a.priority || 0) - (b.priority || 0); });
    for (var i = 0; i < sorted.length; i++) {
      var r = sorted[i];
      if (!_triggerFired(r, input)) continue;
      result.trace.push(r.id);
      if (r.type === 'BLOCK') {
        result.blocks.push({ rule_id: r.id, message: (r.action && r.action.message) || '', suggestion: (r.action && r.action.suggestion) || '' });
        result.status = 'BLOCKED';
      } else if (r.type === 'WARN') {
        result.warnings.push({ rule_id: r.id, message: (r.action && r.action.message) || '', suggestion: (r.action && r.action.suggestion) || '', escalate: (r.action && r.action.escalate_to_block) || false });
        if (result.status === 'OK') result.status = 'WARNING';
      } else if (r.type === 'FORCE') {
        var adds = (r.action && r.action.force_add) || [];
        for (var j = 0; j < adds.length; j++) {
          var tip = adds[j];
          if (!result.forced.find(function (x) { return x.tip_kodu === tip; })) {
            result.forced.push({ rule_id: r.id, tip_kodu: tip, label: (r.action && r.action.label) || '', note: (r.action && r.action.note) || '' });
          }
        }
      } else if (r.type === 'CALC') {
        var formula = (r.action && r.action.formula) || '';
        var v = NaN;
        // Sınırlı, güvenli değerlendirme — yalnız bilinen kalıplar:
        var m1 = formula.match(/^ceil\(([a-zA-Z_][\w.]*)\/(\d+)\)$/);
        var m2 = formula.match(/^([a-zA-Z_][\w.]*)\*(\d+(?:\.\d+)?)$/);
        if (m1) {
          var x1 = Number(_getField(input, m1[1])) || 0;
          v = Math.ceil(x1 / Number(m1[2]));
        } else if (m2) {
          var x2 = Number(_getField(input, m2[1])) || 0;
          v = x2 * Number(m2[2]);
        } else {
          var num = Number(formula); if (Number.isFinite(num)) v = num;
        }
        result.calcs[r.action.calc_field] = { value: v, unit: r.action.unit || '', label: r.action.label || '', rule_id: r.id };
      } else if (r.type === 'RESTRICT') {
        result.restricts.push({ rule_id: r.id, restrict_konsepts: (r.action && r.action.restrict_konsepts) || [], message: (r.action && r.action.message) || '' });
      }
    }
    return result;
  }

  /**
   * Adapter çıktısından kural motoru için ek alanları türetir:
   *   ekipman_flags.fryer/grill/bar/blast_chiller (q_ne_pisireceksin/q_pisir_hatlari'ndan)
   *   cooking_load (LOW/MEDIUM/HIGH/EXTREME)
   *   cold_need (BASIC/MEDIUM/FULL_CHAIN)
   *   lokasyon (Cadde/AVM/Konteyner — q_lokasyon serbest metninden basit eşleşme)
   *   butce_segment (Starter/Pro — bilinmiyorsa Pro varsayılır)
   */
  function deriveRuleInput(adapted) {
    var inp = {};
    Object.keys(adapted || {}).forEach(function (k) { inp[k] = adapted[k]; });
    var pisir = (adapted && adapted.pisir) || [];
    var hat = (adapted && adapted.pisir_hatlari) || [];
    var all = [].concat(pisir, hat).map(function (s) { return String(s || '').toLocaleLowerCase('tr-TR'); });
    var has = function (re) { return all.some(function (s) { return re.test(s); }); };
    inp.ekipman_flags = {
      fryer: has(/fritöz|kızart|fried/),
      grill: has(/ızgara|izgara|grill|ocakbaş/),
      bar: has(/içecek|kahve|bar/),
      blast_chiller: false
    };
    // cooking_load — kabaca konsept + pisir sayısı
    var konsept = String(adapted.konsept || '').toLocaleLowerCase('tr-TR');
    var dukkan = String(adapted.dukkan || '').toLocaleLowerCase('tr-TR');
    var ext = (konsept.indexOf('catering') >= 0 || konsept.indexOf('üretim') >= 0 || konsept.indexOf('uretim') >= 0 || konsept.indexOf('hotel') >= 0);
    var high = (dukkan.indexOf('steakhouse') >= 0 || dukkan.indexOf('kebap') >= 0 || dukkan.indexOf('fastfood') >= 0 || pisir.length >= 5);
    inp.cooking_load = ext ? 'EXTREME' : (high ? 'HIGH' : (pisir.length >= 3 ? 'MEDIUM' : 'LOW'));
    inp.cold_need = (konsept.indexOf('catering') >= 0 || konsept.indexOf('hotel') >= 0) ? 'FULL_CHAIN' : (konsept.indexOf('pastane') >= 0 ? 'MEDIUM' : 'BASIC');
    // Lokasyon — q_lokasyon ya da q_acik_adres içinden ipucu
    var locText = ((adapted.sehir || '') + ' ' + (adapted.acik_adres || '')).toLocaleLowerCase('tr-TR');
    inp.lokasyon = (/avm|mall|alışveriş/.test(locText)) ? 'AVM' : (/konteyner/.test(locText) ? 'Konteyner' : 'Cadde');
    inp.butce_segment = inp.butce_segment || 'Pro';
    inp.gunluk_kapak = Number(adapted.gunluk_kapak) || 0;
    inp.alan_m2 = Number(adapted.alan_m2) || 0;
    inp.konsept_id = adapted.konsept || '';
    return inp;
  }

  // ── EQUİPMAN SETLERİ (eqSets) ───────────────────────────────────────────────
  // Admin tanımladığı setler: { id, name, selectedIds: [productId,...] }
  // selectedIds → schema.products dizisindeki kayıtlardır (admin'in küratörlü ürünleri).
  // Anasayfa motoru, konsepte uyan setleri tercih eder → "gerçek küratörlü teklif".

  function _normTr(s) {
    return String(s == null ? '' : s).toLocaleLowerCase('tr-TR')
      .replace(/[ıİiI]/g, 'i').replace(/[şŞ]/g, 's').replace(/[ğĞ]/g, 'g')
      .replace(/[üÜ]/g, 'u').replace(/[öÖ]/g, 'o').replace(/[çÇ]/g, 'c')
      .replace(/[^a-z0-9]+/g, ' ').trim();
  }

  /**
   * Konsept/dukkan'e uyan eqSets'i bul; setlerin selectedIds'lerini schema.products
   * üzerinden somut ürün kayıtlarına genişletir.
   * Eşleşme stratejisi (sırayla):
   *   1) set.konsept === konsept (eq alanı varsa)
   *   2) set.name (normalize) içinde dukkan veya konsept geçiyorsa
   *   3) set.id içinde konsept veya dukkan token'ı varsa (örn. EQ_SET_STEAKHOUSE_STD)
   * Döner: { sets: [matchedSet,...], products: [productObj,...] } (products: tekil)
   */
  function matchEqSets(input, schema) {
    if (!schema || !Array.isArray(schema.eqSets) || !schema.eqSets.length) {
      return { sets: [], products: [] };
    }
    var konsept = _normTr(input && input.konsept);
    var dukkan = _normTr(input && input.dukkan);
    var altTip = _normTr(input && input.alt_tip);
    var prodIdx = {};
    (schema.products || []).forEach(function (p) { if (p && p.id) prodIdx[p.id] = p; });

    function score(set) {
      var sc = 0;
      var sk = _normTr(set.konsept);
      var sn = _normTr(set.name);
      var si = _normTr(set.id);
      if (sk && (sk === konsept || sk === dukkan)) sc += 10;
      [konsept, dukkan, altTip].filter(Boolean).forEach(function (q) {
        if (sn.indexOf(q) >= 0) sc += 4;
        if (si.indexOf(q) >= 0) sc += 3;
      });
      // YARDIMCI gibi anahtar kelimeler — ana set olmayanları biraz alçalt
      if (si.indexOf('yardimci') >= 0 || sn.indexOf('yardimci') >= 0) sc -= 1;
      if (si.indexOf('default') >= 0 || sn.indexOf('default') >= 0) sc -= 2;
      return sc;
    }

    var scored = schema.eqSets.map(function (s) { return { set: s, sc: score(s) }; })
      .filter(function (x) { return x.sc > 0; })
      .sort(function (a, b) { return b.sc - a.sc; });

    var pickedProducts = [];
    var seenIds = {};
    var pickedSets = [];
    scored.forEach(function (x) {
      var ids = (x.set && x.set.selectedIds) || [];
      var got = [];
      ids.forEach(function (id) {
        if (seenIds[id]) return;
        var p = prodIdx[id]; if (!p) return;
        seenIds[id] = 1;
        got.push(p);
      });
      if (got.length) {
        pickedSets.push(x.set);
        pickedProducts = pickedProducts.concat(got);
      }
    });
    return { sets: pickedSets, products: pickedProducts };
  }

  // ── FİYAT EŞLEŞTİRME (genişletilmiş overlay) ─────────────────────────────────
  // EqustoEngine.applyFiyatlar(list, fiyatMap)
  // - list öğesi tip_kodu taşıyorsa → birinci öncelik
  // - aksi halde marka+ad normalize anahtarıyla eşleşme aranır
  // - sonuç olarak öğe.p_overlay (sayısal TL) eklenir
  function applyFiyatlar(list, fiyatMap) {
    if (!Array.isArray(list) || !fiyatMap || typeof fiyatMap !== 'object') return list;
    var nameKeyMap = {};
    Object.keys(fiyatMap).forEach(function (k) {
      // tip_kodu doğrudan da kalsın; ek olarak "<marka> <ad>" formundaki anahtarları
      // normalize edip indexle (admin "Marka Adı | Ürün Adı" şeklinde key kullanabilir)
      var parts = String(k).split('|');
      if (parts.length >= 2) {
        nameKeyMap[_normTr(parts.join(' '))] = fiyatMap[k];
      }
    });
    for (var i = 0; i < list.length; i++) {
      var u = list[i]; if (!u) continue;
      var v = NaN;
      if (u.tip_kodu && Object.prototype.hasOwnProperty.call(fiyatMap, u.tip_kodu)) {
        v = Number(fiyatMap[u.tip_kodu]);
      }
      if (!Number.isFinite(v) || v <= 0) {
        var key = _normTr((u.b || '') + ' ' + (u.n || ''));
        if (nameKeyMap[key] != null) v = Number(nameKeyMap[key]);
      }
      if (Number.isFinite(v) && v > 0) {
        u.p_overlay = v;
        // string p alanını da güncelle (TR formatlı)
        try { u.p = v.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
        catch (_) { u.p = String(v); }
      }
    }
    return list;
  }

  // ── CORPUS: yüklenen proje listelerinden öğrenen ekipman önerisi ──────────
  // proposeFromCorpus(input, corpus, opts)
  //   input  : anasayfa motor girdisi (adapt() çıktısı)
  //   corpus : [{ id, context:{konsept,dukkan,alt_tip,alan_m2,gunluk_kapak,pisir:[],...}, equipment:[{tip_kodu,ad,kategori,adet,birim_tl,...}] }, ...]
  //   opts   : { topN?:5, minFreq?:0.4 }
  //
  // Algoritma:
  //   1) corpus'taki her projeye similarity skoru hesapla (konsept eq=10, dukkan eq=5, alt_tip eq=3,
  //      pisir overlap=2/match, alan_m2 yakınlığı=3/1, gunluk_kapak yakınlığı=2)
  //   2) skor > 0 olan en yüksek topN projeyi al
  //   3) ekipman frekansını hesapla (her tip_kodu kaç projede geçti / kullanılan proje sayısı)
  //   4) frekans >= minFreq olanları döndür (sıralı: frekans desc, sample_count desc)
  function _scoreCorpusProject(input, p) {
    if (!p || !p.context) return 0;
    var ctx = p.context;
    var sc = 0;
    var nk = _normTr(input.konsept);
    var nd = _normTr(input.dukkan);
    var na = _normTr(input.alt_tip);
    var ck = _normTr(ctx.konsept);
    var cd = _normTr(ctx.dukkan);
    var ca = _normTr(ctx.alt_tip);
    if (nk && ck && nk === ck) sc += 10;
    if (nd && cd && nd === cd) sc += 5;
    if (na && ca && na === ca) sc += 3;
    // pisir overlap (input.pisir [] vs ctx.pisir [])
    var ip = Array.isArray(input.pisir) ? input.pisir.map(_normTr) : [];
    var cp = Array.isArray(ctx.pisir) ? ctx.pisir.map(_normTr) : [];
    if (ip.length && cp.length) {
      var seenP = {};
      cp.forEach(function (x) { if (x) seenP[x] = 1; });
      ip.forEach(function (x) { if (x && seenP[x]) sc += 2; });
    }
    // alan_m2 yakınlığı
    var ia = Number(input.alan_m2) || 0;
    var ca2 = Number(ctx.alan_m2) || 0;
    if (ia > 0 && ca2 > 0) {
      var d = Math.abs(ia - ca2) / Math.max(ia, ca2);
      if (d < 0.2) sc += 3;
      else if (d < 0.5) sc += 1;
    }
    // gunluk_kapak yakınlığı
    var ig = Number(input.gunluk_kapak) || 0;
    var cg = Number(ctx.gunluk_kapak) || 0;
    if (ig > 0 && cg > 0) {
      var dg = Math.abs(ig - cg) / Math.max(ig, cg);
      if (dg < 0.25) sc += 2;
    }
    return sc;
  }

  function proposeFromCorpus(input, corpus, opts) {
    opts = opts || {};
    var topN = Number(opts.topN) || 5;
    var minFreq = (typeof opts.minFreq === 'number') ? opts.minFreq : 0.4;
    var out = [];
    if (!input || !Array.isArray(corpus) || !corpus.length) return out;
    var scored = corpus.map(function (p) {
      return { p: p, sc: _scoreCorpusProject(input, p) };
    }).filter(function (x) { return x.sc > 0; })
      .sort(function (a, b) { return b.sc - a.sc; })
      .slice(0, topN);
    if (!scored.length) return out;
    var nUsed = scored.length;
    var freq = {};   // tip_kodu -> { count, ad, kategori, adets:[], fiyatlar:[], source_ids:[] }
    scored.forEach(function (x) {
      var eq = Array.isArray(x.p.equipment) ? x.p.equipment : [];
      var seenInThisProject = {};
      eq.forEach(function (e) {
        var k = String(e && e.tip_kodu || '').trim();
        if (!k || seenInThisProject[k]) return;
        seenInThisProject[k] = 1;
        if (!freq[k]) {
          freq[k] = {
            tip_kodu: k,
            ad: String(e.ad || ''),
            kategori: String(e.kategori || 'diger'),
            count: 0,
            adets: [],
            fiyatlar: [],
            source_ids: [],
          };
        }
        freq[k].count += 1;
        if (Number.isFinite(Number(e.adet)) && Number(e.adet) > 0) freq[k].adets.push(Number(e.adet));
        if (Number.isFinite(Number(e.birim_tl)) && Number(e.birim_tl) > 0) freq[k].fiyatlar.push(Number(e.birim_tl));
        if (x.p.id != null) freq[k].source_ids.push(x.p.id);
      });
    });
    Object.keys(freq).forEach(function (k) {
      var f = freq[k];
      var fr = f.count / nUsed;
      if (fr < minFreq) return;
      var medAdet = (function (arr) {
        if (!arr.length) return 1;
        var s = arr.slice().sort(function (a, b) { return a - b; });
        var m = Math.floor(s.length / 2);
        return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
      })(f.adets);
      var medFiyat = (function (arr) {
        if (!arr.length) return 0;
        var s = arr.slice().sort(function (a, b) { return a - b; });
        var m = Math.floor(s.length / 2);
        return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
      })(f.fiyatlar);
      out.push({
        tip_kodu: k,
        ad: f.ad,
        kategori: f.kategori,
        frequency: fr,
        sample_count: f.count,
        used_projects: nUsed,
        median_adet: medAdet,
        median_birim_tl: medFiyat,
        source_proje_ids: f.source_ids,
      });
    });
    out.sort(function (a, b) {
      if (b.frequency !== a.frequency) return b.frequency - a.frequency;
      return b.sample_count - a.sample_count;
    });
    return out;
  }

  // ── KDV AYRIŞTIRMA ────────────────────────────────────────────────────────
  // ekipmanlar.json fiyat metni örnek: "₺49.400,00 + KDV\nKDV Dahil ₺59.280,00"
  // Hedef: deterministic olarak KDV HARİÇ tutarı çıkar.
  function parsePriceTL(s, opts) {
    opts = opts || {};
    if (s == null) return 0;
    var raw = String(s);
    var harics = raw.match(/([\d.,]+)\s*\+\s*K\s*D\s*V/i);
    if (harics) {
      var n = parseFloat(harics[1].replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.'));
      if (Number.isFinite(n)) return n;
    }
    var dahil = raw.match(/K\s*D\s*V\s*Dahil[^\d]*([\d.,]+)/i);
    if (dahil) {
      var n2 = parseFloat(dahil[1].replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.'));
      if (Number.isFinite(n2)) return opts.includeKdv ? n2 : Math.round(n2 / 1.2);
    }
    var t = raw.replace(/[^\d,.\-]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.');
    var n3 = parseFloat(t);
    return Number.isFinite(n3) ? n3 : 0;
  }

  // ── v3 KATALOGLAR — konsept × segment × fiyat matrisi ─────────────────────
  // EQUSTO SORU SETİ v3 ile gelen yapı. SCHEMA içinde geldiğinde önce ona,
  // yoksa public/data/*.json statik dosyalarına bakar.
  var V3 = { konseptKat: null, segmentKat: null, fiyatMatrisi: null };

  async function loadV3Catalogs(baseUrl) {
    var pre = baseUrl || './';
    if (SCHEMA) {
      if (SCHEMA.konsept_katalogu) V3.konseptKat = SCHEMA.konsept_katalogu;
      if (SCHEMA.segment_katalogu) V3.segmentKat = SCHEMA.segment_katalogu;
      if (SCHEMA.fiyat_matrisi) V3.fiyatMatrisi = SCHEMA.fiyat_matrisi;
    }
    async function pull(url) {
      try {
        var r = await fetch(url, { cache: 'no-store' });
        if (!r.ok) return null;
        return await r.json();
      } catch (_) { return null; }
    }
    if (!V3.konseptKat) {
      var j1 = await pull(pre + 'data/konsept-katalog.json');
      if (j1) V3.konseptKat = j1;
    }
    if (!V3.segmentKat) {
      var j2 = await pull(pre + 'data/segment-katalog.json');
      if (j2) V3.segmentKat = j2;
    }
    if (!V3.fiyatMatrisi) {
      var j3 = await pull(pre + 'data/fiyat-matrisi.json');
      if (j3) V3.fiyatMatrisi = j3.matris || j3;
    }
    return V3;
  }

  function resolveSegment(input) {
    if (!V3.segmentKat) return null;
    var sk = V3.segmentKat;
    var sehir = String((input && input.sehir) || '').trim();
    var ilce = String((input && input.ilce) || '').trim();
    var mahalle = String((input && input.mahalle) || '').trim();
    var bh = sk.bolge_haritasi || {};
    var k1 = sehir + '/' + mahalle;
    var k2 = sehir + '/' + ilce;
    if (mahalle && bh[k1]) return bh[k1];
    if (ilce && bh[k2]) return bh[k2];
    return sk.varsayilan_segment || 'orta';
  }

  function getKonseptMeta(konseptLabel) {
    if (!V3.konseptKat || !V3.konseptKat.konseptler) return null;
    var ks = V3.konseptKat.konseptler;
    if (ks[konseptLabel]) return { ad: konseptLabel, meta: ks[konseptLabel] };
    var keys = Object.keys(ks);
    var lower = String(konseptLabel || '').toLocaleLowerCase('tr-TR');
    for (var i = 0; i < keys.length; i++) {
      if (String(keys[i]).toLocaleLowerCase('tr-TR') === lower) return { ad: keys[i], meta: ks[keys[i]] };
    }
    return null;
  }

  function pickFromMatris(tipKodu, segment) {
    if (!V3.fiyatMatrisi) return null;
    var row = V3.fiyatMatrisi[tipKodu];
    if (!row) return null;
    var cell = row[segment];
    if (cell && (cell.marka_id || cell.urun_id || cell.fiyat_tl)) return cell;
    // Segment için hücre yoksa veya boşsa, ilk dolu hücreye düş
    var segs = Object.keys(row);
    for (var i = 0; i < segs.length; i++) {
      var c = row[segs[i]];
      if (c && (c.marka_id || c.urun_id || c.fiyat_tl)) {
        return Object.assign({}, c, { _fallback_segment: segs[i] });
      }
    }
    return null;
  }

  function computeAdet(tipKodu, konseptMeta, alan_m2) {
    if (!konseptMeta || !konseptMeta.meta || !konseptMeta.meta.m2_kurallari) return 1;
    var k = konseptMeta.meta.m2_kurallari;
    var m2 = Number(alan_m2) || 60;
    if (tipKodu.indexOf('IND_OCAK') === 0) {
      var goz = Math.round((k.ocak_goz_per_m2 || 0.05) * m2);
      if (tipKodu === 'IND_OCAK_6') return Math.max(1, Math.ceil(goz / 6));
      if (tipKodu === 'IND_OCAK_4') return Math.max(1, Math.ceil(goz / 4));
      return 1;
    }
    if (tipKodu.indexOf('TEZ_') === 0) {
      var metre = (k.tezgah_m_per_m2 || 0.08) * m2;
      return Math.max(1, Math.ceil(metre / 2));
    }
    if (tipKodu.indexOf('BZDL_') === 0) {
      return Math.max(1, Math.ceil((k.bzdl_per_m2 || 0.02) * m2));
    }
    return 1;
  }

  function _findProductByUrunId(urunId) {
    if (!urunId) return null;
    var prods = (SCHEMA && Array.isArray(SCHEMA.products)) ? SCHEMA.products : [];
    for (var i = 0; i < prods.length; i++) {
      if (prods[i] && prods[i].id === urunId) return prods[i];
    }
    return null;
  }

  function buildTeklifFromV3(input) {
    if (!V3.konseptKat || !V3.segmentKat || !V3.fiyatMatrisi) {
      return { ok: false, reason: 'v3-cataloglar-yuklenmedi' };
    }
    var konsept = (input && (input.dukkan || input.konsept_label || input.konsept)) || '';
    var km = getKonseptMeta(konsept);
    if (!km) return { ok: false, reason: 'konsept-bulunamadi', konsept: konsept };
    var segment = resolveSegment(input);
    var paket = (km.meta && Array.isArray(km.meta.tip_kod_paketi)) ? km.meta.tip_kod_paketi : [];
    if (!paket.length) return { ok: false, reason: 'tip-kod-paketi-bos', konsept: km.ad };
    var alan = Number(input && input.alan_m2) || 60;
    var segObj = (V3.segmentKat.segmentler || []).find(function (s) { return s.kod === segment; }) || null;
    var carp = segObj ? (Number(segObj.marka_carpan) || 1) : 1;
    var rows = [];
    var eksikler = [];
    paket.forEach(function (tip) {
      var cell = pickFromMatris(tip, segment);
      if (!cell) { eksikler.push({ tip_kodu: tip, neden: 'matris-bos' }); return; }
      var baz = Number(cell.fiyat_tl) || 0;
      var birim = Math.round(baz * carp);
      var adet = computeAdet(tip, km, alan);
      var p = _findProductByUrunId(cell.urun_id);
      var kategori = (p && p.kategori) || '';
      if (!kategori) {
        // TIP_SOZLUGU schema'da var mı? Olmasa da varsayilan
        var ts = (SCHEMA && Array.isArray(SCHEMA.tip_sozlugu)) ? SCHEMA.tip_sozlugu : [];
        var tsi = ts.find(function (t) { return t.tip_kodu === tip || t.k === tip; });
        if (tsi) kategori = tsi.kategori || tsi.c || '';
      }
      rows.push({
        tip_kodu: tip,
        kategori: kategori || 'diger',
        ad: (p && (p.ad || p.name)) || (cell.marka_ad || tip),
        marka: cell.marka_ad || '',
        marka_id: cell.marka_id || '',
        model: (p && p.model) || '',
        img: (p && (p.gorsel_url || p.img)) || '',
        urun_id: cell.urun_id || '',
        elk_kw: (p && p.el_guc) || '',
        gaz_kw: (p && p.gaz_guc) || '',
        birim_tl: birim,
        adet: adet,
        tutar_tl: birim * adet,
        fiyat_var: birim > 0,
        fiyat_kaynak: birim > 0 ? 'matris' : 'matris-bos',
        segment_kod: cell._fallback_segment || segment,
        segment_carpan: carp,
        baz_tl: baz,
        curated: true,
        v3: true
      });
    });
    return {
      ok: true,
      konsept: km.ad,
      segment: segment,
      segment_etiketi: segObj ? segObj.etiket : segment,
      segment_carpan: carp,
      alan_m2: alan,
      rows: rows,
      eksikler: eksikler,
      paket_buyuklugu: paket.length
    };
  }

  global.EqustoEngine = {
    loadSchema: loadSchema,
    renderForm: renderForm,
    readAnswers: readAnswers,
    setAnswers: setAnswers,
    adapt: adapt,
    bindMultiChips: bindMultiChips,
    runRules: runRules,
    deriveRuleInput: deriveRuleInput,
    matchEqSets: matchEqSets,
    applyFiyatlar: applyFiyatlar,
    parsePriceTL: parsePriceTL,
    proposeFromCorpus: proposeFromCorpus,
    // v3:
    loadV3Catalogs: loadV3Catalogs,
    resolveSegment: resolveSegment,
    getKonseptMeta: getKonseptMeta,
    pickFromMatris: pickFromMatris,
    computeAdet: computeAdet,
    buildTeklifFromV3: buildTeklifFromV3,
    getV3: function () { return V3; },
    hasV3: function () { return !!(V3.konseptKat && V3.segmentKat && V3.fiyatMatrisi); },
    mode: mode,
    isSchemaMode: isSchemaMode,
    getSchema: function () { return SCHEMA; },
    getRules: function () { return SCHEMA && Array.isArray(SCHEMA.rules) ? SCHEMA.rules : []; },
    getEqSets: function () { return SCHEMA && Array.isArray(SCHEMA.eqSets) ? SCHEMA.eqSets : []; },
    getProducts: function () { return SCHEMA && Array.isArray(SCHEMA.products) ? SCHEMA.products : []; },
    getCorpus: function () { return SCHEMA && Array.isArray(SCHEMA.projeler) ? SCHEMA.projeler : []; },
    _esc: esc,
    _normTr: _normTr
  };
})(window);
