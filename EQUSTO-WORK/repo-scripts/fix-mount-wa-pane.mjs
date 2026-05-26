import { readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const p = join(root, "public", "contact.js");
let s = readFileSync(p, "utf8");

const start = s.indexOf("      '<motion.div class=\"equsto-wa-pane\"");
const start2 = s.indexOf("      '<div class=\"equsto-wa-pane\" id=\"equsto-wa-pane\">' +");
const st = start2 >= 0 ? start2 : start;
const end = s.indexOf("    document.body.appendChild(overlay);", st);
if (st < 0 || end < 0) {
  console.error("markers", st, end);
  process.exit(1);
}

const block = `      '<div class="equsto-wa-pane" id="equsto-wa-pane">' +
      '<div class="equsto-wa-guest" id="equsto-wa-guest">' +
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
      '<button type="button" class="equsto-wa-go" id="equsto-wa-go">WhatsApp Web\u2019de aç</button>' +
      '<button type="button" class="equsto-wa-login-cta" id="equsto-wa-login-cta" hidden>Üye Girişi</button>' +
      "</div>" +
      "</div>" +
      "</div>" +
      "</div>" +
      "</div>" +
      "</div>" +
`;

s = s.slice(0, st) + block + s.slice(end);

if (!s.includes("equstoWaHistoryClick")) {
  console.error("equstoWaHistoryClick missing");
  process.exit(1);
}
if (!s.includes('addEventListener("click", equstoWaHistoryClick)')) {
  s = s.replace(
    'document.addEventListener("equsto-member-changed", syncWaModalAuthBtn);\n    var waMsgInput',
    'document.addEventListener("equsto-member-changed", syncWaModalAuthBtn);\n    overlay.querySelector("#equsto-wa-history").addEventListener("click", equstoWaHistoryClick);\n    var waMsgInput'
  );
}
s = s.replace(
  'if (ev.key === "Enter" && !ev.shiftKey)',
  'if (ev.key === "Enter" && (ev.ctrlKey || ev.metaKey))'
);

writeFileSync(p, s, "utf8");
copyFileSync(p, join(root, "dist", "contact.js"));

const cssPath = join(root, "public", "contact.css");
let css = readFileSync(cssPath, "utf8");
const a = css.indexOf(".equsto-wa-chat-log {");
const b = css.indexOf(".equsto-wa-member {", a >= 0 ? a : 0);
if (a >= 0 && b > a) {
  css = css.slice(0, a) + css.slice(b);
  writeFileSync(cssPath, css, "utf8");
  copyFileSync(cssPath, join(root, "dist", "contact.css"));
}

writeFileSync(join(root, "revert-wa-done.txt"), "ok\n", "utf8");
console.log("OK");
