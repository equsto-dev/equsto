/**
 * equsto.com — WhatsApp (mobil alt şerit + sayfa-içi kart)
 * PC yüzen kedi: sayfa-içi sohbet kartı (WhatsApp Web açılmaz).
 * Mobil alt şerit: doğrudan WhatsApp uygulaması.
 *
 * window.EQUSTO_WHATSAPP_E164 bu scriptten önce tanımlanarak geçilebilir.
 * Üye bayrağı: equsto-member.js → equstoSetMemberActive / equstoIsMemberLoggedIn
 */
(function () {
  window.EQUSTO_WHATSAPP_E164 = window.EQUSTO_WHATSAPP_E164 || "905326842608";

  function __waT(k, fb) {
    try {
      if (typeof window.eqT === "function") {
        var v = window.eqT(k, null);
        if (v != null && v !== k) return v;
      }
    } catch (_) {}
    return fb != null ? fb : k;
  }

  function escWa(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;");
  }

  function defaultPrefill() {
    return __waT("wa.prefill", "Merhaba, equsto.com üzerinden yazıyorum.");
  }
  var THREADS_KEY = "equsto_wa_threads_v1";
  var CHAT_KEY = "equsto_wa_chat_v1";
  var WA_FAB_IMG = "/equsto-bize-ulasin-isimlik.png";
  /** Modal şablonu değişince artırın (eski DOM'u zorla yeniler). */
  var WA_MODAL_BUILD = 11;

  var waModalDigits = "";
  var waModalResizeHandler = null;

  function syncWaModalNearFab() {
    var fab = document.querySelector(".equsto-contact-wa-fab");
    var modal = document.querySelector(".equsto-wa-modal");
    if (!fab || !modal) return;
    var gap = 10;
    var r = fab.getBoundingClientRect();
    modal.style.right = Math.max(8, Math.round(window.innerWidth - r.right)) + "px";
    modal.style.bottom = Math.max(8, Math.round(window.innerHeight - r.top + gap)) + "px";
    var spaceAbove = r.top - gap - 12;
    var mh = Math.min(Math.round(window.innerHeight * 0.9), Math.max(306, spaceAbove));
    modal.style.maxHeight = mh + "px";
  }

  function digitsOnly(s) {
    return String(s || "").replace(/\D/g, "");
  }

  function equstoIsMember() {
    return typeof window.equstoIsMemberLoggedIn === "function" && window.equstoIsMemberLoggedIn();
  }

  function equstoResolveWhatsAppDigits() {
    var a = digitsOnly(window.EQUSTO_WHATSAPP_E164);
    if (a.length >= 10) return a;
    try {
      if (window.PFOS_CONFIG && PFOS_CONFIG.whatsappPhone) {
        var b = digitsOnly(PFOS_CONFIG.whatsappPhone);
        if (b.length >= 10) return b;
      }
    } catch (e) {}
    return "";
  }

  function equstoWhatsAppWebSendUrl(phoneDigits, plainText) {
    if (!phoneDigits || String(phoneDigits).length < 10) return "";
    var u =
      "https://web.whatsapp.com/send?phone=" +
      encodeURIComponent(String(phoneDigits).replace(/\D/g, ""));
    if (plainText != null && String(plainText).length) {
      u += "&text=" + encodeURIComponent(String(plainText));
    }
    return u;
  }

  /** Mobil: wa.me → WhatsApp uygulaması (iOS/Android) */
  function equstoWhatsAppAppSendUrl(phoneDigits, plainText) {
    var p = digitsOnly(phoneDigits);
    if (!p || p.length < 10) return "";
    var u = "https://wa.me/" + p;
    if (plainText != null && String(plainText).length) {
      u += "?text=" + encodeURIComponent(String(plainText));
    }
    return u;
  }

  function equstoPreferDirectWhatsAppApp() {
    try {
      if (window.matchMedia("(max-width: 768px)").matches) return true;
      if (window.matchMedia("(hover: none) and (pointer: coarse)").matches) return true;
    } catch (e) {}
    return /Android|iPhone|iPad|iPod|webOS|IEMobile|Opera Mini/i.test(navigator.userAgent || "");
  }

  function equstoOpenWhatsAppDirect(phoneDigits, plainText) {
    var phone = digitsOnly(phoneDigits);
    var url = equstoWhatsAppAppSendUrl(phone, plainText != null ? plainText : "");
    if (!url) {
      window.alert(__waT("wa.no_phone", "Geçerli bir WhatsApp numarası yok."));
      return false;
    }
    try {
      pushThread(phone, plainText != null ? plainText : "");
    } catch (e) {}
    window.location.href = url;
    return false;
  }

  function equstoWhatsAppUrl() {
    var phone = equstoResolveWhatsAppDigits();
    if (!phone) return "";
    var msg = window.EQUSTO_WHATSAPP_TEXT != null ? String(window.EQUSTO_WHATSAPP_TEXT) : defaultPrefill();
    if (equstoPreferDirectWhatsAppApp()) return equstoWhatsAppAppSendUrl(phone, msg);
    return equstoWhatsAppWebSendUrl(phone, msg);
  }

  function loadThreads() {
    try {
      var raw = localStorage.getItem(THREADS_KEY);
      if (!raw) return [];
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function saveThreads(arr) {
    try {
      localStorage.setItem(THREADS_KEY, JSON.stringify(arr.slice(0, 40)));
    } catch (e) {}
  }

  function pushThread(phone, body) {
    var t = loadThreads();
    var b = String(body != null ? body : "");
    var preview = b.replace(/\s+/g, " ").trim().slice(0, 96) || __waT("wa.history_empty_preview", "(boş)");
    t.unshift({
      id: String(Date.now()) + "-" + Math.random().toString(36).slice(2, 8),
      ts: Date.now(),
      phone: digitsOnly(phone),
      preview: preview,
      body: b,
    });
    saveThreads(t);
  }

  function formatChatTime(ts) {
    try {
      return new Date(ts).toLocaleString("tr-TR", { hour: "2-digit", minute: "2-digit" });
    } catch (e) {
      return "";
    }
  }

  function loadChat() {
    try {
      var raw = localStorage.getItem(CHAT_KEY);
      if (raw) {
        var arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length) return arr;
      }
    } catch (e) {}
    var migrated = [];
    loadThreads().forEach(function (row) {
      if (row && row.body) {
        migrated.push({ role: "user", body: String(row.body), ts: row.ts || Date.now() });
      }
    });
    if (!migrated.length) {
      migrated.push({
        role: "team",
        body: __waT(
          "wa.team_greeting",
          "Merhaba! Equsto ekibine yazın — mesajınız buradan iletilir, en kısa sürede yanıtlanır."
        ),
        ts: Date.now(),
      });
    }
    saveChat(migrated);
    return migrated;
  }

  function saveChat(arr) {
    try {
      localStorage.setItem(CHAT_KEY, JSON.stringify(arr.slice(-80)));
    } catch (e) {}
  }

  function appendChatMessage(role, body) {
    var arr = loadChat();
    arr.push({ role: role === "user" ? "user" : "team", body: String(body || "").trim(), ts: Date.now() });
    saveChat(arr);
    renderWaChat();
  }

  function renderWaChat() {
    var log = document.getElementById("equsto-wa-chat-log");
    if (!log) return;
    var arr = loadChat();
    log.innerHTML = "";
    arr.forEach(function (m) {
      var isUser = m.role === "user";
      var bubble = document.createElement("div");
      bubble.className = "equsto-wa-bubble equsto-wa-bubble--" + (isUser ? "user" : "team");
      var text = document.createElement("div");
      text.className = "equsto-wa-bubble__text";
      text.textContent = m.body;
      var time = document.createElement("div");
      time.className = "equsto-wa-bubble__time";
      time.textContent = formatChatTime(m.ts);
      bubble.appendChild(text);
      bubble.appendChild(time);
      log.appendChild(bubble);
    });
    requestAnimationFrame(function () {
      log.scrollTop = log.scrollHeight;
    });
  }

  function renderWaHistoryList() {
    var list = document.getElementById("equsto-wa-history");
    var empty = document.getElementById("equsto-wa-history-empty");
    if (!list) return;
    var threads = loadThreads();
    list.innerHTML = "";
    if (!threads.length) {
      if (empty) {
        empty.hidden = false;
        empty.textContent = __waT("wa.history_empty_first", "Henüz konuşma yok. İlk mesajınızı yazın.");
      }
      return;
    }
    if (empty) empty.hidden = true;
    threads.forEach(function (row) {
      if (!row || !row.id) return;
      var li = document.createElement("li");
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "equsto-wa-history-item";
      btn.setAttribute("data-id", String(row.id));
      var preview = document.createElement("span");
      preview.className = "equsto-wa-history-preview";
      preview.textContent = row.preview || __waT("wa.history_empty_preview", "(boş)");
      var meta = document.createElement("span");
      meta.className = "equsto-wa-history-meta";
      meta.textContent = formatChatTime(row.ts);
      btn.appendChild(preview);
      btn.appendChild(meta);
      btn.addEventListener("click", function () {
        selectWaHistoryItem(String(row.id));
      });
      li.appendChild(btn);
      list.appendChild(li);
    });
  }

  function selectWaHistoryItem(id) {
    var arr = loadThreads();
    var row = null;
    for (var i = 0; i < arr.length; i++) {
      if (String(arr[i].id) === id) {
        row = arr[i];
        break;
      }
    }
    if (!row) return;
    var msgEl = document.getElementById("equsto-wa-msg");
    if (msgEl && row.body) msgEl.value = String(row.body);
    renderWaChat();
  }

  function applyWaModalView() {
    var memberOn = equstoIsMember();
    var guest = document.getElementById("equsto-wa-guest");
    var member = document.getElementById("equsto-wa-member");
    var loginGuest = document.getElementById("equsto-wa-login-cta-guest");
    var loginSecondary = document.getElementById("equsto-wa-login-cta");

    if (guest) guest.style.display = memberOn ? "none" : "flex";
    if (member) member.style.display = memberOn ? "flex" : "none";
    if (loginGuest) loginGuest.href = equstoLoginHref();
    if (loginSecondary) loginSecondary.hidden = true;

    if (memberOn) {
      renderWaHistoryList();
      renderWaChat();
    }
  }

  function refreshWaHistory() {
    if (!equstoIsMember()) return;
    renderWaHistoryList();
    renderWaChat();
  }

  function equstoHideWhatsAppModal() {
    var overlay = document.getElementById("equsto-wa-overlay");
    if (!overlay) return;
    overlay.classList.remove("equsto-wa-overlay--open");
    overlay.style.display = "none";
    overlay.style.pointerEvents = "none";
    overlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    try {
      document.removeEventListener("keydown", equstoWaModalOnKey);
    } catch (e) {}
    if (waModalResizeHandler) {
      try {
        window.removeEventListener("resize", waModalResizeHandler);
      } catch (e2) {}
      waModalResizeHandler = null;
    }
  }

  function equstoWaModalOnKey(ev) {
    if (ev.key === "Escape") {
      ev.preventDefault();
      equstoHideWhatsAppModal();
    }
  }

  function equstoLoginHref() {
    try {
      if (typeof window.equstoResolveNavHref === "function") {
        return window.equstoResolveNavHref("login.html");
      }
    } catch (_) {}
    return "/login.html";
  }

  function equstoShowWhatsAppModal(phoneDigits, plainText) {
    mountWaModal();
    purgeWaModalLegacyLogout();
    var overlay = document.getElementById("equsto-wa-overlay");
    var msgEl = document.getElementById("equsto-wa-msg");
    var spin = document.getElementById("equsto-wa-spinner");
    var pane = document.getElementById("equsto-wa-pane");
    var guest = document.getElementById("equsto-wa-guest");
    var member = document.getElementById("equsto-wa-member");
    var titleEl = document.getElementById("equsto-wa-modal-title");
    if (!overlay || !spin || !pane || !member) return;

    waModalDigits = digitsOnly(phoneDigits) || equstoResolveWhatsAppDigits();
    if (msgEl) msgEl.value = plainText != null ? String(plainText) : "";

    spin.style.display = "flex";
    pane.style.display = "none";
    if (guest) guest.style.display = "none";
    member.style.display = "none";

    overlay.classList.add("equsto-wa-overlay--open");
    overlay.style.display = "block";
    overlay.style.pointerEvents = "auto";
    overlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", equstoWaModalOnKey);

    syncWaModalNearFab();
    waModalResizeHandler = syncWaModalNearFab;
    window.addEventListener("resize", waModalResizeHandler);

    if (titleEl) titleEl.textContent = __waT("wa.modal_title", "Mr. Equsto");

    window.setTimeout(function () {
      spin.style.display = "none";
      pane.style.display = "flex";
      applyWaModalView();
      syncWaModalNearFab();
      syncWaModalAuthBtn();
      if (equstoIsMember() && msgEl) {
        try {
          msgEl.focus();
        } catch (e) {}
      } else {
        var loginGuest = document.getElementById("equsto-wa-login-cta-guest");
        if (loginGuest) {
          try {
            loginGuest.focus();
          } catch (e) {}
        }
      }
    }, 280);
  }

  function equstoWaOpenWithMessage(plainText) {
    var text = plainText != null ? String(plainText) : "";
    if (equstoPreferDirectWhatsAppApp()) {
      equstoHideWhatsAppModal();
      equstoOpenWhatsAppDirect(waModalDigits, text);
      return;
    }
    var url = equstoWhatsAppWebSendUrl(waModalDigits, text);
    if (!url) return;
    pushThread(waModalDigits, text);
    equstoHideWhatsAppModal();
    var tab = window.open(url, "_blank");
    if (!tab) {
      window.location.assign(url);
    } else {
      try {
        tab.opener = null;
        tab.focus();
      } catch (e) {}
    }
  }

  function equstoWaSubmitFromModal() {
    if (!equstoIsMember()) {
      equstoWaLoginClick(null);
      return;
    }
    var msgEl = document.getElementById("equsto-wa-msg");
    var st = document.getElementById("equsto-wa-status");
    var go = document.getElementById("equsto-wa-go");
    if (!msgEl) return;
    var text = String(msgEl.value || "").trim();
    if (!text) {
      if (st) {
        st.textContent = __waT("wa.write_msg", "Lütfen bir mesaj yazın.");
        st.className = "equsto-wa-status equsto-wa-status--err";
      }
      return;
    }
    if (go) {
      go.disabled = true;
      go.textContent = __waT("wa.sending", "Gönderiliyor…");
    }
    if (st) {
      st.textContent = "";
      st.className = "equsto-wa-status";
    }

    appendChatMessage("user", text);
    try {
      pushThread(waModalDigits, text);
    } catch (e) {}

    var payload = {
      mesaj: text,
      kaynak: "whatsapp-modal",
      sayfa: location.pathname || "",
      telefon: waModalDigits || equstoResolveWhatsAppDigits() || "",
    };
    if (equstoIsMember() && typeof window.equstoGetMemberProfile === "function") {
      try {
        var prof = window.equstoGetMemberProfile();
        if (prof) {
          if (prof.ad) payload.ad = prof.ad;
          if (prof.telefon) payload.telefon = prof.telefon;
          if (prof.eposta) payload.eposta = prof.eposta;
        }
      } catch (e2) {}
    }

    fetch(eqMsgApiBase() + "/musteriler", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(function (r) {
        return r.json().then(function (j) {
          return { ok: r.ok, j: j };
        });
      })
      .then(function (res) {
        if (go) {
          go.disabled = false;
          go.textContent = __waT("wa.send", "Gönder");
        }
        if (!res.ok || !(res.j && res.j.success)) {
          var msg = (res.j && (res.j.error || res.j.message)) || __waT("wa.send_failed", "Gönderilemedi");
          if (st) {
            st.textContent = msg;
            st.className = "equsto-wa-status equsto-wa-status--err";
          }
          return;
        }
        msgEl.value = "";
        appendChatMessage(
          "team",
          __waT(
            "wa.received",
            "Mesajınız alındı. Equsto ekibi en kısa sürede size dönüş yapacak."
          )
        );
        renderWaHistoryList();
        if (st) {
          st.textContent = "";
          st.className = "equsto-wa-status equsto-wa-status--ok";
        }
      })
      .catch(function (err) {
        if (go) {
          go.disabled = false;
          go.textContent = __waT("wa.send", "Gönder");
        }
        var em = err && err.message ? err.message : String(err);
        if (st) {
          st.textContent = __waT("wa.server_unreachable", "Sunucuya ulaşılamadı: ") + em;
          st.className = "equsto-wa-status equsto-wa-status--err";
        }
      });
  }

  function purgeWaModalLegacyLogout() {
    var legacy = document.getElementById("equsto-wa-logout");
    if (legacy) legacy.remove();
  }

  function syncWaModalAuthBtn() {
    purgeWaModalLegacyLogout();
    applyWaModalView();
  }

  function equstoWaLoginClick(ev) {
    if (ev && ev.preventDefault) ev.preventDefault();
    equstoHideWhatsAppModal();
    window.location.href = equstoLoginHref();
  }

  /**
   * PFOS, sepet vb.: önce sayfa-içi kart.
   */
  window.equstoOpenWhatsAppWebWindow = function (phoneDigits, plainText) {
    var phone = digitsOnly(phoneDigits);
    if (equstoPreferDirectWhatsAppApp()) {
      equstoOpenWhatsAppDirect(phone, plainText != null ? plainText : "");
      return null;
    }
    equstoShowWhatsAppModal(phone, plainText != null ? plainText : "");
    return null;
  };

  function equstoWaClickFromPcCat(ev) {
    try {
      var el = ev && (ev.currentTarget || ev.target);
      return !!(el && el.closest && el.closest("#equsto-contact-fab"));
    } catch (_) {
      return false;
    }
  }

  window.equstoOpenWhatsApp = function (ev) {
    if (ev && ev.preventDefault) ev.preventDefault();
    var phone = equstoResolveWhatsAppDigits();
    if (!phone) {
      window.alert(
        __waT(
          "wa.no_phone_config",
          "WhatsApp numarası henüz siteye eklenmedi.\n\nYönetici: public/contact.js içinde EQUSTO_WHATSAPP_E164 değerini ayarlayın (ör. 905551112233)."
        )
      );
      return false;
    }
    var msg = window.EQUSTO_WHATSAPP_TEXT != null ? String(window.EQUSTO_WHATSAPP_TEXT) : defaultPrefill();

    /* PC yüzen kedi: sayfa-içi sohbet kartı */
    if (equstoWaClickFromPcCat(ev)) {
      equstoShowWhatsAppModal(phone, msg);
      return false;
    }

    /* Mobil alt şerit: doğrudan WhatsApp uygulaması */
    if (
      equstoPreferDirectWhatsAppApp() ||
      (document.body && document.body.classList.contains("eq-has-bottom-tabbar"))
    ) {
      return equstoOpenWhatsAppDirect(phone, msg);
    }
    window.equstoOpenWhatsAppWebWindow(phone, msg);
    return false;
  };

  window.equstoGetWhatsAppUrl = equstoWhatsAppUrl;

  function mountWaModal() {
    var existing = document.getElementById("equsto-wa-overlay");
    if (existing && existing.getAttribute("data-wa-build") === String(WA_MODAL_BUILD)) return;
    if (existing) existing.remove();

    var overlay = document.createElement("div");
    overlay.id = "equsto-wa-overlay";
    overlay.className = "equsto-wa-overlay";
    overlay.setAttribute("data-wa-build", String(WA_MODAL_BUILD));
    overlay.setAttribute("aria-hidden", "true");
    overlay.style.cssText =
      "display:none;position:fixed;inset:0;z-index:10050;pointer-events:none;";

    var waHeadImg =
      '<img class="equsto-wa-ico-img" src="' +
      WA_FAB_IMG +
      '" alt="" width="40" height="40" decoding="async">';

    overlay.innerHTML =
      '<div class="equsto-wa-backdrop" tabindex="-1"></div>' +
      '<div class="equsto-wa-modal" role="dialog" aria-modal="true" aria-labelledby="equsto-wa-modal-title">' +
      '<div class="equsto-wa-modal-head">' +
      '<button type="button" class="equsto-wa-back" aria-label="' +
      escWa(__waT("wa.close_aria", "Kapat")) +
      '" data-i18n-attr="aria-label:wa.close_aria">&#8249;</button>' +
      '<div class="equsto-wa-ico equsto-wa-ico--cat" aria-hidden="true">' +
      waHeadImg +
      "</div>" +
      '<h2 class="equsto-wa-title" id="equsto-wa-modal-title" data-i18n="wa.modal_title">Mr. Equsto</h2>' +
      '<button type="button" class="equsto-wa-close-x" id="equsto-wa-close-x" aria-label="' +
      escWa(__waT("wa.close_aria", "Kapat")) +
      '" data-i18n-attr="aria-label:wa.close_aria">&#10005;</button>' +
      "</div>" +
      '<div class="equsto-wa-modal-body">' +
      '<div class="equsto-wa-spinner-wrap" id="equsto-wa-spinner"><div class="equsto-wa-spinner" aria-hidden="true"></div></div>' +
      '<div class="equsto-wa-pane" id="equsto-wa-pane">' +
      '<div class="equsto-wa-guest" id="equsto-wa-guest">' +
      '<div class="equsto-wa-guest-login-wrap">' +
      '<a class="equsto-wa-login-only" id="equsto-wa-login-cta-guest" href="/login.html" data-i18n="wa.login_guest">Üye Girişi</a>' +
      "</div>" +
      "</div>" +
      '<div class="equsto-wa-member" id="equsto-wa-member">' +
      '<div class="equsto-wa-history-wrap">' +
      '<div class="equsto-wa-history-head" data-i18n="wa.history_head">Geçmiş konuşmalar</div>' +
      '<ul class="equsto-wa-history" id="equsto-wa-history"></ul>' +
      '<p class="equsto-wa-history-empty" id="equsto-wa-history-empty" hidden data-i18n="wa.history_empty">Henüz konuşma yok.</p>' +
      "</div>" +
      '<div class="equsto-wa-chat-wrap">' +
      '<div class="equsto-wa-chat-log" id="equsto-wa-chat-log" role="log" aria-live="polite"></div>' +
      "</div>" +
      '<div class="equsto-wa-compose equsto-wa-compose--chat">' +
      '<textarea id="equsto-wa-msg" class="equsto-wa-msg equsto-wa-msg--chat" rows="3" maxlength="8000" placeholder="' +
      escWa(__waT("wa.msg_ph", "Mesajınızı yazın…")) +
      '" data-i18n-attr="placeholder:wa.msg_ph"></textarea>' +
      '<p class="equsto-wa-status" id="equsto-wa-status" role="status" aria-live="polite"></p>' +
      '<button type="button" class="equsto-wa-go" id="equsto-wa-go" data-i18n="wa.send">Gönder</button>' +
      '<a class="equsto-wa-login-secondary" id="equsto-wa-login-cta" href="/login.html" hidden data-i18n="wa.login_guest">Üye Girişi</a>' +
      "</div>" +
      "</div>" +
      "</div>" +
      "</div>" +
      "</div>" +
      "</div>";

    document.body.appendChild(overlay);

    if (typeof window.eqI18nApply === "function") {
      window.eqI18nApply(overlay);
    }

    overlay.querySelector(".equsto-wa-backdrop").addEventListener("click", equstoHideWhatsAppModal);
    overlay.querySelector(".equsto-wa-back").addEventListener("click", equstoHideWhatsAppModal);
    overlay.querySelector("#equsto-wa-close-x").addEventListener("click", equstoHideWhatsAppModal);
    overlay.querySelector("#equsto-wa-go").addEventListener("click", equstoWaSubmitFromModal);
    var loginCtaEl = overlay.querySelector("#equsto-wa-login-cta");
    if (loginCtaEl) loginCtaEl.addEventListener("click", equstoWaLoginClick);
    var loginGuestEl = overlay.querySelector("#equsto-wa-login-cta-guest");
    if (loginGuestEl) loginGuestEl.addEventListener("click", equstoWaLoginClick);
    document.addEventListener("equsto-member-session", syncWaModalAuthBtn);
    document.addEventListener("equsto-member-changed", syncWaModalAuthBtn);
    var waMsgInput = overlay.querySelector("#equsto-wa-msg");
    if (waMsgInput) {
      waMsgInput.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter" && !ev.shiftKey) {
          ev.preventDefault();
          equstoWaSubmitFromModal();
        }
      });
    }

    overlay.querySelector(".equsto-wa-modal").addEventListener("click", function (ev) {
      ev.stopPropagation();
    });

    var pane = document.getElementById("equsto-wa-pane");
    if (pane) pane.style.display = "none";
  }

  var WA_TABBAR_SVG =
    '<span class="eq-bottom-tabbar__ico eq-bottom-tabbar__ico--wa" aria-hidden="true">' +
    '<svg viewBox="0 0 24 24" width="28" height="28" focusable="false">' +
    '<path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.883 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>' +
    "</svg></span>";

  function createWaTabbarButton() {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "eq-bottom-tabbar__btn equsto-contact-wa-fab equsto-contact-wa-fab--tabbar";
    btn.setAttribute("data-eq-bnav", "whatsapp");
    btn.title = __waT("wa.fab_title", "WhatsApp");
    btn.setAttribute("aria-label", __waT("wa.fab_aria", "WhatsApp ile yazın"));
    btn.innerHTML = WA_TABBAR_SVG;
    btn.addEventListener("click", window.equstoOpenWhatsApp);
    return btn;
  }

  function removeFloatingFab() {
    document.querySelectorAll("#equsto-contact-fab, .equsto-contact-fab").forEach(function (el) {
      if (el.closest("#eq-bottom-tabbar")) return;
      el.remove();
    });
    document.querySelectorAll(".equsto-contact-wa-fab img[src*='bize-ulasin']").forEach(function (img) {
      var btn = img.closest(".equsto-contact-wa-fab");
      if (btn && !btn.classList.contains("equsto-contact-wa-fab--tabbar")) {
        var wrap = btn.closest("#equsto-contact-fab") || btn;
        if (wrap.id === "equsto-contact-fab" || wrap.classList.contains("equsto-contact-fab")) wrap.remove();
        else btn.remove();
      }
    });
  }

  function mountFloatingFab() {
    if (document.getElementById("equsto-contact-fab")) return;
    if (window.matchMedia("(max-width: 768px)").matches) return;
    if (document.body && document.body.classList.contains("admin-app")) return;

    var wrap = document.createElement("div");
    wrap.id = "equsto-contact-fab";
    wrap.className = "equsto-contact-fab";
    wrap.style.cssText =
      "position:fixed;right:max(16px,env(safe-area-inset-right,0px));bottom:max(16px,env(safe-area-inset-bottom,0px));" +
      "z-index:9999;display:flex;flex-direction:column;gap:10px;align-items:flex-end;pointer-events:none;" +
      "width:auto;height:auto;max-width:80px;max-height:80px;box-sizing:border-box;";

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "equsto-contact-wa-fab";
    btn.title = __waT("wa.fab_title", "WhatsApp");
    btn.setAttribute("aria-label", __waT("wa.fab_aria", "WhatsApp ile yazın"));
    btn.addEventListener("click", window.equstoOpenWhatsApp);

    var img = document.createElement("img");
    img.src = WA_FAB_IMG;
    img.alt = "";
    img.width = 62;
    img.height = 62;
    img.decoding = "async";
    img.style.cssText =
      "display:block;width:62px;height:62px;max-width:62px;max-height:62px;object-fit:cover;border-radius:15px;";
    img.addEventListener("error", function () {
      btn.innerHTML = WA_TABBAR_SVG;
      btn.classList.add("equsto-contact-wa-fab--svg-fallback");
    });

    btn.appendChild(img);
    wrap.appendChild(btn);
    document.body.appendChild(wrap);
  }

  function mountFabInTabbar() {
    var slot = document.getElementById("eq-bnav-wa-slot");
    if (!slot) return false;
    removeFloatingFab();
    slot.innerHTML = "";
    slot.appendChild(createWaTabbarButton());
    document.body.classList.add("eq-wa-in-tabbar");
    return true;
  }

  window.equstoMountContactFabInTabbar = function () {
    if (!window.matchMedia("(max-width: 768px)").matches) return;
    if (!document.body || !document.body.classList.contains("eq-has-bottom-tabbar")) return;
    mountFabInTabbar();
  };

  function syncFabPlacement() {
    var mobile = window.matchMedia("(max-width: 768px)").matches;
    var inBar = document.body && document.body.classList.contains("eq-has-bottom-tabbar");
    if (mobile && inBar && document.getElementById("eq-bnav-wa-slot")) {
      removeFloatingFab();
      mountFabInTabbar();
      return;
    }
    var slot = document.getElementById("eq-bnav-wa-slot");
    if (slot) slot.innerHTML = "";
    document.body.classList.remove("eq-wa-in-tabbar");
    removeFloatingFab();
    mountFloatingFab();
  }

  function ensureMsgModal() {
    var ov = document.getElementById("equsto-msg-overlay");
    if (ov) return ov;
    ov = document.createElement("div");
    ov.id = "equsto-msg-overlay";
    ov.style.cssText =
      "display:none;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9998;align-items:center;" +
      "justify-content:center;padding:16px;";
    ov.innerHTML =
      '<div id="equsto-msg-panel" style="width:100%;max-width:420px;background:var(--eq-surface,#fff);color:var(--eq-text,#111);' +
      'border-radius:12px;box-shadow:0 14px 44px rgba(0,0,0,.24);border:1px solid var(--eq-border,#e5e5e5);overflow:hidden;">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid var(--eq-border,#e5e5e5);">' +
      '<strong style="font-size:14px;">Bize ulaşın</strong>' +
      '<button type="button" id="equsto-msg-close" aria-label="Kapat" style="border:none;background:transparent;cursor:pointer;font-size:18px;line-height:1;color:inherit;padding:4px 8px;">✕</button>' +
      '</div>' +
      '<form id="equsto-msg-form" style="padding:14px 16px;display:flex;flex-direction:column;gap:10px;">' +
      '<label style="font-size:11px;color:var(--eq-text-muted,#888);">Ad Soyad<input id="eq-msg-ad" required type="text" autocomplete="name" style="margin-top:4px;width:100%;padding:9px 10px;font-size:13px;border:1px solid var(--eq-border,#e5e5e5);border-radius:6px;background:var(--eq-surface,#fff);color:inherit;"></label>' +
      '<label style="font-size:11px;color:var(--eq-text-muted,#888);">Telefon<input id="eq-msg-tel" required type="tel" autocomplete="tel" placeholder="0532…" style="margin-top:4px;width:100%;padding:9px 10px;font-size:13px;border:1px solid var(--eq-border,#e5e5e5);border-radius:6px;background:var(--eq-surface,#fff);color:inherit;"></label>' +
      '<label style="font-size:11px;color:var(--eq-text-muted,#888);">E-posta<input id="eq-msg-mail" type="email" autocomplete="email" style="margin-top:4px;width:100%;padding:9px 10px;font-size:13px;border:1px solid var(--eq-border,#e5e5e5);border-radius:6px;background:var(--eq-surface,#fff);color:inherit;"></label>' +
      '<label style="font-size:11px;color:var(--eq-text-muted,#888);">Mesaj<textarea id="eq-msg-not" rows="3" style="margin-top:4px;width:100%;padding:9px 10px;font-size:13px;border:1px solid var(--eq-border,#e5e5e5);border-radius:6px;background:var(--eq-surface,#fff);color:inherit;resize:vertical;"></textarea></label>' +
      '<div id="equsto-msg-status" style="font-size:11px;min-height:14px;color:var(--eq-text-muted,#888);"></div>' +
      '<button type="submit" id="eq-msg-submit" style="margin-top:4px;padding:10px 14px;font-size:13px;font-weight:600;background:var(--eq-topnav-dept-bg,#001e50);color:#fff;border:none;border-radius:6px;cursor:pointer;">Gönder</button>' +
      '</form></div>';
    document.body.appendChild(ov);
    ov.addEventListener("click", function (e) { if (e.target === ov) closeMsgModal(); });
    document.getElementById("equsto-msg-close").addEventListener("click", closeMsgModal);
    document.getElementById("equsto-msg-form").addEventListener("submit", submitMsgForm);
    return ov;
  }

  function openMsgModal() {
    ensureMsgModal().style.display = "flex";
    setTimeout(function () { var f = document.getElementById("eq-msg-ad"); if (f) f.focus(); }, 30);
  }

  function closeMsgModal() {
    var ov = document.getElementById("equsto-msg-overlay");
    if (ov) ov.style.display = "none";
    var st = document.getElementById("equsto-msg-status");
    if (st) { st.textContent = ""; st.style.color = "var(--eq-text-muted,#888)"; }
  }

  function eqMsgApiBase() {
    if (typeof window.EQUSTO_API_BASE === "string") return window.EQUSTO_API_BASE.replace(/\/$/, "");
    var h = (location.hostname || "").toLowerCase();
    var port = String(location.port || "");
    /* Next.js (3000) / Vercel: aynı kök /api; eski Node API yalnızca :3001 */
    if (h === "127.0.0.1" || h === "localhost") {
      if (port === "3000" || port === "3002") return "/api";
      if (port === "3001") return "http://127.0.0.1:3001/api";
      return "/api";
    }
    return "/api";
  }

  function submitMsgForm(e) {
    e.preventDefault();
    var ad = (document.getElementById("eq-msg-ad").value || "").trim();
    var tel = (document.getElementById("eq-msg-tel").value || "").trim();
    var mail = (document.getElementById("eq-msg-mail").value || "").trim();
    var not = (document.getElementById("eq-msg-not").value || "").trim();
    var st = document.getElementById("equsto-msg-status");
    var sb = document.getElementById("eq-msg-submit");
    if (!ad || !tel) {
      if (st) { st.textContent = "Ad ve telefon zorunlu."; st.style.color = "#c0392b"; }
      return;
    }
    if (sb) { sb.disabled = true; sb.textContent = "Gönderiliyor…"; }
    if (st) { st.textContent = ""; st.style.color = "var(--eq-text-muted,#888)"; }
    var payload = {
      ad: ad, telefon: tel, eposta: mail, mesaj: not,
      kaynak: "iletisim-fab",
      sayfa: location.pathname || "",
    };
    fetch(eqMsgApiBase() + "/musteriler", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        if (sb) { sb.disabled = false; sb.textContent = "Gönder"; }
        if (!res.ok || !(res.j && res.j.success)) {
          var msg = (res.j && (res.j.error || res.j.message)) || "HTTP hata";
          if (st) { st.textContent = "Gönderilemedi: " + msg; st.style.color = "#c0392b"; }
          return;
        }
        if (st) { st.textContent = "Mesajınız alındı. En kısa sürede ulaşırız."; st.style.color = "#1e7a45"; }
        var form = document.getElementById("equsto-msg-form");
        if (form) form.reset();
        setTimeout(closeMsgModal, 1600);
      })
      .catch(function (err) {
        if (sb) { sb.disabled = false; sb.textContent = "Gönder"; }
        var em = err && err.message ? err.message : String(err);
        if (st) { st.textContent = "Sunucuya ulaşılamadı: " + em; st.style.color = "#c0392b"; }
      });
  }

  function init() {
    if (document.body && document.body.classList.contains("admin-app")) return;
    mountWaModal();
    syncFabPlacement();
    try {
      if (typeof window.eqSyncMobileChrome === "function") window.eqSyncMobileChrome();
      else if (typeof window.eqClearDesktopChrome === "function") window.eqClearDesktopChrome();
    } catch (_) {}
    var tries = 0;
    var waitTabbar = setInterval(function () {
      if (mountFabInTabbar() || ++tries > 48) clearInterval(waitTabbar);
    }, 50);
    window.addEventListener("resize", syncFabPlacement, { passive: true });
    window.addEventListener("load", syncFabPlacement, { once: true });
  }

  window.equstoSyncContactFab = syncFabPlacement;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  document.addEventListener("equsto:i18n-ready", function () {
    try {
      syncFabPlacement();
      if (typeof window.eqI18nApply === "function") {
        window.eqI18nApply(document.getElementById("equsto-wa-overlay"));
      }
    } catch (_) {}
  });
})();
