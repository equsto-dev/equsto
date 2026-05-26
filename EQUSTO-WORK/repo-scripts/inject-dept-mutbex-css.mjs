import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const pub = path.join(root, "public");
const ASSET_V = "20260518q";
const link = `<link rel="stylesheet" href="/eq-home-mutbex.css?v=${ASSET_V}">\n`;

const files = [
  "pisirme.html",
  "sogutma.html",
  "kahve.html",
  "yikama.html",
  "hazirlik.html",
  "icecek.html",
  "market-reyonlari.html",
  "product.html",
  "marka.html",
  "contact.html",
];

let n = 0;
for (const f of files) {
  const fp = path.join(pub, f);
  if (!fs.existsSync(fp)) continue;
  let html = fs.readFileSync(fp, "utf8");
  if (/eq-home-mutbex\.css/i.test(html)) continue;
  if (!/class=["'][^"']*eq-shop/i.test(html)) continue;
  const anchor = /<link\s+rel=["']stylesheet["'][^>]+href=["']\/contact\.css/i;
  if (anchor.test(html)) {
    html = html.replace(anchor, link + "$&");
  } else {
    const theme = /<link\s+rel=["']stylesheet["'][^>]+href=["']\/theme\.css/i;
    if (theme.test(html)) html = html.replace(theme, "$&\n" + link.trim());
  }
  fs.writeFileSync(fp, html);
  n++;
}
console.log("[inject-dept-mutbex-css] updated", n, "files");
