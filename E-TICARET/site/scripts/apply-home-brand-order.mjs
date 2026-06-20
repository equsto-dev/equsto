/**
 * Ana sayfa #eq-home-brand-grid — eq-brand-order.js ile aynı sıra (karıştırma yok).
 */
import { readFileSync, writeFileSync } from "fs";

const brands = [
  { label: "İnoksan", href: "/shop/marka/inoksan" },
  { label: "Electrolux Professional", href: "/shop/pisirme?marka=Electrolux+Professional" },
  { label: "Şenox", href: "/shop/sogutma?marka=Senox" },
  { label: "Rational", href: "/shop/pisirme?marka=Rational" },
  { label: "Öztiryakiler", href: "/shop/marka/oztiryakiler" },
  { label: "Robot Coupe", href: "/shop/hazirlik?marka=Robot%20Coupe" },
  { label: "Atalay", href: "/shop/pisirme?marka=Atalay" },
  { label: "Faema", href: "/shop/kahve?marka=Faema" },
  { label: "Sanremo", href: "/shop/kahve?marka=Sanremo" },
  { label: "Gtech", href: "/shop/hazirlik?marka=Gtech" },
  { label: "La Cimbali", href: "/shop/kahve?marka=La%20Cimbali" },
];

const cells = brands
  .map((b) => `            <a class="eq-brand-cell" href="${b.href}">${b.label}</a>`)
  .join("\r\n");

const path = "lib/vitrin/bodies/index.ts";
const s = readFileSync(path, "utf8");
const prefix = 'export const IndexBodyHtml = "';
const start = s.indexOf(prefix) + prefix.length;
let i = start;
let html = "";
while (i < s.length) {
  const c = s[i];
  if (c === "\\" && s[i + 1] === '"') {
    html += '"';
    i += 2;
    continue;
  }
  if (c === "\\" && s[i + 1] === "r") {
    html += "\r";
    i += 2;
    continue;
  }
  if (c === "\\" && s[i + 1] === "n") {
    html += "\n";
    i += 2;
    continue;
  }
  if (c === '"' && s[i - 1] !== "\\") break;
  html += c;
  i++;
}

const gridRe = /<div class="eq-brand-grid" id="eq-home-brand-grid">[\s\S]*?<\/div>/;
const newGrid = `<div class="eq-brand-grid" id="eq-home-brand-grid">\r\n${cells}\r\n          </div>`;
if (!gridRe.test(html)) {
  console.error("brand grid not found");
  process.exit(1);
}
const newHtml = html.replace(gridRe, newGrid);
console.log(brands.map((b) => b.label).join(" → "));

function escapeForTs(str) {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r/g, "\\r")
    .replace(/\n/g, "\\n")
    .replace(/\t/g, "\\t");
}
writeFileSync(path, s.slice(0, start) + escapeForTs(newHtml) + '";' + s.slice(i + 1));
