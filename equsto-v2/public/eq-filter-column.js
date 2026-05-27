// Ortak: katalog sayfalarında #eq-filter-brands marka düğümleri
(function () {
  /**
   * «Markalarımız» altında gösterilen örnek üretici markalar (ürün filtresi değil).
   * Endüstriyel mutfak / foodservice üreticileri — sıra kabaca bilinirlik; sayfa `window.__EQUSTO_REF_MARKALAR_SIRASI = [...]` ile ezilebilir.
   */
  function defaultRefMarkalarSirasi() {
    var w = typeof window !== "undefined" ? window : {};
    if (w.__EQUSTO_REF_MARKALAR_SIRASI && Array.isArray(w.__EQUSTO_REF_MARKALAR_SIRASI) && w.__EQUSTO_REF_MARKALAR_SIRASI.length) {
      return w.__EQUSTO_REF_MARKALAR_SIRASI;
    }
    return [
      "Electrolux Professional",
      "Öztiryakiler",
      "CAMBRO",
      "Rational",
      "Hobart",
      "Winterhalter",
      "UNOX",
      "İnoksan",
    ];
  }

  function injectRefMarkalarUnderHeading() {
    if (document.getElementById("eq-filter-ref-brands")) return;
    var lbl = document.querySelector(".eq-filter-sec-lbl--markalarimiz");
    if (!lbl) return;
    var sec = lbl.closest ? lbl.closest(".eq-filter-sec") : null;
    if (!sec) sec = lbl.parentElement;
    var brandsEl = sec && sec.querySelector("#eq-filter-brands");
    if (!brandsEl) return;
    var wrap = document.createElement("div");
    wrap.id = "eq-filter-ref-brands";
    wrap.className = "eq-filter-ref-brands";
    wrap.setAttribute("aria-label", "Endüstriyel mutfak üreticileri, örnek sıra");
    defaultRefMarkalarSirasi().forEach(function (name) {
      var s = String(name || "").trim();
      if (!s) return;
      var row = document.createElement("a");
      row.className = "eq-filter-ref-row";
      row.textContent = s;
      row.href = "marka.html?b=" + encodeURIComponent(s);
      wrap.appendChild(row);
    });
    sec.insertBefore(wrap, brandsEl);
    if (typeof window.__eqRelocateMarkalarInDrawer === "function") window.__eqRelocateMarkalarInDrawer();
  }

  /** Departman sayfaları: Amazon refine başlığı + alt-tip listesi */
  function injectDeptChrome() {
    var col = document.getElementById("eq-filter-col");
    if (!col || !document.body || !document.body.classList.contains("eq-dept")) return;

    if (!col.querySelector(".eq-filter-col-hd")) {
      var hd = document.createElement("div");
      hd.className = "eq-filter-col-hd";
      var title = document.createElement("span");
      title.className = "eq-filter-col-hd__title";
      title.textContent = "Filtreler";
      title.setAttribute("data-i18n", "home.filter_filtrele");
      var clear = document.createElement("button");
      clear.type = "button";
      clear.id = "eq-filter-clear";
      clear.className = "eq-filter-clear eq-filter-clear--hdr";
      clear.textContent = "Temizle";
      clear.hidden = true;
      clear.setAttribute("data-i18n", "filter.clear");
      hd.appendChild(title);
      hd.appendChild(clear);
      col.insertBefore(hd, col.firstChild);
    }

    if (!document.getElementById("eq-filter-tiles")) {
      var brandsSec = col.querySelector(".eq-filter-sec");
      var sec = document.createElement("div");
      sec.className = "eq-filter-sec eq-filter-sec--tiles";
      var lbl = document.createElement("div");
      lbl.className = "eq-filter-sec-lbl";
      lbl.textContent = "Alt kategoriler";
      var stack = document.createElement("div");
      stack.id = "eq-filter-tiles";
      stack.className = "eq-filter-cat-stack";
      stack.setAttribute("role", "list");
      sec.appendChild(lbl);
      sec.appendChild(stack);
      var sidebar = col.querySelector("#eq-sidebar");
      if (sidebar && brandsSec) col.insertBefore(sec, brandsSec);
      else col.appendChild(sec);
    }
  }

  /** İsteğe bağlı: global marka önceliği (düşük indeks = önce). Kalanlar ürün adedine göre sıralanır. */
  function curatedBrandOrder() {
    var o = typeof window !== "undefined" && window.__EQUSTO_MARKA_BOYUT_SIRASI;
    if (!o || !Array.isArray(o)) return null;
    var m = {};
    for (var i = 0; i < o.length; i++) {
      var k = String(o[i] || "").trim();
      if (k) m[k] = i;
    }
    return Object.keys(m).length ? m : null;
  }

  window.EqFilterColumn = {
    injectRefMarkalarUnderHeading: injectRefMarkalarUnderHeading,
    injectDeptChrome: injectDeptChrome,
    syncClearVisible: function (hasActive) {
      var clear = document.getElementById("eq-filter-clear");
      if (clear) clear.hidden = !hasActive;
    },
    buildBrands: function (products, activeBrands, onToggleBrand) {
      var wrap = document.getElementById("eq-filter-brands");
      if (!wrap) return;
      wrap.innerHTML = "";
      var stringMode = !Array.isArray(activeBrands);
      var active = [];
      if (Array.isArray(activeBrands)) active = activeBrands.slice();
      else if (activeBrands) active = [activeBrands];
      var counts = {};
      (products || []).forEach(function (u) {
        var b = (u.b || "").trim();
        if (!b) return;
        counts[b] = (counts[b] || 0) + 1;
      });
      var brands = Object.keys(counts);
      active.forEach(function (b) {
        if (b && brands.indexOf(b) < 0) brands.push(b);
      });
      var curated = curatedBrandOrder();
      brands.sort(function (a, b) {
        if (curated) {
          var ia = Object.prototype.hasOwnProperty.call(curated, a) ? curated[a] : 1e9;
          var ib = Object.prototype.hasOwnProperty.call(curated, b) ? curated[b] : 1e9;
          if (ia !== ib) return ia - ib;
        }
        return counts[b] - counts[a];
      });
      brands.forEach(function (b) {
        var btn;
        var isActive = active.indexOf(b) >= 0;
        if (typeof onToggleBrand === "function") {
          btn = document.createElement("button");
          btn.type = "button";
          btn.addEventListener("click", function () {
            var next = active.slice();
            var idx = next.indexOf(b);
            if (idx >= 0) next.splice(idx, 1);
            else next.push(b);
            onToggleBrand(stringMode ? (next.length ? next[0] : "") : next);
          });
        } else {
          btn = document.createElement("a");
          btn.href = "marka.html?b=" + encodeURIComponent(b);
        }
        btn.className = "eq-filter-brand-btn" + (isActive ? " active" : "");
        btn.textContent = b;
        btn.setAttribute("data-brand", b);
        wrap.appendChild(btn);
      });
    },
    buildTiles: function (tiles, products, activeTile, onToggleTile, matchFn) {
      var wrap = document.getElementById("eq-filter-tiles");
      if (!wrap) return;
      wrap.innerHTML = "";
      (tiles || []).forEach(function (tile) {
        if (!tile || !tile.id) return;
        var n = 0;
        (products || []).forEach(function (u) {
          if (matchFn && matchFn(u, tile)) n++;
        });
        if (!n) return;
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "eq-filter-cat-chip" + (activeTile === tile.id ? " active" : "");
        btn.textContent = tile.label + " (" + n + ")";
        btn.setAttribute("data-tile", tile.id);
        btn.addEventListener("click", function () {
          if (typeof onToggleTile === "function") {
            onToggleTile(activeTile === tile.id ? "" : tile.id);
          }
        });
        wrap.appendChild(btn);
      });
    },
    setActiveBrand: function (activeBrand) {
      var active = Array.isArray(activeBrand) ? activeBrand : activeBrand ? [activeBrand] : [];
      document.querySelectorAll("#eq-filter-brands .eq-filter-brand-btn").forEach(function (btn) {
        btn.classList.toggle("active", active.indexOf(btn.getAttribute("data-brand")) >= 0);
      });
    },
    bindClear: function (fn) {
      var el = document.getElementById("eq-filter-clear");
      if (el) el.onclick = fn;
    },
  };

  function runRefMarkalarInit() {
    try {
      injectDeptChrome();
      injectRefMarkalarUnderHeading();
    } catch (e) {}
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runRefMarkalarInit);
  } else {
    runRefMarkalarInit();
  }
})();
