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
    login: "/login.html",
    cart: "/sepet.html",
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
    contact: "contact.html",
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
  /** PLP + product.html — canlı linklerle uyumlu (tr-TR küçük harf, Türkçe harfler düşer). */
  window.eqProductSlug = function (row) {
    if (!row) return "";
    var id = String(row.id || "").trim();
    if (id) return id.toLowerCase();
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
    if (file === "index.html") return window.equstoUrl("home") + query + hash;
    if (file === "admin.html") return window.equstoUrl("admin") + query + hash;
    if (file === "bar.html" || file === "bar-design.html") return window.equstoUrl("besos") + query + hash;
    if (file === "contact.html") return window.equstoUrl("contact") + query + hash;
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

  /** Öztiryakiler ürün kodu → ax-images CDN (PLP/PDP yedek). */
  window.eqOztiAxImageFromSku = function (sku) {
    var k = String(sku || "")
      .replace(/\s+/g, "")
      .toUpperCase();
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

  /** `images/catalog/ozti/web/ozti-8574-cm080-00.jpg` → Öztiryakiler ax-images CDN. */
  function oztiAxImageFromWebPath(s) {
    var t = String(s || "")
      .trim()
      .replace(/\\/g, "/");
    var m = /^images\/catalog\/ozti\/web\/ozti-([a-z0-9-]+)\.(jpe?g|png|webp)$/i.exec(t);
    if (!m) return "";
    var parts = m[1].split("-").filter(Boolean);
    if (parts.length < 2) return "";
    var kod = parts
      .map(function (p) {
        return p.toUpperCase();
      })
      .join(".");
    return (
      "https://oztiryakiler.com.tr/ax-images/images/" + encodeURIComponent(kod) + ".jpg"
    );
  }

  var EQ_CATALOG_IMG_V = "20260525p99fallback";

  function withCatalogImgV(url) {
    if (!url || !/\/images\/catalog\/(?:ozti\/(?:web|cafemarkt)|atalay\/)/i.test(url)) return url;
    return url + (url.indexOf("?") >= 0 ? "&" : "?") + "v=" + EQ_CATALOG_IMG_V;
  }

  /** Katalog görseli için denenecek URL sırası (canlı: önce ham UTF-8 dosya adı). */
  function catalogImageCandidates(dataRel) {
    var raw = String(dataRel || "")
      .replace(/\\/g, "/")
      .replace(/^\.\//, "")
      .trim();
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
      if (isSogukOdaCatalogPath("images/" + file)) {
        [sogukOdaVitrinHref(), EQ_SOGUK_ODA_VITRIN_CDN].forEach(function (u) {
          if (u && !seen[u]) {
            seen[u] = 1;
            list.push(u);
          }
        });
        continue;
      }
      var chunk = [];
      if (/^catalog\/ozti\/web\//i.test(file)) {
        chunk.push("/images/" + file);
        chunk.push("/images/" + encodeDataRelPath(file));
        var ax = oztiAxImageFromWebPath("images/" + file);
        if (ax) chunk.push(ax);
      } else if (/^catalog\/ozti\/p\d+\/ozti-/i.test(file) && typeof window.eqOztiAxImageFromSku === "function") {
        var slugM = file.match(/ozti-([0-9]{4})-([0-9][0-9a-z-]+(?:-[0-9]{2})?)\./i);
        if (slugM) {
          var kodGuess = slugM[1] + "." + slugM[2].replace(/-/g, ".");
          var axK = window.eqOztiAxImageFromSku(kodGuess);
          if (axK) chunk.push(axK);
        }
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
    if (/^images\//i.test(dataRel)) {
      var file = dataRel.replace(/^images\//i, "");
      var cands = catalogImageCandidates("images/" + file);
      if (cands.length) return cands[0];
      return catalogImagesWebRoot() + encodeDataRelPath(file);
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
    if (/^\/\//.test(s)) return "https:" + s;
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

  window.eqProductImgSrc = function (p) {
    if (p == null || p === "") return "";
    var s = String(p).trim().replace(/\\/g, "/");
    if (!s) return "";
    if (/^https?:\/\//i.test(s)) return s;
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
    var ozAx = oztiAxImageFromWebPath(s);
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
    var oztiKod = img.getAttribute("data-eq-ozti-kod") || "";
    if (
      oztiKod &&
      !/7919\.CR/i.test(oztiKod) &&
      typeof window.eqOztiAxImageFromSku === "function"
    ) {
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
