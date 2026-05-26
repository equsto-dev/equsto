/**
 * Equsto E-Ticaret paketi — ikas modül haritası, Equsto admin UI (#pane-eticaret).
 * IKAS_ADMIN/ yalnızca referans; bu dosya canlı pakettir.
 */
(function (global) {
  "use strict";

  var MODULES = [
    { id: "dashboard", ikas: "Dashboard", pane: "et-ozet", icon: "📊", label: "Özet" },
    { id: "products", ikas: "Products", pane: "et-urunler", icon: "📦", label: "Ürünler" },
    { id: "categories", ikas: "Categories", pane: "et-kategori", icon: "🏷️", label: "Kategori" },
    { id: "quotes", ikas: "Quotes", pane: "et-teklifler", icon: "📋", label: "Teklifler" },
    { id: "orders", ikas: "Orders", pane: "et-siparisler", icon: "🚚", label: "Siparişler" },
    { id: "customers", ikas: "Customers", pane: "et-musteriler", icon: "👥", label: "Müşteriler" },
    { id: "pricing", ikas: "Pricing", pane: "et-fiyat", icon: "💰", label: "Fiyat & Döviz" },
    { id: "discounts", ikas: "Discounts", pane: "et-kampanya", icon: "🏷️", label: "Kampanyalar" },
    { id: "storefront", ikas: "Online Store", pane: "et-vitrin", icon: "🏠", label: "Vitrin" },
    { id: "content", ikas: "Marketing", pane: "et-icerik", icon: "✏️", label: "İçerik & SEO" },
    { id: "settings", ikas: "Settings", pane: "et-ayarlar", icon: "⚙️", label: "Ayarlar" },
  ];

  var activePane = "et-ozet";

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function $(id) {
    return document.getElementById(id);
  }

  function stats() {
    var products = global.products || [];
    return {
      urun: products.length,
      teklif: (global.etTeklifler || []).length,
      siparis: (global.etSiparisler || []).length,
      musteri: (global.etMusteriler || []).length,
      kampanya: (global.etKampanyalar || []).length,
      kupon: (global.etKuponlar || []).length,
    };
  }

  function goPane(paneId) {
    var etab = document.querySelector('#pane-eticaret .etab[onclick*="' + paneId + '"]');
    if (etab && typeof global.showEtab === "function") {
      global.showEtab(etab, paneId);
    }
    activePane = paneId;
    document.querySelectorAll(".et-mod-card").forEach(function (c) {
      c.classList.toggle("active", c.dataset.etPane === paneId);
    });
  }

  function renderHub() {
    var root = $("et-mod-hub-grid");
    if (!root) return;
    var s = stats();
    root.innerHTML = MODULES.map(function (m) {
      var badge = "";
      if (m.id === "products") badge = s.urun.toLocaleString("tr-TR");
      else if (m.id === "quotes") badge = String(s.teklif);
      else if (m.id === "orders") badge = String(s.siparis);
      else if (m.id === "customers") badge = String(s.musteri);
      else if (m.id === "discounts") badge = String(s.kampanya + s.kupon);
      return (
        '<button type="button" class="et-mod-card' +
        (activePane === m.pane ? " active" : "") +
        '" data-et-pane="' +
        esc(m.pane) +
        '" title="ikas: ' +
        esc(m.ikas) +
        '">' +
        '<span class="et-mod-card__icon" aria-hidden="true">' +
        m.icon +
        "</span>" +
        '<span class="et-mod-card__lbl">' +
        esc(m.label) +
        "</span>" +
        (badge ? '<span class="et-mod-card__badge">' + esc(badge) + "</span>" : "") +
        "</button>"
      );
    }).join("");
    root.querySelectorAll(".et-mod-card").forEach(function (btn) {
      btn.addEventListener("click", function () {
        goPane(btn.dataset.etPane);
      });
    });
  }

  function ensureMainTab() {
    var tab = document.querySelector('.tabs .tab[data-tab="eticaret"]');
    if (tab && !tab.classList.contains("active")) tab.click();
  }

  function openDetail(kind, payload) {
    var drawer = $("et-detail-drawer");
    var body = $("et-detail-body");
    var title = $("et-detail-title");
    if (!drawer || !body || !title) return;
    title.textContent =
      kind === "teklif"
        ? "Teklif · " + (payload.ref || "—")
        : kind === "siparis"
          ? "Sipariş · " + (payload.no || "—")
          : kind === "musteri"
            ? "Müşteri · " + (payload.firma || payload.yetkili || "—")
            : "Detay";
    var lines = [];
    if (kind === "teklif") {
      lines.push(["Müşteri", payload.m]);
      lines.push(["Konsept", payload.k]);
      lines.push(["Tutar", payload.tutar != null ? payload.tutar.toLocaleString("tr-TR") + " ₺" : "—"]);
      lines.push(["Tarih", payload.tarih]);
      lines.push(["Geçerlilik", payload.gec]);
      lines.push(["Durum", payload.d]);
      if (payload.not) lines.push(["Not", payload.not]);
    } else if (kind === "siparis") {
      lines.push(["Müşteri", payload.m]);
      lines.push(["Tutar", payload.tutar != null ? payload.tutar.toLocaleString("tr-TR") + " ₺" : "—"]);
      lines.push(["Tarih", payload.tarih]);
      lines.push(["Durum", payload.d]);
    } else if (kind === "musteri") {
      lines.push(["Firma", payload.firma]);
      lines.push(["Yetkili", payload.yetkili]);
      lines.push(["Tel", payload.tel]);
      lines.push(["E-posta", payload.mail || payload.email]);
      lines.push(["Şehir", payload.sehir || payload.city]);
      lines.push(["Tip", payload.tip]);
    }
    body.innerHTML =
      '<dl class="et-detail-dl">' +
      lines
        .map(function (pair) {
          return (
            "<dt>" +
            esc(pair[0]) +
            "</dt><dd>" +
            esc(pair[1] || "—") +
            "</dd>"
          );
        })
        .join("") +
      "</dl>";
    drawer.classList.remove("hidden");
    drawer.setAttribute("aria-hidden", "false");
  }

  function closeDetail() {
    var drawer = $("et-detail-drawer");
    if (!drawer) return;
    drawer.classList.add("hidden");
    drawer.setAttribute("aria-hidden", "true");
  }

  function bindRowClicks() {
    var pane = $("pane-eticaret");
    if (!pane || pane.__etRowClick) return;
    pane.__etRowClick = true;
    pane.addEventListener("click", function (e) {
      if (e.target.closest("button, select, a, input, textarea")) return;
      var tr = e.target.closest("tr[data-et-kind]");
      if (!tr) return;
      var kind = tr.dataset.etKind;
      var id = tr.dataset.etId;
      if (kind === "teklif") {
        var t = (global.etTeklifler || []).find(function (x) {
          return String(x._id || x.id || "") === id;
        });
        if (t) openDetail("teklif", t);
      } else if (kind === "siparis") {
        var s = (global.etSiparisler || []).find(function (x) {
          return String(x._id || x.id || "") === id;
        });
        if (s) openDetail("siparis", s);
      } else if (kind === "musteri") {
        var m = (global.etMusteriler || []).find(function (x) {
          return String(x._id || x.id || "") === id;
        });
        if (m) openDetail("musteri", m);
      }
    });
  }

  function patchShowEtab() {
    if (global.__etShowEtabPatched || typeof global.showEtab !== "function") return;
    var orig = global.showEtab;
    global.showEtab = function (el, paneId) {
      orig(el, paneId);
      activePane = paneId || activePane;
      renderHub();
      var hub = $("et-mod-hub");
      if (hub) hub.classList.toggle("et-mod-hub--compact", paneId !== "et-ozet");
    };
    global.__etShowEtabPatched = true;
  }

  function wrapRender(fnName, after) {
    var fn = global[fnName];
    if (!fn || fn.__etPkgWrap) return;
    global[fnName] = function () {
      var r = fn.apply(this, arguments);
      try {
        if (after) after();
      } catch (_) {}
      return r;
    };
    global[fnName].__etPkgWrap = true;
  }

  function tagTeklifRows() {
    var tbody = $("et-teklif-tbody");
    if (!tbody) return;
    var list = global.etTeklifler || [];
    tbody.querySelectorAll("tr").forEach(function (tr, i) {
      var t = list[i];
      if (!t) return;
      tr.dataset.etKind = "teklif";
      tr.dataset.etId = String(t._id || t.id || "");
      tr.title = "Detay için tıklayın";
    });
  }

  function tagSiparisRows() {
    var tbody = $("et-siparis-tbody");
    if (!tbody) return;
    var list = global.etSiparisler || [];
    tbody.querySelectorAll("tr").forEach(function (tr, i) {
      var s = list[i];
      if (!s) return;
      tr.dataset.etKind = "siparis";
      tr.dataset.etId = String(s._id || s.id || "");
      tr.title = "Detay için tıklayın";
    });
  }

  function tagMusteriRows() {
    var tbody = $("et-musteri-tbody");
    if (!tbody) return;
    var list = global.etMusteriler || [];
    tbody.querySelectorAll("tr").forEach(function (tr, i) {
      var m = list[i];
      if (!m) return;
      tr.dataset.etKind = "musteri";
      tr.dataset.etId = String(m._id || m.id || "");
      tr.title = "Detay için tıklayın";
    });
  }

  function activate() {
    patchShowEtab();
    bindRowClicks();
    wrapRender("renderEtTeklifler", tagTeklifRows);
    wrapRender("renderEtSiparisler", tagSiparisRows);
    wrapRender("renderEtMusteriler", tagMusteriRows);
    wrapRender("renderEtOzet", renderHub);
    renderHub();
    var closeBtn = $("et-detail-close");
    if (closeBtn && !closeBtn.__etBound) {
      closeBtn.__etBound = true;
      closeBtn.addEventListener("click", closeDetail);
    }
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeDetail();
    });
  }

  function onMainTabOpen() {
    ensureMainTab();
    activate();
    if (typeof global.renderEtOzet === "function") global.renderEtOzet();
    if (typeof global.renderFiyatlar === "function") global.renderFiyatlar();
  }

  global.EqustoEticaret = {
    MODULES: MODULES,
    activate: activate,
    onMainTabOpen: onMainTabOpen,
    goPane: goPane,
    openDetail: openDetail,
    closeDetail: closeDetail,
    refreshHub: renderHub,
  };

  function hookMainTabs() {
    document.querySelectorAll('.tabs .tab[data-tab="eticaret"]').forEach(function (tab) {
      if (tab.__etPkgHook) return;
      tab.__etPkgHook = true;
      tab.addEventListener("click", function () {
        setTimeout(onMainTabOpen, 0);
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", hookMainTabs);
  } else {
    hookMainTabs();
  }
})(typeof window !== "undefined" ? window : globalThis);
