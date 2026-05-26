/**
 * Departman PLP — eq-dept-plp.css inline yedek (canlıda /eq-dept-plp.css 404 olsa bile grid çalışır).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const pub = path.join(root, "public");

export const DEPT_PLP_HTML = [
  "pisirme.html",
  "sogutma.html",
  "kahve.html",
  "yikama.html",
  "hazirlik.html",
  "icecek.html",
];

const CRITICAL_PLP =
  "body.eq-shop.eq-dept.eq-dept-plp .eq-dept-plp-layout{display:flex!important;align-items:flex-start;width:100%;max-width:1500px;margin:0 auto}" +
  "body.eq-shop.eq-dept.eq-dept-plp .eq-dept-plp-aside{flex:0 0 240px;width:240px}" +
  "body.eq-shop.eq-dept.eq-dept-plp .eq-dept-plp-main{flex:1;min-width:0}" +
  "body.eq-shop.eq-dept.eq-dept-plp .eq-dept-plp-grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:16px}" +
  "@media(min-width:1024px){body.eq-shop.eq-dept.eq-dept-plp .eq-dept-plp-grid{grid-template-columns:repeat(4,minmax(0,1fr))!important}}";

export function injectDeptPlpInlineCss(html, cssText) {
  if (!/class=["'][^"']*eq-dept-plp/i.test(html)) return html;
  cssText = CRITICAL_PLP + "\n" + cssText;
  if (/id=["']eq-dept-plp-inline["']/i.test(html)) {
    return html.replace(
      /<style id=["']eq-dept-plp-inline["']>[\s\S]*?<\/style>\s*/i,
      `<style id="eq-dept-plp-inline">\n${cssText}\n</style>\n`
    );
  }
  const block = `<style id="eq-dept-plp-inline">\n${cssText}\n</style>\n`;
  if (/<link[^>]+href=["']\/eq-dept-plp\.css/i.test(html)) {
    return html.replace(/(<link[^>]+href=["']\/eq-dept-plp\.css[^>]*>\s*)/i, "$1" + block);
  }
  const headEnd = html.indexOf("</head>");
  if (headEnd < 0) return html;
  return html.slice(0, headEnd) + block + html.slice(headEnd);
}

export function injectDeptPlpInlineFile(htmlPath, cssPath = path.join(pub, "eq-dept-plp.css")) {
  if (!fs.existsSync(htmlPath) || !fs.existsSync(cssPath)) return false;
  const css = fs.readFileSync(cssPath, "utf8");
  const next = injectDeptPlpInlineCss(fs.readFileSync(htmlPath, "utf8"), css);
  if (next === fs.readFileSync(htmlPath, "utf8")) return false;
  fs.writeFileSync(htmlPath, next, "utf8");
  return true;
}

export function injectAllPublicDeptPlpHtml() {
  const cssPath = path.join(pub, "eq-dept-plp.css");
  if (!fs.existsSync(cssPath)) throw new Error("public/eq-dept-plp.css yok");
  let n = 0;
  for (const name of DEPT_PLP_HTML) {
    const fp = path.join(pub, name);
    if (injectDeptPlpInlineFile(fp, cssPath)) {
      console.log("[dept-plp-inline] public/" + name);
      n++;
    }
  }
  return n;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const n = injectAllPublicDeptPlpHtml();
  console.log("[dept-plp-inline] guncellenen:", n, "html");
}
