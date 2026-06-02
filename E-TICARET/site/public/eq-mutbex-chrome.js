/**
 * Mağaza sayfalarında üst şerit ticker (Mutbex chrome).
 * Ticker kapatıldı — kayar promosyon şeridi kullanılmıyor.
 */
(function (global) {
  'use strict';
  return;

  var body = global.document && global.document.body;
  if (!body || !body.classList.contains('eq-shop')) return;
  if (body.classList.contains('eq-home')) return;
  if (body.classList.contains('admin-app')) return;
  if (body.classList.contains('bd-page')) return;
  if (body.classList.contains('eq-pfos')) return;
  if (body.classList.contains('eq-dept-plp')) return;

  body.classList.add('eq-mutbex-chrome');

  function tickerHtml() {
    if (global.EqMutbex && typeof global.EqMutbex.buildTickerHtml === 'function') {
      return global.EqMutbex.buildTickerHtml();
    }
    return (
      '<div class="eq-mx-ticker" aria-hidden="true"><div class="eq-mx-ticker__track">' +
      '<span class="eq-mx-ticker__item"><strong>9 Taksit</strong> vade farksız</span>' +
      '<span class="eq-mx-ticker__item"><strong>Ücretsiz kargo</strong> 5.000 ₺ üzeri</span>' +
      '</div></div>'
    );
  }

  function mount() {
    if (global.document.querySelector('.eq-mx-chrome-bar')) return;
    var anchor =
      global.document.querySelector('header.hdr') ||
      global.document.querySelector('.hdr') ||
      global.document.querySelector('.eq-hdr');
    if (!anchor || !anchor.parentNode) return;
    var bar = global.document.createElement('div');
    bar.className = 'eq-mx-chrome-bar';
    bar.setAttribute('aria-hidden', 'true');
    bar.innerHTML = tickerHtml();
    anchor.parentNode.insertBefore(bar, anchor.nextSibling);
  }

  function boot() {
    mount();
  }

  if (global.EqVitrinConfig && typeof global.EqVitrinConfig.load === 'function') {
    global.EqVitrinConfig.load().then(boot).catch(boot);
  } else {
    boot();
  }
  global.document.addEventListener('DOMContentLoaded', boot);
})(typeof window !== 'undefined' ? window : globalThis);
