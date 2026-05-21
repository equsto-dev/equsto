/**
 * Mağaza vitrinde yalnızca ATALAY PDF + döner katalog satırları (PFOS/BESOS/WhatsApp ayrı).
 */
;(function () {
  "use strict";

  function eqIsAtalayCatalogRow(row) {
    if (!row) return false;
    var k = String(row.kaynak || row.kaynak_fiyat_listesi || "");
    if (/^atalay-2025/i.test(k)) return true;
    var brand = String(row.brand || row.b || row.marka_ad || "");
    if (/atalay/i.test(brand)) return true;
    var img = "";
    if (Array.isArray(row.images) && row.images[0]) img = row.images[0];
    else img = row.img || row.image || row.gorsel_url || "";
    img = String(img).replace(/\\/g, "/");
    if (/catalog\/atalay\//i.test(img)) return true;
    return false;
  }

  function eqFilterAtalayCatalogOnly(list) {
    if (!Array.isArray(list)) return [];
    return list.filter(function (item) {
      var raw = item && item.raw ? item.raw : item;
      return eqIsAtalayCatalogRow(raw);
    });
  }

  window.eqIsAtalayCatalogRow = eqIsAtalayCatalogRow;
  window.eqFilterAtalayCatalogOnly = eqFilterAtalayCatalogOnly;
})();
