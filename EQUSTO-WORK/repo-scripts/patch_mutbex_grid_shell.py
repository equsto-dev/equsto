# -*- coding: utf-8 -*-
"""eq-category-shell.js — varsayılan Mutbex kategori grid (mutbex.com)."""
from pathlib import Path

p = Path(r"c:\D Disk\EQUSTO-CURSOR\public\eq-category-shell.js")
s = p.read_text(encoding="utf-8")

if "useMutbexGrid" in s:
    print("already patched")
    raise SystemExit(0)

s = s.replace(
    "      shown: { featured: 12, newin: 12, sublist: 24 }\n    };",
    "      shown: { featured: 12, newin: 12, sublist: 24 },\n"
    "      useMutbexGrid: opts.mutbex !== false,\n"
    "      shownGrid: 48,\n"
    "      gridStep: 24\n"
    "    };",
)

s = s.replace(
    "    function resetRailShown() {\n"
    "      state.shown.featured = 12;\n"
    "      state.shown.newin = 12;\n"
    "      state.shown.sublist = 24;\n"
    "    }",
    "    function resetRailShown() {\n"
    "      state.shown.featured = 12;\n"
    "      state.shown.newin = 12;\n"
    "      state.shown.sublist = 24;\n"
    "      state.shownGrid = 48;\n"
    "    }",
)

legacy_inner = """    root.classList.add('eq-cat-shell-root', 'eq-mx-vitrin', 'eq-mx-vitrin--dept');
    root.innerHTML =
      mxTickerHtml() +
      '<motion class="eq-mx-hero eq-mx-hero--dept"><div class="eq-mx-hero__stage">' +
          '<div class="eq-mx-hero__slides"></div>' +
          '<button type="button" class="eq-mx-hero__nav eq-mx-hero__nav--prev" aria-label="Önceki">‹</button>' +
          '<button type="button" class="eq-mx-hero__nav eq-mx-hero__nav--next" aria-label="Sonraki">›</button>' +
        '</motion></div>' +
      '<div class="eq-cat-mobile-parent" id="eq-cat-mobile-parent" hidden></div>' +
      '<div class="eq-mx-story-wrap"><motion class="eq-mx-story__track" id="eq-cat-mx-stories"></div></div>' +
      '<h1 class="eq-mx-page-title">' + esc(state.catLabel) + '</h1>' +
      (state.catDesc ? '<p class="eq-mx-page-desc">' + esc(state.catDesc) + '</p>' : '') +
      '<section class="eq-mx-catalog-bar" aria-label="Katalog araç çubuğu">' +
        '<div class="eq-mx-catalog-bar__top">' +
          '<div class="eq-mx-catalog-count" id="eq-cat-result-count"></div>' +
          '<div class="main-filters eq-mx-main-filters">' +
            '<button type="button" class="filter-btn" data-eq-filter-action="refine" data-i18n="home.filter_filtrele">Filtrele</button>' +
            '<button type="button" class="filter-btn" data-eq-filter-action="sort" id="eq-cat-sort-btn" data-i18n="home.filter_sirala">Sırala</button>' +
            '<button type="button" class="filter-btn" data-eq-filter-action="compare" data-i18n="home.filter_karsilastir">Karşılaştır</button>' +
          '</div>' +
        '</div>' +
        '<motion class="eq-mx-active-chips" id="eq-cat-active-chips" hidden></div>' +
      '</section>' +
            (state.hideBrandStrip ? '' :
      '<section class="eq-mx-spotlight-wrap eq-mx-brands-wrap">' +
        '<div class="eq-mx-spotlight__head">' + esc(__csT('filter.brands', 'Markalarımız')) + '</motion>' +
        '<div class="eq-mx-brand-scroll" id="eq-cat-brands"></div>' +
      '</section>') +
      '<section class="eq-mx-spotlight-wrap">' +
        '<div class="eq-mx-spotlight__head">' + esc(__csT('cat.featured_models', 'Öne çıkan modeller')) + '</div>' +
        '<div class="eq-mx-spotlight__track" id="eq-cat-featured"></motion>' +
        '<button type="button" class="eq-cat-load-more eq-mx-load-more" id="eq-cat-loadmore-featured" hidden>' +
          esc(__csT('cat.load_more', 'Daha fazla ürün yükle')) +
        '</button>' +
      '</section>' +
      '<section class="eq-mx-spotlight-wrap">' +
        '<div class="eq-mx-spotlight__head">' + esc(__csT('cat.new_in', 'Yeni eklenenler')) + '</div>' +
        '<div class="eq-mx-spotlight__track" id="eq-cat-newin"></motion>' +
        '<button type="button" class="eq-cat-load-more eq-mx-load-more" id="eq-cat-loadmore-newin" hidden>' +
          esc(__csT('cat.load_more', 'Daha fazla ürün yükle')) +
        '</button>' +
      '</section>' +
      '<section class="eq-mx-spotlight-wrap eq-cat-sublist" id="eq-cat-sublist-section" hidden>' +
        '<div class="eq-mx-spotlight__head eq-cat-sublist-head">' +
          '<span id="eq-cat-sublist-title">' + esc(__csT('cat.selected_type', 'Seçili tip')) + '</span>' +
          '<button type="button" class="eq-cat-sublist-clear" id="eq-cat-sublist-clear">× ' + esc(__csT('filter.clear', 'Temizle')) + '</button>' +
        '</div>' +
        '<div class="eq-mx-spotlight__track" id="eq-cat-sublist"></motion>' +
        '<button type="button" class="eq-cat-load-more eq-mx-load-more" id="eq-cat-loadmore-sublist" hidden>' +
          esc(__csT('cat.load_more', 'Daha fazla ürün yükle')) +
        '</button>' +
      '</section>';"""

