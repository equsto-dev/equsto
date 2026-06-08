#!/usr/bin/env node
/**
 * PDF s.100–130 hazırlık kodları vs manifest + site hazirlik
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(ROOT, "../../E-TICARET/site");
const MANIFEST = path.join(ROOT, "products-tr.json");
const PAGES = path.join(ROOT, "urun-sayfalari");
const HAZIRLIK = path.join(SITE, "public/data/dept/hazirlik.json");
const PRICE = path.join(SITE, "scripts/data/pimak-fiyat.json");

function norm(k) {
  return String(k || "")
    .replace(/\s+/g, "")
    .trim()
    .toUpperCase();
}

const py = execFileSync(
  process.platform === "win32" ? "python" : "python3",
  [
    "-c",
    `
import fitz, json, re, sys
sys.path.insert(0, r"${SITE.replace(/\\/g, "/")}/scripts")
from sync_pimak_fiyat_pdf import extract_pairs_from_page, norm_kod
pdf = r"C:/D Disk/FİYAT LİSTELERİ/pimak 27-27-030426.pdf"
doc = fitz.open(pdf)
out = {}
for pno in range(99, 130):
    for code, price in extract_pairs_from_page(doc[pno].get_text("text")):
        k = norm_kod(code)
        out[k] = {"code": code, "price": price, "page": pno + 1}
print(json.dumps(out, ensure_ascii=False))
`,
  ],
  { encoding: "utf8" },
).trim();

// fallback: inline parse if import fails
let pdfCodes;
try {
  pdfCodes = JSON.parse(py);
} catch {
  const r = execFileSync("python", [path.join(SITE, "scripts/sync-pimak-fiyat-pdf.py"), "--pdf", "c:\\D Disk\\FİYAT LİSTELERİ\\pimak 27-27-030426.pdf"], {
    encoding: "utf8",
    cwd: SITE,
  });
  const all = JSON.parse(fs.readFileSync(PRICE, "utf8"));
  pdfCodes = {};
  for (const [k, v] of Object.entries(all)) {
    if (k.startsWith("_")) continue;
    pdfCodes[norm(k)] = { code: v.urun_kodu || k, price: v.liste_fiyati_eur };
  }
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
const byKod = new Map();
for (const p of manifest.products || []) {
  if (p.urunKodu) byKod.set(norm(p.urunKodu), p);
}

const haz = JSON.parse(fs.readFileSync(HAZIRLIK, "utf8"))
  .filter((r) => r.brand === "Pimak")
  .map((r) => norm(r.urun_kodu));

const pdfList = Object.entries(pdfCodes).map(([k, v]) => ({ k, ...v }));
console.log("PDF p100-130 codes:", pdfList.length);

const missingScrape = [];
const missingSite = [];
const onSite = [];

for (const row of pdfList.sort((a, b) => a.page - b.page)) {
  const m = byKod.get(row.k);
  const slug = m?.slug;
  const hasPage = slug && fs.existsSync(path.join(PAGES, `${slug}.json`));
  const onHaz = haz.includes(row.k);
  if (!m || !hasPage) missingScrape.push(row);
  else if (!onHaz) missingSite.push({ ...row, slug, name: m.baslik });
  else onSite.push(row.k);
}

console.log("on site hazirlik:", onSite.length);
console.log("scraped but not hazirlik:", missingSite.length);
missingSite.forEach((r) => console.log("  site?", r.page, r.code, r.name?.slice(0, 40)));
console.log("need scrape:", missingScrape.length);
missingScrape.forEach((r) => console.log("  scrape", r.page, r.code, r.price));
