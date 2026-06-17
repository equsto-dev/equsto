/**
 * Besos /besos/modul/:slug — vitrum kataloğu → E-PDP (renderProduct)
 */
(function () {
  "use strict";

  var CATALOGUE_V = "20260527pdp-boot-nav";
  var FALLBACK_EUR_TRY = 52.8238;

  function nz(v) {
    return v == null ? "" : String(v).trim();
  }

  function isEn() {
    try {
      return window.eqLang === "en" || /^\/en(\/|$)/i.test(location.pathname || "");
    } catch (_) {
      return false;
    }
  }

  function besosSlugFromPath() {
    var m = /\/besos\/modul\/([^/?#]+)/i.exec(location.pathname || "");
    return m ? decodeURIComponent(m[1]).toLowerCase() : "";
  }

  function catalogueUrl() {
    return "/data/vitrum-bars-catalogue.json?v=" + CATALOGUE_V;
  }

  function loadCatalogue() {
    return fetch(catalogueUrl(), { cache: "default" })
      .then(function (r) {
        if (!r.ok) throw new Error("catalogue");
        return r.json();
      })
      .catch(function () {
        if (window.__VITRUM_CATALOGUE_FALLBACK) return window.__VITRUM_CATALOGUE_FALLBACK;
        throw new Error("catalogue");
      });
  }

  function eurToTryPriceString(eur, rate) {
    var e = Number(eur);
    var r = Number(rate);
    if (!(e > 0) || !(r > 0)) return "";
    var tl = Math.round(e * r * 100) / 100;
    return tl.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function vitrumToRow(p, eurTryRate) {
    var slugFn = window.vitrumModuleSlug;
    var slug = slugFn ? slugFn(p) : nz(p.slug);
    var img = nz(p.imageLocal) || nz(p.image);
    var images = [];
    if (img) images.push(img);
    var drawing = nz(p.drawing);
    if (drawing && images.indexOf(drawing) < 0) images.push(drawing);

    var eur =
      p.pricing && p.pricing.fiyatEurKdvDahil != null
        ? p.pricing.fiyatEurKdvDahil
        : p.fiyatEurKdvDahil;

    var teknik = [];
    var feats = p.features;
    if (isEn() && Array.isArray(p.featuresEn) && p.featuresEn.length) {
      feats = p.featuresEn;
    }
    if (Array.isArray(feats)) {
      feats.forEach(function (f) {
        var s = String(f || "")
          .replace(/^→\s*/, "")
          .trim();
        if (s) teknik.push(s);
      });
    }
    if (Array.isArray(p.dimensionsMm)) {
      p.dimensionsMm.forEach(function (d) {
        if (!d || !nz(d.value)) return;
        var lbl = isEn() && d.labelEn ? d.labelEn : d.label || d.labelEn || "";
        teknik.push((lbl ? lbl + ": " : "") + d.value);
      });
    }
    if (nz(p.totalDimensionsMm)) {
      var totalLbl = isEn() ? "Total dimensions:" : "Toplam ölçü:";
      teknik.push(totalLbl + " " + p.totalDimensionsMm);
    }

    var descTr = nz(p.description);
    var descEn = nz(p.descriptionEn);
    var description = isEn() && descEn ? descEn : descTr;

    var modPath =
      typeof window.vitrumModulePath === "function"
        ? window.vitrumModulePath(slug)
        : "/besos/modul/" + slug;

    return {
      id: slug,
      slug: slug,
      name: nz(p.name) || nz(p.code) || (isEn() ? "Bar module" : "Bar modülü"),
      brand: "Besos",
      category: nz(p.category) || "Bar Design",
      sku: nz(p.code),
      model: nz(p.code),
      description: description,
      descriptionEn: descEn,
      images: images,
      drawing: drawing,
      price: eurToTryPriceString(eur, eurTryRate),
      fiyatEurKdvDahil: eur,
      dept: "besos",
      kaynak: "besos-vitrum",
      equstoPage: modPath,
      vitrumProduct: p,
      teknik_ozellikler: teknik.length ? teknik : undefined,
      page: p.page,
    };
  }

  function ensureRate() {
    if (window.EqustoKurLive && typeof window.EqustoKurLive.fetchKur === "function") {
      return window.EqustoKurLive.fetchKur(true).then(function () {
        var r = window.EqustoKurLive.getRate && window.EqustoKurLive.getRate();
        return r > 0 ? r : FALLBACK_EUR_TRY;
      });
    }
    return fetch("/api/kur", { headers: { Accept: "application/json" }, cache: "no-store" })
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        if (data && data.success && Number(data.rate) > 0) return Number(data.rate);
        return FALLBACK_EUR_TRY;
      })
      .catch(function () {
        return FALLBACK_EUR_TRY;
      });
  }

  window.__eqBootBesosModulPdp = function () {
    var root = document.getElementById("eq-product-root");
    if (!root) return;

    var slug = besosSlugFromPath();
    if (!slug) {
      root.innerHTML =
        '<div class="eq-product-miss">' +
        escMiss(isEn() ? "Module not found." : "Modül bulunamadı.") +
        "</div>";
      return;
    }

    if (window.EqFilterColumn) {
      window.EqFilterColumn.buildBrands([], "", function () {});
    }

    var bcHome = document.getElementById("eq-product-bc-home");
    if (bcHome && typeof window.equstoUrl === "function") {
      bcHome.href = window.equstoUrl("shop");
    }

    Promise.all([loadCatalogue(), ensureRate()])
      .then(function (res) {
        var data = res[0];
        var rate = res[1];
        var products = (data && data.products) || [];
        var findFn = window.findVitrumModuleBySlug;
        var raw = findFn ? findFn(products, slug) : null;
        if (!raw) throw new Error("notfound");

        var all = products.map(function (p) {
          return vitrumToRow(p, rate);
        });
        var x = null;
        for (var i = 0; i < all.length; i++) {
          if (all[i].slug === slug || String(all[i].id).toLowerCase() === slug) {
            x = all[i];
            break;
          }
        }
        if (!x) x = vitrumToRow(raw, rate);
        if (typeof window.__eqRenderProduct !== "function") {
          throw new Error("render");
        }
        window.__eqRenderProduct(x, all);
      })
      .catch(function (err) {
        var msg =
          err && err.message === "notfound"
            ? isEn()
              ? "This module was not found."
              : "Bu modül bulunamadı."
            : isEn()
              ? "Could not load module data."
              : "Modül verisi yüklenemedi.";
        var besosHref =
          typeof window.equstoUrl === "function" ? window.equstoUrl("besos") : "/besos";
        var backLbl = isEn() ? "Back to Bar Design showcase" : "Bar Design vitrinine dön";
        root.innerHTML =
          '<div class="eq-product-miss">' +
          escMiss(msg) +
          ' <a href="' +
          escMiss(besosHref) +
          '">' +
          escMiss(backLbl) +
          "</a></div>";
        var bc = document.getElementById("eq-product-bc");
        if (bc) {
          var homeLbl = isEn() ? "Home" : "Ana Sayfa";
          var crumbLbl =
            err && err.message === "notfound"
              ? isEn()
                ? "Module"
                : "Modül"
              : isEn()
                ? "Error"
                : "Hata";
          bc.innerHTML =
            '<a href="' +
            escMiss(besosHref) +
            '">' +
            escMiss(homeLbl) +
            '</a> › <span>' +
            escMiss(crumbLbl) +
            "</span>";
        }
      });
  };

  function escMiss(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
})();
