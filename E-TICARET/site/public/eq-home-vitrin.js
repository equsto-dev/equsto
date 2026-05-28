/**
 * Ana sayfa vitrin şeritleri — arka planda kalan / ayrı departman ürünleri.
 */
;(function () {
  "use strict";

  function eqHomeVitrinExclude(row) {
    if (!row) return false;
    var raw = row.raw || row;
    if (raw.vitrin_arka_plan === true) return true;
    if (String(raw.dept || row.dept || "") === "set-ustu-mutfak") return true;
    var k = String(raw.kaynak || raw.kaynak_fiyat_listesi || "");
    if (/^ozti/i.test(k)) return true;
    return false;
  }

  window.eqHomeVitrinExclude = eqHomeVitrinExclude;
})();
