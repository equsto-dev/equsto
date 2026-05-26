/**
 * Departman PLP HTML — theme/nav scriptleri yalnizca </body> oncesinde (head'deki vite kalintisi silinir).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DEPT_PLP_HTML } from "./dept-plp-inline-css.mjs";

const pub = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public");

const HEAD_SCRIPTS =
  /<script vite-ignore src="\/(?:theme|equsto-logo|eq-i18n|eq-site-urls|nav)\.js"[^>]*>\s*<\/script>\s*/gi;

const BODY_SCRIPTS =
  '<script vite-ignore src="/theme.js"></script>\n' +
  '<script vite-ignore src="/equsto-logo.js"></script>\n' +
  '<script vite-ignore src="/eq-i18n.js"></script>\n' +
  '<script vite-ignore src="/eq-site-urls.js"></script>\n' +
  '<script vite-ignore src="/nav.js"></script>\n';

function headCloseIndex(html) {
  const bodyIdx = html.search(/<body[^>]*class=["'][^"']*eq-dept-plp/i);
  if (bodyIdx >= 0) {
    const hit = html.lastIndexOf("</head>", bodyIdx);
    if (hit >= 0) return hit;
  }
  return html.lastIndexOf("</head>");
}

function fixDeptHtml(fp) {
  let html = fs.readFileSync(fp, "utf8");
  if (!/eq-dept-plp/.test(html)) return false;

  const headEnd = headCloseIndex(html);
  const bodyStart = html.indexOf("<body");
  if (headEnd < 0 || bodyStart < 0) return false;

  const head = html.slice(0, headEnd);
  const rest = html.slice(headEnd);
  const cleanedHead = head.replace(HEAD_SCRIPTS, "");
  let next = cleanedHead + rest;

  if (!/src="\/theme\.js"/.test(next)) {
    next = next.replace(
      /(<script vite-ignore src="\/ecom-cart\.js"><\/script>)/i,
      BODY_SCRIPTS + "$1"
    );
  }

  if (next === html) return false;
  fs.writeFileSync(fp, next, "utf8");
  return true;
}

let n = 0;
for (const name of DEPT_PLP_HTML) {
  const fp = path.join(pub, name);
  if (fs.existsSync(fp) && fixDeptHtml(fp)) {
    console.log("[fix-dept-plp-head] " + name);
    n++;
  }
}
console.log("[fix-dept-plp-head] guncellenen:", n);
