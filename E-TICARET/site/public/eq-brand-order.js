/**
 * Equsto öncelikli marka sırası — filtre, çekmece, marka hub.
 * Düşük indeks = önce; listede olmayan markalar ürün adedine göre sıralanır.
 */
(function (w) {
  var ORDER = [
    "İnoksan",
    "Electrolux Professional",
    "Şenox",
    "Rational",
    "Öztiryakiler",
    "Robot Coupe",
    "Atalay",
    "Faema",
    "Sanremo",
    "Gtech",
    "La Cimbali",
  ];
  w.__EQUSTO_REF_MARKALAR_SIRASI = ORDER.slice();
  w.__EQUSTO_MARKA_BOYUT_SIRASI = ORDER.slice();

  function brandRankKey(name) {
    return String(name || "")
      .trim()
      .toLocaleLowerCase("tr")
      .replace(/ı/g, "i");
  }

  function reorderHomeBrandGrid() {
    var grid = document.getElementById("eq-home-brand-grid");
    if (!grid) return;
    var rank = {};
    ORDER.forEach(function (name, i) {
      rank[brandRankKey(name)] = i;
    });
    var alias = {
      electrolux: brandRankKey("Electrolux Professional"),
      samixir: brandRankKey("Sanremo"),
    };
    var cells = Array.prototype.slice.call(grid.querySelectorAll(".eq-brand-cell"));
    if (!cells.length) return;
    cells.sort(function (a, b) {
      var ta = brandRankKey((a.textContent || "").trim());
      var tb = brandRankKey((b.textContent || "").trim());
      if (alias[ta] !== undefined) ta = alias[ta];
      if (alias[tb] !== undefined) tb = alias[tb];
      var ia = Object.prototype.hasOwnProperty.call(rank, ta) ? rank[ta] : 1e9;
      var ib = Object.prototype.hasOwnProperty.call(rank, tb) ? rank[tb] : 1e9;
      if (ia !== ib) return ia - ib;
      return ta.localeCompare(tb, "tr");
    });
    cells.forEach(function (el) {
      grid.appendChild(el);
    });
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", reorderHomeBrandGrid);
    } else {
      reorderHomeBrandGrid();
    }
  }
})(typeof window !== "undefined" ? window : globalThis);
