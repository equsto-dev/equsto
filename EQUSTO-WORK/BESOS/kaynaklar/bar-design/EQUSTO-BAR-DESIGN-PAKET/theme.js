(function () {
  /** Masaüstü: eski nav.js inline display:none kalıntılarını hemen temizle (önbellek / bfcache). */
  (function eqDesktopChromeRestoreEarly() {
    var SEL =
      "header.hdr a.logo,header.hdr .srch-cat,header.hdr .cat-picker,header.hdr .cat-picker-btn,nav.topnav,header+nav.topnav,#eq-home-catband";
    function clear() {
      try {
        if (window.matchMedia("(max-width: 768px)").matches) return;
        document.querySelectorAll(SEL).forEach(function (el) {
          ["display", "visibility", "pointer-events", "width", "height", "overflow"].forEach(function (p) {
            el.style.removeProperty(p);
          });
        });
        if (typeof window.EQUSTO_LOGO_REFRESH === "function") window.EQUSTO_LOGO_REFRESH();
      } catch (_) {}
    }
    if (document.body) clear();
    document.addEventListener("DOMContentLoaded", clear);
    window.addEventListener("pageshow", clear);
    window.addEventListener("resize", clear);
  })();

  /* file:// açılışında /manifest.json sürücü köküne gider (ERR_FILE_NOT_FOUND). */
  try {
    if (typeof location !== "undefined" && location.protocol === "file:") {
      document.querySelectorAll('link[rel="manifest"]').forEach(function (lnk) {
        var h = (lnk.getAttribute("href") || "").trim();
        if (h !== "/manifest.json") return;
        var rel = /[/\\]urun[/\\]/i.test(location.pathname) ? "../manifest.json" : "manifest.json";
        lnk.href = new URL(rel, location.href).href;
      });
    }
  } catch (_) {}

  var STORAGE_KEY = "equsto-theme";
  var mq = typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-color-scheme: dark)")
    : { matches: false, addEventListener: function () {} };

  function stored() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (_) {
      return null;
    }
  }

  function storeSet(v) {
    try {
      localStorage.setItem(STORAGE_KEY, v);
      return true;
    } catch (_) {
      return false;
    }
  }

  function storeRemove() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (_) {
      return false;
    }
  }

  /** KİLİT: vitrin-beyaz-zemin-KILIT.txt — bar-design (bd-page) hariç vitrin her zaman açık tema */
  function isVitrinWhiteBgLocked() {
    try {
      var b = document.body;
      return (
        b &&
        b.classList.contains("eq-shop") &&
        !b.classList.contains("bd-page") &&
        !b.classList.contains("admin-app")
      );
    } catch (_) {
      return false;
    }
  }

  function effectiveTheme() {
    if (isVitrinWhiteBgLocked()) return "light";
    var s = stored();
    if (s === "light" || s === "dark") return s;
    return mq.matches ? "dark" : "light";
  }

  function applyPaint() {
    var lock = isVitrinWhiteBgLocked();
    if (!document.body) {
      document.documentElement.setAttribute("data-theme", "light");
      document.documentElement.classList.remove("eq-vitrin-white-lock");
      updateMetaThemeColor();
      return;
    }
    document.documentElement.classList.toggle("eq-vitrin-white-lock", lock);
    document.documentElement.setAttribute("data-theme", lock ? "light" : effectiveTheme());
    updateMetaThemeColor();
  }

  function apply() {
    applyPaint();
    updateToggleUI();
  }

  function updateMetaThemeColor() {
    var c = isVitrinWhiteBgLocked() || effectiveTheme() !== "dark" ? "#ffffff" : "#1a1a1a";
    var el = document.querySelector('meta[name="theme-color"]');
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute("name", "theme-color");
      document.head.appendChild(el);
    }
    el.setAttribute("content", c);
  }

  function updateToggleUI() {
    var btn = document.getElementById("theme-toggle");
    if (!btn) return;
    var mode = stored() || "system";
    var icons = { system: "\u25D0", light: "\u2600", dark: "\u263D" };
    var labels = {
      system: "Sistem temas\u0131",
      light: "A\u00e7\u0131k tema",
      dark: "Koyu tema (antrasit)",
    };
    btn.textContent = icons[mode] || icons.system;
    btn.title = labels[mode] || labels.system;
    btn.setAttribute(
      "aria-label",
      (labels[mode] || labels.system) + " \u2014 t\u0131klay\u0131 de\u011fi\u015ftir"
    );
  }

  function cycleTheme() {
    var order = ["system", "light", "dark"];
    var cur = stored() || "system";
    var i = order.indexOf(cur);
    var next = order[(i + 1) % order.length];
    if (next === "system") storeRemove();
    else storeSet(next);
    apply();
  }

  window.equstoCycleTheme = cycleTheme;
  window.equstoGetThemeMode = function () {
    return stored() || "system";
  };

  if (typeof mq.addEventListener === "function") {
    mq.addEventListener("change", function () {
      if (!stored()) apply();
    });
  } else if (mq.addListener) {
    mq.addListener(function () {
      if (!stored()) apply();
    });
  }

  applyPaint();
  function onDomReady() {
    applyPaint();
    updateToggleUI();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", onDomReady);
  } else {
    onDomReady();
  }
  window.addEventListener("pageshow", function () {
    applyPaint();
  });

  /** KİLİT: pfos-topnav-anim-kilit.mdc — PFOS topnav yerinde 3 tur; açık talimat olmadan değiştirme */
  var PFOS_LETTER_TURNS = 3;

  function pfosLetterSpinDeg() {
    var sign = Math.random() < 0.5 ? -1 : 1;
    return sign * PFOS_LETTER_TURNS * 360;
  }

  function restartPfosCharsSpread(item) {
    item.querySelectorAll(".topnav-pfos__ch").forEach(function (ch) {
      ch.classList.remove("topnav-pfos__ch--spread");
      void ch.offsetWidth;
      ch.classList.add("topnav-pfos__ch--spread");
    });
  }

  function playPfosReverans(item) {
    if (!item || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var inner = item.querySelector(".topnav-pfos__in");
    if (!inner) return;
    inner.classList.remove("topnav-pfos__in--reverans");
    void inner.offsetWidth;
    inner.classList.add("topnav-pfos__in--reverans");
  }

  function bindPfosReveransEnd(inner) {
    if (!inner || inner.dataset.pfosReveransEnd === "1") return;
    inner.dataset.pfosReveransEnd = "1";
    inner.addEventListener("animationend", function (e) {
      if (e.animationName === "pfosReverans") {
        inner.classList.remove("topnav-pfos__in--reverans");
      }
    });
  }

  function shufflePfosDelays(item) {
    if (!item) return;
    var spin = pfosLetterSpinDeg() + "deg";
    item.querySelectorAll(".topnav-pfos__ch").forEach(function (el) {
      el.style.setProperty("--r0", spin);
      el.style.setProperty("--r1", spin);
    });
    restartPfosCharsSpread(item);
  }

  function letterizePfosFace(face) {
    if (!face) return;
    var text = (face.textContent || "").trim();
    var existing = face.querySelector(".topnav-pfos__chars");
    if (existing && face.dataset.pfosSrc === text) return;
    face.dataset.pfosSrc = text;
    face.textContent = "";
    var wrap = document.createElement("span");
    wrap.className = "topnav-pfos__chars";
    for (var i = 0; i < text.length; i++) {
      var ch = text.charAt(i);
      var span = document.createElement("span");
      span.className = "topnav-pfos__ch" + (ch === " " ? " topnav-pfos__ch--sp" : "");
      if (ch === " ") span.innerHTML = "\u00a0";
      else span.textContent = ch;
      wrap.appendChild(span);
    }
    face.appendChild(wrap);
  }

  function bindPfosShuffle(item) {
    if (!item || item.dataset.pfosShuffleBound === "1") return;
    item.dataset.pfosShuffleBound = "1";
    var inner = item.querySelector(".topnav-pfos__in");
    bindPfosReveransEnd(inner);
    item.addEventListener("mouseenter", function () {
      playPfosReverans(item);
      shufflePfosDelays(item);
    });
  }

  function installTopnavPfosLetters(root) {
    root = root || document;
    root.querySelectorAll(".topnav-pfos__face").forEach(letterizePfosFace);
    root.querySelectorAll(".topnav-pfos").forEach(bindPfosShuffle);
  }

  window.__eqRerenderTopnavPfos = installTopnavPfosLetters;

  function greetPfosReverans() {
    if (!document.body.classList.contains("eq-pfos")) return;
    var item = document.querySelector(".topnav-item.topnav-pfos");
    if (!item) return;
    setTimeout(function () {
      playPfosReverans(item);
    }, 720);
  }

  function bootTopnavPfosLetters() {
    installTopnavPfosLetters(document);
    greetPfosReverans();
    if (window.eqI18nReady && typeof window.eqI18nReady.then === "function") {
      window.eqI18nReady.then(function () {
        installTopnavPfosLetters(document);
        greetPfosReverans();
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootTopnavPfosLetters);
  } else {
    bootTopnavPfosLetters();
  }

  /** Dış http(s) bağlantıları yeni sekmede; iç site linkleri aynı sekme. `data-eq-same-tab="1"` ile istisna. */
  function eqHostnameKey(h) {
    return String(h || "")
      .replace(/^www\./i, "")
      .toLowerCase();
  }

  function markExternalLinks(root) {
    root = root || document;
    root.querySelectorAll('a[href]:not([data-eq-same-tab="1"])').forEach(function (a) {
      if (a.getAttribute("target")) return;
      var raw = (a.getAttribute("href") || "").trim();
      if (!raw || raw.charAt(0) === "#" || /^javascript:/i.test(raw)) return;
      try {
        var u = new URL(raw, location.href);
        var proto = (u.protocol || "").toLowerCase();
        if (proto !== "http:" && proto !== "https:") return;
        if (eqHostnameKey(u.hostname) === eqHostnameKey(location.hostname)) return;
        a.setAttribute("target", "_blank");
        var rel = (a.getAttribute("rel") || "").trim();
        var tokens = rel ? rel.split(/\s+/).filter(Boolean) : [];
        if (tokens.indexOf("noopener") === -1) tokens.push("noopener");
        if (tokens.indexOf("noreferrer") === -1) tokens.push("noreferrer");
        a.setAttribute("rel", tokens.join(" "));
      } catch (_) {}
    });
  }

  function bootExternalLinks() {
    markExternalLinks(document);
    upgradeTopnavDeptLinks();
  }

  /** Üst departman şeridi: div+onclick yerine <a href> — sol tık aynı sekme, tekerlek (orta) tık tarayıcıda yeni sekme. */
  function upgradeTopnavDeptLinks() {
    if (typeof window.equstoUrl !== "function") return;
    var nav = document.querySelector("nav.topnav");
    if (!nav) return;
    nav.querySelectorAll(".topnav-item").forEach(function (item) {
      if (item.tagName === "A" && item.getAttribute("href")) return;
      var oc = item.getAttribute("onclick");
      if (!oc || typeof oc !== "string") return;
      if (/toggle(Drawer|CatPicker)\s*\(/i.test(oc)) return;
      var m = oc.match(/eq(?:Dept)?Go\s*\(\s*['"]([a-zA-Z0-9_-]+)['"]\s*\)/);
      if (!m) return;
      var key = m[1];
      var href;
      try {
        href = window.equstoUrl(key);
      } catch (_) {
        return;
      }
      if (!href) return;
      var a = document.createElement("a");
      a.className = item.className;
      a.setAttribute("href", href);
      a.innerHTML = item.innerHTML;
      for (var i = 0; i < item.attributes.length; i++) {
        var attr = item.attributes[i];
        var n = attr.name;
        if (n === "class" || n === "onclick") continue;
        a.setAttribute(n, attr.value);
      }
      item.parentNode.replaceChild(a, item);
    });
    if (typeof window.__eqRerenderTopnavPfos === "function") {
      try {
        window.__eqRerenderTopnavPfos(document);
      } catch (_) {}
    }
  }

  window.__eqMarkExternalLinks = markExternalLinks;
  window.addEventListener("load", bootExternalLinks);
})();

/** Üst arama — theme.js ile erken yüklenir (inline oninput kırılmasın diye). */
(function () {
  function scrollToResults() {
    var el =
      document.querySelector("main.main") ||
      document.getElementById("eq-cat-shell") ||
      document.getElementById("prod-grid") ||
      document.querySelector(".eq-cat-rail-row, .products");
    if (!el) return;
    try {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (_) {
      try {
        el.scrollIntoView();
      } catch (_2) {}
    }
  }

  function showFeedback(q, count) {
    if (!q) return;
    var title = document.querySelector(".main-title");
    if (title) {
      title.setAttribute("data-eq-search-prev", title.textContent || "");
      title.textContent =
        count === 0
          ? "\u201c" + q + "\u201d i\u00e7in sonu\u00e7 bulunamad\u0131"
          : "\u201c" + q + "\u201d \u2014 " + count + " sonu\u00e7";
    }
    var live = document.getElementById("eq-search-live");
    if (!live) {
      live = document.createElement("div");
      live.id = "eq-search-live";
      live.setAttribute("role", "status");
      live.setAttribute("aria-live", "polite");
      live.className = "eq-search-live";
      live.style.cssText =
        "position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;";
      document.body.appendChild(live);
    }
    live.textContent =
      count === 0
        ? q + " i\u00e7in sonu\u00e7 yok"
        : q + " i\u00e7in " + count + " sonu\u00e7";
  }

  function isRealCatFilter(fn) {
    return typeof fn === "function" && fn.__eqCatShell === true;
  }

  function dispatchSearch(q, opts) {
    opts = opts || {};
    q = String(q == null ? "" : q).trim();
    window.__eqHdrLastQ = q;

    var did = false;
    var count = -1;

    if (typeof window.__eqHomeSearch === "function") {
      try {
        window.__eqHomeSearch(q);
        did = true;
        if (typeof window.filtered === "function") {
          try {
            count = window.filtered().length;
          } catch (_) {}
        }
      } catch (e) {
        console.warn("[Equsto arama]", e);
      }
    }

    if (isRealCatFilter(window.searchFilter)) {
      try {
        window.searchFilter(q);
        did = true;
      } catch (e2) {
        console.warn("[Equsto arama]", e2);
      }
    } else if (typeof window.searchFilter === "function") {
      try {
        window.searchFilter(q);
      } catch (_) {}
    }

    if (q) showFeedback(q, count);

    if (!did && q && !opts.noRedirect) {
      var path = (location.pathname || "").replace(/\\/g, "/");
      if (!/\/index\.html$/i.test(path) && path !== "/" && !/\/shop\/?$/i.test(path)) {
        try {
          sessionStorage.setItem("eq_hdr_search_q", q);
        } catch (_) {}
        location.href = "/shop?q=" + encodeURIComponent(q);
        return;
      }
    }

    if (opts.scroll !== false && q) scrollToResults();
  }

  if (typeof window.searchFilter !== "function") {
    window.searchFilter = function (q) {
      window.__eqHdrLastQ = String(q == null ? "" : q);
    };
  }

  window.eqSearchScrollToResults = scrollToResults;
  window.__eqSearchDispatch = dispatchSearch;
  window.eqCommitHeaderSearch = function () {
    var inp = document.querySelector("header.hdr .srch-input, header .srch .srch-input");
    dispatchSearch(inp ? inp.value : "", { scroll: true });
  };

  document.addEventListener(
    "input",
    function (ev) {
      var t = ev.target;
      if (!t || !t.classList || !t.classList.contains("srch-input")) return;
      dispatchSearch(t.value, { noRedirect: true, scroll: false });
    },
    true
  );

  document.addEventListener(
    "keydown",
    function (ev) {
      if (ev.key !== "Enter") return;
      var t = ev.target;
      if (!t || !t.classList || !t.classList.contains("srch-input")) return;
      ev.preventDefault();
      dispatchSearch(t.value, { scroll: true });
    },
    true
  );

  document.addEventListener(
    "click",
    function (ev) {
      var btn = ev.target && ev.target.closest && ev.target.closest(".srch-btn");
      if (!btn || !btn.closest("header .srch, header.hdr .srch")) return;
      ev.preventDefault();
      var root = btn.closest(".srch");
      var inp = root && root.querySelector(".srch-input");
      dispatchSearch(inp ? inp.value : "", { scroll: true });
    },
    true
  );

  function drainUrlQ() {
    var q = "";
    try {
      q = (new URLSearchParams(location.search).get("q") || "").trim();
    } catch (_) {}
    if (!q) {
      try {
        q = (sessionStorage.getItem("eq_hdr_search_q") || "").trim();
        if (q) sessionStorage.removeItem("eq_hdr_search_q");
      } catch (_2) {}
    }
    if (!q) return;
    var inp = document.querySelector("header.hdr .srch-input, header .srch .srch-input");
    if (inp) inp.value = q;
    dispatchSearch(q, { scroll: true, noRedirect: true });
  }

  document.addEventListener("eqCatShellMounted", function () {
    var q = window.__eqHdrLastQ || "";
    if (String(q).trim() && isRealCatFilter(window.searchFilter)) {
      try {
        window.searchFilter(q);
      } catch (_) {}
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", drainUrlQ);
  } else {
    setTimeout(drainUrlQ, 0);
  }

  try {
    var b = document.body;
    /* Mutbex vitrin: tüm eq-shop (PFOS + Bar Design + admin hariç) */
    var shopMutbex =
      b &&
      b.classList.contains("eq-shop") &&
      !b.classList.contains("admin-app") &&
      !b.classList.contains("bd-page") &&
      !b.classList.contains("eq-pfos") &&
      !b.classList.contains("eq-dept-plp");
    if (shopMutbex) {
      var vs = document.createElement("script");
      vs.src = "/eq-vitrin-config.js";
      vs.defer = true;
      document.head.appendChild(vs);
      var sv = document.createElement("script");
      sv.src = "/eq-shop-vitrin.js";
      sv.defer = true;
      document.head.appendChild(sv);
      var mx = document.createElement("script");
      mx.src = "/eq-mutbex-chrome.js";
      mx.defer = true;
      document.head.appendChild(mx);
      var cmp = document.createElement("script");
      cmp.src = "/eq-product-compare.js";
      cmp.defer = true;
      document.head.appendChild(cmp);
      if (!document.querySelector('link[href="/eq-home-mutbex.css"]')) {
        var lnk = document.createElement("link");
        lnk.rel = "stylesheet";
        lnk.href = "/eq-home-mutbex.css?v=20260518r";
        document.head.appendChild(lnk);
      }
    }
  } catch (_) {}
})();
