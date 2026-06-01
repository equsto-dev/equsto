/**
 * PFOS — /en/pfos için TR metin → EN (pfos-labels-en.json + eqT pfos.*)
 */
;(function () {
  "use strict";

  var LABELS = null;
  var labelsReady = false;
  var loadPromise = null;
  var applyTimer = null;
  var observer = null;
  var booted = false;

  function isEnPfos() {
    if (window.eqLang === "en") return true;
    try {
      return /^\/en(\/|$)/i.test(String(location.pathname || ""));
    } catch (_) {
      return false;
    }
  }

  function labelsUrl() {
    var v = window.__EQ_I18N_JSON_V || window.__EQ_PFOS_LABELS_V || "20260527pfos-en-v3";
    return "/i18n/pfos-labels-en.json?v=" + encodeURIComponent(v);
  }

  function loadLabels() {
    if (labelsReady && LABELS) return Promise.resolve(LABELS);
    if (loadPromise) return loadPromise;
    loadPromise = fetch(labelsUrl(), { credentials: "same-origin", cache: "no-store" })
      .then(function (r) {
        return r.ok ? r.json() : { labels: {} };
      })
      .then(function (j) {
        LABELS = (j && j.labels) || {};
        labelsReady = Object.keys(LABELS).length > 0;
        return LABELS;
      })
      .catch(function () {
        LABELS = LABELS || {};
        labelsReady = false;
        loadPromise = null;
        return LABELS;
      });
    return loadPromise;
  }

  function pfosLabel(tr) {
    if (!isEnPfos()) return tr;
    var s = String(tr == null ? "" : tr).trim();
    if (!s) return s;
    if (LABELS && LABELS[s]) return LABELS[s];
    if (typeof window.eqT === "function") {
      var viaKey = window.eqT("pfos." + s, null);
      if (viaKey && viaKey !== "pfos." + s) return viaKey;
    }
    return s;
  }

  function translateQuestion(q) {
    if (!q || !isEnPfos()) return q;
    var out = Object.assign({}, q);
    if (out.text) out.text = pfosLabel(out.text);
    if (out.note) out.note = pfosLabel(out.note);
    return out;
  }

  function translateSchema(data) {
    if (!data || !isEnPfos()) return data;
    if (Array.isArray(data.questions)) {
      data.questions = data.questions.map(translateQuestion);
    }
    return data;
  }

  function walkText(root) {
    if (!root || !isEnPfos()) return;
    var skip = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1 };
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var node;
    while ((node = walker.nextNode())) {
      if (!node.parentElement || skip[node.parentElement.tagName]) continue;
      var raw = node.textContent;
      if (!raw || !raw.trim()) continue;
      var trimmed = raw.trim();
      var en = pfosLabel(trimmed);
      if (en !== trimmed) {
        node.textContent = raw.replace(trimmed, en);
      }
    }
    root.querySelectorAll("option").forEach(function (opt) {
      var t = opt.textContent.trim();
      var en = pfosLabel(t);
      if (en !== t) opt.textContent = en;
    });
    ["placeholder", "aria-label", "title"].forEach(function (attr) {
      root.querySelectorAll("[" + attr + "]").forEach(function (el) {
        var val = el.getAttribute(attr);
        if (!val) return;
        var en = pfosLabel(val);
        if (en !== val) el.setAttribute(attr, en);
      });
    });
  }

  function applyPfosI18n() {
    if (!isEnPfos()) return;
    var root =
      document.getElementById("eq-legacy-vitrin-root") ||
      document.querySelector(".eq-pfos") ||
      document.body;
    walkText(root);
  }

  function scheduleApply() {
    if (applyTimer) clearTimeout(applyTimer);
    applyTimer = setTimeout(function () {
      applyTimer = null;
      if (!labelsReady) {
        loadLabels().then(applyPfosI18n);
        return;
      }
      applyPfosI18n();
    }, 80);
  }

  function hookFetch() {
    if (window.__eqPfosFetchHooked || !isEnPfos()) return;
    window.__eqPfosFetchHooked = true;
    var orig = window.fetch;
    window.fetch = function (input, init) {
      return orig.apply(this, arguments).then(function (res) {
        var url = typeof input === "string" ? input : input && input.url ? input.url : "";
        if (!url || url.indexOf("proje-akis") === -1) return res;
        return res.clone().json().then(function (j) {
          if (j && j.data) translateSchema(j.data);
          return new Response(JSON.stringify(j), {
            status: res.status,
            statusText: res.statusText,
            headers: res.headers,
          });
        });
      });
    };
  }

  function observeRoot() {
    if (observer) return;
    var root =
      document.getElementById("eq-legacy-vitrin-root") ||
      document.querySelector(".eq-pfos") ||
      document.body;
    observer = new MutationObserver(scheduleApply);
    observer.observe(root, { childList: true, subtree: true, characterData: false });
  }

  function boot() {
    if (!isEnPfos()) return;
    loadLabels().then(function () {
      hookFetch();
      applyPfosI18n();
      observeRoot();
      booted = true;
      try {
        window.dispatchEvent(new CustomEvent("eq-pfos-i18n-ready"));
      } catch (_) {}
    });
  }

  window.eqPfosLabel = pfosLabel;
  window.eqPfosI18nApply = function () {
    if (!labelsReady) {
      boot();
      return;
    }
    applyPfosI18n();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
  window.addEventListener("equsto:i18n-ready", boot);
  window.addEventListener("eq-lang-change", boot);
  window.addEventListener("load", scheduleApply, { once: true });

  if (window.eqI18nReady && typeof window.eqI18nReady.then === "function") {
    window.eqI18nReady.then(boot);
  }
})();
