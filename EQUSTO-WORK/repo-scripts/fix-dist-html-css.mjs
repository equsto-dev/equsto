/**
 * Build sonrasi: gercek <head> CSS + cPanel icin sabit /theme.css (hash'li assets/ degil).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { injectDeptPlpInlineCss } from "./dept-plp-inline-css.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const pub = path.join(root, "public");

function walkHtml(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const fp = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walkHtml(fp));
    else if (ent.name.endsWith(".html")) out.push(fp);
  }
  return out;
}

function copyIf(src, dst) {
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dst);
    return true;
  }
  return false;
}

/** Canlı önbellek kırıcı — mobil chrome / WhatsApp widget değişince artırın */
const ASSET_V = "20260521globalsearch";
const CART_SYNC_V = "20260520cart";

/** Wordmark PNG — equsto-logo.js içindeki LOGO_V ile aynı tutun (equsto-logo-KILIT.txt) */
const LOGO_ASSET_V = (() => {
  try {
    const m = fs
      .readFileSync(path.join(pub, "equsto-logo.js"), "utf8")
      .match(/var LOGO_V = "([^"]+)"/);
    return m ? m[1] : "20260519wordmark3";
  } catch {
    return "20260519wordmark3";
  }
})();

copyIf(path.join(pub, "theme.css"), path.join(dist, "theme.css"));
copyIf(path.join(pub, "equsto-logo.js"), path.join(dist, "equsto-logo.js"));
copyIf(path.join(pub, "images", "equsto-logo.png"), path.join(dist, "images", "equsto-logo.png"));
copyIf(path.join(pub, "images", "equsto-logo-white.png"), path.join(dist, "images", "equsto-logo-white.png"));
copyIf(path.join(pub, "contact.css"), path.join(dist, "contact.css"));
copyIf(path.join(pub, "contact.js"), path.join(dist, "contact.js"));
copyIf(path.join(pub, "equsto-bize-ulasin-isimlik.png"), path.join(dist, "equsto-bize-ulasin-isimlik.png"));
copyIf(path.join(pub, "pfos.html"), path.join(dist, "pfos.html"));
copyIf(path.join(pub, "auth.css"), path.join(dist, "auth.css"));
copyIf(path.join(pub, "eq-home-mutbex.css"), path.join(dist, "eq-home-mutbex.css"));
copyIf(path.join(pub, "eq-dept-plp.css"), path.join(dist, "eq-dept-plp.css"));
copyIf(path.join(pub, "eq-dept-tips.js"), path.join(dist, "eq-dept-tips.js"));
copyIf(path.join(pub, "eq-category-shell.js"), path.join(dist, "eq-category-shell.js"));
copyIf(path.join(pub, "eq-mutbex-chrome.js"), path.join(dist, "eq-mutbex-chrome.js"));
copyIf(path.join(pub, "eq-dept-seo.js"), path.join(dist, "eq-dept-seo.js"));
copyIf(path.join(pub, "nav.js"), path.join(dist, "nav.js"));
copyIf(path.join(pub, "eq-site-urls.js"), path.join(dist, "eq-site-urls.js"));
copyIf(path.join(pub, "eq-merchant-schema.js"), path.join(dist, "eq-merchant-schema.js"));
copyIf(path.join(pub, "eq-product-reviews.js"), path.join(dist, "eq-product-reviews.js"));
copyIf(path.join(pub, "admin-eticaret.js"), path.join(dist, "admin-eticaret.js"));
copyIf(path.join(pub, "admin.html"), path.join(dist, "admin.html"));
copyIf(path.join(pub, "product.html"), path.join(dist, "product.html"));
copyIf(path.join(pub, "imt300.html"), path.join(dist, "imt300.html"));
copyIf(path.join(pub, "eq-home-mutbex.js"), path.join(dist, "eq-home-mutbex.js"));
copyIf(path.join(pub, "eq-vitrin-config.js"), path.join(dist, "eq-vitrin-config.js"));
const defaultLinks =
  `<link rel="stylesheet" href="/theme.css?v=${ASSET_V}">\n` +
  `<link rel="stylesheet" href="/contact.css?v=${ASSET_V}">\n`;

