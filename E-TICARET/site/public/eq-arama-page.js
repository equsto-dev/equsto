/**
 * /arama?q= — Meilisearch sonuç sayfası (statik mağaza kromu)
 */
;(function () {
  "use strict";

  var LIMIT = 48;
  var CATALOG_V = "20260527robot-coupe-haz";
  var lastRender = { hits: [], q: "", total: 0, err: null };
  var catalogImgById = null;
  var catalogImgInflight = null;

  function __searchT(k, fb, vars) {
    var s = fb || k;
    try {
      if (typeof window.eqT === "function") {
        var v = window.eqT(k, null);
        if (v != null && v !== k) s = v;
      }
    } catch (_) {}
    if (vars) {
      Object.keys(vars).forEach(function (kk) {
        s = String(s).replace(new RegExp("\\{" + kk + "\\}", "g"), vars[kk]);
      });
    }
    return s;
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  function trimQ(q) {
    return String(q == null ? "" : q).trim();
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

  function loadCatalogImageMap() {
    if (catalogImgById) return Promise.resolve(catalogImgById);
    if (catalogImgInflight) return catalogImgInflight;
    catalogImgInflight = fetch("/data/ekipmanlar.json?v=" + CATALOG_V, {
      cache: "default",
      headers: { Accept: "application/json" },
    })
      .then(function (r) {
        if (!r.ok) throw new Error("ekipmanlar HTTP " + r.status);
        return r.json();
      })
      .then(function (rows) {
        var map = Object.create(null);
        if (Array.isArray(rows)) {
          rows.forEach(function (row) {
            if (!row || !row.id) return;
            var imgs = row.images;
            if (Array.isArray(imgs) && imgs[0]) map[String(row.id)] = String(imgs[0]);
          });
        }
        catalogImgById = map;
        return map;
      })
      .catch(function () {
        catalogImgById = Object.create(null);
        return catalogImgById;
      })
      .finally(function () {
        catalogImgInflight = null;
      });
    return catalogImgInflight;
  }

  function enrichHits(hits) {
    if (!catalogImgById || !Array.isArray(hits)) return hits || [];
    return hits.map(function (h) {
      if (!h) return h;
      if (h.image) return h;
      var img = catalogImgById[h.id];
      if (!img) return h;
      return Object.assign({}, h, { image: img });
    });
  }

  function sortHitsWithImagesFirst(hits) {
    if (!Array.isArray(hits) || hits.length < 2) return hits || [];
    return hits.slice().sort(function (a, b) {
      var ai = a && a.image ? 1 : 0;
      var bi = b && b.image ? 1 : 0;
      return bi - ai;
    });
  }

  function imgSrc(hit) {
    var img = hit && hit.image;
    if (!img) return "";
    img = String(img).replace(/\\/g, "/");
    if (typeof window.eqProductImgSrc === "function") {
      try {
        var eq = window.eqProductImgSrc(img);
        if (eq) return eq;
      } catch (_) {}
    }
    if (typeof window.catalogImageCandidates === "function") {
      try {
        var tries = window.catalogImageCandidates(img);
        if (tries && tries.length) return tries[0];
      } catch (_) {}
    }
    if (typeof window.equstoDataAssetHref === "function") {
      try {
        var href = window.equstoDataAssetHref(img);
        if (href) return href;
      } catch (_) {}
    }
    if (/^images\//i.test(img)) {
      var root =
        typeof window.equstoCatalogImagesWebRoot === "function"
          ? window.equstoCatalogImagesWebRoot()
          : "/data/images/";
      return root + img.replace(/^images\//i, "");
    }
    if (img.charAt(0) === "/") return img;
    return "/data/" + img.replace(/^data\//, "");
  }

  function formatPrice(hit) {
    if (!hit) return "";
    if (window.EqustoKurLive && typeof window.EqustoKurLive.computeRowPrices === "function") {
      var rate = window.EqustoKurLive.getRate();
      if (rate) {
        var px = window.EqustoKurLive.computeRowPrices(hit, rate);
        if (px && px.priceShort) return px.priceShort;
      }
    }
    return String(hit.price || "").split("\n")[0];
  }

  function getQuery() {
    try {
      return trimQ(new URLSearchParams(location.search).get("q") || "");
    } catch (_) {
      return "";
    }
  }

  function syncPageTitle(q) {
    try {
      document.title = q
        ? __searchT("search.title_q", "Arama: «{q}»", { q: q }) + " · Equsto"
        : __searchT("search.page_title", "Arama — Equsto");
    } catch (_) {}
  }

  function render(hits, q, total, err) {
    lastRender = { hits: hits || [], q: q || "", total: total, err: err };
    var title = document.getElementById("eq-arama-title");
    var count = document.getElementById("eq-arama-count");
    var grid = document.getElementById("eq-arama-grid");
    if (!grid) return;

    syncPageTitle(q);

    if (title) {
      title.textContent = q
        ? __searchT("search.title_q", "Arama: «{q}»", { q: q })
        : __searchT("search.title", "Arama");
    }
    if (count) {
      if (err) count.textContent = err;
      else if (!q) count.textContent = __searchT("search.enter_keyword", "Anahtar kelime girin.");
      else if (hits.length === 0)
        count.textContent = __searchT("search.no_results", "Sonuç bulunamadı.");
      else
        count.textContent = __searchT("search.results_count", "{n} sonuç", {
          n: total != null ? total : hits.length,
        });
    }

    if (err) {
      grid.innerHTML =
        '<p class="eq-dept-plp-status eq-dept-plp-status--err">' + esc(err) + "</p>";
      return;
    }
    if (!q) {
      grid.innerHTML =
        '<p class="eq-dept-plp-status">' +
        esc(__searchT("search.use_top_bar", "Üst çubuktan arama yapın.")) +
        "</p>";
      return;
    }
    if (!hits.length) {
      grid.innerHTML =
        '<p class="eq-dept-plp-empty">' +
        esc(__searchT("search.no_products", "Bu aramaya uygun ürün yok.")) +
        "</p>";
      return;
    }

    var addLbl = __searchT("plp.add_to_cart", "SEPETE EKLE");
    var imgPh = __searchT("search.image_ph", "Görsel");

    grid.innerHTML = hits
      .map(function (h) {
        var href = productHref(h);
        var rawImg = h.image ? String(h.image).replace(/\\/g, "/") : "";
        var src = imgSrc(h);
        var cartBtn =
          window.EqustoCart && window.EqustoCart.cartAddButtonAttrs
            ? '<button class="eq-dept-plp-card__btn" ' +
              window.EqustoCart.cartAddButtonAttrs({
                b: h.brand,
                n: h.name,
                p: h.price,
                c: h.dept || "",
                img: src,
              }) +
              ">" +
              esc(addLbl) +
              "</button>"
            : "";
        return (
          '<article class="eq-dept-plp-card">' +
          '<a class="eq-dept-plp-card__img" href="' +
          esc(href) +
          '">' +
          (src
            ? '<img src="' +
              esc(src) +
              '"' +
              (rawImg
                ? ' data-eq-img-raw="' +
                  esc(rawImg) +
                  '" data-eq-img-step="0"'
                : "") +
              ' alt="" loading="lazy" decoding="async" onerror="typeof __eqImgFail===\'function\'&&__eqImgFail(this)">'
            : '<span class="eq-dept-plp-card__ph">' + esc(imgPh) + "</span>") +
          "</a>" +
          '<a class="eq-dept-plp-card__name" href="' +
          esc(href) +
          '">' +
          esc(h.name || "") +
          "</a>" +
          (h.brand
            ? '<div class="eq-dept-plp-card__brand">' + esc(h.brand) + "</div>"
            : "") +
          (h.price || h.satis_eur_indirimli
            ? '<div class="eq-dept-plp-card__price">' + esc(formatPrice(h)) + "</div>"
            : "") +
          cartBtn +
          "</article>"
        );
      })
      .join("");
  }

  function load() {
    var q = getQuery();
    var inp = document.querySelector("header .srch-input");
    if (inp && q) inp.value = q;

    if (!q) {
      render([], "", 0, null);
      return;
    }

    var grid = document.getElementById("eq-arama-grid");
    if (grid)
      grid.innerHTML =
        '<p class="eq-dept-plp-status">' +
        esc(__searchT("search.searching", "Aranıyor…")) +
        "</p>";

    fetch("/api/search?q=" + encodeURIComponent(q) + "&limit=" + LIMIT, {
      headers: { Accept: "application/json" },
    })
      .then(function (r) {
        return r.json().then(function (data) {
          return { ok: r.ok, data: data };
        });
      })
      .then(function (res) {
        if (!res.ok || res.data.error) {
          render(
            [],
            q,
            0,
            res.data.error || __searchT("search.service_unavailable", "Arama servisi kullanılamıyor.")
          );
          return;
        }
        return loadCatalogImageMap().then(function () {
          var hits = sortHitsWithImagesFirst(enrichHits(res.data.hits || []));
          var warn = res.data.warning ? " " + res.data.warning : "";
          render(hits, q, res.data.estimatedTotalHits, warn || null);
        });
      })
      .catch(function (e) {
        render(
          [],
          q,
          0,
          e && e.message ? e.message : __searchT("search.connection_error", "Bağlantı hatası")
        );
      });
  }

  document.addEventListener("equsto:kur-updated", function () {
    if (lastRender.q) {
      render(lastRender.hits, lastRender.q, lastRender.total, lastRender.err);
    }
  });

  window.addEventListener("equsto:i18n-ready", function () {
    if (lastRender.q || lastRender.hits.length || !getQuery()) {
      render(lastRender.hits, lastRender.q || getQuery(), lastRender.total, lastRender.err);
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", load);
  } else {
    load();
  }
})();
