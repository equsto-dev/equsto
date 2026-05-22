;(function () {
  "use strict";
  /**
   * PFOS konsept şablonu → POST /api/pfos/calculate
   * EqustoPfosTemplateApi.calculate({ konsept, m2, fiyatStratejisi, sehir })
   */
  var API_CALC = "/api/pfos/calculate";
  var API_KONSEPT = "/api/pfos/konseptler";

  function normKonseptSlug(konsept, dukkan) {
    var k = String(konsept || "").trim();
    var d = String(dukkan || "").trim();
    if (/pizzac/i.test(d) || /pizzac/i.test(k)) return "pizzaci";
    if (/coffee|cafe|kafe/i.test(k) && !/restaurant/i.test(k)) return "coffee-shop";
    if (/meyhane|meze/i.test(d) || /meyhane/i.test(k)) return "meyhane";
    if (/kebap|ortadoğu|czn|burak/i.test(k) || /kebap|dönerci/i.test(d)) return "kebap-ortadogu";
    if (/türk|turk|sütiş|sutis/i.test(k)) return "turk-restoran";
    return "";
  }

  async function listKonseptler() {
    var r = await fetch(API_KONSEPT, { headers: { Accept: "application/json" } });
    var j = await r.json();
    if (!r.ok) throw new Error(j.error || "HTTP " + r.status);
    return j.konseptler || [];
  }

  async function calculate(opts) {
    opts = opts || {};
    var body = {
      konsept: opts.konsept,
      m2: Number(opts.m2),
      fiyatStratejisi: opts.fiyatStratejisi || "orta",
      sehir: opts.sehir || undefined,
    };
    if (!body.konsept) throw new Error("konsept zorunlu");
    var r = await fetch(API_CALC, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });
    var j = await r.json();
    if (!r.ok) throw new Error(j.error || "HTTP " + r.status);
    return j.data;
  }

  window.EqustoPfosTemplateApi = {
    calculate: calculate,
    listKonseptler: listKonseptler,
    normKonseptSlug: normKonseptSlug,
  };
})();