const loginLinks =
  `<link rel="stylesheet" href="/theme.css?v=${ASSET_V}">\n` +
  `<link rel="stylesheet" href="/auth.css?v=${ASSET_V}">\n`;

/** contact.css yüklenmese bile FAB/modal patlamasın (dept PLP acil yama) */
const CONTACT_WIDGET_GUARD =
  `<style id="eq-contact-guard-${ASSET_V}">` +
  "#equsto-contact-fab,.equsto-contact-fab:not(#eq-bottom-tabbar *){position:fixed;right:16px;bottom:16px;z-index:9999;width:auto;height:auto;max-width:80px;max-height:80px;align-items:flex-end;flex-direction:column;gap:10px;pointer-events:none;box-sizing:border-box}" +
  "#equsto-contact-fab .equsto-contact-wa-fab:not(.equsto-contact-wa-fab--tabbar),.equsto-contact-fab:not(#eq-bottom-tabbar *) .equsto-contact-wa-fab:not(.equsto-contact-wa-fab--tabbar){pointer-events:auto;flex:0 0 auto;max-width:64px;max-height:64px;overflow:hidden}" +
  "#equsto-contact-fab img,.equsto-contact-fab:not(#eq-bottom-tabbar *) .equsto-contact-wa-fab:not(.equsto-contact-wa-fab--tabbar) img{width:62px!important;height:62px!important;max-width:62px!important;max-height:62px!important;display:block;object-fit:cover}" +
  ".equsto-wa-overlay:not(.equsto-wa-overlay--open){display:none!important;pointer-events:none!important}" +
  ".equsto-wa-ico svg,.equsto-wa-ico-svg{width:22px;height:22px;max-width:22px;max-height:22px;display:block}" +
  "</style>\n";

const MOBILE_CHROME_PATCH =
  `<style id="eq-mobile-chrome-${ASSET_V}">` +
  "@media (max-width:768px){" +
  "body.eq-shop:not(.admin-app):not(.bd-page):not(.eq-pfos) nav.topnav," +
  "body.eq-shop:not(.admin-app):not(.bd-page):not(.eq-pfos) .topnav{display:none!important}" +
  "#equsto-contact-fab,.equsto-contact-fab:not(#eq-bottom-tabbar *){display:none!important;pointer-events:none!important}" +
  "body.eq-home #eq-home-catband{display:none!important}" +
  "body.eq-shop.eq-dept aside.eq-filter-col,body.eq-shop.eq-dept #eq-filter-col{display:none!important}" +
  "body:not(.admin-app):not(.eq-shop) header.hdr a.logo,body:not(.admin-app):not(.eq-shop) header.hdr>a.logo{display:none!important;visibility:hidden!important;width:0!important;height:0!important;overflow:hidden!important}" +
  "body.eq-shop:not(.admin-app):not(.bd-page) header.hdr>a.logo{display:inline-flex!important;visibility:visible!important;width:auto!important;height:auto!important;max-width:42vw!important;overflow:visible!important;pointer-events:auto!important}" +
  "body:not(.admin-app) header.hdr .srch-cat,body:not(.admin-app) header.hdr .cat-picker,body:not(.admin-app) header.hdr .cat-picker-btn{display:none!important;width:0!important;overflow:hidden!important}" +
  "body:not(.admin-app) header.hdr .srch .srch-input{border-radius:8px 0 0 8px!important}" +
  "}</style>\n";

