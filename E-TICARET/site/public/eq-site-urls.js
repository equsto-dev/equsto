/**
 * Canlı kanonik: equsto.com/, /shop, /pfos, /besos, /shop/pisirme, /shop/{kategori}/{urun-slug}
 * Yerel http: aynı kısa yollar — Vite rewrite ile .html’e düşer.
 * file://: doğrudan .html dosyaları (ERR_FILE_NOT_FOUND önlenir).
 *
 * Geriye dönük: /urunler → /shop (301), /urun/{slug}, /proje-fabrikasi → /pfos — eski bağlantılar kırılmaz.
 *
 * Çift dil: window.eqLang === 'en' → /en/... prefix (admin hariç).
 */
(function () {
  var ORIGIN = "https://equsto.com";
  var PATH = {
    home: "/",
    shop: "/shop",
    pfos: "/pfos",
    admin: "/admin.html",
    yerSofrasi: "/yer-sofrasi",
    besos: "/besos",
    contact: "/iletisim",
    sss: "/sss",
    login: "/login.html",
    account: "/hesabim",
    cart: "/sepet",
    pisirme: "/shop/pisirme",
    sogutma: "/shop/sogutma",
    marketReyon: "/shop/market-reyonlari",
    kahve: "/shop/kahve",
    yikama: "/shop/yikama",
    hazirlik: "/shop/hazirlik",
    icecek: "/shop/icecek",
    tezgah: "/shop/tezgah",
    dolap: "/shop/dolap",
    davlumbaz: "/shop/davlumbaz",
    tasima: "/shop/tasima",
    araba: "/shop/araba",
    istif: "/shop/istif",
    "set-ustu-mutfak": "/shop/set-ustu-mutfak",
    kuvetler: "/shop/kuvetler",
  };
  /** file:// açılışında kullanılacak gerçek dosya adları */
  var FILE_FALLBACK = {
    home: "index.html",
    shop: "index.html",
    pfos: "pfos.html",
    admin: "admin.html",
    yerSofrasi: "index.html",
    besos: "bar-design.html",
    contact: "iletisim.html",
    sss: "sss.html",
    login: "login.html",
    cart: "sepet.html",
    pisirme: "pisirme.html",
    sogutma: "sogutma.html",
    marketReyon: "market-reyonlari.html",
    kahve: "kahve.html",
    yikama: "yikama.html",
    hazirlik: "hazirlik.html",
    icecek: "icecek.html",
    tezgah: "tezgah.html",
    dolap: "dolap.html",
    davlumbaz: "davlumbaz.html",
    tasima: "tasima.html",
    araba: "araba.html",
    istif: "istif.html",
    "set-ustu-mutfak": "set-ustu-mutfak.html",
    kuvetler: "kuvetler.html",
  };
  var LANG_NEUTRAL = { admin: true };

  /** Katalog `category` alanı → vitrin URL segmenti (PATH anahtarı ile aynı). product.html deptLink ile uyumlu. */
  window.eqCategoryToUrunlerSeg = function (cat) {
    var c = String(cat || "").toLowerCase();
    if (c === "sogutma-ekipmanlari") return "sogutma";
    if (c === "market-reyonlari") return "market-reyon";
    if (c === "gastronom-kuvetler") return "yardimci";
    var pisirme = [
      "sanayi-ocaklari",
      "sanayi-tipi-izgaralar",
      "kuzineler",
      "fritozler",
      "doner-ocaklari-",
      "tost-makineleri",
      "pilic-cevirme-makineleri",
      "ocakbasi-izgara",
    ];
    if (pisirme.indexOf(c) !== -1) return "pisirme";
    if (c === "kahve-makineleri") return "kahve";
    if (c === "bulasik-makineleri" || c === "yikama-ekipmanlari") return "yikama";
    if (c === "hamur-hazirlik-makineleri" || c === "et-hazirlik-makineleri") return "hazirlik";
    if (
      c === "cay-kazanlari-cay-makineleri-cay-otomatlari" ||
      c === "yiyecek-ve-icecek-otomatlari-" ||
      c === "cikolata-temperleme-makinesi-" ||
      c === "icecek-berrak-buz-makineleri"
    )
      return "icecek";
    return null;
  };

  /** Ana sayfa vitrin / şerit — ürün hangi departmana ait? (`c` = katalog category slug) */
  window.eqProductMatchesDept = function (u, dept) {
    if (!u || !dept) return false;
    var d = String(dept).toLowerCase();
    if (d === "kuvetler") {
      return !!(window.EqDeptTips && typeof window.EqDeptTips.isKuvetProduct === "function" && window.EqDeptTips.isKuvetProduct(u));
    }
    if (u.dept && String(u.dept).toLowerCase() === d) return true;
    var cat = String(u.c || u.category || "").toLowerCase();
    if (cat === d) return true;
    if (typeof window.eqCategoryToUrunlerSeg === "function") {
      var seg = window.eqCategoryToUrunlerSeg(cat);
      if (seg === d) return true;
    }
    return false;
  };

  /** Bulaşıkhane vitrini: yıkama departmanı ama portakal sıkma vb. değil */
  window.eqYikamaShowcaseProduct = function (u) {
    if (!window.eqProductMatchesDept(u, "yikama")) return false;
    var hay = ((u.n || u.name || "") + " " + (u.b || u.brand || "")).toLocaleLowerCase("tr-TR");
    if (
      /portakal\s*s[ıi]kma|narenciye\s*s[ıi]kma|greyfurt\s*s[ıi]kma|otomatik\s*portakal|orange\s*juice|juice\s*extractor|meyve\s*s[ıi]kma\s*makinesi/i.test(
        hay
      )
    ) {
      return false;
    }
    if (/s[ıi]kma\s*makinesi/i.test(hay) && !/bula[sş][ıi]k|y[ıi]kama|sebze\s*y[ıi]kama|ön\s*y[ıi]kama/i.test(hay)) {
      return false;
    }
    return true;
  };

  function isProd() {
    try {
      var h = String(location.hostname || "");
      return h === "equsto.com" || h === "www.equsto.com";
    } catch (e) {
      return false;
    }
  }
  function curLang() {
    try {
      if (window.eqLang === "en") return "en";
      var p = String(location.pathname || "");
      if (/^\/en(\/|$)/i.test(p)) return "en";
    } catch (e) {}
    return "tr";
  }
  function withLang(path, key) {
    if (LANG_NEUTRAL[key]) return path;
    if (curLang() !== "en") return path;
    if (path === "/") return "/en/";
    if (key === "cart") return "/en/cart";
    if (key === "account") return "/en/account";
    return "/en" + path;
  }
  window.equstoUrl = function (key) {
    var p = PATH[key];
    if (!p) return ORIGIN + (curLang() === "en" ? "/en/" : "/");
    var prefixed = withLang(p, key);
    if (isProd()) return ORIGIN + prefixed;
    try {
      if (typeof location !== "undefined" && location.protocol === "file:" && FILE_FALLBACK[key] != null) {
        return FILE_FALLBACK[key];
      }
    } catch (_) {}
    if (curLang() === "en") return prefixed;
    return p;
  };
  window.eqGo = function (key) {
    window.location.href = window.equstoUrl(key);
  };
  /** Arama sonuç sayfası — TR /arama, EN /en/search */
  /** KİLİT: public/arama-history-KILIT.txt — eqNavigateArama / geri tuşu */
  window.eqAramaUrl = function (q) {
    q = String(q || "").trim();
    if (!q) return "";
    var base = curLang() === "en" ? "/en/search" : "/arama";
    return base + "?q=" + encodeURIComponent(q);
  };
  function eqIsAramaPathname(pathname) {
    var p = String(pathname || "").replace(/\/$/, "");
    return p === "/arama" || p === "/en/search";
  }
  /** Arama sayfasına git — aynı URL'de history şişirmez; /arama içinde pushState kullanır. */
  window.eqNavigateArama = function (q, opts) {
    opts = opts || {};
    q = String(q || "").trim();
    if (!q) return false;
    var url = window.eqAramaUrl(q);
    if (!url) return false;
    try {
      sessionStorage.setItem("eq_hdr_search_q", q);
    } catch (_) {}
    window.__eqHdrLastQ = q;
    try {
      var target = new URL(url, location.origin);
      var curPath = String(location.pathname || "").replace(/\/$/, "");
      var tgtPath = target.pathname.replace(/\/$/, "");
      var curQ = String(new URLSearchParams(location.search).get("q") || "").trim();
      var tgtQ = String(target.searchParams.get("q") || "").trim();
      if (curPath === tgtPath && curQ === tgtQ) return true;
      if (eqIsAramaPathname(curPath) && eqIsAramaPathname(tgtPath)) {
        if (opts.replace) history.replaceState(null, "", url);
        else history.pushState(null, "", url);
        if (typeof window.eqClearHeaderSearchInput === "function") {
          window.eqClearHeaderSearchInput();
        }
        if (typeof window.__eqAramaBoot === "function") window.__eqAramaBoot();
        return true;
      }
    } catch (_) {}
    location.href = url;
    return true;
  };
  /** Ana vitrin (/, /shop) — kategori sayfaları (/shop/pisirme …) ayrı HTML */
  window.eqIsHomeVitrin = function () {
    try {
      var p = String(location.pathname || "/").replace(/^\/en(?=\/|$)/, "");
      if (p === "/" || p === "") return true;
      if (p === "/shop" || p === "/shop/") return true;
      return /index\.html$/i.test(p);
    } catch (e) {
      return false;
    }
  };
  var EQ_DEPT_NAV_KEYS = [
    "pisirme",
    "sogutma",
    "kahve",
    "yikama",
    "hazirlik",
    "icecek",
    "tezgah",
    "dolap",
    "davlumbaz",
    "tasima",
    "araba",
    "istif",
    "set-ustu-mutfak",
    "kuvetler",
  ];
  window.eqIsDeptNavKey = function (key) {
    return EQ_DEPT_NAV_KEYS.indexOf(String(key || "")) >= 0;
  };
  /** Ana sayfadan departman vitrinine git (asla filterCat ile kalma) */
  window.eqDeptGo = function (key) {
    if (window.eqIsDeptNavKey(key)) return window.eqGo(key);
    if (typeof window.eqGo === "function") return window.eqGo("shop");
    window.location.href = "/";
  };
  /** Vitrin ürün URL’si: /shop/{dept}/{slug} — EN’de /en/shop/… */
  window.eqProductPath = function (deptSeg, slug) {
    var d = String(deptSeg || "pisirme").replace(/^\/+|\/+$/g, "");
    if (d === "market-reyon") d = "market-reyonlari";
    var sl = String(slug || "").replace(/^\/+/, "");
    var base = "/shop/" + d + "/" + sl;
    if (curLang() !== "en") return base;
    return "/en" + base;
  };
  /** tr-TR küçük harf + ASCII slug (ı/İ/ş/ğ… → i/s/g…) — SKU kodlarında I→ı kaybını önler. */
  function eqFoldTrSlug(s) {
    return String(s || "")
      .toLocaleLowerCase("tr")
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ş/g, "s")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c")
      .replace(/ı/g, "i")
      .replace(/İ/g, "i");
  }
  window.eqFoldTrSlug = eqFoldTrSlug;

  /** PLP + product.html — vitrin slug (lib/catalog-product-slug.ts ile uyumlu). */
  window.eqProductSlug = function (row) {
    if (!row) return "";
    var sku = String(row.sku || row.model || row.urun_kodu || row.stok_no || "").trim();
    if (sku) {
      var fromSku = eqFoldTrSlug(sku)
        .replace(/\./g, "-")
        .replace(/[^a-z0-9+\-]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "")
        .substring(0, 80);
      if (fromSku) return fromSku;
    }
    var id = String(row.id || "").trim();
    if (id) {
      var tail = id.indexOf("__") >= 0 ? id.split("__").pop() : "";
      if (tail) return String(tail).toLowerCase();
      return id.toLowerCase();
    }
    function slugify(s) {
      return eqFoldTrSlug(s)
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .substring(0, 100);
    }
    var b = slugify(row.brand || row.b || "");
    var n = slugify(row.name || row.n || "");
    return (b ? b + "-" : "") + n;
  };
  /** Eski deneme: ö→o çeviri; yer imleri için findRaw yedek eşleşme. */
  window.eqProductSlugTransliterated = function (row) {
    if (!row) return "";
    var tr = {
      "ğ": "g", "ü": "u", "ş": "s", "ı": "i", "ö": "o", "ç": "c",
      "Ğ": "g", "Ü": "u", "Ş": "s", "İ": "i", "Ö": "o", "Ç": "c",
    };
    function slugify(s) {
      return String(s || "")
        .toLowerCase()
        .replace(/[ğüşıöçĞÜŞİÖÇ]/g, function (c) {
          return tr[c] || c;
        })
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .substring(0, 100);
    }
    var b = slugify(row.brand || row.b || "");
    var n = slugify(row.name || row.n || "");
    return (b ? b + "-" : "") + n;
  };
  window.__eqProductSlug = window.eqProductSlug;

  /** Eski arama / Meilisearch slug → katalog satırı (PDP findRaw). */
  function eqPdpSlugAliases(pathSlug) {
    var base = String(pathSlug || "")
      .toLowerCase()
      .replace(/_/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
    if (!base) return [];
    var out = [base];
    function add(s) {
      var n = String(s || "")
        .toLowerCase()
        .replace(/_/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "");
      if (n && out.indexOf(n) < 0) out.push(n);
    }
    add(base.replace(/^pimak-/, "equsto-"));
    add(base.replace(/^equsto-pimak-/, "equsto-"));
    add(base.replace(/^equsto__equsto-pimak-/, "equsto-"));
    add(base.replace(/^equsto__equsto-/, "equsto-"));
    return out;
  }

  window.eqFindCatalogRowByPathSlug = function (all, pathSlug) {
    if (!all || !all.length || !pathSlug) return null;
    var aliases = eqPdpSlugAliases(pathSlug);
    for (var ai = 0; ai < aliases.length; ai++) {
      var ps = aliases[ai];
      for (var i = 0; i < all.length; i++) {
        var row = all[i];
        if (!row) continue;
        var sku = String(row.sku || row.model || row.urun_kodu || row.stok_no || "").trim();
        if (sku) {
          var skuSl = eqFoldTrSlug(sku)
            .replace(/\./g, "-")
            .replace(/[^a-z0-9+\-]+/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-+|-+$/g, "");
          if (skuSl && skuSl === ps) return row;
        }
        var id = String(row.id || "").trim().toLowerCase();
        if (id && id === ps) return row;
        if (id) {
          var idDash = id.replace(/__/g, "-");
          if (idDash === ps || ps.endsWith("-" + idDash) || ps.endsWith(idDash)) return row;
          var tail = id.indexOf("__") >= 0 ? id.split("__").pop() : "";
          if (tail && (ps.endsWith(tail) || ps.endsWith(tail.replace(/__/g, "-")))) return row;
        }
        if (typeof window.eqProductSlug === "function" && window.eqProductSlug(row) === ps) return row;
        if (
          typeof window.eqProductSlugTransliterated === "function" &&
          window.eqProductSlugTransliterated(row) === ps
        ) {
          return row;
        }
        if (typeof window.eqLegacyMeiliPathSlug === "function" && window.eqLegacyMeiliPathSlug(row) === ps) {
          return row;
        }
      }
    }
    return null;
  };

  window.eqLegacyMeiliPathSlug = function (row) {
    if (!row) return "";
    function slugify(s) {
      return String(s || "")
        .toLocaleLowerCase("tr")
        .replace(/[/\\]+/g, "-")
        .replace(/[^a-z0-9+\-]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "")
        .substring(0, 100);
    }
    var b = slugify(row.brand || row.b || "");
    var n = slugify(row.name || row.n || "");
    return (b ? b + "-" : "") + n;
  };

  /** Popüler marka slug → katalogdaki tam marka adı */
  var EQ_BRAND_SLUG_ALIAS = {
    atalay: "Atalay Endüstriyel Mutfak Ekipmanları",
    oztiryakiler: "Öztiryakiler Endüstriyel Mutfak",
    electrolux: "Electrolux Professional",
    inoksan: "İnoksan",
    "la-cimbali": "La Cimbali",
    faema: "Faema",
    rational: "Rational",
    empero: "Empero",
    samixir: "Samixir",
    gtech: "Gtech",
    "robot-coupe": "Robot Coupe",
    wmf: "WMF",
    hoshizaki: "Hoshizaki",
    "nuova-simonelli": "Nuova Simonelli",
    atese: "Ateşe",
    unox: "Unox",
    fac: "FAC",
    santos: "Santos",
    hobart: "Hobart",
    "bravilor-bonamat": "Bravilor Bonamat",
    vitrifrigo: "Vitrifrigo",
    bartscher: "Bartscher",
    alkan: "Alkan",
    fantom: "Fantom",
    imperia: "Imperia",
    platemate: "PlateMate",
    "hamilton-beach": "Hamilton Beach",
    menumaster: "MenuMaster",
    tribeca: "Tribeca",
    dualit: "Dualit",
    swedlinghaus: "Swedlinghaus",
    vesta: "Vesta",
    copmak: "Copmak",
    blanco: "Blanco",
    simag: "SIMAG",
    senox: "Şenox",
    vosco: "Vosco",
  };

  /**
   * Popüler marka → departman vitrini (?marka=facet) veya tüm katalog (/shop/marka/slug).
   * facet: sol sütun Marka filtresindeki etiket (EqDeptCmFacets ile aynı).
   */
  var EQ_BRAND_SHOP_TARGET = {
    atalay: { markaHub: true, facet: "Atalay" },
    oztiryakiler: { markaHub: true, facet: "Öztiryakiler", oztiOwnOnly: true },
    "caglayan-refrigeration": { markaHub: true },
    "proso-profesyonel-sogutma": { markaHub: true },
    rational: { markaHub: true, facet: "Rational" },
    "robot-coupe": { markaHub: true, facet: "Robot Coupe" },
    wmf: { markaHub: true, facet: "WMF" },
    hoshizaki: { markaHub: true, facet: "Hoshizaki" },
    "nuova-simonelli": { markaHub: true, facet: "Nuova Simonelli" },
    atese: { markaHub: true, facet: "Ateşe" },
    unox: { markaHub: true, facet: "Unox" },
    fac: { markaHub: true, facet: "FAC" },
    santos: { markaHub: true, facet: "Santos" },
    hobart: { markaHub: true, facet: "Hobart" },
    "bravilor-bonamat": { markaHub: true, facet: "Bravilor Bonamat" },
    vitrifrigo: { markaHub: true, facet: "Vitrifrigo" },
    bartscher: { markaHub: true, facet: "Bartscher" },
    alkan: { markaHub: true, facet: "Alkan" },
    fantom: { markaHub: true, facet: "Fantom" },
    imperia: { markaHub: true, facet: "Imperia" },
    platemate: { markaHub: true, facet: "PlateMate" },
    "hamilton-beach": { markaHub: true, facet: "Hamilton Beach" },
    menumaster: { markaHub: true, facet: "MenuMaster" },
    tribeca: { markaHub: true, facet: "Tribeca" },
    dualit: { markaHub: true, facet: "Dualit" },
    swedlinghaus: { markaHub: true, facet: "Swedlinghaus" },
    vesta: { markaHub: true, facet: "Vesta" },
    copmak: { markaHub: true, facet: "Copmak" },
    blanco: { markaHub: true, facet: "Blanco" },
    simag: { markaHub: true, facet: "SIMAG" },
    electrolux: { markaHub: true, facet: "Electrolux" },
    senox: { markaHub: true, facet: "Şenox" },
    vosco: { markaHub: true, facet: "Vosco" },
    inoksan: { dept: "sogutma", facet: "İnoksan" },
    "la-cimbali": { dept: "kahve", facet: "La Cimbali" },
    faema: { dept: "kahve", facet: "Faema" },
    empero: { dept: "yikama", facet: "Empero" },
    samixir: { dept: "hazirlik", facet: "Samixir" },
    gtech: { dept: "hazirlik", facet: "Gtech" },
  };

  function brandSlugify(name) {
    var tr = { ğ: "g", ü: "u", ş: "s", ı: "i", ö: "o", ç: "c", Ğ: "g", Ü: "u", Ş: "s", İ: "i", Ö: "o", Ç: "c" };
    return String(name || "")
      .replace(/[ğüşıöçĞÜŞİÖÇ]/g, function (c) {
        return tr[c] || c;
      })
      .toLocaleLowerCase("tr")
      .replace(/ı/g, "i")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  window.eqBrandSlug = function (brandName) {
    var n = String(brandName || "").trim();
    if (!n) return "";
    var keys = Object.keys(EQ_BRAND_SLUG_ALIAS);
    for (var i = 0; i < keys.length; i++) {
      var slug = keys[i];
      if (EQ_BRAND_SLUG_ALIAS[slug] === n) return slug;
    }
    var low = n.toLocaleLowerCase("tr");
    for (var j = 0; j < keys.length; j++) {
      var s = keys[j];
      var lab = s.replace(/-/g, " ");
      if (low === lab || low.indexOf(lab) === 0) return s;
    }
    return brandSlugify(n);
  };

  window.eqBrandFromSlug = function (slug) {
    var s = String(slug || "")
      .trim()
      .toLowerCase()
      .replace(/^\/+|\/+$/g, "");
    if (!s) return "";
    if (EQ_BRAND_SLUG_ALIAS[s]) return EQ_BRAND_SLUG_ALIAS[s];
    return "";
  };

  window.eqParseBrandSlugFromPath = function () {
    try {
      var path = String(location.pathname || "");
      path = path.replace(/^\/en(?=\/|$)/i, "");
      var m = path.match(/\/shop\/marka\/([^/?#]+)/i);
      return m ? decodeURIComponent(m[1]).toLowerCase().replace(/^\/+|\/+$/g, "") : "";
    } catch (_) {
      return "";
    }
  };

  window.eqBrandFacetLabel = function (slugOrBrand) {
    var raw = String(slugOrBrand || "").trim();
    if (!raw) return "";
    var slug = raw;
    if (/\s/.test(raw) || /[ğüşıöçĞÜŞİÖÇ]/.test(raw)) slug = window.eqBrandSlug(raw);
    slug = String(slug || "")
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "");
    var t = EQ_BRAND_SHOP_TARGET[slug];
    if (t && t.facet) return t.facet;
    if (slug === "oztiryakiler" || slug === "atalay") {
      if (slug === "oztiryakiler") return "Öztiryakiler";
      if (slug === "atalay") return "Atalay";
    }
    return raw;
  };

  window.eqBrandPath = function (slugOrBrand) {
    var slug = String(slugOrBrand || "").trim();
    if (!slug) return withLang("/shop/marka", "shop");
    if (slug.indexOf("/") >= 0 || slug.indexOf("?") >= 0) return slug;
    if (/\s/.test(slug) || /[ğüşıöçĞÜŞİÖÇ]/.test(slug)) slug = window.eqBrandSlug(slug);
    slug = String(slug || "")
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "");
    var t = EQ_BRAND_SHOP_TARGET[slug];
    if (t && t.markaHub) return withLang("/shop/marka/" + encodeURIComponent(slug), "shop");
    if (t && t.dept && t.facet) {
      return withLang(
        "/shop/" + encodeURIComponent(t.dept) + "?marka=" + encodeURIComponent(t.facet),
        "shop"
      );
    }
    return withLang("/shop/marka/" + encodeURIComponent(slug), "shop");
  };

  window.eqBrandHref = function (slugOrBrand) {
    var path = window.eqBrandPath(slugOrBrand);
    if (isProd()) return ORIGIN + path;
    try {
      if (typeof location !== "undefined" && location.protocol === "file:") {
        var m = path.match(/\/shop\/marka\/([^/?#]+)/i);
        return m ? "marka.html?slug=" + encodeURIComponent(m[1]) : "marka.html";
      }
    } catch (_) {}
    return path;
  };

  /** Öztiryakiler marka vitrini — buzdolabı/buz makinesi aksesuarları (yanlış sınıflama) */
  window.eqOztiBrandHubExcludeRow = function (row) {
    if (!row) return false;
    var name = String(row.name || row.n || "");
    var kod = String(row.sku || row.urun_kodu || row.model || "")
      .replace(/\s+/g, "")
      .toUpperCase();
    if (/^8959\.BK/.test(kod)) return true;
    if (/servis\s*raf/i.test(name) && /^7897\.\d+30\./.test(kod)) return true;
    if (window.EqDeptTips) {
      if (typeof window.EqDeptTips.isOztiServisRafiProduct === "function" && window.EqDeptTips.isOztiServisRafiProduct(row)) {
        return true;
      }
      if (typeof window.EqDeptTips.isBuzKonteynerProduct === "function" && window.EqDeptTips.isBuzKonteynerProduct(row)) {
        return true;
      }
      if (typeof window.EqDeptTips.isSogukOdaProduct === "function" && window.EqDeptTips.isSogukOdaProduct(row)) {
        return true;
      }
    }
    return false;
  };

  window.eqBrandMatchesRow = function (row, brandCanonical, slug) {
    if (!row) return false;
    var b = String((row.brand || row.b) || "").trim();
    var oem = String(row.oem_brand || "").trim();
    slug = String(slug || "").toLowerCase().replace(/^\/+|\/+$/g, "");
    var t = EQ_BRAND_SHOP_TARGET[slug];
    var facet =
      (t && t.facet) ||
      (typeof window.eqBrandFacetLabel === "function" ? window.eqBrandFacetLabel(slug) : "") ||
      "";
    var facetLc = facet ? facet.toLocaleLowerCase("tr") : "";

    if (slug === "oztiryakiler" || (t && t.oztiOwnOnly)) {
      if (typeof window.eqOztiBrandHubExcludeRow === "function" && window.eqOztiBrandHubExcludeRow(row)) {
        return false;
      }
      if (!/öztiryakiler|oztiryakiler/i.test(b)) return false;
      if (!oem || oem === "Öztiryakiler") return true;
      return false;
    }

    if (facetLc) {
      if (oem && oem.toLocaleLowerCase("tr") === facetLc) return true;
      if (b && b.toLocaleLowerCase("tr") === facetLc) return true;
      if (b && b.toLocaleLowerCase("tr").indexOf(facetLc) === 0) return true;
      if (/öztiryakiler|oztiryakiler/i.test(b)) {
        var nUp = String(row.name || row.n || "").toLocaleUpperCase("tr");
        var facetUp = facet.toLocaleUpperCase("tr");
        if (nUp.indexOf(facetUp) >= 0) return true;
      }
    }

    if (brandCanonical && b === brandCanonical) return true;
    var low = b.toLocaleLowerCase("tr");
    if (slug === "atalay" && low.indexOf("atalay") >= 0) return true;
    if (slug && !brandCanonical && !facet) {
      var needle = slug.replace(/-/g, " ");
      return low.indexOf(needle) >= 0;
    }
    if (brandCanonical) {
      var canonLow = brandCanonical.toLocaleLowerCase("tr");
      return low.indexOf(canonLow) === 0 || canonLow.indexOf(low) === 0;
    }
    return false;
  };

  window.equstoPublicUrl = function (key) {
    var p = withLang(PATH[key] || "/", key);
    if (p === "/") return "equsto.com";
    return "equsto.com" + p;
  };
  window.equstoResolveNavHref = function (href) {
    if (!href || href === "#") return href;
    var raw = String(href);
    var parts = raw.split("#");
    var base = parts[0] || "";
    var hash = parts.length > 1 ? "#" + parts.slice(1).join("#") : "";
    if (typeof window.equstoUrl !== "function") return href;
    var qp = base.split("?");
    var filePart = qp[0] || "";
    var query = qp.length > 1 ? "?" + qp.slice(1).join("?") : "";
    var slash = filePart.lastIndexOf("/");
    var file = slash >= 0 ? filePart.slice(slash + 1) : filePart;
    if (file === "pfos.html") return window.equstoUrl("pfos") + query + hash;
    if (file === "index.html") return window.equstoUrl("home") + query + hash;
    if (file === "admin.html") return window.equstoUrl("admin") + query + hash;
    if (file === "bar.html" || file === "bar-design.html") return window.equstoUrl("besos") + query + hash;
    if (file === "contact.html" || file === "iletisim.html") return window.equstoUrl("contact") + query + hash;
    if (file === "sss.html") return window.equstoUrl("sss") + query + hash;
    if (file === "login.html") return window.equstoUrl("login") + query + hash;
    if (file === "sepet.html") return window.equstoUrl("cart") + query + hash;
    if (file === "pisirme.html") return window.equstoUrl("pisirme") + query + hash;
    if (file === "sogutma.html") return window.equstoUrl("sogutma") + query + hash;
    if (file === "market-reyonlari.html") return window.equstoUrl("marketReyon") + query + hash;
    if (file === "kahve.html") return window.equstoUrl("kahve") + query + hash;
    if (file === "yikama.html") return window.equstoUrl("yikama") + query + hash;
    if (file === "hazirlik.html") return window.equstoUrl("hazirlik") + query + hash;
    if (file === "icecek.html") return window.equstoUrl("icecek") + query + hash;
    if (file === "tezgah.html") return window.equstoUrl("tezgah") + query + hash;
    if (file === "dolap.html") return window.equstoUrl("dolap") + query + hash;
    if (file === "davlumbaz.html") return window.equstoUrl("davlumbaz") + query + hash;
    if (file === "tasima.html") return window.equstoUrl("tasima") + query + hash;
    if (file === "araba.html") return window.equstoUrl("araba") + query + hash;
    if (file === "istif.html") return window.equstoUrl("istif") + query + hash;
    if (file === "set-ustu-mutfak.html") return window.equstoUrl("set-ustu-mutfak") + query + hash;
    if (file === "kuvetler.html") return window.equstoUrl("kuvetler") + query + hash;
    if (file === "steakhouse-kurulumu.html") return "/steakhouse-kurulumu" + query + hash;
    if (file === "cafe-kurulumu.html") return "/cafe-kurulumu" + query + hash;
    if (file === "catering-mutfagi.html") return "/catering-mutfagi" + query + hash;
    if (file === "fast-food-kurulumu.html") return "/fast-food-kurulumu" + query + hash;
    if (file === "fine-dining-kurulumu.html") return "/fine-dining-kurulumu" + query + hash;
    if (file === "imt300.html") return "/besos/imt300" + query + hash;
    if (file === "marka.html" && query) {
      try {
        var sp = new URLSearchParams(query.replace(/^\?/, ""));
        var legacyB = sp.get("b") || sp.get("slug");
        if (legacyB && typeof window.eqBrandPath === "function") {
          return window.eqBrandPath(legacyB) + hash;
        }
      } catch (_) {}
    }
    if (file === "marka.html") return withLang("/shop/marka", "shop") + hash;
    if (/\/shop\/marka\/?$/i.test(filePart.replace(/\/+$/, "")) && query) {
      try {
        var sp2 = new URLSearchParams(query.replace(/^\?/, ""));
        var legacyB2 = sp2.get("b") || sp2.get("slug");
        if (legacyB2 && typeof window.eqBrandPath === "function") {
          return window.eqBrandPath(legacyB2) + hash;
        }
      } catch (_) {}
    }
    if (/\/shop\/marka\//i.test(filePart)) return filePart + query + hash;
    return href;
  };

  /**
   * Katalog görselleri (`ekipmanlar.json` images[]). `/shop/kahve` altında `./data/…` yanlış dizin;
   * yerel http(s): `/data/images/…`, file://: `./data/images/…`.
   * equsto.com canlı: görseller `public_html/data/images/` (tek encode); `/images/` yedek yalnızca yerel.
   */
  function decodeUriSeg(seg) {
    if (!seg) return "";
    var prev = seg;
    try {
      for (var i = 0; i < 3; i++) {
        var next = decodeURIComponent(prev);
        if (next === prev) break;
        prev = next;
      }
    } catch (_) {}
    return prev;
  }

  /** Dosya adını bir kez encode et; zaten %C3%B6… ise tekrar encode etme (%25 çift kodlama). */
  function encodeDataRelPath(rel) {
    return String(rel || "")
      .split("/")
      .map(function (seg) {
        return seg ? encodeURIComponent(decodeUriSeg(seg)) : "";
      })
      .join("/");
  }

  /** Faz B — NEXT_PUBLIC_ASSET_CDN_URL → eq-asset-cdn-config.js */
  var DEFAULT_ASSET_CDN = "https://dqb0g8etbedva.cloudfront.net";
  function assetCdnBase() {
    try {
      var b = String(window.__EQUSTO_ASSET_CDN || "").trim();
      if (b) return b.replace(/\/$/, "");
    } catch (_) {}
    return DEFAULT_ASSET_CDN;
  }

  function isCdnMigrateRel(rel) {
    var r = String(rel || "")
      .replace(/\\/g, "/")
      .replace(/^\.\//, "")
      .replace(/^\/+/, "");
    if (!r) return false;
    if (/^images\//i.test(r)) return true;
    if (/^data\/caglayan-market\//i.test(r)) return true;
    if (/^data\/prosogutma-market\//i.test(r)) return true;
    if (/^data\/vitrum-drawings\//i.test(r)) return true;
    if (/^data\/advanced-cuisine-clear-ice\/images\//i.test(r)) return true;
    if (/^data\/electrolux-professional\//i.test(r)) return true;
    return false;
  }

  function equstoCdnAssetHref(rel) {
    var base = assetCdnBase();
    if (!base) return "";
    var s = String(rel || "").replace(/\\/g, "/").replace(/^\.\//, "");
    if (!s || /^https?:\/\//i.test(s)) return s;
    if (s.charAt(0) === "/") s = s.slice(1);
    if (/^data\//i.test(s)) {
      if (!isCdnMigrateRel(s)) return "";
      return base + "/" + encodeDataRelPath(s);
    }
    if (/^images\//i.test(s)) {
      if (!isCdnMigrateRel(s)) return "";
      return base + "/" + encodeDataRelPath(s);
    }
    if (/^catalog\//i.test(s)) {
      s = "images/" + s;
      return base + "/" + encodeDataRelPath(s);
    }
    return "";
  }

  window.equstoCdnAssetHref = equstoCdnAssetHref;

  function isEqustoLiveHost() {
    try {
      var h = (location.hostname || "").toLowerCase();
      return h === "equsto.com" || h.slice(-12) === ".equsto.com";
    } catch (_) {
      return false;
    }
  }

  /**
   * Harici görsel istekleri: varsayılan kapalı.
   * - Canlı (equsto.com): kapalı (yalnızca sunucudaki/repodaki dosyalar).
   * - Yerel dev (localhost/127.0.0.1): açık.
   * İstenirse konsoldan: window.EQUSTO_ALLOW_REMOTE_IMAGES = true;
   */
  function allowRemoteImages() {
    try {
      if (typeof window !== "undefined" && window.EQUSTO_ALLOW_REMOTE_IMAGES === true) return true;
      var h = (location.hostname || "").toLowerCase();
      if (h === "localhost" || h === "127.0.0.1") return true;
    } catch (_) {}
    return false;
  }
  window.eqAllowRemoteImages = allowRemoteImages;

  /** `images/foo.jpg` katalog yolu → tarayıcı kökü (sonunda `/`). CDN varsa Blob kökü. */
  function catalogImagesWebRoot() {
    var cdn = assetCdnBase();
    if (cdn) return cdn + "/images/";
    try {
      if (typeof location !== "undefined" && (location.protocol === "http:" || location.protocol === "https:")) {
        return "/data/images/";
      }
    } catch (_) {}
    return "./data/images/";
  }

  window.equstoCatalogImagesWebRoot = catalogImagesWebRoot;

  /** ax-images yok — aynı ürün ailesi fotoğrafı (parça / adaptör). */
  var OZTI_AX_PROXY = {
    "2919.0B390.AD01.00": "7506.0B390.00",
    "7919.47NTV.C2": "7919.47NTV.24",
    "7919.46NTV.C2": "7919.47NTV.24",
    "7919.37NTV.C2": "7919.37NTV.24",
    "7919.36NTV.C2": "7919.36NTV.24",
    "7919.27NTV.C2": "7919.26NTV.24",
    "7919.26NTV.C2": "7919.26NTV.24",
    "7919.47NTV.C1": "7919.47NTV.24",
    "7919.46NTV.C1": "7919.47NTV.24",
    "7919.37NTV.C1": "7919.37NTV.24",
    "7919.36NTV.C1": "7919.36NTV.24",
    "7919.27NTV.C1": "7919.26NTV.24",
    "7919.26NTV.C1": "7919.26NTV.24",
    "7919.47NTV.T1": "7919.47NTV.24",
    "7919.37NTV.T1": "7919.37NTV.24",
    "9805.IM240D.NHC": "9805.IM240X.NHC",
    "9805.00IMD.00": "9805.IM45N.EHC",
    "7890.12901.51": "7890.12901.55"
  };

  function oztiResolveAxKod(k) {
    if (OZTI_AX_PROXY[k]) return OZTI_AX_PROXY[k];
    var m = k.match(/^7919\.(\d{2})NTV\.(C1|C2|T1)$/);
    if (!m) return k;
    if (m[2] === "T1" && m[1] === "27") return k;
    if (m[2] === "T1" && m[1] === "37") return "7919.37NTV.24";
    if (m[2] === "T1" && (m[1] === "47" || m[1] === "46")) return "7919.47NTV.24";
    if (parseInt(m[1], 10) >= 46) return "7919.47NTV.24";
    return "7919." + m[1] + "NTV.24";
  }

  /** Öztiryakiler ürün kodu → ax-images CDN (PLP/PDP yedek). */
  window.eqOztiAxImageFromSku = function (sku) {
    var k = oztiResolveAxKod(
      String(sku || "")
        .replace(/\s+/g, "")
        .toUpperCase()
    );
    if (!/^[0-9A-Z]{2,8}\.[A-Z0-9.\-]{2,}$/i.test(k)) return "";
    return (
      "https://oztiryakiler.com.tr/ax-images/images/" + encodeURIComponent(k) + ".jpg"
    );
  };

  /** `images/catalog/ozti/web/ozti-8574-cm080-00.jpg` sentetik yol (eqProductImgSrc → CDN). */
  window.eqOztiWebRelFromSku = function (sku) {
    var k = String(sku || "")
      .replace(/\s+/g, "")
      .toUpperCase();
    if (!/^[0-9A-Z]{2,8}\.[A-Z0-9.\-]{2,}$/i.test(k)) return "";
    var slug =
      "ozti-" +
      k
        .toLowerCase()
        .replace(/\./g, "-")
        .replace(/[^a-z0-9-]/g, "");
    return "images/catalog/ozti/web/" + slug + ".jpg";
  };

  /** `…/ozti-073m-00000-ad.jpg` → `073M.00000.AD` (cafemarkt / web / pdf sayfa). */
  function oztiKodFromCatalogRel(s) {
    var t = String(s || "")
      .trim()
      .replace(/\\/g, "/");
    var m = t.match(/\/ozti-([a-z0-9-]+)\.(?:jpe?g|png|webp)$/i);
    if (!m) return "";
    return m[1].replace(/-/g, ".").toUpperCase();
  }

  /** 8897.36/46/56*.P0 polipropilen istif — yanlış fırın görseli yerine doğru raf fotoğrafı. */
  function ozti8897WidthToIp4(width) {
    var w = Number(width);
    if (!isFinite(w) || w <= 0) return "21";
    var table = [
      [70, "11"],
      [80, "12"],
      [90, "13"],
      [100, "14"],
      [110, "15"],
      [120, "21"],
      [130, "22"],
      [141, "22"],
      [151, "24"],
      [161, "24"],
      [171, "24"],
    ];
    var best = table[0][1];
    var bestDiff = 1e9;
    for (var i = 0; i < table.length; i++) {
      var diff = Math.abs(table[i][0] - w);
      if (diff < bestDiff) {
        bestDiff = diff;
        best = table[i][1];
      }
    }
    return best;
  }

  function parse8897PolipropilenSku(kod) {
    var k = String(kod || "")
      .replace(/\s+/g, "")
      .toUpperCase();
    var m = k.match(/^8897\.(36|46|56)([0-9.]+)/);
    if (!m) return null;
    var rest = m[2].replace(/\.P0$/i, "").replace(/P$/i, "");
    var width = parseFloat(rest);
    if (!isFinite(width) || width <= 0) return null;
    return { depth: m[1], width: width };
  }

  function ozti8897PolipropilenFallbackRel(s) {
    var t = String(s || "")
      .trim()
      .replace(/\\/g, "/");
    if (!/8897-(36|46|56)/i.test(t)) return "";
    var kod = oztiKodFromCatalogRel(t);
    var parsed = parse8897PolipropilenSku(kod);
    if (!parsed) return "";
    var ip = ozti8897WidthToIp4(parsed.width);
    return "images/catalog/ozti/cafemarkt/ozti-8897-" + ip + "ip4-07.jpg";
  }

  /** Katalog yolu → oztiryakiler.com.tr ax-images (canlıda yerel dosya yokken). */
  function oztiAxFromCatalogRel(s) {
    var kod = oztiKodFromCatalogRel(s);
    if (!kod) return "";
    if (typeof window.eqOztiAxImageFromSku === "function") {
      var ax = window.eqOztiAxImageFromSku(kod);
      if (ax) return ax;
    }
    return (
      "https://oztiryakiler.com.tr/ax-images/images/" + encodeURIComponent(kod) + ".jpg"
    );
  }

  /** `images/catalog/ozti/web/ozti-8574-cm080-00.jpg` → ax-images (NTV proxy dahil). */
  function oztiAxImageFromWebPath(s) {
    var kod = oztiKodFromCatalogRel(s);
    if (!kod) return "";
    if (typeof window.eqOztiAxImageFromSku === "function") {
      return window.eqOztiAxImageFromSku(kod) || "";
    }
    return (
      "https://oztiryakiler.com.tr/ax-images/images/" +
      encodeURIComponent(oztiResolveAxKod(kod)) +
      ".jpg"
    );
  }

  var EQ_CATALOG_IMG_V = "20260613inoksan-istif-v2";

  function withCatalogImgV(url) {
    if (
      !url ||
      !/\/images\/catalog\/(?:ozti\/(?:web|cafemarkt)|atalay\/|inoksan\/(?:web\/|web\/istif-v2\/))/i.test(url)
    )
      return url;
    if (url.indexOf("v=" + EQ_CATALOG_IMG_V) >= 0) return url;
    return url + (url.indexOf("?") >= 0 ? "&" : "?") + "v=" + EQ_CATALOG_IMG_V;
  }

  /** Katalog görseli için denenecek URL sırası (canlı: önce ham UTF-8 dosya adı). */
  function catalogImageCandidates(dataRel) {
    var raw = String(dataRel || "")
      .replace(/\\/g, "/")
      .replace(/^\.\//, "")
      .trim();
    if (/^https?:\/\//i.test(raw)) {
      var abs = withCatalogImgV(raw);
      return abs ? [abs] : [];
    }
    if (!/^images\//i.test(raw)) raw = "images/" + raw.replace(/^\/+/, "");
    var rels = [];
    var pdfRel = /^images\/catalog\/ozti\/p\d+\//i.test(raw) ? raw : "";
    var webFromPdf = oztiPdfPageToWebRel(raw);
    if (webFromPdf) rels.push(webFromPdf);
    if (pdfRel) rels.push(pdfRel);
    if (!rels.length) rels.push(raw);

    var list = [];
    var seen = {};
    for (var ri = 0; ri < rels.length; ri++) {
      var file = String(rels[ri] || "")
        .replace(/\\/g, "/")
        .replace(/^\.\//, "")
        .replace(/^data\//i, "")
        .replace(/^images\//i, "");
      if (!file) continue;
      if (/^https?:\/\//i.test(file)) {
        var absFile = withCatalogImgV(file);
        if (absFile && !seen[absFile]) {
          seen[absFile] = 1;
          list.push(absFile);
        }
        continue;
      }
      if (isSogukOdaCatalogPath("images/" + file)) {
        [sogukOdaVitrinHref(), EQ_SOGUK_ODA_VITRIN_CDN].forEach(function (u) {
          if (u && !seen[u]) {
            seen[u] = 1;
            list.push(u);
          }
        });
        continue;
      }
      if (/^catalog\/portabianco\/cafemarkt\//i.test(file)) {
        var pbCm = portabiancoCafemarktWitCdn("images/" + file);
        if (pbCm && !seen[pbCm]) {
          seen[pbCm] = 1;
          list.unshift(pbCm);
        }
      }
      if (/^catalog\/yuksel\/yuksel-/i.test(file)) {
        var pbYw = portabiancoYukselRelToWit("images/" + file);
        if (pbYw && !seen[pbYw]) {
          seen[pbYw] = 1;
          list.unshift(pbYw);
        }
      }
      var chunk = [];
      var istifRel = ozti8897PolipropilenFallbackRel("images/" + file);
      if (istifRel) {
        file = istifRel.replace(/^images\//i, "");
      }
      var cdnFirst = equstoCdnAssetHref("images/" + file);
      if (cdnFirst) chunk.push(cdnFirst);
      if (isEqustoLiveHost() && /^catalog\/ozti\//i.test(file)) {
        var axLive = oztiAxFromCatalogRel("images/" + file);
        if (axLive) chunk.push(axLive);
      }
      if (/^catalog\/ozti\/web\//i.test(file)) {
        chunk.push("/images/" + file);
        chunk.push("/images/" + encodeDataRelPath(file));
        var ax = oztiAxImageFromWebPath("images/" + file);
        if (ax) chunk.push(ax);
      } else if (/^catalog\/ozti\/(?:cafemarkt|p\d+)\/ozti-/i.test(file)) {
        chunk.push("/images/" + file);
        chunk.push("/images/" + encodeDataRelPath(file));
        var axCm = oztiAxFromCatalogRel("images/" + file);
        if (axCm) chunk.push(axCm);
      }
      var root = catalogImagesWebRoot();
      if (/^catalog\//i.test(file)) {
        chunk.push("/images/" + file);
        chunk.push("/images/" + encodeDataRelPath(file));
        if (!isEqustoLiveHost()) {
          chunk.push(root + file);
          chunk.push(root + encodeDataRelPath(file));
        }
      } else {
        if (isEqustoLiveHost()) chunk.push(root + file);
        chunk.push(root + encodeDataRelPath(file));
        if (isEqustoLiveHost()) chunk.push("/images/" + encodeDataRelPath(file));
      }
      chunk.forEach(function (u) {
        u = withCatalogImgV(u);
        if (u && !seen[u]) {
          seen[u] = 1;
          list.push(u);
        }
      });
    }
    return list;
  }

  window.catalogImageCandidates = catalogImageCandidates;

  function hrefFromDataRel(dataRel) {
    var rel = String(dataRel || "")
      .replace(/\\/g, "/")
      .replace(/^\.\//, "")
      .replace(/^\/+/, "")
      .replace(/^data\//i, "");
    if (/^https?:\/\//i.test(rel)) return rel;
    if (/^images\//i.test(rel)) {
      var file = rel.replace(/^images\//i, "");
      var cands = catalogImageCandidates("images/" + file);
      if (cands.length) return cands[0];
      return catalogImagesWebRoot() + encodeDataRelPath(file);
    }
    var enc = encodeDataRelPath(rel);
    try {
      if (typeof location !== "undefined" && (location.protocol === "http:" || location.protocol === "https:")) {
        return "/data/" + enc;
      }
    } catch (_) {}
    try {
      var path = (location.pathname || "/").replace(/\/$/, "") || "/";
      if (path.indexOf("/en") === 0) path = path === "/en" ? "/" : path.slice(3) || "/";
      if (
        /^\/shop\/(pisirme|sogutma|kahve|yikama|hazirlik|icecek|tezgah|dolap|davlumbaz|tasima|araba|istif)\/[^/]+$/i.test(
          path
        )
      ) {
        return "/data/" + enc;
      }
    } catch (_) {}
    return "./data/" + enc;
  }

  window.equstoDataAssetHref = function (p) {
    if (p == null || p === "") return "";
    var s = String(p).replace(/\\/g, "/").replace(/^\.\//, "");
    if (/^https?:\/\//i.test(s)) return s;
    if (/^\/\//.test(s)) return "https:" + s;
    var cdnHit = equstoCdnAssetHref(s);
    if (cdnHit) return cdnHit;
    if (
      /^\/images\/(catalog|home)\//i.test(s) ||
      /^images\/(catalog|home)\//i.test(s)
    ) {
      return typeof window.eqAttrPath === "function" ? window.eqAttrPath(s) : s.charAt(0) === "/" ? s : "/" + s;
    }
    var dataRel = null;
    if (/^data\//i.test(s)) dataRel = s.replace(/^data\//i, "");
    else if (s.charAt(0) === "/" && /^\/data\//i.test(s)) dataRel = s.replace(/^\/data\//i, "");
    if (dataRel !== null) {
      return hrefFromDataRel(dataRel);
    }
    if (s.charAt(0) === "/") {
      var lead = s.slice(1);
      if (/^https?:\/\//i.test(lead)) return s.charAt(0) === "/" && s.charAt(1) === "/" ? "https:" + s : lead;
      if (/^(?:data\/)?images\//i.test(lead)) {
        var cdnLead = equstoCdnAssetHref(lead.replace(/^data\//i, ""));
        if (cdnLead) return cdnLead;
        return hrefFromDataRel(lead.replace(/^data\//i, ""));
      }
      if (/^data\//i.test(lead)) return hrefFromDataRel(lead.replace(/^data\//i, ""));
      return s;
    }
    return hrefFromDataRel(s.replace(/^data\//, ""));
  };

  /** href / src: `/shop/…` veya `/data/…` kökü varken başına `/` ekleme (`//shop` kırığı). */
  window.eqAttrPath = function (p) {
    if (p == null || p === "") return "";
    var s = String(p).trim();
    if (!s) return "";
    if (s === "#" || s.charAt(0) === "#") return s;
    if (/^https?:\/\//i.test(s)) return s;
    var cdnHit = equstoCdnAssetHref(s.charAt(0) === "/" ? s.slice(1) : s);
    if (cdnHit) return withCatalogImgV(cdnHit);
    if (s.charAt(0) === "/") return s;
    if (s.indexOf("./") === 0 || s.indexOf("../") === 0) return s;
    return "/" + s;
  };

  /** Soğuk oda panel ürünleri — tablo ekran görüntüsü / ax-images yerine vitrin fotoğrafı. */
  var EQ_SOGUK_ODA_VITRIN_REL = "images/catalog/soguk-oda/soguk-oda-vitrin.png";
  var EQ_SOGUK_ODA_VITRIN_CDN =
    "https://oztiryakiler.com.tr/ax-images/images/7919.DF1515.00.jpg";

  function isSogukOdaCatalogPath(s) {
    var t = String(s || "")
      .trim()
      .replace(/\\/g, "/");
    if (!t) return false;
    if (/^images\/catalog\/soguk-oda\/soguk-oda-vitrin\.png$/i.test(t)) return true;
    if (/^images\/catalog\/ozti\/(?:p\d+|web)\/ozti-7919-cr/i.test(t)) return true;
    return false;
  }

  function sogukOdaVitrinHref() {
    if (typeof window.eqAttrPath === "function") {
      return window.eqAttrPath(EQ_SOGUK_ODA_VITRIN_REL);
    }
    return "/" + EQ_SOGUK_ODA_VITRIN_REL;
  }

  window.eqSogukOdaVitrinHref = sogukOdaVitrinHref;

  /** PDF sayfa kırpımı (p199, p210…) → web slug; ax-images CDN ürün fotoğrafı döner. */
  function oztiPdfPageToWebRel(s) {
    var t = String(s || "")
      .trim()
      .replace(/\\/g, "/");
    var m = /^images\/catalog\/ozti\/p\d+\/(ozti-[a-z0-9-]+\.(?:jpe?g|png|webp))$/i.exec(t);
    if (!m) return "";
    return "images/catalog/ozti/web/" + m[1];
  }

  /** `public/images/` altındaki statik dosyalar — `/data/images/` köküne çevrilmez. */
  function isStaticPublicImage(s) {
    var t = String(s || "").trim().replace(/\\/g, "/");
    if (!t) return false;
    if (/^\/images\/(catalog|home|icons|brand|assets|imt300)\//i.test(t)) return true;
    if (/^images\/(catalog|home|icons|brand|assets|imt300)\//i.test(t)) return true;
    if (/^\/images\/[^/]+\.(jpe?g|png|webp|gif|svg)(\?|#|$)/i.test(t)) return true;
    return false;
  }

  /** Ürün / vitrin görseli — katalog `images/…`, `data/images/…`, `./data/images/…`. */
  function resolveVitrinImageMap(s) {
    if (!s || !window.__eqVitrinImageMap) return "";
    var key = String(s).trim();
    if (window.__eqVitrinImageMap[key]) return window.__eqVitrinImageMap[key];
    try {
      var dec = decodeURIComponent(key);
      if (window.__eqVitrinImageMap[dec]) return window.__eqVitrinImageMap[dec];
    } catch (_) {}
    return "";
  }

  /** Besos / PFOS plan PNG — public/data/vitrum-drawings → /data/vitrum-drawings/… */
  function vitrumDrawingsHref(s) {
    var t = String(s || "").trim().replace(/\\/g, "/");
    if (!/^vitrum-drawings\//i.test(t) && !/^data\/vitrum-drawings\//i.test(t)) return "";
    var rel = t.replace(/^\/?data\//i, "");
    if (typeof window.eqAttrPath === "function") {
      return window.eqAttrPath("/data/" + rel);
    }
    return "/data/" + rel;
  }

  /** cafemarkt yolu bilinen UNOX stub ise ax-images CDN kullan (canlı dahil). */
  function oztiAxFallbackFromRel(s) {
    var kod = oztiKodFromCatalogRel(s);
    if (!kod) return "";
    if (typeof window.eqOztiAxImageFromSku === "function") {
      var ax = window.eqOztiAxImageFromSku(kod);
      if (ax) return ax;
    }
    return (
      "https://oztiryakiler.com.tr/ax-images/images/" + encodeURIComponent(kod) + ".jpg"
    );
  }

  /** Robot Coupe PLP — yerel yol S3'te yok; witcdn dosya adı (-O.jpg büyük O). */
  function robotCoupeCafemarktWitCdn(s) {
    var t = String(s || "").trim().replace(/\\/g, "/");
    var m = t.match(/\/robot-coupe\/cafemarkt\/([^/?#]+)$/i);
    if (!m) return "";
    var fname = m[1].replace(/-o\.jpg$/i, "-O.jpg");
    return "https://witcdn.cafemarkt.com/" + fname;
  }

  /** Portabianco PLP — yerel yol CDN'de yoksa witcdn (Cafemarkt). */
  function portabiancoCafemarktWitCdn(s) {
    var t = String(s || "").trim().replace(/\\/g, "/");
    var m = t.match(/\/portabianco\/cafemarkt\/([^/?#]+)$/i);
    if (!m) return "";
    var fname = m[1]
      .replace(/-14--O\.jpg$/i, "-14-O.jpg")
      .replace(/-14--B\.jpg$/i, "-14-B.jpg")
      .replace(/-o\.jpg$/i, "-O.jpg")
      .replace(/-b\.jpg$/i, "-B.jpg");
    if (/-O\.jpg$/i.test(fname)) fname = fname.replace(/-O\.jpg$/i, "-B.jpg");
    return "https://witcdn.cafemarkt.com/" + fname;
  }

  /** Yüksel PDF yolu → Cafemarkt witcdn (SKU + aile eşleşmesi). */
  function portabiancoSkuFromYukselRel(s) {
    var m = String(s || "").match(/\/catalog\/yuksel\/yuksel-([a-z0-9-]+)_/i);
    return m ? m[1].toUpperCase() : "";
  }

  function portabiancoIsCoolingSku(sku) {
    return /^(TT|DT|PZA|SB|CA|BAR|ST|SLM|TTEV|CAM|ASB|MSB|SBB)/.test(String(sku || "").toUpperCase());
  }

  function portabiancoFallbackSkuList(sku) {
    var s = String(sku || "").trim().toUpperCase();
    var out = [];
    function add(x) {
      if (x && x !== s && out.indexOf(x) < 0) out.push(x);
    }
    if (/E$/.test(s) && !/-E$/.test(s)) add(s.replace(/E$/, "-E"));
    add(s.replace(/ND(\d)/g, "N$1"));
    add(s.replace(/ND(\d)/g, "D$1"));
    add(s.replace(/-1N/, "-2N"));
    add(s.replace(/-1D/, "-2D"));
    add(s.replace(/^DT-1F/, "DT-1N"));
    add(s.replace(/-EKOP$/i, "").replace(/-EKO$/i, ""));
    var ttNorm = s.replace(/^TT[KCGMRXTS]+-/, "TT-");
    add(ttNorm);
    add(ttNorm.replace(/-1N/, "-2N"));
    add(ttNorm.replace(/-1D/, "-2D"));
    add(s.replace(/^TT[KCGMRXTS]+-/, "TT-"));
    add(s.replace(/^ASBH/, "SBH"));
    add(s.replace(/^ASBHD/, "SBHD"));
    add(s.replace(/^ASBHG/, "SBHG"));
    add(s.replace(/^SBHDG/, "SBH"));
    add(s.replace(/^SBHD/, "SBH"));
    add(s.replace(/^ASBHDG/, "SBH"));
    add(s.replace(/^ASBHD/, "SBH"));
    add(s.replace(/^ASBHK/, "SBH"));
    add(s.replace(/^ASBHKG-3N7$/, "SBH-3N70"));
    add(s.replace(/^ASBHKG-3N7$/, "SBHKG-3N70"));
    add(s.replace(/^MSBH/, "SBH"));
    add(s.replace(/^MSBHG/, "SBHG"));
    add(s.replace(/^SBTM/, "SBM"));
    add(s.replace(/^SBTP/, "SBT"));
    add(s.replace(/^SBHK/, "SBH"));
    add(s.replace(/^SBHKG/, "SBH"));
    add(s.replace(/^CAM-/, "CA-"));
    add(s.replace(/^DTT-2/, "DTT-1"));
    add(s.replace(/^SBHG/, "SBH"));
    add(s.replace(/^ASBHG/, "SBH"));
    add(s.replace(/^MSBHG/, "SBH"));
    add(s.replace(/^ASBHKG/, "SBH"));
    if (/^SB[THM]G/.test(s)) add(s.replace(/^SB([THM])G/, "SB$1-"));
    if (/^DT\d+-/.test(s)) {
      add(s.replace(/^DT\d+-/, "DT-2").replace(/EKO.*$/i, ""));
      add("DT-2NGN");
    }
    var pzaDoor = s.match(/^PZA[DCK]?-(\d)[ND]/);
    if (pzaDoor) add("TT-" + pzaDoor[1] + "N70");
    if (/^PZA/.test(s)) {
      add("TT-4N70");
      add("TT-3N70");
      add("TT-2N70");
    }
    if (/^SLM/.test(s)) {
      add("DT-1NGN");
      add("DT-2NGN");
      add("TT-2N70");
    }
    if (/^BAR|^ST-/.test(s)) {
      add("1280");
      add("1280K");
    }
    return out;
  }

  function portabiancoWitFromSkuHay(skuHay, map) {
    if (!map || !skuHay) return "";
    var key = String(skuHay).replace(/-/g, "").toUpperCase();
    if (map[key]) return map[key];
    return "";
  }

  function portabiancoYukselRelToWit(s) {
    var map = typeof window !== "undefined" && window.EQ_PB_CM_WITCDN;
    if (!map) return "";
    var sku = portabiancoSkuFromYukselRel(s);
    if (!sku || !portabiancoIsCoolingSku(sku)) return "";
    var direct = portabiancoWitFromSkuHay(sku, map);
    if (direct) return direct;
    var fallbacks = portabiancoFallbackSkuList(sku);
    for (var i = 0; i < fallbacks.length; i++) {
      var hit = portabiancoWitFromSkuHay(fallbacks[i], map);
      if (hit) return hit;
    }
    return map.TT4N70 || map["251TT4N70"] || "";
  }

  window.eqProductImgSrc = function (p) {
    if (p == null || p === "") return "";
    var s = String(p).trim().replace(/\\/g, "/");
    if (!s) return "";
    if (/^images\/yuksel-/i.test(s)) {
      s = "images/catalog/yuksel/" + s.replace(/^images\//i, "");
    }
    var istifFb = ozti8897PolipropilenFallbackRel(s);
    if (istifFb) s = istifFb;
    if (/^https?:\/\//i.test(s)) return s;
    var rcWit = robotCoupeCafemarktWitCdn(s);
    if (rcWit) return rcWit;
    var pbWit = portabiancoCafemarktWitCdn(s);
    if (pbWit) return pbWit;
    var pbYukselWit = portabiancoYukselRelToWit(s);
    if (pbYukselWit) return pbYukselWit;
    if (/\/catalog\/yuksel\/yuksel-/i.test(s)) {
      var ySku = portabiancoSkuFromYukselRel(s);
      if (ySku && portabiancoIsCoolingSku(ySku)) return "";
    }
    if (/^images\/catalog\/ozti\/cafemarkt\//i.test(s)) {
      var axCafe = oztiAxFallbackFromRel(s);
      if (axCafe) return axCafe;
    }
    if (
      isStaticPublicImage(s) &&
      typeof window.eqAttrPath === "function"
    ) {
      return withCatalogImgV(window.eqAttrPath(s));
    }
    if (isEqustoLiveHost() && /catalog\/ozti\//i.test(s)) {
      if (allowRemoteImages()) {
        var axProd = oztiAxFromCatalogRel(s);
        if (axProd) return axProd;
      }
    }
    if (isSogukOdaCatalogPath(s)) return sogukOdaVitrinHref();
    var pdfWeb = oztiPdfPageToWebRel(s);
    if (pdfWeb) s = pdfWeb;
    if (
      /^images\/catalog\/ozti\/web\//i.test(s) &&
      isStaticPublicImage(s) &&
      typeof window.eqAttrPath === "function"
    ) {
      return withCatalogImgV(window.eqAttrPath(s));
    }
    var ozAx = allowRemoteImages() ? oztiAxImageFromWebPath(s) : "";
    if (ozAx) return ozAx;
    var vd = vitrumDrawingsHref(s);
    if (vd) return vd;
    if (/^prosogutma-market\//i.test(s) || /^caglayan-market\//i.test(s)) {
      var dataRel = "/data/" + s.replace(/^data\//i, "");
      if (typeof window.eqAttrPath === "function") return window.eqAttrPath(dataRel);
      return dataRel;
    }
    var mapped = resolveVitrinImageMap(s);
    if (mapped) return mapped;
    if (isStaticPublicImage(s) && typeof window.eqAttrPath === "function") {
      return window.eqAttrPath(s);
    }
    if (typeof window.equstoDataAssetHref === "function") {
      if (/^\/images\//i.test(s)) {
        return window.equstoDataAssetHref("images/" + s.replace(/^\/images\//i, ""));
      }
      if (
        /^\/?data\//i.test(s) ||
        /data\//i.test(s) ||
        /^images\//i.test(s) ||
        /^\/data\/images\//i.test(s)
      ) {
        return window.equstoDataAssetHref(s);
      }
    }
    return window.eqAttrPath(s);
  };

  /** CSS background-image için güvenli url(...) */
  window.eqCssBgUrl = function (p) {
    var src = window.eqProductImgSrc(p);
    if (!src) return "";
    return 'url("' + String(src).replace(/"/g, "%22") + '")';
  };

  /** Çift %25 encode, eksik /data/images/ öneki, ham Unicode src düzeltmesi */
  window.healCatalogImageSrc = function (src) {
    if (src == null || src === "") return "";
    var s = String(src).trim();
    if (!s) return "";
    if (/^https?:\/\//i.test(s)) return s;
    if (/%25[0-9A-F]{2}/i.test(s) && typeof window.eqProductImgSrc === "function") {
      var healed = window.eqProductImgSrc(s);
      if (healed) return healed;
    }
    if (!/^\//.test(s) && !/^\.{0,2}\//.test(s)) {
      if (/^images\//i.test(s) && typeof window.equstoDataAssetHref === "function") {
        return window.equstoDataAssetHref(s);
      }
      if (/\.(jpe?g|png|webp|gif|svg)(\?|#|$)/i.test(s) && typeof window.equstoDataAssetHref === "function") {
        return window.equstoDataAssetHref("images/" + s.replace(/^\/+/, ""));
      }
    }
    if (typeof window.eqProductImgSrc === "function") {
      var fixed = window.eqProductImgSrc(s);
      if (fixed && fixed !== s) return fixed;
    }
    return s;
  };

  /** Sayfadaki ham /data/images src ve inline bg — encode edilmiş hale getir */
  window.eqFixDataImagesInDom = function (root) {
    var scope = root && root.querySelectorAll ? root : document;
    try {
      scope.querySelectorAll("img[src]").forEach(function (img) {
        var raw = img.getAttribute("src") || "";
        if (!raw || /^https?:\/\//i.test(raw) || /^data:/i.test(raw)) return;
        var needsFix =
          /%25[0-9A-F]{2}/i.test(raw) ||
          /\/data\/images\//i.test(raw) ||
          (!/^\//.test(raw) && /\.(jpe?g|png|webp|gif|svg)(\?|#|$)/i.test(raw));
        if (needsFix && isStaticPublicImage(raw)) needsFix = false;
        if (needsFix && /\/catalog\/yuksel\//i.test(raw)) needsFix = false;
        if (!needsFix) return;
        var fixed =
          typeof window.healCatalogImageSrc === "function"
            ? window.healCatalogImageSrc(raw)
            : window.eqProductImgSrc
              ? window.eqProductImgSrc(raw)
              : raw;
        if (fixed && fixed !== raw) img.setAttribute("src", fixed);
      });
    } catch (_) {}
    try {
      scope.querySelectorAll(".eq-mx-hero__slide[style], .eq-bb-prod[src]").forEach(function (el) {
        var st = el.getAttribute("style") || "";
        var m = /background-image:\s*url\((['"]?)([^'")]+)\1\)/i.exec(st);
        if (m && m[2] && window.eqCssBgUrl) {
          var bg = window.eqCssBgUrl(m[2]);
          if (bg) el.style.backgroundImage = bg;
        }
        if (el.tagName === "IMG" && el.getAttribute("src") && window.eqProductImgSrc) {
          var s2 = el.getAttribute("src");
          var f2 = window.eqProductImgSrc(s2);
          if (f2 && f2 !== s2) el.setAttribute("src", f2);
        }
      });
    } catch (_) {}
  };

  /** Kırık görsel — alternatif URL dene, sonra «Görsel» yer tutucu. */
  window.__eqImgFail = function (img) {
    if (!img || !img.parentNode) return;
    var src = img.getAttribute("src") || "";
    var raw = img.getAttribute("data-eq-img-raw") || "";
    var step = parseInt(img.getAttribute("data-eq-img-step") || "0", 10);
    if (
      (isSogukOdaCatalogPath(raw) || /7919\.CR/i.test(img.getAttribute("data-eq-ozti-kod") || "")) &&
      !img.dataset.eqSogukOdaVitrin
    ) {
      img.dataset.eqSogukOdaVitrin = "1";
      img.onerror = function () {
        window.__eqImgFail(img);
      };
      img.src = sogukOdaVitrinHref();
      return;
    }
    if (
      isSogukOdaCatalogPath(raw) &&
      img.dataset.eqSogukOdaVitrin === "1" &&
      !img.dataset.eqSogukOdaCdn
    ) {
      img.dataset.eqSogukOdaCdn = "1";
      img.onerror = function () {
        window.__eqImgFail(img);
      };
      img.src = EQ_SOGUK_ODA_VITRIN_CDN;
      return;
    }
    if (raw && typeof catalogImageCandidates === "function") {
      var tries = catalogImageCandidates(raw);
      while (step < tries.length) {
        var next = tries[step];
        step += 1;
        img.setAttribute("data-eq-img-step", String(step));
        if (next && next !== src) {
          img.onerror = function () {
            window.__eqImgFail(img);
          };
          img.src = next;
          return;
        }
      }
    }
    var pimakGorsel = img.getAttribute("data-eq-pimak-gorsel") || "";
    if (pimakGorsel && !img.dataset.eqPimakRemote) {
      img.dataset.eqPimakRemote = "1";
      img.onerror = function () {
        window.__eqImgFail(img);
      };
      img.src = pimakGorsel;
      return;
    }
    var oztiKod = img.getAttribute("data-eq-ozti-kod") || "";
    if (oztiKod && !/7919\.CR/i.test(oztiKod) && typeof window.eqOztiAxImageFromSku === "function") {
      var axTry = window.eqOztiAxImageFromSku(oztiKod);
      if (axTry && axTry !== src && !img.dataset.eqImgAxTried) {
        img.dataset.eqImgAxTried = "1";
        img.onerror = function () {
          window.__eqImgFail(img);
        };
        img.src = axTry;
        return;
      }
    }
    if (!img.dataset.eqImgAltPath) {
      img.dataset.eqImgAltPath = "1";
      var healed =
        typeof window.healCatalogImageSrc === "function" ? window.healCatalogImageSrc(src) : src;
      if (healed && healed !== src) {
        img.onerror = function () {
          window.__eqImgFail(img);
        };
        img.src = healed;
        return;
      }
      if (!isEqustoLiveHost() && /\/data\/images\//i.test(src)) {
        img.onerror = function () {
          window.__eqImgFail(img);
        };
        img.src = src.replace(/\/data\/images\//i, "/images/");
        return;
      }
    }
    img.onerror = null;
    var ring = img.closest(
      ".eq-mx-story__ring, .prod-img, .eq-mx-spot-card__img, .eq-mx-hero__thumb, .eq-dept-plp-card__img"
    );
    var em = img.getAttribute("data-eq-emoji") || img.getAttribute("alt") || "";
    if (ring && ring.classList.contains("eq-mx-story__ring")) {
      var span = document.createElement("span");
      span.className = "eq-mx-story__ring-in";
      span.setAttribute("aria-hidden", "true");
      span.textContent = em || "•";
      img.replaceWith(span);
      return;
    }
    if (
      ring &&
      (ring.classList.contains("prod-img") ||
        ring.classList.contains("eq-mx-spot-card__img") ||
        ring.classList.contains("eq-dept-plp-card__img"))
    ) {
      img.style.display = "none";
      if (!ring.querySelector(".eq-img-ph")) {
        var ph = document.createElement("span");
        ph.className = "eq-img-ph";
        ph.textContent = "Görsel";
        ring.appendChild(ph);
      }
      return;
    }
    if (ring && ring.classList.contains("eq-mx-hero__thumb")) {
      img.style.display = "none";
      return;
    }
    if (img.closest(".eq-srch-panel__item")) {
      var phSrch = document.createElement("span");
      phSrch.className = "eq-srch-panel__thumb eq-srch-panel__thumb--ph";
      phSrch.setAttribute("aria-hidden", "true");
      img.replaceWith(phSrch);
      return;
    }
    var popVisual = img.closest(".eq-mx-pop-cat__visual, .eq-mx-pop-cat__img");
    if (popVisual) {
      img.style.display = "none";
      var popCard = img.closest(".eq-mx-pop-cat");
      if (!popVisual.querySelector(".eq-mx-pop-cat__ph")) {
        var popPh = document.createElement("span");
        popPh.className = "eq-mx-pop-cat__ph";
        popPh.setAttribute("aria-hidden", "true");
        popPh.textContent =
          (popCard && popCard.getAttribute("data-pop-emoji")) || em || "•";
        popVisual.appendChild(popPh);
      }
      if (popCard) popCard.classList.remove("eq-mx-pop-cat--photo");
      return;
    }
    img.style.display = "none";
  };

  function afterVitrinMapReady(fn) {
    if (window.__eqVitrinImageMap) {
      fn();
      return;
    }
    fetch("/data/vitrin-image-map.json", { credentials: "same-origin" })
      .then(function (r) {
        return r.ok ? r.json() : {};
      })
      .then(function (m) {
        window.__eqVitrinImageMap = m && typeof m === "object" ? m : {};
        fn();
      })
      .catch(function () {
        window.__eqVitrinImageMap = window.__eqVitrinImageMap || {};
        fn();
      });
  }

  document.addEventListener("DOMContentLoaded", function () {
    afterVitrinMapReady(function () {
      if (typeof window.eqFixDataImagesInDom === "function") window.eqFixDataImagesInDom(document);
    });
    document.querySelectorAll('a.logo[href="index.html"], a.logo[href="/index.html"]').forEach(function (a) {
      a.href = window.equstoUrl("home");
    });
    document.querySelectorAll('a[href="admin.html"], a[href^="admin.html#"]').forEach(function (a) {
      var raw = a.getAttribute("href") || "admin.html";
      var hp = String(raw).split("#");
      var h = hp.length > 1 ? "#" + hp.slice(1).join("#") : "";
      a.href = window.equstoUrl("admin") + h;
    });
    document.querySelectorAll("a[href]").forEach(function (a) {
      var h = a.getAttribute("href");
      if (!h || h.charAt(0) === "#") return;
      if (h.indexOf("//") === 0) return;
      if (/^[a-z][a-z0-9+.-]*:/i.test(h)) return;
      var resolved = window.equstoResolveNavHref(h);
      if (resolved !== h) a.href = resolved;
    });
  });
})();
