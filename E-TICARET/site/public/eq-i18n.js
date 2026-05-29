/**
 * eq-i18n.js — Equsto.com çift dil motoru (TR varsayılan, EN ikinci dil)
 *
 * Strateji:
 *  - Tek HTML, runtime çeviri. `data-i18n="key"` attribute'lı elementler
 *    `i18n/<lang>.json` sözlüğünden çevrilir.
 *  - Dil URL ile sabitlenir: `/en/…` prefix EN, diğer her yol TR.
 *  - localStorage `eq-lang` kullanıcı tercihini saklar (sonraki ziyaretlerde
 *    canonical URL'e yönlendirme için ipucu; doğrulama URL'dir).
 *  - <html lang> attribute güncellenir.
 *  - <link rel="alternate" hreflang> tag'leri otomatik enjekte edilir.
 *  - Header sağ üstte küçük `TR · EN` switcher render edilir.
 *
 * Public API:
 *   window.eqLang                       -> 'tr' | 'en'
 *   window.eqT(key, fallback?)          -> dize (key bulunamazsa fallback ya da key)
 *   window.eqI18nReady                  -> Promise<void>  (sözlük yüklendi)
 *   window.eqI18nApply(root?)           -> root altındaki data-i18n elementlerini çevir
 *   window.eqI18nUrl(href, lang?)       -> /en/ prefix'i ekler/çıkarır
 *
 * Kullanılan data-* attribute'ları:
 *   data-i18n="ns.key"             -> textContent
 *   data-i18n-html="ns.key"        -> innerHTML
 *   data-i18n-attr="placeholder:ns.key, aria-label:ns.key2"
 *   data-i18n-title="ns.key"       -> kısayol; title attribute
 *   data-i18n-skip                  -> bu element ve alt ağacı atlanır
 */
