import { readFileSync, writeFileSync, copyFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const srcImg =
  "C:/Users/User/.cursor/projects/c-D-Disk-EQUSTO-mutbex-scraping/assets/c__Users_User_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_e3ad0c3c-f8e5-4109-bfa2-61496e917aac-6e00b8f2-6243-4bbb-bb4e-9fcb190704d0.png";
copyFileSync(srcImg, join(root, "public", "equsto-bize-ulasin-isimlik.png"));
copyFileSync(srcImg, join(root, "dist", "equsto-bize-ulasin-isimlik.png"));

const jsPath = join(root, "public", "contact.js");
let js = readFileSync(jsPath, "utf8");

js = js.replace(
  " * PC yüzen kedi: sayfa-içi kart.",
  " * PC yüzen kedi: sayfa-içi sohbet kartı (WhatsApp Web açılmaz)."
);
if (!js.includes("CHAT_KEY")) {
  js = js.replace(
    '  var THREADS_KEY = "equsto_wa_threads_v1";\n  /** Modal',
    '  var THREADS_KEY = "equsto_wa_threads_v1";\n  var CHAT_KEY = "equsto_wa_chat_v1";\n  var WA_FAB_IMG = "/equsto-bize-ulasin-isimlik.png";\n  /** Modal'
  );
}
js = js.replace(/var WA_MODAL_BUILD = \d+;/, "var WA_MODAL_BUILD = 8;");

if (!js.includes("function renderWaChat")) {
  const chatFns = `  function formatChatTime(ts) {
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
        body: "Merhaba! Equsto ekibine yazın — mesajınız buradan iletilir, en kısa sürede yanıtlanır.",
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
      var time = document.createElement("motion.div");
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

`;
  js = js.replace(
    "  function refreshWaHistory() {",
    chatFns.replace(/createElement\("motion\.div"\)/g, 'createElement("div")') +
      "  function refreshWaHistory() {"
  );
}
js = js.replace(
  /  function refreshWaHistory\(\) \{[\s\S]*?ul\.appendChild\(li\);\s*\}\);\s*\}/,
  "  function refreshWaHistory() {\n    renderWaChat();\n  }"
);

js = js.replace(
  /  function equstoShowWhatsAppModal\(phoneDigits, plainText\) \{[\s\S]*?  \}\n\n  function equstoWaOpenWithMessage/,
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), "apply-wa-show-modal-snippet.js"), "utf8").trim() +
    "\n\n  function equstoWaOpenWithMessage"
);

// write snippet file inline - use embedded string instead