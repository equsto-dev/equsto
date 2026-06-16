;(function () {
  "use strict";
  /**
   * PFOS konsept şablonu → POST /api/pfos/calculate
   * EqustoPfosTemplateApi.calculate({ konsept, m2, fiyatStratejisi, sehir })
   */
  var API_QUOTE = "/api/pfos/quote";
  var API_CALC = "/api/pfos/calculate";
  var API_KONSEPT = "/api/pfos/konseptler";
  var FALLBACK_KONSEPT = "/data/pfos-konseptler.json?v=20260531mus-selinoz-turk";

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
      (/balık|balik/i.test(d) && /restaurant|restoran|lokanta|bistro/i.test(d)) ||
      /uçan\s*balık|ucan\s*balik/i.test(d) ||
      /uçan\s*balık|ucan\s*balik/i.test(k)
    ) {
      return "balikci";
    }
    if (/pizzac/i.test(d) || /pizzac/i.test(k)) return "pizzaci";
    if (/dönerci|donerci/i.test(d)) return "kebap-ortadogu";
    if (
      /espressolab|espresso\s*lab/i.test(d) ||
      /espressolab|espresso\s*lab/i.test(k) ||
      /watergarden/i.test(d) ||
      /watergarden/i.test(k)
    ) {
      return "coffee-shop";
    }
    if (/coffee|^cafe$|kafe-kafeterya|kafe$/i.test(k) || (/^cafe$/i.test(d) && !/restaurant/i.test(k)))
      return "coffee-shop";
    if (/meyhane|meze|gurme şarküteri/i.test(d) || /meyhane/i.test(k)) return "meyhane";
    if (/kebap|ortadoğu|ocakbaşı|ocakbasi/i.test(k) || /kebap/i.test(d)) return "kebap-ortadogu";
    if (
      /sütiş|sutis|şişhane|sislihane/i.test(d) ||
      (/türk|turk/i.test(k) && /esnaf|lokanta|sütiş|sutis/i.test(d))
    ) {
      return "turk-restoran";
    }
    if (/türk|turk|restaurant/i.test(k) && !/steakhouse/i.test(k) && !/pizzac/i.test(d))
      return "turk-restoran";
    if (d === "Pizzacı") return "pizzaci";
    if (
      d === "Kahve Atölyesi" ||
      /kahve\s*atölyesi|kahve\s*atolyesi/i.test(d) ||
      /kahve\s*atölyesi/i.test(k)
    ) {
      return "kahve-atolyesi";
    }
    if (
      /pastane\s*&\s*kahvaltı|pastane\s*ve\s*kahvaltı|sultangazi/i.test(d) ||
      /pastane\s*kahvalt/i.test(k)
    ) {
      return "kahve-duragi-pastane";
    }
    if (
      d === "Kahve Durağı" ||
      (/kahve\s*durağı|kahve\s*duragi|kave\s*durağı|kave\s*duragi/i.test(d) &&
        !/pastane|kahvaltı|kahvalti|sultangazi/i.test(d)) ||
      (/kahve\s*durağı|kahve\s*duragi/i.test(k) && !/pastane|kahvalt/i.test(k))
    ) {
      return "kahve-duragi";
    }
    if (
      d === "Kahve & Tatlı" ||
      /kahve\s*(ve|&)\s*tatlı|kahve\s*(ve|&)\s*tatli/i.test(d) ||
      /hacıbozan|hacibozan|çemberlitaş|cemberlitas/i.test(d) ||
      /kahve\s*tatlı|kahve-tatli/i.test(k)
    ) {
      return "kahve-tatli";
    }
    if (
      d === "Harvest Cafe" ||
      /harvest\s*cafe/i.test(d) ||
      /harvest/i.test(k)
    ) {
      return "harvest-cafe";
    }
    if (
      d === "All Sport Cafe" ||
      /all\s*sport\s*cafe/i.test(d) ||
      /all\s*sport/i.test(k)
    ) {
      return "all-sport-cafe";
    }
    if (
      d === "Casual Cafe" ||
      /casual\s*cafe/i.test(d) ||
      /şifa\s*cafe|sifa\s*cafe|beykent/i.test(k)
    ) {
      return "casual-cafe";
    }
    if (
      d === "Büyük Yemekhane (Catering)" ||
      d === "Fabrika Yemekhanesi" ||
      d === "Okul Yemekhanesi" ||
      /büyük\s*yemekhane|buyuk\s*yemekhane/i.test(d) ||
      /fabrika\s*yemekhane/i.test(d) ||
      /okul\s*yemekhane/i.test(d)
    ) {
      return "buyuk-yemekhane";
    }
    if (
      d === "Güneli Fırın" ||
      d === "Pastane & Yerel" ||
      /güneli\s*fırın|guneli\s*firin/i.test(d) ||
      (/pastane/i.test(d) && /yerel/i.test(d))
    ) {
      return "guneli-pastane";
    }
    if (
      d === "Resort Otel" ||
      /zigana|alaçatı|alacati|resort\s*otel|resort\s*hotel/i.test(d) ||
      (/otel/i.test(k) && /resort|zigana|alaçatı|alacati/i.test(d))
    ) {
      return "resort-otel";
    }
    if (
      d === "Şehir Oteli (Business)" ||
      /şehir\s*oteli|sehir\s*oteli|business\s*hotel/i.test(d) ||
      /hampton/i.test(d) ||
      (/otel/i.test(k) && /şehir|sehir|business|hampton/i.test(d))
    ) {
      return "sehir-otel";
    }
    if (
      d === "Türk Mutfağı — Lokanta" ||
      /muş\s*selinöz|mus\s*selinoz|selinöz\s*mimarlık/i.test(d) ||
      (/türk\s*mutfağı|turk\s*mutfagi/i.test(d) &&
        /lokanta|muş|mus|selinöz|selinoz|101/i.test(d + " " + k))
    ) {
      return "mus-selinoz-turk";
    }
    if (
      d === "Türk Mutfağı" ||
      d === "Self Servis" ||
      d === "Food Court" ||
      /türk\s*mutfağı|turk\s*mutfagi/i.test(d) ||
      /^self\s*servis$/i.test(d) ||
      /food\s*court/i.test(d) ||
      /kiremit/i.test(d)
    ) {
      return "kiremit-akasya";
    }
    if (
      d === "Şarküteri Restoran" ||
      d === "Gurme Şarküteri" ||
      /şarküteri\s*restoran|sarkuteri\s*restoran/i.test(d)
    ) {
      return "sarkuteri-restoran";
    }
    if (
      d === "Kasap + Şarküteri" ||
      (/kasap/i.test(d) && /şarküteri|sarkuteri/i.test(d))
    ) {
      return "kasap-sarkuteri";
    }
    if (
      d === "Kasap" ||
      (/^kasap$/i.test(d) && !/şarküteri|sarkuteri|pişirme|pisirme/i.test(d)) ||
      /yalnızca\s*kasap|sadece\s*kasap/i.test(d)
    ) {
      return "kasap";
    }
    if (
      d === "Bar + Yemek" ||
      d === "Bar + Yemek (Hafif Asya)" ||
      /inari/i.test(d) ||
      (/bar/i.test(d) && /yemek/i.test(d) && /asya|hafif/i.test(d)) ||
      /hafif\s*asya.*bar|bar.*hafif\s*asya/i.test(d)
    ) {
      return "inari-bar-yemek";
    }
    if (d === "Pideci" || /pideci|pide\s*ci/i.test(d)) return "pideci";
    if (d === "Sushi" || /sushi|omakase/i.test(d) || /sushi/i.test(k)) return "sushi";
    if (
      d === "All Dining Cafe" ||
      /all\s*day\s*dining|the\s*house\s*caf/i.test(d) ||
      /all\s*day\s*dining/i.test(k)
    ) {
      return "all-day-dining-cafe";
    }
    if (
      d === "Şarküteri Kiosk" ||
      /şarküteri\s*kiosk|sarkuteri\s*kiosk/i.test(d) ||
      /şarküteri\s*kiosk|sarkuteri\s*kiosk/i.test(k)
    ) {
      return "sarkuteri-kiosk";
    }
    if (
      d === "Hamburger Kiosk" ||
      /hamburger\s*kiosk/i.test(d) ||
      /hamburger\s*kiosk/i.test(k)
    ) {
      return "hamburger-kiosk";
    }
    if (
      d === "Hotdog Kiosk" ||
      /hotdog\s*kiosk|hot\s*dog\s*kiosk/i.test(d) ||
      /hotdog|sosisli\s*kiosk/i.test(k)
    ) {
      return "hotdog-kiosk";
    }
    if (
      d === "Tavukçu" ||
      d === "Fried Chicken" ||
      /tavukçu|tavukcu|fried\s*chicken|pilic\s*cevirme/i.test(d) ||
      /tavukçu|fried\s*chicken/i.test(k)
    ) {
      return "tavukcu";
    }
    if (d === "Dönerci") return "kebap-ortadogu";
    if (
      d === "Kokteyl + Kahve" ||
      d === "Kokteyl Bar" ||
      d === "Mixology Bar" ||
      /kokteyl\s*\+\s*kahve|kokteyl\s*bar|mixology/i.test(d) ||
      /no\s*fish\s*today/i.test(d) ||
      /kokteyl|mixology/i.test(k)
    ) {
      return "kokteyl-kahve";
    }
    if (
      d === "Restoran" ||
      d === "Büyük Restoran" ||
      d === "Fine Dining" ||
      d === "Dünya Mutfağı" ||
      /büyük\s*restoran|buyuk\s*restoran/i.test(d) ||
      /fine\s*dining|dünya\s*mutfağı|dunya\s*mutfagi/i.test(d) ||
      /düğün|dugun|rezervasyon|eğlence|eglence|banquet|organizasyon/i.test(d) ||
      /büyük\s*restoran|düğün|rezervasyon/i.test(k)
    ) {
      return "restoran";
    }
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
