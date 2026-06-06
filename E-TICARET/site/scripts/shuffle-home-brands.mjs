import { readFileSync, writeFileSync } from "fs";

const brands = [
  { label: "Atalay", href: "/shop/pisirme?marka=Atalay" },
  { label: "Öztiryakiler", href: "/shop/marka/oztiryakiler" },
  { label: "Electrolux", href: "/shop/pisirme?marka=Electrolux" },
  { label: "İnoksan", href: "/shop/sogutma?marka=%C4%B0noksan" },
  { label: "La Cimbali", href: "/shop/kahve?marka=La%20Cimbali" },
  { label: "Faema", href: "/shop/kahve?marka=Faema" },
  { label: "Rational", href: "/shop/pisirme?marka=Rational" },
  { label: "Samixir", href: "/shop/hazirlik?marka=Samixir" },
  { label: "Gtech", href: "/shop/hazirlik?marka=Gtech" },
  { label: "Robot Coupe", href: "/shop/hazirlik?marka=Robot%20Coupe" },
  { label: "Şenox", href: "/shop/sogutma?marka=Senox" },
];

const seed = Number(process.argv[2] || Date.now()) & 0x7fffffff;
function rand() {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}
const next = rand();
for (let i = brands.length - 1; i > 0; i--) {
  const j = Math.floor(next() * (i + 1));
  [brands[i], brands[j]] = [brands[j], brands[i]];
}

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
console.log(brands.map((b) => b.label).join(", "));

function escapeForTs(str) {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r/g, "\\r")
    .replace(/\n/g, "\\n")
    .replace(/\t/g, "\\t");
}
writeFileSync(path, s.slice(0, start) + escapeForTs(newHtml) + '";' + s.slice(i + 1));
