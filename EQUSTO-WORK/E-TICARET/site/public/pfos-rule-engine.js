;(function(){
  'use strict';
  /* Mr. Equsto — PFOS kural motoru (önceki sözlük: kural robotu). Kurallar admin ve pfos-rules.json üzerinden. */

  var RULES_STORAGE_KEY = 'equsto-pfos-rules-json';
  // Use absolute path so it works from /admin/ subfolder too.
  var RULES_DEFAULT_URL = '/data/pfos-rules.json';

  function safeJsonParse(s){
    try{ return JSON.parse(s); }catch(_){ return null; }
  }
  function safeGetLocalStorage(key){
    try{ return localStorage.getItem(key); }catch(_){ return null; }
  }
  function safeSetLocalStorage(key, value){
    try{ localStorage.setItem(key, value); return true; }catch(_){ return false; }
  }
  function safeRemoveLocalStorage(key){
    try{ localStorage.removeItem(key); return true; }catch(_){ return false; }
  }

  function isArr(a){ return Array.isArray(a); }
  function asArr(a){ return isArr(a) ? a : (a == null ? [] : [a]); }

  function normStr(s){ return String(s == null ? '' : s).trim(); }

  function includesAny(hay, needles){
    var h = asArr(hay).map(normStr);
    for(var i=0;i<needles.length;i++){
      var n = normStr(needles[i]);
      if(!n) continue;
      for(var j=0;j<h.length;j++){
        if(h[j] === n) return true;
      }
    }
    return false;
  }

  function matchWhen(when, ctx){
    if(!when) return true;
    if(typeof when !== 'object') return false;

    var k = normStr(ctx.konsept);
    var d = normStr(ctx.dukkan);
    var a = normStr(ctx.alt);
    var p = asArr(ctx.pisir);

    if(when.konseptEq != null && normStr(when.konseptEq) !== k) return false;
    if(when.konseptIn && !includesAny([k], asArr(when.konseptIn))) return false;

    if(when.dukkanEq != null && normStr(when.dukkanEq) !== d) return false;
    if(when.dukkanIn && !includesAny([d], asArr(when.dukkanIn))) return false;
    if(when.dukkanNotIn && includesAny([d], asArr(when.dukkanNotIn))) return false;

    if(when.altEq != null && normStr(when.altEq) !== a) return false;
    if(when.altIn && !includesAny([a], asArr(when.altIn))) return false;

    if(when.pisirHasAny && !includesAny(p, asArr(when.pisirHasAny))) return false;
    if(when.pisirHasAll){
      var all = asArr(when.pisirHasAll);
      for(var i=0;i<all.length;i++){
        if(!includesAny(p, [all[i]])) return false;
      }
    }

    var alan = Number(ctx.alan);
    if(when.alanGte != null && (!Number.isFinite(alan) || alan < Number(when.alanGte))) return false;
    if(when.alanLte != null && (!Number.isFinite(alan) || alan > Number(when.alanLte))) return false;
    if(when.alanBetween && when.alanBetween.length >= 2){
      var lo = Number(when.alanBetween[0]);
      var hi = Number(when.alanBetween[1]);
      if(!Number.isFinite(alan) || alan < lo || alan > hi) return false;
    }

    return true;
  }

  function sortRules(rules){
    return rules.slice().sort(function(a,b){
      var pa = Number(a && a.priority != null ? a.priority : 0);
      var pb = Number(b && b.priority != null ? b.priority : 0);
      if(pb !== pa) return pb - pa;
      var ia = normStr(a && a.id);
      var ib = normStr(b && b.id);
      return ia < ib ? -1 : (ia > ib ? 1 : 0);
    });
  }

  function buildKeysFromRules(rulesDoc, ctx){
    var rules = (rulesDoc && isArr(rulesDoc.rules)) ? rulesDoc.rules : [];
    rules = sortRules(rules);

    var used = {};
    var out = [];
    function addKeys(keys){
      var ks = asArr(keys);
      for(var i=0;i<ks.length;i++){
        var key = normStr(ks[i]);
        if(!key || used[key]) continue;
        used[key] = true;
        out.push(key);
      }
    }

    for(var r=0;r<rules.length;r++){
      var rule = rules[r] || {};
      var ok = matchWhen(rule.when, ctx);
      if(ok) addKeys(rule.add);
      else if(rule.elseAdd) addKeys(rule.elseAdd);
    }

    return out;
  }

  function keysToItems(keys, itemsByKey){
    var out = [];
    for(var i=0;i<keys.length;i++){
      var k = keys[i];
      var it = itemsByKey && itemsByKey[k];
      if(it) out.push(it);
    }
    return out;
  }

  var DEFAULT_RULES_DOC = {
    version: 1,
    rules: [
      { id: 'hood-big', priority: 1000, when: { konseptIn: ['Restaurant','Steakhouse','Şarküteri','Bulut Mutfak','Hotel','Catering','Kasap','Franchise','Pastane & Patisserie','Fastfood'] }, add: ['DAV_B'] },
      { id: 'hood-small-cafe', priority: 998, when: { konseptIn: ['Cafe','Kafe-Kafeterya','Bar'] }, add: ['DAV_K'] },

      { id: 'base-pizzaci', priority: 910, when: { dukkanEq: 'Pizzacı' }, add: ['PIZZA_FIR','SPIRAL','HAMUR_AC','FRITOR','IND_OCAK_4','BZDL_400','BZDL_600','BULASIK_K','TEZ_4','BUZ_MAK','SOG_TEZ'] },
      { id: 'base-donerci', priority: 910, when: { dukkanEq: 'Dönerci' }, add: ['IZGARA','FRITOR','PIDE_FIR','IND_OCAK_4','BZDL_600','BULASIK_K','TEZ_4','BUZ_MAK'] },
      { id: 'base-restaurant', priority: 900, when: { konseptEq: 'Restaurant', dukkanNotIn: ['Pizzacı','Dönerci'] }, add: ['IND_OCAK_6','KNV','BZDL_600','BULASIK_T','TEZ_2'] },
      { id: 'base-cafe', priority: 900, when: { konseptIn: ['Cafe','Kafe-Kafeterya'] }, add: ['ESPRESSO','KAH_DEG','BZDL_400','BARDAK_YIK','TEZ_2'] },
      { id: 'base-bulut', priority: 900, when: { konseptEq: 'Bulut Mutfak' }, add: ['IND_OCAK_4','KNV','BZDL_600','BULASIK_K','TEZ_2'] },
      { id: 'base-hotel', priority: 900, when: { konseptEq: 'Hotel' }, add: ['IND_OCAK_6','KNV','BZDL_600','BULASIK_T','BENMARI','TEZ_4'] },
      { id: 'base-bar', priority: 900, when: { konseptEq: 'Bar' }, add: ['BUZ_MAK','BAR_BZDL','BARDAK_YIK','TEZ_2'] },
      { id: 'base-catering', priority: 900, when: { konseptEq: 'Catering' }, add: ['DEVIR_TEN','IND_OCAK_6','KNV','BZDL_600','BULASIK_T','TEZ_4'] },
      { id: 'base-patisserie', priority: 900, when: { konseptEq: 'Pastane & Patisserie' }, add: ['SPIRAL','HAMUR_AC','RAF_FIR','BZDL_400','TEZ_2'] },
      { id: 'base-steakhouse', priority: 900, when: { konseptEq: 'Steakhouse' }, add: ['IND_OCAK_6','KNV','BZDL_600','BULASIK_T','TEZ_2'] },
      { id: 'base-sarkuteri', priority: 900, when: { konseptEq: 'Şarküteri' }, add: ['ET_DLBI','VAKUM','BZDL_600','BULASIK_T','TEZ_2','SOG_TEZ'] },
      { id: 'base-kasap', priority: 900, when: { konseptEq: 'Kasap' }, add: ['ET_DLBI','KEM_TES','ET_KIYMA','BZDL_600','TEZ_2'] },

      { id: 'shop-fine-dining', priority: 800, when: { dukkanEq: 'Fine Dining' }, add: ['SALAMANDER','VAKUM','SARAP_DL'] },
      { id: 'shop-steakhouse', priority: 800, when: { dukkanEq: 'Steakhouse' }, add: ['DRY_AGE','CHAR_BROIL'] },
      { id: 'steakhouse-konsept', priority: 795, when: { konseptEq: 'Steakhouse' }, add: ['DRY_AGE','CHAR_BROIL','KEM_TES','VAKUM','SOG_TEZ'] },
      { id: 'steakhouse-large', priority: 850, when: { konseptIn: ['Steakhouse','Restaurant'], dukkanIn: ['Steakhouse'], alanGte: 150 }, add: ['SALAMANDER','TEZ_4','ET_DLBI'] },
      { id: 'steakhouse-xl', priority: 860, when: { konseptIn: ['Steakhouse','Restaurant'], dukkanIn: ['Steakhouse'], alanGte: 220 }, add: ['IND_OCAK_6','KNV','BZDL_600','BULASIK_T'] },
      { id: 'shop-sarkuteri', priority: 800, when: { dukkanEq: 'Gurme Şarküteri' }, add: ['ET_DLBI','VAKUM'] },
      { id: 'shop-balik', priority: 800, when: { dukkanEq: 'Balık Restaurant' }, add: ['BUZ_MAK'] },

      { id: 'fastfood-burger', priority: 790, when: { dukkanEq: 'Fastfood', altEq: 'Burger' }, add: ['CHAR_BROIL','FRITOR'] },
      { id: 'fastfood-pizza', priority: 790, when: { dukkanEq: 'Fastfood', altEq: 'Pizza' }, add: ['PIZZA_FIR'] },
      { id: 'fastfood-friedchicken', priority: 790, when: { dukkanEq: 'Fastfood', altIn: ['Fried Chicken','Dönerci'] }, add: ['FRITOR','IZGARA'] },
      { id: 'fastfood-pide', priority: 790, when: { dukkanEq: 'Fastfood', altEq: 'Pide Lahmacun' }, add: ['PIDE_FIR'] },
      { id: 'fast-food-burger', priority: 789, when: { dukkanEq: 'Fast Food', altEq: 'Burger' }, add: ['CHAR_BROIL','FRITOR'] },
      { id: 'fast-food-pizza', priority: 789, when: { dukkanEq: 'Fast Food', altEq: 'Pizza' }, add: ['PIZZA_FIR'] },
      { id: 'fast-food-fried', priority: 789, when: { dukkanEq: 'Fast Food', altIn: ['Fried Chicken','Dönerci'] }, add: ['FRITOR','IZGARA'] },
      { id: 'fast-food-pide', priority: 789, when: { dukkanEq: 'Fast Food', altEq: 'Pide & Lahmacun' }, add: ['PIDE_FIR'] },
      { id: 'shop-pizzaci-alt-tas', priority: 785, when: { dukkanEq: 'Pizzacı', altEq: 'Taş Fırın' }, add: ['PIZZA_FIR'] },
      { id: 'shop-pizzaci-alt-konveyor', priority: 784, when: { dukkanEq: 'Pizzacı', altIn: ['Konveyör Fırın','Hamur Hazırlık'] }, add: ['SPIRAL','HAMUR_AC'] },
      { id: 'shop-pizzaci-paket', priority: 783, when: { dukkanEq: 'Pizzacı', altEq: 'Paket Servis' }, add: ['VAKUM','BUZ_MAK'] },
      { id: 'shop-donerci-paket', priority: 783, when: { dukkanEq: 'Dönerci', altIn: ['Paket / Servis','Salon Servis'] }, add: ['VAKUM'] },

      { id: 'bakery-any', priority: 770, when: { konseptEq: 'Pastane & Patisserie' }, add: ['SPIRAL','HAMUR_AC','RAF_FIR'] },
      { id: 'bakery-artisan', priority: 770, when: { dukkanIn: ['Artisan Bakery','Pastane & Patisserie'] }, add: ['SPIRAL','HAMUR_AC','RAF_FIR'] },

      { id: 'bar-cocktail', priority: 760, when: { dukkanIn: ['Kokteyl Bar','Wine Bar','Mixology Bar'] }, add: ['BLENDER'] },
      { id: 'bar-beer', priority: 760, when: { dukkanIn: ['Beer Pub','Irish Pub'] }, add: ['BAR_BZDL'] },
      { id: 'bar-lounge', priority: 760, when: { dukkanIn: ['Lounger Bar','Lounge Bar'] }, add: ['BLENDER'] },

      { id: 'pisir-izgara', priority: 700, when: { pisirHasAny: ['Izgara / Ocakbaşı'] }, add: ['IZGARA'] },
      { id: 'pisir-pizza', priority: 700, when: { pisirHasAny: ['Pizza / Fırın ürünleri'] }, add: ['PIZZA_FIR'] },
      { id: 'pisir-kizartma', priority: 700, when: { pisirHasAny: ['Kızartma'] }, add: ['FRITOR'] },
      { id: 'pisir-turk', priority: 700, when: { pisirHasAny: ['Türk mutfağı (kebap, börek, pide)'] }, add: ['PIDE_FIR'] },
      { id: 'pisir-tatli', priority: 700, when: { pisirHasAny: ['Pasta / Tatlı'] }, add: ['PASTA_FIR'] },
      { id: 'pisir-soguk', priority: 700, when: { pisirHasAny: ['Soğuk mutfak (salata, meze)'] }, add: ['SOG_TEZ'] },
      { id: 'pisir-deniz', priority: 700, when: { pisirHasAny: ['Deniz ürünleri'] }, add: ['BUZ_MAK'] },
      { id: 'pisir-kahvalti', priority: 700, when: { pisirHasAny: ['Kahvaltı / Brunch'] }, add: ['BENMARI'] },
      { id: 'pisir-icecek', priority: 700, when: { pisirHasAny: ['İçecek ağırlıklı'] }, add: ['BLENDER'] },
      { id: 'pisir-dunya', priority: 700, when: { pisirHasAny: ['Dünya mutfağı'] }, add: ['WOK'] }
    ]
  };

  var state = {
    rulesDoc: DEFAULT_RULES_DOC,
    loadedFrom: 'embedded',
    loadPromise: null,
  };

  function getRulesDoc(){
    return state.rulesDoc || DEFAULT_RULES_DOC;
  }

  async function loadRules(){
    if(state.loadPromise) return state.loadPromise;
    state.loadPromise = (async function(){
      var stored = safeGetLocalStorage(RULES_STORAGE_KEY);
      if(stored){
        var j = safeJsonParse(stored);
        if(j && j.rules){ state.rulesDoc = j; state.loadedFrom = 'localStorage'; return state.rulesDoc; }
      }
      try{
        var r = await fetch(RULES_DEFAULT_URL, { cache: 'no-store', headers: { Accept: 'application/json' } });
        if(r && r.ok){
          var doc = await r.json();
          if(doc && doc.rules){ state.rulesDoc = doc; state.loadedFrom = 'url'; return state.rulesDoc; }
        }
      }catch(_){ /* ignore */ }
      state.rulesDoc = DEFAULT_RULES_DOC;
      state.loadedFrom = 'embedded';
      return state.rulesDoc;
    })();
    return state.loadPromise;
  }

  function setRulesDoc(doc){
    if(!doc || typeof doc !== 'object' || !isArr(doc.rules)) throw new Error('rules doc must be an object with rules[]');
    state.rulesDoc = doc;
    state.loadedFrom = 'manual';
    state.loadPromise = Promise.resolve(doc);
  }

  function storeRulesJson(jsonText){
    var doc = safeJsonParse(jsonText);
    if(!doc || !isArr(doc.rules)) throw new Error('invalid JSON (expected { rules: [...] })');
    safeSetLocalStorage(RULES_STORAGE_KEY, JSON.stringify(doc, null, 2));
    setRulesDoc(doc);
    return doc;
  }

  function clearStoredRules(){
    safeRemoveLocalStorage(RULES_STORAGE_KEY);
    state.loadPromise = null;
    state.rulesDoc = DEFAULT_RULES_DOC;
    state.loadedFrom = 'embedded';
  }

  function evaluateKeys(ctx, rulesDoc){
    return buildKeysFromRules(rulesDoc || getRulesDoc(), ctx || {});
  }

  function buildList(ctx, itemsByKey, rulesDoc){
    var keys = evaluateKeys(ctx, rulesDoc);
    return keysToItems(keys, itemsByKey || {});
  }

  function init(){
    // fire and forget; keep sync defaults available
    loadRules().catch(function(){});
  }

  window.EqustoPfosRuleEngine = {
    init: init,
    loadRules: loadRules,
    getRulesDoc: getRulesDoc,
    setRulesDoc: setRulesDoc,
    storeRulesJson: storeRulesJson,
    clearStoredRules: clearStoredRules,
    evaluateKeys: evaluateKeys,
    buildList: buildList,
    _meta: function(){ return { storageKey: RULES_STORAGE_KEY, defaultUrl: RULES_DEFAULT_URL, loadedFrom: state.loadedFrom }; }
  };
})();