const DESKTOP_CHROME_PATCH =
  `<style id="eq-desktop-chrome-${ASSET_V}">` +
  "@media (min-width:769px){" +
  "body.eq-shop:not(.admin-app):not(.bd-page):not(.eq-pfos) nav.topnav," +
  "body.eq-shop:not(.admin-app):not(.bd-page):not(.eq-pfos) .topnav{display:flex!important;visibility:visible!important;pointer-events:auto!important}" +
  "body:not(.admin-app) header.hdr a.logo{display:inline-flex!important;visibility:visible!important;width:auto!important;height:auto!important;overflow:visible!important}" +
  "body:not(.admin-app) header.hdr .srch-cat,body:not(.admin-app) header.hdr .cat-picker,body:not(.admin-app) header.hdr .cat-picker-btn{display:flex!important;visibility:visible!important;width:auto!important;overflow:visible!important}" +
  "body.eq-shop.eq-dept-plp .eq-dept-plp-aside{display:block!important;visibility:visible!important;transform:none!important}" +
  "body.eq-shop.eq-dept-plp .eq-dept-plp-main{display:block!important;visibility:visible!important}" +
  "body.eq-shop:not(.admin-app):not(.bd-page) header.hdr .hdr-right{display:flex!important;visibility:visible!important}" +
  "body.eq-shop:not(.admin-app):not(.bd-page):not(.eq-pfos) #equsto-contact-fab{display:flex!important;position:fixed!important;right:16px!important;bottom:16px!important;z-index:9999!important;width:auto!important;height:auto!important;max-width:80px!important;max-height:80px!important;align-items:flex-end!important;visibility:visible!important;pointer-events:none!important}" +
  "body.eq-shop:not(.admin-app):not(.bd-page):not(.eq-pfos) #equsto-contact-fab .equsto-contact-wa-fab{pointer-events:auto!important;flex:0 0 auto!important;max-width:64px!important;max-height:64px!important;overflow:hidden!important}" +
  "body.eq-shop:not(.admin-app):not(.bd-page):not(.eq-pfos) #equsto-contact-fab img{width:62px!important;height:62px!important;max-width:62px!important;max-height:62px!important;object-fit:cover!important}" +
  "}</style>" +
  `<script id="eq-desktop-chrome-restore-${ASSET_V}">` +
  "(function(){var S='header.hdr a.logo,header.hdr .srch-cat,header.hdr .cat-picker,header.hdr .cat-picker-btn,nav.topnav,header+nav.topnav';" +
  "function c(){if(matchMedia('(max-width:768px)').matches)return;" +
  "document.querySelectorAll(S).forEach(function(el){['display','visibility','pointer-events','width','height','overflow'].forEach(function(p){el.style.removeProperty(p);});});}" +
  "document.addEventListener('DOMContentLoaded',c);addEventListener('pageshow',c);addEventListener('resize',c);if(document.body)c();})();" +
  "</script>\n";

function fixHeadCharsetBeforeGuard(html) {
  const guardMark = "/** file:// ile acilinca";
  if (!html.includes(guardMark)) return html;
  const gs = html.indexOf("<script>\n" + guardMark);
  const gsAlt = gs < 0 ? html.indexOf("<script>\r\n" + guardMark) : gs;
  if (gsAlt >= 0) {
    const endHit = guardScriptEndMatch(html, gsAlt);
    if (endHit) {
      let block = html.slice(gsAlt, endHit.end);
      block = block.replace(/\u2014/g, "-").replace(/\u2013/g, "-");
      html = html.slice(0, gsAlt) + block + html.slice(endHit.end);
    }
  }
  if (/<head>\s*<meta charset/i.test(html)) {
    return html.replace(
      /'<!DOCTYPE html><html lang="tr"><head>\s*\r?\n<title>Equsto - yerel sunucu gerekli<\/title>' \+/g,
      "'<!DOCTYPE html><html lang=\"tr\"><head><title>Equsto - yerel sunucu gerekli</title>' +"
    );
  }
  const charset = '<meta charset="UTF-8">\n';
  const httpEq = '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">\n';
  const guardEndHit = guardScriptEndMatch(html, 0);
  if (!guardEndHit) return html;
  const after = guardEndHit.end;
  const headPos = html.indexOf("<head>");
  if (headPos < 0) return html;
  const headOpenEnd = headPos + "<head>".length;
  let tail = html.slice(after);
  tail = tail.replace(/\s*<meta charset="UTF-8">\s*/gi, "\n");
  tail = tail.replace(/\s*<meta http-equiv="Content-Type" content="text\/html; charset=UTF-8">\s*/gi, "\n");
  html =
    html.slice(0, headOpenEnd) +
    `\n${charset}${httpEq}` +
    html.slice(headOpenEnd, after) +
    tail;
  return html.replace(
    /'<!DOCTYPE html><html lang="tr"><head>\s*\r?\n<title>Equsto - yerel sunucu gerekli<\/title>' \+/g,
    "'<!DOCTYPE html><html lang=\"tr\"><head><title>Equsto - yerel sunucu gerekli</title>' +"
  );
}

