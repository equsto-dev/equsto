/**
 * ATALAY 2025 PDF kataloğu → dept vitrin (ekipmanlar.json KULLANILMAZ).
 *
 *   npm run catalog:atalay:extract   # PDF → raw JSON
 *   npm run catalog:atalay:build   # raw → dept/*.json
 *   npm run catalog:atalay:pdf     # extract + build + döner parse + görseller
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DONER_OCAK_ROWS } from "./data/atalay-doner-ocak-source.mjs";
import { fetchTcmbEurRate } from "./fetch-tcmb-kur.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const RAW = path.join(ROOT, "scripts/data/atalay-pdf-catalog-raw.json");
const KMAP = path.join(ROOT, "scripts/data/atalay-kategori-map.json");
const CATALOG_OUT = path.join(ROOT, "scripts/data/atalay-pdf-catalog.json");
const BRAND = "Atalay Endüstriyel Mutfak Ekipmanları";
const BRAND_ID = "atalay-endustriyel-mutfak-ekipmanlari";

const DEPT_FILES = ["pisirme", "kahve", "hazirlik", "araba"];
const DISCOUNT_TABLE = 0.5;
const DISCOUNT_DONER = 0.4;

const tcmb = await fetchTcmbEurRate();
const EUR_TRY = Number(process.env.EQUSTO_EUR_TRY) > 0 ? Number(process.env.EQUSTO_EUR_TRY) : tcmb.rate;

function slugSku(model) {
  return String(model)
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/–/g, "-")
    .replace(/—/g, "-")
    .replace(/[^A-Z0-9+\-/]/g, "");
}

function slugId(model) {
  return `${BRAND_ID}__${slugSku(model).toLowerCase().replace(/\+/g, "-plus-")}`;
}

function slugImage(model, page, isDoner) {
  const base = `atalay-${String(model)
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/\+/g, "-plus-")
    .replace(/[^a-z0-9+\-]/g, "")}`;
  if (isDoner) return `/images/catalog/atalay/doner/${base}.jpg`;
  return `/images/catalog/atalay/p${page}/${base}.jpg`;
}

function fmtTry(n) {
  return `₺${Math.round(n).toLocaleString("tr-TR")},00`;
}

function priceBlock(listeEur, netEur, discountPct) {
  const netTl = Math.round(netEur * EUR_TRY);
  const kdvDahil = Math.round(netTl * 1.2);
  return {
    price: `${fmtTry(netTl)} + KDV\nKDV Dahil ${fmtTry(kdvDahil)}`,
    fiyat_tl: netTl,
    liste_fiyati_eur: listeEur,
    satis_eur_indirimli: Math.round(netEur * 100) / 100,
    iskonto_oran: Math.round(discountPct * 100),
  };
}

function mapCategory(kategori, section) {
  const map = fs.existsSync(KMAP) ? JSON.parse(fs.readFileSync(KMAP, "utf8")) : {};
  const key = String(kategori || "").trim();
  if (map[key]) return map[key];
  const sec = String(section || "");
  if (/banket|kumpir/i.test(sec)) return "banket-arabalari";
  if (/lift|kalıp|kalip|yardımcı/i.test(sec)) return "yardimci-ekipmanlar";
  if (/döner|doner/i.test(sec)) return "doner-makineleri";
  if (/robot/i.test(sec)) return "adr-seri-doner-robotu";
  if (/ızgara|izgara/i.test(sec)) return "sanayi-tipi-izgaralar";
  if (/ocak/i.test(sec)) return "ocaklar";
  if (/fırın|firin/i.test(sec)) return "firinlar";
  if (/fritöz|fritoz/i.test(sec)) return "fritozler";
  if (/kuzine/i.test(sec)) return "kuzineler";
  return "sanayi-tipi-izgaralar";
}

function mapDept(category, section) {
  if (/^banket|^kumpir|yardimci-ekipmanlar/.test(category)) return "araba";
  if (/kahve/.test(category) || /kahve/i.test(section)) return "kahve";
  if (/lift|kalip|kalıp|yardimci/.test(category)) return "hazirlik";
  return "pisirme";
}

function buildRow(p, discount, kaynak) {
  const model = String(p.model || "").trim();
  const plate = String(p.plate || "").trim();
  const kategori = String(p.kategori || p.section || "").trim();
  const seri = String(p.seri || "").trim();
  const listeEur = Number(p.euro);
  const netEur = listeEur * (1 - discount);
  const category = mapCategory(kategori, p.section);
  const dept = mapDept(category, p.section);
  const dims = (p.raw_fields || []).find((x) => /\d\s*x\s*\d/.test(x)) || "";
  const titleParts = [kategori.split("/")[0]?.trim(), model, plate, dims].filter(Boolean);
  const name = `Atalay ${titleParts.join(" ")}`.replace(/\s+/g, " ").trim();
  const specs = [
    name,
    "Kaynak: ATALAY 2025 YERLİ",
    seri ? `Seri: ${seri}` : "",
    kategori ? `Kategori: ${kategori}` : "",
    `Model: ${model}`,
    plate ? `Plaka: ${plate}` : "",
    `Liste fiyatı (EUR): ${listeEur}`,
    `Equsto fiyatı (%${Math.round(discount * 100)} indirimli EUR): ${netEur.toFixed(2)}`,
    `Kur: 1 EUR = ${EUR_TRY} TRY (KDV %20)`,
  ]
    .filter(Boolean)
    .join("\n");

  const pricing = priceBlock(listeEur, netEur, discount);
  const page = p.page || 0;

  return {
    category,
    brand: BRAND,
    name,
    price: pricing.price,
    specs,
    images: [slugImage(model, page, p._doner).replace(/^\//, "")],
    sku: slugSku(model),
    model,
    ...pricing,
    kaynak_fiyat_listesi: kaynak,
    dept,
    page,
    id: slugId(model),
    pdf_page: page,
  };
}

function loadRawProducts() {
  const products = [];
  if (fs.existsSync(RAW)) {
    const raw = JSON.parse(fs.readFileSync(RAW, "utf8"));
    for (const p of raw.products || []) products.push({ ...p, kaynak: "atalay-2025-yerli-pdf" });
  }
  for (const row of DONER_OCAK_ROWS) {
    products.push({
      model: row.model,
      plate: "",
      kategori: `Döner Makineleri / ${row.section}`,
      seri: "Döner Makineleri",
      section: row.section,
      euro: row.euro,
      raw_fields: [],
      page: 129,
      kaynak: "atalay-2025-yerli-doner-pdf",
      _doner: true,
    });
  }
  return products;
}

function dedupeProducts(products) {
  const byKey = new Map();
  for (const p of products) {
    const key = slugSku(p.model);
    const prev = byKey.get(key);
    if (!prev || (p.kaynak?.includes("doner") && !prev.kaynak?.includes("doner"))) {
      byKey.set(key, p);
    }
  }
  return [...byKey.values()];
}

function isAtalay(row) {
  return /atalay/i.test(String(row.brand || ""));
}

function main() {
  const products = dedupeProducts(loadRawProducts());
  const vitrin = products.map((p) =>
    buildRow(
      p,
      p._doner || p.kaynak?.includes("doner") ? DISCOUNT_DONER : DISCOUNT_TABLE,
      p.kaynak || "atalay-2025-yerli-pdf",
    ),
  );

  fs.mkdirSync(path.dirname(CATALOG_OUT), { recursive: true });
  fs.writeFileSync(
    CATALOG_OUT,
    JSON.stringify(
      {
        version: 2,
        source: "ATALAY 2025 YERLİ.pdf",
        parsedAt: new Date().toISOString(),
        eurTryRate: EUR_TRY,
        count: vitrin.length,
        products: vitrin,
      },
      null,
      2,
    ),
    "utf8",
  );

  const byDept = Object.fromEntries(DEPT_FILES.map((d) => [d, []]));
  for (const row of vitrin) {
    const d = row.dept || "pisirme";
    if (!byDept[d]) byDept[d] = [];
    byDept[d].push(row);
  }

  const summary = {};
  for (const dept of DEPT_FILES) {
    const deptPath = path.join(ROOT, "public/data/dept", `${dept}.json`);
    const added = byDept[dept] || [];
    /* Mağaza vitrinde yalnızca Atalay PDF kataloğu — eski markalar birleştirilmez. */
    fs.writeFileSync(deptPath, JSON.stringify(added), "utf8");
    summary[dept] = { total: added.length };
  }

  console.log("[atalay-pdf-build] katalog", vitrin.length, "→", CATALOG_OUT);
  console.log("[atalay-pdf-build] dept", JSON.stringify(summary));
}

main();
