/**
 * ═══════════════════════════════════════════════════════════════════════════
 * KİLİT: E-PDP ürün detay (PDP). renderProduct → renderEpdpProduct.
 * Değiştirmeden önce kullanıcıdan açık onay alın. Ayrıntı: public/pdp-epdp-KILIT.txt
 * Cursor: .cursor/rules/pdp-epdp-kilit.mdc
 * ═══════════════════════════════════════════════════════════════════════════
 */
window.searchFilter = window.searchFilter || function () {};

    function __pdpT(k, fb, vars) {
      try {
        if (typeof window.eqT === "function") {
          var v = window.eqT(k, null);
          if (v != null && v !== k) {
            if (vars) {
              Object.keys(vars).forEach(function (key) {
                v = String(v).replace(new RegExp("\\{" + key + "\\}", "g"), String(vars[key]));
              });
            }
            return v;
          }
        }
      } catch (_) {}
      if (vars && fb) {
        var out = String(fb);
        Object.keys(vars).forEach(function (key) {
          out = out.replace(new RegExp("\\{" + key + "\\}", "g"), String(vars[key]));
        });
        return out;
      }
      return fb;
    }

    function __navDeptKey(seg) {
      var d = String(seg || "").trim();
      if (d === "market-reyonlari") return "market_reyon";
      if (d === "set-ustu-mutfak") return "set_ustu";
      return d.replace(/-/g, "_");
    }

    function __navDeptLabel(seg, fb) {
      return __pdpT("nav." + __navDeptKey(seg), fb || seg);
    }

    function eqShopHref() {
      return typeof window.equstoUrl === "function" ? window.equstoUrl("shop") : "index.html";
    }

    function normImgPath(p) {
      if (typeof window.equstoDataAssetHref === "function") {
        try {
          return window.equstoDataAssetHref(p);
        } catch (_) {}
      }
      var s = String(p).replace(/\\/g, "/").replace(/^\.\//, "").replace(/^data\//, "");
      return s ? "/data/" + s : "";
    }

    /**
     * href / src: Zaten `/shop/…`, `/data/…`, `https://…` veya `#` ise başına `/` ekleme
     * (`//data/…` protokol-relative URL hatasını önler).
     */
    function eqHtmlUrl(u) {
      if (u == null || u === "") return "";
      var s = String(u).trim();
      if (!s) return "";
      if (s === "#" || s.charAt(0) === "#") return s;
      if (/^https?:\/\//i.test(s)) return s;
      if (s.charAt(0) === "/") return s;
      if (s.indexOf("./") === 0 || s.indexOf("../") === 0) return s;
      return "/" + s;
    }

    /** OG / JSON-LD: katalog göreli yol → tam http(s) URL */
    function eqAbsoluteAssetUrl(raw) {
      if (!raw) return "";
      var p = normImgPath(raw);
      if (!p) return "";
      if (/^https?:\/\//i.test(p)) return p;
      var origin = "https://equsto.com";
      try {
        if (typeof location !== "undefined" && location.origin) origin = location.origin;
      } catch (_) {}
      var path = p.charAt(0) === "/" ? p : "/" + p.replace(/^\.\//, "");
      return origin + path;
    }

    /** Aynı görselin tekrarını ele: önce normalize, sonra Set ile benzersiz. */
    function uniqueImgs(arr) {
      var seen = Object.create(null);
      var out = [];
      (arr || []).forEach(function (raw) {
        var s = normImgPath(raw);
        if (!s) return;
        var key = s.toLowerCase();
        if (seen[key]) return;
        seen[key] = 1;
        out.push(s);
      });
      return out;
    }

    function formatTlBuybox(n) {
      var v = Math.round(Number(n));
      if (!(v > 0)) return "";
      try {
        return v.toLocaleString("tr-TR", { maximumFractionDigits: 0 });
      } catch (_) {
        return String(v);
      }
    }

    function extractCartPrice(raw, item) {
      if (item && Number(item.fiyat_tl) > 0) {
        return Math.round(Number(item.fiyat_tl)).toLocaleString("tr-TR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
      }
      if (!raw) return "";
      var s = String(raw).split("\n")[0] || String(raw);
      if (/€/.test(s)) return "";
      return s
        .replace(/₺/g, "")
        .replace(/\+?\s*KDV.*/gi, "")
        .replace(/KDV\s*dahil/gi, "")
        .trim();
    }

    function parsePriceTlNumber(raw, item) {
      if (item && Number(item.fiyat_tl) > 0) return Math.round(Number(item.fiyat_tl) * 100) / 100;
      var s = String(raw || "").split("\n")[0] || "";
      if (!s || /€/.test(s)) return 0;
      var cleaned = s
        .replace(/₺/g, "")
        .replace(/\+?\s*KDV.*/gi, "")
        .replace(/KDV\s*dahil/gi, "")
        .trim()
        .replace(/\./g, "")
        .replace(",", ".");
      var n3 = parseFloat(cleaned);
      return Number.isFinite(n3) && n3 > 0 ? Math.round(n3 * 100) / 100 : 0;
    }

    function buyboxPriceParts(x) {
      var quoteOnly = !!(x && x.fiyat_bekleniyor) || /teklif\s+için/i.test(String((x && x.price) || ""));
      if (quoteOnly) return { quoteOnly: true };
      var n = parsePriceTlNumber(x && x.price, x);
      if (!(n > 0) && window.EqustoKurLive && typeof window.EqustoKurLive.computeRowPrices === "function") {
        var rate = window.EqustoKurLive.getRate && window.EqustoKurLive.getRate();
        if (rate) {
          var px = window.EqustoKurLive.computeRowPrices(x, rate);
          if (px && px.fiyat_tl > 0) n = Math.round(Number(px.fiyat_tl) * 100) / 100;
        }
      }
      if (!(n > 0)) return { empty: true };
      var formatted = n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      var ix = formatted.lastIndexOf(",");
      if (ix < 0) return { int: formatted, frac: "" };
      return { int: formatted.slice(0, ix), frac: formatted.slice(ix + 1) };
    }

    function oztiWebRelFromSku(sku) {
      var k = String(sku || "")
        .replace(/\s+/g, "")
        .toUpperCase();
      if (!/^[0-9]{2,4}[A-Z0-9]*\.[A-Z0-9.\-]{2,}$/i.test(k)) return "";
      var slug =
        "ozti-" +
        k
          .toLowerCase()
          .replace(/\./g, "-")
          .replace(/[^a-z0-9-]/g, "");
      return "images/catalog/ozti/web/" + slug + ".jpg";
    }

    function resolveProductImgSrc(rel) {
      if (!rel) return "";
      if (typeof window.eqProductImgSrc === "function") {
        try {
          var via = window.eqProductImgSrc(rel);
          if (via) return via;
        } catch (_) {}
      }
      if (typeof window.equstoDataAssetHref === "function") {
        try {
          return window.equstoDataAssetHref(rel);
        } catch (_) {}
      }
      return eqHtmlUrl(normImgPath(rel));
    }

    var MARKET_REYON_GALLERY_MAX = 11;

    function imgFileName(relOrUrl) {
      return String(relOrUrl || "")
        .split("?")[0]
        .split("/")
        .pop()
        .toLowerCase();
    }

    function isCaglayanRefrigeration(x) {
      if (!x) return false;
      if (/^caglayan-/.test(String(x.category || ""))) return true;
      if (/^proso-/.test(String(x.category || ""))) return true;
      return (
        isMarketReyonProduct(x) &&
        /^(caglayan-refrigeration|prosogutma)$/.test(String((x && x.kaynak) || ""))
      );
    }

    /** Çağlayan PDP sol şerit — ürün fotoğrafları (kesit/ölçü ayrı eklenir). */
    var CAGLAYAN_PDP_THUMB_MAX = 9;

    function isCaglayanPdpThumbImg(relOrUrl) {
      var fn = imgFileName(relOrUrl);
      if (!fn) return false;
      if (/kesit/i.test(fn)) return false;
      if (/kapak/i.test(fn)) return false;
      if (/[-_]model-\d+\.(jpe?g|webp|png|gif)$/i.test(fn)) return false;
      if (/\d{3,4}.*[-_]model-\d/i.test(fn)) return false;
      return true;
    }

    function isCaglayanModelDrawImg(relOrUrl) {
      var fn = imgFileName(relOrUrl);
      if (!fn) return false;
      if (/[-_]model-\d+\.(jpe?g|webp|png|gif)$/i.test(fn)) return true;
      if (/\d{3,4}.*[-_]model-\d/i.test(fn)) return true;
      return false;
    }

    function isCaglayanKesitImg(relOrUrl) {
      return /kesit/i.test(imgFileName(relOrUrl));
    }

    /** Çağlayan vb. teknik kesit / model ölçü çizimleri (beyaz çizgi, şeffaf zemin). */
    function isLineArtProductImg(relOrUrl) {
      var fn = imgFileName(relOrUrl);
      if (!fn) return false;
      if (isCaglayanKesitImg(relOrUrl)) return true;
      if (isCaglayanModelDrawImg(relOrUrl)) return true;
      if (/teknik|[-_]cizim|drawing|schema|blueprint|olcu-?cizim/i.test(fn)) return true;
      return false;
    }

    function pickCaglayanHeroRel(x) {
      var list = (x && x.images) || [];
      var i;
      for (i = 0; i < list.length; i++) {
        if (isCaglayanPdpThumbImg(list[i])) return list[i];
      }
      for (i = 0; i < list.length; i++) {
        if (!isLineArtProductImg(list[i])) return list[i];
      }
      return list[0] || "";
    }

    /** Çağlayan PDP — import’taki caglayanTeknik veya galeriden kesit/model çizimi. */
    function getCaglayanTeknikImgs(x) {
      if (!isCaglayanRefrigeration(x)) return [];
      var out = [];
      var t = x.caglayanTeknik;
      if (t && t.kesit) out.push({ rel: t.kesit, role: "kesit" });
      if (t && t.modelCizim) out.push({ rel: t.modelCizim, role: "model" });
      if (!out.length && x.images && x.images.length) {
        x.images.forEach(function (rel) {
          if (!isLineArtProductImg(rel)) return;
          var fn = imgFileName(rel);
          if (/kesit/i.test(fn)) out.push({ rel: rel, role: "kesit" });
          else if (/model-\d/i.test(fn)) out.push({ rel: rel, role: "model" });
        });
      }
      return out.slice(0, 2);
    }

    function applyLineArtHeroState(mainImg, wrap, lineart) {
      if (mainImg) mainImg.classList.toggle("eq-product-hero-img--lineart", !!lineart);
      if (wrap) wrap.classList.toggle("eq-product-hero-wrap--lineart", !!lineart);
    }

    function collectProductImgs(x) {
      var rels = uniqueImgs(x.images);
      if (!rels.length) {
        var syn = oztiWebRelFromSku(x.sku || x.urun_kodu || x.model);
        if (syn) rels.push(syn);
      }
      if (
        isMarketReyonProduct(x) &&
        String(x.kaynak || "") === "caglayan-refrigeration" &&
        rels.length > MARKET_REYON_GALLERY_MAX
      ) {
        rels = rels.slice(0, MARKET_REYON_GALLERY_MAX);
      }
      var out = [];
      if (isCaglayanRefrigeration(x)) {
        var productRels = [];
        var kesitRels = [];
        var teknikSeen = Object.create(null);
        rels.forEach(function (rel) {
          if (isCaglayanPdpThumbImg(rel)) productRels.push(rel);
          else if (isCaglayanKesitImg(rel)) {
            var kK = String(rel).toLowerCase();
            if (!teknikSeen[kK]) {
              teknikSeen[kK] = 1;
              kesitRels.push(rel);
            }
          }
        });
        getCaglayanTeknikImgs(x).forEach(function (item) {
          if (!item.rel || item.role !== "kesit") return;
          var kT = String(item.rel).toLowerCase();
          if (teknikSeen[kT]) return;
          teknikSeen[kT] = 1;
          kesitRels.push(item.rel);
        });
        if (productRels.length > CAGLAYAN_PDP_THUMB_MAX) {
          productRels = productRels.slice(0, CAGLAYAN_PDP_THUMB_MAX);
        }
        var thumbList = productRels.concat(kesitRels.slice(0, 2));
        thumbList.forEach(function (rel) {
          var src = resolveProductImgSrc(rel);
          if (!src) return;
          out.push({
            src: src,
            rel: rel,
            lineart: isCaglayanKesitImg(rel),
          });
        });
        return out;
      }
      rels.forEach(function (rel) {
        var src = resolveProductImgSrc(rel);
        if (src)
          out.push({
            src: src,
            rel: rel,
            lineart: isLineArtProductImg(rel) || isLineArtProductImg(src),
          });
      });
      return out;
    }

    function pdpImgFailAttr() {
      return ' onerror="typeof __eqImgFail===\'function\'&&__eqImgFail(this)"';
    }

    function pdpImgDataAttrs(x, rel) {
      var raw = normImgPath(rel) || "";
      var sku = (x && (x.sku || x.urun_kodu || x.model)) || "";
      var s = raw ? ' data-eq-img-raw="' + esc(raw) + '"' : "";
      if (sku) s += ' data-eq-ozti-kod="' + esc(String(sku).trim()) + '"';
      return s;
    }

    function renderPdpThumbImg(p) {
      var rel = "";
      if (p && p.images && p.images.length) {
        if (isCaglayanRefrigeration(p)) {
          for (var ti = 0; ti < p.images.length; ti++) {
            if (isCaglayanPdpThumbImg(p.images[ti])) {
              rel = p.images[ti];
              break;
            }
          }
        } else {
          rel = p.images[0];
        }
      }
      if (!rel && p) rel = oztiWebRelFromSku(p.sku || p.urun_kodu || p.model) || "";
      var src = rel ? resolveProductImgSrc(rel) : thumbSrc(p);
      if (!src) {
        return '<span style="font-size:9px;color:var(--eq-text-subtle);">—</span>';
      }
      return (
        '<img src="' +
        esc(eqHtmlUrl(src)) +
        '"' +
        pdpImgFailAttr() +
        pdpImgDataAttrs(p, rel) +
        ' alt="" loading="lazy" decoding="async">'
      );
    }

    function deptFromPagePath() {
      try {
        var m = location.pathname.match(/\/shop\/([^/]+)/);
        return m ? decodeURIComponent(m[1]) : "";
      } catch (_) {
        return "";
      }
    }

    function deptLink(cat, deptOverride) {
      var seg =
        deptOverride ||
        deptFromPagePath() ||
        (typeof window.eqCategoryToUrunlerSeg === "function" ? window.eqCategoryToUrunlerSeg(cat) : null);
      if (seg === "market-reyonlari" && typeof window.equstoUrl === "function") {
        return { href: window.equstoUrl("marketReyon"), label: __navDeptLabel("market-reyonlari", "Market Reyonları") };
      }
      if (
        (seg === "market-reyon" || (deptOverride && deptOverride === "market-reyon")) &&
        typeof window.equstoUrl === "function"
      ) {
        return { href: window.equstoUrl("marketReyon"), label: __navDeptLabel("market-reyon", "Market Reyonları") };
      }
      if (seg && typeof window.equstoUrl === "function") {
        var fb =
          seg === "set-ustu-mutfak"
            ? "Set Üstü Mutfak Ekipmanları"
            : seg === "besos"
              ? "Besos"
              : seg.charAt(0).toUpperCase() + seg.slice(1);
        return { href: window.equstoUrl(seg), label: __navDeptLabel(seg, fb) };
      }
      return { href: eqShopHref(), label: __pdpT("pdp.breadcrumb_catalog", "Katalog") };
    }

    function slugifyEq(s) {
      var tr = {
        'ğ':'g','ü':'u','ş':'s','ı':'i','ö':'o','ç':'c','â':'a','î':'i','û':'u',
        'Ğ':'g','Ü':'u','Ş':'s','İ':'i','Ö':'o','Ç':'c','Â':'a','Î':'i','Û':'u'
      };
      return String(s || '').toLowerCase()
        .replace(/[ğüşıöçâîûĞÜŞİÖÇÂÎÛ]/g, function(c){ return tr[c] || c; })
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 100);
    }
    function productSlugEq(u) {
      if (!u) return '';
      var id = String(u.id || (u.raw && u.raw.id) || '').trim();
      if (id) return id.toLowerCase();
      if (typeof window.eqProductSlug === 'function') return window.eqProductSlug(u);
      var b = slugifyEq(u.brand || u.b || '');
      var n = slugifyEq(u.name || u.n || '');
      return (b ? b + '-' : '') + n;
    }
    window.__eqProductSlug = productSlugEq;

    function eqPathForProductObj(x) {
      if (!x) return null;
      if (x.equstoPage) {
        return typeof window.eqAttrPath === "function"
          ? window.eqAttrPath(x.equstoPage)
          : x.equstoPage;
      }
      var idSlug = String(x.id || "").trim();
      var sl = idSlug || productSlugEq(x);
      if (!sl) return null;
      var cat = x.category || x.c || "";
      var seg =
        (x.dept && String(x.dept).trim()) ||
        (typeof window.eqCategoryToUrunlerSeg === "function"
          ? window.eqCategoryToUrunlerSeg(cat) || "pisirme"
          : "pisirme");
      if (seg === "market-reyon") seg = "market-reyonlari";
      return typeof window.eqProductPath === "function" ? window.eqProductPath(seg, sl) : "/shop/" + seg + "/" + sl;
    }

    function findRaw(all, qs) {
      var p = qs.get("p");
      var b = qs.get("b");
      var n = qs.get("n");
      var keyFn = window.EqustoCart && EqustoCart.itemKey;
      if (!all || !all.length) return null;

      /* 1) URL: /shop/[dept]/[slug], /urunler/... (eski) veya /urun/[slug] */
      try {
        var mU = location.pathname.match(/\/(?:shop|urunler)\/[^/]+\/([^/?#]+)/);
        var mO = !mU ? location.pathname.match(/\/urun\/([^/?#]+)/) : null;
        var slugPart = (mU && mU[1]) || (mO && mO[1]);
        if (slugPart) {
          var pathSlug = decodeURIComponent(slugPart).toLowerCase();
          if (typeof window.eqFindCatalogRowByPathSlug === "function") {
            var hit = window.eqFindCatalogRowByPathSlug(all, pathSlug);
            if (hit) return hit;
          }
          var altSlugFn =
            typeof window.eqProductSlugTransliterated === "function"
              ? window.eqProductSlugTransliterated
              : null;
          for (var s = 0; s < all.length; s++) {
            var rid = String(all[s].id || "").trim().toLowerCase();
            if (rid && rid === pathSlug) return all[s];
            if (productSlugEq(all[s]) === pathSlug) return all[s];
            if (altSlugFn && altSlugFn(all[s]) === pathSlug) return all[s];
          }
        }
      } catch (_) {}

      /* 2) ?p= (itemKey) */
      if (keyFn && p) {
        for (var i = 0; i < all.length; i++) {
          var x = all[i];
          if (!x) continue;
          var k = keyFn({ c: x.category || "", b: x.brand || "", n: x.name || "" });
          if (k === p) return x;
        }
      }

      /* 3) ?b=brand&n=name */
      if (b != null && n != null && String(b) !== "" && String(n) !== "") {
        for (var j = 0; j < all.length; j++) {
          var y = all[j];
          if (y && (y.brand || "") === b && (y.name || "") === n) return y;
        }
      }
      return null;
    }

    function esc(s) {
      return String(s == null ? "" : s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/\"/g, "&quot;");
    }

    function clearProductPageAccent() {
      var el = document.getElementById("eq-product-root");
      if (!el) return;
      el.classList.remove("eq-product-main--accent");
      el.style.removeProperty("--eq-prod-ar");
      el.style.removeProperty("--eq-prod-ag");
      el.style.removeProperty("--eq-prod-ab");
    }

    function applyProductPageAccentFromImg(img) {
      var el = document.getElementById("eq-product-root");
      if (!el) return;
      var Tint = window.EqustoProductTint;
      if (!Tint || typeof Tint.sampleFromImage !== "function") {
        clearProductPageAccent();
        return;
      }
      if (!img || img.tagName !== "IMG" || !img.getAttribute("src")) {
        clearProductPageAccent();
        return;
      }
      function commit(rgb) {
        if (!rgb || rgb.r == null) {
          clearProductPageAccent();
          return;
        }
        el.style.setProperty("--eq-prod-ar", String(rgb.r));
        el.style.setProperty("--eq-prod-ag", String(rgb.g));
        el.style.setProperty("--eq-prod-ab", String(rgb.b));
        el.classList.add("eq-product-main--accent");
      }
      var sync = typeof Tint.sampleFromImageSync === "function" ? Tint.sampleFromImageSync(img) : null;
      if (sync) commit(sync);
      Tint.sampleFromImage(img, function (rgb) {
        commit(rgb || sync);
      });
    }

    function formatOlculerLinePdp(raw) {
      if (!raw || !raw.olculer) return "";
      var o = raw.olculer;
      var g = Number(o.genislik_mm);
      var d = Number(o.derinlik_mm);
      var y = Number(o.yukseklik_mm);
      if (!g || !d || !y) return "";
      var name = String(raw.name || "");
      if (/×\d/.test(name)) return "";
      if (g >= 1000 && d >= 1000) {
        return Math.round(g / 10) + "×" + Math.round(d / 10) + "×" + Math.round(y / 10) + " cm";
      }
      return g + "×" + d + "×" + y + " mm";
    }

    function shortModelLabel(p) {
      var n = (p && p.name) || "";
      var b = (p && p.brand) || "";
      if (b && n.indexOf(b) === 0) {
        n = n.slice(b.length).replace(/^[\s.,;:\-–—]+/, "");
      }
      n = n.replace(/\s+/g, " ").trim();
      var dim = isMarketReyonProduct(p) ? formatOlculerLinePdp(p) : "";
      if (dim) {
        var suffix = " · " + dim;
        if (n.length + suffix.length > 52) n = n.slice(0, Math.max(8, 50 - suffix.length)) + "…";
        n = (n || "Model") + suffix;
      } else if (n.length > 46) {
        n = n.slice(0, 44) + "…";
      }
      return n || ((p && p.name) || __pdpT("pdp.product_default", "Ürün")).slice(0, 52);
    }

    function thumbSrc(p) {
      var imgs = uniqueImgs(p && p.images);
      return imgs.length ? imgs[0] : "";
    }

    /** Kategori slug → şeritte gösterilecek etiket. */
    var CAT_RAIL_LABEL = {
      "sanayi-ocaklari": "Ocak",
      "sanayi-tipi-izgaralar": "Izgara",
      "kuzineler": "Kuzine",
      "fritozler": "Fritöz",
      "doner-ocaklari-": "Döner Ocağı",
      "tost-makineleri": "Tost Makinesi",
      "pilic-cevirme-makineleri": "Piliç Çevirme",
      "ocakbasi-izgara": "Ocakbaşı Izgarası",
      "sogutma-ekipmanlari": "Soğutma Ekipmanı",
      "kahve-makineleri": "Kahve Makinesi",
      "bulasik-makineleri": "Bulaşık Yıkama Makinası",
      "hamur-hazirlik-makineleri": "Hamur Hazırlık",
      "et-hazirlik-makineleri": "Et Hazırlık",
      "cay-kazanlari-cay-makineleri-cay-otomatlari": "Çay Makinesi",
      "yiyecek-ve-icecek-otomatlari-": "İçecek Otomatı",
      "cikolata-temperleme-makinesi-": "Çikolata Temperleme",
    };

    var MARKET_REYON_TILE_LABEL = {
      "proso-sutluk": "Proso sütlükler",
      "proso-kisa-sutluk": "Proso kısa sütlükler",
      "proso-sarkuteri": "Proso şarküteri reyonları",
      "proso-dikey-dondurucu": "Proso dikey dondurucular",
      "proso-ada-tipi": "Proso ada tipi reyonlar",
      "proso-plugin": "Proso plug-in kabinler",
      "proso-butik": "Proso butik reyonlar",
      "proso-soguk-hava": "Proso soğuk hava depoları",
      "proso-sogutma-sistemleri": "Proso soğutma sistemleri",
      "proso-sise-sogutucu": "Proso şişe soğutucular",
      "caglayan-nilufer": "Çağlayan Nilüfer serisi",
      "caglayan-lotus": "Çağlayan Lotus serisi",
      "caglayan-nergis": "Çağlayan Nergis serisi",
      "caglayan-lale": "Çağlayan Lale serisi",
      "caglayan-inci": "Çağlayan İnci serisi",
      "caglayan-hercai": "Çağlayan Hercai serisi",
      "caglayan-reyhan": "Çağlayan Reyhan serisi",
      "caglayan-sardunya": "Çağlayan Sardunya serisi",
      "caglayan-gardenya": "Çağlayan Gardenya serisi",
      "caglayan-anemon": "Çağlayan Anemon serisi",
      "caglayan-akasya": "Çağlayan Akasya serisi",
    };

    function isMarketReyonProduct(p) {
      if (!p) return false;
      if (String(p.dept || "") === "market-reyon") return true;
      var c = String(p.category || "");
      return /^proso-/.test(c) || /^caglayan-/.test(c);
    }

    function railLabelFor(cat) {
      var s = String(cat || "");
      if (CAT_RAIL_LABEL[s]) return CAT_RAIL_LABEL[s];
      return s.replace(/-+$/, "").replace(/-/g, " ");
    }

    function railLabelForProduct(x) {
      if (x && String(x.kaynak || "") === "besos-vitrum") {
        return __pdpT("pdp.besos_other_modules", "Besos — diğer modüller");
      }
      if (!x || !isMarketReyonProduct(x)) return railLabelFor((x && x.category) || "");
      if (isCaglayanRefrigeration(x)) {
        return __pdpT("pdp.caglayan_other_models", "Çağlayan Refrigeration — diğer modeller");
      }
      var series = String(x.series || "").trim();
      if (series) return series + " ve muadil modeller";
      var tid = String(x.tileId || "");
      if (MARKET_REYON_TILE_LABEL[tid]) return MARKET_REYON_TILE_LABEL[tid] + " — muadil";
      if (x.brand) {
        var b = String(x.brand).replace(/\s+refrigeration\s*$/i, "").trim();
        return b + " — benzer reyon modelleri";
      }
      return __pdpT("pdp.similar_market", "Benzer market reyonları");
    }

    function scoreMarketReyonPeer(x, p) {
      var score = 0;
      var brand = String(x.brand || "");
      if (brand && String(p.brand || "") === brand) score += 40;
      var tileId = String(x.tileId || "");
      if (tileId && String(p.tileId || "") === tileId) score += 55;
      var series = String(x.series || "").toLocaleLowerCase("tr").trim();
      var pSeries = String(p.series || "").toLocaleLowerCase("tr").trim();
      if (series && pSeries && series === pSeries) score += 100;
      var cat = String(x.category || "");
      var pCat = String(p.category || "");
      if (cat && pCat) {
        if (cat === pCat) score += 30;
        var catRoot = cat.replace(/-[a-z0-9]+$/i, "");
        if (catRoot.length > 6 && pCat.indexOf(catRoot) === 0) score += 20;
      }
      return score;
    }

    var CAGLAYAN_FAMILY_RAIL_MAX = 9;

    /** Market reyon: aynı marka / seri / hat — üst muadil şeridi (max 9). */
    function pickMarketReyonMuadil(x, all, keyFn) {
      if (!x || !all || !all.length) return { items: [], mode: "market-reyon" };
      var curSlug = String(x.slug || x.id || "").toLowerCase();
      var curKey = keyFn
        ? keyFn({ c: x.category || "", b: x.brand || "", n: x.name || "" })
        : "";
      var scored = [];
      for (var i = 0; i < all.length; i++) {
        var p = all[i];
        if (!p || !isMarketReyonProduct(p)) continue;
        var pSlug = String(p.slug || p.id || "").toLowerCase();
        if (pSlug && pSlug === curSlug) continue;
        if (curKey && keyFn) {
          var pk = keyFn({ c: p.category || "", b: p.brand || "", n: p.name || "" });
          if (pk && pk === curKey) continue;
        }
        var score = scoreMarketReyonPeer(x, p);
        if (score < 40) continue;
        scored.push({ p: p, score: score });
      }
      scored.sort(function (a, b) {
        if (b.score !== a.score) return b.score - a.score;
        return String(a.p.name || "").localeCompare(String(b.p.name || ""), "tr", {
          sensitivity: "base",
        });
      });
      var out = [];
      for (var j = 0; j < scored.length && out.length < CAGLAYAN_FAMILY_RAIL_MAX; j++) {
        out.push(scored[j].p);
      }
      return { items: out, mode: "market-reyon" };
    }

    function caglayanParentKey(p) {
      return String(
        (p && p.caglayanModelSlug) ||
          (p && p.prosoModelSlug) ||
          (p && p.slug) ||
          (p && p.id) ||
          ""
      )
        .toLowerCase()
        .trim();
    }

    function hasCaglayanProductPhoto(p) {
      var imgs = (p && p.images) || [];
      for (var i = 0; i < imgs.length; i++) {
        if (isCaglayanPdpThumbImg(imgs[i])) return true;
      }
      return false;
    }

    function pickBetterCaglayanRep(a, b) {
      var aPhoto = hasCaglayanProductPhoto(a);
      var bPhoto = hasCaglayanProductPhoto(b);
      if (aPhoto && !bPhoto) return a;
      if (bPhoto && !aPhoto) return b;
      var ae = Number(a.caglayanEqNo || a.prosoEqNo) || 999;
      var be = Number(b.caglayanEqNo || b.prosoEqNo) || 999;
      return ae <= be ? a : b;
    }

    /** Çağlayan: farklı model hatları (her caglayanModelSlug’tan bir), ölçü varyantı şeridi değil. */
    function pickCaglayanCatalogPeers(x, all) {
      if (!x || !all || !all.length) return { items: [], mode: "caglayan-catalog" };
      var curSlug = String(x.slug || x.id || "").toLowerCase();
      var curParent = caglayanParentKey(x);
      var curSeries = String(x.series || "")
        .toLocaleLowerCase("tr")
        .trim();
      var byParent = Object.create(null);

      for (var i = 0; i < all.length; i++) {
        var p = all[i];
        if (!p || !isCaglayanRefrigeration(p)) continue;
        var pSlug = String(p.slug || p.id || "").toLowerCase();
        if (pSlug && pSlug === curSlug) continue;
        var parent = caglayanParentKey(p);
        if (!parent) continue;
        if (curParent && parent === curParent) continue;

        if (!byParent[parent]) byParent[parent] = p;
        else byParent[parent] = pickBetterCaglayanRep(byParent[parent], p);
      }

      var candidates = Object.keys(byParent).map(function (k) {
        return byParent[k];
      });
      candidates.sort(function (a, b) {
        var sa = String(a.series || "").toLocaleLowerCase("tr");
        var sb = String(b.series || "").toLocaleLowerCase("tr");
        var aSame = curSeries && sa === curSeries ? 1 : 0;
        var bSame = curSeries && sb === curSeries ? 1 : 0;
        if (aSame !== bSame) return aSame - bSame;
        var ta = String(a.tileId || a.category || "");
        var tb = String(b.tileId || b.category || "");
        if (ta !== tb) return ta.localeCompare(tb, "tr");
        return String(a.name || "").localeCompare(String(b.name || ""), "tr", {
          sensitivity: "base",
        });
      });

      var out = candidates.slice(0, CAGLAYAN_FAMILY_RAIL_MAX);
      return { items: out, mode: "caglayan-catalog" };
    }

    /** Ürün adı içindeki anahtar kelimelerle alt-tip etiketi (bağlam koru: espresso↔espresso, türk↔türk, vb.). */
    var SUB_TYPE_KEYWORDS = {
      "kahve-makineleri": [
        { tag: "espresso", any: ["espresso"] },
        { tag: "filtre", any: ["filtre kahve", "filtre"] },
        { tag: "turk", any: ["türk", "kumda"] },
        { tag: "degirmen", any: ["değirmen", "grinder"] },
        { tag: "mikser", any: ["mikser", "blender", "shaker"] },
        { tag: "perkolator", any: ["perkolatör", "percolator"] },
        { tag: "moka", any: ["moka"] },
      ],
      "sogutma-ekipmanlari": [
        { tag: "buz-makinesi", any: ["buz makinesi", "buz makinası", "ice maker"] },
        { tag: "derin-dondurucu", any: ["derin dondurucu", "dondurucu"] },
        { tag: "soguk-oda", any: ["soğuk oda"] },
        { tag: "sarap", any: ["şarap"] },
        { tag: "pastane", any: ["pastane", "pasta"] },
        { tag: "make-up", any: ["make up", "make-up", "makeup"] },
        { tag: "cihaz-alti", any: ["cihaz altı", "cihazaltı"] },
        { tag: "tezgah-tipi", any: ["tezgah tipi", "tezgah altı"] },
        { tag: "dik-buzdolabi", any: ["dik tip", "dik buzdolabı", "dik buzdolap"] },
        { tag: "buzdolabi", any: ["buzdolabı", "buzdolap"] },
      ],
      "bulasik-makineleri": [
        { tag: "setalti", any: ["setaltı", "set altı", "tezgah altı"] },
        { tag: "giyotin", any: ["giyotin"] },
        { tag: "konveyor", any: ["konveyör", "konveyor"] },
        { tag: "tirnakli", any: ["tırnaklı"] },
        { tag: "kazan", any: ["kazan yıkama", "kazan"] },
      ],
      "hamur-hazirlik-makineleri": [
        { tag: "mikser", any: ["mikser", "planeter", "spiral"] },
        { tag: "blender", any: ["blender"] },
        { tag: "hamur-acma", any: ["hamur açma", "hamur acma", "açıcı", "açma"] },
        { tag: "yogurma", any: ["yoğurma"] },
      ],
      "et-hazirlik-makineleri": [
        { tag: "dilimleme", any: ["dilimleme", "dilim"] },
        { tag: "kiyma", any: ["kıyma"] },
        { tag: "vakum", any: ["vakum"] },
        { tag: "kemik", any: ["kemik testere", "testere"] },
      ],
    };

    function detectSubType(p, cat) {
      var defs = SUB_TYPE_KEYWORDS[cat];
      if (!defs) return "";
      var hay = String((p && p.name) || "").toLocaleLowerCase("tr");
      for (var i = 0; i < defs.length; i++) {
        var d = defs[i];
        for (var j = 0; j < d.any.length; j++) {
          var kw = String(d.any[j] || "").toLocaleLowerCase("tr");
          if (kw && hay.indexOf(kw) !== -1) return d.tag;
        }
      }
      return "";
    }

    /** Aynı kategori + (varsa) aynı alt-tip; mevcut ürün hariç; marka çeşitliliği round-robin; en fazla 5. */
    function pickRelatedProducts(x, all, keyFn) {
      if (!x || !all || !all.length) return { items: [], mode: "" };
      if (isCaglayanRefrigeration(x)) {
        var cp = pickCaglayanCatalogPeers(x, all);
        if (cp.items.length) return cp;
      }
      if (isMarketReyonProduct(x)) return pickMarketReyonMuadil(x, all, keyFn);
      if (!keyFn) return { items: [], mode: "" };
      var cat = x.category || "";
      if (!cat) return { items: [], mode: "" };
      var curKey = keyFn({ c: x.category || "", b: x.brand || "", n: x.name || "" });
      var curSubType = detectSubType(x, cat);
      var byBrand = {};
      var brands = [];
      var seen = {};
      for (var i = 0; i < all.length; i++) {
        var p = all[i];
        if (!p || (p.category || "") !== cat) continue;
        var k = keyFn({ c: p.category || "", b: p.brand || "", n: p.name || "" });
        if (!k || k === curKey || seen[k]) continue;
        if (curSubType && detectSubType(p, cat) !== curSubType) continue;
        seen[k] = 1;
        var b = String(p.brand || "—");
        if (!byBrand[b]) {
          byBrand[b] = [];
          brands.push(b);
        }
        byBrand[b].push(p);
      }
      if (!brands.length) return { items: [], mode: "" };
      var curBrand = String(x.brand || "—");
      brands.sort(function (a, b) {
        if (a === curBrand && b !== curBrand) return 1;
        if (b === curBrand && a !== curBrand) return -1;
        return a.localeCompare(b, "tr", { sensitivity: "base" });
      });
      brands.forEach(function (b) {
        byBrand[b].sort(function (a1, a2) {
          return String(a1.name || "").localeCompare(String(a2.name || ""), "tr", { sensitivity: "base" });
        });
      });
      var out = [];
      var maxN = 5;
      var round = 0;
      while (out.length < maxN) {
        var added = false;
        for (var bi = 0; bi < brands.length && out.length < maxN; bi++) {
          var arr = byBrand[brands[bi]];
          if (arr && arr.length > round) {
            out.push(arr[round]);
            added = true;
          }
        }
        if (!added) break;
        round++;
      }
      return { items: out, mode: "subcat" };
    }

    /** Üst rail’de gösterilenleri dışlayan, aynı kategoride genişletilmiş «yardımcı / ilgili» liste. */
    function pickRelatedExtras(x, all, keyFn, excludeKeys, max) {
      if (!x || !all || !all.length) return [];
      if (isMarketReyonProduct(x)) {
        var curSlug = String(x.slug || x.id || "").toLowerCase();
        var brand = String(x.brand || "");
        var out = [];
        var seen = Object.create(null);
        for (var mi = 0; mi < all.length; mi++) {
          var p = all[mi];
          if (!p || !isMarketReyonProduct(p)) continue;
          var pSlug = String(p.slug || p.id || "").toLowerCase();
          if (pSlug === curSlug) continue;
          var pk = keyFn
            ? keyFn({ c: p.category || "", b: p.brand || "", n: p.name || "" })
            : pSlug;
          if (excludeKeys && excludeKeys[pk]) continue;
          if (seen[pk]) continue;
          if (brand && String(p.brand || "") !== brand) continue;
          seen[pk] = 1;
          out.push(p);
          if (out.length >= (max || 24)) break;
        }
        out.sort(function (a, b) {
          return String(a.name || "").localeCompare(String(b.name || ""), "tr", {
            sensitivity: "base",
          });
        });
        return out;
      }
      if (!keyFn) return [];
      var cat = x.category || "";
      if (!cat) return [];
      var curKey = keyFn({ c: x.category || "", b: x.brand || "", n: x.name || "" });
      var byBrand = {};
      var brands = [];
      var seen = Object.create(null);
      for (var i = 0; i < all.length; i++) {
        var p = all[i];
        if (!p || (p.category || "") !== cat) continue;
        var k = keyFn({ c: p.category || "", b: p.brand || "", n: p.name || "" });
        if (!k || k === curKey) continue;
        if (excludeKeys && excludeKeys[k]) continue;
        if (seen[k]) continue;
        seen[k] = 1;
        var b = String(p.brand || "—");
        if (!byBrand[b]) { byBrand[b] = []; brands.push(b); }
        byBrand[b].push(p);
      }
      var curBrand = String(x.brand || "—");
      brands.sort(function (a, b) {
        if (a === curBrand && b !== curBrand) return -1;
        if (b === curBrand && a !== curBrand) return 1;
        return a.localeCompare(b, "tr", { sensitivity: "base" });
      });
      brands.forEach(function (b) {
        byBrand[b].sort(function (a1, a2) {
          return String(a1.name || "").localeCompare(String(a2.name || ""), "tr", { sensitivity: "base" });
        });
      });
      var out = [];
      var maxN = max || 12;
      var round = 0;
      while (out.length < maxN) {
        var added = false;
        for (var bi = 0; bi < brands.length && out.length < maxN; bi++) {
          var arr = byBrand[brands[bi]];
          if (arr && arr.length > round) {
            out.push(arr[round]);
            added = true;
          }
        }
        if (!added) break;
        round++;
      }
      return out;
    }

    /** Specs metninden "Bu ürün hakkında" bullet üretici: ilk N anlamlı satır. */
    function buildAboutBullets(specs, max) {
      var s = String(specs || "");
      if (!s.trim()) return [];
      var lines = s.split(/\r?\n/);
      var out = [];
      var skipHeader = /^(genel\s*özellikler|teknik\s*özellikler|özellikler|açıklama)\s*:?\s*$/i;
      for (var i = 0; i < lines.length; i++) {
        var ln = String(lines[i] || "").trim();
        if (!ln) continue;
        if (skipHeader.test(ln)) continue;
        if (/UZUNLUK\s*\/\s*LENGTH/i.test(ln)) break;
        if (/\|/.test(ln) && /\d{3,4}/.test(ln)) continue;
        ln = ln.replace(/^[•\-–—*·]+\s*/, "");
        if (ln.length < 4) continue;
        out.push(ln);
        if (out.length >= (max || 6)) break;
      }
      return out;
    }

    function splitSpecsCols(specs) {
      var s = String(specs || "");
      if (!s.trim()) return { left: "", right: "" };
      var lines = s.split(/\r?\n/);
      var idx = -1;
      for (var i = 0; i < lines.length; i++) {
        var ln = lines[i].trim().toLocaleLowerCase("tr-TR");
        if (/^teknik\s*[öo]zellikler[\s:]*$/.test(ln)) { idx = i; break; }
      }
      if (idx < 0) return { left: s, right: "" };
      var left = lines.slice(0, idx).join("\n").replace(/\s+$/, "");
      var right = lines.slice(idx).join("\n");
      return { left: left, right: right };
    }

    function productDimsFrom(x) {
      var o = (x && x.olculer) || {};
      var m = String((x && x.name) || "").match(
        /(\d{3,4})\s*[×x]\s*(\d{3,4})\s*[×x]\s*(\d{3,4})\s*mm/i
      );
      return {
        len: Number(o.genislik_mm) || (m ? +m[1] : 0),
        depth: Number(o.derinlik_mm) || (m ? +m[2] : 0),
        height: Number(o.yukseklik_mm) || (m ? +m[3] : 0),
      };
    }

    function caglayanOzelliklerList(x) {
      if (x.caglayanOzellikler && x.caglayanOzellikler.length) return x.caglayanOzellikler;
      if (x.teknik_ozellikler && x.teknik_ozellikler.length) return x.teknik_ozellikler;
      var lines = String(x.specs || "").split(/\r?\n/);
      var out = [];
      for (var i = 0; i < lines.length; i++) {
        var ln = lines[i].trim();
        if (!/^özellikler\s*:/i.test(ln)) continue;
        for (i++; i < lines.length; i++) {
          ln = lines[i].trim();
          if (!ln) break;
          if (/UZUNLUK\s*\/\s*LENGTH/i.test(ln)) break;
          ln = ln.replace(/^[•\-–—*·]+\s*/, "");
          if (ln.length >= 3) out.push(ln);
        }
        break;
      }
      return out;
    }

    function isCatalogLengthRow(row) {
      var n = parseInt(String((row && row[0]) || "").trim(), 10);
      return !isNaN(n) && n >= 900 && n <= 4500;
    }

    /** Çağlayan katalog tablosundan yalnızca bu ürünün uzunluk satırı. */
    function filterCaglayanTabForProduct(tab, dims) {
      if (!tab || !dims || !dims.len) return null;
      var rows = tab.satirlar || [];
      var kept = [];
      for (var i = 0; i < rows.length; i++) {
        var r = rows[i];
        if (!r || !r.length) continue;
        var first = String(r[0] || "").trim();
        if (isCatalogLengthRow(r)) {
          if (parseInt(first, 10) === dims.len) kept.push(r);
          continue;
        }
        if (!kept.length && /^(mm|tp|fg|sky|ld|lm)/i.test(first)) kept.push(r);
      }
      if (!kept.length) return null;
      return { basliklar: tab.basliklar, altBaslik: tab.altBaslik, satirlar: kept };
    }

    function renderCaglayanVariantDims(x) {
      var d = productDimsFrom(x);
      if (!d.len && !d.depth && !d.height) return "";
      var parts = [];
      if (d.len) parts.push(__pdpT("pdp.dim_length", "Uzunluk") + " " + d.len + " mm");
      if (d.depth) parts.push(__pdpT("pdp.dim_depth", "Derinlik") + " " + d.depth + " mm");
      if (d.height) parts.push(__pdpT("pdp.dim_height", "Yükseklik") + " " + d.height + " mm");
      return (
        '<ul class="eq-specs-dims">' +
        parts.map(function (p) { return "<li>" + esc(p) + "</li>"; }).join("") +
        "</ul>"
      );
    }

    function renderProductSpecsSection(x) {
      if (!isCaglayanRefrigeration(x)) {
        var sp = splitSpecsCols(x.specs);
        if (sp.right) {
          return (
            '<div class="eq-product-specs"><h2>' + esc(__pdpT("pdp.specs_heading", "Teknik özellikler ve açıklama")) + '</h2>' +
            '<div class="eq-specs-cols">' +
            '<pre>' + esc(sp.left || "—") + "</pre>" +
            '<pre>' + esc(sp.right) + "</pre>" +
            "</div></div>"
          );
        }
        if (!String(x.specs || "").trim()) return "";
        return (
          '<div class="eq-product-specs"><h2>' + esc(__pdpT("pdp.specs_heading", "Teknik özellikler ve açıklama")) + '</h2><pre>' +
          esc(x.specs) +
          "</pre></div>"
        );
      }

      var dims = productDimsFrom(x);
      var oz = caglayanOzelliklerList(x);
      var tables = "";
      (x.caglayanTeknikAkordeon || []).forEach(function (block) {
        (block.tablolar || []).forEach(function (tab) {
          var ft = filterCaglayanTabForProduct(tab, dims);
          if (ft) tables += renderCaglayanTeknikTable(ft);
        });
      });

      var pdf = caglayanPdfHref(x);
      var src = String(x.linkKaynak || "").trim();
      var html =
        '<div class="eq-product-specs eq-product-specs--variant">' +
        "<h2>" + esc(__pdpT("pdp.specs_heading_short", "Teknik özellikler")) + "</h2>";
      if (dims.len || dims.depth || dims.height) {
        html += '<h3 class="eq-specs-sub">' + esc(__pdpT("pdp.specs_model_dims", "Bu model ölçüleri")) + '</h3>' + renderCaglayanVariantDims(x);
      }
      if (oz.length) {
        html +=
          '<h3 class="eq-specs-sub">' + esc(__pdpT("pdp.specs_features", "Özellikler")) + '</h3><ul class="eq-specs-list">' +
          oz
            .map(function (l) {
              return "<li>" + esc(l) + "</li>";
            })
            .join("") +
          "</ul>";
      }
      if (tables) {
        html += '<h3 class="eq-specs-sub">' + esc(__pdpT("pdp.specs_catalog_values", "Katalog değerleri (bu ölçü)")) + '</h3>' + tables;
      }
      html +=
        '<p class="eq-specs-note">Tüm uzunluk ve derinlik seçenekleri üretici kataloğunda listelenir.' +
        (pdf
          ? ' <a href="' + esc(pdf) + '" target="_blank" rel="noopener">' + esc(__pdpT("pdp.pdf_catalog", "PDF katalog")) + '</a>'
          : src
            ? ' <a href="' + esc(src) + '" target="_blank" rel="noopener">' + esc(__pdpT("pdp.mfg_page", "Üretici sayfası")) + '</a>'
            : "") +
        ".</p></div>";
      return html;
    }

    function renderRecentlyViewed(current, all) {
      try {
        var slugs = JSON.parse(localStorage.getItem('eq_recently_viewed') || '[]');
        var curSlug = productSlugEq(current);
        slugs = slugs.filter(function(s){ return s && s !== curSlug; }).slice(0, 8);
        if (!slugs.length) return '';
        var items = [];
        slugs.forEach(function(s) {
          for (var i = 0; i < all.length; i++) {
            if (productSlugEq(all[i]) === s) { items.push(all[i]); break; }
          }
        });
        if (!items.length) return '';
        var cards = items.map(function(p) {
          var sl = productSlugEq(p);
          var href = sl ? eqPathForProductObj(p) || "/urun/" + sl : "#";
          var img = renderPdpThumbImg(p);
          return '<a class="eq-mbg-card" href="' + esc(eqHtmlUrl(href)) + '">'+
            '<div class="eq-mbg-thumb">'+img+'</div>'+
            '<div class="eq-mbg-brand">'+esc(p.brand||'')+'</div>'+
            '<div class="eq-mbg-name">'+esc((p.name||'').slice(0,55))+'</div>'+
          '</a>';
        }).join('');
        return '<section class="eq-mbg-related" aria-label="' + esc(__pdpT("pdp.mbg_recent_aria", "Son görüntüledikleriniz")) + '">'+
          '<div class="eq-mbg-head"><h2 class="eq-mbg-title">' + esc(__pdpT("pdp.mbg_recent_title", "Son görüntüledikleriniz")) + '</h2></div>'+
          '<div class="eq-mbg-wrap"><div class="eq-mbg-track">'+cards+'</div></div>'+
        '</section>';
      } catch(_) { return ''; }
    }

    function renderRelatedStrip(x, all, keyFn, excludeKeys) {
      var items = pickRelatedExtras(x, all, keyFn, excludeKeys, 24);
      if (!items.length) return "";
      var cells = items
        .map(function (p) {
          var k = keyFn({ c: p.category || "", b: p.brand || "", n: p.name || "" });
          var img = renderPdpThumbImg(p);
          var lbl = esc(shortModelLabel(p));
          var brand = esc(p.brand || "");
          var price = esc(extractCartPrice(p.price));
          var pHref = productSlugEq(p)
            ? eqPathForProductObj(p) || "/urun/" + productSlugEq(p)
            : "product.html?p=" + esc(encodeURIComponent(k));
          return (
            '<a class="eq-mbg-card" href="' + esc(eqHtmlUrl(pHref)) + '">' +
            '<div class="eq-mbg-thumb">' + img + "</div>" +
            (brand ? '<div class="eq-mbg-brand">' + brand + "</div>" : "") +
            '<div class="eq-mbg-name">' + lbl + "</div>" +
            (price ? '<div class="eq-mbg-price">' + price + "</div>" : "") +
            "</a>"
          );
        })
        .join("");
      return (
        '<section class="eq-mbg-related" aria-label="' + esc(__pdpT("pdp.mbg_related_aria", "Bu ürünleri de görüntüleyenler")) + '">' +
        '<div class="eq-mbg-head">' +
          '<h2 class="eq-mbg-title">' + esc(__pdpT("pdp.mbg_related_title", "Müşteriler bu ürünleri de görüntüledi")) + '</h2>' +
          '<span class="eq-mbg-page" id="eq-mbg-page">' + esc(__pdpT("pdp.mbg_page", "Sayfa {page} / {total}", { page: 1, total: 1 })) + '</span>' +
        '</div>' +
        '<div class="eq-mbg-wrap">' +
          '<button type="button" class="eq-mbg-arrow eq-mbg-prev" aria-label="' + esc(__pdpT("pdp.mbg_prev", "Önceki")) + '" onclick="eqMbgScroll(-1)">' +
            '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
          '</button>' +
          '<button type="button" class="eq-mbg-arrow eq-mbg-next" aria-label="' + esc(__pdpT("pdp.mbg_next", "Sonraki")) + '" onclick="eqMbgScroll(1)">' +
            '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
          '</button>' +
          '<div class="eq-mbg-track" id="eq-mbg-track">' + cells + '</div>' +
        '</div>' +
        "</section>"
      );
    }

    function eqMbgScroll(dir) {
      var tr = document.getElementById("eq-mbg-track");
      if (!tr) return;
      var step = Math.max(200, Math.floor(tr.clientWidth * 0.9));
      tr.scrollBy({ left: dir * step, behavior: "smooth" });
    }
    function eqMbgUpdatePage() {
      var tr = document.getElementById("eq-mbg-track");
      var ind = document.getElementById("eq-mbg-page");
      if (!tr) return;
      var w = Math.max(1, tr.clientWidth);
      var totalPages = Math.max(1, Math.ceil(tr.scrollWidth / w));
      var page = Math.min(totalPages, Math.floor(tr.scrollLeft / w) + 1);
      if (ind) ind.textContent = __pdpT("pdp.mbg_page", "Sayfa {page} / {total}", { page: page, total: totalPages });
      var prev = document.querySelector(".eq-mbg-prev");
      var next = document.querySelector(".eq-mbg-next");
      if (prev) prev.disabled = tr.scrollLeft <= 2;
      if (next) next.disabled = tr.scrollLeft + w >= tr.scrollWidth - 2;
    }
    function eqMbgBindRelated() {
      var tr = document.getElementById("eq-mbg-track");
      if (!tr) return;
      tr.addEventListener("scroll", function () {
        if (tr.__eqMbgTick) return;
        tr.__eqMbgTick = true;
        window.requestAnimationFrame(function () {
          tr.__eqMbgTick = false;
          eqMbgUpdatePage();
        });
      });
      window.addEventListener("resize", eqMbgUpdatePage);
      eqMbgUpdatePage();
    }

    function familyRailSlotWidth() {
      return window.matchMedia("(max-width: 700px)").matches ? 90 : 108;
    }

    function familyRailGapPx() {
      return window.matchMedia("(max-width: 700px)").matches ? 8 : 12;
    }

    function familyRailMaxVisible(scrollEl) {
      if (!scrollEl) return 5;
      var w = scrollEl.clientWidth;
      if (!(w > 0)) return 5;
      var slot = familyRailSlotWidth();
      var gap = familyRailGapPx();
      return Math.max(1, Math.floor((w + gap) / (slot + gap)));
    }

    function trimFamilyRailToViewport() {
      var scroll = document.querySelector(".eq-product-family-scroll");
      if (!scroll) return;
      var items = scroll.querySelectorAll(".eq-product-family-item");
      if (!items.length) return;
      var max = familyRailMaxVisible(scroll);
      for (var i = 0; i < items.length; i++) {
        items[i].style.display = i < max ? "" : "none";
      }
    }

    function bindFamilyRailFit() {
      function run() {
        trimFamilyRailToViewport();
        var scroll = document.querySelector(".eq-product-family-scroll");
        if (scroll && scroll.clientWidth === 0) requestAnimationFrame(run);
      }
      run();
      if (window.__eqFamilyRailFitBound) return;
      window.__eqFamilyRailFitBound = true;
      window.addEventListener("resize", trimFamilyRailToViewport);
    }

    function renderFamilyRail(x, all, keyFn) {
      if (!x || !all || !all.length) return "";
      var pack = pickRelatedProducts(x, all, keyFn);
      var items = pack.items;
      if (!items.length) return "";
      var lineTitle = esc(railLabelForProduct(x));
      var familyHint =
        pack.mode === "caglayan-catalog"
          ? __pdpT("pdp.family_hint_caglayan", "Çağlayan katalogundan diğer modeller")
          : __pdpT("pdp.family_hint_similar", "Muadil ve benzer modeller");
      var curSlug = String(x.slug || x.id || "").toLowerCase();
      var scrollCls = "eq-product-family-scroll";
      var cells = items
        .map(function (p) {
          var k = keyFn
            ? keyFn({ c: p.category || "", b: p.brand || "", n: p.name || "" })
            : "";
          var img = renderPdpThumbImg(p);
          var lbl = esc(shortModelLabel(p));
          var fHref = productSlugEq(p)
            ? eqPathForProductObj(p) || "/urun/" + productSlugEq(p)
            : "product.html?p=" + esc(encodeURIComponent(k));
          var pSlug = String(p.slug || p.id || "").toLowerCase();
          var curCls = pSlug && pSlug === curSlug ? " eq-product-family-item--current" : "";
          return (
            '<div class="eq-product-family-item' +
            curCls +
            '">' +
            '<a href="' +
            esc(eqHtmlUrl(fHref)) +
            '">' +
            '<div class="eq-product-family-thumb">' +
            img +
            "</div>" +
            '<div class="eq-product-family-lbl">' +
            lbl +
            "</div></a></div>"
          );
        })
        .join("");
      return (
        '<div class="eq-product-family" aria-label="' +
        lineTitle +
        '">' +
        '<div class="eq-product-family-row">' +
        '<div class="eq-product-family-lineblock">' +
        '<div class="eq-product-family-line">' +
        lineTitle +
        "</div>" +
        '<div class="eq-product-family-hint">' +
        esc(familyHint) +
        "</div>" +
        "</div>" +
        '<div class="' +
        scrollCls.trim() +
        '" role="list">' +
        cells +
        "</div></div></div>"
      );
    }

    function productEqSk(slug) {
      var tail = String(slug || "urun")
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 48);
      return "EQ-SK-2026-URUN-" + (tail || "GEN");
    }

    function caglayanSeriesEyebrow(x) {
      if (x.series) return String(x.series);
      var c = String(x.category || "");
      if (MARKET_REYON_TILE_LABEL[c]) return MARKET_REYON_TILE_LABEL[c];
      return "Çağlayan Refrigeration";
    }

    function caglayanLeadParagraph(x) {
      var parts = [];
      if (x.olculer) {
        var o = x.olculer;
        if (o.genislik_mm) parts.push("Genişlik " + o.genislik_mm + " mm");
        if (o.derinlik_mm) parts.push("derinlik " + o.derinlik_mm + " mm");
        if (o.yukseklik_mm) parts.push("yükseklik " + o.yukseklik_mm + " mm");
      }
      if (x.caglayanModelKod) parts.push(String(x.caglayanModelKod));
      if (parts.length) return parts.join(" · ");
      if (x.caglayanOzellikler && x.caglayanOzellikler.length) {
        return x.caglayanOzellikler.slice(0, 5).join(" · ");
      }
      return "Profesyonel market ve serve-over soğutma — Çağlayan katalog serisi.";
    }

    function caglayanPdfHref(x) {
      if (x.caglayanKatalogPdf) return resolveProductImgSrc(x.caglayanKatalogPdf);
      if (x.prosoKatalogPdf) return resolveProductImgSrc(x.prosoKatalogPdf);
      if (x.caglayanKatalogUrl) return x.caglayanKatalogUrl;
      if (x.prosoKatalogUrl) return x.prosoKatalogUrl;
      return "";
    }

    function pdpSeriesEyebrow(x) {
      if (isCaglayanRefrigeration(x)) return caglayanSeriesEyebrow(x);
      if (x && String(x.kaynak || "") === "besos-vitrum") {
        var bp = [];
        if (x.category) bp.push(String(x.category));
        if (x.page != null) bp.push("P." + String(x.page));
        return bp.join(" · ") || "Besos Bar Design";
      }
      var parts = [];
      if (x.brand) parts.push(String(x.brand));
      var ref = deptLink(x.category, x.dept);
      if (ref && ref.label) parts.push(ref.label);
      return parts.join(" · ") || "Endüstriyel mutfak";
    }

    function pdpLeadParagraph(x) {
      if (isCaglayanRefrigeration(x)) return caglayanLeadParagraph(x);
      var desc =
        window.eqLang === "en" && x.descriptionEn && String(x.descriptionEn).trim()
          ? String(x.descriptionEn).trim()
          : x.description && String(x.description).trim()
            ? String(x.description).trim()
            : "";
      if (desc) return desc.split(/\n/)[0].slice(0, 320);
      var dim = formatOlculerLinePdp(x);
      if (dim) return __pdpT("pdp.inner_dims_prefix", "İç ölçüler: {dim}.", { dim: dim });
      var bullets = buildAboutBullets(splitSpecsCols(x.specs).left || x.specs, 3);
      if (bullets.length) return bullets.join(" · ");
      return (x.brand ? x.brand + " — " : "") + "Equsto kataloğundan endüstriyel mutfak ekipmanı.";
    }

    function pdpPdfHref(x) {
      var c = caglayanPdfHref(x);
      if (c) return c;
      var sp = String(x.specs || "");
      var m = sp.match(/Katalog sayfası:\s*(\d+)/i);
      if (m && /ozti|öztiryakiler/i.test(String(x.brand || "") + sp)) {
        return "https://oztiryakiler.com.tr/urunler/";
      }
      return "";
    }

    function pdpTeknikLines(x) {
      if (Array.isArray(x.teknik_ozellikler) && x.teknik_ozellikler.length) {
        return x.teknik_ozellikler.map(function (l) { return String(l || "").trim(); }).filter(Boolean);
      }
      var sp = splitSpecsCols(x.specs);
      var src = sp.right || sp.left || x.specs || "";
      return buildAboutBullets(src, 40);
    }

    function groupPdpSpecLines(lines) {
      var g = { temel: [], elektrik: [], sogutma: [], diger: [] };
      (lines || []).forEach(function (ln) {
        var low = String(ln).toLowerCase();
        if (/güç|voltaj|elektrik|kw|w\b|hz|amper|fiş/i.test(low)) g.elektrik.push(ln);
        else if (/soğutma|sıcaklık|kapasite|lt\b|°c|kompresör|gaz|buz|dondur/i.test(low)) g.sogutma.push(ln);
        else if (/boyut|genişlik|derinlik|yükseklik|mm\b|kg|ağırlık|uzunluk|en×|×/i.test(low)) g.temel.push(ln);
        else g.diger.push(ln);
      });
      return g;
    }

    function renderEpdpBuybox(x, cartU) {
      var parts = buyboxPriceParts(x);
      var priceHTML = parts.quoteOnly
        ? '<span class="eq-buybox-int" style="font-size:1.05rem;">' + esc(__pdpT("pdp.quote_for_contact", "Teklif için iletişim")) + "</span>"
        : parts.empty
          ? '<span class="eq-buybox-int">—</span>'
          : '<span class="eq-buybox-currency">₺</span><span class="eq-buybox-int">' +
            esc(parts.int) +
            "</span>" +
            (parts.frac ? '<span class="eq-buybox-frac">,' + esc(parts.frac) + "</span>" : "");
      var cartBtn =
        window.EqustoCart && EqustoCart.cartAddButtonAttrs
          ? "<button " + EqustoCart.cartAddButtonAttrs(cartU) + ">" + esc(__pdpT("pdp.add_to_cart", "Sepete ekle")) + "</button>"
          : "";
      var pfosHref = eqHtmlUrl(typeof window.equstoUrl === "function" ? window.equstoUrl("pfos") : "pfos.html");
      return (
        '<div class="eq-epdp-buybox" aria-label="' + esc(__pdpT("pdp.buybox_aria", "Satın al")) + '">' +
        '<div class="eq-buybox-price">' +
        priceHTML +
        "</div>" +
        (parts.quoteOnly
          ? '<div class="eq-buybox-kdv">' + esc(__pdpT("pdp.price_preparing", "Fiyat listesi hazırlanıyor — sepete ekleyip teklif isteyebilirsiniz.")) + '</div>'
          : '<div class="eq-buybox-kdv">' + esc(__pdpT("pdp.vat_included", "KDV dahil fiyat")) + '</div>') +
        '<div class="eq-product-actions">' +
        cartBtn +
        '<a class="eq-amz-btn-buynow" href="' +
        esc(pfosHref) +
        '">' + esc(__pdpT("nav.pfos", "Proje Fabrikası")) + "</a>" +
        "</div></div>"
      );
    }

    function renderEpdpFeaturesCol(x) {
      if (isCaglayanRefrigeration(x)) return renderCaglayanFeaturesCol(x);
      var html =
        '<div class="eq-epdp-panel eq-caglayan-panel"><h2>' +
        esc(__pdpT("pdp.features_heading", "Özellikler")) +
        '</h2><div class="eq-caglayan-acc">';
      var ref = deptLink(x.category, x.dept);
      var temel = [];
      if (x.brand) temel.push(__pdpT("pdp.brand_prefix", "Marka:") + " " + x.brand);
      if (x.sku || x.model) temel.push(__pdpT("pdp.product_code_prefix", "Ürün kodu:") + " " + (x.sku || x.model));
      if (ref.label) temel.push(__pdpT("pdp.category_prefix", "Kategori:") + " " + ref.label);
      var dim = formatOlculerLinePdp(x);
      if (dim) temel.push(__pdpT("pdp.dims_prefix", "Ölçüler:") + " " + dim);
      if (temel.length) {
        html +=
          '<details open><summary>' +
          esc(__pdpT("pdp.basic_info", "Temel bilgiler")) +
          '</summary><div class="eq-caglayan-acc__body"><ul>' +
          temel.map(function (l) { return "<li>" + esc(l) + "</li>"; }).join("") +
          "</ul></div></details>";
      }
      var groups = groupPdpSpecLines(pdpTeknikLines(x));
      [
        ["elektrik", __pdpT("pdp.spec_group_electric", "Elektrik")],
        ["sogutma", __pdpT("pdp.spec_group_cooling", "Soğutma")],
        ["diger", __pdpT("pdp.spec_group_other", "Diğer")],
      ].forEach(function (pair) {
        var key = pair[0];
        var title = pair[1];
        if (!groups[key].length) return;
        html +=
          "<details><summary>" +
          esc(title) +
          '</summary><div class="eq-caglayan-acc__body"><ul>' +
          groups[key].map(function (l) { return "<li>" + esc(l) + "</li>"; }).join("") +
          "</ul></div></details>";
      });
      if (!temel.length && !groups.elektrik.length && !groups.sogutma.length && !groups.diger.length) {
        html +=
          '<p class="eq-caglayan-acc__body">' +
          esc(__pdpT("pdp.specs_request_quote", "Detaylı teknik özellikler için teklif sürecinden talep edebilirsiniz.")) +
          "</p>";
      }
      html += "</div></div>";
      return html;
    }

    function renderEpdpDocsCol(x) {
      if (isCaglayanRefrigeration(x)) {
        return renderCaglayanDocsCol(x).replace(/eq-caglayan-drawings/g, "eq-epdp-drawings");
      }
      var pdf = pdpPdfHref(x);
      var contactHref = eqHtmlUrl(typeof window.equstoUrl === "function" ? window.equstoUrl("contact") : "contact.html");
      var pfosHref = eqHtmlUrl(typeof window.equstoUrl === "function" ? window.equstoUrl("pfos") : "pfos.html");
      var html =
        '<div class="eq-epdp-panel eq-caglayan-panel"><h2>' +
        esc(__pdpT("pdp.documents_heading", "Dökümanlar")) +
        '</h2><div class="eq-caglayan-acc">';
      if (pdf && pdf.indexOf(".pdf") >= 0) {
        html +=
          '<details open><summary>' +
          esc(__pdpT("pdp.datasheet", "Veri sayfası")) +
          '</summary><div class="eq-caglayan-acc__body"><a href="' +
          esc(pdf) +
          '" target="_blank" rel="noopener">' +
          esc(__pdpT("pdp.product_catalog_pdf", "Ürün kataloğu (PDF)")) +
          "</a></div></details>";
      }
      html +=
        "<details" +
        (pdf && pdf.indexOf(".pdf") >= 0 ? "" : " open") +
        '><summary>' +
        esc(__pdpT("pdp.quote_and_sales", "Teklif ve satış")) +
        '</summary><div class="eq-caglayan-acc__body"><a href="' +
        esc(contactHref) +
        '">' +
        esc(__pdpT("pdp.quote_contact", "Teklif ve iletişim")) +
        '</a> · <a href="' +
        esc(pfosHref) +
        '">' +
        esc(__pdpT("nav.pfos", "Proje Fabrikası")) +
        "</a></div></details>";
      if (x.linkKaynak) {
        html +=
          '<details><summary>' +
          esc(__pdpT("pdp.mfg_source", "Üretici kaynağı")) +
          '</summary><div class="eq-caglayan-acc__body"><a href="' +
          esc(x.linkKaynak) +
          '" target="_blank" rel="noopener">' +
          esc(__pdpT("pdp.mfg_source_link", "Üretici / kaynak sayfası")) +
          "</a></div></details>";
      }
      html +=
        '<details><summary>' + esc(__pdpT("pdp.technical_drawings", "Teknik çizimler")) + '</summary><div class="eq-caglayan-acc__body"><a href="#eq-epdp-drawings">' + esc(__pdpT("pdp.go_to_drawings", "Sayfadaki teknik görsellere git")) + '</a></div></details>';
      html += "</div></div>";
      return html;
    }

    function getEpdpDrawingImgs(x) {
      var out = [];
      var seen = Object.create(null);
      if (x && x.drawing) {
        var dSrc = resolveProductImgSrc(x.drawing);
        if (dSrc && !seen[dSrc]) {
          seen[dSrc] = 1;
          out.push({ src: dSrc, label: __pdpT("pdp.technical_drawing", "Teknik çizim") });
        }
      }
      if (isCaglayanRefrigeration(x)) {
        getCaglayanTeknikImgs(x).forEach(function (item) {
          if (!item.rel) return;
          var src = resolveProductImgSrc(item.rel);
          if (!src || seen[src]) return;
          seen[src] = 1;
          out.push({
            src: src,
            label: item.role === "kesit" ? __pdpT("pdp.section_drawing", "Kesit çizimi") : __pdpT("pdp.model_drawing", "Model ölçü çizimi"),
          });
        });
      }
      (x.images || []).forEach(function (rel) {
        if (!isLineArtProductImg(rel)) return;
        if (isCaglayanPdpThumbImg(rel)) return;
        var src = resolveProductImgSrc(rel);
        if (!src || seen[src]) return;
        seen[src] = 1;
        var label = isCaglayanKesitImg(rel)
          ? __pdpT("pdp.section_drawing", "Kesit çizimi")
          : isCaglayanModelDrawImg(rel)
            ? __pdpT("pdp.model_drawing", "Model ölçü çizimi")
            : __pdpT("pdp.technical_drawing", "Teknik çizim");
        out.push({ src: src, label: label });
      });
      return out.slice(0, 6);
    }

    function renderEpdpDrawings(x) {
      var tek = getEpdpDrawingImgs(x);
      if (!tek.length) return "";
      return (
        '<section class="eq-epdp-drawings eq-caglayan-drawings" id="eq-epdp-drawings">' +
        "<h2>" + esc(__pdpT("pdp.drawings_heading", "Teknik çizimler")) + "</h2>" +
        '<div class="eq-epdp-drawings-grid eq-caglayan-drawings-grid">' +
        tek
          .map(function (item) {
            return (
              '<img src="' +
              esc(item.src) +
              '" alt="' +
              esc(item.label || __pdpT("pdp.technical_drawing", "Teknik çizim")) +
              '" loading="lazy" decoding="async">'
            );
          })
          .join("") +
        "</div></section>"
      );
    }

    function bindEpdpGallery() {
      var mainEl = document.getElementById("eq-ph-main");
      var heroWrap = document.querySelector(".eq-epdp-hero .eq-product-hero-wrap, .eq-caglayan-hero .eq-product-hero-wrap");
      document.querySelectorAll(".eq-epdp-hero .eq-product-thumbs button, .eq-caglayan-hero .eq-product-thumbs button").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var s = btn.getAttribute("data-src");
          if (mainEl && s) {
            applyLineArtHeroState(mainEl, heroWrap, btn.getAttribute("data-lineart") === "1");
            mainEl.addEventListener(
              "load",
              function once() {
                mainEl.removeEventListener("load", once);
                applyProductPageAccentFromImg(mainEl);
              },
              { once: true }
            );
            mainEl.src = s;
          }
          document.querySelectorAll(".eq-epdp-hero .eq-product-thumbs button, .eq-caglayan-hero .eq-product-thumbs button").forEach(function (b) {
            b.classList.toggle("eq-product-thumb--active", b === btn);
          });
        });
      });
      if (mainEl && mainEl.tagName === "IMG") {
        if (mainEl.complete && mainEl.naturalWidth) applyProductPageAccentFromImg(mainEl);
        else
          mainEl.addEventListener(
            "load",
            function () {
              applyProductPageAccentFromImg(mainEl);
            },
            { once: true }
          );
      }
    }

    function renderCaglayanTeknikTable(tab) {
      if (!tab) return "";
      var h = tab.basliklar || [];
      var rows = tab.satirlar || [];
      if (!h.length && !rows.length) return "";
      var thead = h.length
        ? "<thead><tr>" + h.map(function (c) { return "<th>" + esc(c) + "</th>"; }).join("") + "</tr></thead>"
        : "";
      var tbody = rows
        .map(function (r) {
          return (
            "<tr>" +
            (r || []).map(function (c) { return "<td>" + esc(c) + "</td>"; }).join("") +
            "</tr>"
          );
        })
        .join("");
      return (
        '<div class="eq-caglayan-table-wrap"><table class="eq-caglayan-table">' +
        thead +
        "<tbody>" +
        tbody +
        "</tbody></table></div>"
      );
    }

    function renderCaglayanFeaturesCol(x) {
      var html = '<div class="eq-caglayan-panel"><h2>Özellikler</h2><div class="eq-caglayan-acc">';
      var oz = x.caglayanOzellikler || [];
      if (oz.length) {
        html +=
          "<details open><summary>Genel özellikler</summary><div class=\"eq-caglayan-acc__body\"><ul>" +
          oz.map(function (l) { return "<li>" + esc(l) + "</li>"; }).join("") +
          "</ul></div></details>";
      }
      var blocks = x.caglayanTeknikAkordeon || [];
      var dims = productDimsFrom(x);
      blocks.forEach(function (block) {
        var inner = "";
        (block.tablolar || []).forEach(function (tab) {
          var ft = dims.len ? filterCaglayanTabForProduct(tab, dims) : tab;
          if (!ft) return;
          if (tab.altBaslik) inner += "<p><b>" + esc(tab.altBaslik) + "</b></p>";
          inner += renderCaglayanTeknikTable(ft);
        });
        if (!inner) return;
        html +=
          "<details><summary>" +
          esc(block.baslik || __pdpT("pdp.technical_details", "Teknik detaylar")) +
          '</summary><div class="eq-caglayan-acc__body">' +
          inner +
          "</div></details>";
      });
      if (x.olculer && (x.olculer.genislik_mm || x.olculer.yukseklik_mm)) {
        var o = x.olculer;
        html +=
          "<details><summary>Bu varyant ölçüleri</summary><div class=\"eq-caglayan-acc__body\"><ul>" +
          (o.genislik_mm ? "<li>Genişlik: " + esc(o.genislik_mm) + " mm</li>" : "") +
          (o.derinlik_mm ? "<li>Derinlik: " + esc(o.derinlik_mm) + " mm</li>" : "") +
          (o.yukseklik_mm ? "<li>Yükseklik: " + esc(o.yukseklik_mm) + " mm</li>" : "") +
          "</ul></div></details>";
      }
      if (!oz.length && !blocks.length) {
        html += '<p class="eq-caglayan-acc__body">' + esc(__pdpT("pdp.specs_use_catalog", "Teknik özellikler için katalog PDF veya teklif sürecini kullanın.")) + '</p>';
      }
      html += "</div></div>";
      return html;
    }

    function renderCaglayanDocsCol(x) {
      var pdf = caglayanPdfHref(x);
      var pdfLabel = x.caglayanKatalogAdi || "Veri sayfası (PDF)";
      var src = x.linkKaynak || "";
      var html = '<div class="eq-caglayan-panel"><h2>Dökümanlar</h2><div class="eq-caglayan-acc">';
      if (pdf) {
        html +=
          "<details open><summary>Veri sayfası</summary><div class=\"eq-caglayan-acc__body\">" +
          '<a href="' +
          esc(pdf) +
          '" target="_blank" rel="noopener">' +
          esc(pdfLabel) +
          "</a> — ürün kataloğu (PDF).</div></details>";
      }
      html +=
        "<details" +
        (pdf ? "" : " open") +
        '><summary>Teklif ve satış</summary><div class="eq-caglayan-acc__body">' +
        '<a href="' +
        esc(eqHtmlUrl(typeof window.equstoUrl === "function" ? window.equstoUrl("contact") : "contact.html")) +
        '">Teklif ve iletişim</a> · ' +
        '<a href="' +
        esc(eqHtmlUrl(typeof window.equstoUrl === "function" ? window.equstoUrl("pfos") : "pfos.html")) +
        '">Proje Fabrikası</a></div></details>';
      if (src) {
        html +=
          "<details><summary>Üretici sayfası</summary><div class=\"eq-caglayan-acc__body\">" +
          '<a href="' +
          esc(src) +
          '" target="_blank" rel="noopener">caglayanrefrigeration.com</a></div></details>';
      }
      html +=
        '<details><summary>' + esc(__pdpT("pdp.technical_drawings", "Teknik çizimler")) + '</summary><div class="eq-caglayan-acc__body"><a href="#eq-epdp-drawings">' + esc(__pdpT("pdp.go_to_drawings", "Sayfadaki teknik görsellere git")) + '</a></div></details>';
      html += "</div></div>";
      return html;
    }

    function renderEpdpProduct(x, all) {
      var prodTitle = ((x.brand ? x.brand + " " : "") + (x.name || "Ürün")).slice(0, 80);
      document.title = prodTitle + " — Equsto";
      var root = document.getElementById("eq-product-root");
      if (root) {
        root.className = "eq-product-main eq-epdp" + (isCaglayanRefrigeration(x) ? " eq-caglayan-pdp" : "");
      }

      /* Canonical + OG meta güncellemeleri */
      try {
        var slug = productSlugEq(x);
        var path = eqPathForProductObj(x) || "/urun/" + slug;
        var canonUrl = "https://equsto.com" + path;
        var canonEl = document.querySelector('link[rel="canonical"]');
        if (canonEl) canonEl.href = canonUrl;
        var ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) ogTitle.content = prodTitle + ' · Equsto';
        var ogDesc = document.querySelector('meta[property="og:description"]');
        if (ogDesc) ogDesc.content = (x.description || x.name || '') + ' — Equsto endüstriyel mutfak kataloğu.';
        var ogUrl = document.querySelector('meta[property="og:url"]');
        if (ogUrl) ogUrl.content = canonUrl;
        var ogImg = document.querySelector('meta[property="og:image"]');
        if (ogImg && x.images && x.images[0]) ogImg.content = eqAbsoluteAssetUrl(x.images[0]);

        /* JSON-LD Product Schema (Merchant Listing — geçerli fiyat / SKU / kargo / iade) */
        var imgUrl = (x.images && x.images[0]) ? eqAbsoluteAssetUrl(x.images[0]) : "";
        var schema =
          window.EqustoMerchantSchema && typeof window.EqustoMerchantSchema.buildProductSchema === "function"
            ? window.EqustoMerchantSchema.buildProductSchema(x, { canonUrl: canonUrl, slug: slug, imgUrl: imgUrl })
            : {
                "@context": "https://schema.org",
                "@type": "Product",
                name: x.name || "",
                description: x.description || (x.name + " — Equsto endüstriyel mutfak ekipmanı."),
                brand: { "@type": "Brand", name: x.brand || "Equsto" },
                sku: String(x.sku || x.code || slug).slice(0, 50),
                url: canonUrl,
              };
        if (imgUrl && !schema.image) schema.image = imgUrl;
        var ldEl = document.getElementById('eq-product-ld');
        if (!ldEl) {
          ldEl = document.createElement('script');
          ldEl.id = 'eq-product-ld';
          ldEl.type = 'application/ld+json';
          document.head.appendChild(ldEl);
        }
        ldEl.textContent = JSON.stringify(schema);
        if (window.EqustoProductReviews && typeof window.EqustoProductReviews.applyToElement === "function") {
          window.EqustoProductReviews.applyToElement(ldEl, schema, x, slug);
        }

        /* BreadcrumbList JSON-LD */
        var bcSchema = {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": __pdpT("breadcrumb.home", "Ana Sayfa"), "item": "https://equsto.com/" },
            {
              "@type": "ListItem",
              "position": 2,
              "name": x.category || "Ekipman",
              "item":
                typeof window.equstoUrl === "function"
                  ? window.equstoUrl("shop")
                  : "https://equsto.com/shop",
            },
            { "@type": "ListItem", "position": 3, "name": x.name || 'Ürün', "item": canonUrl }
          ]
        };
        var bcLdEl = document.getElementById('eq-product-bc-ld');
        if (!bcLdEl) {
          bcLdEl = document.createElement('script');
          bcLdEl.id = 'eq-product-bc-ld';
          bcLdEl.type = 'application/ld+json';
          document.head.appendChild(bcLdEl);
        }
        bcLdEl.textContent = JSON.stringify(bcSchema);

        var skEl = document.getElementById("eq-product-sk");
        if (!skEl) {
          skEl = document.createElement("span");
          skEl.id = "eq-product-sk";
          skEl.style.display = "none";
          skEl.setAttribute("aria-hidden", "true");
          document.body.appendChild(skEl);
        }
        skEl.setAttribute("data-eq-page-sig", productEqSk(slug));
        skEl.textContent = productEqSk(slug);
      } catch(_) {}
      var ref = deptLink(x.category, x.dept);
      var bc = document.getElementById("eq-product-bc");
      if (bc) {
        if (x && String(x.kaynak || "") === "besos-vitrum") {
          var besosHref =
            typeof window.equstoUrl === "function" ? window.equstoUrl("besos") : "/besos";
          bc.innerHTML =
            '<a href="' +
            esc(eqHtmlUrl(eqShopHref())) +
            '">' +
            esc(__pdpT("breadcrumb.home", "Ana Sayfa")) +
            '</a> › <a href="' +
            esc(eqHtmlUrl(besosHref)) +
            '">Besos</a> › <span>' +
            esc((x.name || "").slice(0, 80)) +
            (x.name && x.name.length > 80 ? "…" : "") +
            "</span>";
        } else {
          bc.innerHTML =
            '<a href="' +
            esc(eqHtmlUrl(eqShopHref())) +
            '">' + esc(__pdpT("breadcrumb.home", "Ana Sayfa")) + '</a> › <a href="' +
            esc(eqHtmlUrl(ref.href)) +
            '">' +
            esc(ref.label) +
            "</a> › <span>" +
            esc((x.name || "").slice(0, 80)) +
            (x.name && x.name.length > 80 ? "…" : "") +
            "</span>";
        }
      }
      var imgs = collectProductImgs(x);
      var cartU = {
        c: x.category || "",
        b: x.brand || "",
        n: x.name || "",
        p: extractCartPrice(x.price, x),
      };
      var heroIdx = 0;
      for (var hi = 0; hi < imgs.length; hi++) {
        if (!imgs[hi].lineart) {
          heroIdx = hi;
          break;
        }
      }
      var heroItem = imgs.length ? imgs[heroIdx] : null;
      var heroRel =
        (heroItem && heroItem.rel) ||
        pickCaglayanHeroRel(x) ||
        oztiWebRelFromSku(x.sku || x.urun_kodu || x.model) ||
        "";
      var heroLineArt = heroItem && heroItem.lineart;
      var heroImg = heroItem
        ? '<img class="eq-product-hero-img' +
          (heroLineArt ? " eq-product-hero-img--lineart" : "") +
          '" id="eq-ph-main" src="' +
          esc(heroItem.src) +
          '"' +
          pdpImgFailAttr() +
          pdpImgDataAttrs(x, heroRel) +
          ' alt="' +
          esc(x.name) +
          '" fetchpriority="high" decoding="async">'
        : '<div class="eq-product-hero-img" style="display:flex;align-items:center;justify-content:center;font-size:13px;color:var(--eq-text-subtle);min-height:240px;">' + esc(__pdpT("pdp.no_image", "Görsel yok")) + '</div>';
      var thumbs = "";
      if (imgs.length > 1) {
        thumbs =
          '<div class="eq-product-thumbs eq-product-thumbs--vertical">' +
          imgs
            .map(function (item, i) {
              return (
                '<button type="button" data-src="' +
                esc(item.src) +
                '"' +
                (item.lineart ? ' data-lineart="1"' : "") +
                ' class="' +
                (i === 0 ? "eq-product-thumb--active" : "") +
                '" aria-label="' + esc(__pdpT("pdp.image_n", "Görsel {n}", { n: i + 1 })) + '" data-i18n-attr="aria-label:pdp.image_n" data-i18n-vars="n:' +
                (i + 1) +
                '"><img src="' +
                esc(item.src) +
                '"' +
                pdpImgFailAttr() +
                pdpImgDataAttrs(x, item.rel) +
                ' alt="" loading="lazy" decoding="async"></button>'
              );
            })
            .join("") +
          "</div>";
      }
      var keyFn = window.EqustoCart && EqustoCart.itemKey;
      var familyRail =
        keyFn && all && all.length ? renderFamilyRail(x, all, keyFn) : "";

      // Üstte family rail’de geçenleri alt şerit tekrar etmesin
      var exclude = Object.create(null);
      if (keyFn && all && all.length) {
        var topItems = pickRelatedProducts(x, all, keyFn).items || [];
        topItems.forEach(function (p) {
          var k = keyFn({ c: p.category || "", b: p.brand || "", n: p.name || "" });
          if (k) exclude[k] = 1;
        });
      }
      var relatedStrip =
        keyFn && all && all.length ? renderRelatedStrip(x, all, keyFn, exclude) : "";

      var pdf = pdpPdfHref(x);
      var contactHref = eqHtmlUrl(
        typeof window.equstoUrl === "function" ? window.equstoUrl("contact") : "contact.html"
      );
      var pfosHref = eqHtmlUrl(typeof window.equstoUrl === "function" ? window.equstoUrl("pfos") : "pfos.html");

      root.innerHTML =
        familyRail +
        '<div class="eq-epdp-hero eq-caglayan-hero">' +
        '<div class="eq-epdp-hero__media eq-caglayan-hero__media">' +
        '<div class="eq-product-gallery"><div class="eq-product-gallery-row">' +
        thumbs +
        '<div class="eq-product-hero-wrap' +
        (heroLineArt ? " eq-product-hero-wrap--lineart" : "") +
        '">' +
        heroImg +
        "</div></div></div></div>" +
        '<div class="eq-epdp-hero__copy eq-caglayan-hero__copy">' +
        '<p class="eq-epdp-eyebrow eq-caglayan-eyebrow">' +
        esc(pdpSeriesEyebrow(x)) +
        "</p>" +
        '<h1 class="eq-epdp-title eq-caglayan-title">' +
        esc(x.name || "") +
        "</h1>" +
        '<p class="eq-epdp-cod eq-caglayan-cod">' +
        esc(__pdpT("pdp.product_code_prefix", "Ürün kodu:")) +
        " <strong>" +
        esc(x.sku || x.model || x.urun_kodu || "—") +
        "</strong></p>" +
        '<p class="eq-epdp-lead eq-caglayan-lead">' +
        esc(pdpLeadParagraph(x)) +
        "</p>" +
        renderEpdpBuybox(x, cartU) +
        '<div class="eq-epdp-cta eq-caglayan-cta">' +
        (pdf && /\.pdf/i.test(pdf)
          ? '<a class="eq-caglayan-btn" href="' +
            esc(pdf) +
            '" target="_blank" rel="noopener">' +
            esc(__pdpT("pdp.pdf_catalog", "PDF katalog")) +
            "</a>"
          : "") +
        '<a class="eq-caglayan-btn" href="' +
        esc(contactHref) +
        '">' +
        esc(__pdpT("pdp.quote_contact", "Teklif ve iletişim")) +
        '</a>' +
        '<a class="eq-caglayan-btn eq-caglayan-btn--primary" href="' +
        esc(pfosHref) +
        '">' +
        esc(__pdpT("nav.pfos", "Proje Fabrikası")) +
        "</a>" +
        "</div></div></div>" +
        '<div class="eq-epdp-panels eq-caglayan-panels">' +
        renderEpdpFeaturesCol(x) +
        renderEpdpDocsCol(x) +
        "</div>" +
        renderEpdpDrawings(x) +
        relatedStrip +
        renderRecentlyViewed(x, all);

      bindEpdpGallery();
      bindFamilyRailFit();
      eqMbgBindRelated();
      (function bindPdpLightbox() {
        var lb = document.getElementById("eq-pdp-lightbox");
        var wrap = document.querySelector(".eq-epdp-hero .eq-product-hero-wrap, .eq-caglayan-hero .eq-product-hero-wrap");
        var hero = document.getElementById("eq-ph-main");
        if (!lb || !wrap || !hero || hero.tagName !== "IMG") return;
        var lbImg = lb.querySelector("img");
        var xb = lb.querySelector(".eq-pdp-lightbox-x");
        function openLb() {
          if (!lbImg) return;
          lbImg.src = hero.src;
          lbImg.alt = hero.alt || "";
          var lineart = hero.classList.contains("eq-product-hero-img--lineart");
          lb.classList.toggle("eq-pdp-lightbox--lineart", lineart);
          lbImg.classList.toggle("eq-product-hero-img--lineart", lineart);
          lb.hidden = false;
        }
        function closeLb() {
          lb.hidden = true;
          lb.classList.remove("eq-pdp-lightbox--lineart");
          if (lbImg) lbImg.classList.remove("eq-product-hero-img--lineart");
        }
        wrap.style.cursor = "zoom-in";
        wrap.addEventListener("click", openLb);
        hero.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openLb();
          }
        });
        hero.setAttribute("tabindex", "0");
        hero.setAttribute("role", "button");
        hero.setAttribute("aria-label", __pdpT("pdp.enlarge_image", "Görseli büyüt"));
        lb.addEventListener("click", closeLb);
        if (xb) {
          xb.addEventListener("click", function (e) {
            e.stopPropagation();
            closeLb();
          });
        }
        if (!window.__eqPdpLbEscBound) {
          window.__eqPdpLbEscBound = true;
          document.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && lb && !lb.hidden) closeLb();
          });
        }
      })();
    }

    function renderProduct(x, all) {
      renderEpdpProduct(x, all);
    }
    window.__eqRenderProduct = renderProduct;

    function bootProductPage() {
      if (/\/besos\/modul\/[^/?#]+/i.test(location.pathname || "")) {
        if (typeof window.__eqBootBesosModulPdp === "function") {
          window.__eqBootBesosModulPdp();
          return;
        }
        var besosRoot = document.getElementById("eq-product-root");
        if (besosRoot) {
          besosRoot.innerHTML =
            '<div class="eq-product-miss">' +
            esc(__pdpT("pdp.besos_loader_waiting", "Besos modül yükleyici bekleniyor… Sayfayı yenileyin.")) +
            "</div>";
        }
        return;
      }
      var bcHome = document.getElementById("eq-product-bc-home");
      if (bcHome && typeof window.equstoUrl === "function") bcHome.href = window.equstoUrl("shop");
      if (window.EqFilterColumn) {
        EqFilterColumn.buildBrands([], "", function () {});
      }
      var qs = new URLSearchParams(location.search || "");
      if (!window.EqustoShopCatalog || typeof window.EqustoShopCatalog.load !== "function") {
        document.getElementById("eq-product-root").innerHTML =
          '<div class="eq-product-miss">Katalog yükleyici yok. Sayfayı yenileyin; <code>ecom-data.js</code> ve <code>eq-shop-catalog-bootstrap.js</code> yüklü olmalı.</div>';
        return;
      }
      var seoReady = fetch("/data/eq-category-seo.json", { credentials: "same-origin", cache: "default" })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (j) { window.__eqCategorySeo = j; })
        .catch(function () {});
      seoReady.finally(function () {
      var priceReady = Promise.all([
        window.EqustoKurLive && typeof window.EqustoKurLive.fetchKur === "function"
          ? window.EqustoKurLive.fetchKur(true)
          : Promise.resolve(),
        window.EqFiyatlarBridge && window.EqFiyatlarBridge.load
          ? window.EqFiyatlarBridge.load()
          : Promise.resolve(),
      ]);
      priceReady.finally(function () {
      var catalogLoad =
        typeof window.EqustoShopCatalog.loadForProductPage === "function"
          ? window.EqustoShopCatalog.loadForProductPage()
          : window.EqustoShopCatalog.load();
      catalogLoad
        .then(function (all) {
          var x = findRaw(all, qs);
          if (!x && typeof window.EqustoShopCatalog.load === "function") {
            return window.EqustoShopCatalog.load().then(function (full) {
              var y = findRaw(full, qs);
              if (y && y.dept) {
                var canon = eqPathForProductObj(y);
                if (canon) {
                  var want = eqHtmlUrl(canon);
                  if (want && location.pathname.replace(/\/+$/, "") !== canon.replace(/\/+$/, "")) {
                    location.replace(want + (location.search || ""));
                    return null;
                  }
                }
              }
              return { x: y, all: full };
            });
          }
          return Promise.resolve({ x: x, all: all });
        })
        .then(function (pack) {
          if (!pack) return;
          var x = pack.x;
          var all = pack.all;
          if (!x) {
            clearProductPageAccent();
            document.getElementById("eq-product-root").innerHTML =
              '<div class="eq-product-miss">' + esc(__pdpT("pdp.not_found", "Bu ürün bulunamadı. Katalogdan tekrar seçin veya ana sayfaya dönün.")) + '</div>';
            var b = document.getElementById("eq-product-bc");
            if (b) b.innerHTML = '<a href="' + esc(eqHtmlUrl(eqShopHref())) + '">' + esc(__pdpT("breadcrumb.home", "Ana Sayfa")) + '</a> › <span>' + esc(__pdpT("pdp.breadcrumb_product", "Ürün")) + '</span>';
            return;
          }
          if (window.EqFiyatlarBridge && window.EqFiyatlarBridge.applyToRaw) {
            window.EqFiyatlarBridge.applyToRaw(x);
          }
          try {
            renderProduct(x, all);
            /* Son görüntülenen ürünleri localStorage'a kaydet (max 12) */
            try {
              var _slug = productSlugEq(x);
              var _key = 'eq_recently_viewed';
              var _rv = JSON.parse(localStorage.getItem(_key) || '[]');
              _rv = _rv.filter(function(s){ return s !== _slug; });
              _rv.unshift(_slug);
              if (_rv.length > 12) _rv.length = 12;
              localStorage.setItem(_key, JSON.stringify(_rv));
            } catch(_) {}
          } catch (renderErr) {
            var msg = renderErr && renderErr.message ? String(renderErr.message) : String(renderErr);
            document.getElementById("eq-product-root").innerHTML =
              '<div class="eq-product-miss">' + esc(__pdpT("pdp.render_error", "Sayfa oluşturulurken hata:")) + ' ' +
              esc(msg) +
              "</div>";
            var bc2 = document.getElementById("eq-product-bc");
            if (bc2) bc2.innerHTML = '<a href="' + esc(eqHtmlUrl(eqShopHref())) + '">' + esc(__pdpT("breadcrumb.home", "Ana Sayfa")) + '</a> › <span>' + esc(__pdpT("pdp.breadcrumb_error", "Hata")) + '</span>';
          }
        })
        .catch(function (err) {
          clearProductPageAccent();
          var msg =
            err && err.message
              ? String(err.message)
              : __pdpT("pdp.load_error_network", "Ağ veya dosya hatası (file:// ise Katalogu-Ac.bat / npm run dev kullanın).");
          document.getElementById("eq-product-root").innerHTML =
            '<div class="eq-product-miss">' + esc(__pdpT("pdp.load_error", "Ürün verisi yüklenemedi.")) + ' ' + esc(msg) + "</div>";
          var bc3 = document.getElementById("eq-product-bc");
          if (bc3) bc3.innerHTML = '<a href="' + esc(eqHtmlUrl(eqShopHref())) + '">' + esc(__pdpT("breadcrumb.home", "Ana Sayfa")) + '</a> › <span>' + esc(__pdpT("pdp.breadcrumb_failed", "Yüklenemedi")) + '</span>';
        });
      });
    });
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", startProductPageBoot);
    } else {
      startProductPageBoot();
    }

    function startProductPageBoot() {
      function go() {
        bootProductPage();
      }
      try {
        if (window.eqI18nReady && typeof window.eqI18nReady.then === "function") {
          window.eqI18nReady.then(go).catch(go);
          return;
        }
      } catch (_) {}
      go();
    }
