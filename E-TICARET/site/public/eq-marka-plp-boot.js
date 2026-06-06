/**
 * Marka slug PLP — mağaza grid (kategori kutuları yok), öncelikli karışık sıra.
 */
(function () {
  "use strict";

  var PAGE_PRIO = [
    { re: /pisirme|izgara|kuzine|fritez|ocak|salamander|wok|doner|sanayi-ocak|pisirici/i, label: "pişirme" },
    { re: /firin|konveksiyon|pastane.fir|kombi|pompe/i, label: "fırın" },
    { re: /buzdolab|derin.donduruc|sogutuc|buz.makin|donduruc|sogutma|teshir/i, label: "soğutma" },
    { re: /yikama|bulasik|giyotin|kurutma|flight|konveyor|cop.siyirma|bardak.yik/i, label: "yıkama" },
  ];

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function normHay(row) {
    return (String(row.category || "") + " " + String(row.name || ""))
      .toLocaleLowerCase("tr")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function hashStr(s) {
    var h = 0;
    var i;
    for (i = 0; i < s.length; i++) {
      h = (h * 31 + s.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
  }

  function brandPriorityRank(row) {
    var cat = String(row.category || row.cat || "").toLocaleLowerCase("tr");
    var h = normHay(row);
    var i;
    for (i = 0; i < PAGE_PRIO.length; i++) {
      if (PAGE_PRIO[i].re.test(cat) || PAGE_PRIO[i].re.test(h)) return i;
    }
    return PAGE_PRIO.length;
  }

  function brandProductSorter(a, b) {
    var ra = brandPriorityRank(a);
    var rb = brandPriorityRank(b);
    if (ra !== rb) return ra - rb;
    var ha = hashStr(String(a.sku || a.id || a.name || ""));
    var hb = hashStr(String(b.sku || b.id || b.name || ""));
    if (ha !== hb) return ha - hb;
    return String(a.name || "").localeCompare(String(b.name || ""), "tr");
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
    if (tries > 400) {
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
    document.body.classList.add("eq-marka-plp", "eq-marka-plp-shop");

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
        var total = (all || []).filter(predicate).length;
        window.EqCategoryShell.mount({
          root: root,
          catLabel: displayName,
          catDesc: total ? total + " ürün" : "",
          plpMode: true,
          productPredicate: predicate,
          productSorter: slug === "robot-coupe" ? null : brandProductSorter,
          productSortList:
            slug === "robot-coupe" &&
            window.EqDeptTips &&
            typeof window.EqDeptTips.sortRobotCoupeProducts === "function"
              ? function (list) {
                  return window.EqDeptTips.sortRobotCoupeProducts(list, "marka-robot-coupe");
                }
              : null,
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