function cleanGuardInjection(html) {
  let next = html.replace(
    /<\/style>\s*(?:<link rel="stylesheet"[^>]+>\s*)+<\/head><body>/gi,
    "</style></head><body>"
  );
  const guardMark = "/** file:// ile acilinca";
  const guardStart = next.indexOf(guardMark);
  if (guardStart < 0) return next;
  const guardEndHit = guardScriptEndMatch(next, guardStart);
  if (!guardEndHit) return next;
  const guard = next.slice(guardStart, guardEndHit.start);
  const cleaned = guard
    .replace(/<link\s+rel=["']stylesheet["'][^>]*>\s*/gi, "")
    .replace(/<style id="eq-mobile-chrome-[^"]*">[\s\S]*?<\/style>\s*/gi, "");
  return next.slice(0, guardStart) + cleaned + next.slice(guardEndHit.start);
}

/** file:// guard icindeki document.write satirlarini (mobil chrome enjeksiyonu vb.) toparlar. */
function repairGuardDocumentWrite(html) {
  const guardMark = "/** file:// ile acilinca";
  const gs = html.indexOf("<script>\n" + guardMark);
  const gsAlt = gs < 0 ? html.indexOf("<script>\r\n" + guardMark) : gs;
  if (gsAlt < 0) return html;
  const endHit = guardScriptEndMatch(html, gsAlt);
  if (!endHit) return html;
  const block = html.slice(gsAlt, endHit.end);
  if (!/document\.write\s*\(/.test(block)) return html;
  if (!/eq-mobile-chrome-|<\/head><body>\s*'\s*\+/i.test(block)) return html;
  const cleanBlock = `<script>
/** file:// ile acilinca CSS/JS (/theme.css) yuklenmez - kullaniciya net mesaj. */
(function () {
  if (typeof location === "undefined" || location.protocol !== "file:") return;
  var u = "http://127.0.0.1:5173/";
  document.open();
  document.write(
    '<!DOCTYPE html><html lang="tr"><head><title>Equsto - yerel sunucu gerekli</title>' +
    '<style>body{font-family:system-ui,sans-serif;max-width:36rem;margin:2.5rem auto;padding:0 1.25rem;line-height:1.55;color:#1a1d2b}' +
    'code{background:#eef1f8;padding:.12em .35em;border-radius:4px}ol{padding-left:1.2rem}a{color:#001e50;font-weight:600}</style></head><body>' +
    "<h1>Bu sayfa dosyadan acilamaz</h1>" +
    "<p><code>file://</code> ile acinca logo, CSS ve urun verisi yuklenmez (yollar <code>/theme.css</code> gibi kokten aranir).</p>" +
    "<ol><li>Proje klasorunde <code>Site-Ac.bat</code> dosyasina cift tiklayin<br>veya terminal: <code>npm run dev</code></li>" +
    '<li>Tarayicida: <a href="' +
    u +
    '">' +
    u +
    "</a> (port farkliysa terminalde yazani kullanin)</li></ol>" +
    "<p>Canli site icin <code>dist</code> icerigini cPanel <code>public_html</code> + <code>.htaccess</code> yukleyin.</p></body></html>"
  );
  document.close();
})();
</script>`;
  return html.slice(0, gsAlt) + cleanBlock + html.slice(endHit.end);
}

function guardScriptEndMatch(html, fromIndex) {
  const slice = html.slice(fromIndex >= 0 ? fromIndex : 0);
  const m = slice.match(/\}\)\(\);\s*<\/script>/i);
  if (!m) return null;
  const start = (fromIndex >= 0 ? fromIndex : 0) + m.index;
  return { start, end: start + m[0].length };
}

function guardScriptEndIndex(html) {
  const hit = guardScriptEndMatch(html, 0);
  return hit ? hit.end : -1;
}

function headCloseIndexAfterGuard(html) {
  const searchFrom = guardScriptEndIndex(html);
  const start = searchFrom >= 0 ? searchFrom : 0;
  const bodyIdx = html.indexOf("<body", start);
  if (bodyIdx < 0) return html.indexOf("</head>", start);
  const headClose = html.lastIndexOf("</head>", bodyIdx);
  return headClose >= start ? headClose : html.indexOf("</head>", start);
}

function stripHashedCss(html) {
  return html
    .replace(/<link[^>]+href=["']\/assets\/theme-[^"']+\.css["'][^>]*>\s*/gi, "")
    .replace(/<link[^>]+href=["']\/assets\/contact-[^"']+\.css["'][^>]*>\s*/gi, "")
    .replace(/<link[^>]+href=["']\/assets\/login-[^"']+\.css["'][^>]*>\s*/gi, "")
    .replace(/<link[^>]+href=["']\/assets\/eq-dept-plp-[^"']+\.css["'][^>]*>\s*/gi, "")
    .replace(/<link[^>]+href=["']\/assets\/index-[^"']+\.css["'][^>]*>\s*/gi, "");
}

const DEPT_PLP_V = "20260522";
const deptPlpCssForInline = fs.existsSync(path.join(pub, "eq-dept-plp.css"))
  ? fs.readFileSync(path.join(pub, "eq-dept-plp.css"), "utf8")
  : "";

/** Departman PLP — Vite yalnizca ilk entry'de hash'ler; diger dept HTML'lerine sabit CSS ekle. */
function injectDeptPlpCss(html) {
  if (!/class=["'][^"']*eq-dept-plp/i.test(html)) return html;
  if (/href=["']\/eq-dept-plp\.css/i.test(html)) {
    return html.replace(
      /href=["']\/eq-dept-plp\.css(?:\?[^"']*)?["']/gi,
      `href="/eq-dept-plp.css?v=${DEPT_PLP_V}"`
    );
  }
  const link = `<link rel="stylesheet" href="/eq-dept-plp.css?v=${DEPT_PLP_V}">\n`;
  const afterMutbex = /<link\s+rel=["']stylesheet["'][^>]+href=["']\/eq-home-mutbex\.css[^>]*>\s*/i;
  if (afterMutbex.test(html)) return html.replace(afterMutbex, "$&" + link);
  const afterContact = /<link\s+rel=["']stylesheet["'][^>]+href=["']\/contact\.css[^>]*>\s*/i;
  if (afterContact.test(html)) return html.replace(afterContact, "$&" + link);
  const afterTheme = /<link\s+rel=["']stylesheet["'][^>]+href=["']\/theme\.css[^>]*>\s*/i;
  if (afterTheme.test(html)) return html.replace(afterTheme, "$&" + link);
  const headIdx = headCloseIndexAfterGuard(html);
  if (headIdx >= 0) return html.slice(0, headIdx) + link + html.slice(headIdx);
  return html;
}

function hasStableTheme(html) {
  const guardEnd = guardScriptEndIndex(html);
  const body = guardEnd >= 0 ? html.slice(guardEnd) : html;
  return /href=["']\/theme\.css/i.test(body);
}

function injectStylesheets(html, links) {
  if (hasStableTheme(html)) return html;
  const anchor = /<link\s+rel=["']manifest["']/i;
  if (anchor.test(html)) return html.replace(anchor, links + "$&");
  const headIdx = headCloseIndexAfterGuard(html);
  if (headIdx >= 0) return html.slice(0, headIdx) + links + html.slice(headIdx);
  return html;
}

/** injectMutbexCssLink hatası: theme.css satırı yarım kalırsa tüm site CSS'siz kalır */
function repairBrokenStylesheetLinks(html) {
  return html.replace(
    /<link rel="stylesheet" href="\/theme\.css\r?\n<link rel="stylesheet" href="\/eq-home-mutbex\.css\?v=([^"']+)">\?v=\1">/g,
    (_, v) =>
      `<link rel="stylesheet" href="/theme.css?v=${v}">\n<link rel="stylesheet" href="/eq-home-mutbex.css?v=${v}">`
  );
}

function bumpAssetVersions(html) {
  const q = '[^"\'>\\r\\n]*';
  let next = html
    .replace(new RegExp(`href=["']\\/theme\\.css(?:\\?${q})?["']`, "gi"), `href="/theme.css?v=${ASSET_V}"`)
    .replace(new RegExp(`href=["']\\/contact\\.css(?:\\?${q})?["']`, "gi"), `href="/contact.css?v=${ASSET_V}"`)
    .replace(new RegExp(`href=["']\\/auth\\.css(?:\\?${q})?["']`, "gi"), `href="/auth.css?v=${ASSET_V}"`)
    .replace(
      new RegExp(`href=["']\\/eq-home-mutbex\\.css(?:\\?${q})?["']`, "gi"),
      `href="/eq-home-mutbex.css?v=${ASSET_V}"`
    )
    .replace(/src=["']\/nav\.js(?:\?[^"']*)?["']/gi, `src="/nav.js?v=${ASSET_V}"`)
    .replace(/src=["']\/contact\.js(?:\?[^"']*)?["']/gi, `src="/contact.js?v=${ASSET_V}"`)
    .replace(/src=["']\/theme\.js(?:\?[^"']*)?["']/gi, `src="/theme.js?v=${ASSET_V}"`)
    .replace(/src=["']\/equsto-logo\.js(?:\?[^"']*)?["']/gi, `src="/equsto-logo.js?v=${LOGO_ASSET_V}"`)
    .replace(/src=["']equsto-logo\.js(?:\?[^"']*)?["']/gi, `src="/equsto-logo.js?v=${LOGO_ASSET_V}"`)
    .replace(/src=["']\/eq-dept-tips\.js(?:\?[^"']*)?["']/gi, `src="/eq-dept-tips.js?v=${ASSET_V}"`)
    .replace(/src=["']\/eq-category-shell\.js(?:\?[^"']*)?["']/gi, `src="/eq-category-shell.js?v=${ASSET_V}"`)
    .replace(/src=["']\/eq-mutbex-chrome\.js(?:\?[^"']*)?["']/gi, `src="/eq-mutbex-chrome.js?v=${ASSET_V}"`)
    .replace(/src=["']\/eq-shop-vitrin\.js(?:\?[^"']*)?["']/gi, `src="/eq-shop-vitrin.js?v=${ASSET_V}"`)
    .replace(/src=["']\/eq-dept-seo\.js(?:\?[^"']*)?["']/gi, `src="/eq-dept-seo.js?v=${ASSET_V}"`)
    .replace(/src=["']\/equsto-member\.js(?:\?[^"']*)?["']/gi, `src="/equsto-member.js?v=${ASSET_V}"`)
    .replace(/src=["']\/equsto-auth-client\.js(?:\?[^"']*)?["']/gi, `src="/equsto-auth-client.js?v=${ASSET_V}"`)
    .replace(/src=["']\/auth-social\.js(?:\?[^"']*)?["']/gi, `src="/auth-social.js?v=${ASSET_V}"`)
    .replace(/src=["']\/eq-i18n\.js(?:\?[^"']*)?["']/gi, `src="/eq-i18n.js?v=${ASSET_V}"`)
    .replace(/src=["']\/eq-site-urls\.js(?:\?[^"']*)?["']/gi, `src="/eq-site-urls.js?v=${ASSET_V}"`)
    .replace(/src=["']\/eq-dept-plp\.js(?:\?[^"']*)?["']/gi, `src="/eq-dept-plp.js?v=${ASSET_V}"`)
    .replace(/src=["']\/eq-dept-cm-facets\.js(?:\?[^"']*)?["']/gi, `src="/eq-dept-cm-facets.js?v=${ASSET_V}"`)
    .replace(/src=["']\/eq-fiyatlar-bridge\.js(?:\?[^"']*)?["']/gi, `src="/eq-fiyatlar-bridge.js?v=${ASSET_V}"`)
    .replace(/src=["']\/ecom-cart\.js(?:\?[^"']*)?["']/gi, `src="/ecom-cart.js?v=${CART_SYNC_V}"`);
  return next;
}

/** ecom-cart yüklü sayfalarda üye + /api/auth/cart (PC ↔ mobil sepet senkronu). */
const VENDOR_SANITIZE_V = "20260520vendor";

/** Departman PLP — rakip marka metinleri (Kariyer Mutfak vb.) */
function injectVendorSanitizeScript(html) {
  if (!/eq-dept-plp\.js/i.test(html)) return html;
  if (/eq-vendor-sanitize\.js/i.test(html)) return html;
  const tag = `<script vite-ignore src="/eq-vendor-sanitize.js?v=${VENDOR_SANITIZE_V}"></script>\n`;
  return html.replace(
    /(<script[^>]+src=["']\/eq-dept-plp\.js[^"']*["'][^>]*>\s*<\/script>)/i,
    tag + "$1"
  );
}

function injectCartAuthScripts(html) {
  if (!/\/ecom-cart\.js/i.test(html)) return html;
  var block = "";
  if (!/eq-auth-api\.js/i.test(html)) {
    block += `<script src="/eq-auth-api.js"></script>\n`;
  }
  if (!/equsto-member\.js/i.test(html)) {
    block += `<script src="/equsto-member.js?v=${ASSET_V}" defer></script>\n`;
  }
  if (!/equsto-auth-client\.js/i.test(html)) {
    block += `<script src="/equsto-auth-client.js?v=${ASSET_V}" defer></script>\n`;
  }
  if (!block) return html;
  return html.replace(
    /(<script[^>]+src=["']\/ecom-cart\.js[^"']*["'][^>]*>\s*<\/script>)/i,
    function (m) {
      var tag = m;
      if (!/\bdefer\b/i.test(tag)) {
        tag = tag.replace(/<script/i, '<script defer');
      }
      return block + tag;
    },
  );
}

function stripOldChromePatches(html) {
  return html
    .replace(/<style id="eq-contact-guard-[^"]*">[\s\S]*?<\/style>\s*/gi, "")
    .replace(/<style id="eq-mobile-chrome-[^"]*">[\s\S]*?<\/style>\s*/gi, "")
    .replace(/<style id="eq-desktop-chrome-[^"]*">[\s\S]*?<\/style>\s*/gi, "")
    .replace(/<script id="eq-desktop-chrome-restore-[^"]*">[\s\S]*?<\/script>\s*/gi, "");
}

function injectMobileChromePatch(html) {
  if (!/class=["'][^"']*eq-shop/i.test(html)) return html;
  const headIdx = headCloseIndexAfterGuard(html);
  if (headIdx < 0) return html;
  return html.slice(0, headIdx) + CONTACT_WIDGET_GUARD + MOBILE_CHROME_PATCH + DESKTOP_CHROME_PATCH + html.slice(headIdx);
}

/** eq-shop sayfalarında contact.css (WhatsApp FAB stilleri) — theme.css varken injectStylesheets atlar */
function injectContactCssLink(html) {
  if (!/class=["'][^"']*eq-shop/i.test(html)) return html;
  if (/class=["'][^"']*admin-app/i.test(html) || /class=["'][^"']*bd-page/i.test(html)) return html;
  if (/href=["']\/contact\.css/i.test(html)) return html;
  const link = `<link rel="stylesheet" href="/contact.css?v=${ASSET_V}">\n`;
  const afterTheme = /<link\s+rel=["']stylesheet["'][^>]*href=["']\/theme\.css[^"']*["'][^>]*>\s*/i;
  if (afterTheme.test(html)) return html.replace(afterTheme, "$&" + link);
  const headIdx = headCloseIndexAfterGuard(html);
  if (headIdx >= 0) return html.slice(0, headIdx) + link + html.slice(headIdx);
  return html;
}

function injectContactScript(html) {
  if (!/class=["'][^"']*eq-shop/i.test(html)) return html;
  if (/class=["'][^"']*admin-app/i.test(html) || /class=["'][^"']*bd-page/i.test(html)) return html;
  if (/src=["']\/contact\.js/i.test(html)) return html;
  const tag = `<script src="/contact.js?v=${ASSET_V}" defer></script>\n`;
  const bodyClose = html.lastIndexOf("</body>");
  if (bodyClose < 0) return html;
  return html.slice(0, bodyClose) + tag + html.slice(bodyClose);
}

function injectYoutubeEmbedCss(html) {
  if (!/eq-youtube-embed\.js/i.test(html)) return html;
  if (/eq-youtube-embed\.css/i.test(html)) return html;
  const link = '<link rel="stylesheet" href="/eq-youtube-embed.css">\n';
  const scriptTag = html.match(/<script[^>]+src=["'][^"']*eq-youtube-embed\.js["'][^>]*>/i);
  if (scriptTag) return html.replace(scriptTag[0], link + scriptTag[0]);
  const headEnd = /<\/head>/i;
  if (headEnd.test(html)) return html.replace(headEnd, link + "</head>");
  return html;
}

/** Ana sayfa Mutbex vitrin — Vite index-*.css strip sonrasi zorunlu */
function injectMutbexCssLink(html) {
  if (!/class=["'][^"']*eq-shop/i.test(html)) return html;
  if (/eq-home-mutbex\.css/i.test(html)) return html;
  if (/class=["'][^"']*bd-page/i.test(html)) return html;
  if (/class=["'][^"']*eq-pfos/i.test(html)) return html;
  if (/class=["'][^"']*admin-app/i.test(html)) return html;
  const link = `<link rel="stylesheet" href="/eq-home-mutbex.css?v=${ASSET_V}">\n`;
  const anchor = /<link\s+rel=["']stylesheet["'][^>]+href=["']\/contact\.css/i;
  if (anchor.test(html)) return html.replace(anchor, link + "$&");
  const theme =
    /<link\s+rel=["']stylesheet["'][^>]*href=["']\/theme\.css[^"']*["'][^>]*>\s*/i;
  if (theme.test(html)) return html.replace(theme, "$&" + link.trim() + "\n");
  const headEnd = /<\/head>/i;
  if (headEnd.test(html)) return html.replace(headEnd, link + "</head>");
  return html;
}

function injectHomeMutbexCss(html) {
  return injectMutbexCssLink(html);
}

/** Departman PLP — çift theme.js/nav.js bloklarını kaldır (deploy sonrası kategoriler kaybolmasın). */
function dedupeDeptScriptBlocks(html) {
  if (!/eq-dept-plp/i.test(html)) return html;
  const blockRe =
    /<script[^>]+src=["']\/theme\.js[^"']*["'][^>]*><\/script>\s*<script[^>]+src=["']\/equsto-logo\.js[^"']*["'][^>]*><\/script>\s*<script[^>]+src=["']\/eq-i18n\.js[^"']*["'][^>]*><\/script>\s*<script[^>]+src=["']\/eq-site-urls\.js[^"']*["'][^>]*><\/script>\s*<script[^>]+src=["']\/nav\.js[^"']*["'][^>]*><\/script>\s*/gi;
  let n = 0;
  return html.replace(blockRe, function (m) {
    n += 1;
    return n === 1 ? m : "";
  });
}

function processHtmlFile(fp) {
  let html = fs.readFileSync(fp, "utf8");
  const isLogin = path.basename(fp) === "login.html";
  let next = fixHeadCharsetBeforeGuard(html);
  next = repairBrokenStylesheetLinks(next);
  next = repairGuardDocumentWrite(next);
  next = cleanGuardInjection(next);
  next = stripHashedCss(next);
  next = injectStylesheets(next, isLogin ? loginLinks : defaultLinks);
  next = bumpAssetVersions(next);
  next = stripOldChromePatches(next);
  next = injectMobileChromePatch(next);
  next = injectContactScript(next);
  next = injectYoutubeEmbedCss(next);
  next = injectContactCssLink(next);
  next = injectMutbexCssLink(next);
  next = injectDeptPlpCss(next);
  if (deptPlpCssForInline) next = injectDeptPlpInlineCss(next, deptPlpCssForInline);
  next = injectVendorSanitizeScript(next);
  next = injectCartAuthScripts(next);
  next = next.replace(
    /(<script)([^>]*\ssrc=["']\/ecom-cart\.js[^"']*["'][^>]*)(>\s*<\/script>)/gi,
    function (m, open, mid, close) {
      if (/\bdefer\b/i.test(mid)) return m;
      return open + " defer" + mid + close;
    },
  );
  next = dedupeDeptScriptBlocks(next);
  if (next !== html) {
    fs.writeFileSync(fp, next, "utf8");
    return true;
  }
  return false;
}

let n = 0;
for (const baseDir of [dist, pub]) {
  for (const fp of walkHtml(baseDir)) {
    if (processHtmlFile(fp)) n++;
  }
}

console.log("[fix-dist-html-css] sabit /theme.css ?v=" + ASSET_V + " —", n, "html guncellendi (dist+public).");
