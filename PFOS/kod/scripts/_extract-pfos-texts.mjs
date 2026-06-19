import { PfosBodyHtml } from "../lib/vitrin/bodies/pfos.ts";
import fs from "node:fs";
const s = PfosBodyHtml;
// extract visible Turkish-ish text nodes (rough)
const texts = new Set();
const re = />([^<]{3,120})</g;
let m;
while ((m = re.exec(s))) {
  const t = m[1].replace(/\s+/g, " ").trim();
  if (/[A-Za-zğüşıöçĞÜŞİÖÇ]/.test(t) && !/^EQ-SK/.test(t)) texts.add(t);
}
const arr = [...texts].sort();
fs.writeFileSync("scripts/_pfos-texts.txt", arr.join("\n"), "utf8");
console.log("count", arr.length);
