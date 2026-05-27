/**
 * Ana sayfa Mutbex vitrin — hero, story, spotlight (Equsto mimarisi).
 * Yapılandırma: EqVitrinConfig + /data/homepage-vitrin.json
 */
(function (global) {
  'use strict';

  var heroIndex = 0;
  var heroTimer = null;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/"/g, '&quot;');
  }

  function attrPath(p) {
    if (typeof global.eqAttrPath === 'function') return global.eqAttrPath(p);
    return p ? String(p) : '';
  }

  function imgSrc(p) {
    if (typeof global.eqProductImgSrc === 'function') return global.eqProductImgSrc(p);
    return attrPath(p);
  }

  var categoryCovers = {
    byDept: {
      pisirme: '/images/catalog/atalay/p7/atalay-e-aei---360.jpg',
      sogutma: '/images/catalog/ozti/p200/ozti-9805-im240x-nhc.jpg',
      kahve: '/images/catalog/ozti/p453/ozti-8593-su080-00.jpg',
      yikama: '/images/catalog/ozti/p238/ozti-7711-07075-24.jpg',
      hazirlik: '/images/catalog/ozti/p135/ozti-9810-hl200-21.jpg',
      icecek: '/images/catalog/ozti/p411/ozti-8224-0st20-00.jpg',
      tezgah: '/images/catalog/ozti/p49/ozti-7911-n1-40703-00.jpg',
      dolap: '/images/catalog/ozti/p97/ozti-7868-98987-md.jpg',
      davlumbaz: '/images/catalog/ozti/p285/ozti-7885-25155-00.jpg',
      tasima: '/images/catalog/ozti/p445/ozti-8868-mwp30-10.jpg',
      araba: '/images/catalog/atalay/p117/atalay-adk-102.jpg',
      istif: '/images/catalog/ozti/p284/ozti-8897-11ip4-073.jpg',
      'set-ustu-mutfak': '/images/catalog/ozti/p50/ozti-6260-00072-70.jpg',
      kuvetler: '/images/catalog/ozti/p50/ozti-6260-00072-70.jpg',
    },
    byGo: {
      pfos: '/images/pfos/dis-mutfak-gece-render.jpg?v=20260528a',
      besos: '/images/home/hero-bar-cocktailstation.png',
      marketReyon: '/images/catalog/ozti/p200/ozti-9805-im240x-nhc.jpg',
    },
  };

  function mergeCategoryCovers(data) {
    if (!data || typeof data !== 'object') return;
    if (data.byDept) categoryCovers.byDept = Object.assign({}, categoryCovers.byDept, data.byDept);
    if (data.byGo) categoryCovers.byGo = Object.assign({}, categoryCovers.byGo, data.byGo);
  }

  function loadCategoryCovers(cb) {
    if (categoryCovers.__loaded) {
      cb();
      return;
    }
    fetch('/data/category-covers.json', { credentials: 'same-origin' })
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .then(function (data) {
        mergeCategoryCovers(data);
        categoryCovers.__loaded = true;
        cb();
      })
      .catch(function () {
        categoryCovers.__loaded = true;
        cb();
      });
  }

  function resolvePopCatImage(item) {
    if (!item) return '';
    if (item.image && String(item.image).trim()) return String(item.image).trim();
    if (item.dept && categoryCovers.byDept[item.dept]) return categoryCovers.byDept[item.dept];
    if (item.go && categoryCovers.byGo[item.go]) return categoryCovers.byGo[item.go];
    return '';
  }

  var STORY_EMOJI = {
    pisirme: '🍳',
    sogutma: '❄️',
    kahve: '☕',
    yikama: '💧',
    hazirlik: '🔪',
    icecek: '🥤',
    tezgah: '▦',
    besos: '🍸',
    pfos: '📋',
    marketReyon: '🍽️',
    dolap: '🗄️',
    davlumbaz: '💨',
    tasima: '🚚',
    araba: '🛒',
    istif: '📦',
    'set-ustu-mutfak': '🍽️',
    kuvetler: '🥣',
  };

  function storyEmoji(item) {
    if (!item) return '•';
    if (item.emoji) return item.emoji;
    if (item.dept && STORY_EMOJI[item.dept]) return STORY_EMOJI[item.dept];
    if (item.cat && STORY_EMOJI[item.cat]) return STORY_EMOJI[item.cat];
    if (item.go && STORY_EMOJI[item.go]) return STORY_EMOJI[item.go];
    return '•';
  }

  function getStories() {
    if (global.EqVitrinConfig && typeof global.EqVitrinConfig.get === 'function') {
      var cfg = global.EqVitrinConfig.get();
      var list =
        global.EqVitrinConfig.activeList && cfg.stories
          ? global.EqVitrinConfig.activeList(cfg.stories)
          : cfg.stories;
      if (list && list.length) return list;
    }
    return [
      { label: 'Proje Fabrikası', go: 'pfos', emoji: '📋', bg: '#dce8f4', frame: '#9eb8d4', image: '/images/pfos/dis-mutfak-gece-render.jpg?v=20260528a' },
      { label: 'Bar Design', go: 'besos', emoji: '🍸', bg: '#e0f2f1', image: '/images/home/hero-bar-cocktailstation.png?v=20260520barcover' },
      { label: 'Pişirme Ekipmanları', dept: 'pisirme', emoji: '🍳', bg: '#e8f8ee', image: '/images/catalog/atalay/p7/atalay-e-aei---360.jpg' },
      { label: 'Soğutma Ekipmanları', dept: 'sogutma', emoji: '❄️', bg: '#e8f4fc', image: '/images/catalog/ozti/p200/ozti-9805-im240x-nhc.jpg' },
      { label: 'Kahve Ekipmanları', dept: 'kahve', emoji: '☕', bg: '#fff8e6', image: '/images/catalog/ozti/p453/ozti-8593-su080-00.jpg' },
      { label: 'Yıkama Ekipmanları', dept: 'yikama', emoji: '💧', bg: '#e3f2fd', image: '/images/catalog/ozti/p238/ozti-7711-07075-24.jpg' },
      { label: 'Hazırlık Ekipmanları', dept: 'hazirlik', emoji: '🔪', bg: '#e8f5e9', image: '/images/catalog/ozti/p135/ozti-9810-hl200-21.jpg' },
      { label: 'İçecek Ekipmanları', dept: 'icecek', emoji: '🥤', bg: '#ede7f6', image: '/images/catalog/ozti/p453/ozti-8593-su080-00.jpg' },
      { label: 'Servis & Teşhir', go: 'marketReyon', emoji: '🍽️', bg: '#fce8f0', image: '/images/catalog/ozti/p200/ozti-9805-im240x-nhc.jpg' },
      { label: 'Çalışma Tezgahları', dept: 'tezgah', emoji: '▦', bg: '#f3e5f5', image: '/images/catalog/ozti/p238/ozti-7711-07075-24.jpg' },
      { label: 'Dolaplar', dept: 'dolap', emoji: '🗄️', bg: '#e8f4fc', image: '/images/catalog/ozti/p238/ozti-7711-07075-24.jpg' },
      { label: 'Davlumbazlar', dept: 'davlumbaz', emoji: '💨', bg: '#fff8e1', image: '/images/catalog/atalay/p7/atalay-e-aei---360.jpg' },
      { label: 'Taşıma Ekipmanları', dept: 'tasima', emoji: '🚚', bg: '#e0f7fa', image: '/images/catalog/atalay/p7/atalay-e-aei---360.jpg' },
      { label: 'Arabalar', dept: 'araba', emoji: '🛒', bg: '#e8f5e9', image: '/images/catalog/atalay/p117/atalay-adk-102.jpg' },
      { label: 'İstif Rafları', dept: 'istif', emoji: '📦', bg: '#ede7f6', image: '/images/catalog/atalay/p117/atalay-adk-102.jpg' },
      { label: 'Küvetler', dept: 'kuvetler', emoji: '🥣', bg: '#fff8e6' },
    ];
  }

  function applyHomeCatFilter(cat) {
    if (typeof global.filterCat !== 'function') return false;
    try {
      if (global.ACTIVE_CAT && global.ACTIVE_CAT !== cat) global.filterCat(global.ACTIVE_CAT);
      if (global.ACTIVE_CAT !== cat) global.filterCat(cat);
      var anchor =
        document.querySelector('.left-col') ||
        document.querySelector('.eq-mx-pop-cats-wrap') ||
        document.querySelector('.eq-home-cm-shop');
      if (anchor) anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return true;
    } catch (_) {
      return false;
    }
  }

  function storyClick(item) {
    if (!item) return;
    if (item.go === 'pfos' && typeof global.eqGo === 'function') {
      global.eqGo('pfos');
      return;
    }
    if (item.go === 'besos' && typeof global.eqGo === 'function') {
      global.eqGo('besos');
      return;
    }
    if (item.go === 'marketReyon' && typeof global.eqGo === 'function') {
      global.eqGo('marketReyon');
      return;
    }
    if (item.cat) {
      if (
        typeof global.eqIsHomeVitrin === 'function' &&
        global.eqIsHomeVitrin() &&
        applyHomeCatFilter(item.cat)
      ) {
        return;
      }
      var home = typeof global.equstoUrl === 'function' ? global.equstoUrl('home') : 'index.html';
      global.location.href = home + '#' + item.cat;
      return;
    }
    if (item.dept && typeof global.eqDeptGo === 'function') global.eqDeptGo(item.dept);
  }

  function popCatBg(i, item) {
    if (item && item.bg) return item.bg;
    var palette = ['#e8f4fc', '#e3f2fd', '#e8f5e9', '#fff8e1', '#fce8f0', '#ede7f6', '#e0f2f1', '#f3e5f5'];
    return palette[i % palette.length];
  }

  function popCatImgRaw(item) {
    var s = resolvePopCatImage(item);
    if (!s) return '';
    s = String(s).trim().replace(/\\/g, '/');
    if (/^https?:\/\//i.test(s)) return '';
    if (/^\/images\/(catalog|home)\//i.test(s)) return '';
    if (/^\/data\/images\//i.test(s)) return 'images/' + s.replace(/^\/data\/images\//i, '');
    if (/^images\/catalog\//i.test(s) || /^images\/home\//i.test(s)) return '';
    if (/^images\//i.test(s)) return s;
    if (/\.(jpe?g|png|webp|gif)(\?|#|$)/i.test(s)) return 'images/' + s.replace(/^\/+/, '');
    return '';
  }

  function renderPopCatCard(item, idx) {
    var bg = popCatBg(idx, item);
    var photo = resolvePopCatImage(item);
    var hasPhoto = !!photo;
    var style = hasPhoto ? '' : 'background:' + esc(bg);
    if (!hasPhoto && item && item.frame) style += ';border:2px solid ' + esc(item.frame);
    var rawRel = popCatImgRaw(item);
    var imgHtml = hasPhoto
      ? '<img src="' +
        esc(imgSrc(photo)) +
        '"' +
        (rawRel ? ' data-eq-img-raw="' + esc(rawRel) + '" data-eq-img-step="0"' : '') +
        ' alt="" loading="lazy" decoding="async" onerror="typeof __eqImgFail===\'function\'&&__eqImgFail(this)">' +
        '<span class="eq-mx-pop-cat__scrim" aria-hidden="true"></span>'
      : '<span class="eq-mx-pop-cat__ph" aria-hidden="true">' + esc(storyEmoji(item)) + '</span>';
    return (
      '<a class="eq-mx-pop-cat' +
      (hasPhoto ? ' eq-mx-pop-cat--photo' : '') +
      '" href="#" style="' +
      style +
      '" data-pop-idx="' +
      idx +
      '" data-pop-emoji="' +
      esc(storyEmoji(item)) +
      '">' +
      '<span class="eq-mx-pop-cat__visual">' +
      imgHtml +
      '</span>' +
      '<span class="eq-mx-pop-cat__lbl">' +
      esc(item.label || '') +
      '</span></a>'
    );
  }

  function bindPopCatsDrag(track) {
    if (!track || track.__eqPopCatDragBound) return;
    track.__eqPopCatDragBound = true;

    var isDown = false;
    var startX = 0;
    var scrollStart = 0;
    var moved = false;
    var THRESH = 5;

    function onMove(e) {
      if (!isDown) return;
      var dx = e.pageX - startX;
      if (Math.abs(dx) > THRESH) moved = true;
      track.scrollLeft = scrollStart - dx;
    }

    function endDrag() {
      if (!isDown) return;
      isDown = false;
      track.classList.remove('is-dragging');
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', endDrag);
      if (moved) {
        track.__eqPopCatDidDrag = true;
        global.setTimeout(function () {
          track.__eqPopCatDidDrag = false;
        }, 80);
      }
      moved = false;
    }

    track.addEventListener('mousedown', function (e) {
      if (e.button !== 0) return;
      isDown = true;
      moved = false;
      startX = e.pageX;
      scrollStart = track.scrollLeft;
      track.classList.add('is-dragging');
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', endDrag);
    });
  }

  function bindPopCatsNav() {
    var wrap = document.querySelector('.eq-mx-pop-cats');
    var track = document.getElementById('eq-mx-pop-cats-track');
    if (!wrap || !track) return;
    bindPopCatsDrag(track);
    var prev = wrap.querySelector('.eq-mx-pop-cats__nav--prev');
    var next = wrap.querySelector('.eq-mx-pop-cats__nav--next');
    var step = Math.max(200, Math.floor(track.clientWidth * 0.82));
    if (prev) {
      prev.onclick = function () {
        track.scrollBy({ left: -step, behavior: 'smooth' });
      };
    }
    if (next) {
      next.onclick = function () {
        track.scrollBy({ left: step, behavior: 'smooth' });
      };
    }
    var dotsEl = document.getElementById('eq-mx-pop-cats-dots');
    if (!dotsEl) return;
    var cards = track.querySelectorAll('.eq-mx-pop-cat');
    if (cards.length <= 5) {
      dotsEl.innerHTML = '';
      dotsEl.hidden = true;
      return;
    }
    var pages = Math.max(1, Math.ceil(cards.length / 5));
    var dotsHtml = '';
    for (var d = 0; d < pages; d++) {
      dotsHtml += '<button type="button" class="eq-mx-pop-cats__dot' + (d === 0 ? ' is-active' : '') + '" data-page="' + d + '" aria-label="Sayfa ' + (d + 1) + '"></button>';
    }
    dotsEl.innerHTML = dotsHtml;
    dotsEl.hidden = false;
    dotsEl.querySelectorAll('.eq-mx-pop-cats__dot').forEach(function (btn) {
      btn.onclick = function () {
        var page = Number(btn.getAttribute('data-page')) || 0;
        var card = cards[Math.min(page * 5, cards.length - 1)];
        if (card) card.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
        dotsEl.querySelectorAll('.eq-mx-pop-cats__dot').forEach(function (b) {
          b.classList.toggle('is-active', b === btn);
        });
      };
    });
  }

  function renderPopCats() {
    var track = document.getElementById('eq-mx-pop-cats-track');
    if (!track) return;
    loadCategoryCovers(function () {
      var items = getStories();
      if (!items.length) return;
      track.innerHTML = items
        .map(function (item, idx) {
          return renderPopCatCard(item, idx);
        })
        .join('');
      track.querySelectorAll('.eq-mx-pop-cat').forEach(function (link, idx) {
        link.addEventListener('click', function (e) {
          e.preventDefault();
          if (track.__eqPopCatDidDrag) return;
          storyClick(items[idx]);
        });
      });
      bindPopCatsNav();
      if (typeof global.eqFixDataImagesInDom === 'function') global.eqFixDataImagesInDom(track);
    });
  }

  function renderStories() {
    var track = document.getElementById('eq-mx-story-track');
    if (!track) return;
    var stories = getStories();
    var html = '';
    for (var i = 0; i < stories.length; i++) {
      var item = stories[i];
      var em = storyEmoji(item);
      var inner = item.image
        ? '<img src="' +
          esc(imgSrc(item.image)) +
          '" alt="" loading="lazy" data-eq-emoji="' +
          esc(em) +
          '" onerror="typeof __eqImgFail===\'function\'&&__eqImgFail(this)">'
        : '<span class="eq-mx-story__ring-in" aria-hidden="true">' + em + '</span>';
      html +=
        '<a class="eq-mx-story" href="#">' +
        '<div class="eq-mx-story__ring">' +
        inner +
        '</div>' +
        '<span class="eq-mx-story__lbl">' +
        esc(item.label) +
        '</span></a>';
    }
    track.innerHTML = html;
    var links = track.querySelectorAll('.eq-mx-story');
    for (var j = 0; j < links.length; j++) {
      (function (item) {
        links[j].addEventListener('click', function (e) {
          e.preventDefault();
          storyClick(item);
        });
      })(stories[j]);
    }
  }

  function setHeroSlide(i) {
    var slides = document.querySelectorAll('.eq-mx-hero__slide');
    var thumbs = document.querySelectorAll('.eq-mx-hero__thumb');
    if (!slides.length) return;
    heroIndex = ((i % slides.length) + slides.length) % slides.length;
    for (var s = 0; s < slides.length; s++) {
      slides[s].classList.toggle('is-active', s === heroIndex);
    }
    for (var t = 0; t < thumbs.length; t++) {
      thumbs[t].classList.toggle('is-active', t === heroIndex);
    }
  }

  function initHero() {
    var prev = document.querySelector('.eq-mx-hero__nav--prev');
    var next = document.querySelector('.eq-mx-hero__nav--next');
    if (prev) {
      prev.onclick = function () {
        setHeroSlide(heroIndex - 1);
      };
    }
    if (next) {
      next.onclick = function () {
        setHeroSlide(heroIndex + 1);
      };
    }
    var thumbBtns = document.querySelectorAll('.eq-mx-hero__thumb');
    for (var i = 0; i < thumbBtns.length; i++) {
      (function (idx) {
        thumbBtns[idx].onclick = function () {
          setHeroSlide(idx);
        };
      })(i);
    }
    if (heroTimer) clearInterval(heroTimer);
    heroTimer = setInterval(function () {
      setHeroSlide(heroIndex + 1);
    }, 6000);
    setHeroSlide(0);
    document.querySelectorAll('.eq-mx-hero__slide').forEach(function (el) {
      var href = (el.getAttribute('href') || '').toLowerCase();
      if (href.indexOf('pfos') >= 0) {
        el.addEventListener('click', function (e) {
          e.preventDefault();
          if (typeof global.eqGo === 'function') global.eqGo('pfos');
        });
      } else if (href.indexOf('bar-design') >= 0) {
        el.addEventListener('click', function (e) {
          e.preventDefault();
          if (typeof global.eqGo === 'function') global.eqGo('besos');
        });
      }
    });
  }

  global.__eqMxReinitHero = initHero;

  function renderMxSpotlightCard(u) {
    var img = u.img
      ? '<img src="' +
        esc(imgSrc(u.img)) +
        '" alt="" loading="lazy" onerror="typeof __eqImgFail===\'function\'&&__eqImgFail(this)">'
      : '';
    var href =
      typeof global.productHrefHome === 'function' ? global.productHrefHome(u) : 'product.html';
    var name = (u.n || '').substring(0, 72) + ((u.n || '').length > 72 ? '…' : '');
    return (
      '<a class="eq-mx-spot-card" href="' +
      esc(attrPath(href)) +
      '">' +
      '<div class="eq-mx-spot-card__img">' +
      img +
      '</div>' +
      '<div class="eq-mx-spot-card__body">' +
      '<div class="eq-mx-spot-card__brand">' +
      esc(u.b || '') +
      '</div>' +
      '<div class="eq-mx-spot-card__name">' +
      esc(name) +
      '</div>' +
      '<div class="eq-mx-spot-card__price">₺' +
      esc(u.p || '') +
      '</div></div></a>'
    );
  }

  function fillSpotlight() {
    var el = document.getElementById('eq-mx-spotlight');
    if (!el || typeof global.__eqAllProducts !== 'function') return;
    var pool = global.__eqAllProducts();
    if (!pool || !pool.length) return;
    var spec = { mode: 'auto', limit: 8 };
    if (global.EqVitrinConfig && global.EqVitrinConfig.get) {
      var cfg = global.EqVitrinConfig.get();
      if (cfg.spotlight) spec = cfg.spotlight;
    }
    var pick =
      global.EqVitrinConfig && global.EqVitrinConfig.pickProducts
        ? global.EqVitrinConfig.pickProducts(pool, spec)
        : pool.slice(0, 8);
    var out = '';
    for (var k = 0; k < pick.length; k++) {
      out += renderMxSpotlightCard(pick[k]);
    }
    el.innerHTML = out;
  }

  function patchRenderCard() {
    if (typeof global.renderCard !== 'function' || global.renderCard.__eqMxPatched) return;
    var orig = global.renderCard;
    global.renderCard = function (u) {
      var base = orig(u);
      if (
        !document.body.classList.contains('eq-home-mutbex') &&
        !document.body.classList.contains('eq-shop-mutbex')
      ) {
        return base;
      }

      var imgPath = u.img || '';
      if (!imgPath && typeof global.eqHomeImgSrc === 'function') {
        var hs = global.eqHomeImgSrc(u);
        if (hs) imgPath = hs;
      }
      var uCart = Object.assign({}, u, { img: imgPath || u.img });

      var wrapAttrs =
        global.EqustoCart && typeof global.EqustoCart.cardWrapAttrs === 'function'
          ? global.EqustoCart.cardWrapAttrs(uCart)
          : global.EqustoCart && typeof global.EqustoCart.dataAttrs === 'function'
            ? global.EqustoCart.dataAttrs(uCart).replace(/\s*data-equsto-cart="1"/, '')
            : '';
      var out = base.replace(
        '<div class="prod-card prod-card-wrap">',
        '<div class="prod-card prod-card-wrap"' + wrapAttrs + '>',
      )
        .replace(/<img src="/g, '<img onerror="typeof __eqImgFail===\'function\'&&__eqImgFail(this)" src="');

      var badges =
        global.EqVitrinConfig && global.EqVitrinConfig.get
          ? global.EqVitrinConfig.get().productBadges || {}
          : {};
      var badgeHtml = '';
      if (badges.showFreeShipping !== false) {
        badgeHtml +=
          '<span class="eq-mx-badge eq-mx-badge--ship">' +
          esc(badges.freeShippingLabel || 'Ücretsiz kargo') +
          '</span>';
      }
      if (badges.showInstallments !== false) {
        badgeHtml +=
          '<span class="eq-mx-badge eq-mx-badge--disc">' +
          esc(badges.installmentsLabel || '9 taksit') +
          '</span>';
      }
      if (badgeHtml) {
        out = out.replace(
          /(<div class="prod-img"[^>]*>)([\s\S]*?)(<\/div>)/,
          '$1$2<div class="eq-mx-badges">' + badgeHtml + '</div>$3',
        );
      }

      var cartAttrs =
        global.EqustoCart && typeof global.EqustoCart.cartAddButtonAttrs === 'function'
          ? global.EqustoCart.cartAddButtonAttrs(uCart)
          : 'type="button" class="eq-cart-add eq-mx-act eq-mx-add" data-equsto-cart="1"';
      var cartRow =
        '<div class="eq-mx-prod-actions"><button ' + cartAttrs + '>Sepete ekle</button></div>';

      out = out.replace(/<button[^>]*\beq-cart-add\b[^>]*>[\s\S]*?<\/button>/i, '');
      if (out.indexOf('eq-mx-prod-actions') < 0) {
        out = out.replace('</a>', '</a>' + cartRow);
      }
      return out;
    };
    global.renderCard.__eqMxPatched = true;
  }

  function getCfg() {
    return global.EqVitrinConfig && global.EqVitrinConfig.get ? global.EqVitrinConfig.get() : {};
  }

  function activeList(arr) {
    if (global.EqVitrinConfig && global.EqVitrinConfig.activeList) return global.EqVitrinConfig.activeList(arr);
    if (!Array.isArray(arr)) return [];
    return arr.filter(function (x) {
      return x && x.aktif !== false;
    });
  }

  function pickShowcaseProducts(pool, spec) {
    if (!Array.isArray(pool) || !pool.length || !spec) return [];
    var base = pool;
    var dept = spec.dept;
    if (dept) {
      var byDept = pool.filter(function (u) {
        if (!u) return false;
        if (dept === 'yikama' && typeof global.eqYikamaShowcaseProduct === 'function') {
          return global.eqYikamaShowcaseProduct(u);
        }
        if (typeof global.eqProductMatchesDept === 'function') {
          return global.eqProductMatchesDept(u, dept);
        }
        return u.c === dept;
      });
      if (byDept.length) base = byDept;
    }
    if (global.EqVitrinConfig && global.EqVitrinConfig.pickProducts) {
      return global.EqVitrinConfig.pickProducts(base, spec);
    }
    return base.slice(0, (spec && Number(spec.limit)) || 8);
  }

  function productCodeFromLabel(s) {
    if (typeof global.eqExtractProductCodeTail === 'function') {
      return global.eqExtractProductCodeTail(s);
    }
    var m = String(s || '').match(/([0-9]{2,}[A-Za-z][0-9][\w.-]*\.[\w.]+)/i);
    return m ? m[1].toLowerCase().replace(/\./g, '-') : '';
  }

  function findProduct(pool, sku) {
    if (!sku || !Array.isArray(pool)) return null;
    var key = String(sku).toLowerCase();
    var code = productCodeFromLabel(sku);
    for (var i = 0; i < pool.length; i++) {
      var u = pool[i];
      if (!u) continue;
      if (String(u.n || '').toLowerCase() === key) return u;
      if (String(u.sku || '').toLowerCase() === key) return u;
      var uid = String(u.id || (u.raw && u.raw.id) || '').toLowerCase();
      if (uid && code && uid.endsWith('__' + code)) return u;
      if (
        typeof global.eqMatchCatalogRowByPathSlug === 'function' &&
        global.eqMatchCatalogRowByPathSlug(
          { id: uid, brand: u.b, name: u.n, specs: u.specs },
          key.replace(/[^a-z0-9-]+/g, '-'),
        )
      ) {
        return u;
      }
    }
    return null;
  }

  function deptClickAttr(dept) {
    if (!dept) return '';
    return ' href="#" onclick="event.preventDefault();typeof eqDeptGo===\'function\'&&eqDeptGo(\'' + esc(dept) + '\');"';
  }

  function renderPromoCards(pool, cards) {
    var grid = document.getElementById('eq-mx-promo-grid');
    var sec = document.getElementById('eq-mx-promo-section');
    if (!grid || !sec) return;
    var list = activeList(cards);
    if (!list.length) {
      sec.hidden = true;
      return;
    }
    var html = '';
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      var u = c.sku ? findProduct(pool, c.sku) : null;
      var img = u && u.img ? u.img : c.image || '';
      var href = c.href || (c.dept ? '#' : '#');
      var onclick = c.dept
        ? ' onclick="event.preventDefault();typeof eqDeptGo===\'function\'&&eqDeptGo(\'' +
          esc(c.dept) +
          '\');"'
        : '';
      if (u && typeof global.productHrefHome === 'function') {
        href = global.productHrefHome(u);
        onclick = '';
      }
      html +=
        '<a class="eq-mx-promo-card" style="background:' +
        esc(c.bg || '#f5f0e8') +
        '" href="' +
        esc(attrPath(href)) +
        '"' +
        onclick +
        '>' +
        '<span class="eq-mx-promo-card__brand">' +
        esc(c.brand || '') +
        '</span>' +
        '<span class="eq-mx-promo-card__tag">' +
        esc(c.tag || 'Keşfet') +
        '</span>' +
        '<h3 class="eq-mx-promo-card__title">' +
        esc(c.title || '') +
        '</h3>' +
        '<span class="eq-mx-promo-card__cta">Keşfet</span>' +
        '<span class="eq-mx-promo-card__img">' +
        (img
          ? '<img src="' +
            esc(imgSrc(img)) +
            '" alt="" loading="lazy" onerror="typeof __eqImgFail===\'function\'&&__eqImgFail(this)">'
          : '') +
        '</span></a>';
    }
    grid.innerHTML = html;
    sec.hidden = false;
  }

  function renderPayBanner(banner) {
    var el = document.getElementById('eq-mx-pay-banner');
    var sec = document.getElementById('eq-mx-pay-section');
    if (!el || !sec || !banner || banner.aktif === false) {
      if (sec) sec.hidden = true;
      return;
    }
    var L = banner.left || {};
    var R = banner.right || {};
    el.innerHTML =
      '<div class="eq-mx-pay-col" style="background:' +
      esc(L.bg || '#5c3d8f') +
      '"><strong>' +
      esc(L.strong || '') +
      '</strong><span>' +
      esc(L.text || '') +
      '</span></div>' +
      '<div class="eq-mx-pay-col" style="background:' +
      esc(R.bg || '#1565c0') +
      '"><strong>' +
      esc(R.strong || '') +
      '</strong><span>' +
      esc(R.text || '') +
      '</span></div>';
    sec.hidden = false;
  }

  function renderCatTile(item, sm) {
    var img = item.image
      ? '<img src="' +
        esc(imgSrc(item.image)) +
        '" alt="" loading="lazy" onerror="typeof __eqImgFail===\'function\'&&__eqImgFail(this)">'
      : '';
    return (
      '<a class="eq-mx-cat-tile' +
      (sm ? ' eq-mx-cat-tile--sm' : '') +
      (item.size === 'lg' ? ' eq-mx-cat-tile--lg' : '') +
      (item.textLight ? ' eq-mx-cat-tile--light' : '') +
      '" style="background:' +
      esc(item.bg || '#e8f4fc') +
      '"' +
      deptClickAttr(item.dept) +
      '>' +
      '<span class="eq-mx-cat-tile__txt">' +
      '<span class="eq-mx-cat-tile__label">' +
      esc(item.label || '') +
      '</span>' +
      '<span class="eq-mx-cat-tile__cta">Keşfet</span></span>' +
      '<span class="eq-mx-cat-tile__img">' +
      img +
      '</span></a>'
    );
  }

  function renderCatTilesSmall(tiles) {
    var grid = document.getElementById('eq-mx-cat-grid-sm');
    var sec = document.getElementById('eq-mx-cat-sm-section');
    if (!grid || !sec) return;
    var list = activeList(tiles);
    if (!list.length) {
      sec.hidden = true;
      return;
    }
    grid.innerHTML = list.map(function (t) {
      return renderCatTile(t, true);
    }).join('');
    sec.hidden = false;
  }

  function renderCatMosaic(tiles) {
    var grid = document.getElementById('eq-mx-cat-mosaic');
    var sec =
      document.getElementById('eq-mx-vitrin-mosaic-section') ||
      document.getElementById('eq-mx-mosaic-section');
    if (!grid || !sec) return;
    var list = activeList(tiles);
    if (!list.length) {
      sec.hidden = true;
      return;
    }
    grid.innerHTML = list
      .map(function (t) {
        return renderCatTile(t, t.size !== 'lg');
      })
      .join('');
    sec.hidden = false;
  }

  function bindShowcaseNav(section) {
    var track = section.querySelector('.eq-mx-showcase__track');
    if (!track) return;
    var prev = section.querySelector('[data-mx-scroll="prev"]');
    var next = section.querySelector('[data-mx-scroll="next"]');
    var step = Math.max(260, track.clientWidth * 0.85);
    if (prev) {
      prev.onclick = function () {
        track.scrollBy({ left: -step, behavior: 'smooth' });
      };
    }
    if (next) {
      next.onclick = function () {
        track.scrollBy({ left: step, behavior: 'smooth' });
      };
    }
  }

  function renderDeptShowcase(pool, spec) {
    if (!spec || spec.aktif === false) return;
    var id = spec.id || 'showcase';
    var section = document.getElementById('eq-mx-showcase-' + id);
    if (!section) return;
    var products = pickShowcaseProducts(pool, spec.products || {});
    if (!products.length) {
      section.hidden = true;
      return;
    }
    var renderCardFn = typeof global.renderCard === 'function' ? global.renderCard : null;
    var cardsHtml = renderCardFn
      ? products.map(renderCardFn).join('')
      : products.map(renderMxSpotlightCard).join('');
    var hdrBg = spec.headerBg || 'linear-gradient(105deg,#0288d1,#01579b)';
    var hdrImg = spec.headerImage
      ? '<img class="eq-mx-showcase__hdr-img" src="' +
        esc(imgSrc(spec.headerImage)) +
        '" alt="" loading="lazy">'
      : '';
    var ctaHref = spec.href || (spec.dept ? '#' : '/shop');
    var ctaOnclick = spec.dept
      ? ' onclick="event.preventDefault();typeof eqDeptGo===\'function\'&&eqDeptGo(\'' +
        esc(spec.dept) +
        '\');"'
      : '';
    var theme = spec.theme === 'orange' ? ' eq-mx-showcase--orange' : '';
    section.className = 'eq-mx-showcase eq-mx-o-' + (id === 'essentials' ? 'ess' : 'dept1') + theme;
    section.innerHTML =
      '<div class="eq-mx-showcase__hdr" style="background:' +
      esc(hdrBg) +
      '">' +
      '<div class="eq-mx-showcase__hdr-inner">' +
      (spec.theme === 'orange'
        ? '<span class="eq-mx-showcase__hearts" aria-hidden="true">♥ ♥</span>'
        : hdrImg) +
      '<div class="eq-mx-showcase__hdr-text">' +
      '<h2>' +
      esc(spec.title || '') +
      '</h2>' +
      '<a class="eq-mx-showcase__hdr-cta" href="' +
      esc(attrPath(ctaHref)) +
      '"' +
      ctaOnclick +
      '>' +
      esc(spec.cta || 'Hemen Keşfedin →') +
      '</a></div></div></div>' +
      '<div class="eq-mx-showcase__body">' +
      '<button type="button" class="eq-mx-showcase__nav eq-mx-showcase__nav--prev" data-mx-scroll="prev" aria-label="Önceki">‹</button>' +
      '<div class="eq-mx-showcase__track eq-mx-showcase__track--cards">' +
      cardsHtml +
      '</div>' +
      '<button type="button" class="eq-mx-showcase__nav eq-mx-showcase__nav--next" data-mx-scroll="next" aria-label="Sonraki">›</button>' +
      '</div>';
    section.hidden = false;
    bindShowcaseNav(section);
    if (typeof global.eqFixDataImagesInDom === 'function') global.eqFixDataImagesInDom(section);
  }

  function renderMxSections() {
    if (!document.body.classList.contains('eq-home-mutbex')) return;
    var cfg = getCfg();
    var L = cfg.layout || {};
    var pool = typeof global.__eqAllProducts === 'function' ? global.__eqAllProducts() : [];
    if (!pool.length) return;
    patchRenderCard();
    if (L.showMutbexPromoCards !== false) renderPromoCards(pool, cfg.promoCards);
    if (L.showMutbexPayBanner !== false) renderPayBanner(cfg.payBanner);
    if (L.showMutbexCatTiles !== false) renderCatTilesSmall(cfg.categoryTilesSmall);
    if (L.showMutbexDeptShowcases !== false) {
      var showcases = activeList(cfg.deptShowcases);
      for (var i = 0; i < showcases.length; i++) renderDeptShowcase(pool, showcases[i]);
    }
    if (L.showMutbexCatMosaic !== false) renderCatMosaic(cfg.categoryMosaic);
  }

  function patchRenderHomeRailsForMx() {
    if (typeof global.renderHomeRails !== 'function' || global.renderHomeRails.__eqMxSectionsPatched) return;
    var orig = global.renderHomeRails;
    global.renderHomeRails = function () {
      orig.apply(this, arguments);
      renderMxSections();
    };
    global.renderHomeRails.__eqMxSectionsPatched = true;
  }

  function init() {
    document.body.classList.add('eq-home-mutbex');
    patchRenderHomeRailsForMx();
    var boot = function () {
      if (document.getElementById('eq-mx-pop-cats-track')) renderPopCats();
      else renderStories();
      initHero();
      patchRenderCard();
      fillSpotlight();
      renderMxSections();
    };
    if (global.EqVitrinConfig && global.EqVitrinConfig.load) {
      global.EqVitrinConfig.load().then(boot);
    } else {
      boot();
    }
  }

  global.eqMxFillSpotlight = fillSpotlight;
  global.eqMxRenderSections = renderMxSections;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof window !== 'undefined' ? window : global);
