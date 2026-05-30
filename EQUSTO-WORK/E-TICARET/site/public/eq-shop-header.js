/**
 * Equsto shop üst bant (hdr-right) — ana sayfadaki gibi: tema + hesap + iadeler + sepet.
 * Mevcut HTML'deki basit `hdr-right` bloklarını genişletir.
 */
(function () {
  "use strict";

  function el(tag, attrs) {
    var n = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === "text") n.textContent = attrs[k];
        else if (k === "html") n.innerHTML = attrs[k];
        else n.setAttribute(k, attrs[k]);
      });
    }
    return n;
  }

  function shouldMount() {
    var b = document.body;
    if (!b || !b.classList.contains("eq-shop")) return false;
    if (b.classList.contains("admin-app")) return false;
    if (b.classList.contains("bd-page")) return false;
    return true;
  }

  function ensureHdrRight() {
    var hdr = document.querySelector("header.hdr");
    if (!hdr) return null;
    var right = hdr.querySelector(".hdr-right");
    if (!right) {
      right = el("div", { class: "hdr-right" });
      hdr.appendChild(right);
    }
    return right;
  }

  function ensureThemeWrap(right) {
    if (!right) return;
    if (right.querySelector(".theme-wrap")) return;
    // Eski sayfalarda sadece theme-toggle var; onu wrap içine al.
    var toggle = right.querySelector("#theme-toggle") || right.querySelector(".theme-toggle");
    var wrap = el("div", { class: "theme-wrap" });
    if (toggle) {
      wrap.appendChild(toggle);
    } else {
      wrap.appendChild(
        el("button", {
          type: "button",
          class: "theme-toggle",
          id: "theme-toggle",
          title: "Tema",
          text: "◝",
        })
      );
      wrap.firstChild.onclick = function () {
        try {
          if (typeof window.equstoCycleTheme === "function") window.equstoCycleTheme();
        } catch (_) {}
      };
    }
    wrap.appendChild(el("span", { class: "theme-legend", "data-i18n": "common.theme_label", text: "Sistem · Açık · Koyu" }));
    // En başa koy
    if (right.firstChild) right.insertBefore(wrap, right.firstChild);
    else right.appendChild(wrap);
  }

  function ensureAccount(right) {
    if (!right) return;
    if (right.querySelector(".eq-hdr-account")) return;
    var a = el("a", {
      href: "/login.html",
      class: "eq-hdr-account",
      title: "Üye girişi",
      "data-i18n-attr": "title:common.login_title",
    });
    a.appendChild(el("span", { "data-i18n": "common.my_account", text: "Hesabım" }));
    a.appendChild(
      el("span", {
        class: "eq-hdr-account-title",
        "data-i18n": "common.account_projects",
        text: "Projeler ve Listeler ▾",
      })
    );
    right.appendChild(a);
  }

  function returnsBox(node) {
    if (!node || node.nodeType !== 1) return null;
    if (node.classList && node.classList.contains("eq-hdr-orders")) return node;
    if (node.getAttribute && node.getAttribute("data-eq-hdr-returns")) return node;
    if (node.querySelector && node.querySelector('[data-i18n="common.returns"]')) return node;
    return null;
  }

  function hasReturnsBlock(right) {
    if (!right) return false;
    if (right.querySelector(".eq-hdr-orders")) return true;
    if (right.querySelector("[data-eq-hdr-returns]")) return true;
    if (right.querySelector('[data-i18n="common.returns"]')) return true;
    return false;
  }

  function dedupeReturns(right) {
    if (!right) return;
    var hits = right.querySelectorAll('[data-i18n="common.returns"]');
    if (hits.length <= 1) {
      if (hasReturnsBlock(right)) {
        var dup = right.querySelector("[data-eq-hdr-returns]");
        if (dup && right.querySelector(".eq-hdr-orders, [data-i18n=\"common.returns\"]")) dup.remove();
      }
      return;
    }
    for (var i = hits.length - 1; i >= 1; i--) {
      var box = returnsBox(hits[i].parentElement);
      if (box && box.parentElement === right) box.remove();
    }
  }

  function ensureReturns(right) {
    if (!right) return;
    if (hasReturnsBlock(right)) return;
    var box = el("div", { "data-eq-hdr-returns": "1", style: "display:flex;flex-direction:column;line-height:1.4;" });
    box.appendChild(el("span", { style: "font-size:10px;color:var(--eq-text-muted);", "data-i18n": "common.returns", text: "İadeler" }));
    box.appendChild(el("span", { style: "font-size:12px;font-weight:600;cursor:pointer;color:var(--eq-text);", "data-i18n": "common.and_orders", text: "ve Siparişler" }));
    right.appendChild(box);
  }

  function ensureCart(right) {
    if (!right) return;
    if (right.querySelector("#equsto-hdr-cart")) return;
    var cart = el("div", {
      id: "equsto-hdr-cart",
      class: "equsto-hdr-cart",
      style: "display:flex;flex-direction:column;line-height:1.4;cursor:pointer;",
      title: "Sepeti aç",
      role: "button",
      tabindex: "0",
      "data-i18n-attr": "title:common.cart_aria_title",
    });
    cart.appendChild(el("span", { id: "equsto-cart-count", style: "font-size:10px;color:var(--eq-text-muted);", text: "🛒 0" }));
    cart.appendChild(el("span", { style: "font-size:12px;font-weight:600;color:var(--eq-text);", "data-i18n": "common.cart", text: "Alışveriş Sepeti" }));
    function goCart() {
      try {
        if (typeof window.EqustoCart === "object" && typeof window.EqustoCart.open === "function") {
          window.EqustoCart.open();
          return;
        }
      } catch (_) {}
      location.href =
        typeof window.equstoUrl === "function" ? window.equstoUrl("cart") : "/sepet";
    }
    cart.addEventListener("click", goCart);
    cart.addEventListener("keydown", function (e) {
      if (e && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        goCart();
      }
    });
    right.appendChild(cart);
  }

  function mount() {
    if (!shouldMount()) return;
    var right = ensureHdrRight();
    if (!right) return;

    // Temizlik: bazı sayfalarda sadece "Hesabım" anchor'ı var (account-title yok)
    ensureThemeWrap(right);
    ensureAccount(right);
    dedupeReturns(right);
    ensureReturns(right);
    ensureCart(right);
  }

  function scheduleMount() {
    mount();
    if (document.querySelector("header.hdr .hdr-right")) return;
    if (typeof MutationObserver === "undefined") return;
    var obs = new MutationObserver(function () {
      if (document.querySelector("header.hdr .hdr-right")) {
        obs.disconnect();
        mount();
      }
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(function () {
      obs.disconnect();
      mount();
    }, 4000);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", scheduleMount);
  else scheduleMount();
})();