# Fix typos in legacy_inner - use exact file content
legacy_marker = "    root.classList.add('eq-cat-shell-root', 'eq-mx-vitrin', 'eq-mx-vitrin--dept');"
idx = s.find(legacy_marker)
if idx < 0:
    raise SystemExit("legacy marker not found")
end = s.find("    var clearBtn = root.querySelector('#eq-cat-sublist-clear');", idx)
legacy_block = s[idx:end]

mutbex_mount = r"""
    function mutbexSortOptionsHtml() {
      return SORT_CYCLE.map(function (opt) {
        return (
          '<option value="' +
          esc(opt.key) +
          '"' +
          (state.sortKey === opt.key ? ' selected' : '') +
          '>' +
          esc(opt.label) +
          '</option>'
        );
      }).join('');
    }

    function mutbexShellHtml() {
      return (
        mxTickerHtml() +
        '<nav class="eq-mx-breadcrumb" id="eq-cat-breadcrumb" aria-label="Breadcrumb"></nav>' +
        '<motion class="eq-cat-mobile-parent" id="eq-cat-mobile-parent" hidden></div>' +
        '<h1 class="eq-mx-cat-title eq-mx-page-title">' +
        esc(state.catLabel) +
        '</h1>' +
        (state.catDesc
          ? '<p class="eq-mx-page-desc eq-mx-page-desc--mutbex">' + esc(state.catDesc) + '</p>'
          : '') +
        '<section class="eq-mx-catalog-bar" aria-label="Ürün listesi">' +
        '<div class="eq-mx-catalog-bar__top eq-mx-catalog-bar__top--mutbex">' +
        '<div class="eq-mx-catalog-count" id="eq-cat-result-count"></div>' +
        '<div class="eq-mx-catalog-bar__tools">' +
        '<button type="button" class="filter-btn eq-mx-filter-drawer-btn" data-eq-filter-action="refine">Filtrele</button>' +
        '<label class="eq-mx-sort-label">Sırala <select id="eq-cat-sort-select" class="eq-mx-sort-select">' +
        mutbexSortOptionsHtml() +
        '</select></label>' +
        '<button type="button" class="filter-btn eq-mx-compare-btn" data-eq-filter-action="compare">Karşılaştır</button>' +
        '</div></div>' +
        '<div class="eq-mx-active-chips" id="eq-cat-active-chips" hidden></div>' +
        '</section>' +
        '<section class="eq-mx-grid-section">' +
        '<div class="eq-mx-product-grid" id="eq-cat-product-grid"></div>' +
        '<button type="button" class="eq-cat-load-more eq-mx-load-more" id="eq-cat-loadmore-grid" hidden>' +
        esc(__csT('cat.load_more', 'Daha fazla ürün yükle')) +
        '</button></section>'
      );
    }

    root.classList.add(
      'eq-cat-shell-root',
      'eq-mx-vitrin',
      state.useMutbexGrid ? 'eq-mx-vitrin--mutbex-grid' : 'eq-mx-vitrin--dept'
    );
    root.innerHTML = state.useMutbexGrid ? mutbexShellHtml() : (
      mxTickerHtml() +
      '<div class="eq-mx-hero eq-mx-hero--dept"><motion class="eq-mx-hero__stage">' +
          '<div class="eq-mx-hero__slides"></div>' +
          '<button type="button" class="eq-mx-hero__nav eq-mx-hero__nav--prev" aria-label="Önceki">‹</button>' +
          '<button type="button" class="eq-mx-hero__nav eq-mx-hero__nav--next" aria-label="Sonraki">›</button>' +
        '</div></div>' +
      '<div class="eq-cat-mobile-parent" id="eq-cat-mobile-parent" hidden></div>' +
      '<div class="eq-mx-story-wrap"><div class="eq-mx-story__track" id="eq-cat-mx-stories"></div></div>' +
      '<h1 class="eq-mx-page-title">' + esc(state.catLabel) + '</h1>' +
      (state.catDesc ? '<p class="eq-mx-page-desc">' + esc(state.catDesc) + '</p>' : '') +
      '<section class="eq-mx-catalog-bar" aria-label="Katalog araç çubuğu">' +
        '<div class="eq-mx-catalog-bar__top">' +
          '<div class="eq-mx-catalog-count" id="eq-cat-result-count"></motion>' +
          '<div class="main-filters eq-mx-main-filters">' +
            '<button type="button" class="filter-btn" data-eq-filter-action="refine" data-i18n="home.filter_filtrele">Filtrele</button>' +
            '<button type="button" class="filter-btn" data-eq-filter-action="sort" id="eq-cat-sort-btn" data-i18n="home.filter_sirala">Sırala</button>' +
            '<button type="button" class="filter-btn" data-eq-filter-action="compare" data-i18n="home.filter_karsilastir">Karşılaştır</button>' +
          '</div>' +
        '</div>' +
        '<div class="eq-mx-active-chips" id="eq-cat-active-chips" hidden></div>' +
      '</section>' +
            (state.hideBrandStrip ? '' :
      '<section class="eq-mx-spotlight-wrap eq-mx-brands-wrap">' +
        '<div class="eq-mx-spotlight__head">' + esc(__csT('filter.brands', 'Markalarımız')) + '</div>' +
        '<div class="eq-mx-brand-scroll" id="eq-cat-brands"></div>' +
      '</section>') +
      '<section class="eq-mx-spotlight-wrap">' +
        '<motion class="eq-mx-spotlight__head">' + esc(__csT('cat.featured_models', 'Öne çıkan modeller')) + '</div>' +
        '<motion class="eq-mx-spotlight__track" id="eq-cat-featured"></div>' +
        '<button type="button" class="eq-cat-load-more eq-mx-load-more" id="eq-cat-loadmore-featured" hidden>' +
          esc(__csT('cat.load_more', 'Daha fazla ürün yükle')) +
        '</button>' +
      '</section>' +
      '<section class="eq-mx-spotlight-wrap">' +
        '<div class="eq-mx-spotlight__head">' + esc(__csT('cat.new_in', 'Yeni eklenenler')) + '</div>' +
        '<div class="eq-mx-spotlight__track" id="eq-cat-newin"></div>' +
        '<button type="button" class="eq-cat-load-more eq-mx-load-more" id="eq-cat-loadmore-newin" hidden>' +
          esc(__csT('cat.load_more', 'Daha fazla ürün yükle')) +
        '</button>' +
      '</section>' +
      '<section class="eq-mx-spotlight-wrap eq-cat-sublist" id="eq-cat-sublist-section" hidden>' +
        '<div class="eq-mx-spotlight__head eq-cat-sublist-head">' +
          '<span id="eq-cat-sublist-title">' + esc(__csT('cat.selected_type', 'Seçili tip')) + '</span>' +
          '<button type="button" class="eq-cat-sublist-clear" id="eq-cat-sublist-clear">× ' + esc(__csT('filter.clear', 'Temizle')) + '</button>' +
        '</div>' +
        '<div class="eq-mx-spotlight__track" id="eq-cat-sublist"></div>' +
        '<button type="button" class="eq-cat-load-more eq-mx-load-more" id="eq-cat-loadmore-sublist" hidden>' +
          esc(__csT('cat.load_more', 'Daha fazla ürün yükle')) +
        '</button>' +
      '</section>'
    );

    var sortSelectMutbex = root.querySelector('#eq-cat-sort-select');
    if (sortSelectMutbex) {
      sortSelectMutbex.addEventListener('change', function () {
        state.sortKey = sortSelectMutbex.value || '';
        resetRailShown();
        renderAll();
      });
    }
"""

