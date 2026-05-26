import { readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const jsPath = join(root, "public", "contact.js");
const cssPath = join(root, "public", "contact.css");
const distJs = join(root, "dist", "contact.js");
const distCss = join(root, "dist", "contact.css");

let js = readFileSync(jsPath, "utf8");

js = js.replace(
  " * PC yüzen kedi: sayfa-içi sohbet kartı (WhatsApp Web açılmaz).",
  " * PC yüzen kedi: sayfa-içi kart."
);
js = js.replace(/\n  var CHAT_KEY = "equsto_wa_chat_v1";/, "");
js = js.replace(/var WA_MODAL_BUILD = \d+;/, "var WA_MODAL_BUILD = 7;");

js = js.replace(
  /  function formatChatTime[\s\S]*?  function refreshWaHistory\(\) \{\s*renderWaChat\(\);\s*\}\s*/,
  `  function refreshWaHistory() {
    var ul = document.getElementById("equsto-wa-history");
    var empty = document.getElementById("equsto-wa-history-empty");
    if (!ul) return;
    var arr = loadThreads();
    ul.innerHTML = "";
    if (empty) empty.style.display = arr.length ? "none" : "block";
    arr.forEach(function (row) {
      var li = document.createElement("li");
      var b = document.createElement("button");
      b.type = "button";
      b.className = "equsto-wa-history-item";
      b.setAttribute("data-thread-id", row.id);
      var when = new Date(row.ts).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" });
      var pv = String(row.preview || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      b.innerHTML =
        '<span class="equsto-wa-history-preview">' + pv + "</span>" + '<span class="equsto-wa-history-meta">' + when + "</span>";
      li.appendChild(b);
      ul.appendChild(li);
    });
  }

`
);

js = js.replace(
  /  function equstoShowWhatsAppModal\(phoneDigits, plainText\) \{[\s\S]*?  \}\n\n  function equstoWaSetStatus/,
  `  function equstoShowWhatsAppModal(phoneDigits, plainText) {
    mountWaModal();
    purgeWaModalLegacyLogout();
    var overlay = document.getElementById("equsto-wa-overlay");
    var msgEl = document.getElementById("equsto-wa-msg");
    var spin = document.getElementById("equsto-wa-spinner");
    var pane = document.getElementById("equsto-wa-pane");
    var guest = document.getElementById("equsto-wa-guest");
    var member = document.getElementById("equsto-wa-member");
    var titleEl = document.getElementById("equsto-wa-modal-title");
    if (!overlay || !spin || !pane || !guest || !member) return;

    waModalDigits = digitsOnly(phoneDigits);
    if (msgEl) msgEl.value = plainText != null ? String(plainText) : "";

    spin.style.display = "flex";
    pane.style.display = "none";
    guest.style.display = "none";
    member.style.display = "none";

    overlay.classList.add("equsto-wa-overlay--open");
    overlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", equstoWaModalOnKey);

    syncWaModalNearFab();
    waModalResizeHandler = syncWaModalNearFab;
    window.addEventListener("resize", waModalResizeHandler);

    var memberOn = equstoIsMember();
    if (titleEl) titleEl.textContent = memberOn ? "Bir mesaj bırakın" : "Üye Girişi";

    window.setTimeout(function () {
      spin.style.display = "none";
      pane.style.display = "flex";
      syncWaModalNearFab();
      if (memberOn) {
        guest.style.display = "none";
        member.style.display = "flex";
        refreshWaHistory();
        syncWaModalAuthBtn();
        if (msgEl) {
          try {
            msgEl.focus();
          } catch (e) {}
        }
      } else {
        guest.style.display = "flex";
        member.style.display = "none";
        var loginBtn = document.getElementById("equsto-wa-login-btn");
        if (loginBtn) {
          try {
            loginBtn.focus();
          } catch (e) {}
        }
      }
    }, 280);
  }

  function equstoWaSetStatus`
);

js = js.replace(
  /  function equstoWaMemberPayload[\s\S]*?  function equstoWaModalGo\(\) \{\s*equstoWaSubmitFromModal\(\);\s*\}\s*/,
  `  function equstoWaModalGo() {
    if (!equstoIsMember()) return;
    var msgEl = document.getElementById("equsto-wa-msg");
    if (!msgEl) return;
    var text = String(msgEl.value || "").trim();
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

  function equstoWaHistoryClick(ev) {
    var t = ev.target.closest(".equsto-wa-history-item");
    if (!t) return;
    var id = t.getAttribute("data-thread-id");
    if (!id) return;
    var arr = loadThreads();
    var row = null;
    for (var i = 0; i < arr.length; i++) {
      if (String(arr[i].id) === id) {
        row = arr[i];
        break;
      }
    }
    if (!row) return;
    waModalDigits = digitsOnly(row.phone);
    var msgEl = document.getElementById("equsto-wa-msg");
    if (msgEl) msgEl.value = row.body != null ? String(row.body) : "";
    try {
      msgEl.focus();
    } catch (e) {}
  }

`
);

js = js.replace(
  "Equsto Destek</h2>' +",
  "Bir mesaj bırakın</h2>' +"
);

const paneFrom =
  /      '<motion.div class="equsto-wa-member" id="equsto-wa-member">' \+[\s\S]*?Üye girişi yap<\/button>' \+\n      "<\/div>" \+\n      "<\/div>" \+/;
const paneTo = `      '<div class="equsto-wa-guest" id="equsto-wa-guest">' +
      '<p class="equsto-wa-guest-lead">Geçmiş WhatsApp konuşmalarınızı görmek ve devam etmek için giriş yapın.</p>' +
      '<div class="equsto-wa-guest-login-wrap">' +
      '<a href="/login.html" id="equsto-wa-login-btn" class="equsto-wa-login-only">Üye Girişi</a>' +
      "</div>" +
      "</motion.div>" +
      '<div class="equsto-wa-member" id="equsto-wa-member">' +
      '<p class="equsto-wa-guest-hint" id="equsto-wa-guest-hint" hidden>Geçmiş konuşmalar ve mesaj için üye girişi yapın.</p>' +
      '<div class="equsto-wa-history-wrap">' +
      '<motion.div class="equsto-wa-history-head">Geçmiş konuşmalar</motion.div>' +
      '<ul class="equsto-wa-history" id="equsto-wa-history" role="list"></ul>' +
      '<p class="equsto-wa-history-empty" id="equsto-wa-history-empty">Henüz konuşma yok.</p>' +
      "</div>" +
      '<div class="equsto-wa-compose">' +
      '<label class="equsto-wa-label" for="equsto-wa-msg">Mesajınız</label>' +
      '<textarea id="equsto-wa-msg" class="equsto-wa-msg" rows="5" maxlength="8000" placeholder="Mesajınızı yazın…"></textarea>' +
      '<p class="equsto-wa-status" id="equsto-wa-status" role="status" aria-live="polite"></p>' +
      '<button type="button" class="equsto-wa-go" id="equsto-wa-go">WhatsApp Web’de aç</button>' +
      '<button type="button" class="equsto-wa-login-cta" id="equsto-wa-login-cta" hidden>Üye Girişi</button>' +
      "</div>" +
      "</div>" +
`;

let paneToFixed = paneTo.replace(/<\/?motion\.motion\.div/g, "").replace(/<\/?motion\.motion\.div/g, "");
paneToFixed = paneTo.replace(/<\/?motion\.motion\.div/g, "");
paneToFixed = paneTo.replace(/motion\.div/g, "motion.div"); // noop fix below
paneToFixed = paneTo
  .replace("<motion.div class=\"equsto-wa-guest-login-wrap\">", '<div class="equsto-wa-guest-login-wrap">')
  .replace('</motion.div>" +\n      \'<div class="equsto-wa-member"', '</div>" +\n      \'<motion.div class="equsto-wa-member"')
  .replace("<motion.div class=\"equsto-wa-history-head\">", '<div class="equsto-wa-history-head">')
  .replace("</motion.div>" +\n      '<ul", "</div>" +\n      '<ul");

// simpler paneTo without typos
const paneClean = `      '<div class="equsto-wa-guest" id="equsto-wa-guest">' +
      '<p class="equsto-wa-guest-lead">Geçmiş WhatsApp konuşmalarınızı görmek ve devam etmek için giriş yapın.</p>' +
      '<div class="equsto-wa-guest-login-wrap">' +
      '<a href="/login.html" id="equsto-wa-login-btn" class="equsto-wa-login-only">Üye Girişi</a>' +
      "</div>" +
      "</div>" +
      '<div class="equsto-wa-member" id="equsto-wa-member">' +
      '<p class="equsto-wa-guest-hint" id="equsto-wa-guest-hint" hidden>Geçmiş konuşmalar ve mesaj için üye girişi yapın.</p>' +
      '<div class="equsto-wa-history-wrap">' +
      '<div class="equsto-wa-history-head">Geçmiş konuşmalar</div>' +
      '<ul class="equsto-wa-history" id="equsto-wa-history" role="list"></ul>' +
      '<p class="equsto-wa-history-empty" id="equsto-wa-history-empty">Henüz konuşma yok.</p>' +
      "</div>" +
      '<div class="equsto-wa-compose">' +
      '<label class="equsto-wa-label" for="equsto-wa-msg">Mesajınız</label>' +
      '<textarea id="equsto-wa-msg" class="equsto-wa-msg" rows="5" maxlength="8000" placeholder="Mesajınızı yazın…"></textarea>' +
      '<p class="equsto-wa-status" id="equsto-wa-status" role="status" aria-live="polite"></p>' +
      '<button type="button" class="equsto-wa-go" id="equsto-wa-go">WhatsApp Web’de aç</button>' +
      '<button type="button" class="equsto-wa-login-cta" id="equsto-wa-login-cta" hidden>Üye Girişi</button>' +
      "</div>" +
      "</div>" +
`;

const paneReal =
  /      '<div class="equsto-wa-member" id="equsto-wa-member">' \+[\s\S]*?hidden>Üye girişi yap<\/button>' \+\n      "<\/motion.div>" \+\n      "<\/div>" \+/;

if (!paneReal.test(js)) {
  const paneReal2 =
    /      '<div class="equsto-wa-member" id="equsto-wa-member">' \+[\s\S]*?hidden>Üye girişi yap<\/button>' \+\n      "<\/div>" \+\n      "<\/div>" \+/;
  if (!paneReal2.test(js)) {
    console.error("pane block missing");
    process.exit(1);
  }
  js = js.replace(paneReal2, paneClean);
} else {
  js = js.replace(paneReal, paneClean);
}

js = js.replace(
  `if (ev.key === "Enter" && !ev.shiftKey)`,
  `if (ev.key === "Enter" && (ev.ctrlKey || ev.metaKey))`
);

if (!js.includes("equstoWaHistoryClick")) {
  js = js.replace(
    'document.addEventListener("equsto-member-changed", syncWaModalAuthBtn);\n    var waMsgInput',
    'document.addEventListener("equsto-member-changed", syncWaModalAuthBtn);\n    overlay.querySelector("#equsto-wa-history").addEventListener("click", equstoWaHistoryClick);\n    var waMsgInput'
  );
}

js = js.replace('img.src = "/equsto-bize-ulasin-isimlik.png";', 'img.src = "equsto-bize-ulasin-isimlik.png";');

js = js.replace(/  function equstoWaSetStatus[\s\S]*?  \}\n\n  function equstoWaOpenWithMessage/, "  function equstoWaOpenWithMessage");

writeFileSync(jsPath, js, "utf8");

let css = readFileSync(cssPath, "utf8");
const a = css.indexOf(".equsto-wa-chat-log {");
const b = css.indexOf(".equsto-wa-member {", a >= 0 ? a : 0);
if (a >= 0 && b > a) {
  css = css.slice(0, a) + css.slice(b);
  writeFileSync(cssPath, css, "utf8");
}

copyFileSync(jsPath, distJs);
copyFileSync(cssPath, distCss);
console.log("OK: reverted WA 5 steps");
