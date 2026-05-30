import fs from "node:fs";
import path from "node:path";

const root = path.join(import.meta.dirname, "..");
const htmlPath = path.join(root, "public", "product.html");
const outPath = path.join(root, "public", "eq-product-page-inline.js");

const html = fs.readFileSync(htmlPath, "utf8");
const marker = '<script src="/eq-product-card-tint.js"></script>';
const i = html.indexOf(marker);
if (i < 0) {
  console.error("marker not found:", marker);
  process.exit(1);
}
const start = html.indexOf("<script>", i + marker.length);
const end = html.indexOf("</script>", start);
if (start < 0 || end < 0) {
  console.error("inline script block not found after marker");
  process.exit(1);
}
const js = html.slice(start + "<script>".length, end).trim();
fs.writeFileSync(outPath, js + "\n", "utf8");
console.log("wrote", path.relative(root, outPath), `(${js.length} chars)`);