s = s[:idx] + mutbex_mount + s[end:]

# clearBtn only for legacy
s = s.replace(
    "    var clearBtn = root.querySelector('#eq-cat-sublist-clear');\n"
    "    if (clearBtn) clearBtn.addEventListener('click', function () {",
    "    var clearBtn = state.useMutbexGrid ? null : root.querySelector('#eq-cat-sublist-clear');\n"
    "    if (clearBtn) clearBtn.addEventListener('click', function () {",
)

# renderCatalogBar count
s = s.replace(
    "        countEl.textContent = n ? n + ' ürün' : 'Ürün yok';",
    "        if (state.useMutbexGrid) {\n"
    "          countEl.innerHTML = n\n"
    "            ? '<strong>' + n + '</strong> Toplam Ürün'\n"
    "            : 'Ürün yok';\n"
    "        } else {\n"
    "          countEl.textContent = n ? n + ' ürün' : 'Ürün yok';\n"
    "        }",
)

# renderAll
s = s.replace(
    "    function renderAll() {\n"
    "      renderMobileParentBar();\n"
    "      renderTiles();\n"
    "      renderBrands();\n"
    "      renderCatalogBar();\n"
    "      renderSidebarFilters();\n"
    "      renderFeatured();\n"
    "      renderNewIn();\n"
    "      renderSubList();\n"
    "    }",
    "    function renderBreadcrumb() {\n"
    "      var el = root.querySelector('#eq-cat-breadcrumb');\n"
    "      if (!el) return;\n"
    "      var home = typeof global.equstoUrl === 'function' ? global.equstoUrl('home') : '/index.html';\n"
    "      var html =\n"
    "        '<a href=\"' + esc(home) + '\">Anasayfa</a><span class=\"eq-mx-breadcrumb__sep\">›</span>';\n"
    "      if (state.activeTile) {\n"
    "        var tile = findTileById(state.tiles, state.activeTile);\n"
    "        html +=\n"
    "          '<span>' +\n"
    "          esc(state.catLabel) +\n"
    "          '</span><span class=\"eq-mx-breadcrumb__sep\">›</span><span>' +\n"
    "          esc(tile ? tile.label : state.activeTile) +\n"
    "          '</span>';\n"
    "        var h1 = root.querySelector('.eq-mx-cat-title');\n"
    "        if (h1 && tile && tile.label) h1.textContent = tile.label;\n"
    "      } else {\n"
    "        html += '<span>' + esc(state.catLabel) + '</span>';\n"
    "        var h1b = root.querySelector('.eq-mx-cat-title');\n"
    "        if (h1b) h1b.textContent = state.catLabel;\n"
    "      }\n"
    "      el.innerHTML = html;\n"
    "    }\n\n"
    "    function mutbexProductCard(u) {\n"
    "      var href = __csProductHref(u);\n"
    "      var name = truncate(displayProductName(u.n), 88);\n"
    "      var code =\n"
    "        (u.raw && (u.raw.code || u.raw.supplier_code || u.raw.sku || u.raw.tip_kodu)) ||\n"
    "        u.c ||\n"
    "        '';\n"
    "      var img = u.img\n"
    "        ? '<img src=\"' + esc(u.img) + '\" alt=\"\" loading=\"lazy\" decoding=\"async\">'\n"
    "        : '';\n"
    "      var cartAttrs =\n"
    "        global.EqustoCart && typeof global.EqustoCart.cartAddButtonAttrs === 'function'\n"
    "          ? global.EqustoCart.cartAddButtonAttrs(u)\n"
    "          : 'type=\"button\" class=\"eq-cart-add eq-mx-act eq-mx-add\" data-equsto-cart=\"1\"';\n"
    "      var wrapAttrs =\n"
    "        global.EqustoCart && typeof global.EqustoCart.cardWrapAttrs === 'function'\n"
    "          ? global.EqustoCart.cardWrapAttrs(u)\n"
    "          : '';\n"
    "      return (\n"
    "        '<article class=\"eq-mx-product-item prod-card-wrap\"' +\n"
    "        wrapAttrs +\n"
    "        '>' +\n"
    "        '<a class=\"eq-mx-product-item__media\" href=\"' +\n"
    "        esc(href) +\n"
    "        '\">' +\n"
    "        '<div class=\"eq-mx-product-item__img\">' +\n"
    "        img +\n"
    "        '</div></a>' +\n"
    "        '<motion class=\"eq-mx-product-item__body\">' +\n"
    "        '<a class=\"eq-mx-product-item__title\" href=\"' +\n"
    "        esc(href) +\n"
    "        '\">' +\n"
    "        esc(name) +\n"
    "        '</a>' +\n"
    "        (code ? '<motion class=\"eq-mx-product-item__code\">' + esc(String(code)) + '</div>' : '') +\n"
    "        (u.p ? '<div class=\"eq-mx-product-item__price\">₺' + esc(u.p) + '</motion>' : '') +\n"
    "        '</div>' +\n"
    "        '<div class=\"eq-mx-prod-actions\">' +\n"
    "        '<button ' +\n"
    "        cartAttrs +\n"
    "        '>Sepete Ekle</button></div></article>'\n"
    "      );\n"
    "    }\n\n"
    "    function renderProductGrid() {\n"
    "      var grid = root.querySelector('#eq-cat-product-grid');\n"
    "      if (!grid) return;\n"
    "      var vis = sortProductList(visibleProducts());\n"
    "      var cap = state.shownGrid || 48;\n"
    "      var slice = vis.slice(0, cap);\n"
    "      grid.innerHTML = slice.length\n"
    "        ? slice.map(mutbexProductCard).join('')\n"
    "        : '<p class=\"eq-mx-grid-empty\">Ürün bulunamadı.</p>';\n"
    "      var btn = root.querySelector('#eq-cat-loadmore-grid');\n"
    "      if (btn) {\n"
    "        if (vis.length > slice.length) btn.removeAttribute('hidden');\n"
    "        else btn.setAttribute('hidden', '');\n"
    "      }\n"
    "    }\n\n"
    "    function renderAll() {\n"
    "      renderMobileParentBar();\n"
    "      if (state.useMutbexGrid) {\n"
    "        renderBreadcrumb();\n"
    "        renderCatalogBar();\n"
    "        renderSidebarFilters();\n"
    "        renderProductGrid();\n"
    "        return;\n"
    "      }\n"
    "      renderTiles();\n"
    "      renderBrands();\n"
    "      renderCatalogBar();\n"
    "      renderSidebarFilters();\n"
    "      renderFeatured();\n"
    "      renderNewIn();\n"
    "      renderSubList();\n"
    "    }",
)

