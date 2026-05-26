import { readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const publicJs = join(root, 'public', 'contact.js');
const distJs = join(root, 'dist', 'contact.js');
const publicCss = join(root, 'public', 'contact.css');
const distCss = join(root, 'dist', 'contact.css');

let s = readFileSync(publicJs, 'utf8');

s = s.replace(/var WA_MODAL_BUILD = \d+;/, 'var WA_MODAL_BUILD = 6;');

const blockStart = s.indexOf("      '<motion.div class=\"equsto-wa-guest\"");
const blockStart2 = s.indexOf("      '<div class=\"equsto-wa-guest\" id=\"equsto-wa-guest\">'");
const start = blockStart2 >= 0 ? blockStart2 : blockStart;

const loginBtnLine =
  "      '<button type=\"button\" class=\"equsto-wa-login-cta\" id=\"equsto-wa-login-cta\" hidden>Üye Girişi</button>' +\n      \"</div>\" +";
const oldEnd = s.indexOf(loginBtnLine, start);
if (start < 0 || oldEnd < 0) {
  console.error('block markers not found', { start, oldEnd });
  process.exit(1);
}
const oldEndPos = oldEnd + loginBtnLine.length;

const newBlock =
  "      '<div class=\"equsto-wa-member\" id=\"equsto-wa-member\">' +\n" +
  "      '<motion.div class=\"equsto-wa-chat-log\" id=\"equsto-wa-chat-log\" role=\"log\" aria-live=\"polite\" aria-relevant=\"additions\"></motion.div>' +\n" +
  "      '<div class=\"equsto-wa-compose equsto-wa-compose--chat\">' +\n" +
  "      '<textarea id=\"equsto-wa-msg\" class=\"equsto-wa-msg equsto-wa-msg--chat\" rows=\"2\" maxlength=\"8000\" placeholder=\"Mesaj yazın… Enter ile gönder\"></textarea>' +\n" +
  "      '<div class=\"equsto-wa-compose-row\">' +\n" +
  "      '<p class=\"equsto-wa-status\" id=\"equsto-wa-status\" role=\"status\" aria-live=\"polite\"></p>' +\n" +
  "      '<button type=\"button\" class=\"equsto-wa-go\" id=\"equsto-wa-go\">Gönder</button>' +\n" +
  "      \"</div>\" +\n" +
  "      '<button type=\"button\" class=\"equsto-wa-login-cta\" id=\"equsto-wa-login-cta\" hidden>Üye girişi yap</button>' +\n" +
  "      \"</div>\" +";

const newBlockFixed = newBlock.replace(/<\/?motion\.div/g, (m) => m.replace('motion.', ''));

s = s.slice(0, start) + newBlockFixed + s.slice(oldEndPos);

s = s.replace(
  /overlay\.querySelector\("#equsto-wa-history"\)\.addEventListener\("click", equstoWaHistoryClick\);\n/,
  ''
);

s = s.replace(
  `        if (ev.key === "Enter" && (ev.ctrlKey || ev.metaKey)) {
          ev.preventDefault();
          equstoWaModalGo();
        }`,
  `        if (ev.key === "Enter" && !ev.shiftKey) {
          ev.preventDefault();
          equstoWaModalGo();
        }`
);

s = s.replace(
  `    spin.style.display = "flex";
    pane.style.display = "none";
    guest.style.display = "none";
    member.style.display = "none";`,
  `    spin.style.display = "flex";
    pane.style.display = "none";
    member.style.display = "none";`
);

s = s.replace(
  `      if (guest) guest.style.display = "none";
      if (member) member.style.display = "flex";`,
  `      if (member) member.style.display = "flex";`
);

writeFileSync(publicJs, s, 'utf8');
copyFileSync(publicJs, distJs);
console.log('patched JS');

let css = readFileSync(publicCss, 'utf8');
if (!css.includes('.equsto-wa-chat-log')) {
  const insertAt = css.indexOf('.equsto-wa-member {');
  const chatCss = `
.equsto-wa-chat-log {
  flex: 1;
  min-height: 120px;
  overflow-y: auto;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #e5ddd5;
  background-image: radial-gradient(circle at 1px 1px, rgba(0, 0, 0, 0.04) 1px, transparent 0);
  background-size: 8px 8px;
}

.equsto-wa-bubble {
  max-width: 88%;
  padding: 8px 10px 6px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.4;
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.08);
}

.equsto-wa-bubble--user {
  align-self: flex-end;
  background: #dcf8c6;
  border-bottom-right-radius: 2px;
}

.equsto-wa-bubble--team {
  align-self: flex-start;
  background: #fff;
  border-bottom-left-radius: 2px;
}

.equsto-wa-bubble__text {
  white-space: pre-wrap;
  word-break: break-word;
}

.equsto-wa-bubble__time {
  margin-top: 4px;
  font-size: 10px;
  color: rgba(0, 0, 0, 0.45);
  text-align: right;
}

.equsto-wa-compose--chat {
  flex-shrink: 0;
  padding: 10px 12px 12px;
  gap: 8px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  background: #f0f2f5;
}

.equsto-wa-msg--chat {
  width: 100%;
  min-height: 40px;
  max-height: 120px;
  resize: none;
  border-radius: 20px;
  padding: 10px 14px;
  font-size: 14px;
}

.equsto-wa-compose-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.equsto-wa-compose-row .equsto-wa-status {
  flex: 1;
  margin: 0;
  min-height: 0;
}

.equsto-wa-compose-row .equsto-wa-go {
  flex-shrink: 0;
  width: auto;
  min-width: 88px;
  margin: 0;
  padding: 10px 18px;
  border-radius: 20px;
}

html[data-theme="dark"] .equsto-wa-chat-log {
  background: #0b141a;
  background-image: none;
}

html[data-theme="dark"] .equsto-wa-bubble--user {
  background: #005c4b;
  color: #e9edef;
}

html[data-theme="dark"] .equsto-wa-bubble--team {
  background: #202c33;
  color: #e9edef;
}

html[data-theme="dark"] .equsto-wa-compose--chat {
  background: #111b21;
  border-top-color: rgba(255, 255, 255, 0.08);
}

`;
  css = css.slice(0, insertAt) + chatCss + css.slice(insertAt);
  writeFileSync(publicCss, css, 'utf8');
}
copyFileSync(publicCss, distCss);
console.log('css ok');
