import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const p = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public", "bar-design.html");
let h = fs.readFileSync(p, "utf8");

const start = h.indexOf("      var dims = [];");
const endMarker = "    function isBdSignatureHero(p) {";
const end = h.indexOf(endMarker, start);
if (start < 0 || end < 0) {
  console.error("markers not found", start, end);
  process.exit(1);
}

const replacement = `      return (
        '<article class="vit-card-row vit-card-row--summary" data-page="' + esc(pageRef) + '" title="' + esc(title) + '">' +
          '<div class="vit-card">' +
            '<a class="vit-card-hero" href="' + esc(href) + '" aria-label="' + esc(title) + esc(quoteSuffix) + '">' + hero + '</a>' +
            '<div class="vit-card-info">' +
              '<div class="vit-card-info-cat">' + esc(cat) + (pageRef ? ' · P.' + esc(pageRef) : '') + '</div>' +
              '<h3 class="vit-card-info-h">' + esc(title) + '</h3>' +
              (description ? '<p class="vit-card-info-desc">' + esc(description) + '</p>' : '') +
              featsHtml +
            '</div>' +
          '</div>' +
          '<div class="vit-card-foot">' +
            '<span class="vit-card-foot-brand">' + esc(footBrand) + '</span>' +
            '<span class="vit-card-foot-actions">' +
              '<a class="vit-card-foot-cta" href="' + esc(href) + '">' + esc(modulePage) + '</a>' +
              '<a class="vit-card-foot-cta vit-card-foot-cta--quote" href="pfos.html">' + esc(quoteArrow) + '</a>' +
            '</span>' +
          '</div>' +
        '</article>'
      );
    }

    ${endMarker}`;

h = h.slice(0, start) + replacement + h.slice(end + endMarker.length);

const sigStart = h.indexOf("    function signaturePageHtml(p, index) {");
const renderVitrumAll = h.indexOf("    function renderVitrumAll() {");
if (sigStart > 0 && renderVitrumAll > sigStart) {
  h = h.slice(0, sigStart) + h.slice(renderVitrumAll);
}

h = h.replace(
  /    function renderVitrumAll\(\) \{\r?\n      renderSignatureBars\(\);\r?\n/,
  "    function renderVitrumAll() {\n"
);

h = h.replace(
  /      if \(description\.length > 140\) description = description\.slice\(0, 137\) \+ '\\u2026';\r?\n      var total = nz\(p\.totalDimensionsMm\);\r?\n      var pageRef/,
  "      if (description.length > 140) description = description.slice(0, 137) + '\\u2026';\n      var pageRef"
);

fs.writeFileSync(p, h);
console.log("[patch] vit-card-dims-h gone:", !h.includes("vit-card-dims-h"));
console.log("[patch] signaturePageHtml gone:", !h.includes("signaturePageHtml"));
