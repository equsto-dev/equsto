/**
 * Konsept Tipleri — PFOS proje akışı (admin.html proje-akis paneli).
 * Kaynak: GET /api/pfos/kaynak · Kalıcı: GET/POST /api/proje-akis
 */
(function (global) {
  "use strict";

  var __kaynak = null;
  var __kaynakLoading = null;
  var __katManifest = null;
  var __katLoading = null;
  var __paTab = "konsept";
  var __saving = false;

  function apiBase() {
    return (
      global.PRODUCTS_API_BASE ||
      global.EQUSTO_PRODUCTS_API_BASE ||
      global.EQUSTO_API_BASE ||
      ""
    );
  }

  function bearer() {
    try {
      return (
        global._authToken ||
        localStorage.getItem("equsto_pro_admin_token") ||
        (global.EQUSTO_ADMIN_BEARER || "")
      );
    } catch (_e) {
      return global.EQUSTO_ADMIN_BEARER || "";
    }
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function toast(msg, type) {
    if (typeof global.adminToast === "function") global.adminToast(msg, type);
    else console.log("[Proje Akışı]", msg);
  }

  function mergeShopTypes(existing, incoming) {
    var byId = {};
    (existing || []).forEach(function (t) {
      if (t && t.id) byId[t.id] = t;
    });
    (incoming || []).forEach(function (t) {
      if (t && t.id) byId[t.id] = t;
    });
    return Object.keys(byId).map(function (k) {
      return byId[k];
    });
  }

  function enrichShopTypes(rawList, canonical) {
    return mergeShopTypes(rawList || [], canonical || []);
  }

  /** admin.html `let questions` ile aynı diziyi tutar (referans değiştirme). */
  function replaceGlobalArray(key, src) {
    var incoming = Array.isArray(src) ? src : [];
    var dst = global[key];
    if (Array.isArray(dst)) {
      dst.length = 0;
      incoming.forEach(function (item) {
        dst.push(item);
      });
      return dst;
    }
    global[key] = incoming.slice();
    return global[key];
  }

  function buildEqSetId(typeId, bantId) {
    var base = "set_" + typeId + (bantId ? "_" + bantId : "");
    return base.replace(/[^a-z0-9_]+/gi, "_");
  }

  function buildRuleId(typeId, setId) {
    return ("rule_" + typeId + "_" + setId).replace(/[^a-z0-9_]+/gi, "_");
  }

  function createStarterEqSets(shopTypes) {
    var rows = [];
    (shopTypes || []).forEach(function (concept) {
      var pfos = concept.pfos || {};
      if (pfos.durum === "planlanan") return;
      if (pfos.bantlar && pfos.bantlar.length) {
        pfos.bantlar.forEach(function (bant) {
          rows.push({
            id: buildEqSetId(concept.id, bant.id),
            name: concept.name + " - " + bant.label,
            typeId: concept.id,
            source: bant.listeDosya,
            desc:
              (pfos.dukkanSecim || "") +
              " / " +
              bant.label +
              " / ref " +
              bant.referansM2 +
              " m²",
            selectedIds: [],
          });
        });
        return;
      }
      rows.push({
        id: buildEqSetId(concept.id),
        name: concept.name + " - motor şablon",
        typeId: concept.id,
        source: pfos.motorSlug || pfos.teklifKaynagi || "",
        desc: pfos.bantKurali || "",
        selectedIds: [],
      });
    });
    return rows;
  }

  function createStarterRules(shopTypes, eqSets) {
    var rows = [];
    (eqSets || []).forEach(function (set) {
      var concept = (shopTypes || []).find(function (t) {
        return t.id === set.typeId;
      });
      if (!concept) return;
      var pfos = concept.pfos || {};
      var bant = (pfos.bantlar || []).find(function (b) {
        return set.id && set.id.endsWith("_" + b.id);
      });
      var conditions = [
        {
          label: "Dükkan türü",
          questionId: "q_dukkan_turu",
          op: "equals",
          value: pfos.dukkanSecim || "",
        },
      ];
      if (bant) {
        conditions.push({
          label: "m² bandı",
          questionId: "q_m2",
          op: "band",
          value: bant.label,
        });
      }
      rows.push({
        id: buildRuleId(concept.id, set.id),
        typeId: concept.id,
        setId: set.id,
        priority: bant ? 20 : 50,
        desc: concept.name + " seçilirse " + set.name + " setini öner",
        conditions: conditions,
      });
    });
    return rows;
  }

  function activeConcepts(shopTypes) {
    return (shopTypes || []).filter(function (t) {
      return (t.pfos || {}).durum !== "planlanan";
    });
  }

  function fetchKaynak() {
    if (__kaynak) return Promise.resolve(__kaynak);
    if (__kaynakLoading) return __kaynakLoading;
    var base = apiBase().replace(/\/$/, "");
    var url = base ? base + "/pfos/kaynak" : "/api/pfos/kaynak";
    __kaynakLoading = fetch(url, { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error("kaynak HTTP " + r.status);
        return r.json();
      })
      .then(function (j) {
        __kaynak = {
          shopTypes: Array.isArray(j.shopTypes) ? j.shopTypes : [],
          questions: Array.isArray(j.questions) ? j.questions : [],
          meta: j.meta || {},
        };
        __kaynakLoading = null;
        return __kaynak;
      })
      .catch(function (e) {
        __kaynakLoading = null;
        throw e;
      });
    return __kaynakLoading;
  }

  function applyPayload(data, opts) {
    opts = opts || {};
    if (!data) return;
    if (Array.isArray(data.questions) && data.questions.length) {
      replaceGlobalArray("questions", data.questions);
    } else if (!opts.keepQuestions && Array.isArray(data.questions)) {
      replaceGlobalArray("questions", data.questions);
    }
    if (Array.isArray(data.shopTypes)) {
      replaceGlobalArray("shopTypes", data.shopTypes);
    }
    if (Array.isArray(data.rules)) replaceGlobalArray("rules", data.rules);
    if (Array.isArray(data.eqSets)) replaceGlobalArray("eqSets", data.eqSets);
  }

  function loadStaticProjeAkis() {
    var base = apiBase().replace(/\/$/, "");
    var url = base ? base + "/data/proje-akis.json" : "/data/proje-akis.json";
    return fetch(url, { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error("proje-akis.json HTTP " + r.status);
        return r.json();
      })
      .then(function (j) {
        var data = j && (j.data || j);
        if (!data) return null;
        applyPayload(data);
        return data;
      });
  }

  function hydrateIfEmpty() {
    var q = global.questions || [];
    var st = global.shopTypes || [];
    if (q.length && st.length) return Promise.resolve(true);
    return loadFromServer({ mergeLs: false })
      .then(function () {
        q = global.questions || [];
        st = global.shopTypes || [];
        if (q.length && st.length) {
          return fetchKaynak()
            .then(function (src) {
              if (src && src.shopTypes && src.shopTypes.length) {
                replaceGlobalArray(
                  "shopTypes",
                  enrichShopTypes(global.shopTypes, src.shopTypes)
                );
              }
              return true;
            })
            .catch(function () {
              return true;
            });
        }
        return loadStaticProjeAkis().catch(function () {
          return null;
        });
      })
      .then(function () {
        q = global.questions || [];
        st = global.shopTypes || [];
        if (q.length && st.length) {
          return fetchKaynak()
            .then(function (src) {
              if (src && src.shopTypes && src.shopTypes.length) {
                replaceGlobalArray(
                  "shopTypes",
                  enrichShopTypes(global.shopTypes, src.shopTypes)
                );
              }
              return true;
            })
            .catch(function () {
              return true;
            });
        }
        return fetchKaynak()
          .then(function (src) {
            if (!src) return false;
            if (!(global.questions || []).length && src.questions && src.questions.length) {
              replaceGlobalArray(
                "questions",
                JSON.parse(JSON.stringify(src.questions))
              );
            }
            if (src.shopTypes && src.shopTypes.length) {
              replaceGlobalArray(
                "shopTypes",
                enrichShopTypes(global.shopTypes, src.shopTypes)
              );
            }
            return (
              (global.questions || []).length > 0 ||
              (global.shopTypes || []).length > 0
            );
          })
          .catch(function () {
            return false;
          });
      });
  }

  function loadFromServer(opts) {
    opts = opts || {};
    var base = apiBase().replace(/\/$/, "");
    var url = base ? base + "/proje-akis" : "/api/proje-akis";
    return fetch(url, {
      cache: "no-store",
      headers: bearer() ? { Authorization: "Bearer " + bearer() } : {},
    })
      .then(function (r) {
        return r.json().then(function (j) {
          return { ok: r.ok, j: j };
        });
      })
      .then(function (_ref) {
        var ok = _ref.ok;
        var j = _ref.j;
        var data = j && (j.data || j);
        if (!ok || !data) return null;
        var hadQ =
          Array.isArray(global.questions) && global.questions.length > 0;
        var hadT =
          Array.isArray(global.shopTypes) && global.shopTypes.length > 0;
        applyPayload(data, {
          keepQuestions: opts.mergeLs && hadQ && !(data.questions || []).length,
        });
        if (
          opts.mergeLs &&
          hadT &&
          !(data.shopTypes || []).length &&
          Array.isArray(global.shopTypes)
        ) {
          /* keep ls shopTypes */
        }
        return data;
      })
      .catch(function (e) {
        console.warn("[Proje Akışı] sunucu yükleme:", e);
        return null;
      });
  }

  function saveNow() {
    if (__saving) return Promise.resolve();
    __saving = true;
    setStatus("Kaydediliyor…", "info");
    if (typeof global.persist === "function") global.persist();
    return new Promise(function (resolve) {
      setTimeout(function () {
        __saving = false;
        setStatus("proje-akis.json kaydedildi", "ok");
        toast("Proje akışı kaydedildi", "ok");
        render();
        resolve();
      }, 700);
    });
  }

  function setStatus(msg, kind) {
    var el = document.getElementById("pa-status");
    if (!el) return;
    el.textContent = msg || "";
    el.className = "pa-banner" + (kind ? " pa-banner--" + kind : "");
    el.style.display = msg ? "block" : "none";
  }

  function tableWrap() {
    return (
      document.getElementById("pa-table-" + __paTab) ||
      document.getElementById("pa-table")
    );
  }

  function renderLegacyEditors() {
    if (__paTab === "konsept") {
      var fold = document.querySelector("#pa-ipane-konsept .pa-editor-fold");
      if (fold && fold.open && typeof global.renderTypes === "function") {
        global.renderTypes();
      }
    } else if (__paTab === "sorular") {
      var foldQ = document.querySelector("#pa-ipane-sorular .pa-editor-fold");
      if (foldQ && foldQ.open && typeof global.renderQuestions === "function") {
        global.renderQuestions();
      }
    }
  }

  function pfosUrunSayisi() {
    if (typeof global.countPfosAktifUrunler === "function") {
      return global.countPfosAktifUrunler();
    }
    return (global.products || []).filter(function (p) {
      return p && p.proje_fab_aktif !== false;
    }).length;
  }

  function fetchPfosKategoriler() {
    if (__katManifest) return Promise.resolve(__katManifest);
    if (__katLoading) return __katLoading;
    var base = apiBase().replace(/\/$/, "");
    var url = base ? base + "/pfos/kategoriler" : "/api/pfos/kategoriler";
    __katLoading = fetch(url, {
      cache: "no-store",
      headers: bearer() ? { Authorization: "Bearer " + bearer() } : {},
    })
      .then(function (r) {
        return r.json().then(function (j) {
          return { ok: r.ok, j: j };
        });
      })
      .then(function (_ref) {
        __katLoading = null;
        if (!_ref.ok || !_ref.j) throw new Error("kategoriler HTTP");
        var m = _ref.j.manifest || (_ref.j.data && _ref.j.data.manifest);
        if (!m) throw new Error("manifest yok");
        __katManifest = m;
        return m;
      })
      .catch(function (e) {
        __katLoading = null;
        throw e;
      });
    return __katLoading;
  }

  function flattenKatManifest(m) {
    var rows = [];
    (m.kategoriler || []).forEach(function (k) {
      (k.bantlar || []).forEach(function (b) {
        rows.push({
          key: k.id + ":" + b.id,
          kategoriId: k.id,
          kategoriLabel: k.label,
          ustKategori: k.ustKategori,
          bantId: b.id,
          bantLabel: b.label,
          referansM2: b.referansM2,
          kalemSayisi: (b.meta && b.meta.kalemSayisi) || 0,
          toplamAdet: (b.meta && b.meta.toplamAdet) || 0,
          kaynakDosya: b.meta && b.meta.kaynakDosya,
          yukleme: b.meta && b.meta.yukleme,
        });
      });
    });
    return rows;
  }

  function uploadKategoriExcel(row, file) {
    var base = apiBase().replace(/\/$/, "");
    var url = base ? base + "/pfos/kategoriler" : "/api/pfos/kategoriler";
    var fd = new FormData();
    fd.append("kategoriId", row.kategoriId);
    fd.append("bantId", row.bantId);
    fd.append("file", file);
    return fetch(url, {
      method: "POST",
      headers: bearer() ? { Authorization: "Bearer " + bearer() } : {},
      body: fd,
    }).then(function (r) {
      return r.json().then(function (j) {
        if (!r.ok || j.error) throw new Error(j.error || "Yükleme hatası");
        if (j.manifest) __katManifest = j.manifest;
        else __katManifest = null;
        return j;
      });
    });
  }

  function deleteKategoriListe(row) {
    var base = apiBase().replace(/\/$/, "");
    var q =
      "?kategori=" +
      encodeURIComponent(row.kategoriId) +
      "&bant=" +
      encodeURIComponent(row.bantId);
    var url = (base ? base + "/pfos/kategoriler" : "/api/pfos/kategoriler") + q;
    return fetch(url, {
      method: "DELETE",
      headers: bearer() ? { Authorization: "Bearer " + bearer() } : {},
    }).then(function (r) {
      return r.json().then(function (j) {
        if (!r.ok || j.error) throw new Error(j.error || "Silme hatası");
        if (j.manifest) __katManifest = j.manifest;
        else __katManifest = null;
        return j;
      });
    });
  }

  function openFullCatalogTab() {
    var tab = document.querySelector('.tabs .tab[data-tab="products"]');
    if (tab) tab.click();
  }

  function renderUrunlerPane() {
    var root = document.getElementById("pa-urun-root");
    if (!root) return;
    var total = (global.products || []).length;
    var pfos = pfosUrunSayisi();
    var katalogHtml =
      '<section class="pa-urun-block">' +
      '<h4 class="pa-subh">PFOS katalog — proje-akis.json · products[]</h4>' +
      '<p class="pa-hint" style="display:block;margin-bottom:10px">Katalogdan <code>proje_fab_aktif</code> işaretli ürünler legacy motorun set seçiminde kullanılır. Kayıt yalnızca bu alt küme olarak gönderilir.</p>' +
      '<div class="pa-stats" style="margin-bottom:12px">' +
      '<div class="pa-stat"><span class="pa-stat-n">' +
      total.toLocaleString("tr-TR") +
      '</span><span class="pa-stat-l">Katalog (ekipmanlar)</span></div>' +
      '<div class="pa-stat"><span class="pa-stat-n">' +
      pfos.toLocaleString("tr-TR") +
      '</span><span class="pa-stat-l">PFOS aktif</span></div>' +
      "</div>" +
      "</section>" +
      '<section class="pa-urun-block" style="margin-top:20px">' +
      '<h4 class="pa-subh">Referans listeleri — m² bantlı ekipman (Excel)</h4>' +
      '<p class="pa-hint" style="display:block;margin-bottom:10px">Steakhouse, Balıkçı, Şehir Oteli vb. listeler <code>public/data/pfos-referans/</code> altına kaydedilir.</p>' +
      '<div class="pa-table-wrap" id="pa-kat-table-wrap"><div class="pa-empty">Yükleniyor…</div></div>' +
      "</section>";
    root.innerHTML = katalogHtml;
    fetchPfosKategoriler()
      .then(function (m) {
        renderKategorilerTable(m);
      })
      .catch(function (e) {
        var w = document.getElementById("pa-kat-table-wrap");
        if (w) {
          w.innerHTML =
            '<div class="pa-empty">Referans listeleri yüklenemedi: ' +
            esc(e.message || e) +
            ". Bearer token ve API gerekir.</div>";
        }
      });
  }

  function renderKategorilerTable(manifest) {
    var wrap = document.getElementById("pa-kat-table-wrap");
    if (!wrap) return;
    var rows = flattenKatManifest(manifest);
    var body = rows
      .map(function (r) {
        var liste =
          r.kalemSayisi > 0
            ? r.kalemSayisi +
              " kalem · " +
              r.toplamAdet +
              " adet" +
              (r.kaynakDosya
                ? '<br><span class="pa-cell-muted">' + esc(r.kaynakDosya) + "</span>"
                : "") +
              (r.yukleme
                ? '<br><span class="pa-cell-muted">' +
                  esc(new Date(r.yukleme).toLocaleString("tr-TR")) +
                  "</span>"
                : "")
            : '<span style="color:var(--dangerT)">Henüz yüklenmedi</span>';
        return (
          "<tr data-kat-key=\"" +
          esc(r.key) +
          "\"><td><strong>" +
          esc(r.kategoriLabel) +
          "</strong><br><span class=\"pa-cell-muted\">" +
          esc(r.ustKategori) +
          "</span></td><td><span class=\"pa-tag\">" +
          esc(r.bantLabel) +
          "</span> ref " +
          esc(r.referansM2) +
          " m²</td><td>" +
          liste +
          '</td><td class="pa-kat-actions">' +
          '<label class="btn btn-primary btn-sm" style="cursor:pointer;margin:0">' +
          "Excel yükle" +
          '<input type="file" accept=".xlsx,.xls" style="display:none" data-kat-upload="' +
          esc(r.key) +
          '"></label>' +
          (r.kalemSayisi > 0
            ? ' <button type="button" class="btn btn-danger btn-sm" data-kat-del="' +
              esc(r.key) +
              '">Sil</button>'
            : "") +
          "</td></tr>"
        );
      })
      .join("");
    wrap.innerHTML =
      '<table class="pa-table"><thead><tr><th>Kategori</th><th>m² bantı</th><th>Liste</th><th>İşlem</th></tr></thead><tbody>' +
      (body || '<tr><td colspan="4" class="pa-empty">Bant tanımı yok</td></tr>') +
      "</tbody></table>";
    var rowByKey = {};
    rows.forEach(function (r) {
      rowByKey[r.key] = r;
    });
    wrap.querySelectorAll("[data-kat-upload]").forEach(function (inp) {
      inp.addEventListener("change", function () {
        var key = inp.getAttribute("data-kat-upload");
        var row = rowByKey[key];
        var file = inp.files && inp.files[0];
        if (!row || !file) return;
        setStatus("Excel yükleniyor…", "info");
        uploadKategoriExcel(row, file)
          .then(function (j) {
            toast(
              (j.kalemSayisi || 0) + " kalem yüklendi",
              "ok"
            );
            setStatus("", "");
            return fetchPfosKategoriler();
          })
          .then(renderKategorilerTable)
          .catch(function (e) {
            setStatus(e.message || "Hata", "err");
            toast(e.message || "Yükleme hatası", "err");
          });
        inp.value = "";
      });
    });
    wrap.querySelectorAll("[data-kat-del]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var key = btn.getAttribute("data-kat-del");
        var row = rowByKey[key];
        if (!row) return;
        if (
          !confirm(
            row.kategoriLabel + " " + row.bantLabel + " listesini silmek istiyor musunuz?"
          )
        )
          return;
        deleteKategoriListe(row)
          .then(function () {
            toast("Liste kaldırıldı", "ok");
            __katManifest = null;
            return fetchPfosKategoriler();
          })
          .then(renderKategorilerTable)
          .catch(function (e) {
            toast(e.message || "Silinemedi", "err");
          });
      });
    });
  }

  function goEticaretUrunler() {
    var tab = document.querySelector('.tabs .tab[data-tab="eticaret"]');
    if (tab) tab.click();
    setTimeout(function () {
      if (typeof global.showEtab === "function") {
        var etab = document.querySelector(
          '#pane-eticaret .etab[onclick*="et-urunler"]'
        );
        global.showEtab(etab, "et-urunler");
      }
    }, 80);
  }

  function setPaTab(key) {
    if (key === "urunler") {
      goEticaretUrunler();
      return;
    }
    if (key === "konsept" || key === "sorular" || key === "setkural") {
      __paTab = key;
    }
    document.querySelectorAll("#pane-proje-akis .pa-itab").forEach(function (t) {
      t.classList.toggle("active", t.dataset.patab === __paTab);
    });
    document.querySelectorAll("#pane-proje-akis .pa-ipane").forEach(function (p) {
      p.classList.toggle("active", p.id === "pa-ipane-" + __paTab);
    });
    renderToolbar();
    renderTable();
    renderLegacyEditors();
  }

  function updatePaTabLabels() {
    var st = (global.shopTypes || []).length;
    var q = (global.questions || []).length;
    var r = (global.rules || []).length;
    var s = (global.eqSets || []).length;
    var map = {
      konsept: "Konsept (" + st + ")",
      sorular: "Sorular (" + q + ")",
      setkural: "Set & Kural (" + s + "/" + r + ")",
    };
    document.querySelectorAll("#pane-proje-akis .pa-itab").forEach(function (tab) {
      var k = tab.dataset.patab;
      if (map[k]) tab.textContent = map[k];
    });
  }

  function renderStats() {
    var el = document.getElementById("pa-stats");
    if (!el) return;
    var st = global.shopTypes || [];
    var q = global.questions || [];
    var r = global.rules || [];
    var s = global.eqSets || [];
    var ac = activeConcepts(st);
    var setIds = {};
    s.forEach(function (x) {
      if (x.typeId) setIds[x.typeId] = true;
    });
    var noSet = ac.filter(function (t) {
      return !setIds[t.id];
    }).length;
    var ruleSetIds = {};
    r.forEach(function (x) {
      if (x.setId) ruleSetIds[x.setId] = true;
    });
    var noRule = s.filter(function (x) {
      return !ruleSetIds[x.id];
    }).length;
    el.innerHTML =
      '<div class="pa-stat"><span class="pa-stat-n">' +
      q.length +
      '</span><span class="pa-stat-l">Sorular</span></div>' +
      '<div class="pa-stat"><span class="pa-stat-n">' +
      st.length +
      '</span><span class="pa-stat-l">Konsept</span></div>' +
      '<div class="pa-stat"><span class="pa-stat-n">' +
      r.length +
      '</span><span class="pa-stat-l">Kurallar</span></div>' +
      '<div class="pa-stat"><span class="pa-stat-n">' +
      s.length +
      '</span><span class="pa-stat-l">Setler</span></div>';
    updatePaTabLabels();
  }

  function renderToolbar() {
    var tb = document.getElementById("pa-toolbar");
    if (!tb) return;
    var disabled = __saving ? " disabled" : "";
    if (__paTab === "konsept") {
      tb.innerHTML =
        '<button type="button" class="btn btn-primary btn-sm"' +
        disabled +
        ' data-pa="konsept-yukle">Konsept yükle</button>' +
        '<button type="button" class="btn btn-ghost btn-sm"' +
        disabled +
        ' data-pa="konsept-birlestir">Eksikleri ekle (birleştir)</button>' +
        '<button type="button" class="btn btn-ghost btn-sm"' +
        disabled +
        ' data-pa="konsept-temizle">Konseptleri temizle</button>' +
        '<button type="button" class="btn btn-ghost btn-sm" data-pa="konsept-kanonik">↺ Kanonik yükle</button>' +
        '<button type="button" class="btn btn-ghost btn-sm"' +
        disabled +
        ' data-pa="referans-yenile">↺ Referans listeleri</button>';
    } else if (__paTab === "sorular") {
      var n = (__kaynak && __kaynak.meta.soruCount) || "v3";
      tb.innerHTML =
        '<span class="pa-hint">Soru seti ' +
        esc(String(n)) +
        " — kayıt için Bearer gerekir.</span>" +
        '<button type="button" class="btn btn-primary btn-sm"' +
        disabled +
        ' data-pa="soru-kaydet">Soruları kaydet</button>' +
        '<button type="button" class="btn btn-ghost btn-sm"' +
        disabled +
        ' data-pa="tam-set">Tam set: soru + konsept</button>' +
        '<button type="button" class="btn btn-ghost btn-sm" data-pa="soru-kanonik">↺ Kanonik yükle</button>';
    } else if (__paTab === "setkural") {
      tb.innerHTML =
        '<button type="button" class="btn btn-primary btn-sm"' +
        disabled +
        ' data-pa="set-taslak">Konseptlerden set taslağı üret</button>' +
        '<button type="button" class="btn btn-ghost btn-sm"' +
        disabled +
        ' data-pa="kural-taslak">Setlerden kural taslağı üret</button>' +
        '<button type="button" class="btn btn-ghost btn-sm"' +
        disabled +
        ' data-pa="set-temizle">Set ve kuralları temizle</button>' +
        '<button type="button" class="btn btn-ghost btn-sm"' +
        disabled +
        ' data-pa="referans-yenile">↺ Referans listeleri</button>' +
        '<button type="button" class="btn btn-ghost btn-sm" data-pa="katalog-gelismis">Katalog (gelişmiş) →</button>' +
        '<button type="button" class="btn btn-ghost btn-sm" data-pa="eticaret-urunler">E-Ticaret → Ürünler</button>';
    } else {
      tb.innerHTML = "";
    }
    tb.querySelectorAll("[data-pa]").forEach(function (btn) {
      btn.addEventListener("click", onToolbarClick);
    });
  }

  function onToolbarClick(ev) {
    var act = ev.currentTarget.getAttribute("data-pa");
    if (!act || __saving) return;
    fetchKaynak()
      .then(function (src) {
        return runAction(act, src);
      })
      .catch(function (e) {
        setStatus("Kaynak API: " + (e.message || e), "err");
        toast("Kanonik kaynak yüklenemedi", "err");
      });
  }

  function runAction(act, src) {
    var canonical = src.shopTypes || [];
    var canonQ = src.questions || [];
    if (act === "konsept-kanonik") {
      if (typeof global.loadDefaultTypes === "function") {
        return Promise.resolve(global.loadDefaultTypes()).then(function () {
          renderLegacyEditors();
          return saveNow();
        });
      }
      replaceGlobalArray("shopTypes", canonical.slice());
      toast("Konsept listesi yüklendi", "ok");
    } else if (act === "konsept-yukle") {
      replaceGlobalArray("shopTypes", canonical.slice());
      toast("Konsept listesi yüklendi", "ok");
    } else if (act === "konsept-birlestir") {
      replaceGlobalArray(
        "shopTypes",
        enrichShopTypes(global.shopTypes, canonical)
      );
      toast("Eksik konseptler birleştirildi", "ok");
    } else if (act === "konsept-temizle") {
      replaceGlobalArray("shopTypes", []);
      toast("Konseptler temizlendi", "ok");
    } else if (act === "soru-kanonik") {
      if (typeof global.loadDefaultQuestions === "function") {
        return Promise.resolve(global.loadDefaultQuestions()).then(function () {
          renderLegacyEditors();
          return saveNow();
        });
      }
      replaceGlobalArray("questions", JSON.parse(JSON.stringify(canonQ)));
      toast("Soru seti v3 yüklendi", "ok");
    } else if (act === "soru-kaydet") {
      replaceGlobalArray("questions", JSON.parse(JSON.stringify(canonQ)));
      toast("Soru seti v3 kaydediliyor", "ok");
    } else if (act === "tam-set") {
      replaceGlobalArray("questions", JSON.parse(JSON.stringify(canonQ)));
      replaceGlobalArray(
        "shopTypes",
        enrichShopTypes(global.shopTypes, canonical)
      );
      toast("Soru + konsept kaydediliyor", "ok");
    } else if (act === "set-taslak") {
      replaceGlobalArray("eqSets", createStarterEqSets(global.shopTypes));
      toast("Set taslakları üretildi", "ok");
    } else if (act === "kural-taslak") {
      replaceGlobalArray(
        "rules",
        createStarterRules(global.shopTypes, global.eqSets)
      );
      toast("Kural taslakları üretildi", "ok");
    } else if (act === "set-temizle") {
      replaceGlobalArray("eqSets", []);
      replaceGlobalArray("rules", []);
      toast("Set ve kurallar temizlendi", "ok");
    } else if (act === "eticaret-urunler") {
      goEticaretUrunler();
      return Promise.resolve();
    } else if (act === "urun-kaydet") {
      var base = apiBase().replace(/\/$/, "");
      var syncUrl = base
        ? base + "/pfos/proje-akis/sync-products"
        : "/api/pfos/proje-akis/sync-products";
      if (bearer()) {
        setStatus("Katalog senkronize ediliyor…", "info");
        return fetch(syncUrl, {
          method: "POST",
          headers: { Authorization: "Bearer " + bearer() },
        })
          .then(function (r) {
            return r.json().then(function (j) {
              if (!r.ok || j.error) throw new Error(j.error || "Senkron hatası");
              var meta = j.meta || {};
              var list = (j.data && j.data.products) || [];
              if (list.length) {
                /* sunucu kaydı güncel; yerel katalog ile hizala */
              }
              return loadFromServer({ mergeLs: false }).then(function () {
                toast(
                  (meta.yeni || list.length) +
                    " ürün kaydedildi (önceki " +
                    (meta.onceki || "?") +
                    ")",
                  "ok"
                );
                render();
                return saveNow();
              });
            });
          })
          .catch(function (e) {
            setStatus(e.message || "Hata", "err");
            toast(e.message || "Senkron başarısız", "err");
          });
      }
      var n = pfosUrunSayisi();
      toast(n + " PFOS ürün (yerel) kaydediliyor", "ok");
      if (typeof global.persist === "function") global.persist();
      return saveNow();
    } else if (act === "referans-yenile") {
      var fold = document.getElementById("pa-referans-fold");
      if (fold) fold.open = true;
      __katManifest = null;
      setStatus("Referans listeleri yükleniyor…", "info");
      return fetchPfosKategoriler()
        .then(function (m) {
          renderKategorilerTable(m);
          setStatus("", "");
          toast("Referans listeleri yüklendi", "ok");
        })
        .catch(function (e) {
          setStatus(e.message || "Hata", "err");
          toast(e.message || "Referans yüklenemedi", "err");
        });
    } else if (act === "katalog-yenile") {
      if (typeof global.refreshCatalogProducts === "function") {
        return global.refreshCatalogProducts().then(function () {
          render();
          toast("Katalog yenilendi", "ok");
        });
      }
      toast("Katalog yenileme yok", "err");
      return;
    } else if (act === "katalog-gelismis") {
      openFullCatalogTab();
      return;
    }
    if (typeof global.persist === "function") global.persist();
    renderLegacyEditors();
    return saveNow();
  }

  function renderKonseptTable(wrap) {
    var st = global.shopTypes || [];
    var rows = st
      .map(function (t) {
        var pfos = t.pfos || {};
        var bantTxt =
          pfos.bantlar && pfos.bantlar.length
            ? pfos.bantlar
                .map(function (b) {
                  return b.label + " (ref " + b.referansM2 + " m²)";
                })
                .join(" · ")
            : pfos.teklifKaynagi === "motor-sablon"
              ? "Motor şablonu"
              : "—";
        var m2 =
          pfos.m2Min != null
            ? pfos.m2Min + "–" + pfos.m2Max
            : "—";
        return (
          "<tr><td class=\"pa-col-id\"><code>" +
          esc(t.id) +
          "</code></td><td class=\"pa-col-name\">" +
          esc(t.name) +
          "</td><td>" +
          esc(t.parent || "—") +
          "</td><td><code>" +
          esc(pfos.motorSlug || "—") +
          "</code></td><td>" +
          esc(pfos.dukkanSecim || "—") +
          "</td><td>" +
          esc(m2) +
          "</td><td class=\"pa-cell-muted\">" +
          esc(bantTxt) +
          "</td></tr>"
        );
      })
      .join("");
    wrap.innerHTML =
      '<table class="pa-table pa-table-pro"><thead><tr>' +
      "<th>ID (legacy)</th><th>Görünen ad</th><th>Üst grup</th><th>Motor slug</th><th>Dükkan seçimi</th><th>m²</th><th>Ekipman bantları</th>" +
      "</tr></thead><tbody>" +
      (rows ||
        '<tr><td colspan="7" class="pa-empty">Konsept yok — «Konsept yükle» ile başlayın.</td></tr>') +
      "</tbody></table>";
  }

  function renderSorularTable(wrap) {
    var q = global.questions || [];
    var rows = q
      .map(function (item) {
        return (
          "<tr><td><code>" +
          esc(item.id) +
          "</code></td><td>" +
          esc(item.step) +
          "</td><td>" +
          esc(item.panel || "—") +
          "</td><td>" +
          esc(item.text) +
          "</td><td>" +
          esc(item.type) +
          "</td><td><code class=" +
          '"pa-code-sm"' +
          ">" +
          esc(item.mapsTo || "—") +
          "</code></td><td class=" +
          '"pa-cell-muted"' +
          ">" +
          esc(item.motorEtkisi || "—") +
          "</td></tr>"
        );
      })
      .join("");
    wrap.innerHTML =
      '<table class="pa-table pa-table-pro"><thead><tr>' +
      "<th>ID</th><th>Adım</th><th>Panel</th><th>Soru</th><th>Tip</th><th>mapsTo</th><th>Motor</th>" +
      "</tr></thead><tbody>" +
      (rows || '<tr><td colspan="7" class="pa-empty">Soru yok.</td></tr>') +
      "</tbody></table>";
  }

  function renderSetKuralTables(wrap) {
    var sets = global.eqSets || [];
    var rules = global.rules || [];
    var setRows = sets
      .map(function (s) {
        return (
          "<tr><td><code>" +
          esc(s.id) +
          "</code></td><td>" +
          esc(s.name) +
          "</td><td><code>" +
          esc(s.typeId || "—") +
          "</code></td><td class=" +
          '"pa-cell-muted"' +
          ">" +
          esc(s.source || "—") +
          "</td><td>" +
          (s.selectedIds ? s.selectedIds.length : 0) +
          "</td><td>" +
          esc(s.desc || "") +
          "</td></tr>"
        );
      })
      .join("");
    var ruleRows = rules
      .map(function (r) {
        var cond = (r.conditions || [])
          .map(function (c) {
            return (
              '<span class="pa-tag">' +
              esc((c.label || c.questionId) + ": " + c.value) +
              "</span>"
            );
          })
          .join(" ");
        return (
          "<tr><td><code>" +
          esc(r.id) +
          "</code></td><td><code>" +
          esc(r.typeId || "—") +
          "</code></td><td>" +
          esc(r.setId) +
          "</td><td>" +
          esc(r.priority != null ? r.priority : "—") +
          "</td><td>" +
          (cond || "—") +
          "</td><td>" +
          esc(r.desc || "") +
          "</td></tr>"
        );
      })
      .join("");
    wrap.innerHTML =
      '<h4 class="pa-subh">Setler (' +
      sets.length +
      ")</h4>" +
      '<table class="pa-table pa-table-pro pa-table--compact"><thead><tr><th>Set ID</th><th>Ad</th><th>Konsept</th><th>Kaynak</th><th>Ürün</th><th>Not</th></tr></thead><tbody>' +
      (setRows || '<tr><td colspan="6" class="pa-empty">Set yok.</td></tr>') +
      "</tbody></table>" +
      '<h4 class="pa-subh">Kurallar (' +
      rules.length +
      ")</h4>" +
      '<table class="pa-table pa-table-pro pa-table--compact"><thead><tr><th>Kural ID</th><th>Konsept</th><th>Set</th><th>Öncelik</th><th>Koşullar</th><th>Not</th></tr></thead><tbody>' +
      (ruleRows || '<tr><td colspan="6" class="pa-empty">Kural yok.</td></tr>') +
      "</tbody></table>";
  }

  function renderTable() {
    var wrap = tableWrap();
    if (!wrap) return;
    if (__paTab === "konsept") renderKonseptTable(wrap);
    else if (__paTab === "sorular") renderSorularTable(wrap);
    else renderSetKuralTables(wrap);
  }

  function render() {
    renderStats();
    renderToolbar();
    renderTable();
    renderLegacyEditors();
    try {
      if (typeof global.updateStats === "function") global.updateStats();
    } catch (_e) {}
  }

  function loadProPanelCanonical(opts) {
    opts = opts || {};
    if (opts.confirm !== false) {
      if (
        !global.confirm(
          "Eski soru, konsept, kural ve set verisi silinir; Ant Design Pro kanonik liste yüklenir. Devam?"
        )
      ) {
        return Promise.resolve(false);
      }
    }
    if (typeof global.clearLsProjeAkisFields === "function") {
      global.clearLsProjeAkisFields();
    }
    setStatus("Pro panel verisi yükleniyor…", "info");
    var base = apiBase().replace(/\/$/, "");
    var seedUrl = base
      ? base + "/pfos/proje-akis/seed"
      : "/api/pfos/proje-akis/seed";
    var seedP = Promise.resolve(null);
    if (bearer()) {
      seedP = fetch(seedUrl, {
        method: "POST",
        headers: bearer() ? { Authorization: "Bearer " + bearer() } : {},
      })
        .then(function (r) {
          return r.json();
        })
        .catch(function () {
          return null;
        });
    }
    return seedP
      .then(function () {
        return fetchKaynak();
      })
      .then(function (src) {
        replaceGlobalArray(
          "questions",
          JSON.parse(JSON.stringify(src.questions || []))
        );
        replaceGlobalArray(
          "shopTypes",
          JSON.parse(JSON.stringify(src.shopTypes || []))
        );
        replaceGlobalArray("rules", []);
        replaceGlobalArray("eqSets", []);
        if (opts.withStarterSets) {
          replaceGlobalArray("eqSets", createStarterEqSets(global.shopTypes));
          replaceGlobalArray(
            "rules",
            createStarterRules(global.shopTypes, global.eqSets)
          );
        }
        __kaynak = null;
        __katManifest = null;
        if (typeof global.persist === "function") global.persist();
        renderLegacyEditors();
        return saveNow();
      })
      .then(function () {
        setStatus("Pro panel verisi aktif", "ok");
        toast(
          (global.questions || []).length +
            " soru · " +
            (global.shopTypes || []).length +
            " konsept",
          "ok"
        );
        render();
        return true;
      })
      .catch(function (e) {
        setStatus(e.message || "Hata", "err");
        toast(e.message || "Pro panel yüklenemedi", "err");
        return false;
      });
  }

  function reload() {
    setStatus("Yenileniyor…", "info");
    return loadFromServer({ mergeLs: false })
      .then(function () {
        return fetchKaynak().catch(function () {
          return null;
        });
      })
      .then(function () {
        setStatus("", "");
        render();
        toast("Proje akışı yenilendi", "ok");
      });
  }

  function initUi() {
    var pane = document.getElementById("pane-proje-akis");
    if (!pane || pane.dataset.paInit === "1") return;
    pane.dataset.paInit = "1";
    pane.querySelectorAll(".pa-itab").forEach(function (t) {
      t.addEventListener("click", function () {
        setPaTab(t.dataset.patab);
      });
    });
    pane.querySelectorAll(".pa-editor-fold").forEach(function (fold) {
      fold.addEventListener("toggle", function () {
        if (fold.open) renderLegacyEditors();
      });
    });
    var btnReload = document.getElementById("pa-btn-reload");
    var btnSave = document.getElementById("pa-btn-save");
    if (btnReload) btnReload.addEventListener("click", reload);
    if (btnSave) btnSave.addEventListener("click", saveNow);
    var paQ = new URLSearchParams(location.search).get("pa");
    if (paQ && /^(konsept|sorular|setkural)$/i.test(paQ)) {
      setPaTab(paQ);
    } else {
      setPaTab("konsept");
    }
  }

  global.EqProjeAkis = {
    mergeShopTypes: mergeShopTypes,
    enrichShopTypes: enrichShopTypes,
    createStarterEqSets: createStarterEqSets,
    createStarterRules: createStarterRules,
    fetchKaynak: fetchKaynak,
    loadFromServer: loadFromServer,
    hydrateIfEmpty: hydrateIfEmpty,
    loadProPanelCanonical: loadProPanelCanonical,
    setPaTab: setPaTab,
    render: function () {
      initUi();
      render();
    },
    reload: reload,
    saveNow: saveNow,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initUi);
  } else {
    initUi();
  }
})(typeof window !== "undefined" ? window : this);
