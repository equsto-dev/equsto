/**
 * equsto.com — WhatsApp (mobil alt şerit + sayfa-içi kedi sohbeti)
 * wa.me / WhatsApp uygulaması açılmaz; kullanıcı Mr. Equsto kartında yazar.
 *
 * window.EQUSTO_WHATSAPP_E164 bu scriptten önce tanımlanarak geçilebilir.
 * Üye bayrağı: equsto-member.js → equstoSetMemberActive / equstoIsMemberLoggedIn
 */
(function () {
  window.EQUSTO_WHATSAPP_E164 = window.EQUSTO_WHATSAPP_E164 || "905326840152";

  try {
    fetch("/api/magaza-ayarlar", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        var d = j && j.data ? j.data : null;
        if (!d) return;
        if (d.whatsapp_e164) window.EQUSTO_WHATSAPP_E164 = String(d.whatsapp_e164);
        if (d.whatsapp_prefill) window.EQUSTO_WHATSAPP_TEXT = String(d.whatsapp_prefill);
      })
      .catch(function () {});
  } catch (_) {}

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
  /** Kilit: public/whatsapp-cat-fab-KILIT.txt — npm run verify:whatsapp-cat-fab-kilit */
  var WA_FAB_IMG = "/equsto-bize-ulasin-isimlik.png";
  /** Modal şablonu değişince artırın (eski DOM'u zorla yeniler). */
  var WA_MODAL_BUILD = 25;

  var waModalDigits = "";
  var waModalLastSentText = "";
  var waModalResizeHandler = null;
  var waPollTimer = null;
  var waServerSyncTs = 0;

  function syncWaModalNearFab() {
    var fab = document.querySelector(".equsto-contact-wa-fab");
    var modal = document.querySelector(".equsto-wa-modal");
    if (!modal) return;
    if (window.matchMedia("(max-width: 768px)").matches) {
      modal.style.right = "";
      modal.style.bottom = "";
      modal.style.maxHeight = "";
      return;
    }
    if (!fab) return;
    var gap = 10;
    var r = fab.getBoundingClientRect();
    modal.style.right = Math.max(8, Math.round(window.innerWidth - r.right)) + "px";
    modal.style.bottom = Math.max(8, Math.round(window.innerHeight - r.top + gap)) + "px";
    var spaceAbove = r.top - gap - 12;
    var mh = Math.min(Math.round(window.innerHeight * 0.9), Math.max(420, spaceAbove));
    modal.style.maxHeight = mh + "px";
  }

  function digitsOnly(s) {
    return String(s || "").replace(/\D/g, "");
  }

  function equstoIsMember() {
    if (typeof window.equstoIsMemberLoggedIn === "function") {
      return window.equstoIsMemberLoggedIn();
    }
    try {
      var o = JSON.parse(localStorage.getItem("equsto_member_v1") || "null");
      if (!o || o.active !== true) return false;
      if (o.expiresAt && Number(o.expiresAt) < Date.now()) return false;
      return !!String(o.token || "").trim();
    } catch (e) {
      return false;
    }
  }

  function equstoMemberToken() {
    if (typeof window.equstoGetMemberToken === "function") {
      var t = window.equstoGetMemberToken();
      if (t) return String(t);
    }
    try {
      var o = JSON.parse(localStorage.getItem("equsto_member_v1") || "null");
      return o && o.token ? String(o.token).trim() : "";
    } catch (e) {}
    return "";
  }

  /** WhatsApp modal API — geçerli sunucu oturumu (token) gerekir */
  function equstoWaApiSessionOk() {
    return equstoIsMember() && !!equstoMemberToken();
  }

  function waitForMemberScripts(done, tries) {
    tries = tries || 0;
    if (typeof window.equstoIsMemberLoggedIn === "function" || tries >= 80) {
      done();
      return;
    }
    setTimeout(function () {
      waitForMemberScripts(done, tries + 1);
    }, 40);
  }

  function ensureWaMemberSession(done) {
    done = typeof done === "function" ? done : function () {};
    waitForMemberScripts(function () {
      if (equstoWaApiSessionOk()) {
        done(true);
        return;
      }
      if (!equstoIsMember()) {
        done(false);
        return;
      }
      function runValidate() {
        if (typeof window.equstoAuthValidateSession !== "function") {
          done(equstoWaApiSessionOk());
          return;
        }
        window
          .equstoAuthValidateSession()
          .then(function (ok) {
            done(!!ok || equstoWaApiSessionOk());
          })
          .catch(function () {
            done(equstoWaApiSessionOk());
          });
      }
      if (typeof window.equstoAuthValidateSession === "function") {
        runValidate();
        return;
      }
      var authTries = 0;
      (function waitAuth() {
        if (typeof window.equstoAuthValidateSession === "function") {
          runValidate();
          return;
        }
        if (authTries++ >= 80) {
          done(equstoWaApiSessionOk());
          return;
        }
        setTimeout(waitAuth, 40);
      })();
    });
  }

  function equstoAuthReturnPath() {
    try {
      return location.pathname + location.search;
    } catch (e) {}
    return "/";
  }

  function equstoLoginHref() {
    var next = encodeURIComponent(equstoAuthReturnPath());
    try {
      if (typeof window.equstoUrl === "function") {
        return window.equstoUrl("login") + "?next=" + next;
      }
      if (typeof window.equstoResolveNavHref === "function") {
        return window.equstoResolveNavHref("login.html") + "?next=" + next;
      }
    } catch (e) {}
    return "/login?next=" + next;
  }

  function equstoRegisterHref() {
    var next = encodeURIComponent(equstoAuthReturnPath());
    return "/login?mode=register&next=" + next;
  }

  function syncWaLoginGateLinks() {
    var loginBtn = document.getElementById("equsto-wa-login-gate-btn");
    var regBtn = document.getElementById("equsto-wa-register-gate-btn");
    var loginHref = equstoLoginHref();
    var regHref = equstoRegisterHref();
    if (loginBtn) loginBtn.setAttribute("href", loginHref);
    if (regBtn) regBtn.setAttribute("href", regHref);
  }

  function equstoMemberPhoneOk() {
    try {
      if (typeof window.equstoMemberHasPhone === "function") {
        return !!window.equstoMemberHasPhone();
      }
      if (typeof window.equstoGetMemberProfile !== "function") return false;
      var p = window.equstoGetMemberProfile();
      var d = digitsOnly(p && (p.telefon || p.phone || ""));
      if (d.length === 11 && d.charAt(0) === "0") d = d.slice(1);
      if (d.length === 12 && d.indexOf("90") === 0) d = d.slice(2);
      return d.length === 10 && d.charAt(0) === "5";
    } catch (e) {}
    return false;
  }

  function equstoHesabimPhoneHref() {
    try {
      if (typeof window.equstoUrl === "function") {
        return window.equstoUrl("account") + "#guvenlik";
      }
    } catch (e) {}
    return "/hesabim#guvenlik";
  }

  function syncWaPhoneGateLink() {
    var btn = document.getElementById("equsto-wa-phone-gate-btn");
    if (btn) btn.setAttribute("href", equstoHesabimPhoneHref());
  }

  /** PFOS teklif ve Mr. Equsto WhatsApp — üye oturumu */
  function applyWaModalView() {
    var memberEl = document.getElementById("equsto-wa-member");
    var loginGate = document.getElementById("equsto-wa-login-gate");
    var phoneGate = document.getElementById("equsto-wa-phone-gate");
    var pane = document.getElementById("equsto-wa-pane");
    var logged = equstoIsMember();
    if (logged) {
      if (loginGate) loginGate.hidden = true;
      if (!equstoMemberPhoneOk()) {
        if (phoneGate) phoneGate.hidden = false;
        if (pane) pane.style.display = "none";
        if (memberEl) memberEl.style.display = "none";
        syncWaPhoneGateLink();
        return;
      }
      if (phoneGate) phoneGate.hidden = true;
      if (pane) pane.style.display = "flex";
      if (memberEl) memberEl.style.display = "flex";
      renderWaHistoryList();
      renderWaChat();
    } else {
      if (memberEl) memberEl.style.display = "none";
      if (loginGate) loginGate.hidden = false;
      if (phoneGate) phoneGate.hidden = true;
      if (pane) pane.style.display = "none";
      syncWaLoginGateLinks();
    }
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
  window.equstoOpenWhatsAppDirect = equstoOpenWhatsAppDirect;

  /** Site mesajı → wa.me metni (sayfa bağlamı ile) */
  function equstoBuildWaHandoffMessage(userText) {
    var intro = defaultPrefill();
    var body = String(userText || "").trim();
    var lines = [intro];
    if (body) lines.push("", body);
    try {
      var path = location.pathname || "";
      if (path && path !== "/") {
        lines.push("", "Sayfa: " + location.origin + path);
      }
    } catch (e) {}
    return lines.join("\n").trim();
  }

  /**
   * Resmi handoff: ziyaretçi WhatsApp'ta Gönder'e basınca mesaj iş numaranıza düşer.
   * @returns {{ ok: boolean, mode?: string, reason?: string, url?: string }}
   */
  function equstoHandoffToWhatsApp(phoneDigits, userText) {
    var phone = digitsOnly(phoneDigits) || equstoResolveWhatsAppDigits();
    if (!phone || phone.length < 10) {
      return { ok: false, reason: "no_phone" };
    }
    var full = equstoBuildWaHandoffMessage(userText);
    try {
      pushThread(phone, full);
    } catch (e) {}

    if (equstoPreferDirectWhatsAppApp()) {
      equstoOpenWhatsAppDirect(phone, full);
      return { ok: true, mode: "app" };
    }

    var url = equstoWhatsAppWebSendUrl(phone, full);
    if (!url) return { ok: false, reason: "no_url" };
    var tab = window.open(url, "_blank", "noopener,noreferrer");
    if (!tab) {
      return { ok: false, reason: "blocked", url: url };
    }
    try {
      tab.opener = null;
      tab.focus();
    } catch (e) {}
    return { ok: true, mode: "web" };
  }
  window.equstoHandoffToWhatsApp = equstoHandoffToWhatsApp;

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

  function mergeServerWaMessages(serverRows, replaceAll) {
    if (!Array.isArray(serverRows)) return false;
    if (replaceAll && !serverRows.length) return false;
    var arr = replaceAll ? [] : loadChat();
    var seen = {};
    arr.forEach(function (m) {
      if (m.sid) seen[m.sid] = true;
    });
    var changed = false;
    serverRows.forEach(function (row) {
      if (!row || !row.body) return;
      var sid = row.id ? String(row.id) : "";
      if (sid && seen[sid]) return;
      if (sid) seen[sid] = true;
      arr.push({
        role: row.role === "user" ? "user" : "team",
        body: String(row.body),
        ts: row.ts || Date.now(),
        sid: sid || undefined,
      });
      changed = true;
      if (row.ts && row.ts > waServerSyncTs) waServerSyncTs = row.ts;
    });
    if (!changed) return false;
    arr.sort(function (a, b) {
      return (a.ts || 0) - (b.ts || 0);
    });
    saveChat(arr.slice(-80));
    return true;
  }

  function syncWaChatFromServer(full, done) {
    done = typeof done === "function" ? done : function () {};
    if (!equstoWaApiSessionOk()) {
      done(false);
      return;
    }
    var tok = equstoMemberToken();
    if (!tok) {
      done(false);
      return;
    }
    var url = eqMsgApiBase() + "/whatsapp/chat";
    if (!full && waServerSyncTs > 0) {
      url += "?since=" + encodeURIComponent(new Date(waServerSyncTs).toISOString());
    }
    fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: {
        Authorization: "Bearer " + tok,
        "X-Equsto-Authorization": tok,
      },
    })
      .then(function (r) {
        return r.json().then(function (j) {
          return { ok: r.ok, j: j };
        });
      })
      .then(function (res) {
        if (!res.ok || !(res.j && res.j.success)) {
          done(false);
          return;
        }
        var data = res.j.data || res.j;
        var rows = data.messages || [];
        if (typeof data.lastTs === "number" && data.lastTs > waServerSyncTs) {
          waServerSyncTs = data.lastTs;
        }
        if (mergeServerWaMessages(rows, !!full)) renderWaChat();
        done(true);
      })
      .catch(function () {
        done(false);
      });
  }

  function startWaChatPoll() {
    stopWaChatPoll();
    if (!equstoWaApiSessionOk()) return;
    syncWaChatFromServer(true);
    waPollTimer = window.setInterval(function () {
      syncWaChatFromServer(false);
    }, 4000);
  }

  function stopWaChatPoll() {
    if (waPollTimer) {
      window.clearInterval(waPollTimer);
      waPollTimer = null;
    }
  }

  function appendChatMessage(role, body) {
    var arr = loadChat();
    arr.push({ role: role === "user" ? "user" : "team", body: String(body || "").trim(), ts: Date.now() });
    saveChat(arr);
    renderWaChat();
  }

  function popLastUserChatMessage(expectedBody) {
    var arr = loadChat();
    if (!arr.length) return;
    var last = arr[arr.length - 1];
    if (last.role !== "user") return;
    if (expectedBody && String(last.body).trim() !== String(expectedBody).trim()) return;
    arr.pop();
    saveChat(arr);
    renderWaChat();
  }

  /**
   * PFOS teklif e-posta/WhatsApp gönderimi → Mr. Equsto modal geçmişine (yalnızca üye).
   * Gerçek PDF Green API / Resend ile gider; modal site içi kayıttır.
   */
  window.equstoWaRecordDelivery = function (opts) {
    if (!opts || typeof opts !== "object") return;
    if (!equstoIsMember()) return;

    var kanal = opts.kanal === "email" ? "email" : "whatsapp";
    var refNo = String(opts.refNo || "").trim();
    var telefon = String(opts.telefon || "").trim();
    var eposta = String(opts.eposta || "").trim();
    var teklifSayi = String(opts.teklifSayi || "").trim();
    var sent = opts.sent === true;
    var errNote = String(opts.error || "").trim();

    var userLine =
      kanal === "whatsapp"
        ? "PFOS teklifimi WhatsApp numarama gönder"
        : "PFOS teklifimi e-postama gönder";
    if (teklifSayi) userLine += " — " + teklifSayi;
    if (refNo) userLine += " (" + refNo + ")";

    appendChatMessage("user", userLine);
    try {
      pushThread(waModalDigits || equstoResolveWhatsAppDigits(), userLine);
    } catch (e) {}

    var teamLine;
    if (sent) {
      if (kanal === "whatsapp") {
        teamLine =
          "PDF teklifiniz WhatsApp numaranıza gönderildi" +
          (telefon ? " (" + telefon + ")" : "") +
          (refNo ? ". Referans: " + refNo : ".");
      } else {
        teamLine =
          "PDF teklifiniz e-posta adresinize gönderildi" +
          (eposta ? " (" + eposta + ")" : "") +
          (refNo ? ". Referans: " + refNo : ".");
      }
    } else {
      teamLine =
        (kanal === "whatsapp"
          ? "WhatsApp gönderimi tamamlanamadı"
          : "E-posta gönderimi tamamlanamadı") +
        (errNote ? ": " + errNote : ".") +
        (refNo ? " Referans: " + refNo : "");
    }
    appendChatMessage("team", teamLine);
    renderWaHistoryList();

    try {
      document.dispatchEvent(
        new CustomEvent("equsto-wa-pfos-delivery", { detail: opts })
      );
    } catch (e2) {}
  };

  var WA_TICK_SVG =
    '<svg class="equsto-wa-bubble__tick-svg" viewBox="0 0 16 11" width="16" height="11" aria-hidden="true">' +
    '<path fill="currentColor" d="M11.071.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-2.405-2.272a.463.463 0 0 0-.336-.146.47.47 0 0 0-.343.15l-.522.538a.39.39 0 0 0-.08.399.416.416 0 0 0 .078.099l3.048 2.931a.646.646 0 0 0 .875.043l6.562-8.01a.395.395 0 0 0-.102-.607z"/>' +
    '<path fill="currentColor" d="M14.757.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-8.49 10.49-1.05-1.001a.463.463 0 0 0-.336-.146.47.47 0 0 0-.343.15l-.522.538a.39.39 0 0 0-.08.399.416.416 0 0 0 .078.099l1.693 1.628a.646.646 0 0 0 .875.043l9.048-11.016a.395.395 0 0 0-.102-.607z"/>' +
    "</svg>";

  function renderWaChat() {
    var log = document.getElementById("equsto-wa-chat-log");
    if (!log) return;
    var arr = loadChat();
    log.innerHTML = "";
    arr.forEach(function (m) {
      var isUser = m.role === "user";
      var bubble = document.createElement("div");
      bubble.className = "equsto-wa-bubble equsto-wa-bubble--" + (isUser ? "user" : "team");
      var inner = document.createElement("div");
      inner.className = "equsto-wa-bubble__inner";
      var text = document.createElement("span");
      text.className = "equsto-wa-bubble__text";
      text.textContent = m.body;
      var meta = document.createElement("span");
      meta.className = "equsto-wa-bubble__meta";
      var time = document.createElement("span");
      time.className = "equsto-wa-bubble__time";
      time.textContent = formatChatTime(m.ts);
      meta.appendChild(time);
      if (isUser) {
        var tick = document.createElement("span");
        tick.className = "equsto-wa-bubble__tick";
        tick.innerHTML = WA_TICK_SVG;
        meta.appendChild(tick);
      }
      inner.appendChild(text);
      inner.appendChild(meta);
      bubble.appendChild(inner);
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

  function refreshWaHistory() {
    if (!equstoIsMember()) return;
    renderWaHistoryList();
    renderWaChat();
  }

  function equstoHideWhatsAppModal() {
    stopWaChatPoll();
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

  function equstoShowWhatsAppModal(phoneDigits, plainText) {
    mountWaModal();
    purgeWaModalLegacyLogout();
    var overlay = document.getElementById("equsto-wa-overlay");
    var msgEl = document.getElementById("equsto-wa-msg");
    var spin = document.getElementById("equsto-wa-spinner");
    var pane = document.getElementById("equsto-wa-pane");
    var member = document.getElementById("equsto-wa-member");
    var titleEl = document.getElementById("equsto-wa-modal-title");
    if (!overlay || !spin || !pane || !member) return;

    waModalDigits = digitsOnly(phoneDigits) || equstoResolveWhatsAppDigits();
    if (msgEl) {
      var initialText = plainText != null ? String(plainText) : "";
      var currentUrl = window.location.href;
      var path = window.location.pathname || "";
      var segments = path.split("/").filter(Boolean);
      var isProduct = segments.length >= 3 && segments[segments.length - 3] === "shop";
      if (isProduct && currentUrl && !initialText.includes(currentUrl)) {
        if (initialText) {
          initialText += "\n\nİlgilendiğim sayfa: " + currentUrl;
        } else {
          initialText = "İlgilendiğim sayfa: " + currentUrl;
        }
      }
      msgEl.value = initialText;
    }

    spin.style.display = "flex";
    pane.style.display = "none";
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
      ensureWaMemberSession(function () {
        applyWaModalView();
        syncWaModalNearFab();
        syncWaModalAuthBtn();
        syncWaComposeSendMode();
        startWaChatPoll();
        if (msgEl) {
          try {
            msgEl.focus();
          } catch (e) {}
        }
      });
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
    var msgEl = document.getElementById("equsto-wa-msg");
    if (!msgEl) return;
    var text = String(msgEl.value || "").trim();
    if (!text) return;

    ensureWaMemberSession(function (ok) {
      if (!ok) {
        applyWaModalView();
        var stGate = document.getElementById("equsto-wa-status");
        if (stGate) {
          stGate.textContent = __waT(
            "wa.login_required",
            "Mesaj göndermek için üye girişi gerekli."
          );
          stGate.className = "equsto-wa-status equsto-wa-status--err";
        }
        return;
      }
      if (!equstoMemberPhoneOk()) {
        applyWaModalView();
        var stPhone = document.getElementById("equsto-wa-status");
        if (stPhone) {
          stPhone.textContent = __waT(
            "wa.phone_required",
            "Mesaj göndermek için Hesabım sayfasından cep telefonu ekleyin."
          );
          stPhone.className = "equsto-wa-status equsto-wa-status--err";
        }
        return;
      }
      equstoWaSubmitFromModalCore(text);
    });
  }

  function equstoWaSubmitFromModalCore(text) {
    var msgEl = document.getElementById("equsto-wa-msg");
    var st = document.getElementById("equsto-wa-status");
    var go = document.getElementById("equsto-wa-go");
    if (!msgEl) return;
    if (go) {
      go.disabled = true;
      go.classList.add("equsto-wa-bar-btn--loading");
    }
    if (st) {
      st.textContent = "";
      st.className = "equsto-wa-status";
    }

    appendChatMessage("user", text);
    try {
      pushThread(waModalDigits, text);
    } catch (e) {}

    var tok = equstoMemberToken();
    var payload = {
      mesaj: text,
      kaynak: "whatsapp-modal",
      sayfa: window.location.href || "",
      telefon: "",
    };
    if (tok) payload.token = tok;
    if (equstoIsMember() && typeof window.equstoGetMemberProfile === "function") {
      try {
        var prof = window.equstoGetMemberProfile();
        if (prof) {
          if (prof.ad) payload.ad = prof.ad;
          if (prof.telefon) payload.telefon = prof.telefon;
          if (!payload.telefon && prof.phone) payload.telefon = prof.phone;
          if (prof.eposta) payload.eposta = prof.eposta;
          if (!payload.eposta && prof.email) payload.eposta = prof.email;
        }
      } catch (e2) {}
    }

    fetch(eqMsgApiBase() + "/musteriler", {
      method: "POST",
      headers: (function () {
        var h = { "Content-Type": "application/json" };
        if (tok) {
          h.Authorization = "Bearer " + tok;
          h["X-Equsto-Authorization"] = tok;
        }
        return h;
      })(),
      body: JSON.stringify(payload),
    })
      .then(function (r) {
        return r.json().then(function (j) {
          return { ok: r.ok, status: r.status, j: j };
        });
      })
      .then(function (res) {
        if (go) resetWaSendBtn(go);
        if (!res.ok || !(res.j && res.j.success)) {
          popLastUserChatMessage(text);
          var msg =
            (res.j && (res.j.error || res.j.message)) ||
            __waT("wa.send_failed", "Gönderilemedi");
          if (res.status === 401 || msg === "Üye girişi gerekli") {
            if (typeof window.equstoClearMemberSession === "function") {
              window.equstoClearMemberSession();
            }
            applyWaModalView();
            msg = __waT(
              "wa.session_expired",
              "Oturum süresi doldu. Lütfen tekrar giriş yapın."
            );
          }
          if (st) {
            st.textContent = msg;
            st.className = "equsto-wa-status equsto-wa-status--err";
          }
          return;
        }
        msgEl.value = "";
        syncWaComposeSendMode();
        waModalLastSentText = text;
        try {
          if (typeof window.equstoTrackConversion === "function") {
            window.equstoTrackConversion("lead", { kaynak: payload.kaynak, sayfa: payload.sayfa });
          }
        } catch (_) {}
        syncWaChatFromServer(true);
        renderWaHistoryList();
        if (st) {
          st.textContent = "";
          st.className = "equsto-wa-status";
        }
        if (msgEl) {
          try {
            msgEl.focus();
          } catch (e) {}
        }
      })
      .catch(function (err) {
        if (go) resetWaSendBtn(go);
        popLastUserChatMessage(text);
        var em = err && err.message ? err.message : String(err);
        if (st) {
          st.textContent =
            __waT("wa.server_unreachable", "Sunucuya ulaşılamadı: ") + em;
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

  function syncWaComposeSendMode() {
    var msgEl = document.getElementById("equsto-wa-msg");
    var go = document.getElementById("equsto-wa-go");
    if (!msgEl || !go) return;
    var hasText = String(msgEl.value || "").trim().length > 0;
    var loading = go.classList.contains("equsto-wa-bar-btn--loading");
    go.classList.toggle("equsto-wa-bar-btn--has-text", hasText);
    go.setAttribute("aria-label", __waT("wa.send", "Gönder"));
    go.disabled = !hasText || loading;
    try {
      msgEl.style.height = "auto";
      msgEl.style.height = Math.min(msgEl.scrollHeight, 72) + "px";
    } catch (_) {}
  }

  function resetWaSendBtn(go) {
    if (!go) return;
    go.disabled = false;
    go.classList.remove("equsto-wa-bar-btn--loading");
    syncWaComposeSendMode();
  }

  /**
   * PFOS, sepet vb.: sayfa-içi kedi sohbet (wa.me yalnızca isteğe bağlı).
   */
  window.equstoOpenWhatsAppWebWindow = function (phoneDigits, plainText) {
    var phone = digitsOnly(phoneDigits) || equstoResolveWhatsAppDigits();
    equstoShowWhatsAppModal(phone, plainText != null ? plainText : "");
    return null;
  };

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
    var msg =
      window.EQUSTO_WHATSAPP_TEXT != null
        ? String(window.EQUSTO_WHATSAPP_TEXT)
        : defaultPrefill();
    equstoShowWhatsAppModal(phone, msg);
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
    overlay.setAttribute("data-eq-wa-chat-kilit", "1");
    overlay.setAttribute("aria-hidden", "true");
    overlay.style.cssText =
      "display:none;position:fixed;inset:0;z-index:10050;pointer-events:none;";

    var waHeadImg =
      '<img class="equsto-wa-ico-img" src="' +
      WA_FAB_IMG +
      '" alt="" width="40" height="40" decoding="async">';

    var waSvgIco = function (d) {
      return (
        '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">' +
        '<path fill="currentColor" d="' +
        d +
        '"/></svg>'
      );
    };
    var waIcoMenu = "M12 7a2 2 0 1 0-.001-4.001A2 2 0 0 0 12 7zm0 2a2 2 0 1 0-.001 4.001A2 2 0 0 0 12 9zm0 6a2 2 0 1 0-.001 4.001A2 2 0 0 0 12 15z";
    var waIcoSend = "M2.01 21L23 12 2.01 3 2 10l15 2-15 2z";

    overlay.innerHTML =
      '<div class="equsto-wa-backdrop" tabindex="-1"></div>' +
      '<div class="equsto-wa-modal" role="dialog" aria-modal="true" aria-labelledby="equsto-wa-modal-title">' +
      '<div class="equsto-wa-modal-head">' +
      '<button type="button" class="equsto-wa-back" aria-label="' +
      escWa(__waT("wa.close_aria", "Kapat")) +
      '" data-i18n-attr="aria-label:wa.close_aria">&#8249;</button>' +
      '<div class="equsto-wa-head-profile">' +
      '<div class="equsto-wa-ico equsto-wa-ico--cat" aria-hidden="true">' +
      waHeadImg +
      "</div>" +
      '<div class="equsto-wa-head-text">' +
      '<h2 class="equsto-wa-title" id="equsto-wa-modal-title" data-i18n="wa.modal_title">Mr. Equsto</h2>' +
      '<p class="equsto-wa-subtitle" data-i18n="wa.subtitle_online">çevrimiçi</p>' +
      "</div>" +
      "</div>" +
      '<div class="equsto-wa-head-actions">' +
      '<button type="button" class="equsto-wa-head-btn equsto-wa-head-btn--menu" id="equsto-wa-close-x" aria-label="' +
      escWa(__waT("wa.close_aria", "Kapat")) +
      '" data-i18n-attr="aria-label:wa.close_aria">' +
      waSvgIco(waIcoMenu) +
      "</button>" +
      "</div>" +
      "</div>" +
      '<div class="equsto-wa-modal-body">' +
      '<div class="equsto-wa-login-gate" id="equsto-wa-login-gate" hidden>' +
      '<div class="equsto-wa-login-gate__panel">' +
      '<a class="equsto-wa-login-gate__btn" id="equsto-wa-login-gate-btn" href="/login">Üye Girişi</a>' +
      '<p class="equsto-wa-login-gate__note">Hesabınız yok mu? ' +
      '<a class="equsto-wa-login-gate__register" id="equsto-wa-register-gate-btn" href="/login?mode=register">Kayıt ol</a></p>' +
      "</div></div>" +
      '<div class="equsto-wa-login-gate equsto-wa-phone-gate" id="equsto-wa-phone-gate" hidden>' +
      '<div class="equsto-wa-login-gate__panel">' +
      '<p class="equsto-wa-login-gate__note equsto-wa-phone-gate__note">Mesaj gönderebilmek için cep telefonunuzu Hesabım sayfasına ekleyin.</p>' +
      '<a class="equsto-wa-login-gate__btn" id="equsto-wa-phone-gate-btn" href="/hesabim#guvenlik">Telefonu ekle</a>' +
      "</div></div>" +
      '<div class="equsto-wa-spinner-wrap" id="equsto-wa-spinner"><div class="equsto-wa-spinner" aria-hidden="true"></div></div>' +
      '<div class="equsto-wa-pane" id="equsto-wa-pane">' +
      '<div class="equsto-wa-member" id="equsto-wa-member">' +
      '<div class="equsto-wa-history-wrap" hidden aria-hidden="true">' +
      '<div class="equsto-wa-history-head" data-i18n="wa.history_head">Geçmiş konuşmalar</div>' +
      '<ul class="equsto-wa-history" id="equsto-wa-history"></ul>' +
      '<p class="equsto-wa-history-empty" id="equsto-wa-history-empty" hidden data-i18n="wa.history_empty">Henüz konuşma yok.</p>' +
      "</div>" +
      '<div class="equsto-wa-chat-wrap">' +
      '<div class="equsto-wa-chat-log" id="equsto-wa-chat-log" role="log" aria-live="polite"></div>' +
      "</div>" +
      '<div class="equsto-wa-compose equsto-wa-compose--chat">' +
      '<div class="equsto-wa-input-bar">' +
      '<div class="equsto-wa-input-field">' +
      '<textarea id="equsto-wa-msg" class="equsto-wa-msg equsto-wa-msg--chat" rows="1" maxlength="8000" placeholder="' +
      escWa(__waT("wa.msg_ph", "Mesaj")) +
      '" data-i18n-attr="placeholder:wa.msg_ph"></textarea>' +
      "</div>" +
      '<button type="button" class="equsto-wa-bar-btn equsto-wa-bar-btn--send" id="equsto-wa-go" aria-label="' +
      escWa(__waT("wa.send", "Gönder")) +
      '" disabled>' +
      waSvgIco(waIcoSend) +
      "</button>" +
      "</div>" +
      '<p class="equsto-wa-status" id="equsto-wa-status" role="status" aria-live="polite"></p>' +
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
    var loginGateBtn = overlay.querySelector("#equsto-wa-login-gate-btn");
    var registerGateBtn = overlay.querySelector("#equsto-wa-register-gate-btn");
    syncWaLoginGateLinks();
    if (loginGateBtn) {
      loginGateBtn.addEventListener("click", function (ev) {
        ev.preventDefault();
        window.location.href = equstoLoginHref();
      });
    }
    if (registerGateBtn) {
      registerGateBtn.addEventListener("click", function (ev) {
        ev.preventDefault();
        window.location.href = equstoRegisterHref();
      });
    }
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
      waMsgInput.addEventListener("input", syncWaComposeSendMode);
    }
    syncWaComposeSendMode();

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
    wrap.setAttribute("data-eq-wa-cat-kilit", "1");
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
    if (!window.matchMedia("(max-width: 768px)").matches) return false;
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
      sayfa: window.location.href || "",
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

  function initIletisimForm() {
    var form = document.getElementById("equsto-iletisim-form");
    if (!form || form.getAttribute("data-eq-bound") === "1") return;
    form.setAttribute("data-eq-bound", "1");

    var captchaEl = document.getElementById("eq-iletisim-captcha-code");
    var captchaInput = document.getElementById("eq-iletisim-captcha-input");
    var refreshBtn = document.getElementById("eq-iletisim-captcha-refresh");
    var currentCaptcha = "";

    function randomCaptcha() {
      var chars = "abcdefghjkmnpqrstuvwxyz23456789";
      var out = "";
      for (var i = 0; i < 5; i++) out += chars.charAt(Math.floor(Math.random() * chars.length));
      currentCaptcha = out;
      if (captchaEl) captchaEl.textContent = out;
      if (captchaInput) captchaInput.value = "";
    }

    randomCaptcha();
    if (refreshBtn) refreshBtn.addEventListener("click", randomCaptcha);

    try {
      var q = new URLSearchParams(String(window.location.search || "").replace(/^\?/, ""));
      var konu = q.get("konu");
      var mesajEl = document.getElementById("eq-iletisim-mesaj");
      if (konu && mesajEl && !String(mesajEl.value || "").trim()) {
        mesajEl.value = String(konu).trim();
      }
    } catch (_) {}

    form.addEventListener("reset", function () {
      setTimeout(randomCaptcha, 0);
      var st = document.getElementById("eq-iletisim-status");
      if (st) st.textContent = "";
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var st = document.getElementById("eq-iletisim-status");
      var sb = document.getElementById("eq-iletisim-submit");
      var deptEl = document.getElementById("eq-iletisim-dept");
      var adEl = document.getElementById("eq-iletisim-ad");
      var soyadEl = document.getElementById("eq-iletisim-soyad");
      var mailEl = document.getElementById("eq-iletisim-mail");
      var telEl = document.getElementById("eq-iletisim-tel");
      var mesajEl = document.getElementById("eq-iletisim-mesaj");
      var privacyEl = document.getElementById("eq-iletisim-privacy");

      var dept = deptEl && deptEl.options ? deptEl.options[deptEl.selectedIndex].text : "";
      var ad = adEl ? String(adEl.value || "").trim() : "";
      var soyad = soyadEl ? String(soyadEl.value || "").trim() : "";
      var mail = mailEl ? String(mailEl.value || "").trim() : "";
      var tel = telEl ? String(telEl.value || "").trim() : "";
      var mesaj = mesajEl ? String(mesajEl.value || "").trim() : "";
      var captchaTry = captchaInput ? String(captchaInput.value || "").trim().toLowerCase() : "";

      function fail(msg) {
        if (st) { st.textContent = msg; st.style.color = "#c0392b"; }
      }

      if (!deptEl || !deptEl.value) return fail("Lütfen departman seçin.");
      if (!ad || !soyad) return fail("Ad ve soyad zorunlu.");
      if (!mail || !tel || !mesaj) return fail("E-posta, telefon ve mesaj zorunlu.");
      if (!privacyEl || !privacyEl.checked) return fail("Gizlilik politikasını kabul etmelisiniz.");
      if (captchaTry !== String(currentCaptcha).toLowerCase()) {
        randomCaptcha();
        return fail("Güvenlik kodu hatalı.");
      }

      var fullMesaj = ["Departman: " + dept, "", mesaj].join("\n");
      if (sb) { sb.disabled = true; sb.textContent = "Gönderiliyor…"; }
      if (st) { st.textContent = ""; st.style.color = "var(--eq-text-muted,#888)"; }

      fetch(eqMsgApiBase() + "/musteriler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ad: ad + " " + soyad,
          telefon: tel,
          eposta: mail,
          mesaj: fullMesaj,
          kaynak: "iletisim-sayfa",
          sayfa: window.location.href || "",
        }),
      })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (res) {
          var sendLabel = typeof window.eqT === "function" ? window.eqT("contact.form_send", "Gönder") : "Gönder";
          if (sb) { sb.disabled = false; sb.textContent = sendLabel; }
          if (!res.ok || !(res.j && res.j.success)) {
            var msg = (res.j && (res.j.error || res.j.message)) || "HTTP hata";
            return fail("Gönderilemedi: " + msg);
          }
          if (st) {
            st.textContent = "Mesajınız alındı. En kısa sürede size dönüş yapılacaktır.";
            st.style.color = "#1e7a45";
          }
          form.reset();
          randomCaptcha();
        })
        .catch(function (err) {
          var sendLabel = typeof window.eqT === "function" ? window.eqT("contact.form_send", "Gönder") : "Gönder";
          if (sb) { sb.disabled = false; sb.textContent = sendLabel; }
          fail("Sunucuya ulaşılamadı: " + (err && err.message ? err.message : String(err)));
        });
    });
  }

  function init() {
    if (document.body && document.body.classList.contains("admin-app")) return;
    initIletisimForm();
    mountWaModal();
    syncFabPlacement();
    try {
      if (typeof window.eqSyncMobileChrome === "function") window.eqSyncMobileChrome();
      else if (typeof window.eqClearDesktopChrome === "function") window.eqClearDesktopChrome();
    } catch (_) {}
    var tries = 0;
    var waitTabbar = setInterval(function () {
      syncFabPlacement();
      if (++tries > 48) clearInterval(waitTabbar);
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
