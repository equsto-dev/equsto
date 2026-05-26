import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const p = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public", "bar-design.html");
let h = fs.readFileSync(p, "utf8");

h = h.replace(/\s*<div id="bd-vitrum-sig-trio"><\/div>\r?\n?/, "\n");
h = h.replace(
  /\s*<!-- ============ SIGNATURE BARS[\s\S]*?<\/section>\r?\n\r?\n  <!-- ============ TAM KATALOG/,
  "\n\n  <!-- ============ TAM KATALOG"
);

fs.writeFileSync(p, h);
console.log("[patch] sig-trio gone:", !h.includes("bd-vitrum-sig-trio"));
console.log("[patch] bes-signature gone:", !h.includes("bes-signature"));
