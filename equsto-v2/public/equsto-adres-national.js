/**
 * Türkiye il / ilçe / mahalle — yerel JSON (/data/tr-adres.json).
 * Cadde/sokak önerileri: OpenStreetMap Nominatim.
 * Güncelleme: scripts/build-tr-adres.py
 */
(function (global) {
  'use strict';

  const DATA_URL = '/data/tr-adres.json';
  const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
  const NOM_HEADERS = {
    'Accept-Language': 'tr-TR,tr;q=0.9',
    'User-Agent': 'Equsto/1.0 (adres onerisi; https://equsto.com)',
  };

  /** Tarayıcı CORS / TLS sorunlarında yerel API proxy (claude-api-proxy). */
  function nominatimSearchUrl(searchParams) {
    var qs =
      searchParams instanceof URLSearchParams
        ? searchParams.toString()
        : String(searchParams || '');
    if (qs.charAt(0) === '?') qs = qs.slice(1);
    var proxy = '';
    if (global.EQUSTO_NOMINATIM_BASE) {
      proxy = String(global.EQUSTO_NOMINATIM_BASE).replace(/\/$/, '');
    } else if (typeof global.location !== 'undefined' && global.location.hostname) {
      var h = String(global.location.hostname).toLowerCase();
      if (h === 'localhost' || h === '127.0.0.1') {
        proxy = 'http://127.0.0.1:3001/api/nominatim';
      } else {
        proxy = global.location.origin + '/api/nominatim';
      }
    }
    if (proxy) return proxy + '/search?' + qs;
    return NOMINATIM + '?' + qs;
  }

  function nominatimFetch(searchParams) {
    return fetch(nominatimSearchUrl(searchParams), { headers: NOM_HEADERS })
      .then(function (r) {
        return r.ok ? r.json() : [];
      })
      .catch(function () {
        return [];
      });
  }

  let ready = false;
  let loadPromise = null;
  let provinces = [];
  const districtsByProvince = {};
  const neighborhoodsByDistrict = {};

  function normKey(s) {
    return s
      ? String(s)
          .trim()
          .toLocaleLowerCase('tr-TR')
          .normalize('NFKC')
      : '';
  }

  function loadData() {
    if (loadPromise) return loadPromise;
    loadPromise = fetch(DATA_URL, { cache: 'force-cache' })
      .then(function (r) {
        if (!r.ok) throw new Error('tr-adres.json ' + r.status);
        return r.json();
      })
      .then(function (j) {
        provinces = Array.isArray(j.provinces) ? j.provinces : [];
        provinces.sort(function (a, b) {
          return (Number(b.population) || 0) - (Number(a.population) || 0);
        });
        provinces.forEach(function (p) {
          districtsByProvince[p.id] = Array.isArray(p.districts) ? p.districts : [];
          districtsByProvince[p.id].forEach(function (d) {
            neighborhoodsByDistrict[d.id] = Array.isArray(d.neighborhoods) ? d.neighborhoods : [];
          });
        });
        ready = provinces.length > 0;
        return ready;
      })
      .catch(function () {
        provinces = [];
        ready = false;
        return false;
      });
    return loadPromise;
  }

  function init() {
    return loadData();
  }

  function getProvinces() {
    return provinces.map(function (p) {
      return {
        id: p.id,
        name: p.name,
        plate: p.plate,
        population: Number(p.population) || 0,
      };
    });
  }

  function findProvinceByName(name) {
    if (!name || !provinces.length) return null;
    const t = String(name).trim();
    let p = provinces.find(function (x) {
      return x.name === t;
    });
    if (p) return { id: p.id, name: p.name, plate: p.plate };
    const tl = normKey(t);
    p = provinces.find(function (x) {
      return normKey(x.name) === tl;
    });
    return p ? { id: p.id, name: p.name, plate: p.plate } : null;
  }

  function getDistricts(provinceId) {
    const rows = districtsByProvince[provinceId];
    if (!rows) return [];
    return rows.map(function (d) {
      return { id: d.id, name: d.name };
    });
  }

  function findDistrictByName(provinceId, districtName) {
    const rows = districtsByProvince[provinceId];
    if (!rows || !districtName) return null;
    const t = String(districtName).trim();
    let d = rows.find(function (x) {
      return x.name === t;
    });
    if (d) return { id: d.id, name: d.name };
    const tl = normKey(t);
    d = rows.find(function (x) {
      return normKey(x.name) === tl;
    });
    return d ? { id: d.id, name: d.name } : null;
  }

  function getNeighborhoods(districtId) {
    const names = neighborhoodsByDistrict[districtId];
    if (!names) return [];
    return names.map(function (n) {
      return { name: n };
    });
  }

  function getNeighborhoodNames(districtId) {
    return neighborhoodsByDistrict[districtId] || [];
  }

  function wrapAcw(input) {
    if (!input || input.closest('.acw')) return input && input.closest('.acw');
    const acw = document.createElement('div');
    acw.className = 'acw eq-acw';
    const acl = document.createElement('div');
    acl.className = 'acl eq-acl';
    const p = input.parentNode;
    p.insertBefore(acw, input);
    acw.appendChild(input);
    acw.appendChild(acl);
    return acw;
  }

  function clearAcl(acl) {
    if (!acl) return;
    acl.classList.remove('open');
    acl.textContent = '';
  }

  function renderAcl(acl, items, onPick) {
    if (!acl) return;
    clearAcl(acl);
    if (!items || !items.length) return;
    items.forEach(function (text) {
      const div = document.createElement('div');
      div.className = 'acit';
      div.textContent = text;
      div.addEventListener('mousedown', function (e) {
        e.preventDefault();
        onPick(text);
      });
      acl.appendChild(div);
    });
    acl.classList.add('open');
  }

  function roadFromHit(hit, mode) {
    const a = hit.address || {};
    const caddeFirst =
      a.road ||
      a.street ||
      a.pedestrian ||
      a.path ||
      a.footway ||
      a.cycleway ||
      a.residential ||
      a.unclassified ||
      a.service ||
      a.trunk ||
      a.primary ||
      a.secondary ||
      a.tertiary ||
      '';
    if (caddeFirst) return String(caddeFirst).trim();
    if (mode === 'cadde' && hit.class === 'highway') {
      const d = hit.display_name || '';
      const first = d.split(',')[0];
      if (first && /cad|sok|bul|yol|cd\.|sk\./i.test(first)) return first.trim();
    }
    if (mode === 'sokak') {
      const r = a.neighbourhood || a.quarter || a.suburb || '';
      if (r) return String(r).trim();
    }
    if (mode === 'cadde') return '';
    const d = hit.display_name || '';
    const first = d.split(',')[0];
    return first ? first.trim() : '';
  }

  function isSokakOnly(label) {
    return /sok\.?\b|sokak\b/i.test(label) && !/cad|cd\.|bul|bulvar|yolu\b/i.test(label);
  }

  /** OSM kısa adları → PFOS’ta okunur cadde/bulvar etiketi */
  function formatStreetLabel(raw, mode) {
    var t = String(raw || '').trim();
    if (!t || t.length < 2) return '';
    if (mode === 'cadde' && isSokakOnly(t)) return '';
    if (mode === 'cadde' && !/cad|cd\.|bul|bulvar|yolu|yol\b|köpr|tünel|otoyol/i.test(t)) {
      if (t.length >= 3) return t + ' Cad.';
    }
    return t;
  }

  function hitLooksLikeStreet(hit, mode) {
    const a = hit.address || {};
    if (
      a.road ||
      a.street ||
      a.pedestrian ||
      a.path ||
      a.residential ||
      a.footway ||
      a.cycleway ||
      a.unclassified ||
      a.service
    )
      return true;
    if (hit.class === 'highway') return true;
    if (mode === 'cadde') {
      if (
        hit.type === 'road' ||
        hit.type === 'residential' ||
        hit.type === 'living_street' ||
        hit.type === 'unclassified'
      )
        return true;
      if (hit.type === 'house' && a.road) return true;
    }
    if (mode === 'sokak') {
      if (hit.type === 'house' || hit.type === 'building') return true;
    }
    return false;
  }

  function mergeStreetSuggestions(primary, secondary, max) {
    max = max === undefined ? 30 : Number(max);
    var cap = Number.isFinite(max) && max > 0 ? max : 30;
    var seen = {};
    var out = [];
    function pushArr(arr) {
      if (!arr || !arr.length) return;
      arr.forEach(function (s) {
        var t = s ? String(s).trim() : '';
        if (t.length < 2) return;
        var k = t.toLocaleLowerCase('tr-TR');
        if (seen[k]) return;
        seen[k] = true;
        out.push(t);
        if (out.length >= cap) return false;
      });
    }
    pushArr(primary);
    pushArr(secondary);
    return out;
  }

  const NOM_DEBOUNCE_MS = 420;
  const nominatimTimers = {};

  function baseNomParams(limit) {
    var sp = new URLSearchParams();
    sp.set('format', 'json');
    sp.set('addressdetails', '1');
    sp.set('limit', String(limit && limit > 0 ? limit : 28));
    sp.set('countrycodes', 'tr');
    sp.set('dedupe', '1');
    sp.set('country', 'Turkey');
    return sp;
  }

  function structuredNomJobs(seh, ic, mah, qq, cadRef, mode, nomLimit) {
    var jobs = [];
    function pushStruct(fields) {
      var sp = baseNomParams(nomLimit);
      Object.keys(fields).forEach(function (k) {
        if (fields[k]) sp.set(k, fields[k]);
      });
      jobs.push(nominatimFetch(sp));
    }
    if (!seh || !ic) return jobs;
    if (mode === 'cadde') {
      pushStruct({ state: seh, county: ic, suburb: mah, neighbourhood: mah, street: qq });
      pushStruct({ city: seh, county: ic, suburb: mah, neighbourhood: mah, street: qq });
      if (!qq && mah) {
        pushStruct({ state: seh, county: ic, suburb: mah, neighbourhood: mah });
      }
      if (!qq) {
        pushStruct({ state: seh, county: ic });
        pushStruct({ city: seh, county: ic });
      }
    } else {
      pushStruct({
        state: seh,
        county: ic,
        suburb: mah,
        neighbourhood: mah,
        street: qq || cadRef,
      });
    }
    return jobs;
  }

  function nominatimStreets(debounceKey, q, sehir, ilce, mahalle, cadde, mode) {
    mode = mode === 'sokak' ? 'sokak' : 'cadde';
    return new Promise(function (resolve) {
      if (debounceKey != null && debounceKey !== '') {
        clearTimeout(nominatimTimers[String(debounceKey)]);
      }

      function runFetch() {
        var qq = q ? String(q).trim() : '';
        var seh = sehir ? String(sehir).trim() : '';
        var ic = ilce ? String(ilce).trim() : '';
        var mah = mahalle ? String(mahalle).trim() : '';
        var cad = cadde ? String(cadde).trim() : '';

        var hasTyped = qq.length >= 1;
        var hasContext = seh.length > 0 && ic.length > 0;
        if (!hasTyped && !hasContext) {
          resolve([]);
          return;
        }
        var nomLimit = hasTyped ? 28 : mode === 'cadde' ? 50 : 35;

        var parts = [];
        if (mode === 'sokak' && cad) {
          if (hasTyped) parts.push(qq);
          parts.push(cad);
          if (mah) parts.push(mah);
          parts.push(ic, seh, 'Türkiye');
        } else if (mode === 'sokak') {
          if (hasTyped) parts.push(qq);
          if (mah) parts.push(mah);
          parts.push(ic, seh, 'Türkiye');
        } else {
          if (hasTyped) parts.push(qq);
          if (mah) parts.push(mah);
          parts.push(ic, seh, 'Türkiye');
        }
        parts = parts.filter(Boolean);

        function normTr(s) {
          return s ? String(s).trim().toLocaleLowerCase('tr-TR') : '';
        }

        function parseHits(arr) {
          if (!Array.isArray(arr)) return [];
          var pairs = [];
          arr.forEach(function (hit) {
            var raw = roadFromHit(hit, mode);
            var label = formatStreetLabel(raw, mode);
            if (!label || label.length < 2) return;
            if (!hitLooksLikeStreet(hit, mode)) return;
            if (mode === 'cadde') {
              var nl = normTr(label);
              if (mah && nl === normTr(mah)) return;
              if (ic && nl === normTr(ic)) return;
              if (seh && nl === normTr(seh)) return;
            }
            var imp = Number(hit.importance);
            if (!Number.isFinite(imp)) imp = 0;
            pairs.push({ label: label, importance: imp });
          });
          return pairs;
        }

        var jobs = [];
        if (parts.length) {
          var spFree = baseNomParams(nomLimit);
          spFree.set('q', parts.join(', '));
          jobs.push(nominatimFetch(spFree));
        }
        if (seh && ic) {
          structuredNomJobs(seh, ic, mah, qq, cad, mode, nomLimit).forEach(function (j) {
            jobs.push(j);
          });
        }

        Promise.all(jobs)
          .then(function (chunks) {
            var merged = [];
            chunks.forEach(function (arr) {
              if (Array.isArray(arr)) merged.push.apply(merged, arr);
            });
            var pairs = parseHits(merged);
            pairs.sort(function (a, b) {
              return b.importance - a.importance;
            });
            var seen = {};
            var out = [];
            pairs.forEach(function (p) {
              var k = p.label.toLocaleLowerCase('tr-TR');
              if (seen[k]) return;
              seen[k] = 1;
              out.push(p.label);
            });
            resolve(out);
          })
          .catch(function () {
            resolve([]);
          });
      }

      if (debounceKey != null && debounceKey !== '') {
        nominatimTimers[String(debounceKey)] = setTimeout(runFetch, NOM_DEBOUNCE_MS);
      } else {
        runFetch();
      }
    });
  }

  function attachImportAdres(opts) {
    opts = opts || {};
    var prefix = opts.prefix || 'imp-adr-';
    var ids = {
      sehir: prefix + 'sehir',
      ilce: prefix + 'ilce',
      mahalle: prefix + 'mahalle',
      cadde: prefix + 'cadde',
      sokak: prefix + 'sokak',
    };

    var elS = document.getElementById(ids.sehir);
    var elI = document.getElementById(ids.ilce);
    var elM = document.getElementById(ids.mahalle);
    var elC = document.getElementById(ids.cadde);
    var elK = document.getElementById(ids.sokak);
    if (!elS || !elI || !elM || !elC || !elK) return;

    var S = { provinceId: null, districtId: null };

    wrapAcw(elS);
    wrapAcw(elI);
    wrapAcw(elM);
    wrapAcw(elC);
    wrapAcw(elK);

    var aclS = elS.nextElementSibling;
    var aclI = elI.nextElementSibling;
    var aclM = elM.nextElementSibling;
    var aclC = elC.nextElementSibling;
    var aclK = elK.nextElementSibling;

    function closeAll() {
      [aclS, aclI, aclM, aclC, aclK].forEach(clearAcl);
    }

    document.addEventListener('click', function (e) {
      if (!e.target.closest('.eq-acw')) closeAll();
    });

    function syncProvinceFromSehir() {
      var p = findProvinceByName(elS.value);
      S.provinceId = p ? p.id : null;
      S.districtId = null;
    }

    function filterStarts(list, q) {
      if (!q) return list.slice();
      var ql = q.toLocaleLowerCase('tr-TR');
      return list.filter(function (n) {
        return n.toLocaleLowerCase('tr-TR').indexOf(ql) !== -1;
      });
    }

    function openSehir() {
      closeAll();
      if (!provinces.length) return;
      var q = elS.value.trim();
      var ql = q ? q.toLocaleLowerCase('tr-TR') : '';
      var list = provinces;
      if (ql) {
        list = provinces.filter(function (p) {
          return p.name.toLocaleLowerCase('tr-TR').indexOf(ql) !== -1;
        });
      }
      var hit = list.slice(0, 40).map(function (p) {
        return p.name;
      });
      renderAcl(aclS, hit, function (val) {
        elS.value = val;
        clearAcl(aclS);
        syncProvinceFromSehir();
        elI.value = '';
        elM.value = '';
        elC.value = '';
        elK.value = '';
        S.districtId = null;
        elI.focus();
      });
    }

    function resolveDistrictId() {
      if (S.districtId) return Promise.resolve(S.districtId);
      if (!S.provinceId) syncProvinceFromSehir();
      if (!S.provinceId) return Promise.resolve(null);
      var d = findDistrictByName(S.provinceId, elI.value.trim());
      S.districtId = d ? d.id : null;
      return Promise.resolve(S.districtId);
    }

    function openIlce() {
      closeAll();
      syncProvinceFromSehir();
      if (!S.provinceId) {
        openSehir();
        return;
      }
      var rows = getDistricts(S.provinceId);
      var q = elI.value.trim();
      var names = rows.map(function (r) {
        return r.name;
      });
      var hit = q ? filterStarts(names, q).slice(0, 50) : names.slice(0, 50);
      renderAcl(aclI, hit, function (val) {
        elI.value = val;
        clearAcl(aclI);
        var row = rows.find(function (x) {
          return x.name === val;
        });
        S.districtId = row ? row.id : null;
        elM.value = '';
        elC.value = '';
        elK.value = '';
        elM.focus();
      });
    }

    function openMahalle() {
      closeAll();
      resolveDistrictId().then(function (did) {
        if (!did) {
          openIlce();
          return;
        }
        var names = getNeighborhoodNames(did);
        var q = elM.value.trim();
        var hit = q ? filterStarts(names, q).slice(0, 60) : names.slice(0, 60);
        renderAcl(aclM, hit, function (val) {
          elM.value = val;
          clearAcl(aclM);
          elC.focus();
        });
      });
    }

    function openStreet(acl, inputEl, mode) {
      closeAll();
      var q = inputEl.value.trim();
      var cad = mode === 'sokak' ? elC.value.trim() : '';
      var key = prefix + (mode === 'sokak' ? 'sok-nom' : 'cad-nom');
      nominatimStreets(
        key,
        q,
        elS.value.trim(),
        elI.value.trim(),
        elM.value.trim(),
        cad,
        mode === 'sokak' ? 'sokak' : 'cadde'
      ).then(function (roads) {
        renderAcl(acl, roads, function (val) {
          inputEl.value = val;
          clearAcl(acl);
        });
      });
    }

    elS.addEventListener('focus', openSehir);
    elS.addEventListener('input', openSehir);
    elI.addEventListener('focus', openIlce);
    elI.addEventListener('input', openIlce);
    elM.addEventListener('focus', openMahalle);
    elM.addEventListener('input', openMahalle);
    elC.addEventListener('focus', function () {
      openStreet(aclC, elC, 'cadde');
    });
    elC.addEventListener('input', function () {
      openStreet(aclC, elC, 'cadde');
    });
    elK.addEventListener('focus', function () {
      openStreet(aclK, elK, 'sokak');
    });
    elK.addEventListener('input', function () {
      openStreet(aclK, elK, 'sokak');
    });
  }

  global.EqustoAdresNational = {
    init: init,
    isReady: function () {
      return ready;
    },
    getProvinces: getProvinces,
    findProvinceByName: findProvinceByName,
    getDistricts: getDistricts,
    findDistrictByName: findDistrictByName,
    getNeighborhoods: getNeighborhoods,
    getNeighborhoodNames: getNeighborhoodNames,
    attachImportAdres: attachImportAdres,
    nominatimStreets: nominatimStreets,
    mergeStreetSuggestions: mergeStreetSuggestions,
  };

  function boot() {
    var hasImp = !!document.getElementById('imp-adr-sehir');
    var hasAy = !!document.getElementById('ay-adr-sehir');
    if (!hasImp && !hasAy) return;
    init().then(function () {
      if (hasImp) attachImportAdres({ prefix: 'imp-adr-' });
      if (hasAy) attachImportAdres({ prefix: 'ay-adr-' });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(typeof window !== 'undefined' ? window : this);
