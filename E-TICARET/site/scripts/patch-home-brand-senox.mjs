import { readFileSync, writeFileSync } from "fs";

const path = "lib/vitrin/bodies/index.ts";
const s = readFileSync(path, "utf8");
const prefix = 'export const IndexBodyHtml = "';
const start = s.indexOf(prefix) + prefix.length;
let i = start;
let html = "";
while (i < s.length) {
  const c = s[i];
  if (c === "\\" && s[i + 1] === '"') {
    html += '"';
    i += 2;
    continue;
  }
  if (c === "\\" && s[i + 1] === "r") {
    html += "\r";
    i += 2;
    continue;
  }
  if (c === "\\" && s[i + 1] === "n") {
    html += "\n";
    i += 2;
    continue;
  }
  if (c === '"' && s[i - 1] !== "\\") break;
  html += c;
  i++;
}

const cell =
  '<a class="eq-brand-cell" href="/shop/sogutma?marka=Senox">Şenox</a>';
if (html.includes(">Şenox</a>") || html.includes(">Senox</a>")) {
  console.log("[patch-home-brand-senox] zaten var");
  process.exit(0);
}

const gridRe = /(<div class="eq-brand-grid" id="eq-home-brand-grid">[\s\S]*?)(<\/div>)/;
if (!gridRe.test(html)) {
  console.error("brand grid not found");
  process.exit(1);
}

const newHtml = html.replace(
  gridRe,
  `$1\r\n            ${cell}\r\n          $2`,
);

function escapeForTs(str) {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r/g, "\\r")
    .replace(/\n/g, "\\n")
    .replace(/\t/g, "\\t");
}

writeFileSync(path, s.slice(0, start) + escapeForTs(newHtml) + '";' + s.slice(i + 1));
console.log("[patch-home-brand-senox] OK — Şenox eklendi");
