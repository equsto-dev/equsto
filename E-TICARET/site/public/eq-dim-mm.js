/**
 * Ölçü etiketleri — değerler mm cinsinden, birim ibaresi yok (örn. 1200×700×850).
 */
(function (g) {
  function dimLabelFromMm(w, d, h) {
    w = Math.round(Number(w) || 0);
    d = Math.round(Number(d) || 0);
    h = Math.round(Number(h) || 0);
    if (w && d && h) return w + "\u00d7" + d + "\u00d7" + h;
    if (w && d) return w + "\u00d7" + d;
    if (w && h) return w + "\u00d7" + h;
    if (w) return String(w);
    if (d && h) return d + "\u00d7" + h;
    if (d) return String(d);
    if (h) return String(h);
    return "";
  }

  function stripDimUnitSuffix(s) {
    return String(s || "")
      .trim()
      .replace(/[x*]/gi, "\u00d7")
      .replace(/\s*(?:mm|cm)\b\.?/gi, "")
      .trim();
  }

  g.eqDimLabelFromMm = dimLabelFromMm;
  g.eqDimTezgahLabelFromMm = dimLabelFromMm;
  g.eqStripDimUnitSuffix = stripDimUnitSuffix;
})(typeof window !== "undefined" ? window : globalThis);
