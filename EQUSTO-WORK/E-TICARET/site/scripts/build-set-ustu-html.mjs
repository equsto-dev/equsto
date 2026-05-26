/**
 * set-ustu-mutfak.html — pisirme.html şablonundan UTF-8 temiz PLP sayfası.
 *   node scripts/build-set-ustu-html.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const PISIRME = path.join(ROOT, "public/pisirme.html");
const OUTS = [
  path.join(ROOT, "public/set-ustu-mutfak.html"),
  path.join(ROOT, "../EQUSTO-WORK/E-TICARET/site/public/set-ustu-mutfak.html"),
];

let html = fs.readFileSync(PISIRME, "utf8");

html = html.replace(
  /<title>[^<]+<\/title>/,
  "<title>Set Üstü Mutfak Ekipmanları · Öztiryakiler · Equsto</title>"
);
html = html.replace(
  /<meta name="description" content="[^"]*">/,
  '<meta name="description" content="Set üstü mutfak ekipmanları — servis gereçleri, gastronorm, chafing dish, tencere ve mutfak aksesuarları · Öztiryakiler katalog · Equsto">'
);
html = html.replace(
  /<link rel="canonical" href="[^"]+">/,
  '<link rel="canonical" href="https://equsto.com/shop/set-ustu-mutfak">'
);
html = html.replace(/data-eq-dept="pisirme"/, 'data-eq-dept="set-ustu-mutfak"');
html = html.replace(
  /    <div class="topnav-item active" data-i18n="nav\.pisirme">Pişirme Ekipmanları<\/motion>\n/,
  '    <div class="topnav-item" onclick="eqGo(\'pisirme\')" data-i18n="nav.pisirme">Pişirme Ekipmanları</div>\n    <span class="topnav-sep">|</span>\n    <div class="topnav-item active">Set Üstü Mutfak</div>\n'
);
html = html.replace(
  /    <div class="topnav-item active" data-i18n="nav\.pisirme">Pişirme Ekipmanları<\/div>\n/,
  '    <div class="topnav-item" onclick="eqGo(\'pisirme\')" data-i18n="nav.pisirme">Pişirme Ekipmanları</div>\n    <span class="topnav-sep">|</span>\n    <motion class="topnav-item active">Set Üstü Mutfak</div>\n'
);
html = html.replace(
  /      <div class="eq-dept-plp-aside__hd">Pişirme Ekipmanları<\/div>\n/,
  '      <div class="eq-dept-plp-aside__hd">Set Üstü Mutfak Ekipmanları</div>\n'
);
html = html.replace(
  /      <h1 class="eq-dept-plp-title">Pişirme Ekipmanları<\/h1>\n/,
  '      <h1 class="eq-dept-plp-title">Set Üstü Mutfak Ekipmanları</h1>\n'
);
html = html.replace(
  /      <p class="eq-dept-plp-lead">Ocaklar, ızgaralar, kuzineler, fritözler, döner ve tost ekipmanları<\/p>\n/,
  '      <p class="eq-dept-plp-lead">Öztiryakiler — servis gereçleri, gastronorm, chafing dish, tencere ve mutfak aksesuarları</p>\n'
);
html = html.replace(/\/eq-site-urls\.js\?v=[^"]+/, "/eq-site-urls.js?v=20260525setustu");

for (const out of OUTS) {
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html, "utf8");
  console.log("[build-set-ustu] wrote", out);
}
