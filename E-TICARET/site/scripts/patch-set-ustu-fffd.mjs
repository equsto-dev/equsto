import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const file = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../public/set-ustu-mutfak.html"
);
let s = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");

s = s.replace(
  /<title>[\s\S]*?<\/title>/,
  "<title>Set Üstü Mutfak Ekipmanları · Öztiryakiler · Equsto</title>"
);
s = s.replace(
  /<meta name="description" content="[^"]*"/,
  '<meta name="description" content="Set üstü mutfak ekipmanları — servis gereçleri, gastronorm, chafing dish, tencere ve mutfak aksesuarları · Öztiryakiler katalog · Equsto"'
);

const pairs = [
  ["\uFFFD", ""],
  ["? T?m Kategoriler", "☰ Tüm Kategoriler"],
  ["? T?m kategoriler", "☰ Tüm kategoriler"],
  ["?stanbul", "İstanbul"],
  ["T?rkiye", "Türkiye"],
  ["?r?n, marka", "Ürün, marka"],
  ["Hesab?m", "Hesabım"],
  ["Pi?irme", "Pişirme"],
  ["So?utma", "Soğutma"],
  ["Y?kama", "Yıkama"],
  ["Haz?rl?k", "Hazırlık"],
  ["??ecek", "İçecek"],
  ["?al??ma", "Çalışma"],
  ["Ekipmanlar?", "Ekipmanları"],
  ["Fabrikas?", "Fabrikası"],
  ["S?ralama", "Sıralama"],
  ["Kar???k S?ra", "Karışık Sıra"],
  ["y?kleniyor?", "yükleniyor…"],
  ["Set ?st? Mutfak", "Set Üstü Mutfak"],
  ["Pi?irme PLP v2 ? ba??ms?z", "Set üstü PLP v2 — bağımsız"],
  ["Cafemarkt tarz?", "Cafemarkt tarzı"],
];
for (const [a, b] of pairs) {
  if (a && s.includes(a)) s = s.split(a).join(b);
}

fs.writeFileSync(file, s, "utf8");
const left = (s.match(/\uFFFD/g) || []).length;
console.log("[patch-set-ustu-fffd] U+FFFD kalan:", left);
