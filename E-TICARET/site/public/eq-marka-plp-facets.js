/**
 * Marka PLP — çok departmanlı ürün havuzu için sol filtre (kategori, pişirme tipi, enerji, fiyat).
 */
(function (global) {
  "use strict";

  var MARKA_DEPT_TILES = [
    { id: "pisirme", label: "Pişirme Ekipmanları" },
    { id: "sogutma", label: "Soğutma Ekipmanları" },
    { id: "tezgah", label: "Tezgahlar" },
    { id: "yikama", label: "Yıkama Ekipmanları" },
    { id: "hazirlik", label: "Hazırlık Ekipmanları" },
    { id: "kahve", label: "Kahve Ekipmanları" },
    { id: "dolap", label: "Dolaplar" },
    { id: "davlumbaz", label: "Davlumbazlar" },
    { id: "icecek", label: "İçecek Ekipmanları" },
    { id: "araba", label: "Arabalar" },
    { id: "istif", label: "İstif Rafları" },
    { id: "tasima", label: "Taşıma Ekipmanları" },
    { id: "market-reyon", label: "Market Reyonları" },
  ];

  function lc(s) {
    return String(s || "").toLocaleLowerCase("tr");
  }

  function parsePrice(p) {
    var s = String(p || "")
      .split("\n")[0]
      .replace(/\./g, "")
      .replace(",", ".")
      .replace(/[^\d.]/g, "");
    var n = parseFloat(s);
    return isNaN(n) ? 0 : n;
  }

  function displayPriceForRow(row) {
    if (!row) return "";
    if (global.EqustoPriceDisplay && typeof global.EqustoPriceDisplay.formatCard === "function") {
      return global.EqustoPriceDisplay.formatCard(row);
    }
    if (row.fiyat_bekleniyor || /teklif\s+için/i.test(String(row.price || ""))) return "";
    var n = Number(row.fiyat_tl) > 0 ? Number(row.fiyat_tl) : 0;
    if (!(n > 0)) {
      var full = String(row.price || "");
      var dahil = full.match(/K\s*D\s*V\s*[Dd]ahil[^\d]*([\d.,]+)/i);
      if (dahil) n = parsePrice(dahil[1]);
      if (!(n > 0)) {
        var line0 = full.split("\n")[0] || "";
        var net = parsePrice(line0);
        if (net > 0 && /\+?\s*K\s*D\s*V/i.test(line0)) n = Math.round(net * 1.2 * 100) / 100;
        else if (net > 0) n = net;
      }
    }
    if (!(n > 0)) return "";
    return (
      "₺" +
      n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) +
      " KDV dahil"
    );
  }

  function normalizeRow(x) {
    if (typeof global.eqSanitizeVendorProduct === "function") {
      global.eqSanitizeVendorProduct(x);
    }
    var row = x;
    if (
      global.EqustoKurLive &&
      typeof global.EqustoKurLive.applyRowPrices === "function"
    ) {
      row = global.EqustoKurLive.applyRowPrices(x) || x;
    }
    return {
      c: row.category || "",
      b: String(row.brand || "").trim(),
      n: String(row.name || "").trim(),
      p: displayPriceForRow(row),
      raw: row,
    };
  }

  function findTile(id) {
    for (var i = 0; i < MARKA_DEPT_TILES.length; i++) {
      if (MARKA_DEPT_TILES[i].id === id) return MARKA_DEPT_TILES[i];
    }
    return null;
  }

  function tileMatch(u, tile) {
    if (!tile || !tile.id || !u) return false;
    var row = u.raw || u;
    if (typeof global.eqProductMatchesDept === "function") {
      return global.eqProductMatchesDept(
        {
          dept: row.dept,
          category: u.c || row.category,
          c: u.c || row.category,
        },
        tile.id,
      );
    }
    return lc(row.dept) === lc(tile.id);
  }

  function poolHasDept(pool, deptId) {
    for (var i = 0; i < pool.length; i++) {
      if (tileMatch(pool[i], { id: deptId })) return true;
    }
    return false;
  }

  function create(opts) {
    opts = opts || {};
    var all = (opts.products || []).map(normalizeRow);
    var state = {
      activeTiles: [],
      brands: [],
      olcu: [],
      energy: [],
      kuvetGn: [],
      buzdolapTip: [],
      pisirmeTip: [],
      priceMin: "",
      priceMax: "",
    };

    function filtered() {
      var list = all;
      if (state.activeTiles.length) {
        list = list.filter(function (u) {
          for (var ti = 0; ti < state.activeTiles.length; ti++) {
            var tile = findTile(state.activeTiles[ti]);
            if (tile && tileMatch(u, tile)) return true;
          }
          return false;
        });
      }
      if (state.pisirmeTip.length && global.EqPisirmeFacets) {
        list = list.filter(function (u) {
          return global.EqPisirmeFacets.hitMatchesAnyFacet(
            { name: u.n, n: u.n, category: u.c, raw: u.raw },
            state.pisirmeTip,
          );
        });
      }
      if (state.energy.length && global.EqDeptCmFacets) {
        list = list.filter(function (u) {
          for (var ei = 0; ei < state.energy.length; ei++) {
            if (global.EqDeptCmFacets.matchEnergy(u, state.energy[ei])) return true;
          }
          return false;
        });
      }
      if (state.priceMin !== "") {
        var lo = Number(state.priceMin);
        list = list.filter(function (u) {
          return parsePrice(u.p) >= lo;
        });
      }
      if (state.priceMax !== "") {
        var hi = Number(state.priceMax);
        list = list.filter(function (u) {
          var n = parsePrice(u.p);
          return !n || n <= hi;
        });
      }
      return list;
    }

    function poolForFacetCounts(exclude) {
      var list = all;
      if (state.activeTiles.length && exclude !== "tile") {
        list = list.filter(function (u) {
          for (var ti = 0; ti < state.activeTiles.length; ti++) {
            var tile = findTile(state.activeTiles[ti]);
            if (tile && tileMatch(u, tile)) return true;
          }
          return false;
        });
      }
      if (state.pisirmeTip.length && exclude !== "pisirmeTip" && global.EqPisirmeFacets) {
        list = list.filter(function (u) {
          return global.EqPisirmeFacets.hitMatchesAnyFacet(
            { name: u.n, n: u.n, category: u.c, raw: u.raw },
            state.pisirmeTip,
          );
        });
      }
      if (state.energy.length && exclude !== "energy" && global.EqDeptCmFacets) {
        list = list.filter(function (u) {
          for (var ei = 0; ei < state.energy.length; ei++) {
            if (global.EqDeptCmFacets.matchEnergy(u, state.energy[ei])) return true;
          }
          return false;
        });
      }
      if (state.priceMin !== "" && exclude !== "price") {
        var lo = Number(state.priceMin);
        list = list.filter(function (u) {
          return parsePrice(u.p) >= lo;
        });
      }
      if (state.priceMax !== "" && exclude !== "price") {
        var hi = Number(state.priceMax);
        list = list.filter(function (u) {
          var n = parsePrice(u.p);
          return !n || n <= hi;
        });
      }
      return list;
    }

    function clearAllFilters() {
      state.activeTiles = [];
      state.pisirmeTip = [];
      state.energy = [];
      state.priceMin = "";
      state.priceMax = "";
    }

    function renderSelectedChips() {
      if (!global.EqDeptCmFacets) return;
      var asideChips = document.getElementById("eq-dept-cm-chips");
      if (!asideChips) return;
      global.EqDeptCmFacets.renderSelectedChips(
        asideChips,
        state,
        MARKA_DEPT_TILES,
        tileMatch,
        function (type, value) {
          if (type === "tile") {
            state.activeTiles = state.activeTiles.filter(function (t) {
              return t !== value;
            });
          } else if (type === "energy") {
            state.energy = state.energy.filter(function (e) {
              return e !== value;
            });
          } else if (type === "pisirmeTip") {
            state.pisirmeTip = state.pisirmeTip.filter(function (k) {
              return k !== value;
            });
          } else if (type === "priceMin") state.priceMin = "";
          else if (type === "priceMax") state.priceMax = "";
          renderFacets();
          if (typeof opts.onChange === "function") opts.onChange();
        },
      );
    }

    function renderFacets() {
      var host = document.getElementById("eq-marka-plp-facets");
      if (!host || !global.EqDeptCmFacets) return;
      var showPisirmeTip = poolHasDept(poolForFacetCounts("pisirmeTip"), "pisirme");
      global.EqDeptCmFacets.mount(host, {
        dept: "marka",
        hideBrands: true,
        showPisirmeTip: showPisirmeTip,
        showEnergy: showPisirmeTip,
        allProducts: all,
        state: state,
        tiles: MARKA_DEPT_TILES,
        tileMatch: tileMatch,
        getPoolForCounts: poolForFacetCounts,
        onChange: function (kind) {
          if (kind === "clear") clearAllFilters();
          renderFacets();
          if (typeof opts.onChange === "function") opts.onChange();
        },
      });
      renderSelectedChips();
      if (global.EqFilterColumn && typeof global.EqFilterColumn.syncClearVisible === "function") {
        var hasActive =
          state.activeTiles.length ||
          state.pisirmeTip.length ||
          state.energy.length ||
          state.priceMin !== "" ||
          state.priceMax !== "";
        global.EqFilterColumn.syncClearVisible(hasActive);
      }
      if (typeof global.__eqSyncFilterAsideEmptyClass === "function") {
        global.__eqSyncFilterAsideEmptyClass();
      }
    }

    function mount() {
      if (global.EqFilterColumn && typeof global.EqFilterColumn.injectDeptChrome === "function") {
        global.EqFilterColumn.injectDeptChrome();
      }
      renderFacets();
      var clearBtn = document.getElementById("eq-filter-clear");
      if (clearBtn && !clearBtn.__eqMarkaBound) {
        clearBtn.__eqMarkaBound = true;
        clearBtn.addEventListener("click", function () {
          clearAllFilters();
          renderFacets();
          if (typeof opts.onChange === "function") opts.onChange();
        });
      }
    }

    return {
      mount: mount,
      matches: function (row) {
        var norm = row && row.raw ? row : normalizeRow(row);
        var list = filtered();
        for (var i = 0; i < list.length; i++) {
          if (list[i].raw === norm.raw || list[i].n === norm.n) return true;
        }
        return false;
      },
      matchesCatalogRow: function (row) {
        if (!row) return false;
        var id = String(row.id || row.sku || "");
        var list = filtered();
        for (var i = 0; i < list.length; i++) {
          var raw = list[i].raw || {};
          if (id && String(raw.id || raw.sku || "") === id) return true;
        }
        return filtered().some(function (u) {
          return u.raw === row;
        });
      },
      getFilterFn: function () {
        var allowed = {};
        filtered().forEach(function (u) {
          var raw = u.raw;
          if (raw && raw.id) allowed[String(raw.id)] = true;
        });
        return function (row) {
          if (!row) return false;
          if (row.id && allowed[String(row.id)]) return true;
          return filtered().some(function (u) {
            return u.raw === row;
          });
        };
      },
      filteredRows: filtered,
      state: state,
    };
  }

  global.EqMarkaPlpFacets = { create: create, tiles: MARKA_DEPT_TILES };
})(typeof window !== "undefined" ? window : globalThis);
