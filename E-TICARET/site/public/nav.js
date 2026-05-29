// Kategori: varsa <nav class="sidebar" id="eq-sidebar"> (sol sütun); #catDrawer + paintShopDrawer.
(function () {
  /** i18n yardımcısı — eq-i18n.js yoksa fallback orijinal TR metin. */
  function __navT(k, fb) {
    try {
      if (k && typeof window.eqT === "function") {
        var v = window.eqT(k, null);
        if (v != null && v !== k) return v;
      }
    } catch (_) {}
    return fb;
  }
  function __navSubLabelKey(it) {
    if (!it) return "";
    if (it.labelKey) return it.labelKey;
    if (it.tip) return "nav.sub." + String(it.tip).replace(/-/g, "_").replace(/_+$/, "");
    return "";
  }

  /** Bir NAV item'ının görünür label'ı: labelKey / tip → nav.sub.*, yoksa label. */
  function __navLabel(it) {
    if (!it) return "";
    var k = __navSubLabelKey(it);
    if (k) return __navT(k, it.label || "");
    return it.label || "";
  }

  /** Çağlayan kataloğu serileri — build ile güncellenir (caglayan-market-reyon-catalogue.json → navSubs). */
  var MARKET_REYON_SUBS = [
    { label: "NİLÜFER", href: "market-reyonlari.html?q=N%C4%B0L%C3%9CFER", search: "NİLÜFER" },
    { label: "LOTUS", href: "market-reyonlari.html?q=LOTUS", search: "LOTUS" },
    { label: "NERGIS", href: "market-reyonlari.html?q=NERGIS", search: "NERGIS" },
    { label: "LALE", href: "market-reyonlari.html?q=LALE", search: "LALE" },
    { label: "İNCİ", href: "market-reyonlari.html?q=%C4%B0NC%C4%B0", search: "İNCİ" },
    { label: "HERCAI", href: "market-reyonlari.html?q=HERCAI", search: "HERCAI" },
    { label: "REYHAN", href: "market-reyonlari.html?q=REYHAN", search: "REYHAN" },
    { label: "SARDUNYA", href: "market-reyonlari.html?q=SARDUNYA", search: "SARDUNYA" },
    { label: "GARDENYA", href: "market-reyonlari.html?q=GARDENYA", search: "GARDENYA" },
    { label: "ANEMON", href: "market-reyonlari.html?q=ANEMON", search: "ANEMON" },
    { label: "AKASYA", href: "market-reyonlari.html?q=AKASYA", search: "AKASYA" },
    { label: "BEGONVİL", href: "market-reyonlari.html?q=BEGONV%C4%B0L", search: "BEGONVİL" },
    { label: "DEFNE", href: "market-reyonlari.html?q=DEFNE", search: "DEFNE" },
    { label: "ERGUVAN", href: "market-reyonlari.html?q=ERGUVAN", search: "ERGUVAN" },
    { label: "LEYLAK", href: "market-reyonlari.html?q=LEYLAK", search: "LEYLAK" },
    { label: "MANOLYA", href: "market-reyonlari.html?q=MANOLYA", search: "MANOLYA" },
    { label: "Tüm Çağlayan kataloğu", href: "market-reyonlari.html" },
  ];

  function hydrateCaglayanNavSubs() {
    var url = "/data/caglayan-market-reyon-catalogue.json";
    try {
      if (typeof location !== "undefined" && location.protocol !== "http:" && location.protocol !== "https:") {
        url = "./data/caglayan-market-reyon-catalogue.json";
      }
    } catch (_) {}
    return fetch(url, { cache: "no-store", headers: { Accept: "application/json" } })
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .then(function (j) {
        if (!j || !j.navSubs || !j.navSubs.length) return;
        MARKET_REYON_SUBS.length = 0;
        j.navSubs.forEach(function (x) {
          MARKET_REYON_SUBS.push(x);
        });
      })
      .catch(function () {});
  }

  var NAV = [
    { id: "pfos", labelKey: "nav.pfos", label: "Proje Fabrikası", href: "pfos.html" },
    { id: "bar-design", labelKey: "nav.bar_design", label: "Bar Design", href: "/besos" },
    {
      id: "pisirme",
      labelKey: "nav.pisirme",
      label: "Pişirme Ekipmanları",
      href: "pisirme.html",
      subs: [
        /* Veride çoğunlukla "fırın" / "FIRIN"; tam "fırınlar" geçmez */
        { label: "Fırınlar", tip: "firinlar", search: "fırın|firin" },
        { label: "Endüstriyel Ocaklar", tip: "sanayi-ocaklari" },
        { label: "Izgaralar", tip: "sanayi-tipi-izgaralar" },
        { label: "Kuzineler", tip: "kuzineler" },
        { label: "Fritözler", tip: "fritozler" },
        { label: "Döner Ocakları", tip: "doner-ocaklari" },
        { label: "Tost Makineleri", tip: "tost-makineleri" },
        { label: "Piliç Çevirme", tip: "pilic-cevirme-makineleri" },
      ],
    },
    {
      id: "sogutma",
      labelKey: "nav.sogutma",
      label: "Soğutma Ekipmanları",
      href: "sogutma.html",
      subs: [
        {
          label: "Buzdolapları",
          labelKey: "nav.sub.buzdolaplari",
          subs: [
            { label: "Tezgah Tipi", tip: "tezgah-tipi-buzdolabi" },
            { label: "Make Up Dolapları", tip: "make-up-dolabi" },
            { label: "Cihazaltı", labelKey: "nav.sub.cihazalti", tip: "tezgah-tipi-buzdolabi", search: "cihazaltı|cihaz altı|tezgahalt" },
            { label: "Dik Tip", tip: "dik-tip-buzdolap" },
            { label: "Pastane Buzdolapları", labelKey: "nav.sub.pastane_buzdolaplari", search: "pastane buzdolab|pastane dolap" },
          ],
        },
        { label: "Buz Makineleri", labelKey: "nav.sub.buz_makineleri" },
        { label: "Derin Dondurucular", labelKey: "nav.sub.derin_dondurucular" },
        { label: "Soğuk Odalar", labelKey: "nav.sub.soguk_odalar" },
        { label: "Şarap Dolapları", labelKey: "nav.sub.sarap_dolaplari" },
        { label: "Market Reyonları", labelKey: "nav.sub.market_reyonlari", href: "market-reyonlari.html" },
      ],
    },
    {
      id: "kahve",
      labelKey: "nav.kahve",
      label: "Kahve Ekipmanları",
      href: "kahve.html",
      subs: [
        { label: "Espresso Makineleri", tip: "espresso-makinesi" },
        { label: "Değirmenler", tip: "kahve-degirmeni" },
        { label: "Filtre Kahve", tip: "filtre-kahve" },
        { label: "Türk Kahve", tip: "turk-kahve" },
        { label: "Barista Aksesuarları", labelKey: "nav.sub.barista_aksesuarlari", search: "barista|tamper|pitcher|süt köpürt" },
      ],
    },
    {
      id: "yikama",
      labelKey: "nav.yikama",
      label: "Yıkama Ekipmanları",
      href: "yikama.html",
      /* notlar/Sol Liste Sıralaması.docx — Bulaşık Yıkama Makineleri alt sırası */
      subs: [
        { label: "Setaltı Bulaşık Yıkama Makineleri", tip: "setalti-bulasik", search: "setaltı|set altı|tezgah altı" },
        { label: "Giyotin Tip Bulaşık Yıkama Makineleri", tip: "giyotin-bulasik", search: "giyotin" },
        { label: "Konveyörlü Bulaşık Yıkama Makineleri", tip: "konveyorlu-bulasik", search: "konveyör|konveyörlü" },
        { label: "Tırnaklı Bulaşık Yıkama Makineleri", tip: "tirnakli-bulasik", search: "tırnaklı" },
        { label: "Kazan Yıkama Makineleri", tip: "kazan-yikama", search: "kazan yıkama" },
      ],
    },
    {
      id: "hazirlik",
      labelKey: "nav.hazirlik",
      label: "Hazırlık Ekipmanları",
      href: "hazirlik.html",
      subs: [
        { label: "Mikserler", labelKey: "nav.sub.mikserler", tip: "hamur-hazirlik", search: "mikser|spiral|planet" },
        { label: "Blenderlar", labelKey: "nav.sub.blenderlar", search: "blender|robot coupe" },
        { label: "Dilimleme Makineleri", tip: "sebze-dograma", search: "dilimleme|doğrama" },
        { label: "Kıyma Makineleri", tip: "kiyma_makinesi" },
        { label: "Vakum Makineleri", tip: "vakum-makinesi" },
      ],
    },
    {
      id: "icecek",
      labelKey: "nav.icecek",
      label: "İçecek Ekipmanları",
      href: "icecek.html",
      subs: [
        { label: "Meyve Sıkacakları", tip: "portakal-sikma", search: "meyve suyu|sıkma|juice" },
        { label: "Soğuk İçecek Dispenserleri", tip: "soguk-dispenser" },
        { label: "Soda Makineleri", tip: "limonata-serbet", search: "soda|şerbet|serbet" },
        { label: "Bira Sistemleri", labelKey: "nav.sub.bira_sistemleri", search: "bira|draft|fıçı|fici" },
        { label: "Smoothie Blenderlar", tip: "bar-blender" },
      ],
    },
    {
      id: "servis",
      labelKey: "nav.servis",
      label: "Servis & Teşhir",
      href: "market-reyonlari.html",
      subs: [
        { label: "Self-Servis Hattı", labelKey: "nav.sub.self_servis_hatti", search: "self servis", href: "market-reyonlari.html?tip=self-servis" },
        { label: "Teşhir Dolapları", labelKey: "nav.sub.teshir_dolaplari", search: "teşhir|teshir", href: "market-reyonlari.html?tip=camli-dolap" },
        { label: "Market Reyonları", labelKey: "nav.sub.market_reyonlari", href: "market-reyonlari.html" },
      ],
    },
    { id: "dolap", labelKey: "nav.dolap", label: "Dolaplar", href: "dolap.html" },
    { id: "davlumbaz", labelKey: "nav.davlumbaz", label: "Davlumbazlar", href: "davlumbaz.html" },
    { id: "tasima", labelKey: "nav.tasima", label: "Taşıma Ekipmanları", href: "tasima.html" },
    { id: "araba", labelKey: "nav.araba", label: "Arabalar", href: "araba.html" },
    {
      id: "istif",
      labelKey: "nav.istif",
      label: "İstif Rafları",
      href: "istif.html",
      subs: [{ label: "CAMBRO" }, { label: "Portashelf" }],
    },
    { id: "kuvetler", labelKey: "nav.kuvetler", label: "Küvetler", href: "kuvetler.html" },
  ];

  function equstoDeptHref(href) {
    if (typeof window.equstoResolveNavHref === "function") {
      return window.equstoResolveNavHref(href);
    }
    return href;
  }

  function isPfosPage() {
    try {
      var p = String(location.pathname || "").toLowerCase();
      if (p.indexOf("/proje-fabrikasi") >= 0 || p.indexOf("/pfos") >= 0 || p.endsWith("/pfos")) return true;
      var h = String(location.href || "").toLowerCase();
      return h.indexOf("pfos.html") >= 0 || /[?&/]pfos([?#/]|$)/.test(h);
    } catch (ePf) {
      return false;
    }
  }

  /** Çekmece kategori satırı — sol ikon (Amazon TR mobil vitrin) */
  function drawerCategoryIcon(catId) {
    var m = {
      pfos: "\uD83D\uDCCB",
      "bar-design": "\uD83C\uDF78",
      besos: "\uD83C\uDF78",
      pisirme: "\uD83D\uDD25",
      sogutma: "\u2744\uFE0F",
      kahve: "\u2615",
      yikama: "\uD83E\uDDFD",
      hazirlik: "\uD83E\uDD44",
      icecek: "\uD83E\uDD64",
      servis: "\uD83C\uDF7D\uFE0F",
      tezgah: "\u25FC",
      dolap: "\uD83D\uDDC4\uFE0F",
      davlumbaz: "\uD83D\uDCA8",
      tasima: "\uD83E\uDDF0",
      araba: "\uD83D\uDED2",
      istif: "\uD83D\uDCDA",
      kuvetler: "\uD83E\uDD63",
    };
    return m[catId] || "\uD83D\uDCE6";
  }

  function drawerRowIcon(catId) {
    return el("span", { class: "eq-drawer-row-ico", "aria-hidden": "true", text: drawerCategoryIcon(catId) });
  }

  function getDrawerStoryItems() {
    var list = null;
    try {
      if (typeof window !== "undefined" && window.EqVitrinConfig && window.EqVitrinConfig.get) {
        var cfg = window.EqVitrinConfig.get();
        if (window.EqVitrinConfig.activeList && cfg.stories) list = window.EqVitrinConfig.activeList(cfg.stories);
        else if (cfg.stories) list = cfg.stories;
      }
    } catch (_) {}
    if (!list || !list.length) {
      list = [
        { label: "Pişirme", dept: "pisirme", emoji: "🍳", image: "" },
        { label: "Soğutma", dept: "sogutma", emoji: "❄️", image: "" },
        { label: "Kahve", dept: "kahve", emoji: "☕", image: "/images/home/hero-bar-cocktailstation.png" },
        { label: "Yıkama", dept: "yikama", emoji: "💧", image: "" },
        { label: "Hazırlık", dept: "hazirlik", emoji: "🔪", image: "/images/imt300/imt300-1.jpg" },
        { label: "İçecek", dept: "icecek", emoji: "🥤", image: "/images/home/hero-bar-cocktailstation.png" },
        { label: "Bar Design", go: "besos", emoji: "🍸", image: "/images/imt300/imt300-1.jpg" },
        { label: "Proje Fabrikası", go: "pfos", emoji: "📋", image: "" },
      ];
    }
    return list;
  }

  function navCatFromStoryItem(item) {
    if (!item) return null;
    var id = item.dept || (item.go === "besos" ? "bar-design" : item.go === "pfos" ? "pfos" : "");
    for (var i = 0; i < NAV.length; i++) {
      if (NAV[i].id === id) return NAV[i];
    }
    return null;
  }

  function drawerSquareImgSrc(p) {
    if (!p) return "";
    if (typeof window.eqProductImgSrc === "function") return window.eqProductImgSrc(p);
    return String(p);
  }

  /** Alt dal var mı (subs / children / items; boş dizi sayılmaz). */
  function navItemHasFlyout(it) {
    if (!it) return false;
    var branches = it.subs || it.children || it.items;
    return !!(Array.isArray(branches) && branches.length > 0);
  }

  function drawerRowChevron() {
    return el("span", { class: "eq-drawer-row-chev", text: "\u203A", "aria-hidden": "true" });
  }

  /**
   * Flyout’lu satır: sol tık = kategori/departman; sağ › = alt dal (hover masaüstü).
   * sol-liste-KILIT: metin listesi + sağ flyout korunur; kökte ikon yok.
   */
  function buildDrawerSplitRow(label, opts) {
    opts = opts || {};
    var hasFlyout = !!opts.hasFlyout;
    var rowCls =
      "eq-drawer-row eq-drawer-row--split" + (hasFlyout ? " eq-drawer-row--has-flyout" : "");
    var row = el("div", { class: rowCls });
    row.setAttribute("data-eq-cat-label", label);
    var labelEl;
    if (opts.href) {
      labelEl = el("a", {
        class: "eq-drawer-row-link",
        href: equstoDeptHref(opts.href),
      });
    } else {
      labelEl = el("button", {
        type: "button",
        class: "eq-drawer-row-link eq-drawer-row-link--btn",
      });
    }
    labelEl.appendChild(el("span", { class: "eq-drawer-row-label", text: label }));
    row.appendChild(labelEl);
    var chevBtn = null;
    if (hasFlyout) {
      chevBtn = el("button", {
        type: "button",
        class: "eq-drawer-row-chev-btn",
        "aria-label": opts.chevAria || __navT("nav.drawer_subcats", "Alt kategoriler"),
      });
      chevBtn.appendChild(drawerRowChevron());
      row.appendChild(chevBtn);
    }
    if (opts.active) row.classList.add("eq-drawer-row--active");
    return { row: row, labelEl: labelEl, chevBtn: chevBtn };
  }

  /** Kök kategori — Amazon TR: tüm satırlar aynı hizada; › yalnızca flyout varsa. */
  function buildDrawerAmazonRootRow(c, opts) {
    opts = opts || {};
    var label = __navLabel(c);
    var hasFlyout = navItemHasFlyout(c);
    var built = buildDrawerSplitRow(label, {
      hasFlyout: hasFlyout,
      href: c.href || "#",
      active: opts.active,
    });
    built.row.setAttribute("data-eq-cat-label", label);
    return built.row;
  }

  /** Mega drill sütunu satırı (kök ile aynı › kuralı). */
  function buildDrawerDrillRow(it, opts) {
    opts = opts || {};
    var label = __navLabel(it);
    if (it && it.markaHref) {
      return buildDrawerSplitRow(label, {
        hasFlyout: false,
        href: it.markaHref,
        active: opts.active,
      }).row;
    }
    if (navItemHasFlyout(it)) {
      return buildDrawerSplitRow(label, { hasFlyout: true, active: opts.active }).row;
    }
    /* Alt dal yok: split satır (› yuvası) — flyout’lu satırla aynı metin hizası */
    return buildDrawerSplitRow(label, { hasFlyout: false, active: opts.active }).row;
  }

  /** Çekmece kök — story kareleri (ana sayfa şeridi ile aynı sıra + görseller). */
  function buildMcatSquare(c, opts) {
    opts = opts || {};
    var story = opts.story || {};
    var label = __navLabel(c);
    var hasSubs = navItemHasFlyout(c);
    var tile = hasSubs
      ? el("button", { type: "button", class: "eq-mcat-square eq-drawer-row eq-drawer-row--btn" })
      : el("a", { class: "eq-mcat-square eq-drawer-row eq-drawer-row--link", href: equstoDeptHref(c.href || "#") });
    tile.setAttribute("data-eq-cat-label", label);
    var ring = el("div", { class: "eq-mcat-square__ring" });
    var imgPath = story.image ? drawerSquareImgSrc(story.image) : "";
    if (imgPath) {
      var img = document.createElement("img");
      img.src = imgPath;
      img.alt = "";
      img.loading = "lazy";
      img.setAttribute("data-eq-emoji", story.emoji || drawerCategoryIcon(c.id));
      img.onerror = function () {
        if (typeof window.__eqImgFail === "function") window.__eqImgFail(this);
      };
      ring.appendChild(img);
    } else {
      ring.appendChild(
        el("span", {
          class: "eq-mcat-square__ring-in",
          "aria-hidden": "true",
          text: story.emoji || drawerCategoryIcon(c.id),
        })
      );
    }
    tile.appendChild(ring);
    tile.appendChild(el("span", { class: "eq-mcat-square__lbl", text: label }));
    if (opts.active) tile.classList.add("eq-mcat-square--active");
    return tile;
  }

  /** kategoriler.html — kart üstü renk lekesi (logo yok) */
  function drawerCatTint(id) {
    var m = {
      pfos: "#c5a455",
      pisirme: "#c0392b",
      sogutma: "#3498db",
      kahve: "#7f4f24",
      yikama: "#5dade2",
      hazirlik: "#27ae60",
      icecek: "#16a085",
      servis: "#9b59b6",
      tezgah: "#7f8c8d",
      dolap: "#7ba3c8",
      davlumbaz: "#95a5a6",
      tasima: "#d4965b",
      araba: "#5b9b6b",
      istif: "#9b6bd4",
    };
    return m[id] || "#888888";
  }

  function drawerCatSubtitle(c) {
    if (!c) return "";
    if (c.id === "pfos") return __navT("nav.drawer_pfos_subtitle", "Mr. Equsto sana özel ekipman listesi hazırlar");
    if (!c.subs || !c.subs.length) return __navT("nav.drawer_cat_subtitle", "Kategoriye göz at");
    var parts = [];
    for (var i = 0; i < c.subs.length && parts.length < 3; i++) {
      parts.push(__navLabel(c.subs[i]));
    }
    return parts.join(" · ");
  }

  /** Çekmece «Markalarımız» — eq-filter-column.js defaultRefMarkalarSirasi ile aynı sıra */
  var DRAWER_MARKALAR_REF = [
    "Electrolux Professional",
    "Öztiryakiler",
    "CAMBRO",
    "Rational",
    "Hobart",
    "Winterhalter",
    "UNOX",
    "İnoksan",
  ];

  // Tüm sayfalarda (PFOS dahil) sol menü alt dalları sağa flyout olarak açılır.
  var SIMPLE_SIDEBAR = false;

  /** Alt satırda `search` varsa o (çoklu: a|b), yoksa görünen etiket aramaya gider. */
  function navSubSearchQuery(it) {
    if (it && it.search !== undefined && it.search !== null) return it.search;
    return it.label;
  }

  function navDrawerDeptId(frame) {
    if (frame && frame.catId) return frame.catId;
    for (var si = 0; si < __eqDrawerStack.length; si++) {
      if (__eqDrawerStack[si] && __eqDrawerStack[si].catId) return __eqDrawerStack[si].catId;
    }
    return currentMainId();
  }

  function navGoSubItem(deptId, it) {
    if (!it) return false;
    if (it.href) {
      window.location.href = equstoDeptHref(it.href);
      return true;
    }
    if (deptId && window.EqDeptTips) {
      var tip = it.tip || window.EqDeptTips.resolveTipId(deptId, it.label);
      if (tip) {
        window.location.href = equstoDeptHref(window.EqDeptTips.deptPageHref(deptId, tip));
        return true;
      }
    }
    if (typeof window.searchFilter === "function") {
      window.searchFilter(navSubSearchQuery(it));
      return true;
    }
    return false;
  }

  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === undefined || v === null) return;
        if (k === "class") n.className = v;
        else if (k === "text") n.textContent = v;
        else n.setAttribute(k, v);
      });
    }
    (children || []).forEach(function (c) {
      if (typeof c === "string") n.appendChild(document.createTextNode(c));
      else if (c) n.appendChild(c);
    });
    return n;
  }

  /** Amazon tarzı çekmece: alt panellere gömülü gezinme yığını */
  var __eqDrawerStack = [];
  var __eqDrawerHoverTimer = null;

  function __eqDrawerStackSig() {
    return __eqDrawerStack
      .map(function (f) {
        return (f && f.title ? f.title : "") + ":" + (f && typeof f.__top === "number" ? f.__top : 0);
      })
      .join("|");
  }

  function __eqSyncDrawerRootActive(activeLabel) {
    var root = document.querySelector("#eq-drawer-mega-row .eq-drawer-column--root");
    if (!root) return;
    root.querySelectorAll("[data-eq-cat-label]").forEach(function (node) {
      var row =
        node.classList &&
        (node.classList.contains("eq-drawer-row") || node.classList.contains("eq-drawer-row--split"))
          ? node
          : node.closest(".eq-drawer-row, .eq-drawer-row--split, a.eq-drawer-row--link");
      if (!row) return;
      var lbl = node.getAttribute("data-eq-cat-label");
      if (activeLabel && lbl === activeLabel) row.classList.add("eq-drawer-row--active");
      else row.classList.remove("eq-drawer-row--active");
    });
  }

  function __eqClearMegaDrillColumns(megaRow) {
    if (!megaRow) return;
    megaRow.querySelectorAll(".eq-drawer-column--mega:not(.eq-drawer-column--root)").forEach(function (n) {
      n.remove();
    });
  }

  /** Flyout sütunlarını kapat (stack > targetLen). */
  function __eqDrawerCollapseStack(targetLen) {
    var n = typeof targetLen === "number" && targetLen >= 0 ? targetLen : 0;
    if (__eqDrawerStack.length <= n) return;
    __eqDrawerStack.length = n;
    paintShopDrawer();
  }

  /** Masaüstü hover: tam paintShopDrawer yerine kısa gecikme (hızlı gezinmede kasma önlenir). */
  function __eqDrawerBindHover(node, fn) {
    if (!node || typeof fn !== "function") return;
    node.addEventListener("mouseenter", function () {
      if (__eqIsMobileNav()) return;
      clearTimeout(__eqDrawerHoverTimer);
      __eqDrawerHoverTimer = setTimeout(fn, 48);
    });
  }

  /** Hover: alt dal açıkken başka satıra gelince flyout’u kapat (dallı olmayan / yaprak satır). */
  function __eqDrawerBindHoverCollapse(node, targetLen) {
    if (!node) return;
    node.addEventListener("mouseenter", function () {
      if (__eqIsMobileNav()) return;
      clearTimeout(__eqDrawerHoverTimer);
      __eqDrawerCollapseStack(typeof targetLen === "number" ? targetLen : 0);
    });
  }

  function __eqIsMobileNav() {
    try {
      return window.matchMedia("(max-width: 768px)").matches;
    } catch (eM) {
      return false;
    }
  }

  function __eqSyncDrawerHdr() {
    var drawer = document.getElementById("catDrawer");
    if (!drawer) return;
    var titleEl = drawer.querySelector(".eq-mcat-hdr-title");
    if (!titleEl) return;
    var depth = __eqDrawerStack.length;
    if (__eqIsMobileNav() && depth > 0) {
      var fr = __eqDrawerStack[depth - 1];
      titleEl.textContent = (fr && fr.title) || __navT("nav.drawer_title_categories", "Kategoriler");
    } else {
      titleEl.textContent = __navT("nav.drawer_title_categories", "Kategoriler");
    }
  }

  function __eqDrawerHdrBack() {
    if (__eqIsMobileNav() && __eqDrawerStack.length > 0) {
      __eqDrawerStack.pop();
      paintShopDrawer();
      return;
    }
    if (typeof window.__eqToggleDrawer === "function") window.__eqToggleDrawer(false);
    else if (typeof window.closeCatPicker === "function") window.closeCatPicker();
  }

  function __eqDrawerGreetingLine() {
    var nm = "";
    try {
      var j = localStorage.getItem("equsto_member_v1");
      if (j) {
        var o = JSON.parse(j);
        if (o && o.active === true) nm = String(o.name || o.displayName || o.email || "").trim();
      }
    } catch (e0) {}
    if (!nm) return "";
    if (nm.indexOf("@") >= 0) nm = nm.split("@")[0];
    return nm;
  }

  function __eqCloseDrawerIfOpen() {
    if (typeof window.closeCatPicker === "function") window.closeCatPicker();
    else __eqToggleDrawer(false);
  }

  function __eqMcatDrawerWireSearch() {
    var drawer = document.getElementById("catDrawer");
    if (!drawer || drawer.__eqMcatSearchWired) return;
    drawer.__eqMcatSearchWired = true;
    drawer.addEventListener("input", function (ev) {
      var t = ev.target;
      if (!t || t.id !== "eq-mcat-drawer-search") return;
      var q = String(t.value || "")
        .trim()
        .toLowerCase();
      drawer.querySelectorAll(".eq-mcat-list [data-eq-cat-label]").forEach(function (card) {
        var lab = (card.getAttribute("data-eq-cat-label") || "").toLowerCase();
        card.style.display = !q || lab.indexOf(q) >= 0 ? "" : "none";
      });
    });
    drawer.addEventListener("keydown", function (ev) {
      if (ev.key !== "Enter" || !ev.target || ev.target.id !== "eq-mcat-drawer-search") return;
      var v = String(ev.target.value || "").trim();
      if (!v) return;
      ev.preventDefault();
      try {
        var base = typeof window.equstoUrl === "function" ? window.equstoUrl("shop") : "index.html";
        var sep = base.indexOf("?") >= 0 ? "&" : "?";
        window.location.href = base + sep + "q=" + encodeURIComponent(v);
      } catch (eQ) {
        window.location.href = "index.html?q=" + encodeURIComponent(v);
      }
    });
  }

  /** «Markalarımız» .eq-filter-sec DOM’da kalsın (#eq-filter-brands); kök listede yinelenmesin — gizli tutucu. */
  function ensureMarkalarSecHostInInner(inner) {
    if (!inner || inner.querySelector("#eq-drawer-markalar-sec-host")) return;
    inner.appendChild(
      el("div", {
        id: "eq-drawer-markalar-sec-host",
        class: "eq-drawer-markalar-sec-host",
        "aria-hidden": "true",
      })
    );
  }

  function ensureDrawerShell() {
    var drawer = document.getElementById("catDrawer");
    if (!drawer) return;
    if (drawer.querySelector(".eq-mcat-drawer-inner")) return;
    drawer.innerHTML = "";
    drawer.classList.add("eq-drawer-amazon-shell", "eq-mcat-drawer");
    drawer.setAttribute("role", "dialog");
    drawer.setAttribute("aria-modal", "true");
    drawer.setAttribute("aria-label", __navT("nav.drawer_aria_categories", "Kategoriler"));

    var inner = el("div", { class: "eq-mcat-drawer-inner" });
    var hdr = el("header", { class: "eq-mcat-hdr" });
    var bar = el("div", { class: "eq-mcat-hdr-bar" });
    var title = el("div", { class: "eq-mcat-hdr-title", text: __navT("nav.drawer_title_categories", "Kategoriler") });
    var btnTheme = el("button", {
      type: "button",
      class: "eq-mcat-hdr-theme",
      "aria-label": __navT("nav.drawer_theme", "Tema"),
      title: __navT("nav.drawer_theme_title", "Sistem · Açık · Koyu"),
      text: "\u25D0",
    });
    btnTheme.addEventListener("click", function () {
      if (typeof window.equstoCycleTheme === "function") window.equstoCycleTheme();
    });
    bar.appendChild(title);
    bar.appendChild(btnTheme);

    var search = el("div", { class: "eq-mcat-search" });
    var __searchPh = __navT("nav.drawer_search_placeholder", "Equsto'da ara — ürün, marka, kategori\u2026").replace(/"/g, "&quot;");
    var __searchAria = __navT("common.search_aria", "Ara").replace(/"/g, "&quot;");
    var __camAria = __navT("nav.drawer_search_camera", "Görsel ile ara").replace(/"/g, "&quot;");
    search.innerHTML =
      '<svg class="eq-mcat-search-icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="m20.5 20.5-3.7-3.7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
      '<input id="eq-mcat-drawer-search" class="eq-mcat-search-input" type="search" placeholder="' + __searchPh + '" autocomplete="off" aria-label="' + __searchAria + '" />' +
      '<button type="button" class="eq-mcat-search-cam" aria-label="' + __camAria + '">' +
      '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M3 7h3l2-3h8l2 3h3v13H3z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="12" cy="13" r="4" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>' +
      "</button>";
    var camBtn = search.querySelector(".eq-mcat-search-cam");
    if (camBtn) {
      camBtn.addEventListener("click", function () {
        var h = document.querySelector("header.hdr .eq-srch-photo-btn");
        if (h) h.click();
      });
    }

    hdr.appendChild(bar);
    hdr.appendChild(search);

    var scroll = el("div", { class: "eq-drawer-scroll eq-mcat-scroll" });
    var stage = el("div", {
      id: "eq-drawer-slide-stage",
      class: "eq-drawer-slide-stage eq-drawer-scroll-inner eq-mcat-stage",
    });
    var megaRow = el("div", { id: "eq-drawer-mega-row", class: "eq-drawer-mega-row" });
    stage.appendChild(megaRow);
    scroll.appendChild(stage);
    inner.appendChild(hdr);
    inner.appendChild(scroll);
    ensureMarkalarSecHostInInner(inner);
    drawer.appendChild(inner);
    __eqMcatDrawerWireSearch();
  }

  /** Markalar çekmece drill’inde kullanılacak yedek isim listesi (sayfada #eq-filter-brands yoksa). */
  function __eqDrawerFallbackMarkalarList() {
    var w = typeof window !== "undefined" ? window : {};
    if (w.__EQUSTO_REF_MARKALAR_SIRASI && Array.isArray(w.__EQUSTO_REF_MARKALAR_SIRASI) && w.__EQUSTO_REF_MARKALAR_SIRASI.length) {
      return w.__EQUSTO_REF_MARKALAR_SIRASI.slice();
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

  function paintShopDrawer() {
    ensureDrawerShell();
    var drawerInner = document.getElementById("catDrawer") && document.getElementById("catDrawer").querySelector(".eq-mcat-drawer-inner");
    ensureMarkalarSecHostInInner(drawerInner);

    var megaRow = document.getElementById("eq-drawer-mega-row");
    if (!megaRow) {
      moveMarkalarIntoCatDrawer();
      return;
    }
    var brandsHost0 = document.getElementById("eq-filter-brands");
    var markalarSec0 = brandsHost0 && brandsHost0.closest ? brandsHost0.closest(".eq-filter-sec") : null;

    var markalarStackTitle = __navT("filter.brands", "Markalarımız");
    __eqDrawerStack = __eqDrawerStack.filter(function (fr) {
      return !fr || fr.title !== markalarStackTitle;
    });

    var stackSig = __eqDrawerStackSig();
    var rootCol = megaRow.querySelector(".eq-drawer-column--root");
    var rebuildRoot = !rootCol;
    if (!rebuildRoot && megaRow.getAttribute("data-eq-stack-sig") === stackSig) {
      __eqSyncDrawerHdr();
      return;
    }

    function closeAfterNav() {
      if (typeof window.__eqToggleDrawer === "function") window.__eqToggleDrawer(false);
      else if (typeof window.closeCatPicker === "function") window.closeCatPicker();
    }

    var rootHl = __eqDrawerStack.length ? __eqDrawerStack[0].title : null;

    function fillMegaRootColumn(colEl) {
      var body = el("div", { class: "eq-drawer-column-body eq-mcat-column-body" });
      var ul = el("ul", { class: "eq-mcat-list eq-mcat-list--amazon" });
      NAV.forEach(function (c) {
        var li = el("li", { class: "eq-mcat-row-li eq-mcat-row-li--amazon" });
        var lbl = __navLabel(c);
        var rowWrap = buildDrawerAmazonRootRow(c, { active: rootHl === lbl });
        var labelLink = rowWrap.querySelector(".eq-drawer-row-link");
        var chevBtn = rowWrap.querySelector(".eq-drawer-row-chev-btn");
        if (navItemHasFlyout(c)) {
          function openCRoot() {
            if (__eqDrawerStack.length === 1 && __eqDrawerStack[0].title === lbl) return;
            __eqDrawerStack.length = 0;
            __eqDrawerStack.push({
              title: lbl,
              items: c.subs,
              deptHref: c.href || null,
              catId: c.id || null,
              __top: __eqMeasureDrillTop(rowWrap),
            });
            paintShopDrawer();
          }
          if (chevBtn) {
            chevBtn.addEventListener("click", function (ev) {
              if (ev) {
                ev.preventDefault();
                ev.stopPropagation();
              }
              openCRoot();
            });
          }
          rowWrap.addEventListener("mouseenter", function () {
            if (__eqIsMobileNav()) return;
            clearTimeout(__eqDrawerHoverTimer);
            if (__eqDrawerStack.length && __eqDrawerStack[0].title !== lbl) {
              __eqDrawerCollapseStack(0);
            }
            __eqDrawerHoverTimer = setTimeout(openCRoot, 48);
          });
        } else {
          __eqDrawerBindHoverCollapse(rowWrap, 0);
        }
        if (labelLink) {
          labelLink.addEventListener("click", function () {
            closeAfterNav();
          });
          /* Orta tuş: sayfa kaydırma (eq-link-scroll.js) — yeni sekme açma */
        }
        li.appendChild(rowWrap);
        ul.appendChild(li);
      });
      var markLabel = __navT("filter.brands", "Markalarımız");
      function collectMarkalarDrawerItems() {
        try {
          var bh = document.getElementById("eq-filter-brands");
          if (!bh && markalarSec0) bh = markalarSec0.querySelector("#eq-filter-brands");
          if (bh) {
            var out = [];
            bh.querySelectorAll("a[href]").forEach(function (a) {
              var t = (a.textContent || "").trim();
              if (!t) return;
              var href = (a.getAttribute("href") || "").trim();
              if (!href) href = typeof window.eqBrandHref === "function" ? window.eqBrandHref(t) : "/shop/marka/" + encodeURIComponent(t);
              out.push({ label: t, markaHref: href });
            });
            if (out.length) return out;
          }
        } catch (eMk) {}
        return __eqDrawerFallbackMarkalarList()
          .map(function (name) {
            var s = String(name || "").trim();
            if (!s) return null;
            return {
              label: s,
              markaHref: typeof window.eqBrandHref === "function" ? window.eqBrandHref(s) : "/shop/marka/" + encodeURIComponent(s),
            };
          })
          .filter(Boolean);
      }
      /* «Markalarımız» başlığı + marka satırları — daima açık, accordion yok */
      var liMkHdr = el("li", { class: "eq-mcat-row-li eq-mcat-row-li--markalar-hdr" });
      var hdrSpan = el("div", { class: "eq-drawer-row eq-drawer-markalar-hdr" });
      hdrSpan.appendChild(
        el("span", { class: "eq-drawer-row-label eq-drawer-row-label--markalar", "data-i18n": "filter.brands", text: markLabel })
      );
      liMkHdr.appendChild(hdrSpan);
      ul.appendChild(liMkHdr);
      collectMarkalarDrawerItems().forEach(function (it) {
        if (!it || !it.markaHref) return;
        var liB = el("li", { class: "eq-mcat-row-li eq-mcat-row-li--markalar" });
        var la = el("a", {
          class: "eq-drawer-row eq-drawer-row--link eq-drawer-row--markalar-inline",
          href: it.markaHref,
        });
        la.appendChild(el("span", { class: "eq-drawer-row-label", text: it.label }));
        la.addEventListener("click", function () { closeAfterNav(); });
        __eqDrawerBindHoverCollapse(la, 0);
        liB.appendChild(la);
        ul.appendChild(liB);
      });
      body.appendChild(ul);
      colEl.appendChild(body);
    }

    /** frame = stack[fi]; highlightChildLabel = stack[fi+1].title (varsa). */
    function appendMegaDrillColumn(rowEl, frame, fi, highlightChildLabel) {
      var col = el("div", { class: "eq-drawer-column eq-drawer-column--mega" });
      if (__eqIsMobileNav()) {
        col.classList.add("eq-drawer-column--mobile-panel");
      } else {
        col.style.left = "calc(100% + " + fi * 240 + "px)";
        var drillTop = typeof frame.__top === "number" && frame.__top > 0 ? frame.__top : 0;
        col.style.top = drillTop + "px";
        col.style.setProperty("--eq-drill-top", drillTop + "px");
      }

      var body = el("div", { class: "eq-drawer-column-body" });

      if (__eqIsMobileNav()) {
        var parentTitle =
          fi > 0 && __eqDrawerStack[fi - 1]
            ? __eqDrawerStack[fi - 1].title
            : __navT("nav.drawer_title_categories", "Kategoriler");
        var megaHdr = el("div", { class: "eq-drawer-megahdr" });
        var megaBack = el("button", {
          type: "button",
          class: "eq-drawer-megahdr-back",
          "aria-label": __navT("common.back", "Geri"),
        });
        megaBack.textContent = "\u2039";
        megaBack.addEventListener("click", function () {
          if (fi > 0) __eqDrawerStack.length = fi;
          else __eqDrawerStack.length = 0;
          paintShopDrawer();
        });
        megaHdr.appendChild(megaBack);
        megaHdr.appendChild(el("span", { class: "eq-drawer-megahdr-title", text: parentTitle }));
        body.appendChild(megaHdr);
      }

      (frame.items || []).forEach(function (it) {
        var rowIt = buildDrawerDrillRow(it, {
          active: highlightChildLabel && __navLabel(it) === highlightChildLabel,
        });
        if (navItemHasFlyout(it)) {
          var drillLabel = rowIt.querySelector(".eq-drawer-row-link");
          var drillChev = rowIt.querySelector(".eq-drawer-row-chev-btn");
          function openDrillIt() {
            var next = fi + 1;
            if (__eqDrawerStack.length === next + 1 && __eqDrawerStack[next] && __eqDrawerStack[next].title === __navLabel(it)) return;
            __eqDrawerStack.length = next;
            __eqDrawerStack.push({
              title: __navLabel(it),
              items: it.subs || it.children || it.items,
              deptHref: frame.deptHref || null,
              catId: frame.catId || null,
              __top: __eqMeasureDrillTop(rowIt),
            });
            paintShopDrawer();
          }
          function goDrillLabel() {
            var deptId = navDrawerDeptId(frame);
            if (navGoSubItem(deptId, it)) {
              __eqCloseDrawerIfOpen();
              return;
            }
            if (frame.deptHref) {
              window.location.href = equstoDeptHref(frame.deptHref);
              closeAfterNav();
            }
          }
          if (drillLabel) drillLabel.addEventListener("click", goDrillLabel);
          if (drillChev) {
            drillChev.addEventListener("click", function (ev) {
              if (ev) {
                ev.preventDefault();
                ev.stopPropagation();
              }
              openDrillIt();
            });
          }
          rowIt.addEventListener("mouseenter", function () {
            if (__eqIsMobileNav()) return;
            clearTimeout(__eqDrawerHoverTimer);
            var next = fi + 1;
            if (
              __eqDrawerStack.length > next &&
              (!__eqDrawerStack[next] || __eqDrawerStack[next].title !== __navLabel(it))
            ) {
              __eqDrawerCollapseStack(next);
            }
            __eqDrawerHoverTimer = setTimeout(openDrillIt, 48);
          });
        } else {
          __eqDrawerBindHoverCollapse(rowIt, fi + 1);
        }
        if (it.markaHref) {
          rowIt.addEventListener("click", function () {
            closeAfterNav();
          });
        } else {
          rowIt.addEventListener("click", function () {
            var deptId = navDrawerDeptId(frame);
            if (navGoSubItem(deptId, it)) {
              __eqCloseDrawerIfOpen();
            }
          });
        }
        body.appendChild(rowIt);
      });

      col.appendChild(body);
      rowEl.appendChild(col);
    }

    if (rebuildRoot) {
      if (markalarSec0 && markalarSec0.parentNode) markalarSec0.parentNode.removeChild(markalarSec0);
      megaRow.innerHTML = "";
      var col0 = el("div", { class: "eq-drawer-column eq-drawer-column--mega eq-drawer-column--root" });
      fillMegaRootColumn(col0);
      megaRow.appendChild(col0);
    } else {
      __eqClearMegaDrillColumns(megaRow);
      __eqSyncDrawerRootActive(__eqDrawerStack.length ? __eqDrawerStack[0].title : null);
    }
    megaRow.setAttribute("data-eq-stack-sig", stackSig);

    if (__eqIsMobileNav() && __eqDrawerStack.length) {
      megaRow.classList.remove("eq-drawer-mega-row--at-root");
      var mfi = __eqDrawerStack.length - 1;
      var mfr = __eqDrawerStack[mfi];
      appendMegaDrillColumn(megaRow, mfr, mfi, null);
    } else {
      megaRow.classList.add("eq-drawer-mega-row--at-root");
      var fi;
      for (fi = 0; fi < __eqDrawerStack.length; fi++) {
        var fr = __eqDrawerStack[fi];
        var hl = fi + 1 < __eqDrawerStack.length ? __eqDrawerStack[fi + 1].title : null;
        appendMegaDrillColumn(megaRow, fr, fi, hl);
      }
    }

    __eqSyncDrawerHdr();
    if (rebuildRoot) moveMarkalarIntoCatDrawer();
  }

  function currentMainId() {
    var raw = "";
    try {
      raw = (location.pathname || "").split("/").pop() || "";
      if (!raw && location.href) {
        var u = String(location.href).split("#")[0].split("?")[0];
        raw = u.split("/").pop() || "";
      }
      raw = decodeURIComponent(raw).toLowerCase();
    } catch (e) {
      raw = "";
    }
    try {
      var pn = String(location.pathname || "").toLowerCase();
      if (pn.indexOf("proje-fabrikasi") >= 0 || pn.indexOf("/pfos") >= 0 || pn.endsWith("/pfos")) return "pfos";
    } catch (_) {}
    if (raw === "pisirme" || raw === "pisirme.html") return "pisirme";
    if (raw === "sogutma" || raw === "sogutma.html") return "sogutma";
    if (raw === "market-reyonlari" || raw === "market-reyonlari.html") return "sogutma";
    if (raw === "kahve" || raw === "kahve.html") return "kahve";
    if (raw === "yikama" || raw === "yikama.html") return "yikama";
    if (raw === "hazirlik" || raw === "hazirlik.html") return "hazirlik";
    if (raw === "icecek" || raw === "icecek.html") return "icecek";
    if (raw === "besos" || raw === "bar-design.html") return "bar-design";
    if (raw === "pfos" || raw === "pfos.html") return "pfos";
    if (raw === "index.html" && location.hash) return location.hash.replace("#", "");
    return "";
  }

  /** Drill sütun açılırken üst kenarı tetikleyen satırın üstüyle hizala (mega-row göreli). */
  function __eqMeasureDrillTop(srcEl) {
    try {
      var row = document.getElementById("eq-drawer-mega-row");
      if (!srcEl || !row) return 0;
      var s = srcEl.getBoundingClientRect();
      var r = row.getBoundingClientRect();
      return Math.max(0, Math.round(s.top - r.top));
    } catch (e) {
      return 0;
    }
  }

  /** İç flyout’u dış panelin üstüyle hizala (top:0 satıra yapışır; satır aşağıdaysa iç pencere aşağı kayar). */
  function __eqAlignNestedFlyout(wrap) {
    try {
      var nestedList = wrap.querySelector(":scope > .sb-sublist");
      if (!nestedList) return;
      var parentList = wrap.closest(".sb-sublist");
      if (!parentList || nestedList === parentList) return;
      var wrapTop = wrap.getBoundingClientRect().top;
      var listTop = parentList.getBoundingClientRect().top;
      nestedList.style.top = listTop - wrapTop + "px";
    } catch (e0) {}
  }

  function __eqClearNestedFlyoutAlign(wrap) {
    try {
      var nestedList = wrap.querySelector(":scope > .sb-sublist");
      if (nestedList) nestedList.style.top = "";
    } catch (e1) {}
  }

  function renderSubList(items, depth) {
    var ul = el("div", { class: "sb-sublist depth-" + depth });
    items.forEach(function (it) {
      var wrap = el("div", { class: "sb-subwrap" });
      var row = el("div", { class: "sb-subitem" + (it.subs ? " has-children" : ""), role: "button", tabindex: "0", text: __navLabel(it) });
      var arrow = it.subs ? el("span", { class: "sb-subarrow", text: "\u203A", "aria-hidden": "true" }) : null;
      if (arrow) row.appendChild(arrow);

      function onSubWrapEnter() {
        try {
          var parent = wrap.parentElement;
          if (parent)
            parent.querySelectorAll(":scope > .sb-subwrap.open").forEach(function (n) {
              if (n !== wrap) {
                __eqClearNestedFlyoutAlign(n);
                n.classList.remove("open");
              }
            });
        } catch (_) {}
        if (it.subs && it.subs.length) {
          wrap.classList.add("open");
          requestAnimationFrame(function () {
            __eqAlignNestedFlyout(wrap);
          });
        }
      }
      row.addEventListener("mouseenter", onSubWrapEnter);
      if (it.subs && it.subs.length) wrap.addEventListener("mouseenter", onSubWrapEnter);
      wrap.addEventListener("mouseleave", function (e) {
        var rel = e.relatedTarget;
        if (rel && wrap.contains(rel)) return;
        __eqClearNestedFlyoutAlign(wrap);
        wrap.classList.remove("open");
      });
      row.addEventListener("click", function () {
        var deptId = currentMainId();
        if (navGoSubItem(deptId, it)) return;
      });
      wrap.appendChild(row);
      if (it.subs && it.subs.length) wrap.appendChild(renderSubList(it.subs, depth + 1));
      ul.appendChild(wrap);
    });
    return ul;
  }

  function render() {
    var root = document.getElementById("eq-sidebar");
    if (!root) return;
    var inVitrinFilterCol =
      document.body &&
      document.body.classList.contains("eq-shop") &&
      !document.body.classList.contains("admin-app") &&
      !document.body.classList.contains("bd-page") &&
      root.parentNode &&
      root.parentNode.id === "eq-filter-col";
    if (inVitrinFilterCol) {
      root.innerHTML = "";
      root.setAttribute("aria-hidden", "true");
      return;
    }
    root.removeAttribute("aria-hidden");
    root.innerHTML = "";

    var active = currentMainId();
    function isPfosPage() {
      try {
        var p = String(location.pathname || "").toLowerCase();
        if (p.indexOf("/proje-fabrikasi") >= 0 || p.indexOf("/pfos") >= 0 || p.endsWith("/pfos")) return true;
        var h = String(location.href || "").toLowerCase();
        return h.indexOf("pfos.html") >= 0 || /[?&/]pfos([?#/]|$)/.test(h);
      } catch (ePf) {
        return false;
      }
    }

    NAV.forEach(function (c) {
      if (c.id === "pfos" && !isPfosPage()) return;
      var hdr = el("div", {
        class:
          "sb-cat-hdr" +
          (active === c.id ? " active" : "") +
          (!SIMPLE_SIDEBAR && c.subs ? " has-children" : ""),
        "data-id": c.id,
      });
      if (c.href) {
        var catLink = el("a", { class: "sb-cat-catlink", href: equstoDeptHref(c.href) });
        catLink.appendChild(el("span", { class: "sb-cat-label", text: __navLabel(c) }));
        hdr.appendChild(catLink);
      } else {
        hdr.appendChild(el("span", { class: "sb-cat-label", text: __navLabel(c) }));
      }
      var toggle = !SIMPLE_SIDEBAR && c.subs ? el("span", { class: "sb-cat-toggle", text: "\u203A", "aria-hidden": "true" }) : null;
      if (toggle) hdr.appendChild(toggle);

      var cat = el("div", { class: "sb-cat", id: "cat-" + c.id }, [hdr]);
      if (!SIMPLE_SIDEBAR && c.subs && c.subs.length) {
        cat.appendChild(renderSubList(c.subs, 1));
        if (active === c.id) cat.classList.add("open");
      }
      if (!SIMPLE_SIDEBAR) {
        cat.addEventListener("mouseenter", function () {
          try {
            root.querySelectorAll(".sb-cat.open").forEach(function (n) {
              if (n !== cat) n.classList.remove("open");
            });
          } catch (_) {}
          if (c.subs && c.subs.length) cat.classList.add("open");
        });
        cat.addEventListener("mouseleave", function (e) {
          var rel = e.relatedTarget;
          if (rel && cat.contains(rel)) return;
          cat.classList.remove("open");
          cat.querySelectorAll(".sb-subwrap.open").forEach(function (n) {
            __eqClearNestedFlyoutAlign(n);
            n.classList.remove("open");
          });
        });
      }
      root.appendChild(cat);
    });
  }

  /** Aside’ta doğrudan .eq-filter-sec kalmadıysa (Markalar çekmecede) boş sütunu gizlemek için body sınıfı — :has() desteklemeyen tarayıcılar. */
  function syncEqFilterAsideEmptyClass() {
    try {
      var aside = document.getElementById("eq-filter-col");
      var body = document.body;
      if (!body || !body.classList.contains("eq-shop") || body.classList.contains("admin-app") || body.classList.contains("bd-page")) {
        body && body.classList.remove("eq-filter-aside-empty");
        return;
      }
      if (!aside) {
        body.classList.remove("eq-filter-aside-empty");
        return;
      }
      var hasDirectSec = false;
      for (var c = aside.firstElementChild; c; c = c.nextElementSibling) {
        if (c.classList && c.classList.contains("eq-filter-sec")) {
          hasDirectSec = true;
          break;
        }
      }
      body.classList.toggle("eq-filter-aside-empty", !hasDirectSec);
    } catch (_) {}
  }
  window.__eqSyncFilterAsideEmptyClass = syncEqFilterAsideEmptyClass;

  /** «Markalarımız» + #eq-filter-brands: gizli çekmece tutucusunda (kök listede ayrı satır + drill). */
  function moveMarkalarIntoCatDrawer() {
    var brandsHost = document.getElementById("eq-filter-brands");
    if (!brandsHost) {
      syncEqFilterAsideEmptyClass();
      return;
    }
    var sec = brandsHost.closest ? brandsHost.closest(".eq-filter-sec") : null;
    if (!sec) {
      syncEqFilterAsideEmptyClass();
      return;
    }
    var host = document.getElementById("eq-drawer-markalar-sec-host");
    if (host) {
      if (sec.parentNode === host) {
        syncEqFilterAsideEmptyClass();
        return;
      }
      host.appendChild(sec);
      syncEqFilterAsideEmptyClass();
      return;
    }
    var rootBody = document.querySelector("#eq-drawer-mega-row .eq-drawer-column--root .eq-mcat-column-body");
    var rootUl = rootBody && rootBody.querySelector("ul.eq-mcat-list");
    if (rootBody && rootUl) {
      if (sec.parentNode === rootBody && sec.previousElementSibling === rootUl) {
        syncEqFilterAsideEmptyClass();
        return;
      }
      rootBody.insertBefore(sec, rootUl.nextSibling);
      syncEqFilterAsideEmptyClass();
      return;
    }
    var inner = document.getElementById("catDrawer") && document.getElementById("catDrawer").querySelector(".eq-mcat-drawer-inner");
    if (!inner) {
      syncEqFilterAsideEmptyClass();
      return;
    }
    if (sec.parentNode === inner) {
      syncEqFilterAsideEmptyClass();
      return;
    }
    inner.appendChild(sec);
    syncEqFilterAsideEmptyClass();
  }

  window.__eqRelocateMarkalarInDrawer = moveMarkalarIntoCatDrawer;

  var __eqMobileChromeSelectors =
    "header.hdr a.logo, header.hdr .srch-cat, header.hdr .cat-picker, header.hdr .cat-picker-btn, nav.topnav, header + nav.topnav, #eq-home-catband";

  /** PC: mobil inline gizlemeleri kaldır (dar pencereden genişletince kategoriler geri gelsin). */
  function eqClearDesktopChrome() {
    try {
      if (window.matchMedia("(max-width: 768px)").matches) return;
      var b = document.body;
      if (!b || b.classList.contains("admin-app")) return;
      document.querySelectorAll(__eqMobileChromeSelectors).forEach(function (el) {
        el.style.removeProperty("display");
        el.style.removeProperty("visibility");
        el.style.removeProperty("pointer-events");
        el.style.removeProperty("width");
        el.style.removeProperty("height");
        el.style.removeProperty("overflow");
      });
      if (typeof window.EQUSTO_LOGO_REFRESH === "function") window.EQUSTO_LOGO_REFRESH();
    } catch (e) {}
  }

  /** Mobil: yüzen kedi FAB kaldırılır; WhatsApp alt şeritte (contact.js → eq-bnav-wa-slot). */
  function eqEnforceMobileChrome() {
    try {
      if (!window.matchMedia("(max-width: 768px)").matches) return;
      var b = document.body;
      if (!b || b.classList.contains("admin-app")) return;
      if (!b.classList.contains("eq-shop") || b.classList.contains("bd-page") || b.classList.contains("eq-pfos")) return;
      if (typeof window.equstoMountContactFabInTabbar === "function") {
        window.equstoMountContactFabInTabbar();
      }
      var fab = document.getElementById("equsto-contact-fab");
      if (fab) fab.remove();
    } catch (e) {}
  }

  function eqSyncMobileChrome() {
    if (window.matchMedia("(max-width: 768px)").matches) eqEnforceMobileChrome();
    else eqClearDesktopChrome();
  }
  window.eqEnforceMobileChrome = eqEnforceMobileChrome;
  window.eqClearDesktopChrome = eqClearDesktopChrome;
  window.eqSyncMobileChrome = eqSyncMobileChrome;

  try {
    if (document.body) eqSyncMobileChrome();
  } catch (_) {}
  window.addEventListener("pageshow", function () {
    try {
      eqSyncMobileChrome();
    } catch (_) {}
  });

  /** i18n — flyout metinleri textContent ile yazıldığı için sözlük hazır olunca yeniden çiz. */
  window.__eqRerenderNav = function () {
    try {
      render();
    } catch (_) {}
    try {
      var drawer = document.getElementById("catDrawer");
      if (drawer) {
        try {
          if (drawer.querySelector(".eq-mcat-drawer-inner")) drawer.innerHTML = "";
        } catch (_) {}
        renderDrawer();
      }
    } catch (_) {}
  };

  function bootNav() {
    eqSyncMobileChrome();
    function paintNav() {
      try {
        window.__eqRerenderNav();
      } catch (_) {
        try {
          render();
        } catch (_2) {}
      }
      eqSyncMobileChrome();
    }
    if (window.eqI18nReady && typeof window.eqI18nReady.then === "function") {
      window.eqI18nReady.then(paintNav);
    } else {
      paintNav();
    }
  }

  document.addEventListener("equsto:i18n-ready", function () {
    try {
      window.__eqRerenderNav();
    } catch (_) {}
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bootNav);
  else bootNav();

  window.addEventListener(
    "resize",
    function () {
      try {
        eqSyncMobileChrome();
      } catch (_) {}
    },
    { passive: true }
  );

  function renderDrawer() {
    var drawer = document.getElementById("catDrawer");
    if (!drawer) return;
    ensureDrawerShell();
    paintShopDrawer();
  }

  /* #catDrawer gövde sonunda olabilir; head’deki script bazen readyState≠loading iken çalışır — o zaman tek seferlik render kaçmasın */
  var __eqDrawerWait = 0;
  function ensureRenderDrawer() {
    if (document.getElementById("catDrawer")) {
      renderDrawer();
      eqSyncMobileChrome();
      installEqBottomTabbar();
      try {
        if (typeof window.__eqMountMarketFooter === "function") window.__eqMountMarketFooter();
      } catch (_) {}
      return;
    }
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", ensureRenderDrawer, { once: true });
      return;
    }
    if (__eqDrawerWait++ > 40) return;
    setTimeout(ensureRenderDrawer, 0);
  }
  ensureRenderDrawer();
  window.addEventListener("load", function () {
    var d = document.getElementById("catDrawer");
    if (d && !d.querySelector("#eq-drawer-mega-row")) renderDrawer();
    else moveMarkalarIntoCatDrawer();
    installEqBottomTabbar();
    eqSyncMobileChrome();
  });

  // Category drawer helpers (some pages use toggleDrawer, some toggleCatPicker)
  function __eqToggleDrawer(open) {
    var d = document.getElementById("catDrawer");
    var o = document.getElementById("drawerOverlay");
    if (!d || !o) return;
    var next = typeof open === "boolean" ? open : !d.classList.contains("open");
    d.classList.toggle("open", next);
    o.classList.toggle("open", next);
    document.body.classList.toggle("eq-cat-drawer-open", next);
    d.setAttribute("aria-hidden", next ? "false" : "true");
    var trig = document.getElementById("eq-filter-drawer-trigger");
    if (trig) trig.setAttribute("aria-expanded", next ? "true" : "false");
    if (next) {
      __eqDrawerStack.length = 0;
      paintShopDrawer();
    } else {
      /* Kapanırken stack + drill sütunları sıfırla — bir sonraki açılışta temiz başlar */
      __eqDrawerStack.length = 0;
      var mr = document.getElementById("eq-drawer-mega-row");
      if (mr) mr.innerHTML = "";
    }
  }

  window.__eqToggleDrawer = __eqToggleDrawer;
  if (!window.__eqDrawerEscapeWired) {
    window.__eqDrawerEscapeWired = true;
    document.addEventListener(
      "keydown",
      function (ev) {
        if (!ev || ev.key !== "Escape") return;
        var d = document.getElementById("catDrawer");
        if (d && d.classList.contains("open")) __eqToggleDrawer(false);
      },
      true
    );
  }
  window.__eqDrawerBackdropClick = function (ev) {
    if (!ev || ev.target !== ev.currentTarget) return;
    __eqToggleDrawer(false);
  };
  window.__eqDrawerCloseX = function (ev) {
    if (ev) {
      ev.preventDefault();
      ev.stopPropagation();
    }
    __eqToggleDrawer(false);
  };

  if (typeof window.toggleCatPicker !== "function") window.toggleCatPicker = function () { __eqToggleDrawer(); };
  if (typeof window.closeCatPicker !== "function") window.closeCatPicker = function () { __eqToggleDrawer(false); };
  if (typeof window.toggleDrawer !== "function") window.toggleDrawer = function () { __eqToggleDrawer(); };

  /** Mobil (≤768px): Ana sayfa · Hesap · Sepet · Menü — Amazon mobil alt şerit (yalnız çizgi ikonlar) */
  function eqBottomNavHomeHref() {
    try {
      if (typeof window.equstoUrl === "function") return window.equstoUrl("home");
    } catch (e) {}
    return "index.html";
  }
  function eqBottomNavLoginHref() {
    try {
      if (typeof window.equstoResolveNavHref === "function") return window.equstoResolveNavHref("login.html");
    } catch (e2) {}
    return "login.html";
  }
  function installEqBottomTabbar() {
    var b = document.body;
    if (!b || !b.classList.contains("eq-shop") || b.classList.contains("admin-app")) return;
    /* PFOS: pf-m-tabbar (Devam + adımlar) — çift alt şerit olmasın */
    if (b.classList.contains("eq-pfos")) return;
    if (document.getElementById("eq-bottom-tabbar")) return;
    if (!document.getElementById("catDrawer") || !document.getElementById("drawerOverlay")) return;

    b.classList.add("eq-has-bottom-tabbar");

    var nav = document.createElement("nav");
    nav.id = "eq-bottom-tabbar";
    nav.className = "eq-bottom-tabbar";
    nav.setAttribute("aria-label", __navT("nav.mobile_submenu", "Alt menü"));

    var aHome = document.createElement("a");
    aHome.className = "eq-bottom-tabbar__btn";
    aHome.href = eqBottomNavHomeHref();
    aHome.setAttribute("data-eq-bnav", "home");
    aHome.setAttribute("aria-label", "Ana sayfa");
    aHome.innerHTML =
      '<span class="eq-bottom-tabbar__ico" aria-hidden="true"><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11 12 5l8 6v9a1 1 0 0 1-1 1h-5v-7h-2v7H5a1 1 0 0 1-1-1v-9z"/></svg></span>';

    var aAcc = document.createElement("a");
    aAcc.className = "eq-bottom-tabbar__btn";
    aAcc.href = eqBottomNavLoginHref();
    aAcc.setAttribute("data-eq-bnav", "account");
    aAcc.setAttribute("aria-label", "Hesap");
    aAcc.innerHTML =
      '<span class="eq-bottom-tabbar__ico" aria-hidden="true"><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"><circle cx="12" cy="8" r="3.5"/><path d="M5 20v-1a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v1"/></svg></span>';

    var btnCart = document.createElement("button");
    btnCart.type = "button";
    btnCart.className = "eq-bottom-tabbar__btn";
    btnCart.setAttribute("data-eq-bnav", "cart");
    btnCart.setAttribute("aria-label", __navT("nav.mobile_cart", "Sepet"));
    btnCart.innerHTML =
      '<span class="eq-bottom-tabbar__ico eq-bottom-tabbar__ico--cart" aria-hidden="true"><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 7h13.2L18 17.5H7.4L6 7z"/><path d="M6 7 5 4.5H3"/></svg><span id="eq-bnav-cart-badge" class="eq-bottom-tabbar__cart-qty">0</span></span>';
    btnCart.addEventListener("click", function (ev) {
      ev.preventDefault();
      if (window.EqustoCart && typeof window.EqustoCart.goToCartPage === "function") {
        window.EqustoCart.goToCartPage();
        return;
      }
      try {
        if (typeof window.equstoUrl === "function") {
          location.href = window.equstoUrl("cart");
          return;
        }
      } catch (eCart) {}
      location.href = "/sepet.html";
    });

    var btnCat = document.createElement("button");
    btnCat.type = "button";
    btnCat.className = "eq-bottom-tabbar__btn";
    btnCat.setAttribute("data-eq-bnav", "category");
    btnCat.setAttribute("aria-label", __navT("nav.mobile_menu", "Menü"));
    btnCat.innerHTML =
      '<span class="eq-bottom-tabbar__ico" aria-hidden="true"><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg></span>';
    btnCat.addEventListener("click", function (ev) {
      ev.preventDefault();
      __eqToggleDrawer(true);
    });

    var waSlot = document.createElement("div");
    waSlot.id = "eq-bnav-wa-slot";
    waSlot.className = "eq-bottom-tabbar__wa-slot";
    waSlot.setAttribute("aria-label", "WhatsApp");

    nav.classList.add("eq-bottom-tabbar--5");
    nav.appendChild(aHome);
    nav.appendChild(aAcc);
    nav.appendChild(waSlot);
    nav.appendChild(btnCart);
    nav.appendChild(btnCat);
    document.body.appendChild(nav);

    try {
      if (typeof window.equstoMountContactFabInTabbar === "function") window.equstoMountContactFabInTabbar();
    } catch (waErr) {}

    if (window.EqustoCart && typeof window.EqustoCart.syncBadge === "function") window.EqustoCart.syncBadge();
    eqSyncMobileChrome();
  }

  var EQ_FOOTER_ASSET_V = "20260529footer-wordgap3";

  function loadScriptSameDir(filename, flagName) {
    try {
      if (window[flagName]) return;
      if (filename === "eq-footer.js" && typeof window.__eqMountMarketFooter === "function") {
        window[flagName] = true;
        return;
      }
      var cur = document.currentScript;
      var base = cur && cur.src ? cur.src.replace(/[^/]+$/, "") : "";
      var url = base ? base + filename : "";
      if (filename === "eq-footer.js" && url) {
        url += (url.indexOf("?") >= 0 ? "&" : "?") + "v=" + EQ_FOOTER_ASSET_V;
      }
      if (!url) {
        try {
          url = new URL(filename, document.baseURI || window.location.href).href;
        } catch (e2) {
          url = filename;
        }
      }
      var s = document.createElement("script");
      s.src = url;
      s.async = false;
      s.onload = function () {
        window[flagName] = true;
      };
      s.onerror = function () {
        console.warn("[nav] Script yuklenemedi:", url);
      };
      document.head.appendChild(s);
    } catch (e) {}
  }

  loadScriptSameDir("eq-product-card-tint.js", "__eqProductCardTintLoaded");
  loadScriptSameDir("eq-photo-search.js", "__eqPhotoSearchLoaded");
  loadScriptSameDir("eq-footer.js", "__eqFooterLoaded");

  /** Çekmece / sepet katmanı takılı kalmasın (tüm sayfa tıklanamaz sanılır). */
  document.addEventListener(
    "DOMContentLoaded",
    function () {
      try {
        if (typeof window.__eqToggleDrawer === "function") window.__eqToggleDrawer(false);
      } catch (e) {}
      try {
        if (window.EqustoCart && typeof window.EqustoCart.closePanel === "function") window.EqustoCart.closePanel();
      } catch (e2) {}
    },
    { once: true }
  );
  window.addEventListener(
    "pageshow",
    function (ev) {
      if (!ev || !ev.persisted) return;
      try {
        if (typeof window.__eqToggleDrawer === "function") window.__eqToggleDrawer(false);
      } catch (e3) {}
      try {
        if (window.EqustoCart && typeof window.EqustoCart.closePanel === "function") window.EqustoCart.closePanel();
      } catch (e4) {}
    },
    false
  );
})();

