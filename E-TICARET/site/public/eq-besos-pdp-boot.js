/**
 * Besos /besos/modul/:slug — vitrum kataloğu → E-PDP (renderProduct)
 */
(function () {
  "use strict";

  var FALLBACK_EUR_TRY = 52.8238;

  function nz(v) {
    return v == null ? "" : String(v).trim();
  }

  function besosSlugFromPath() {
    var m = /\/besos\/modul\/([^/?#]+)/i.exec(location.pathname || "");
    return m ? decodeURIComponent(m[1]).toLowerCase() : "";
  }

  function catalogueUrl() {
    return "/data/vitrum-bars-catalogue.json";
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
    if (window.eqLang === "en" && Array.isArray(p.featuresEn) && p.featuresEn.length) {
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
        var lbl = window.eqLang === "en" && d.labelEn ? d.labelEn : d.label || d.labelEn || "";
        teknik.push((lbl ? lbl + ": " : "") + d.value + " mm");
      });
    }
    if (nz(p.totalDimensionsMm)) {
      teknik.push("Toplam ölçü: " + p.totalDimensionsMm + " mm");
    }

    return {
      id: slug,
      slug: slug,
      name: nz(p.name) || nz(p.code) || "Bar modülü",
      brand: "Besos",
      category: nz(p.category) || "Bar Design",
      sku: nz(p.code),
      model: nz(p.code),
      description: nz(p.description),
      descriptionEn: nz(p.descriptionEn),
      images: images,
      drawing: drawing,
      price: eurToTryPriceString(eur, eurTryRate),
      fiyatEurKdvDahil: eur,
      dept: "besos",
      kaynak: "besos-vitrum",
      equstoPage: "/besos/modul/" + slug,
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
      root.innerHTML = '<div class="eq-product-miss">Modül bulunamadı.</div>';
      return;
    }

    if (window.EqFilterColumn) {
      window.EqFilterColumn.buildBrands([], "", function () {});
    }

    var bcHome = document.getElementById("eq-product-bc-home");
    if (bcHome && typeof window.equstoUrl === "function") {
      bcHome.href = window.equstoUrl("shop");
    }

    Promise.all([
      fetch(catalogueUrl(), { cache: "no-store" }).then(function (r) {
        if (!r.ok) throw new Error("catalogue");
        return r.json();
      }),
      ensureRate(),
    ])
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
            ? "Bu modül bulunamadı."
            : "Modül verisi yüklenemedi.";
        var besosHref =
          typeof window.equstoUrl === "function" ? window.equstoUrl("besos") : "/besos";
        root.innerHTML =
          '<div class="eq-product-miss">' +
          msg +
          ' <a href="' +
          besosHref +
          '">Bar Design vitrinine dön</a></div>';
      });
  };
})();
