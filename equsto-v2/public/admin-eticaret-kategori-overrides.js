/**
 * Ürün / slug kategori override deposu — admin + vitrin.
 * Kilit: admin-eticaret-KILIT.txt (eşleme tablosu ayrı dosyada kalır).
 */
(function (global) {
  "use strict";

  var OVERRIDES_URL = "./data/product-category-overrides.json";
  var LS_KEY = "equsto-product-category-overrides-v1";

  var store = { version: 1, updated: null, slugMap: {}, products: {} };
  var loaded = false;
  var loadPromise = null;

  function catalogKey(name, catalogSlug) {
    return (
      String(name || "")
        .toLowerCase()
        .trim() +
      "|" +
      String(catalogSlug || "")
        .toLowerCase()
        .trim()
    );
  }

  function productKey(p) {
    if (!p) return "";
    if (p.catalogKey) return p.catalogKey;
    return catalogKey(p.name, p.catalogSlug || p._origCatalogSlug || "");
  }

  function normalizeStore(raw) {
    var o = raw && typeof raw === "object" ? raw : {};
    return {
      version: 1,
      updated: o.updated || null,
      slugMap: o.slugMap && typeof o.slugMap === "object" ? Object.assign({}, o.slugMap) : {},
      products: o.products && typeof o.products === "object" ? Object.assign({}, o.products) : {},
    };
  }

  function saveLocal() {
    try {
      global.localStorage.setItem(LS_KEY, JSON.stringify(store));
    } catch (_) {}
  }

  function loadLocal() {
    try {
      var s = global.localStorage.getItem(LS_KEY);
      if (s) store = normalizeStore(JSON.parse(s));
    } catch (_) {}
  }

  function load() {
    if (loaded) return Promise.resolve(store);
    if (loadPromise) return loadPromise;
    loadLocal();
    loadPromise = fetch(OVERRIDES_URL, { cache: "no-store", headers: { Accept: "application/json" } })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (j) {
        var remote = normalizeStore(j);
        store.slugMap = Object.assign({}, remote.slugMap, store.slugMap);
        store.products = Object.assign({}, remote.products, store.products);
        store.updated = remote.updated || store.updated;
        loaded = true;
        return store;
      })
      .catch(function () {
        loaded = true;
        return store;
      });
    return loadPromise;
  }

  function getProduct(p) {
    var k = productKey(p);
    if (!k) return null;
    return store.products[k] || null;
  }

  function setProduct(p, patch) {
    var k = productKey(p);
    if (!k) return false;
    var cur = store.products[k] || {};
    store.products[k] = {
      adminDept: patch.adminDept != null ? patch.adminDept : cur.adminDept,
      catalogSlug: patch.catalogSlug != null ? patch.catalogSlug : cur.catalogSlug,
      name: p.name || cur.name,
      note: patch.note != null ? patch.note : cur.note,
    };
    store.updated = new Date().toISOString();
    saveLocal();
    return true;
  }

  function clearProduct(p) {
    var k = productKey(p);
    if (!k || !store.products[k]) return false;
    delete store.products[k];
    store.updated = new Date().toISOString();
    saveLocal();
    return true;
  }

  function getSlugMap() {
    return Object.assign({}, store.slugMap);
  }

  function setSlugDept(slug, adminDept) {
    var s = String(slug || "").toLowerCase().trim();
    if (!s) return false;
    if (!adminDept) delete store.slugMap[s];
    else store.slugMap[s] = adminDept;
    if (global.EqAdminKategori && global.EqAdminKategori.EQ_CATALOG_SLUG_TO_ADMIN) {
      if (adminDept) global.EqAdminKategori.EQ_CATALOG_SLUG_TO_ADMIN[s] = adminDept;
      else delete global.EqAdminKategori.EQ_CATALOG_SLUG_TO_ADMIN[s];
    }
    store.updated = new Date().toISOString();
    saveLocal();
    return true;
  }

  function toExportJson() {
    return JSON.stringify(
      {
        version: 1,
        updated: store.updated || new Date().toISOString(),
        slugMap: store.slugMap,
        products: store.products,
      },
      null,
      2
    );
  }

  function mergeImported(raw) {
    var o = normalizeStore(raw);
    store.slugMap = Object.assign({}, store.slugMap, o.slugMap);
    store.products = Object.assign({}, store.products, o.products);
    store.updated = o.updated || new Date().toISOString();
    if (global.EqAdminKategori && global.EqAdminKategori.EQ_CATALOG_SLUG_TO_ADMIN) {
      Object.keys(store.slugMap).forEach(function (slug) {
        global.EqAdminKategori.EQ_CATALOG_SLUG_TO_ADMIN[slug] = store.slugMap[slug];
      });
    }
    saveLocal();
    loaded = true;
  }

  function downloadJson(filename) {
    var blob = new Blob([toExportJson()], { type: "application/json;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename || "product-category-overrides.json";
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(a.href);
    }, 400);
  }

  async function saveToServer() {
    var base = global.EQUSTO_API_BASE || "/api";
    base = String(base).replace(/\/$/, "");
    var bearer = "";
    try {
      bearer = global.sessionStorage.getItem("equsto_admin_bearer") || "";
    } catch (_) {}
    if (!bearer && global.EQUSTO_ADMIN_BEARER) bearer = global.EQUSTO_ADMIN_BEARER;
    if (!bearer && global.location) {
      var h = (global.location.hostname || "").toLowerCase();
      if (h === "localhost" || h === "127.0.0.1" || global.location.protocol === "file:")
        bearer = "equsto2025";
    }
    var r = await fetch(base + "/category-overrides", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: bearer ? "Bearer " + bearer : "",
      },
      body: toExportJson(),
    });
    if (!r.ok) {
      var t = await r.text();
      throw new Error("Kayıt hatası " + r.status + (t ? ": " + t.slice(0, 120) : ""));
    }
    return r.json();
  }

  global.EqCatOverrides = {
    catalogKey: catalogKey,
    productKey: productKey,
    load: load,
    getProduct: getProduct,
    setProduct: setProduct,
    clearProduct: clearProduct,
    getSlugMap: getSlugMap,
    setSlugDept: setSlugDept,
    toExportJson: toExportJson,
    mergeImported: mergeImported,
    downloadJson: downloadJson,
    saveToServer: saveToServer,
    getStore: function () {
      return store;
    },
  };
})(typeof window !== "undefined" ? window : globalThis);
