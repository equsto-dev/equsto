import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const p = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public", "eq-bar-design-vitrum.js");
let s = fs.readFileSync(p, "utf8");

const start = s.indexOf("    var hero = mod.image ? dataAsset(mod.image) : \"\";");
const end = s.indexOf("    var foot =", start);
if (start < 0 || end < 0) {
  console.error("not found", start, end);
  process.exit(1);
}

const rep = `    var hero = mod.image ? dataAsset(mod.image) : "";
    var href = moduleHref(mod.slug || mod);
    var title = modLabel(mod);
    var code = mod.code ? String(mod.code) : "";
    var dim = mod.totalDimensionsMm ? String(mod.totalDimensionsMm) + " mm" : "";
    var mediaInner;
    if (hero) {
      mediaInner =
        '<motion div class="bd-portfolio-panel-media">' + panelImgHtml(hero, title) + "</div>";
    } else {
      mediaInner =
        '<div class="bd-portfolio-empty">' +
        esc(code || title) +
        (dim ? " · " + esc(dim) : "") +
        "</div>";
    }
`;

let next = s.slice(0, start) + rep.replace(/<motion div/g, "<div") + s.slice(end);
fs.writeFileSync(p, next);
console.log("[patch] portfolio-tech gone:", !next.includes("bd-portfolio-tech"));
