/**
 * ekipmanlar.json → urun-tam-liste.csv
 * Sütunlar: Tedarikçi | Üretici marka | Ürün tanımı | Görsel | Fiyat (+ SKU, dept)
 *
 * node veri/export-urun-tam-liste.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { detectOztiOemBrand, isOztiBrand } from "../../E-TICARET/site/scripts/lib/ozti-enrich.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE_ROOT = path.resolve(HERE, "../../E-TICARET/site");
const OUT = path.join(HERE, "urun-tam-liste.csv");
const OUT_OZTI_BAYI = path.join(HERE, "urun-ozti-bayi.csv");
const SITE = "https://equsto.com";

const rows = JSON.parse(
  fs.readFileSync(path.join(SITE_ROOT, "public/data/ekipmanlar.json"), "utf8"),
);

let fiyatMap = {};
try {
  const fj = JSON.parse(
    fs.readFileSync(path.join(SITE_ROOT, "public/data/fiyatlar.json"), "utf8"),
  );
  fiyatMap = fj.data || {};
} catch {
  /* optional */
}

function esc(v) {
  const s = String(v ?? "").replace(/"/g, '""');
  return /[",\n\r]/.test(s) ? `"${s}"` : s;
}

function fmtPrice(r) {
  if (r.fiyat_tl != null && r.fiyat_tl !== "") {
    return `${Number(r.fiyat_tl).toLocaleString("tr-TR")} TL + KDV`;
  }
  const sku = String(r.sku || r.model || "").trim();
  const slug = String(r.id || "").trim();
  for (const k of [sku, slug, sku.toLowerCase(), slug.toLowerCase()]) {
    if (k && fiyatMap[k] != null) {
      return `${Number(fiyatMap[k]).toLocaleString("tr-TR")} TL + KDV`;
    }
  }
  const p = String(r.price || "").split("\n")[0].trim();
  return p || "—";
}

function imgUrl(r) {
  const im = r.images?.[0] ? String(r.images[0]).trim() : "";
  if (!im) return "";
  if (/^https?:\/\//i.test(im)) return im;
  return `${SITE}/${im.replace(/^\//, "")}`;
}

function ureticiMarka(r) {
  const oem = String(r.oem_brand || "").trim();
  if (oem) return oem;
  if (isOztiBrand(r)) {
    return detectOztiOemBrand(r.name, r.category, r.sku || r.model);
  }
  const b = String(r.brand || "").trim();
  if (/öztiryakiler|oztiryakiler/i.test(b)) return "Öztiryakiler";
  return b || "—";
}

function tedarikci(r) {
  const b = String(r.brand || "").trim();
  if (/öztiryakiler|oztiryakiler/i.test(b)) return "Öztiryakiler Endüstriyel Mutfak";
  return b || "—";
}

const header = [
  "Tedarikci",
  "Uretici marka",
  "Urun tanimi",
  "Gorsel",
  "Fiyat",
  "SKU",
  "Departman",
  "Kategori",
];

function rowLine(r) {
  return [
    tedarikci(r),
    ureticiMarka(r),
    r.name || "",
    imgUrl(r),
    fmtPrice(r),
    r.sku || r.model || "",
    r.dept || "",
    r.category || "",
  ]
    .map(esc)
    .join(",");
}

const lines = [header.map(esc).join(",")];
const oztiBayiLines = [header.map(esc).join(",")];

for (const r of rows) {
  lines.push(rowLine(r));
  if (isOztiBrand(r) && ureticiMarka(r) !== "Öztiryakiler") {
    oztiBayiLines.push(rowLine(r));
  }
}

fs.writeFileSync(OUT, "\ufeff" + lines.join("\n"), "utf8");
fs.writeFileSync(OUT_OZTI_BAYI, "\ufeff" + oztiBayiLines.join("\n"), "utf8");

const withPrice = rows.filter((r) => fmtPrice(r) !== "—").length;
const withImg = rows.filter((r) => r.images?.length).length;
const ureticiSet = new Set(rows.map(ureticiMarka).filter((x) => x && x !== "—"));

console.log(
  JSON.stringify(
    {
      out: OUT,
      outOztiBayi: OUT_OZTI_BAYI,
      count: rows.length,
      oztiBayiCount: oztiBayiLines.length - 1,
      withPrice,
      withImg,
      ureticiMarkaCount: ureticiSet.size,
    },
    null,
    2,
  ),
);
