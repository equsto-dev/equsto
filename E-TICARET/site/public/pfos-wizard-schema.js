;(function () {
  "use strict";
  /**
   * /data/pfos-wizard-branches.json — aktif PFOS paketlerinden üretilir.
   * public/pfos.html sihirbazında KONSEPT_ROWS + DUKKAN dallarını günceller.
   */
  var CACHE = null;
  var URL = "/data/pfos-wizard-branches.json";

  function apply(doc) {
    if (!doc || typeof doc !== "object") return false;
    if (doc.dukkanBySegment && typeof doc.dukkanBySegment === "object") {
      if (typeof window.DUKKAN === "object") {
        Object.keys(doc.dukkanBySegment).forEach(function (k) {
          window.DUKKAN[k] = doc.dukkanBySegment[k];
        });
      } else {
        window.DUKKAN = doc.dukkanBySegment;
      }
    }
    if (Array.isArray(doc.konseptRows) && doc.konseptRows.length) {
      window.KONSEPT_ROWS = doc.konseptRows;
    }
    if (doc.legacyKonsept) {
      window.PFOS_LEGACY_KONSEPT = doc.legacyKonsept;
    }
    if (doc.m2ByDukkan) {
      window.PFOS_M2_BY_DUKKAN = doc.m2ByDukkan;
    }
    window.PFOS_WIZARD_SCHEMA_READY = true;
    return true;
  }

  function legacyKonsept(seg) {
    var m = window.PFOS_LEGACY_KONSEPT || {};
    return m[seg] || seg;
  }

  function suggestM2ForDukkan(dukkan) {
    var hit = window.PFOS_M2_BY_DUKKAN && window.PFOS_M2_BY_DUKKAN[dukkan];
    if (!hit) return null;
    var ref = Math.round((Number(hit.min) + Number(hit.max)) / 2) || hit.min;
    return { min: hit.min, max: hit.max, ref: ref, slug: hit.slug || "" };
  }

  window.pfosKonseptLegacy = legacyKonsept;
  window.pfosSuggestM2ForDukkan = suggestM2ForDukkan;

  window.pfosLoadWizardSchema = function () {
    if (CACHE) {
      apply(CACHE);
      return Promise.resolve(true);
    }
    return fetch(URL, { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (doc) {
        CACHE = doc;
        return apply(doc);
      })
      .catch(function () {
        return false;
      });
  };

  window.pfosLoadWizardSchema();
})();
