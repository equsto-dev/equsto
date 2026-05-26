import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const fp = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public", "eq-category-shell.js");
let s = fs.readFileSync(fp, "utf8");
s = s.replace(
  /'<button ' \+ cartAttrs \+ '>Sepete ekle<\/button><\/div><\/motion>';\s*\n\s*\);/,
  "'<button ' + cartAttrs + '>Sepete ekle</button></div></motion>'\n      );",
);
s = s.replace(
  /'<button ' \+ cartAttrs \+ '>Sepete ekle<\/button><\/div><\/div>';\s*\n\s*\);/,
  "'<button ' + cartAttrs + '>Sepete ekle</button></div></div>'\n      );",
);
fs.writeFileSync(fp, s, "utf8");
console.log("ok");
