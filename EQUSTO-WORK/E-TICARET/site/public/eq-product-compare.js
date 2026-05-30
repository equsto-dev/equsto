/**
 * Ürün karşılaştırma — sepete benzer, sessionStorage (max 4).
 */
(function (global) {
  'use strict';

  var KEY = 'equsto-compare-v1';
  var MAX = 4;

  function read() {
    try {
      var raw = global.sessionStorage.getItem(KEY);
      var list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (_) {
      return [];
    }
  }

  function write(list) {
    try {
      global.sessionStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
    } catch (_) {}
  }

  function itemId(u) {
    if (!u) return '';
    return String(u.id || u.sku || u.slug || u.n || '').trim();
  }

  function toggle(u) {
    var id = itemId(u);
    if (!id) return read();
    var list = read();
    var i = -1;
    for (var k = 0; k < list.length; k++) {
      if (itemId(list[k]) === id) {
        i = k;
        break;
      }
    }
    if (i >= 0) list.splice(i, 1);
    else {
      if (list.length >= MAX) list.shift();
      list.push({
        id: id,
        n: u.n || u.name || '',
        b: u.b || u.brand || '',
        img: u.img || '',
        href: u.href || u.url || '',
      });
    }
    write(list);
    return list;
  }

  function bind() {
    global.document.addEventListener(
      'click',
      function (ev) {
        var btn = ev.target && ev.target.closest ? ev.target.closest('[data-eq-compare]') : null;
        if (!btn) return;
        ev.preventDefault();
        var card = btn.closest('.prod-card-wrap, .eq-dept-plp-card, .prod-card');
        var title = card ? card.querySelector('.prod-name, .eq-dept-plp-card__title') : null;
        var img = card ? card.querySelector('img') : null;
        var link = card ? card.querySelector('a[href]') : null;
        toggle({
          n: title ? title.textContent.trim() : '',
          img: img ? img.getAttribute('src') || '' : '',
          href: link ? link.getAttribute('href') || '' : '',
        });
        var n = read().length;
        btn.setAttribute('aria-pressed', n ? 'true' : 'false');
        try {
          btn.textContent = n ? 'Listede (' + n + ')' : 'Karşılaştır';
        } catch (_) {}
      },
      true
    );
  }

  global.EqProductCompare = {
    list: read,
    toggle: toggle,
    clear: function () {
      write([]);
    },
  };

  bind();
})(typeof window !== 'undefined' ? window : globalThis);
