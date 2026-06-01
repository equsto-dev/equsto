/**
 * Marka slug PLP — script yüklemesini bekler, katalog + oem_brand filtresi.
 * MarkaHubScripts içinde son sırada yüklenir.
 */
(function () {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function getSlug() {
    var el = document.getElementById("eq-cat-shell");
    if (el && el.getAttribute("data-slug")) return String(el.getAttribute("data-slug")).trim();
    try {
      if (typeof window.eqParseBrandSlugFromPath === "function") {
        return window.eqParseBrandSlugFromPath() || "";
      }
      var m = (location.pathname || "").match(/\/shop\/marka\/([^/?#]+)/i);
      return m ? decodeURIComponent(m[1]).toLowerCase() : "";
    } catch (_) {
      return "";
    }
  }

  function displayLabel(slug) {
    if (typeof window.eqBrandFromSlug === "function") {
      var canon = window.eqBrandFromSlug(slug);
      if (canon) return canon;
    }
    if (typeof window.brandHubLabel === "function") return window.brandHubLabel(slug);
    return slug.replace(/-/g, " ").replace(/\b\w/g, function (c) {
      return c.toUpperCase();
    });
  }

  function rowMatches(row, slug) {
    if (typeof window.eqBrandMatchesRow === "function") {
      var brand =
        (typeof window.eqBrandFromSlug === "function" ? window.eqBrandFromSlug(slug) : "") || slug;
      return window.eqBrandMatchesRow(row, brand, slug);
    }
    var b = String((row && row.brand) || "").toLowerCase();
    var oem = String((row && row.oem_brand) || "").toLowerCase();
    var needle = slug.replace(/-/g, " ").toLowerCase();
    return b.indexOf(needle) >= 0 || oem.indexOf(needle) >= 0;
  }

  function depsReady() {
    return (
      window.EqustoShopCatalog &&
      typeof window.EqustoShopCatalog.loadMergedCatalog === "function" &&
      window.EqCategoryShell &&
      typeof window.EqCategoryShell.mount === "function"
    );
  }

  function waitDeps(tries, cb) {
    if (depsReady()) {
      cb();
      return;
    }
    if (tries > 200) {
      var root = document.getElementById("eq-cat-shell");
      if (root) {
        root.innerHTML =
          '<section class="eq-cat-hero"><h1>Marka</h1><p>Ürün listesi yüklenemedi — sayfayı yenileyin.</p></section>';
      }
      return;
    }
    setTimeout(function () {
      waitDeps(tries + 1, cb);
    }, 50);
  }

  function boot() {
    var slug = getSlug();
    if (!slug) return;
    var root = document.getElementById("eq-cat-shell");
    if (!root) return;

    root.setAttribute("data-slug", slug);
    document.body.classList.add("eq-marka-plp");

    var displayName =
      root.getAttribute("data-label") ||
      (typeof window.__EQ_MARKA_LABEL === "string" && window.__EQ_MARKA_LABEL) ||
      displayLabel(slug);

    var crumb = document.getElementById("eq-brand-crumb");
    if (crumb) crumb.textContent = displayName;
    document.title = displayName + " · Equsto";

    function predicate(row) {
      return rowMatches(row, slug);
    }

    window.EqustoShopCatalog.loadMergedCatalog()
      .then(function (all) {
        var rows = (all || []).filter(predicate);
        var catCounts = {};
        rows.forEach(function (r) {
          var c = String(r.category || r.cat || "").trim();
          if (c) catCounts[c] = (catCounts[c] || 0) + 1;
        });
        var cats = Object.keys(catCounts).sort(function (a, b) {
          return catCounts[b] - catCounts[a];
        });
        var tiles = cats.map(function (c) {
          return {
            id: c,
            slug: c,
            label: c.replace(/-+$/, "").replace(/-/g, " "),
          };
        });

        window.EqCategoryShell.mount({
          root: root,
          catLabel: displayName,
          catDesc: displayName + " markalı tüm ürünler — kategoriye göre incele.",
          catSlugs: cats,
          tiles: tiles,
          tilesHdr: "Kategoriye göre incele",
          hideBrandStrip: true,
          productPredicate: predicate,
          catalogLoader:
            window.EqustoShopCatalog && typeof window.EqustoShopCatalog.loadMergedCatalog === "function"
              ? window.EqustoShopCatalog.loadMergedCatalog.bind(window.EqustoShopCatalog)
              : null,
        });
      })
      .catch(function () {
        root.innerHTML =
          '<section class="eq-cat-hero"><h1>' +
          esc(displayName) +
          "</h1><p>Ürünler yüklenemedi.</p></section>";
      });
  }

  waitDeps(0, boot);
})();
