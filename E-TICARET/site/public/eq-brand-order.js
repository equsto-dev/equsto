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
})(typeof window !== "undefined" ? window : globalThis);
