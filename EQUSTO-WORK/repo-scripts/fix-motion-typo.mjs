import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const files = [
  path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public", "eq-category-shell.js"),
  path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public", "eq-shop-vitrin.js"),
];

for (const fp of files) {
  let s = fs.readFileSync(fp, "utf8");
  const before = s;
  s = s.replace(/<\/motion>/gi, "</div>");
  s = s.replace(/<motion class="/gi, '<div class="');
  s = s.replace(/\)\s*\.replace\(\s*'<\/div>'\s*,\s*'<\/div>'\s*\)\s*;/g, ";");
  if (s !== before) {
    fs.writeFileSync(fp, s, "utf8");
    console.log("fixed", path.basename(fp));
  }
}
