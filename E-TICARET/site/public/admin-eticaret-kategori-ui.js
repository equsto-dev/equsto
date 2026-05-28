/**
 * Admin E-Ticaret — kategori UI (liste, modal, matris, export).
 */
(function (global) {
  "use strict";

  var K = global.EqAdminKategori;
  var O = global.EqCatOverrides;

  var DEPT_LABELS_FALLBACK = {
    pisirme: "Pişirme",
    sogutma: "Soğutma",
    icecek: "İçecek",
    yikama: "Yıkama",
    hazirlik: "Hazırlık",
    tezgah_davlumbaz: "Tezgah & Davlumbaz",
    depolama: "Depolama",
    araba: "Araba",
    yardimci: "Yardımcı Ekipmanlar",
    sunum: "Sunum",
    diger: "Diğer",
  };

  /** Eski önbellekli admin-eticaret-kategori.js ile uyum — eksik metotları tamamla */
  function patchEqAdminKategori() {
    if (!K) return;
    if (typeof K.deptLabel !== "function") {
      K.deptLabel = function (id) {
        var L = K.EQ_ADMIN_CAT_LABELS || DEPT_LABELS_FALLBACK;
        return L[id] || id || "—";
      };
    }
    if (typeof K.applyProductCategories !== "function" && typeof K.remapProducts === "function") {
      K.applyProductCategories = K.remapProducts;
    }
    if (typeof K.collectCatalogSlugs !== "function" && typeof K.fromSlug === "function") {
      K.collectCatalogSlugs = function (list) {
        var m = {};
        var map = K.EQ_CATALOG_SLUG_TO_ADMIN || {};
        if (Array.isArray(list)) {
          for (var i = 0; i < list.length; i++) {
            var s = list[i] && (list[i].catalogSlug || list[i]._origCatalogSlug);
            if (s) m[String(s).toLowerCase()] = (m[String(s).toLowerCase()] || 0) + 1;
          }
        }
        Object.keys(map).forEach(function (k) {
          if (!m[k]) m[k] = 0;
        });
        return Object.keys(m).sort();
      };
    }
    if (typeof K.isSuspicious !== "function") {
      K.isSuspicious = function (p) {
        if (!p) return false;
        var dept = K.productCat ? K.productCat(p) : "diger";
        var tips = global.EqDeptTips;
        if (!tips) return false;
        var u = { name: p.name || "", category: p.catalogSlug || "" };
        if (dept === "pisirme" && tips.isYardimciEkipmanProduct && tips.isYardimciEkipmanProduct(u))
          return true;
        if (dept === "sogutma" && tips.isEtKiymaProduct && tips.isEtKiymaProduct(u)) return true;
        if (dept === "icecek" && tips.isBuzMakinesiProduct && tips.isBuzMakinesiProduct(u)) return true;
        if (
          (dept === "pisirme" || dept === "sogutma" || dept === "hazirlik") &&
          tips.isServisTeshirProduct &&
          tips.isServisTeshirProduct(u)
        )
          return true;
        return false;
      };
    }
    if (typeof K.slugMatrixRows !== "function" && typeof K.fromSlug === "function") {
      K.slugMatrixRows = function (list) {
        var counts = {};
        var map = K.EQ_CATALOG_SLUG_TO_ADMIN || {};
        if (Array.isArray(list)) {
          for (var i = 0; i < list.length; i++) {
            var p = list[i];
            if (!p) continue;
            var slug = String(p.catalogSlug || p._origCatalogSlug || "").toLowerCase();
            if (!slug) continue;
            if (!counts[slug]) counts[slug] = { count: 0, auto: K.fromSlug(slug) };
            counts[slug].count++;
          }
        }
        Object.keys(map).forEach(function (slug) {
          if (!counts[slug]) counts[slug] = { count: 0, auto: K.fromSlug(slug) };
        });
        var sm = O ? O.getSlugMap() : {};
        return Object.keys(counts)
          .sort()
          .map(function (slug) {
            return {
              slug: slug,
              count: counts[slug].count,
              auto: counts[slug].auto,
              effective: sm[slug] || map[slug] || counts[slug].auto,
              hasOverride: !!sm[slug],
            };
          });
      };
    }
  }
  patchEqAdminKategori();

  if (!global.__euSelected) global.__euSelected = new Set();

  function euUpdateBulkBar() {
    var n = global.__euSelected ? global.__euSelected.size : 0;
    var bar = document.getElementById("eu-bulk-bar");
    var el = document.getElementById("eu-bulk-n");
    if (el) el.textContent = n + " seçili";
    if (bar) bar.style.display = n > 0 ? "flex" : "none";
  }

  function euFilteredProducts() {
    patchEqAdminKategori();
    var prods = catalogProducts();
    var q = (document.getElementById("eu-q")?.value || "").toLowerCase();
    var kat = document.getElementById("eu-kat")?.value || "";
    var dur = document.getElementById("eu-durum")?.value || "";
    var susOnly = document.getElementById("eu-suspicious")?.value === "1";
    var productAdminCat = global.productAdminCat || (K && K.productCat);
    return prods.filter(function (p) {
      return (
        (!q ||
          (p.name || "").toLowerCase().includes(q) ||
          (p.sku || "").toLowerCase().includes(q) ||
          (p.tipkod || "").toLowerCase().includes(q) ||
          (p.marka_ad || "").toLowerCase().includes(q) ||
          (p.catalogSlug || "").toLowerCase().includes(q)) &&
        (!kat || (productAdminCat && productAdminCat(p) === kat)) &&
        (!dur || (dur === "aktif" ? p.aktif !== false : p.aktif === false)) &&
        (!susOnly || (K && K.isSuspicious(p)))
      );
    });
  }

  global.euToggleSelect = function (si, on) {
    if (!global.__euSelected) global.__euSelected = new Set();
    if (on) global.__euSelected.add(si);
    else global.__euSelected.delete(si);
    euUpdateBulkBar();
  };

  global.euToggleSelectAllPage = function (checked) {
    if (!global.__euSelected) global.__euSelected = new Set();
    document.querySelectorAll("#et-urun-tbody .eu-row-chk").forEach(function (cb) {
      var si = parseInt(cb.getAttribute("data-si"), 10);
      if (!Number.isFinite(si)) return;
      cb.checked = !!checked;
      if (checked) global.__euSelected.add(si);
      else global.__euSelected.delete(si);
    });
    euUpdateBulkBar();
  };

  global.euSelectAllFiltered = function () {
    var prods = catalogProducts();
    euFilteredProducts().forEach(function (p) {
      var si = prods.indexOf(p);
      if (si >= 0) global.__euSelected.add(si);
    });
    renderEtUrunlerPatched();
  };

  global.euClearSelection = function () {
    global.__euSelected.clear();
    var all = document.getElementById("eu-chk-all");
    if (all) all.checked = false;
    renderEtUrunlerPatched();
  };

  global.euBulkApplyCategory = async function () {
    if (!O || !K) return;
    var dept = document.getElementById("eu-bulk-dept")?.value || "";
    var slug = document.getElementById("eu-bulk-slug")?.value || "";
    if (!dept && !slug) {
      alert("Departman veya katalog slug seçin.");
      return;
    }
    var indices = Array.from(global.__euSelected || []);
    if (!indices.length) {
      alert("Önce ürün seçin (satır kutusu veya «Filtredeki tümünü seç»).");
      return;
    }
    if (!confirm(indices.length + " ürüne kategori uygulanacak. Devam?")) return;
    var prods = catalogProducts();
    indices.forEach(function (si) {
      var p = prods[si];
      if (!p) return;
      O.setProduct(p, { adminDept: dept || undefined, catalogSlug: slug || undefined });
    });
    K.applyProductCategories(prods);
    try {
      await O.saveToServer();
      if (typeof global.adminToast === "function") global.adminToast("Toplu kategori kaydedildi.", "ok");
      else alert("Toplu kategori sunucuya kaydedildi.");
    } catch (e) {
      if (typeof global.adminToast === "function") {
        global.adminToast("Sunucuya yazılamadı: " + (e && e.message ? e.message : e), "err");
      } else alert("Sunucuya yazılamadı: " + (e && e.message ? e.message : e));
    }
    renderEtUrunlerPatched();
    try {
      renderEtKategoriMatrix();
    } catch (_) {}
  };

  global.euBulkAutoYardimci = async function () {
    if (!O || !K) return;
    var tips = global.EqDeptTips;
    if (!tips || !tips.isYardimciEkipmanProduct) {
      alert("EqDeptTips yüklenemedi.");
      return;
    }
    var indices = Array.from(global.__euSelected || []);
    if (!indices.length) {
      alert("Önce ürün seçin.");
      return;
    }
    var prods = catalogProducts();
    var n = 0;
    indices.forEach(function (si) {
      var p = prods[si];
      if (!p) return;
      var u = { name: p.name, n: p.name, category: p._origCatalogSlug || p.catalogSlug };
      if (!tips.isYardimciEkipmanProduct(u)) return;
      O.setProduct(p, { adminDept: "yardimci", catalogSlug: "yardimci-ekipmanlar" });
      n++;
    });
    if (!n) {
      alert("Seçili ürünlerde yardımcı ekipman kuralı eşleşmedi.");
      return;
    }
    if (!confirm(n + " yardımcı ekipman olarak işaretlenecek. Devam?")) return;
    K.applyProductCategories(prods);
    try {
      await O.saveToServer();
      if (typeof global.adminToast === "function") global.adminToast(n + " ürün yardımcı ekipman olarak kaydedildi.", "ok");
    } catch (e) {
      if (typeof global.adminToast === "function") global.adminToast("Kayıt hatası: " + (e.message || e), "err");
    }
    renderEtUrunlerPatched();
  };

  global.euBulkClearOverride = async function () {
    if (!O || !K) return;
    var indices = Array.from(global.__euSelected || []);
    if (!indices.length) {
      alert("Önce ürün seçin.");
      return;
    }
    if (!confirm(indices.length + " ürünün kategori override kaydı silinecek. Devam?")) return;
    var prods = catalogProducts();
    indices.forEach(function (si) {
      var p = prods[si];
      if (p) O.clearProduct(p);
    });
    K.applyProductCategories(prods);
    try {
      await O.saveToServer();
      if (typeof global.adminToast === "function") global.adminToast("Override kayıtları kaldırıldı.", "ok");
    } catch (e) {
      if (typeof global.adminToast === "function") global.adminToast("Sunucuya yazılamadı.", "err");
    }
    renderEtUrunlerPatched();
  };

  function catalogProducts() {
    if (Array.isArray(global.products)) return global.products;
    if (typeof global.syncAdminProductsGlobal === "function") {
      try {
        global.syncAdminProductsGlobal();
      } catch (_) {}
    }
    if (Array.isArray(global.products)) return global.products;
    return [];
  }

  function deptOptionsHtml(selected) {
    if (!K) return "";
    return K.EQ_ADMIN_CATS.map(function (id) {
      var lab = K.deptLabel(id);
      return (
        '<option value="' +
        id +
        '"' +
        (selected === id ? " selected" : "") +
        ">" +
        lab +
        "</option>"
      );
    }).join("");
  }

  var SLUG_CUSTOM_VALUE = "__custom__";

  function normalizeCatalogSlugInput(raw) {
    return String(raw || "")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\u00c0-\u024f-]+/gi, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function slugOptionLabel(s) {
    if (!K || !s) return s;
    return s + " · " + K.deptLabel(K.fromSlug(s));
  }

  function slugOptionsHtml(selected) {
    if (!K) return '<option value="">— Slug seç —</option>';
    var slugs = K.collectCatalogSlugs(catalogProducts());
    var mapKeys = Object.keys(K.EQ_CATALOG_SLUG_TO_ADMIN || {}).sort();
    var inMap = {};
    mapKeys.forEach(function (k) {
      inMap[k] = true;
    });
    var recommended = mapKeys.slice();
    var fromCatalog = slugs.filter(function (s) {
      return !inMap[s];
    });
    if (selected && slugs.indexOf(selected) < 0 && mapKeys.indexOf(selected) < 0) {
      fromCatalog.push(selected);
    }
    fromCatalog.sort();
    var html = '<option value="">— Slug seç —</option>';
    if (recommended.length) {
      html +=
        '<optgroup label="Önerilen slug\'lar">' +
        recommended
          .map(function (s) {
            return (
              '<option value="' +
              s +
              '"' +
              (selected === s ? " selected" : "") +
              ">" +
              slugOptionLabel(s) +
              "</option>"
            );
          })
          .join("") +
        "</optgroup>";
    }
    if (fromCatalog.length) {
      html +=
        '<optgroup label="Katalogda kullanılan">' +
        fromCatalog
          .map(function (s) {
            return (
              '<option value="' +
              s +
              '"' +
              (selected === s ? " selected" : "") +
              ">" +
              slugOptionLabel(s) +
              "</option>"
            );
          })
          .join("") +
        "</optgroup>";
    }
    html +=
      '<option value="' +
      SLUG_CUSTOM_VALUE +
      '"' +
      (selected && selected !== SLUG_CUSTOM_VALUE && slugs.indexOf(selected) < 0 && mapKeys.indexOf(selected) < 0
        ? " selected"
        : "") +
      ">+ Yeni slug yaz…</option>";
    return html;
  }

  function syncNpCatalogSlugCustomVisibility() {
    var slugEl = document.getElementById("np-catalog-slug");
    var customEl = document.getElementById("np-catalog-slug-custom");
    if (!customEl) return;
    var show = slugEl && slugEl.value === SLUG_CUSTOM_VALUE;
    customEl.style.display = show ? "block" : "none";
    if (show) customEl.focus();
  }

  function getNpCatalogSlugFromForm() {
    var slugEl = document.getElementById("np-catalog-slug");
    if (!slugEl) return "";
    if (slugEl.value === SLUG_CUSTOM_VALUE) {
      return normalizeCatalogSlugInput(document.getElementById("np-catalog-slug-custom")?.value);
    }
    return slugEl.value.trim();
  }

  function fillNpCatalogSlugSelect(p) {
    var slugEl = document.getElementById("np-catalog-slug");
    var customEl = document.getElementById("np-catalog-slug-custom");
    if (!slugEl) return;
    var sel = p && p.catalogSlug ? String(p.catalogSlug).toLowerCase() : "";
    var mapKeys = K ? Object.keys(K.EQ_CATALOG_SLUG_TO_ADMIN || {}) : [];
    var known = sel && (mapKeys.indexOf(sel) >= 0 || K.collectCatalogSlugs(catalogProducts()).indexOf(sel) >= 0);
    slugEl.innerHTML = slugOptionsHtml(known ? sel : "");
    if (sel && !known) {
      slugEl.value = SLUG_CUSTOM_VALUE;
      if (customEl) customEl.value = sel;
    } else if (sel) {
      slugEl.value = sel;
      if (customEl) customEl.value = "";
    } else {
      slugEl.value = "";
      if (customEl) customEl.value = "";
    }
    syncNpCatalogSlugCustomVisibility();
  }

  function fillNpCategorySelects(p) {
    var deptEl = document.getElementById("np-admin-dept");
    var slugEl = document.getElementById("np-catalog-slug");
    if (deptEl) {
      deptEl.innerHTML = deptOptionsHtml(p && K ? K.productCat(p) : "");
    }
    fillNpCatalogSlugSelect(p);
    updateNpCatPreview(p);
    if (deptEl && !deptEl.__eqKatBound) {
      deptEl.__eqKatBound = true;
      deptEl.addEventListener("change", function () {
        updateNpCatPreview();
      });
    }
    if (slugEl && !slugEl.__eqKatBound) {
      slugEl.__eqKatBound = true;
      slugEl.addEventListener("change", function () {
        syncNpCatalogSlugCustomVisibility();
        updateNpCatPreview();
      });
    }
    var customEl = document.getElementById("np-catalog-slug-custom");
    if (customEl && !customEl.__eqKatBound) {
      customEl.__eqKatBound = true;
      customEl.addEventListener("input", function () {
        updateNpCatPreview();
      });
    }
  }

  function updateNpCatPreview(p) {
    var el = document.getElementById("np-cat-preview");
    if (!el || !K) return;
    var dept =
      document.getElementById("np-admin-dept")?.value ||
      (p && K.productCat(p)) ||
      "";
    var slug = getNpCatalogSlugFromForm() || (p && p.catalogSlug) || "";
    var auto = K.fromSlug(slug);
    var sus = p && K.isSuspicious ? K.isSuspicious(p) : false;
    if (!dept && !slug) {
      el.style.display = "none";
      return;
    }
    el.style.display = "block";
    el.innerHTML =
      "<strong>Önizleme:</strong> " +
      K.deptLabel(dept) +
      " · slug <code>" +
      (slug || "—") +
      "</code>" +
      (auto !== dept ? " · otomatik eşleme: " + K.deptLabel(auto) : "") +
      (sus ? ' · <span style="color:var(--gold3)">⚠ şüpheli eşleme</span>' : "");
  }

  async function ensureOverridesLoaded() {
    if (O) await O.load();
  }

  async function saveProductCategoryOverride(editIdx) {
    if (!O || !K) return false;
    var list = catalogProducts();
    var p = list[editIdx];
    if (!p) return false;
    var adminDept = document.getElementById("np-admin-dept")?.value || "";
    var catalogSlug = getNpCatalogSlugFromForm();
    if (!adminDept && !catalogSlug) {
      O.clearProduct(p);
    } else {
      O.setProduct(p, { adminDept: adminDept || undefined, catalogSlug: catalogSlug || undefined });
    }
    K.applyProductCategories(catalogProducts());
    try {
      await O.saveToServer();
    } catch (e) {
      alert(
        "Yerel kayıt yapıldı; sunucuya yazılamadı: " +
          (e && e.message ? e.message : e) +
          "\n\nGerekirse Kategori sekmesinde «JSON indir» ile yedek alın."
      );
    }
    return true;
  }

  function renderEtUrunlerPatched() {
    patchEqAdminKategori();
    var prods = catalogProducts();
    var full = euFilteredProducts();
    var markaTxt = function (p) {
      var a = p.marka_ad,
        b = p.marka;
      if (a && b && String(a) !== String(b)) return String(a) + " · " + String(b);
      return String(a || b || "—");
    };
    var productAdminCat = global.productAdminCat || (K && K.productCat);
    var MAX = 300;
    var truncated = full.length > MAX;
    var list = truncated ? full.slice(0, MAX) : full;
    var cnt = document.getElementById("eu-cnt");
    if (cnt) {
      var susN = K
        ? prods.filter(function (p) {
            return K.isSuspicious(p);
          }).length
        : 0;
      cnt.textContent = truncated
        ? list.length + " / " + full.length + " · katalog " + prods.length + (susN ? " · ⚠" + susN : "")
        : list.length + " / " + prods.length + (susN ? " · şüpheli " + susN : "");
    }
    var tbody = document.getElementById("et-urun-tbody");
    if (!tbody) return;
    var colSpan = 11;
    if (!prods.length) {
      tbody.innerHTML =
        '<tr><td colspan="' +
        colSpan +
        '"><div class="empty">Katalog boş — Ürünler sekmesindeki katalog şeridinden yenileyin.</div></td></tr>';
      return;
    }
    if (!full.length) {
      tbody.innerHTML =
        '<tr><td colspan="' + colSpan + '"><div class="empty">Filtreye uyan ürün yok.</div></td></tr>';
      return;
    }
    var catIco = {
      pisirme: "🔥",
      sogutma: "❄️",
      icecek: "☕",
      yikama: "🚿",
      hazirlik: "🔧",
      tezgah_davlumbaz: "🏗️",
      depolama: "📦",
      yardimci: "🔩",
      sunum: "🍽️",
      diger: "⚙️",
    };
    var rows = list
      .map(function (p, idx) {
        var si = prods.indexOf(p);
        var dept = productAdminCat ? productAdminCat(p) : p.cat;
        var stCls = (p.stok || 0) <= 0 ? "stok-yok" : (p.stok || 0) < 5 ? "stok-az" : "stok-ok";
        var dur2 = p.aktif === false ? "pasif" : "aktif";
        var sus = K && K.isSuspicious(p);
        var ov = p.catOverride ? '<span class="et-cat-override" title="Override">●</span>' : "";
        var sel = global.__euSelected && global.__euSelected.has(si);
        var origSlug = p._origCatalogSlug || "";
        var slugHtml =
          p.catalogSlug && origSlug && p.catalogSlug !== origSlug
            ? '<span style="text-decoration:line-through;opacity:.55" title="Kaynak: ' +
              origSlug +
              '">' +
              origSlug +
              "</span> → <code>" +
              p.catalogSlug +
              "</code>"
            : p.catalogSlug || "—";
        return (
          '<tr class="' +
          (sus ? "et-row-suspicious" : "") +
          (sel ? " et-row-selected" : "") +
          '">' +
          '<td><input type="checkbox" class="eu-row-chk" data-si="' +
          si +
          '"' +
          (sel ? " checked" : "") +
          ' onchange="euToggleSelect(' +
          si +
          ',this.checked)"></td>' +
          '<td style="color:var(--muted);font-size:11px">' +
          (idx + 1) +
          "</td>" +
          '<td><div style="font-weight:500;font-size:13px">' +
          (p.name || "") +
          (sus ? ' <span title="Şüpheli">⚠</span>' : "") +
          "</div>" +
          (p.tipkod
            ? '<div style="font-family:var(--mono);font-size:10px;color:var(--muted)">' + p.tipkod + "</div>"
            : "") +
          "</td>" +
          '<td style="font-family:var(--mono);font-size:11px;color:var(--muted)">' +
          (p.sku || "—") +
          "</td>" +
          "<td>" +
          (catIco[dept] || "") +
          ' <span style="font-size:11px">' +
          (K ? K.deptLabel(dept) : dept) +
          "</span>" +
          ov +
          "</td>" +
          '<td style="font-family:var(--mono);font-size:10px;color:var(--muted);max-width:180px;overflow:hidden;text-overflow:ellipsis" title="' +
          (p.catalogSlug || "") +
          '">' +
          slugHtml +
          "</td>" +
          '<td style="font-size:12px">' +
          markaTxt(p) +
          "</td>" +
          '<td style="text-align:right;font-family:var(--mono);font-size:12px">' +
          (p.fiyat ? Number(p.fiyat).toLocaleString("tr-TR") : "—") +
          "</td>" +
          '<td style="text-align:center"><span class="' +
          stCls +
          '">' +
          (p.stok ?? "—") +
          "</span></td>" +
          '<td style="text-align:center"><span class="etst ' +
          dur2 +
          '">' +
          dur2 +
          "</span></td>" +
          '<td><div style="display:flex;gap:4px">' +
          '<button class="btn btn-ghost btn-xs" onclick="editEtUrun(' +
          si +
          ')">✎</button>' +
          '<button class="btn btn-danger btn-xs" onclick="deleteProduct(\'' +
          String(p.id).replace(/'/g, "\\'") +
          "')\">✕</button>" +
          "</div></td></tr>"
        );
      })
      .join("");
    if (truncated) {
      rows +=
        '<tr><td colspan="' +
        colSpan +
        '" style="padding:10px 12px;font-size:11px;color:var(--muted);background:var(--bg3)">İlk ' +
        MAX +
        " satır gösteriliyor; arama veya kategori ile daraltın.</td></tr>";
    }
    tbody.innerHTML = rows;
    euUpdateBulkBar();
    var chkAll = document.getElementById("eu-chk-all");
    if (chkAll) {
      var boxes = tbody.querySelectorAll(".eu-row-chk");
      chkAll.checked = boxes.length > 0 && Array.prototype.every.call(boxes, function (b) { return b.checked; });
    }
  }

  function renderEtKategoriMatrix() {
    patchEqAdminKategori();
    if (!K) return;
    var tbody = document.getElementById("et-kat-matrix-tbody");
    var cnt = document.getElementById("et-kat-matrix-cnt");
    if (!tbody) return;
    if (typeof K.slugMatrixRows !== "function") {
      tbody.innerHTML =
        '<tr><td colspan="5" style="padding:12px;color:var(--muted)">Kategori modülü yüklenemedi. Ctrl+Shift+R ile yenileyin.</td></tr>';
      return;
    }
    var rows = K.slugMatrixRows(catalogProducts());
    if (cnt) cnt.textContent = rows.length + " slug";
    tbody.innerHTML = rows
      .map(function (r) {
        var opts = K.EQ_ADMIN_CATS.map(function (id) {
          return (
            '<option value="' +
            id +
            '"' +
            (r.effective === id ? " selected" : "") +
            ">" +
            K.deptLabel(id) +
            "</option>"
          );
        }).join("");
        return (
          "<tr>" +
          '<td style="font-family:var(--mono);font-size:11px">' +
          r.slug +
          "</td>" +
          '<td style="text-align:right;font-size:11px;color:var(--muted)">' +
          r.count.toLocaleString("tr-TR") +
          "</td>" +
          '<td style="font-size:11px">' +
          K.deptLabel(r.auto) +
          "</td>" +
          '<td><select class="btn btn-ghost btn-xs" style="width:100%;max-width:160px" data-slug="' +
          r.slug +
          '" onchange="saveSlugDeptMapping(this.dataset.slug,this.value)">' +
          opts +
          "</select></td>" +
          "<td>" +
          (r.hasOverride ? '<span class="et-cat-override">override</span>' : "") +
          "</td></tr>"
        );
      })
      .join("");
    renderEtKategoriSuspicious();
  }

  function renderEtKategoriSuspicious() {
    patchEqAdminKategori();
    var el = document.getElementById("et-kat-suspicious-list");
    if (!el || !K) return;
    var list = catalogProducts().filter(function (p) {
      return typeof K.isSuspicious === "function" ? K.isSuspicious(p) : false;
    });
    if (!list.length) {
      el.innerHTML = "Şüpheli ürün yok (veya katalog henüz yüklenmedi).";
      return;
    }
    el.innerHTML =
      "<div style=\"margin-bottom:8px\">" +
      list.length +
      ' eşleşme · <button type="button" class="btn btn-ghost btn-xs" onclick="showEtab(document.querySelector(\'.etab[onclick*=et-urunler]\'),\'et-urunler\');document.getElementById(\'eu-suspicious\').value=\'1\';renderEtUrunler()">Ürünlerde göster</button></div>' +
      list
        .slice(0, 40)
        .map(function (p) {
          return (
            '<div style="padding:4px 0;border-bottom:1px solid var(--border)">' +
            "<strong>" +
            (p.name || "") +
            "</strong> · " +
            K.deptLabel(K.productCat(p)) +
            ' · <code style="font-size:10px">' +
            (p.catalogSlug || "") +
            '</code> <button type="button" class="btn btn-ghost btn-xs" onclick="editEtUrun(' +
            catalogProducts().indexOf(p) +
            ')">Düzenle</button></div>'
          );
        })
        .join("") +
      (list.length > 40 ? "<div style=\"margin-top:8px;color:var(--muted)\">… ve " + (list.length - 40) + " ürün daha</div>" : "");
  }

  global.saveSlugDeptMapping = function (slug, dept) {
    if (!O) return;
    O.setSlugDept(slug, dept);
    if (K) K.applyProductCategories(catalogProducts());
    renderEtKategoriMatrix();
    renderEtUrunler();
  };

  global.saveCategoryOverridesToServer = async function () {
    if (!O) return;
    try {
      await O.saveToServer();
      alert("Kategori override dosyası sunucuya kaydedildi.");
    } catch (e) {
      alert(
        "Sunucuya kaydedilemedi. API çalışıyor mu? Gerekirse «JSON indir» ile yedek alıp FTP yükleyin.\n\n" +
          (e && e.message ? e.message : e)
      );
    }
  };

  global.importCategoryOverridesFile = function () {
    document.getElementById("et-kat-import-file")?.click();
  };

  global.onCategoryOverridesFilePicked = function (input) {
    var f = input && input.files && input.files[0];
    if (!f || !O) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        O.mergeImported(JSON.parse(reader.result));
        if (K) K.applyProductCategories(catalogProducts());
        renderEtKategoriMatrix();
        renderEtUrunler();
        alert("Override dosyası yüklendi.");
      } catch (e) {
        alert("JSON okunamadı: " + (e.message || e));
      }
      input.value = "";
    };
    reader.readAsText(f, "UTF-8");
  };

  global.exportCatalogCategoryJson = async function () {
    if (!O || !K) return;
    var rows;
    try {
      if (global.EqustoEcomData && global.EqustoEcomData.fetchFresh) {
        rows = await global.EqustoEcomData.fetchFresh();
      } else {
        var r = await fetch("./data/ekipmanlar.json", { cache: "no-store" });
        rows = await r.json();
      }
    } catch (e) {
      alert("Katalog okunamadı: " + (e.message || e));
      return;
    }
    if (!Array.isArray(rows)) rows = rows.items || [];
    var store = O.getStore();
    var changed = 0;
    var out = rows.map(function (row) {
      var key = O.catalogKey(row.name, row.category);
      var ov = store.products[key];
      if (ov && ov.catalogSlug && ov.catalogSlug !== row.category) {
        changed++;
        return Object.assign({}, row, { category: ov.catalogSlug });
      }
      return row;
    });
    var blob = new Blob([JSON.stringify(out, null, 0)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "ekipmanlar-category-patch.json";
    a.click();
    alert(
      changed +
        " üründe category alanı güncellendi (patch). Tam katalog için bu dosyayı ekipmanlar.json ile birleştirip deploy edin."
    );
  };

  global.fillNpCategorySelects = fillNpCategorySelects;
  global.getNpCatalogSlugFromForm = getNpCatalogSlugFromForm;
  global.updateNpCatPreview = updateNpCatPreview;
  global.saveProductCategoryOverride = saveProductCategoryOverride;
  global.ensureOverridesLoaded = ensureOverridesLoaded;

  global.renderEtUrunler = renderEtUrunlerPatched;
  global.renderEtKategoriMatrix = renderEtKategoriMatrix;

  var _editEtUrun = global.editEtUrun;
  global.editEtUrun = function (i) {
    if (typeof _editEtUrun === "function") _editEtUrun(i);
    var p = catalogProducts()[i];
    fillNpCategorySelects(p);
  };

  var _openProductModal = global.openProductModal;
  global.openProductModal = function () {
    if (typeof _openProductModal === "function") _openProductModal();
    fillNpCategorySelects(null);
  };

  /* addProduct ecom dalı admin.html içinde (saveEcomProductCategory) — çift sarmalama yok */
})(typeof window !== "undefined" ? window : globalThis);
