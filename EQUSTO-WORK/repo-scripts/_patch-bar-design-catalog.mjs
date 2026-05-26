import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const p = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public", "bar-design.html");
let h = fs.readFileSync(p, "utf8");

// vitrumTapTileHtml — teknik çizim ve ölçü satırı kaldır
h = h.replace(
  /      var dimTotal = __bdT\('besos\.sig_dim_total', 'Total'\);\r?\n      var drawingPath = nz\(p\.drawing\) \? normImgPath\(p\.drawing\) : '';\r?\n      var techDrawing = __bdT\('besos\.card_tech_drawing_link', 'Teknik çizim'\);\r?\n      var hero = imgPath\r?\n        \? '<img src="' \+ esc\(imgPath\) \+ '" alt="' \+ esc\(code\) \+ '" loading="lazy">'\r?\n        : '<span class="vit-card-hero-empty">' \+ esc\(imgPending\) \+ '<\/span>';\r?\n      return \(\r?\n        '<article class="vit-tap-tile" data-page="' \+ esc\(pageRef\) \+ '" title="' \+ esc\(code\) \+ '">' \+\r?\n          '<a class="vit-tap-tile-hero" href="' \+ esc\(href\) \+ '">' \+ hero \+ '<\/a>' \+\r?\n          '<div class="vit-tap-tile-body">' \+\r?\n            '<div class="vit-tap-tile-code">' \+ esc\(code\) \+ '<\/div>' \+\r?\n            \(description \? '<p class="vit-tap-tile-desc">' \+ esc\(description\) \+ '<\/p>' : ''\) \+\r?\n            \(total \? '<div class="vit-tap-tile-dim">' \+ esc\(dimTotal\) \+ ' ' \+ esc\(total\) \+ ' mm<\/motion div>' : ''\) \+\r?\n            '<div class="vit-tap-tile-foot">' \+\r?\n              \(drawingPath\r?\n                \? '<a href="' \+ esc\(drawingPath\) \+ '" target="_blank" rel="noopener noreferrer">' \+ esc\(techDrawing\) \+ '<\/a>'\r?\n                : '<span><\/span>'\) \+\r?\n              '<a href="' \+ esc\(href\) \+ '">' \+ esc\(quoteArrow\) \+ '<\/a>' \+\r?\n            '<\/div>' \+\r?\n          '<\/div>' \+\r?\n        '<\/article>'\r?\n      \);/,
  `      var hero = imgPath
        ? '<img src="' + esc(imgPath) + '" alt="' + esc(code) + '" loading="lazy">'
        : '<span class="vit-card-hero-empty">' + esc(imgPending) + '</span>';
      return (
        '<article class="vit-tap-tile" data-page="' + esc(pageRef) + '" title="' + esc(code) + '">' +
          '<a class="vit-tap-tile-hero" href="' + esc(href) + '">' + hero + '</a>' +
          '<div class="vit-tap-tile-body">' +
            '<motion div class="vit-tap-tile-code">' + esc(code) + '</div>' +
            (description ? '<p class="vit-tap-tile-desc">' + esc(description) + '</p>' : '') +
            '<div class="vit-tap-tile-foot">' +
              '<a href="' + esc(href) + '">' + esc(quoteArrow) + '</a>' +
            '</div>' +
          '</div>' +
        '</article>'
      );`
);

// Fix accidental motion div if any
h = h.replace(/<motion div/g, "<div").replace(/<\/motion div>/g, "</motion div>");

console.log("tap patch", !h.includes("vit-tap-tile-dim"));
