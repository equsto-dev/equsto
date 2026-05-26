import fs from "node:fs";
const h = fs.readFileSync("public/pfos.html", "utf8");
const re = /<script\s+src="\/equsto-adres-national\.js"><\/script>\s*<script>([\s\S]*?)<\/script>\s*<script\s+src="\/ecom-cart/;
const m = h.match(re);
if (!m) {
  console.error("script block not found");
  process.exit(1);
}
const js = m[1];
try {
  new Function(js);
  console.log("parse OK", js.length);
} catch (e) {
  console.error("parse ERR", e.message);
  process.exit(1);
}
console.log("o1 init", js.includes("getElementById('o1')"));
console.log("MESLEKLER", js.includes("const MESLEKLER"));
