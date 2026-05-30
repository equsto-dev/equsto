/**
 * /arama?q= — Meilisearch sonuç sayfası (statik mağaza kromu)
 */
;(function () {
  "use strict";

  var PAGE_SIZE = 96;
  var allHits = [];
  var loadMoreBusy = false;
  var CATALOG_V = (function () {
    var el = document.querySelector("[data-eq-shop-chrome-v]");
    return (el && el.getAttribute("data-eq-shop-chrome-v")) || "20260529-9890-imgs";
  })();
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

  function catalogSlugFromHit(hit) {
    if (!hit) return "";
    var id = String(hit.id || "").trim().toLowerCase();
    if (id.indexOf("__") >= 0) return id.replace(/\//g, "-");
    var slug = String(hit.slug || "").trim().toLowerCase();
    if (slug.indexOf("__") >= 0) return slug.replace(/\//g, "-");
    return slug;
  }

  function productHref(hit) {
    if (!hit) return "#";
    var dept = String(hit.dept || "pisirme").replace(/^\/+|\/+$/g, "");
    if (dept === "market-reyon") dept = "market-reyonlari";
    var slug = catalogSlugFromHit(hit);
    if (!slug) return "#";
    try {
      if (typeof window.eqProductPath === "function") {
        return window.eqProductPath(dept, slug);
      }
    } catch (_) {}
    return "/shop/" + encodeURIComponent(dept) + "/" + encodeURIComponent(slug);
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
            map[String(row.id)] = {
              images: row.images || [],
              sku: row.sku || row.model || row.urun_kodu || "",
            };
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

  function isCatalogRenderRel(rel) {
    return /\/catalog\/ozti\/(?:web|p287|pdf|katalog)\//i.test(String(rel || ""));
  }

  function slugOzti(kod) {
    return (
      "ozti-" +
      String(kod || "")
        .toLowerCase()
        .replace(/\./g, "-")
        .replace(/[^a-z0-9-]/g, "")
    );
  }

  /** PLP ile uyumlu: cafemarkt foto önce; ax web render (katalog tablosu) kullanma. */
  function pickCatalogImage(row, mapped) {
    var imgs = (row && row.images) || [];
    var i;
    for (i = 0; i < imgs.length; i++) {
      if (/cafemarkt/i.test(imgs[i])) return String(imgs[i]).replace(/\\/g, "/");
    }
    for (i = 0; i < imgs.length; i++) {
      if (!isCatalogRenderRel(imgs[i])) return String(imgs[i]).replace(/\\/g, "/");
    }
    var rel = String(mapped || imgs[0] || "").replace(/\\/g, "/");
    if (rel && isCatalogRenderRel(rel)) {
      var kod = row && (row.sku || row.model || row.urun_kodu);
      if (kod) {
        return "images/catalog/ozti/cafemarkt/" + slugOzti(kod) + ".jpg";
      }
      return rel.replace("/ozti/web/", "/ozti/cafemarkt/");
    }
    return rel;
  }

  function enrichHits(hits) {
    if (!catalogImgById || !Array.isArray(hits)) return hits || [];
    return hits.map(function (h) {
      if (!h) return h;
      var cat = catalogImgById[h.id];
      var row = cat
        ? { images: cat.images || [], sku: cat.sku || h.sku || h.model }
        : { images: h.image ? [h.image] : [], sku: h.sku || h.model };
      var img = pickCatalogImage(row, cat && cat.images && cat.images[0]);
      if (!img && h.image) return h;
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

  function ensureMoreHost() {
    var host = document.getElementById("eq-arama-more");
    if (!host) {
      host = document.createElement("div");
      host.id = "eq-arama-more";
      host.className = "eq-arama-more";
      var grid = document.getElementById("eq-arama-grid");
      if (grid && grid.parentNode) grid.parentNode.appendChild(host);
    }
    return host;
  }

  function renderMoreButton(q, total, hasMore) {
    var host = ensureMoreHost();
    if (!host) return;
    if (!hasMore || !q) {
      host.innerHTML = "";
      return;
    }
    var shown = allHits.length;
    host.innerHTML =
      '<button type="button" class="eq-arama-more__btn" id="eq-arama-more-btn">' +
      esc(__searchT("search.load_more", "{shown} / {total} — daha fazla göster", {
        shown: String(shown),
        total: String(total),
      })) +
      "</button>";
    var btn = document.getElementById("eq-arama-more-btn");
    if (btn) {
      btn.onclick = function () {
        fetchPage(q, shown, false);
      };
    }
  }

  function render(hits, q, total, err, opts) {
    opts = opts || {};
    allHits = hits || [];
    hits = allHits;
    lastRender = { hits: hits, q: q || "", total: total, err: err };
    var title = document.getElementById("eq-arama-title");
    var count = document.getElementById("eq-arama-count");
    var grid = document.getElementById("eq-arama-grid");
    if (!grid) return;

    syncPageTitle(q);

    if (title) {
      title.textContent = q
        ? __searchT("search.results_for", "Arama sonuçları")
        : __searchT("search.title", "Arama");
    }
    if (count) {
      if (err) count.textContent = err;
      else if (!q) count.textContent = __searchT("search.enter_keyword", "Anahtar kelime girin.");
      else if (hits.length === 0)
        count.textContent = __searchT("search.no_results_for", "«{q}» için sonuç bulunamadı.", { q: q });
      else
        count.textContent = __searchT("search.results_count_q", "«{q}» — {n} sonuç", {
          q: q,
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
    try {
      if (window.EqustoProductTint && typeof window.EqustoProductTint.refreshPlp === "function") {
        window.EqustoProductTint.refreshPlp(grid);
      } else {
        document.dispatchEvent(new CustomEvent("equsto:plp-grid-updated", { detail: { root: grid } }));
      }
    } catch (_) {}
    renderMoreButton(q, total != null ? total : hits.length, opts.hasMore);
  }

  function fetchPage(q, offset, replace) {
    if (loadMoreBusy) return;
    loadMoreBusy = true;
    var grid = document.getElementById("eq-arama-grid");
    if (replace && grid) {
      grid.innerHTML =
        '<p class="eq-dept-plp-status">' +
        esc(__searchT("search.searching", "Aranıyor…")) +
        "</p>";
    } else {
      var btn = document.getElementById("eq-arama-more-btn");
      if (btn) btn.disabled = true;
    }

    fetch(
      "/api/search?q=" +
        encodeURIComponent(q) +
        "&limit=" +
        PAGE_SIZE +
        "&offset=" +
        offset,
      { headers: { Accept: "application/json" } }
    )
      .then(function (r) {
        return r.json().then(function (data) {
          return { ok: r.ok, data: data };
        });
      })
      .then(function (res) {
        loadMoreBusy = false;
        if (!res.ok || res.data.error) {
          render(
            replace ? [] : allHits.slice(),
            q,
            0,
            res.data.error || __searchT("search.service_unavailable", "Arama servisi kullanılamıyor."),
            { hasMore: false }
          );
          return;
        }
        var rawHits = sortHitsWithImagesFirst(res.data.hits || []);
        var warn = res.data.warning ? " " + res.data.warning : "";
        var total = res.data.estimatedTotalHits;
        var hasMore = !!res.data.hasMore;
        if (replace) allHits = rawHits;
        else allHits = allHits.concat(rawHits);
        render(allHits, q, total, warn || null, { hasMore: hasMore });
        return loadCatalogImageMap().then(function () {
          var enriched = sortHitsWithImagesFirst(enrichHits(res.data.hits || []));
          if (replace) {
            allHits = enriched;
          } else {
            var start = allHits.length - enriched.length;
            for (var i = 0; i < enriched.length; i++) allHits[start + i] = enriched[i];
          }
          render(allHits, q, total, warn || null, { hasMore: hasMore });
        });
      })
      .catch(function (e) {
        loadMoreBusy = false;
        render(
          replace ? [] : allHits.slice(),
          q,
          0,
          e && e.message ? e.message : __searchT("search.connection_error", "Bağlantı hatası"),
          { hasMore: false }
        );
      });
  }

  function load() {
    var q = getQuery();
    var inp = document.querySelector("header .srch-input");
    if (inp && q) inp.value = q;

    if (!q) {
      render([], "", 0, null);
      return;
    }

    fetchPage(q, 0, true);
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