(function () {
  "use strict";

  var SUPPORTED = ["tr", "en"];
  var DEFAULT = "tr";
  var STORAGE_KEY = "eq-lang";
  var PREFIX_RE = /^\/en(\/|$)/i;

  /** TR slug → EN pathname (without /en prefix) */
  var EN_PATH_ALIASES = {
    "/hakkimizda": "/about",
    "/buradan-basladi": "/story",
    "/contact": "/contact",
    "/pfos": "/pfos",
    "/sss": "/sss",
    "/login": "/login",
    "/blog": "/blog",
    "/projeler": "/projects",
  };

  /** EN pathname (no /en) → TR kanonik yol */
  var TR_PATH_ALIASES = {
    "/about": "/hakkimizda",
    "/story": "/buradan-basladi",
    "/search": "/arama",
    "/cart": "/sepet",
  };
  Object.keys(EN_PATH_ALIASES).forEach(function (trPath) {
    TR_PATH_ALIASES[EN_PATH_ALIASES[trPath]] = trPath;
  });

  function trPathFromEnPath(stripped) {
    if (!stripped || stripped === "/") return stripped;
    if (TR_PATH_ALIASES[stripped]) return TR_PATH_ALIASES[stripped];
    if (stripped.indexOf("/guides/") === 0) {
      return "/rehber/" + stripped.slice("/guides/".length);
    }
    if (stripped.indexOf("/projects/") === 0) {
      return "/projeler/" + stripped.slice("/projects/".length);
    }
    var slug = stripped.replace(/^\//, "");
    var keys = Object.keys(TR_GEO_TO_EN_SLUG);
    for (var i = 0; i < keys.length; i++) {
      if (TR_GEO_TO_EN_SLUG[keys[i]] === slug) return "/" + keys[i];
    }
    return stripped;
  }

  var TR_GEO_TO_EN_SLUG = {
    "steakhouse-kurulumu": "steakhouse-kitchen-setup",
    "bulut-mutfak-kurulumu": "cloud-kitchen-setup",
    "cafe-kurulumu": "cafe-setup",
    "catering-mutfagi": "catering-kitchen",
    "fine-dining-kurulumu": "fine-dining-kitchen-setup",
    "all-day-dining-kurulumu": "all-day-dining-kitchen-setup",
    "fast-food-kurulumu": "fast-food-kitchen-setup",
    "market-kasap-sarkuteri-kurulumu": "market-butcher-deli-setup",
    "endustriyel-mutfak-ekipmani-turkiye": "industrial-kitchen-equipment-turkey",
    "restoran-mutfak-teklif": "restaurant-kitchen-quote",
    "otel-mutfak-ekipman-tedarik": "hotel-kitchen-equipment",
    "oztiryakiler-ekipmani-tedarik": "oztiryakiler-equipment-supply",
    "soguk-oda-teklif": "cold-room-quote",
    "havuzlu-dolap-tedarik": "deli-counter-refrigeration",
    "endustriyel-pisirme-ekipmanlari": "industrial-cooking-equipment",
    "mutfak-teklif-platformu": "kitchen-quote-platform",
    "bar-tasarimi-turkiye": "bar-design-turkey",
    blog: "blog",
    projeler: "projects",
  };

  /* ---------- dil tespiti ---------- */

  function detectLang() {
    try {
      var path = String(location.pathname || "").toLowerCase();
      if (PREFIX_RE.test(path)) return "en";
      return DEFAULT;
    } catch (_) {
      return DEFAULT;
    }
  }

  function saveLang(lang) {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (_) {}
  }

  /* ---------- sözlük yükleme ---------- */

  var DICT = {};
  var loadPromise = null;
  var loadedLang = null;

  function fetchDict(lang) {
    var custom = window.eqI18nBaseUrl;
    var v = window.__EQ_I18N_JSON_V || "20260530besos-pdp-i18n";
    var urls = custom
      ? [custom + lang + ".json?v=" + encodeURIComponent(v)]
      : ["/i18n/" + lang + ".json?v=" + encodeURIComponent(v), "/locales/" + lang + ".json?v=" + encodeURIComponent(v)];
    function tryAt(i) {
      if (i >= urls.length) return Promise.resolve(null);
      return fetch(urls[i], { cache: "no-store" })
        .then(function (r) {
          if (!r.ok) throw new Error("i18n fetch " + r.status);
          return r.json();
        })
        .catch(function () {
          return tryAt(i + 1);
        });
    }
    return tryAt(0);
  }

  function loadDict(lang) {
    if (loadPromise && loadedLang === lang) return loadPromise;
    loadedLang = lang;
    loadPromise = fetchDict(lang).then(function (j) {
      if (j) DICT = j;
      return DICT;
    });
    return loadPromise;
  }

  /* ---------- çeviri ---------- */

  function get(key) {
    if (!key) return "";
    var parts = String(key).split(".");
    var node = DICT;
    for (var i = 0; i < parts.length; i++) {
      if (node && typeof node === "object" && parts[i] in node) {
        node = node[parts[i]];
      } else {
        return null;
      }
    }
    return typeof node === "string" ? node : null;
  }

  function t(key, fallback) {
    var v = get(key);
    if (v != null) return v;
    if (fallback != null) return fallback;
    return key;
  }

  function tipKey(tip) {
    return String(tip || "")
      .replace(/-/g, "_")
      .replace(/_+$/, "");
  }

  /** Departman alt dalı (?tip=) veya tile.id — nav.sub.* sözlüğü. */
  function eqTipLabel(tipOrTile, fallback) {
    var tip =
      typeof tipOrTile === "string"
        ? tipOrTile
        : tipOrTile && (tipOrTile.id || tipOrTile.tip || "");
    var fb =
      fallback != null
        ? fallback
        : tipOrTile && typeof tipOrTile === "object"
          ? tipOrTile.label
          : "";
    if (!tip) return fb != null ? String(fb) : "";
    var lk = tipOrTile && tipOrTile.labelKey ? tipOrTile.labelKey : "nav.sub." + tipKey(tip);
    return t(lk, fb != null ? fb : "");
  }

  window.eqTipLabel = eqTipLabel;

  /* ---------- DOM uygulama ---------- */

  function applyAttrs(el) {
    var spec = el.getAttribute("data-i18n-attr");
    if (!spec) return;
    spec.split(",").forEach(function (chunk) {
      var idx = chunk.indexOf(":");
      if (idx < 0) return;
      var attr = chunk.slice(0, idx).trim();
      var key = chunk.slice(idx + 1).trim();
      if (!attr || !key) return;
      var v = get(key);
      if (v != null) el.setAttribute(attr, v);
    });
  }

  function applyOne(el) {
    if (el.hasAttribute("data-i18n-skip")) return;
    var k;
    if ((k = el.getAttribute("data-i18n"))) {
      var v = get(k);
      if (v != null) el.textContent = v;
    }
    if ((k = el.getAttribute("data-i18n-html"))) {
      var vh = get(k);
      if (vh != null) el.innerHTML = vh;
    }
    if ((k = el.getAttribute("data-i18n-title"))) {
      var vt = get(k);
      if (vt != null) el.setAttribute("title", vt);
    }
    if (el.hasAttribute("data-i18n-attr")) applyAttrs(el);
  }

  function applyTree(root) {
    root = root || document;
    var sel = "[data-i18n],[data-i18n-html],[data-i18n-title],[data-i18n-attr]";
    var list = root.querySelectorAll(sel);
    for (var i = 0; i < list.length; i++) applyOne(list[i]);
    // root'un kendisi de hedef olabilir
    if (root.matches && root.matches(sel)) applyOne(root);
    rewriteInternalLinks(root);
  }

  /** EN sayfalarında iç linkleri /en/… canonical yollarına çevir */
  function rewriteInternalLinks(root) {
    if ((window.eqLang || DEFAULT) !== "en") return;
    root = root || document;
    var links = root.querySelectorAll('a[href^="/"]');
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      if (a.hasAttribute("data-i18n-skip")) continue;
      if (a.hasAttribute("data-lang")) continue;
      if (a.closest && a.closest(".eq-lang-switch")) continue;
      var h = a.getAttribute("href");
      if (!h || h.indexOf("/en/") === 0 || h === "/en") continue;
      if (/^\/(api|data|images|_next)\//.test(h)) continue;
      a.setAttribute("href", urlFor(h, "en"));
    }
  }

  /* ---------- hreflang ---------- */

  function ensureHreflang(lang) {
    try {
      var head = document.head;
      if (!head) return;
      var path = location.pathname || "/";
      var origin = location.origin && location.origin !== "null"
        ? location.origin
        : "";
      var clean = path.replace(PREFIX_RE, "/").replace(/\/+$/, "") || "/";
      // /shop, /pfos, /besos gibi köksüz yollar için sonu "/" yapma; bozar.
      function build(pfx) {
        if (clean === "/") return origin + pfx + (pfx.endsWith("/") ? "" : "/");
        return origin + pfx + clean;
      }
      function upsert(hl, href) {
        var sel = 'link[rel="alternate"][hreflang="' + hl + '"]';
        var l = head.querySelector(sel);
        if (!l) {
          l = document.createElement("link");
          l.setAttribute("rel", "alternate");
          l.setAttribute("hreflang", hl);
          head.appendChild(l);
        }
        l.setAttribute("href", href);
      }
      upsert("tr", build(""));
      upsert("en", build("/en"));
      upsert("x-default", build(""));
    } catch (_) {}
  }

  /* ---------- URL dönüştürücü ---------- */

  function urlFor(href, lang) {
    if (!href) return href;
    lang = lang || window.eqLang || DEFAULT;
    try {
      // Mutlak URL? sadece pathname üstüne çalış.
      var u;
      var isAbsolute = /^https?:\/\//i.test(href);
      if (isAbsolute) {
        u = new URL(href);
      } else if (href.charAt(0) === "/") {
        u = new URL(href, location.origin || "https://equsto.com");
      } else {
        // göreli (örn. "bar.html"): mevcut /en/ context'inde kal.
        if (lang === "en" && !PREFIX_RE.test(location.pathname || "")) {
          return "/en/" + href.replace(/^\.?\//, "");
        }
        return href;
      }
      var p = u.pathname || "/";
      var stripped = p.replace(PREFIX_RE, "/");
      var base = stripped === "/" ? "" : stripped;
      if (lang !== "en") {
        base = trPathFromEnPath(stripped === "/" ? "/" : stripped);
        if (base === "/") base = "";
      } else if (lang === "en") {
        if (EN_PATH_ALIASES[stripped]) base = EN_PATH_ALIASES[stripped];
        else if (stripped.indexOf("/rehber/") === 0) {
          base = "/guides/" + stripped.slice("/rehber/".length);
        } else if (stripped.indexOf("/projeler/") === 0) {
          base = "/projects/" + stripped.slice("/projeler/".length);
        } else {
          var slug = stripped.replace(/^\//, "");
          if (TR_GEO_TO_EN_SLUG[slug]) base = "/" + TR_GEO_TO_EN_SLUG[slug];
        }
      }
      var nextPath;
      if (lang === "en") {
        nextPath = "/en" + base;
      } else {
        nextPath =
          base === "" || base === "/"
            ? "/"
            : base.charAt(0) === "/"
              ? base
              : "/" + base;
      }
      u.pathname = nextPath;
      if (isAbsolute) return u.toString();
      return u.pathname + u.search + u.hash;
    } catch (_) {
      return href;
    }
  }

  /* ---------- dil switcher ---------- */

  function buildSwitcher(lang) {
    var wrap = document.createElement("div");
    wrap.className = "eq-lang-switch";
    wrap.setAttribute("role", "group");
    wrap.setAttribute("aria-label", "Language switcher");
    wrap.innerHTML =
      '<a class="eq-lang-opt' + (lang === "tr" ? " is-active" : "") + '"' +
        ' href="' + urlFor(location.pathname + location.search + location.hash, "tr") + '"' +
        ' data-lang="tr" aria-current="' + (lang === "tr" ? "true" : "false") + '"' +
        ' title="' + (DICT["lang_switcher"] && DICT["lang_switcher"]["switch_to_tr"] || "Türkçe") + '">TR</a>' +
      '<span class="eq-lang-sep" aria-hidden="true">·</span>' +
      '<a class="eq-lang-opt' + (lang === "en" ? " is-active" : "") + '"' +
        ' href="' + urlFor(location.pathname + location.search + location.hash, "en") + '"' +
        ' data-lang="en" aria-current="' + (lang === "en" ? "true" : "false") + '"' +
        ' title="' + (DICT["lang_switcher"] && DICT["lang_switcher"]["switch_to_en"] || "English") + '">EN</a>';
    wrap.querySelectorAll("a.eq-lang-opt").forEach(function (a) {
      a.addEventListener("click", function (e) {
        var targetLang = a.getAttribute("data-lang") || DEFAULT;
        var href = urlFor(
          location.pathname + location.search + location.hash,
          targetLang
        );
        saveLang(targetLang);
        e.preventDefault();
        window.location.assign(href || "/");
      });
    });
    return wrap;
  }

  function ensureSwitcherStyles() {
    if (document.getElementById("eq-i18n-style")) return;
    var css =
      ".eq-lang-switch{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:600;letter-spacing:0.08em;line-height:1;padding:0 8px;border-right:1px solid var(--eq-border,#e3e3e3);}" +
      ".eq-lang-switch a.eq-lang-opt{color:var(--eq-text-muted,#6e6e6e);text-decoration:none;padding:4px 6px;border-radius:2px;cursor:pointer;transition:color .15s ease,background .15s ease;}" +
      ".eq-lang-switch a.eq-lang-opt:hover{color:var(--eq-text,#1a1a1a);background:var(--eq-hover,#f3f3f3);}" +
      ".eq-lang-switch a.eq-lang-opt.is-active{color:var(--eq-accent-gold,#c8a44a);}" +
      ".eq-lang-switch .eq-lang-sep{color:var(--eq-text-subtle,#bbb);}" +
      "body.besos .eq-lang-switch{border-right-color:rgba(255,255,255,0.18);}" +
      "body.besos .eq-lang-switch a.eq-lang-opt{color:rgba(255,255,255,0.65);}" +
      "body.besos .eq-lang-switch a.eq-lang-opt:hover{color:#fff;background:rgba(255,255,255,0.08);}" +
      "body.besos .eq-lang-switch a.eq-lang-opt.is-active{color:#c8a44a;}";
    var s = document.createElement("style");
    s.id = "eq-i18n-style";
    s.textContent = css;
    document.head.appendChild(s);
  }

  function mountSwitcher(lang) {
    var existing = document.querySelector(".eq-lang-switch");
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
    ensureSwitcherStyles();
    var sw = buildSwitcher(lang);
    // 1) Tercih: sayfada [data-eq-lang-slot] varsa oraya
    var slot = document.querySelector("[data-eq-lang-slot]");
    if (slot) { slot.appendChild(sw); return; }
    // 2) Aksi halde: .hdr-right'ın en başına
    var hdrRight = document.querySelector(".hdr-right");
    if (hdrRight) {
      hdrRight.insertBefore(sw, hdrRight.firstChild);
      return;
    }
    // 3) Son çare: body'nin sağ üst köşesine sabit
    sw.style.cssText = "position:fixed;top:8px;right:12px;z-index:9999;background:rgba(255,255,255,0.92);padding:2px 6px;border:1px solid #e3e3e3;border-radius:3px;";
    document.body.appendChild(sw);
  }

  window.__eqRemountLangSwitcher = function () {
    mountSwitcher(detectLang());
  };

  /* ---------- boot ---------- */

  var lang = detectLang();
  window.eqLang = lang;
  saveLang(lang);

  try {
    document.documentElement.setAttribute("lang", lang);
  } catch (_) {}

  window.eqT = t;
  window.eqI18nApply = applyTree;
  window.eqI18nUrl = urlFor;

  function rerunDynamicRenderers() {
    try { if (typeof window.__eqRerenderNav === "function") window.__eqRerenderNav(); } catch (_) {}
    try { if (typeof window.__eqRerenderBesos === "function") window.__eqRerenderBesos(); } catch (_) {}
    try { if (typeof window.__eqRerenderTopnavPfos === "function") window.__eqRerenderTopnavPfos(); } catch (_) {}
    try { if (typeof window.__eqRerenderTopnavBesos === "function") window.__eqRerenderTopnavBesos(); } catch (_) {}
    try {
      if (typeof window.equstoRefreshDeliveryHeader === "function") window.equstoRefreshDeliveryHeader();
    } catch (_) {}
  }

  function dispatchI18nReady() {
    try {
      window.dispatchEvent(
        new CustomEvent("equsto:i18n-ready", { detail: { lang: lang } })
      );
    } catch (_) {}
  }

  /** Yalnızca URL /en/… iken EN tut; TR yollarına localStorage ile zorla EN ekleme. */
  function redirectToEnCanonical() {
    var path = location.pathname || "/";
    if (!PREFIX_RE.test(path)) {
      saveLang("tr");
      return;
    }
    saveLang("en");
  }

  function afterDictReady() {
    applyTree(document);
    ensureHreflang(lang);
    mountSwitcher(lang);
    rerunDynamicRenderers();
    redirectToEnCanonical();
    dispatchI18nReady();
  }

  window.eqI18nReady = loadDict(lang).then(function () {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", afterDictReady, { once: true });
    } else {
      afterDictReady();
    }
    window.addEventListener("load", function () {
      applyTree(document);
      rerunDynamicRenderers();
    }, { once: true });
  });
})();
