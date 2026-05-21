/**
 * Üst arama — Meilisearch öneri kutusu + /arama?q= sonuç sayfası
 */
;(function () {
  "use strict";

  var DEBOUNCE_MS = 300;
  var MIN_CHARS = 2;
  var SUGGEST_LIMIT = 8;
  var timer = null;
  var fetchCtrl = null;
  var activeIdx = -1;
  var lastHits = [];
  var lastQ = "";

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  function trimQ(q) {
    return String(q == null ? "" : q).trim();
  }

  function aramaUrl(q) {
    q = trimQ(q);
    if (!q) return "";
    return "/arama?q=" + encodeURIComponent(q);
  }

  function productHref(hit) {
    if (hit && hit.url) return hit.url;
    if (hit && hit.dept && hit.slug) {
      try {
        if (typeof window.eqProductPath === "function") {
          return window.eqProductPath(hit.dept, hit.slug);
        }
      } catch (_) {}
      return "/shop/" + encodeURIComponent(hit.dept) + "/" + encodeURIComponent(hit.slug);
    }
    return "#";
  }

  function imgSrc(hit) {
    var img = hit && hit.image;
    if (!img) return "";
    img = String(img).replace(/\\/g, "/");
    if (img.indexOf("http") === 0 || img.indexOf("/") === 0) return img;
    return "/" + img;
  }

  function getSrchRoot() {
    return document.querySelector("header.hdr .srch, header .srch");
  }

  function getInput() {
    return document.querySelector("header.hdr .srch-input, header .srch .srch-input");
  }

  function ensurePanel() {
    var panel = document.getElementById("eq-srch-panel");
    if (!panel) {
      panel = document.createElement("div");
      panel.className = "eq-srch-panel";
      panel.id = "eq-srch-panel";
      panel.setAttribute("role", "listbox");
      panel.hidden = true;
      document.body.appendChild(panel);
    }
    return panel;
  }

  function positionPanel() {
    var srch = getSrchRoot();
    var panel = document.getElementById("eq-srch-panel");
    if (!srch || !panel || panel.hidden) return;
    var r = srch.getBoundingClientRect();
    panel.style.position = "fixed";
    panel.style.left = r.left + "px";
    panel.style.top = r.bottom + 4 + "px";
    panel.style.width = Math.max(r.width, 280) + "px";
    panel.style.zIndex = "10050";
  }

  function hidePanel() {
    var panel = document.getElementById("eq-srch-panel");
    if (panel) {
      panel.hidden = true;
      panel.innerHTML = "";
    }
    activeIdx = -1;
    lastHits = [];
  }

  function renderPanel(hits, q, total) {
    var root = getSrchRoot();
    if (!root) return;
    var panel = ensurePanel();
    if (!hits.length) {
      panel.innerHTML =
        '<div class="eq-srch-panel__empty">«' +
        esc(q) +
        '» için öneri yok</div>';
      panel.hidden = false;
      positionPanel();
      return;
    }
    var html = "";
    for (var i = 0; i < hits.length; i++) {
      var h = hits[i];
      var src = imgSrc(h);
      html +=
        '<a class="eq-srch-panel__item" role="option" data-idx="' +
        i +
        '" href="' +
        esc(productHref(h)) +
        '">' +
        (src
          ? '<img class="eq-srch-panel__thumb" src="' + esc(src) + '" alt="" loading="lazy">'
          : '<span class="eq-srch-panel__thumb eq-srch-panel__thumb--ph"></span>') +
        '<span class="eq-srch-panel__text">' +
        '<span class="eq-srch-panel__name">' +
        esc(h.name || "") +
        "</span>" +
        (h.brand
          ? '<span class="eq-srch-panel__brand">' + esc(h.brand) + "</span>"
          : "") +
        "</span></a>";
    }
    var n = total != null ? total : hits.length;
    html +=
      '<a class="eq-srch-panel__all" href="' +
      esc(aramaUrl(q)) +
      '">Tüm sonuçları gör (' +
      esc(String(n)) +
      "+)</a>";
    panel.innerHTML = html;
    panel.hidden = false;
    positionPanel();
    activeIdx = -1;
  }

  function fetchSuggest(q) {
    q = trimQ(q);
    if (q.length < MIN_CHARS) {
      hidePanel();
      return;
    }
    if (fetchCtrl) {
      try {
        fetchCtrl.abort();
      } catch (_) {}
    }
    fetchCtrl = new AbortController();
    var url = "/api/search?q=" + encodeURIComponent(q) + "&limit=" + SUGGEST_LIMIT;
    fetch(url, { signal: fetchCtrl.signal, headers: { Accept: "application/json" } })
      .then(function (r) {
        return r.json().then(function (data) {
          return { ok: r.ok, data: data };
        });
      })
      .then(function (res) {
        if (!res.ok || res.data.error) {
          hidePanel();
          return;
        }
        lastQ = q;
        lastHits = res.data.hits || [];
        renderPanel(lastHits, q, res.data.estimatedTotalHits);
      })
      .catch(function (err) {
        if (err && err.name === "AbortError") return;
        hidePanel();
      });
  }

  function scheduleSuggest(q) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(function () {
      timer = null;
      fetchSuggest(q);
    }, DEBOUNCE_MS);
  }

  function commitSearch(q) {
    q = trimQ(q);
    if (!q) return;
    hidePanel();
    try {
      sessionStorage.setItem("eq_hdr_search_q", q);
    } catch (_) {}
    window.__eqHdrLastQ = q;
    var url = aramaUrl(q);
    if (url) location.href = url;
  }

  function setActive(idx) {
    var panel = document.getElementById("eq-srch-panel");
    if (!panel) return;
    var items = panel.querySelectorAll(".eq-srch-panel__item");
    for (var i = 0; i < items.length; i++) {
      items[i].classList.toggle("eq-srch-panel__item--active", i === idx);
    }
    activeIdx = idx;
  }

  function onInput(ev) {
    var t = ev.target;
    if (!t || !t.classList || !t.classList.contains("srch-input")) return;
    var q = t.value;
    if (trimQ(q).length < MIN_CHARS) hidePanel();
    scheduleSuggest(q);
  }

  function onKeydown(ev) {
    var t = ev.target;
    if (!t || !t.classList || !t.classList.contains("srch-input")) return;
    var panel = document.getElementById("eq-srch-panel");
    var open = panel && !panel.hidden;

    if (ev.key === "Enter") {
      ev.preventDefault();
      if (open && activeIdx >= 0 && lastHits[activeIdx]) {
        location.href = productHref(lastHits[activeIdx]);
        return;
      }
      commitSearch(t.value);
      return;
    }
    if (!open) return;
    if (ev.key === "Escape") {
      hidePanel();
      return;
    }
    if (ev.key === "ArrowDown") {
      ev.preventDefault();
      setActive(Math.min(activeIdx + 1, lastHits.length - 1));
      return;
    }
    if (ev.key === "ArrowUp") {
      ev.preventDefault();
      setActive(Math.max(activeIdx - 1, 0));
    }
  }

  function onDocClick(ev) {
    var root = getSrchRoot();
    if (!root || root.contains(ev.target)) return;
    hidePanel();
  }

  window.eqAramaUrl = aramaUrl;
  window.__eqHdrMeiliSuggest = scheduleSuggest;
  window.eqCommitHeaderSearch = function () {
    var inp = getInput();
    commitSearch(inp ? inp.value : "");
  };

  document.addEventListener("input", onInput, true);
  document.addEventListener("keydown", onKeydown, true);
  document.addEventListener("click", onDocClick, true);
  window.addEventListener("resize", positionPanel);
  window.addEventListener(
    "scroll",
    function () {
      positionPanel();
    },
    true
  );

  document.addEventListener(
    "click",
    function (ev) {
      var btn = ev.target && ev.target.closest && ev.target.closest(".srch-btn");
      if (!btn || !btn.closest("header .srch, header.hdr .srch")) return;
      ev.preventDefault();
      var inp = getInput();
      commitSearch(inp ? inp.value : "");
    },
    true
  );

  function drainInputFromUrl() {
    var q = "";
    try {
      q = new URLSearchParams(location.search).get("q") || "";
    } catch (_) {}
    if (!trimQ(q)) {
      try {
        q = sessionStorage.getItem("eq_hdr_search_q") || "";
      } catch (_) {}
    }
    q = trimQ(q);
    if (!q) return;
    var inp = getInput();
    if (inp) inp.value = q;
    window.__eqHdrLastQ = q;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", drainInputFromUrl);
  } else {
    drainInputFromUrl();
  }
})();
