;(function () {
  "use strict";
  /**
   * PFOS konsept şablonu → POST /api/pfos/calculate
   * EqustoPfosTemplateApi.calculate({ konsept, m2, fiyatStratejisi, sehir })
   */
  var API_QUOTE = "/api/pfos/quote";
  var API_CALC = "/api/pfos/calculate";
  var API_KONSEPT = "/api/pfos/konseptler";
  var FALLBACK_KONSEPT = "/data/pfos-konseptler.json?v=20260531sushi";

  var KAT_DEPT = {
    A: "kahve",
    B: "pisirme",
    C: "hazirlik",
    D: "pastane",
    E: "hazirlik",
    F: "pisirme",
    G: "sogutma",
    H: "yikama",
    X: "nakliye",
  };

  /**
   * Soru formu (D.konsept / D.dukkan) → lib/pfos şablon slug
   * Eşleşmeyen konseptlerde "" → /pfos eski zone + kural motoru
   */
  function normKonseptSlug(konsept, dukkan) {
    var k = String(konsept || "").trim();
    var d = String(dukkan || "").trim();
    if (/steakhouse/i.test(k) || /steakhouse/i.test(d)) return "steakhouse";
    if (
      d === "Balık Restaurant" ||
      /balık\s*restaurant|balik\s*restaurant|deniz\s*ürün|seafood/i.test(d) ||
      (/balık|balik/i.test(d) && /restaurant|restoran|lokanta|bistro/i.test(d))
    ) {
      return "balikci";
    }
    if (/pizzac/i.test(d) || /pizzac/i.test(k)) return "pizzaci";
    if (/dönerci|donerci/i.test(d)) return "kebap-ortadogu";
    if (/coffee|^cafe$|kafe-kafeterya|kafe$/i.test(k) || (/^cafe$/i.test(d) && !/restaurant/i.test(k)))
      return "coffee-shop";
    if (/meyhane|meze|gurme şarküteri/i.test(d) || /meyhane/i.test(k)) return "meyhane";
    if (/kebap|ortadoğu|ocakbaşı|ocakbasi/i.test(k) || /kebap/i.test(d)) return "kebap-ortadogu";
    if (/türk|turk|sütiş|sutis|restaurant/i.test(k) && !/steakhouse/i.test(k) && !/pizzac/i.test(d))
      return "turk-restoran";
    if (d === "Pizzacı") return "pizzaci";
    if (d === "Pideci" || /pideci|pide\s*ci/i.test(d)) return "pideci";
    if (d === "Sushi" || /sushi|omakase/i.test(d) || /sushi/i.test(k)) return "sushi";
    if (d === "Dönerci") return "kebap-ortadogu";
    return "";
  }

  /** POST /api/pfos/calculate yanıtı → pfos.html satır formatı */
  function responseToRows(pfosData) {
    if (!pfosData || !pfosData.kalemler) return [];
    var kalemler = pfosData.kalemler;
    var out = [];
    for (var i = 0; i < kalemler.length; i++) {
      var k = kalemler[i];
      var u = k.urun;
      var dept = KAT_DEPT[k.kategoriKodu] || "pisirme";
      var marka = u ? u.marka + (u.model ? " — " + u.model : "") : "—";
      var adet = Math.max(1, Number(k.adet) || 1);
      var row = {
        kod: u && u.sku ? String(u.sku) : "PFOS-" + (k.poz || k.urunTipi),
        tip_kodu: k.urunTipi || "",
        ad: u ? u.ad : k.isim,
        marka: marka,
        olcu: u && u.model ? String(u.model) : "",
        dimensions: u && u.model ? String(u.model) : "",
        adet: adet,
        birim: 0,
        elk: u && u.elektrikGucuKw != null ? Number(u.elektrikGucuKw) : Number(k.elektrikGucuKwHint) || 0,
        gaz: u && u.gazGucuKw != null ? Number(u.gazGucuKw) : Number(k.gazGucuKwHint) || 0,
        pct: 0,
        pfDept: dept,
        pfosPoz: k.poz,
        pfosUrunTipi: k.urunTipi,
        pfosTip: k.tip,
        pfosKonsept: pfosData.konsept,
        pfZone: k.zoneKey || "",
        pfZoneLabel: k.zoneLabel || "",
        pfCatM2:
          pfosData.bolumM2 && k.zoneKey && pfosData.bolumM2[k.zoneKey] != null
            ? Number(pfosData.bolumM2[k.zoneKey])
            : undefined,
        equstoPage: u && u.slug ? "/shop/" + dept + "?q=" + encodeURIComponent(u.slug) : "",
        lineTotal: 0,
        fiyat_net: false,
        fiyat_haric: false,
        fiyat_kaynak: "eticaret",
      };
      out.push(row);
    }
    return out;
  }

  async function listKonseptler() {
    var r = await fetch(API_KONSEPT, { headers: { Accept: "application/json" } });
    if (r.ok) {
      var j = await r.json();
      return j.konseptler || [];
    }
    if (r.status === 404) {
      var fr = await fetch(FALLBACK_KONSEPT, { headers: { Accept: "application/json" } });
      var fj = await fr.json();
      if (fr.ok) return fj.konseptler || [];
    }
    var errBody = await r.json().catch(function () { return {}; });
    throw new Error(errBody.error || "HTTP " + r.status);
  }

  async function calculate(opts) {
    opts = opts || {};
    var body = {
      konsept: opts.konsept,
      m2: Number(opts.m2),
      fiyatStratejisi: opts.fiyatStratejisi || "ekonomik",
      sehir: opts.sehir || undefined,
      lokasyon: opts.lokasyon || undefined,
      bolumM2: opts.bolumM2 || undefined,
      teslimatAdresi: opts.teslimatAdresi || undefined,
      altTip: opts.altTip || undefined,
    };
    if (!body.konsept) throw new Error("konsept zorunlu");
    var r = await fetch(API_QUOTE, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });
    var j = await r.json();
    if (!r.ok) throw new Error(j.error || "HTTP " + r.status);
    return j;
  }

  window.EqustoPfosTemplateApi = {
    calculate: calculate,
    listKonseptler: listKonseptler,
    normKonseptSlug: normKonseptSlug,
    responseToRows: responseToRows,
  };
})();
