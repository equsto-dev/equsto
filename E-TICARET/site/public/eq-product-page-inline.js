/**
 * ═══════════════════════════════════════════════════════════════════════════
 * KİLİT: E-PDP ürün detay (PDP). renderProduct → renderEpdpProduct.
 * Buybox: public/pdp-buybox-cafemarkt-KILIT.txt (Cafemarkt tarzı)
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
      if (typeof window.eqProductImgSrc === "function") {
        try {
          var via = window.eqProductImgSrc(p);
          if (via) return via;
        } catch (_) {}
      }
      if (typeof window.equstoDataAssetHref === "function") {
        try {
          return window.equstoDataAssetHref(p);
        } catch (_) {}
      }
      var s = String(p || "")
        .replace(/\\/g, "/")
        .replace(/^\.\//, "")
        .replace(/^\/+/, "")
        .replace(/^data\//i, "");
      if (/^https?:\/\//i.test(s)) return s;
      if (/^images\//i.test(s)) {
        return typeof window.eqAttrPath === "function" ? window.eqAttrPath(s) : "/" + s;
      }
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

    function formatPdpPriceDisplay(raw, item) {
      var row = item || { price: raw };
      if (buyboxPriceParts(row).quoteOnly) {
        return __pdpT("pdp.quote_for_contact", "Teklif için iletişim");
      }
      return extractCartPrice(raw, item);
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
      var sl =
        (typeof window.eqProductSlug === "function" ? window.eqProductSlug(x) : "") ||
        idSlug ||
        productSlugEq(x);
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

    var COMPLEMENT_CATEGORY_SLUGS = {
      "yardimci-ekipmanlar": true,
      "mutfak-aksesuar": true,
      "bar-aksesuarlari": true,
      "bar-aksesuarlari-tepsiler": true,
      "bain-marie-celik-saklama-kaplari": true,
      "kombi-konveksiyonlu-firin-aksesuarlar": true,
      "kombi-konveksiyonlu-f-rin-aksesuarlar": true,
      "cay-servis-aksesuarlari": true,
      "gastronom-kuvetler": true,
      kuvet: true,
    };

    function isComplementProduct(p, x) {
      if (!p || !x) return false;
      var curBrand = String(x.brand || "").trim();
      var pBrand = String(p.brand || "").trim();
      var curCat = String(x.category || "");
      var pCat = String(p.category || "");
      if (curBrand && pBrand === curBrand && pCat && pCat !== curCat) return true;
      if (pCat && COMPLEMENT_CATEGORY_SLUGS[pCat]) return true;
      var hay = (String(p.name || "") + " " + pCat).toLocaleLowerCase("tr");
      return /kartuş|kartus|filtre|aksesuar|yedek|kapak|conta|adaptör|adaptor|servis\s*tepsi|küvet|kuvet/i.test(
        hay,
      );
    }

    /** Pişirme hattı / hazırlık ailesi — tamamlayıcı ürün skorlaması için rol tespiti. */
    var COOKLINE_ROLES = {
      fritoz: true,
      izgara: true,
      kuzine: true,
      ocak: true,
      firin: true,
      kaynatma: true,
      "makarna-pisirici": true,
      "devrilir-tava": true,
    };

    var PREP_ROLES = {
      kiyma: true,
      dilimleme: true,
      "kemik-testere": true,
      "hamur-yogurma": true,
      "hamur-acma": true,
      "sebze-dograma": true,
      vakum: true,
    };

    var ROLE_COMPLEMENTS = {
      fritoz: ["izgara", "fritoz", "kuzine", "kaynatma", "devrilir-tava", "makarna-pisirici", "firin", "ocak"],
      izgara: ["fritoz", "izgara", "kuzine", "kaynatma", "devrilir-tava", "ocak", "firin"],
      kuzine: ["fritoz", "izgara", "kuzine", "kaynatma", "ocak"],
      ocak: ["izgara", "fritoz", "kuzine", "kaynatma", "ocak"],
      firin: ["kuzine", "izgara", "fritoz", "kaynatma", "firin"],
      kaynatma: ["fritoz", "izgara", "kuzine", "kaynatma", "devrilir-tava"],
      "makarna-pisirici": ["fritoz", "izgara", "kaynatma", "kuzine"],
      "devrilir-tava": ["fritoz", "izgara", "kuzine", "kaynatma"],
      kiyma: ["dilimleme", "kemik-testere", "hamur-yogurma", "vakum", "sebze-dograma"],
      dilimleme: ["kiyma", "kemik-testere", "vakum", "hamur-yogurma", "sebze-dograma"],
      "kemik-testere": ["kiyma", "dilimleme", "vakum", "hamur-yogurma"],
      "hamur-yogurma": ["hamur-acma", "sebze-dograma", "kiyma", "dilimleme"],
      "hamur-acma": ["hamur-yogurma", "sebze-dograma"],
      "sebze-dograma": ["hamur-yogurma", "hamur-acma", "kiyma", "dilimleme"],
      vakum: ["kiyma", "dilimleme", "kemik-testere", "hamur-yogurma"],
    };

    function productHaystack(p) {
      return (
        String((p && p.name) || "") +
        " " +
        String((p && p.category) || "") +
        " " +
        String((p && p.dept) || "")
      ).toLocaleLowerCase("tr");
    }

    function detectProductRole(p) {
      if (!p) return "";
      var hay = productHaystack(p);
      var cat = String(p.category || "");
      var nameHay = String((p && p.name) || "").toLocaleLowerCase("tr");

      if (/kemik\s*testere|et\s*kemik\b|kemik\s*testere/.test(nameHay)) return "kemik-testere";
      if (/kıyma|kiyma/.test(nameHay) && !/kemik/.test(nameHay)) return "kiyma";
      if (/dilimleme|dilimleyici|dilim\s*mak|gida-dilim|gıda-dilim/.test(nameHay)) return "dilimleme";
      if (/vakum\s*paket|vakum\s*mak|setustu-vakum|setüstü\s*vakum/.test(nameHay) || (cat.indexOf("vakum") !== -1 && /vakum/.test(nameHay))) {
        return "vakum";
      }
      if (/hamur\s*yoğurma|hamur\s*yogurma|spiral\s*mikser|planetary/.test(nameHay)) return "hamur-yogurma";
      if (/hamur\s*açma|hamur\s*acma/.test(nameHay)) return "hamur-acma";
      if (/sebze\s*do[ğg]rama|do[ğg]rama\s*mak/.test(nameHay)) return "sebze-dograma";

      if (/fritöz|fritoz/.test(hay)) return "fritoz";
      if (/devrilir\s*tava|devrilir\s*tepsi/.test(hay)) return "devrilir-tava";
      if (/makarna\s*pişir|makarna\s*pisir/.test(hay)) return "makarna-pisirici";
      if (/kaynat|kazan/.test(hay) && (p.dept === "pisirme" || /pişirme|pisirme/.test(hay))) return "kaynatma";
      if (/konveksiyon|kombi\s*fırın|kombi\s*firin|kombin\s*fırın/.test(hay)) return "firin";
      if (/kuzine/.test(hay)) return "kuzine";
      if (/ızgara|izgara|powergrill|grill/.test(hay) && !/\bocak\b/.test(hay)) return "izgara";
      if (/\bocak\b/.test(hay) && p.dept === "pisirme") return "ocak";

      return "";
    }

    function inferRoleFromCategory(p) {
      if (!p) return "";
      var cat = String(p.category || "");
      var nameHay = String((p && p.name) || "").toLocaleLowerCase("tr");
      if (/et-kiyma-ve-vakum/.test(cat)) {
        if (/kemik|testere/.test(nameHay)) return "kemik-testere";
        if (/vakum/.test(nameHay)) return "vakum";
      }
      if (/fritoz/.test(cat)) return "fritoz";
      if (/izgar/.test(cat)) return "izgara";
      if (/kuzin/.test(cat)) return "kuzine";
      if (/kaynat|devrilir/.test(cat)) return /devrilir/.test(cat) ? "devrilir-tava" : "kaynatma";
      if (/makarna-pisir/.test(cat)) return "makarna-pisirici";
      if (/ocak/.test(cat) && p.dept === "pisirme") return "ocak";
      if (/firin|konveksiyon/.test(cat)) return "firin";
      if (/kiyma/.test(cat)) return "kiyma";
      if (/dilim/.test(cat)) return "dilimleme";
      if (/hamur-yogurma/.test(cat)) return "hamur-yogurma";
      if (/hamur-acma/.test(cat)) return "hamur-acma";
      if (/vakum/.test(cat)) return "vakum";
      if (/sebze-dograma/.test(cat)) return "sebze-dograma";
      if (/kemik/.test(cat)) return "kemik-testere";
      return "";
    }

    function extractSeriesHints(p) {
      var hay = String((p && p.name) || "");
      var hints = [];
      var m = hay.match(/\b(900XP|700XP|600XP|500XP|400XP)\b/i);
      if (m) hints.push(m[1].toUpperCase());
      m = hay.match(/Seri\s*(\d{3})/i);
      if (m) hints.push("SERI-" + m[1]);
      if (/modüler\s*pişirme|moduler\s*pisirme/i.test(hay)) hints.push("MODULER-PISIRME");
      m = hay.match(/\b(\d{3,4})\s*mm\b/i);
      if (m) hints.push("W-" + m[1]);
      return hints;
    }

    function seriesMatchScore(a, b) {
      var sa = extractSeriesHints(a);
      var sb = extractSeriesHints(b);
      var score = 0;
      for (var i = 0; i < sa.length; i++) {
        if (sb.indexOf(sa[i]) === -1) continue;
        if (/XP|SERI|MODULER/.test(sa[i])) score += 35;
        else if (/^W-/.test(sa[i])) score += 15;
      }
      return score;
    }

    function brandsMatch(a, b) {
      var ba = String((a && a.brand) || "").trim().toLocaleLowerCase("tr");
      var bb = String((b && b.brand) || "").trim().toLocaleLowerCase("tr");
      if (!ba || !bb) return false;
      if (ba === bb) return true;
      if (ba.indexOf("electrolux") !== -1 && bb.indexOf("electrolux") !== -1) return true;
      if (ba.indexOf("atalay") !== -1 && bb.indexOf("atalay") !== -1) return true;
      if (ba.indexOf("öztiryakiler") !== -1 && bb.indexOf("öztiryakiler") !== -1) return true;
      if (ba.indexOf("oztiryakiler") !== -1 && bb.indexOf("oztiryakiler") !== -1) return true;
      return false;
    }

    function isWeakAccessoryProduct(p) {
      if (!p) return true;
      var pCat = String(p.category || "");
      if (COMPLEMENT_CATEGORY_SLUGS[pCat]) return true;
      var hay = (String(p.name || "") + " " + pCat).toLocaleLowerCase("tr");
      return /aksesuar|yedek|kapak|conta|adaptör|adaptor|servis\s*tepsi|kartuş|kartus|filtre|küvet|kuvet|sepet|kalıp|kalip|tepsi/.test(
        hay,
      );
    }

    function scoreComplementCandidate(p, x, curRole) {
      var wantRoles = ROLE_COMPLEMENTS[curRole];
      if (!wantRoles) return isComplementProduct(p, x) ? 12 : 0;

      if (isWeakAccessoryProduct(p) && (COOKLINE_ROLES[curRole] || PREP_ROLES[curRole])) return 0;

      var pRole = detectProductRole(p) || inferRoleFromCategory(p);
      if (!pRole) {
        if (isComplementProduct(p, x) && !COOKLINE_ROLES[curRole]) return 8;
        return 0;
      }

      var idx = wantRoles.indexOf(pRole);
      if (idx === -1) return 0;

      var score = 120 - idx * 10;

      if (COOKLINE_ROLES[curRole]) {
        if (brandsMatch(p, x)) score += 45;
        score += seriesMatchScore(x, p);
        if (p.dept === x.dept) score += 12;
      } else if (PREP_ROLES[curRole]) {
        var pDept = String(p.dept || "");
        if (pDept === "hazirlik" || pDept === "set-ustu-mutfak") score += 15;
        if (brandsMatch(p, x)) score += 20;
      }

      return score;
    }

    /** Aynı rolden yığılma olmasın: önce her tamamlayıcı rolden en iyi aday, sonra skora göre doldur. */
    function diversifyRoleComplements(scored, curRole, maxN) {
      if (!scored.length) return [];
      var wantRoles = ROLE_COMPLEMENTS[curRole];
      if (!wantRoles || scored.length <= maxN) {
        return scored.slice(0, maxN).map(function (row) {
          return row.p;
        });
      }
      var byRole = Object.create(null);
      for (var di = 0; di < scored.length; di++) {
        var row = scored[di];
        var role = detectProductRole(row.p) || inferRoleFromCategory(row.p);
        if (!role || byRole[role]) continue;
        byRole[role] = row;
      }
      var out = [];
      var used = Object.create(null);
      for (var wi = 0; wi < wantRoles.length && out.length < maxN; wi++) {
        var pick = byRole[wantRoles[wi]];
        if (!pick) continue;
        var pk = pick.p.id || pick.p.slug || pick.p.name;
        if (used[pk]) continue;
        used[pk] = 1;
        out.push(pick.p);
      }
      for (var si = 0; si < scored.length && out.length < maxN; si++) {
        var sp = scored[si].p;
        var sk = sp.id || sp.slug || sp.name;
        if (used[sk]) continue;
        used[sk] = 1;
        out.push(sp);
      }
      return out;
    }

    /** Bağlama göre tamamlayıcı ürünler (pişirme hattı / et-hazırlık ailesi); yoksa marka aksesuarı. */
    function pickComplementaryProducts(x, all, keyFn, excludeKeys, max) {
      if (!x || !all || !all.length) return [];
      if (isMarketReyonProduct(x)) return pickRelatedExtras(x, all, keyFn, excludeKeys, max);
      if (!keyFn) return [];
      var curKey = keyFn({ c: x.category || "", b: x.brand || "", n: x.name || "" });
      var maxN = max || 24;
      var curRole = detectProductRole(x) || inferRoleFromCategory(x);

      if (curRole && ROLE_COMPLEMENTS[curRole]) {
        var scored = [];
        var seen = Object.create(null);
        for (var ri = 0; ri < all.length; ri++) {
          var rp = all[ri];
          if (!rp) continue;
          var rk = keyFn({ c: rp.category || "", b: rp.brand || "", n: rp.name || "" });
          if (!rk || rk === curKey || seen[rk]) continue;
          if (excludeKeys && excludeKeys[rk]) continue;
          var rs = scoreComplementCandidate(rp, x, curRole);
          if (rs <= 0) continue;
          seen[rk] = 1;
          scored.push({ p: rp, s: rs });
        }
        scored.sort(function (a, b) {
          if (b.s !== a.s) return b.s - a.s;
          return String(a.p.name || "").localeCompare(String(b.p.name || ""), "tr", { sensitivity: "base" });
        });
        var roleOut = diversifyRoleComplements(scored, curRole, maxN);
        if (roleOut.length >= 4) return roleOut.slice(0, maxN);
        for (var fi = 0; fi < all.length && roleOut.length < maxN; fi++) {
          var fp = all[fi];
          if (!fp) continue;
          var fk = keyFn({ c: fp.category || "", b: fp.brand || "", n: fp.name || "" });
          if (!fk || fk === curKey || seen[fk]) continue;
          if (excludeKeys && excludeKeys[fk]) continue;
          if (isComplementProduct(fp, x)) {
            seen[fk] = 1;
            roleOut.push(fp);
          }
        }
        if (roleOut.length >= 4) return roleOut.slice(0, maxN);
      }

      var primary = [];
      var fallback = [];
      var seenLegacy = Object.create(null);
      for (var i = 0; i < all.length; i++) {
        var p = all[i];
        if (!p) continue;
        var k = keyFn({ c: p.category || "", b: p.brand || "", n: p.name || "" });
        if (!k || k === curKey || seenLegacy[k]) continue;
        if (excludeKeys && excludeKeys[k]) continue;
        seenLegacy[k] = 1;
        if (isComplementProduct(p, x)) primary.push(p);
        else if (!curRole || !COOKLINE_ROLES[curRole]) fallback.push(p);
      }
      primary.sort(function (a, b) {
        return String(a.name || "").localeCompare(String(b.name || ""), "tr", { sensitivity: "base" });
      });
      fallback.sort(function (a, b) {
        return String(a.name || "").localeCompare(String(b.name || ""), "tr", { sensitivity: "base" });
      });
      var out = primary.concat(fallback);
      if (out.length < 4) {
        var extra = pickRelatedExtras(x, all, keyFn, excludeKeys, max);
        for (var ei = 0; ei < extra.length && out.length < maxN; ei++) {
          var ek = keyFn({ c: extra[ei].category || "", b: extra[ei].brand || "", n: extra[ei].name || "" });
          if (ek && !seenLegacy[ek]) {
            out.push(extra[ei]);
            seenLegacy[ek] = 1;
          }
        }
      }
      return out.slice(0, maxN);
    }

    function pdpThumbSrcUrl(p) {
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
      return src ? eqHtmlUrl(src) : "";
    }

    function pdpCartRowFromProduct(p) {
      return {
        n: p.name || "",
        b: p.brand || "",
        c: p.category || "",
        p: p.price || "",
        img: pdpThumbSrcUrl(p),
        raw: p,
      };
    }

    /** Dahili fiyat listesi / iskonto satırları müşteriye gösterilmez. */
    function isInternalPriceSpecLine(ln) {
      var t = String(ln || "").trim();
      if (!t) return false;
      if (/^liste fiyatı/i.test(t)) return true;
      if (/^bayi\b/i.test(t)) return true;
      if (/^equsto\b/i.test(t) && /(satış|fiyat|eur|tl|kar)/i.test(t)) return true;
      if (/^hesap\s*:/i.test(t)) return true;
      if (/^kur\s*:/i.test(t)) return true;
      if (/^kaynak\s*:/i.test(t)) return true;
      if (/iskonto/i.test(t) && /liste|eur|bayi|kalan|%/i.test(t)) return true;
      return false;
    }

    function publicSpecsText(specs) {
      return String(specs || "")
        .split(/\r?\n/)
        .filter(function (ln) {
          return !isInternalPriceSpecLine(ln);
        })
        .join("\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
    }

    /** Specs metninden "Bu ürün hakkında" bullet üretici: ilk N anlamlı satır. */
    function buildAboutBullets(specs, max) {
      var s = publicSpecsText(specs);
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
      var s = publicSpecsText(specs);
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
        var specsPublic = publicSpecsText(x.specs);
        if (!specsPublic.trim()) return "";
        return (
          '<div class="eq-product-specs"><h2>' + esc(__pdpT("pdp.specs_heading", "Teknik özellikler ve açıklama")) + '</h2><pre>' +
          esc(specsPublic) +
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
        '<p class="eq-specs-note">' +
        esc(__pdpT("pdp.specs_all_sizes_note", "Tüm uzunluk ve derinlik seçenekleri üretici kataloğunda listelenir.")) +
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
      var items = pickComplementaryProducts(x, all, keyFn, excludeKeys, 24);
      if (!items.length) return "";
      var addLbl = __pdpT("plp.add_to_cart", "SEPETE EKLE");
      var cells = items
        .map(function (p) {
          var k = keyFn({ c: p.category || "", b: p.brand || "", n: p.name || "" });
          var img = renderPdpThumbImg(p);
          var lbl = esc((p.name || "").trim());
          var price = esc(formatPdpPriceDisplay(p.price, p));
          var pHref = productSlugEq(p)
            ? eqPathForProductObj(p) || "/urun/" + productSlugEq(p)
            : "product.html?p=" + esc(encodeURIComponent(k));
          var cartRow = pdpCartRowFromProduct(p);
          var cartBtn =
            window.EqustoCart && typeof window.EqustoCart.cartAddButtonAttrs === "function"
              ? '<button class="eq-mbg-plp-card__btn" ' +
                window.EqustoCart.cartAddButtonAttrs(cartRow) +
                ">" +
                esc(addLbl) +
                "</button>"
              : "";
          return (
            '<article class="eq-mbg-plp-card">' +
            '<a class="eq-mbg-plp-card__img" href="' +
            esc(eqHtmlUrl(pHref)) +
            '">' +
            img +
            "</a>" +
            '<a class="eq-mbg-plp-card__name" href="' +
            esc(eqHtmlUrl(pHref)) +
            '">' +
            lbl +
            "</a>" +
            '<div class="eq-mbg-stars" aria-hidden="true"><span class="eq-mbg-stars-on">★★★★</span><span class="eq-mbg-stars-off">☆</span></div>' +
            (price ? '<div class="eq-mbg-plp-card__price">' + price + "</div>" : "") +
            cartBtn +
            "</article>"
          );
        })
        .join("");
      return (
        '<section class="eq-mbg-related eq-mbg-complementary" aria-label="' +
        esc(__pdpT("pdp.mbg_complementary_aria", "Tamamlayıcı ürünler")) +
        '">' +
        '<div class="eq-mbg-head">' +
        '<h2 class="eq-mbg-title">' +
        esc(__pdpT("pdp.mbg_complementary_title", "Tamamlayıcı Ürünler")) +
        "</h2>" +
        "</div>" +
        '<div class="eq-mbg-wrap">' +
        '<button type="button" class="eq-mbg-arrow eq-mbg-prev" aria-label="' +
        esc(__pdpT("pdp.mbg_prev", "Önceki")) +
        '" onclick="eqMbgScroll(-1)">' +
        '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        "</button>" +
        '<button type="button" class="eq-mbg-arrow eq-mbg-next" aria-label="' +
        esc(__pdpT("pdp.mbg_next", "Sonraki")) +
        '" onclick="eqMbgScroll(1)">' +
        '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        "</button>" +
        '<div class="eq-mbg-track" id="eq-mbg-track">' +
        cells +
        "</div>" +
        "</div>" +
        '<div class="eq-mbg-dots" id="eq-mbg-dots" role="tablist" aria-label="' +
        esc(__pdpT("pdp.mbg_dots_aria", "Sayfa")) +
        '"></div>' +
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
      var dotsHost = document.getElementById("eq-mbg-dots");
      if (!tr) return;
      var w = Math.max(1, tr.clientWidth);
      var totalPages = Math.max(1, Math.ceil(tr.scrollWidth / w));
      var page = Math.min(totalPages, Math.floor(tr.scrollLeft / w) + 1);
      if (dotsHost) {
        var dots = "";
        for (var di = 1; di <= totalPages; di++) {
          dots +=
            '<button type="button" class="eq-mbg-dot' +
            (di === page ? " is-active" : "") +
            '" data-page="' +
            di +
            '" role="tab" aria-selected="' +
            (di === page ? "true" : "false") +
            '" aria-label="' +
            esc(__pdpT("pdp.mbg_page_dot", "Sayfa {page}", { page: di })) +
            '"></button>';
        }
        dotsHost.innerHTML = dots;
        dotsHost.querySelectorAll(".eq-mbg-dot").forEach(function (btn) {
          if (btn.__eqMbgDotBound) return;
          btn.__eqMbgDotBound = true;
          btn.addEventListener("click", function () {
            var pg = Number(btn.getAttribute("data-page")) || 1;
            tr.scrollTo({ left: (pg - 1) * w, behavior: "smooth" });
          });
        });
      }
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
      try {
        if (window.EqustoProductTint && typeof window.EqustoProductTint.refreshPlp === "function") {
          window.EqustoProductTint.refreshPlp(tr.parentElement || tr);
        }
      } catch (_) {}
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
        if (o.genislik_mm) parts.push(__pdpT("pdp.dim_length", "Uzunluk") + " " + o.genislik_mm + " mm");
        if (o.derinlik_mm) parts.push(__pdpT("pdp.dim_depth", "Derinlik") + " " + o.derinlik_mm + " mm");
        if (o.yukseklik_mm) parts.push(__pdpT("pdp.dim_height", "Yükseklik") + " " + o.yukseklik_mm + " mm");
      }
      if (x.caglayanModelKod) parts.push(String(x.caglayanModelKod));
      if (parts.length) return parts.join(" · ");
      if (x.caglayanOzellikler && x.caglayanOzellikler.length) {
        return x.caglayanOzellikler.slice(0, 5).join(" · ");
      }
      return __pdpT(
        "pdp.caglayan_lead_fallback",
        "Profesyonel market ve serve-over soğutma — Çağlayan katalog serisi."
      );
    }

    function caglayanPdfHref(x) {
      if (x.caglayanKatalogPdf) return resolveProductImgSrc(x.caglayanKatalogPdf);
      if (x.prosoKatalogPdf) return resolveProductImgSrc(x.prosoKatalogPdf);
      if (x.caglayanKatalogUrl) return x.caglayanKatalogUrl;
      if (x.prosoKatalogUrl) return x.prosoKatalogUrl;
      return "";
    }

    function marketReyonPdfLabel(x) {
      if (x.caglayanKatalogAdi) return String(x.caglayanKatalogAdi);
      if (x.prosoKatalogAdi) return String(x.prosoKatalogAdi);
      var rel = x.caglayanKatalogPdf || x.prosoKatalogPdf || "";
      return imgFileName(rel) || __pdpT("pdp.datasheet", "Veri sayfası (PDF)");
    }

    function pdpPdfEmbedBlock(pdfUrl, label) {
      if (!pdfUrl || !/\.pdf/i.test(pdfUrl)) return "";
      return (
        '<div class="eq-pdp-pdf-embed-wrap">' +
        '<iframe class="eq-pdp-pdf-embed" src="' +
        esc(pdfUrl) +
        '#view=FitH" title="' +
        esc(label) +
        '" loading="lazy"></iframe>' +
        '<p class="eq-pdp-pdf-dl"><a href="' +
        esc(pdfUrl) +
        '" target="_blank" rel="noopener">' +
        esc(label) +
        " — " +
        esc(__pdpT("pdp.open_pdf_new_tab", "Yeni sekmede aç")) +
        "</a></p></div>"
      );
    }

    function mfgHostLabel(url) {
      try {
        return new URL(String(url)).hostname.replace(/^www\./i, "");
      } catch (_) {
        return __pdpT("pdp.mfg_source", "Üretici");
      }
    }

    function electroluxSourceLinkText(url) {
      try {
        var u = new URL(String(url));
        var path = decodeURIComponent(u.pathname || "/");
        return u.hostname.replace(/^www\./i, "") + path;
      } catch (_) {
        return String(url || "").trim();
      }
    }

    function isElectroluxProfessional(x) {
      if (!x) return false;
      if (String(x.kaynak || "") === "electrolux-professional") return true;
      return /electrolux\s*professional/i.test(String(x.brand || ""));
    }

    function getElectroluxDocuments(x) {
      return Array.isArray(x && x.electrolux_documents) ? x.electrolux_documents : [];
    }

    function electroluxDocHref(doc) {
      if (!doc) return "";
      if (doc.local) {
        if (typeof window.equstoDataAssetHref === "function") {
          try {
            var via = window.equstoDataAssetHref(doc.local);
            if (via) return via;
          } catch (_) {}
        }
        return eqHtmlUrl("/" + String(doc.local).replace(/^\/+/, ""));
      }
      if (doc.url) return String(doc.url);
      return "";
    }

    function electroluxDocDisplayName(doc) {
      var title = String((doc && doc.title) || "").trim();
      if (title && doc.category && title.indexOf("%") < 0 && !/\.(pdf|dwg|rfa)$/i.test(title)) {
        return title;
      }
      if (title) {
        try {
          return decodeURIComponent(title.replace(/_/g, " "));
        } catch (_) {
          return title.replace(/_/g, " ");
        }
      }
      return (doc && doc.type) || "Döküman";
    }

    function dedupeElectroluxDocs(docs) {
      var seen = Object.create(null);
      var out = [];
      (docs || []).forEach(function (doc) {
        var key = String(doc.local || doc.url || doc.title || "")
          .toLowerCase()
          .replace(/\\/g, "/");
        if (!key || seen[key]) return;
        seen[key] = 1;
        out.push(doc);
      });
      return out;
    }

    function isElectroluxBrochure(doc) {
      var cat = String(doc.category || "");
      var type = String(doc.type || "").toUpperCase();
      var title = String(doc.title || "").toLowerCase();
      if (/bro[sş]ür|leaflet|el bro[sş]ür/i.test(cat)) return true;
      if (type === "BR" || type === "CLF") return true;
      if (/brochure|leaflet|^br_|^clf_/i.test(title)) return true;
      return false;
    }

    function isElectroluxTechnicalDrawing(doc) {
      var cat = String(doc.category || "");
      var type = String(doc.type || "").toUpperCase();
      var title = String(doc.title || "");
      if (/cad|çizim|bim|revit|drawing/i.test(cat)) return true;
      if (type === "DWG" || type === "CAD" || type === "RFA" || type === "REVIT") return true;
      if (/\.dwg$/i.test(title) || /\.rfa$/i.test(title)) return true;
      return false;
    }

    function isElectroluxDatasheet(doc) {
      var cat = String(doc.category || "");
      var type = String(doc.type || "").toUpperCase();
      if (/veri sayfas/i.test(cat)) return true;
      if (type === "MAD2" || type === "MAD") return true;
      return false;
    }

    function getElectroluxBrochures(x) {
      return dedupeElectroluxDocs(getElectroluxDocuments(x).filter(isElectroluxBrochure)).sort(function (a, b) {
        return (b.local ? 1 : 0) - (a.local ? 1 : 0);
      });
    }

    function getElectroluxTechnicalDocs(x) {
      return dedupeElectroluxDocs(getElectroluxDocuments(x).filter(isElectroluxTechnicalDrawing)).sort(function (a, b) {
        return (b.local ? 1 : 0) - (a.local ? 1 : 0);
      });
    }

    function getElectroluxDatasheetDoc(x) {
      var docs = getElectroluxDocuments(x);
      var ds = docs.filter(isElectroluxDatasheet);
      if (ds.length) return ds[0];
      return docs.find(function (d) {
        return String(d.type || "").toUpperCase() === "PDF" && !isElectroluxBrochure(d);
      });
    }

    function renderEpdpDocLinkList(docs) {
      if (!docs.length) {
        return (
          '<p class="eq-caglayan-acc__body">' +
          esc(__pdpT("pdp.no_documents", "Henüz yüklenmedi.")) +
          "</p>"
        );
      }
      return (
        '<div class="eq-caglayan-acc__body eq-epdp-doc-links">' +
        docs
          .map(function (doc) {
            var href = electroluxDocHref(doc);
            if (!href) return "";
            return (
              '<a href="' +
              esc(href) +
              '" target="_blank" rel="noopener">' +
              esc(electroluxDocDisplayName(doc)) +
              "</a>"
            );
          })
          .filter(Boolean)
          .join("<br>") +
        "</div>"
      );
    }

    function isOztiEqustoBrand(brand) {
      var b = String(brand || "").trim();
      if (!b) return false;
      return /^(?:ÖZTİRYAKİLER|OZTIRYAKILER|Öztiryakiler|Oztiryakiler)(?:\s+(?:Endüstriyel\s+Mutfak|ENDÜSTRIYEL\s+MUTFAK|Endustriyel\s+Mutfak|ENDUSTRIYEL\s+MUTFAK))?$/i.test(b);
    }

    function pdpVisibleBrand(brand) {
      if (!brand || isOztiEqustoBrand(brand)) return "";
      return String(brand).trim();
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
      var visBrand = pdpVisibleBrand(x.brand);
      if (visBrand) parts.push(visBrand);
      var ref = deptLink(x.category, x.dept);
      if (ref && ref.label) parts.push(ref.label);
      return parts.join(" · ") || "Endüstriyel mutfak";
    }

    function pdpLeadParagraph(x) {
      if (isCaglayanRefrigeration(x)) return caglayanLeadParagraph(x);
      var desc =
        window.eqLang === "en" && x.descriptionEn && String(x.descriptionEn).trim()
          ? String(x.descriptionEn).trim()
          : window.eqLang === "en" && x.aciklama && String(x.aciklama).trim()
            ? String(x.aciklama).trim()
            : x.description && String(x.description).trim()
              ? String(x.description).trim()
              : "";
      if (desc) return desc.split(/\n/)[0].slice(0, 320);
      var dim = formatOlculerLinePdp(x);
      if (dim) return __pdpT("pdp.inner_dims_prefix", "İç ölçüler: {dim}.", { dim: dim });
      var bullets = buildAboutBullets(splitSpecsCols(x.specs).left || x.specs, 3);
      if (bullets.length) return bullets.join(" · ");
      var visBrand = pdpVisibleBrand(x.brand);
      return (visBrand ? visBrand + " — " : "") + "Equsto kataloğundan endüstriyel mutfak ekipmanı.";
    }

    function pdpPdfHref(x) {
      var c = caglayanPdfHref(x);
      if (c) return c;
      if (isElectroluxProfessional(x)) {
        var ds = getElectroluxDatasheetDoc(x);
        var href = ds ? electroluxDocHref(ds) : "";
        if (href) return href;
      }
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

    /** KİLİT: public/pdp-buybox-cafemarkt-KILIT.txt — Cafemarkt tarzı buybox */
    function pdpWhatsAppPrefill(x) {
      var sku = (x && (x.sku || x.model)) || "";
      return (
        "Merhaba, " +
        ((x && x.name) || "ürün") +
        (sku ? " (" + sku + ")" : "") +
        " hakkında bilgi almak istiyorum."
      );
    }

    function renderEpdpBuybox(x, cartU) {
      var parts = buyboxPriceParts(x);
      var pfosHref = eqHtmlUrl(typeof window.equstoUrl === "function" ? window.equstoUrl("pfos") : "pfos.html");
      var waMsg = pdpWhatsAppPrefill(x);
      var priceBlock = parts.quoteOnly
        ? '<div class="eq-cmf-price eq-cmf-price--quote">' +
          esc(__pdpT("pdp.quote_for_contact", "Teklif için iletişim")) +
          "</div>"
        : parts.empty
          ? '<div class="eq-cmf-price"><span class="eq-cmf-price__amount">—</span></div>'
          : '<div class="eq-cmf-price">' +
            '<span class="eq-cmf-price__amount">' +
            esc(parts.int + " TL") +
            '</span><span class="eq-cmf-price__vat-tag">' +
            esc(__pdpT("pdp.vat_included_tag", "KDV dahil")) +
            "</span></div>";
      var quoteNote = parts.quoteOnly
        ? '<p class="eq-cmf-quote-note">' +
          esc(__pdpT("pdp.price_preparing", "Fiyat listesi hazırlanıyor — sepete ekleyip teklif isteyebilirsiniz.")) +
          "</p>"
        : "";
      var cartBtnSolid =
        window.EqustoCart && EqustoCart.cartAddButtonAttrs
          ? "<button " +
            EqustoCart.cartAddButtonAttrs(cartU) +
            ' data-eq-cart-toast="1" class="eq-cart-add eq-cmf-btn eq-cmf-btn--cart">' +
            esc(__pdpT("pdp.add_to_cart_cmf", "Sepete Ekle")) +
            "</button>"
          : "";
      return (
        '<div class="eq-epdp-buybox eq-cmf-buybox" aria-label="' +
        esc(__pdpT("pdp.buybox_aria", "Satın al")) +
        '">' +
        '<div class="eq-cmf-topbar">' +
        '<span class="eq-cmf-badge-ship">' +
        esc(__pdpT("pdp.badge_free_ship", "Ücretsiz Kargo")) +
        "</span></div>" +
        priceBlock +
        quoteNote +
        '<div class="eq-cmf-ship-banner">' +
        '<span class="eq-cmf-ship-banner__icon" aria-hidden="true">' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 6h13v9H1zM14 9h4l3 4v2h-7V9z"/><circle cx="6" cy="17" r="2"/><circle cx="18" cy="17" r="2"/></svg>' +
        "</span>" +
        esc(__pdpT("pdp.ship_banner", "Seçili bölgelerde ücretsiz teslimat")) +
        "</div>" +
        '<div class="eq-cmf-purchase">' +
        '<div class="eq-cmf-qty" role="group" aria-label="' +
        esc(__pdpT("pdp.qty_aria", "Adet")) +
        '">' +
        '<button type="button" class="eq-cmf-qty__btn eq-cmf-qty__minus" aria-label="' +
        esc(__pdpT("pdp.qty_minus", "Azalt")) +
        '">−</button>' +
        '<span class="eq-cmf-qty__val">1</span>' +
        '<button type="button" class="eq-cmf-qty__btn eq-cmf-qty__plus" aria-label="' +
        esc(__pdpT("pdp.qty_plus", "Artır")) +
        '">+</button>' +
        "</div>" +
        "</div>" +
        '<div class="eq-cmf-actions eq-cmf-actions--primary">' +
        cartBtnSolid +
        '<button type="button" class="eq-cmf-btn-outline eq-cmf-btn--pay">' +
        '<span class="eq-cmf-btn-outline__icon" aria-hidden="true">' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>' +
        "</span>" +
        esc(__pdpT("pdp.payment_options", "Ödeme Seçenekleri")) +
        "</button></div>" +
        '<div class="eq-cmf-actions eq-cmf-actions--secondary">' +
        '<a class="eq-cmf-btn eq-cmf-btn--pfos" href="' +
        esc(pfosHref) +
        '">' +
        esc(__pdpT("nav.pfos", "Proje Fabrikası")) +
        "</a>" +
        '<button type="button" class="eq-cmf-btn-outline eq-cmf-btn--wa" data-eq-wa-msg="' +
        esc(waMsg) +
        '">' +
        '<span class="eq-cmf-btn-outline__icon" aria-hidden="true">' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492l4.587-1.452A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.006-1.378l-.357-.212-3.064.972.998-2.988-.233-.375A9.818 9.818 0 0 1 2.182 12c0-5.422 4.396-9.818 9.818-9.818S21.818 6.578 21.818 12 17.422 21.818 12 21.818z"/></svg>' +
        "</span>" +
        esc(__pdpT("pdp.whatsapp_ask", "Whatsapp ile Soru Sor")) +
        "</button></div>" +
        '<div class="eq-cmf-pay-panel" hidden>' +
        "<ul>" +
        "<li>" +
        esc(__pdpT("pdp.pay_card", "Kredi kartı — 3D Secure ile güvenli ödeme")) +
        "</li>" +
        "<li>" +
        esc(__pdpT("pdp.pay_wire", "Havale / EFT — ekstra %3 indirim")) +
        "</li>" +
        "<li>" +
        esc(__pdpT("pdp.pay_corporate", "Kurumsal fatura ve vadeli ödeme — Proje Fabrikası teklifi sonrası")) +
        "</li>" +
        "</ul></div></div>"
      );
    }

    function bindEpdpBuybox() {
      var box = document.querySelector(".eq-cmf-buybox");
      if (!box) return;
      var valEl = box.querySelector(".eq-cmf-qty__val");
      var minus = box.querySelector(".eq-cmf-qty__minus");
      var plus = box.querySelector(".eq-cmf-qty__plus");
      if (valEl && minus && plus) {
        function qty() {
          return Math.max(1, Math.min(99, parseInt(valEl.textContent, 10) || 1));
        }
        function setQty(q) {
          q = Math.max(1, Math.min(99, q));
          valEl.textContent = String(q);
          minus.disabled = q <= 1;
          plus.disabled = q >= 99;
        }
        minus.addEventListener("click", function (e) {
          e.preventDefault();
          setQty(qty() - 1);
        });
        plus.addEventListener("click", function (e) {
          e.preventDefault();
          setQty(qty() + 1);
        });
        setQty(1);
      }
      var payBtn = box.querySelector(".eq-cmf-btn--pay");
      var payPanel = box.querySelector(".eq-cmf-pay-panel");
      if (payBtn && payPanel) {
        payBtn.addEventListener("click", function (e) {
          e.preventDefault();
          var open = payPanel.hasAttribute("hidden");
          if (open) payPanel.removeAttribute("hidden");
          else payPanel.setAttribute("hidden", "");
          payBtn.setAttribute("aria-expanded", open ? "true" : "false");
        });
      }
      var waBtn = box.querySelector(".eq-cmf-btn--wa");
      if (waBtn) {
        waBtn.addEventListener("click", function (e) {
          e.preventDefault();
          var text = waBtn.getAttribute("data-eq-wa-msg") || "";
          if (typeof window.equstoOpenWhatsAppWebWindow === "function") {
            window.equstoOpenWhatsAppWebWindow(null, text);
          } else if (typeof window.equstoOpenWhatsApp === "function") {
            window.EQUSTO_WHATSAPP_TEXT = text;
            window.equstoOpenWhatsApp(e);
          }
        });
      }
    }

    function renderEpdpFeaturesCol(x) {
      if (isCaglayanRefrigeration(x)) return renderCaglayanFeaturesCol(x);
      var html =
        '<div class="eq-epdp-panel eq-caglayan-panel"><h2>' +
        esc(__pdpT("pdp.features_heading", "Özellikler")) +
        '</h2><div class="eq-caglayan-acc">';
      var ref = deptLink(x.category, x.dept);
      var temel = [];
      var visBrand = pdpVisibleBrand(x.brand);
      if (visBrand) temel.push(__pdpT("pdp.brand_prefix", "Marka:") + " " + visBrand);
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
        var pdfLabel = isElectroluxProfessional(x)
          ? electroluxDocDisplayName(getElectroluxDatasheetDoc(x) || { title: __pdpT("pdp.datasheet", "Veri sayfası") })
          : marketReyonPdfLabel(x);
        html +=
          '<details open><summary>' +
          esc(__pdpT("pdp.datasheet", "Veri sayfası")) +
          '</summary><div class="eq-caglayan-acc__body">' +
          pdpPdfEmbedBlock(pdf, pdfLabel) +
          "</div></details>";
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
      var src = x.linkKaynak || x.kaynak_url || "";
      if (src) {
        html +=
          '<details><summary>' +
          esc(__pdpT("pdp.mfg_source", "Üretici kaynağı")) +
          '</summary><div class="eq-caglayan-acc__body"><a href="' +
          esc(src) +
          '" target="_blank" rel="noopener" title="' +
          esc(src) +
          '">' +
          esc(isElectroluxProfessional(x) ? electroluxSourceLinkText(src) : __pdpT("pdp.mfg_source_link", "Üretici / kaynak sayfası")) +
          "</a></div></details>";
      }
      if (isElectroluxProfessional(x)) {
        var brochures = getElectroluxBrochures(x);
        if (brochures.length) {
          html +=
            "<details><summary>" +
            esc(__pdpT("pdp.brochures", "Broşürler")) +
            "</summary>" +
            renderEpdpDocLinkList(brochures) +
            "</details>";
        }
        var cadDocs = getElectroluxTechnicalDocs(x);
        html +=
          "<details" +
          (cadDocs.length ? " open" : "") +
          "><summary>" +
          esc(__pdpT("pdp.technical_drawings", "Teknik çizimler")) +
          "</summary>";
        if (cadDocs.length) {
          html += renderEpdpDocLinkList(cadDocs);
          html +=
            '<p class="eq-caglayan-acc__body"><a href="#eq-epdp-drawings">' +
            esc(__pdpT("pdp.go_to_drawings", "Sayfadaki teknik görsellere git")) +
            "</a></p>";
        } else {
          html +=
            '<div class="eq-caglayan-acc__body"><a href="#eq-epdp-drawings">' +
            esc(__pdpT("pdp.go_to_drawings", "Sayfadaki teknik görsellere git")) +
            "</a></div>";
        }
        html += "</details>";
      } else {
        html +=
          '<details><summary>' +
          esc(__pdpT("pdp.technical_drawings", "Teknik çizimler")) +
          '</summary><div class="eq-caglayan-acc__body"><a href="#eq-epdp-drawings">' +
          esc(__pdpT("pdp.go_to_drawings", "Sayfadaki teknik görsellere git")) +
          "</a></div></details>";
      }
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
      var cad = isElectroluxProfessional(x) ? getElectroluxTechnicalDocs(x) : [];
      if (!tek.length && !cad.length) return "";
      var html =
        '<section class="eq-epdp-drawings eq-caglayan-drawings" id="eq-epdp-drawings">' +
        "<h2>" +
        esc(__pdpT("pdp.drawings_heading", "Teknik çizimler")) +
        "</h2>";
      if (tek.length) {
        html +=
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
          "</div>";
      }
      if (cad.length) {
        html +=
          '<ul class="eq-epdp-cad-list">' +
          cad
            .map(function (doc) {
              var href = electroluxDocHref(doc);
              if (!href) return "";
              return (
                "<li><a href=\"" +
                esc(href) +
                '" target="_blank" rel="noopener">' +
                esc(electroluxDocDisplayName(doc)) +
                " (" +
                esc(String(doc.type || "CAD")) +
                ")</a></li>"
              );
            })
            .filter(Boolean)
            .join("") +
          "</ul>";
      }
      html += "</section>";
      return html;
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
      var html =
        '<div class="eq-caglayan-panel"><h2>' +
        esc(__pdpT("pdp.features_heading", "Özellikler")) +
        '</h2><div class="eq-caglayan-acc">';
      var oz = x.caglayanOzellikler || [];
      if (oz.length) {
        html +=
          "<details open><summary>" +
          esc(__pdpT("pdp.general_features", "Genel özellikler")) +
          '</summary><div class="eq-caglayan-acc__body"><ul>' +
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
          "<details><summary>" +
          esc(__pdpT("pdp.variant_dims_summary", "Bu varyant ölçüleri")) +
          '</summary><div class="eq-caglayan-acc__body"><ul>' +
          (o.genislik_mm
            ? "<li>" +
              esc(__pdpT("pdp.dim_length", "Uzunluk") + ": " + o.genislik_mm + " mm") +
              "</li>"
            : "") +
          (o.derinlik_mm
            ? "<li>" +
              esc(__pdpT("pdp.dim_depth", "Derinlik") + ": " + o.derinlik_mm + " mm") +
              "</li>"
            : "") +
          (o.yukseklik_mm
            ? "<li>" +
              esc(__pdpT("pdp.dim_height", "Yükseklik") + ": " + o.yukseklik_mm + " mm") +
              "</li>"
            : "") +
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
      var pdfLabel = marketReyonPdfLabel(x);
      var src = x.linkKaynak || "";
      var html =
        '<div class="eq-caglayan-panel"><h2>' +
        esc(__pdpT("pdp.documents_heading", "Dökümanlar")) +
        '</h2><div class="eq-caglayan-acc">';
      if (pdf) {
        html +=
          "<details open><summary>" +
          esc(__pdpT("pdp.datasheet", "Veri sayfası")) +
          '</summary><div class="eq-caglayan-acc__body">' +
          pdpPdfEmbedBlock(pdf, pdfLabel) +
          "</div></details>";
      }
      html +=
        "<details" +
        (pdf ? "" : " open") +
        "><summary>" +
        esc(__pdpT("pdp.quote_and_sales", "Teklif ve satış")) +
        '</summary><div class="eq-caglayan-acc__body">' +
        '<a href="' +
        esc(eqHtmlUrl(typeof window.equstoUrl === "function" ? window.equstoUrl("contact") : "contact.html")) +
        '">' +
        esc(__pdpT("pdp.quote_contact", "Teklif ve iletişim")) +
        "</a> · " +
        '<a href="' +
        esc(eqHtmlUrl(typeof window.equstoUrl === "function" ? window.equstoUrl("pfos") : "pfos.html")) +
        '">' +
        esc(__pdpT("nav.pfos", "Proje Fabrikası")) +
        "</a></div></details>";
      if (src) {
        html +=
          "<details><summary>" +
          esc(__pdpT("pdp.mfg_page", "Üretici sayfası")) +
          '</summary><div class="eq-caglayan-acc__body">' +
          '<a href="' +
          esc(src) +
          '" target="_blank" rel="noopener">' +
          esc(mfgHostLabel(src)) +
          "</a></div></details>";
      }
      html +=
        '<details><summary>' + esc(__pdpT("pdp.technical_drawings", "Teknik çizimler")) + '</summary><div class="eq-caglayan-acc__body"><a href="#eq-epdp-drawings">' + esc(__pdpT("pdp.go_to_drawings", "Sayfadaki teknik görsellere git")) + '</a></div></details>';
      html += "</div></div>";
      return html;
    }

    function renderEpdpProduct(x, all) {
      var visBrandTitle = pdpVisibleBrand(x.brand);
      var prodTitle = ((visBrandTitle ? visBrandTitle + " " : "") + (x.name || "Ürün")).slice(0, 80);
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
      var cartU = pdpCartRowFromProduct(x);
      cartU.p = extractCartPrice(x.price, x);
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
        (pdf && /\.pdf/i.test(pdf)
          ? '<div class="eq-epdp-cta eq-caglayan-cta">' +
            '<a class="eq-caglayan-btn" href="' +
            esc(pdf) +
            '" target="_blank" rel="noopener">' +
            esc(__pdpT("pdp.pdf_catalog", "PDF katalog")) +
            "</a></div>"
          : "") +
        "</div></div>" +
        '<div class="eq-epdp-panels eq-caglayan-panels">' +
        renderEpdpFeaturesCol(x) +
        renderEpdpDocsCol(x) +
        "</div>" +
        renderEpdpDrawings(x) +
        relatedStrip +
        renderRecentlyViewed(x, all);

      bindEpdpGallery();
      bindEpdpBuybox();
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

    function waitForShopCatalog(fn, attempt) {
      attempt = attempt || 0;
      if (window.EqustoShopCatalog && typeof window.EqustoShopCatalog.load === "function") {
        fn();
        return;
      }
      if (attempt >= 120) {
        var missRoot = document.getElementById("eq-product-root");
        if (missRoot) {
          missRoot.innerHTML =
            '<div class="eq-product-miss">' +
            esc(__pdpT("pdp.catalog_loader_missing", "Katalog yükleyici yok. Sayfayı yenileyin; ecom-data.js ve eq-shop-catalog-bootstrap.js yüklü olmalı.")) +
            "</div>";
        }
        return;
      }
      setTimeout(function () {
        waitForShopCatalog(fn, attempt + 1);
      }, 50);
    }

    function tryRenderFromSeed() {
      var seed = null;
      try {
        if (window.__EQ_PDP_SEED && typeof window.__EQ_PDP_SEED === "object") {
          seed = window.__EQ_PDP_SEED;
        }
      } catch (_) {}
      if (!seed) return false;
      if (window.EqFiyatlarBridge && window.EqFiyatlarBridge.applyToRaw) {
        try {
          window.EqFiyatlarBridge.applyToRaw(seed);
        } catch (_) {}
      }
      try {
        renderProduct(seed, [seed]);
        return true;
      } catch (_) {
        return false;
      }
    }

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
      tryRenderFromSeed();
      waitForShopCatalog(function () {
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
      });
    }

    window.__eqBootProductPage = bootProductPage;

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
        if (window.__EQ_PDP_SEED) {
          go();
          return;
        }
        if (window.eqI18nReady && typeof window.eqI18nReady.then === "function") {
          window.eqI18nReady.then(go).catch(go);
          return;
        }
      } catch (_) {}
      go();
    }
