/**
 * ekipmanlar.json dosyası yarım kaldıysa (son ürünün "specs" string'i kapanmadan bitti)
 * bu script son kaydı kapatıp diziyi geçerli JSON yapar.
 * Çalıştır: npm run data:repair-json-tail
 */
import fs from "fs";

const p = new URL("../public/data/ekipmanlar.json", import.meta.url);
let s = fs.readFileSync(p, "utf8");
const needle = "\\r\\n\\tOto";
const i = s.lastIndexOf(needle);
if (i < 0) {
  console.error("Truncation marker not found (already repaired?)");
  process.exit(1);
}
if (s.slice(i, i + needle.length) !== needle) {
  console.error("Unexpected tail:", JSON.stringify(s.slice(i, i + 80)));
  process.exit(1);
}
const insert =
  "\\r\\n\\tOtomatik termostat. Paslanmaz çelik kasa.\",\n        \"images\": [\n            \"images\\\\remta-yuvarlak-kornet-makinesi-kt2_1.png\"\n        ]\n    }\n]\n";
s = s.slice(0, i) + insert;
fs.writeFileSync(p, s, "utf8");
const arr = JSON.parse(fs.readFileSync(p, "utf8"));
console.log("ekipmanlar.json OK, ürün sayısı:", arr.length);
