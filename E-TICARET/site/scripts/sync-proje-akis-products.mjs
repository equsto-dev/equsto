/**
 * proje-akis.json products[] ← public/data/ekipmanlar.json (güncel katalog)
 * Kullanım: node scripts/sync-proje-akis-products.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const EKIP = existsSync(join(root, "var/catalog/ekipmanlar.json"))
  ? join(root, "var/catalog/ekipmanlar.json")
  : join(root, "public/data/ekipmanlar.json");
const PROJE = join(root, "public/data/proje-akis.json");

const DEPT_TO_CAT = {
  pisirme: "pisirme",
  sogutma: "sogutma",
  icecek: "icecek",
  yikama: "yikama",
  hazirlik: "hazirlik",
  tezgah: "tezgah_davlumbaz",
  depolama: "depolama",
  araba: "araba",
  yardimci: "yardimci",
  sunum: "sunum",
  diger: "diger",
};

function ecomId(name, i) {
  const idSafe = String(name || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `ecom_${idSafe || "p"}_${i}`;
}

function rowToProjeProduct(u, i) {
  const name = String(u?.name || "").trim();
  const dept = String(u?.dept || "").trim();
  return {
    id: ecomId(name, i),
    cat: DEPT_TO_CAT[dept] || "diger",
    name,
    brand: String(u?.brand || ""),
    model: String(u?.model || u?.sku || ""),
    tip_kodu: String(u?.sku || u?.model || ""),
  };
}

const ekipRaw = JSON.parse(readFileSync(EKIP, "utf8"));
const rows = Array.isArray(ekipRaw) ? ekipRaw : ekipRaw?.items || [];
if (!rows.length) {
  console.error("ekipmanlar.json boş");
  process.exit(1);
}

const products = rows.map(rowToProjeProduct);

const projeRaw = JSON.parse(readFileSync(PROJE, "utf8"));
const data = projeRaw.data ?? projeRaw;
const prev = Array.isArray(data.products) ? data.products.length : 0;

data.products = products;
data.updated_at = new Date().toISOString();

const out = projeRaw.data != null ? { ...projeRaw, data } : data;
writeFileSync(PROJE, JSON.stringify(out, null, 2) + "\n", "utf8");

console.log(
  `proje-akis products: ${prev} → ${products.length} (ekipmanlar.json ${rows.length})`,
);
