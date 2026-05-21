/**
 * /arama?q= — Meilisearch sonuç sayfası (statik mağaza kromu)
 */
;(function () {
  "use strict";

  var LIMIT = 48;

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

  function imgSrc(hit) {
    var img = hit && hit.image;
    if (!img) return "";
    img = String(img).replace(/\\/g, "/");
    if (img.indexOf("http") === 0 || img.indexOf("/") === 0) return img;
    return "/" + img;
  }

  function formatPrice(p) {
    if (!p) return "";
    return String(p).split("\n")[0];
  }

  function getQuery() {
    try {
      return trimQ(new URLSearchParams(location.search).get("q") || "");
    } catch (_) {
      return "";
    }
  }

  function render(hits, q, total, err) {
    var title = document.getElementById("eq-arama-title");
    var count = document.getElementById("eq-arama-count");
    var grid = document.getElementById("eq-arama-grid");
    if (!grid) return;

    if (title) {
      title.textContent = q ? "Arama: «" + q + "»" : "Arama";
    }
    if (count) {
      if (err) count.textContent = err;
      else if (!q) count.textContent = "Anahtar kelime girin.";
      else
        count.textContent =
          hits.length === 0
            ? "Sonuç bulunamadı."
            : (total != null ? total : hits.length) + " sonuç";
    }

    if (err) {
      grid.innerHTML =
        '<p class="eq-dept-plp-status eq-dept-plp-status--err">' + esc(err) + "</p>";
      return;
    }
    if (!q) {
      grid.innerHTML = '<p class="eq-dept-plp-status">Üst çubuktan arama yapın.</p>';
      return;
    }
    if (!hits.length) {
      grid.innerHTML = '<p class="eq-dept-plp-empty">Bu aramaya uygun ürün yok.</p>';
      return;
    }

    grid.innerHTML = hits
      .map(function (h) {
        var href = productHref(h);
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
              ">SEPETE EKLE</button>"
            : "";
        return (
          '<article class="eq-dept-plp-card">' +
          '<a class="eq-dept-plp-card__img" href="' +
          esc(href) +
          '">' +
          (src
            ? '<img src="' + esc(src) + '" alt="" loading="lazy">'
            : '<span class="eq-dept-plp-card__ph">Görsel</span>') +
          "</a>" +
          '<a class="eq-dept-plp-card__name" href="' +
          esc(href) +
          '">' +
          esc(h.name || "") +
          "</a>" +
          (h.brand
            ? '<div class="eq-dept-plp-card__brand">' + esc(h.brand) + "</div>"
            : "") +
          (h.price
            ? '<div class="eq-dept-plp-card__price">' + esc(formatPrice(h.price)) + "</div>"
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
    if (grid) grid.innerHTML = '<p class="eq-dept-plp-status">Aranıyor…</p>';

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
          render([], q, 0, res.data.error || "Arama servisi kullanılamıyor.");
          return;
        }
        render(res.data.hits || [], q, res.data.estimatedTotalHits, null);
      })
      .catch(function (e) {
        render([], q, 0, e && e.message ? e.message : "Bağlantı hatası");
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", load);
  } else {
    load();
  }
})();
