import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const file = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../public/set-ustu-mutfak.html"
);
let s = fs.readFileSync(file, "utf8");

s = s.replace(
  "<title>Set Üstü Mutfak Ekipmanları ? Öztiryakiler ? Equsto</title>",
  "<title>Set Üstü Mutfak Ekipmanları · Öztiryakiler · Equsto</title>"
);
s = s.replace(
  'content="Set ?st? mutfak ekipmanlar? ? servis gereçleri, gastronorm, chafing dish, tencere ve mutfak aksesuarları ? Öztiryakiler katalog ? Equsto"',
  'content="Set üstü mutfak ekipmanları — servis gereçleri, gastronorm, chafing dish, tencere ve mutfak aksesuarları · Öztiryakiler katalog · Equsto"'
);
s = s.replace(
  "/* Pişirme PLP v2 ? bağımsız, Cafemarkt tarzı */",
  "/* Set üstü PLP v2 — bağımsız, Cafemarkt tarzı */"
);

fs.writeFileSync(file, s, "utf8");
console.log("[patch-set-ustu] done");
