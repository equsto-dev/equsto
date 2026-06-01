/**
 * EqCategoryShell — marka sayfası için ürün listeleyici.
 * Kaynak veri: EqustoShopCatalog.load() (data/ekipmanlar.json).
 *
 * Sadece marka.html tarafından kullanılır.
 */
(function (global) {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function priceOneLine(p) {
    var s = String(p || "").trim();
    if (!s) return "";
    return s.split("\n")[0].trim();
  }

  function imgSrc(p) {
    if (!p) return "";
    if (typeof global.eqProductImgSrc === "function") {
      try {
        var r = global.eqProductImgSrc(p);
        if (r) return r;
      } catch (_) {}
    }
    var s = String(p).trim().replace(/\\/g, "/");
    if (/^https?:\/\//i.test(s)) return s;
    if (s.charAt(0) === "/") return s;
    return "/" + s;
  }

  function deptFromCategory(cat, fallbackDept) {
    if (typeof global.eqCategoryToUrunlerSeg === "function") {
      try {
        var seg = global.eqCategoryToUrunlerSeg(cat);
        if (seg) return seg;
      } catch (_) {}
    }
    return fallbackDept || "pisirme";
  }

  function productHref(row) {
    var dept = deptFromCategory(row.category, row.dept);
    var slug = typeof global.eqProductSlug === "function" ? global.eqProductSlug(row) : "";
    if (!slug) return "#";
    if (typeof global.eqProductPath === "function") return global.eqProductPath(dept, slug);
    return "/shop/" + esc(dept) + "/" + esc(slug);
  }

  function injectCssOnce() {
    if (document.getElementById("eq-cat-shell-css")) return;
    var css =
      ".eq-cat-shell{padding:18px 20px 26px}" +
      ".eq-cat-hero{padding:8px 0 14px}" +
      ".eq-cat-hero h1{font-size:22px;line-height:1.2;margin:0 0 6px}" +
      ".eq-cat-hero p{margin:0;color:var(--eq-text-muted)}" +
      ".eq-cat-tiles{display:flex;flex-wrap:wrap;gap:10px;margin:14px 0 14px}" +
      ".eq-cat-tile{border:1px solid var(--eq-border);background:var(--eq-surface);padding:10px 12px;border-radius:10px;cursor:pointer;user-select:none;font-size:12px}" +
      ".eq-cat-tile strong{font-weight:700}" +
      ".eq-cat-tile.is-active{border-color:rgba(0,30,80,.55);box-shadow:0 0 0 2px rgba(0,30,80,.12) inset}" +
      ".eq-cat-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}" +
      "@media(min-width:1024px){.eq-cat-grid{grid-template-columns:repeat(4,minmax(0,1fr))}}" +
      ".eq-cat-card{border:1px solid var(--eq-border);border-radius:10px;overflow:hidden;background:var(--eq-surface)}" +
      ".eq-cat-card__img{display:block;aspect-ratio:1/1;background:linear-gradient(180deg,var(--eq-surface-2),var(--eq-surface));position:relative}" +
      ".eq-cat-card__img img{width:100%;height:100%;object-fit:contain;display:block;background:#fff}" +
      ".eq-cat-card__body{padding:10px 10px 12px}" +
      ".eq-cat-card__name{display:block;color:var(--eq-text);text-decoration:none;font-size:12px;line-height:1.35;min-height:2.7em}" +
      ".eq-cat-card__brand{color:var(--eq-text-muted);font-size:11px;margin-top:6px}" +
      ".eq-cat-card__price{font-weight:700;margin-top:8px;font-size:12px}" +
      ".eq-cat-card__btn{margin-top:10px;width:100%;border:1px solid var(--eq-border);background:var(--eq-surface);padding:8px 10px;border-radius:9px;font-size:12px;font-weight:700;cursor:pointer}" +
      ".eq-cat-empty{padding:24px 0;color:var(--eq-text-muted)}";
    var st = document.createElement("style");
    st.id = "eq-cat-shell-css";
    st.textContent = css;
    document.head.appendChild(st);
  }

  var MARKA_PAGE_SIZE = 48;

  function mount(opts) {
    opts = opts || {};
    var root = opts.root || document.getElementById("eq-cat-shell");
    if (!root) return;
    injectCssOnce();
    root.classList.add("eq-cat-shell");

    var catLabel = String(opts.catLabel || "").trim() || "Marka";
    var catDesc = String(opts.catDesc || "").trim();
    var predicate = typeof opts.productPredicate === "function" ? opts.productPredicate : function () { return true; };
    var plpMode = !!opts.plpMode;
    var tiles = plpMode ? [] : Array.isArray(opts.tiles) ? opts.tiles : [];
    var productSorter =
      typeof opts.productSorter === "function" ? opts.productSorter : null;

    var state = {
      active: plpMode ? "" : tiles.length ? String(tiles[0].slug || "") : "",
      loadedCount: MARKA_PAGE_SIZE,
      sorted: [],
    };

    function filtered(list) {
      var out = list.filter(function (x) { return x && predicate(x); });
      if (!plpMode && state.active) {
        out = out.filter(function (x) { return String(x.category || "") === state.active; });
      }
      if (productSorter) out.sort(productSorter);
      return out;
    }

    function renderCardPlp(x) {
      var href = productHref(x);
      var im = x.images && x.images[0] ? String(x.images[0]) : "";
      var img = im
        ? '<img src="' +
          esc(imgSrc(im)) +
          '" alt="" loading="lazy" decoding="async" onerror="typeof __eqImgFail===\'function\'&&__eqImgFail(this)">'
        : '<span class="eq-img-ph" aria-hidden="true">—</span>';
      var cartBtn =
        global.EqustoCart && typeof global.EqustoCart.cartAddButtonAttrs === "function"
          ? '<button class="eq-dept-plp-card__btn" ' +
            global.EqustoCart.cartAddButtonAttrs(x) +
            ">SEPETE EKLE</button>"
          : '<button type="button" class="eq-dept-plp-card__btn" onclick="location.href=\'/sepet\'">SEPETE EKLE</button>';
      return (
        '<article class="eq-dept-plp-card">' +
        '<a class="eq-dept-plp-card__img" href="' +
        esc(href) +
        '">' +
        img +
        "</a>" +
        '<a class="eq-dept-plp-card__name" href="' +
        esc(href) +
        '">' +
        esc(x.name || "") +
        "</a>" +
        '<div class="eq-dept-plp-card__price">' +
        esc(priceOneLine(x.price)) +
        "</div>" +
        cartBtn +
        "</article>"
      );
    }

    function renderCard(x) {
      var href = productHref(x);
      var im = x.images && x.images[0] ? String(x.images[0]) : "";
      var img = im
        ? '<img src="' +
          esc(imgSrc(im)) +
          '" alt="" loading="lazy" decoding="async" onerror="typeof __eqImgFail===\'function\'&&__eqImgFail(this)">'
        : '<span class="eq-cat-card__ph" aria-hidden="true"></span>';
      return (
        '<article class="eq-cat-card">' +
        '<a class="eq-cat-card__img" href="' + esc(href) + '">' + img + "</a>" +
        '<div class="eq-cat-card__body">' +
        '<a class="eq-cat-card__name" href="' + esc(href) + '">' + esc(x.name || "") + "</a>" +
        '<div class="eq-cat-card__brand">' + esc(x.oem_brand && x.oem_brand !== x.brand ? x.oem_brand : x.brand || "") + "</div>" +
        '<div class="eq-cat-card__price">' + esc(priceOneLine(x.price)) + "</div>" +
        '<button type="button" class="eq-cat-card__btn" onclick="location.href=\'/sepet\'">SEPETE EKLE</button>' +
        "</div></article>"
      );
    }

    function renderLoadMore(list) {
      var host = root.querySelector("#eq-marka-plp-more");
      if (!host) return;
      var shown = Math.min(state.loadedCount, list.length);
      var remaining = list.length - shown;
      if (!list.length || remaining <= 0) {
        host.innerHTML = "";
        host.hidden = true;
        return;
      }
      host.hidden = false;
      host.innerHTML =
        '<button type="button" class="eq-dept-plp-more__btn" id="eq-marka-load-more">' +
        "Daha fazla göster (" +
        esc(String(remaining)) +
        ")</button>";
      var btn = host.querySelector("#eq-marka-load-more");
      if (btn) {
        btn.onclick = function () {
          state.loadedCount = Math.min(state.loadedCount + MARKA_PAGE_SIZE, list.length);
          render(all);
        };
      }
    }

    function render(all) {
      var list = filtered(all || []);
      state.sorted = list;
      var total = list.length;
      var shown = plpMode ? Math.min(state.loadedCount, total) : total;
      var page = plpMode ? list.slice(0, shown) : list;

      var desc =
        catDesc ||
        (plpMode && total
          ? total + " ürün · pişirme, fırın, soğutma ve yıkama öne çıkar"
          : "");
      var hero =
        '<section class="eq-cat-hero"><h1>' +
        esc(catLabel) +
        "</h1>" +
        (desc ? "<p>" + esc(desc) + "</p>" : "") +
        "</section>";

      var toolbar = "";
      if (plpMode && total) {
        toolbar =
          '<div class="eq-dept-plp-toolbar eq-dept-plp-toolbar--marka">' +
          '<div class="eq-dept-plp-count">' +
          esc(String(shown)) +
          " / " +
          esc(String(total)) +
          " ürün</div>" +
          "</div>";
      }

      var tilesHtml = "";
      if (!plpMode && tiles.length) {
        tilesHtml =
          '<div class="eq-cat-tiles" role="tablist" aria-label="Kategoriler">' +
          tiles
            .map(function (t) {
              var slug = String(t.slug || "");
              var active = slug === state.active;
              return (
                '<button type="button" class="eq-cat-tile' +
                (active ? " is-active" : "") +
                '" data-slug="' +
                esc(slug) +
                '" role="tab" aria-selected="' +
                (active ? "true" : "false") +
                '">' +
                esc(t.label || slug) +
                " " +
                "<strong>(" +
                esc(String((opts.subCounts && opts.subCounts[slug]) || "")) +
                ")</strong>" +
                "</button>"
              );
            })
            .join("") +
          "</div>";
      }

      var cardFn = plpMode ? renderCardPlp : renderCard;
      var gridClass = plpMode ? "eq-dept-plp-grid" : "eq-cat-grid";
      var grid =
        page.length
          ? '<div class="' + gridClass + '">' + page.map(cardFn).join("") + "</div>"
          : '<div class="eq-cat-empty">Bu markada ürün bulunamadı.</div>';

      var moreHost = plpMode
        ? '<div id="eq-marka-plp-more" class="eq-dept-plp-pages eq-dept-plp-loadmore"></div>'
        : "";

      root.innerHTML = hero + toolbar + tilesHtml + grid + moreHost;

      if (plpMode) renderLoadMore(list);

      if (!plpMode) {
        root.querySelectorAll(".eq-cat-tile").forEach(function (b) {
          b.addEventListener("click", function () {
            state.active = String(b.getAttribute("data-slug") || "");
            render(all);
          });
        });
      }
    }

    // Data load
    var loader =
      typeof opts.catalogLoader === "function"
        ? opts.catalogLoader()
        : global.EqustoShopCatalog && typeof global.EqustoShopCatalog.loadMergedCatalog === "function"
          ? global.EqustoShopCatalog.loadMergedCatalog()
          : global.EqustoShopCatalog && typeof global.EqustoShopCatalog.load === "function"
            ? global.EqustoShopCatalog.load()
            : Promise.resolve([]);

    loader
      .then(function (all) {
        // counts for tiles
        var subCounts = {};
        (all || []).forEach(function (x) {
          if (!x || !predicate(x) || !x.category) return;
          subCounts[x.category] = (subCounts[x.category] || 0) + 1;
        });
        opts.subCounts = subCounts;
        if (!plpMode && !state.active && tiles.length) {
          state.active = String(tiles[0].slug || "");
        }
        render(all || []);
      })
      .catch(function () {
        root.innerHTML = '<section class="eq-cat-hero"><h1>' + esc(catLabel) + '</h1><p>Ürünler yüklenemedi.</p></section>';
      });
  }

  global.EqCategoryShell = { mount: mount };
})(typeof window !== "undefined" ? window : globalThis);

