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
    contact: "/contact",
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
  };
  /** file:// açılışında kullanılacak gerçek dosya adları */
  var FILE_FALLBACK = {
    home: "index.html",
    shop: "index.html",
    pfos: "pfos.html",
    admin: "admin.html",
    yerSofrasi: "index.html",
    besos: "bar-design.html",
    contact: "contact.html",
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
  };
  var LANG_NEUTRAL = { admin: true };

  /** Katalog `category` alanı → vitrin URL segmenti (PATH anahtarı ile aynı). product.html deptLink ile uyumlu. */
  window.eqCategoryToUrunlerSeg = function (cat) {
    var c = String(cat || "").toLowerCase();
    if (c === "sogutma-ekipmanlari") return "sogutma";
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
    if (c === "bulasik-makineleri") return "yikama";
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
    var sl = String(slug || "").replace(/^\/+/, "");
    var base = "/shop/" + d + "/" + sl;
    if (curLang() !== "en") return base;
    return "/en" + base;
  };
  /** PLP + product.html — canlı linklerle uyumlu (tr-TR küçük harf, Türkçe harfler düşer). */
  window.eqProductSlug = function (row) {
    if (!row) return "";
    function slugify(s) {
      return String(s || "")
        .toLocaleLowerCase("tr")
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
    if (file === "index.html") return window.equstoUrl("shop") + query + hash;
    if (file === "admin.html") return window.equstoUrl("admin") + query + hash;
    if (file === "bar.html" || file === "bar-design.html") return window.equstoUrl("besos") + query + hash;
    if (file === "contact.html") return window.equstoUrl("contact") + query + hash;
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
    return href;
  };

  /**
   * Katalog görselleri (`ekipmanlar.json` images[]). `/shop/kahve` altında `./data/…` yanlış dizin;
   * yerel http(s): `/data/images/…`, file://: `./data/images/…`.
   * equsto.com canlı: ürün fotoğrafları `public_html/images/` (eski paket); `/data/images/` çoğu 404.
   */
  function encodeDataRelPath(rel) {
    return String(rel || "")
      .split("/")
      .map(function (seg) {
        return seg ? encodeURIComponent(seg) : "";
      })
      .join("/");
  }

  function isEqustoLiveHost() {
    try {
      var h = (location.hostname || "").toLowerCase();
      return h === "equsto.com" || h.slice(-12) === ".equsto.com";
    } catch (_) {
      return false;
    }
  }

  /** `images/foo.jpg` katalog yolu → tarayıcı kökü (sonunda `/`). Canlıda önce deploy hedefi `/data/images/`; __eqImgFail `/images/` dener. */
  function catalogImagesWebRoot() {
    try {
      if (typeof location !== "undefined" && (location.protocol === "http:" || location.protocol === "https:")) {
        return "/data/images/";
      }
    } catch (_) {}
    return "./data/images/";
  }

  window.equstoCatalogImagesWebRoot = catalogImagesWebRoot;

  function hrefFromDataRel(dataRel) {
    if (/^images\//i.test(dataRel)) {
      return catalogImagesWebRoot() + encodeDataRelPath(dataRel.replace(/^images\//i, ""));
    }
    var enc = encodeDataRelPath(dataRel);
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
    var dataRel = null;
    if (/^data\//i.test(s)) dataRel = s.replace(/^data\//i, "");
    else if (s.charAt(0) === "/" && /^\/data\//i.test(s)) dataRel = s.replace(/^\/data\//i, "");
    if (dataRel !== null) {
      return hrefFromDataRel(dataRel);
    }
    if (s.charAt(0) === "/") return s;
    return hrefFromDataRel(s.replace(/^data\//, ""));
  };

  /** href / src: `/shop/…` veya `/data/…` kökü varken başına `/` ekleme (`//shop` kırığı). */
  window.eqAttrPath = function (p) {
    if (p == null || p === "") return "";
    var s = String(p).trim();
    if (!s) return "";
    if (s === "#" || s.charAt(0) === "#") return s;
    if (/^https?:\/\//i.test(s)) return s;
    if (s.charAt(0) === "/") return s;
    if (s.indexOf("./") === 0 || s.indexOf("../") === 0) return s;
    return "/" + s;
  };

  /** Ürün / vitrin görseli — `data/images` için kök `/data/…` (Türkçe dosya adı encode). */
  window.eqProductImgSrc = function (p) {
    if (p == null || p === "") return "";
    var s = String(p).trim();
    if (!s) return "";
    if (/^https?:\/\//i.test(s)) return s;
    if ((/^\/?data\//i.test(s) || /data\//i.test(s)) && typeof window.equstoDataAssetHref === "function") {
      return window.equstoDataAssetHref(s);
    }
    return window.eqAttrPath(s);
  };

  /** CSS background-image için güvenli url(...) */
  window.eqCssBgUrl = function (p) {
    var src = window.eqProductImgSrc(p);
    if (!src) return "";
    return 'url("' + String(src).replace(/"/g, "%22") + '")';
  };

  /** Sayfadaki ham /data/images src ve inline bg — encode edilmiş hale getir */
  window.eqFixDataImagesInDom = function (root) {
    var scope = root && root.querySelectorAll ? root : document;
    try {
      scope.querySelectorAll('img[src*="/data/images/"]').forEach(function (img) {
        var raw = img.getAttribute("src") || "";
        if (!raw || !window.eqProductImgSrc) return;
        var fixed = window.eqProductImgSrc(raw);
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

  /** Kırık görsel — story halkası veya ürün kutusu yer tutucu. */
  window.__eqImgFail = function (img) {
    if (!img || !img.parentNode) return;
    var src = img.getAttribute("src") || "";
    if (!img.dataset.eqImgAltPath && /\/(?:data\/)?images\//i.test(src)) {
      img.dataset.eqImgAltPath = "1";
      img.onerror = null;
      if (/\/data\/images\//i.test(src)) {
        img.src = src.replace(/\/data\/images\//i, "/images/");
      } else if (/\/images\//i.test(src)) {
        img.src = src.replace(/\/images\//i, "/data/images/");
      }
      return;
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
    img.style.display = "none";
  };

  document.addEventListener("DOMContentLoaded", function () {
    if (typeof window.eqFixDataImagesInDom === "function") window.eqFixDataImagesInDom(document);
    document.querySelectorAll('a.logo[href="index.html"]').forEach(function (a) {
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