# load more grid
s = s.replace(
    "      } else if (btn.id === 'eq-cat-loadmore-sublist') {\n"
    "        state.shown.sublist += RAIL_STEP;\n"
    "        renderSubList();\n"
    "      }",
    "      } else if (btn.id === 'eq-cat-loadmore-sublist') {\n"
    "        state.shown.sublist += RAIL_STEP;\n"
    "        renderSubList();\n"
    "      } else if (btn.id === 'eq-cat-loadmore-grid') {\n"
    "        state.shownGrid = (state.shownGrid || 48) + (state.gridStep || 24);\n"
    "        renderProductGrid();\n"
    "      }",
)

# afterCatalogLoaded hero
s = s.replace(
    "      initDeptMxHero();\n"
    "      renderAll();",
    "      if (!state.useMutbexGrid) initDeptMxHero();\n"
    "      renderAll();",
)

# renderTiles skip mutbex
s = s.replace(
    "    function renderTiles() {\n"
    "      var vis = visibleProducts();",
    "    function renderTiles() {\n"
    "      if (state.useMutbexGrid) return;\n"
    "      var vis = visibleProducts();",
)

s = s.replace(
    "    function renderBrands() {\n"
    "      if (state.hideBrandStrip) return;",
    "    function renderBrands() {\n"
    "      if (state.useMutbexGrid || state.hideBrandStrip) return;",
)

p.write_text(s, encoding="utf-8")
print("patched", p)
