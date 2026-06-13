#!/usr/bin/env node
/**
 * Öztiryakiler web açıklama sync — eşleşmeyen ürünler Excel listesi
 *
 *   node scripts/export-ozti-web-missing-xlsx.mjs
 *   node scripts/export-ozti-web-missing-xlsx.mjs --out=scripts/data/ozti-web-missing.xlsx
 */
import ExcelJS from "exceljs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isOztiBrand, kodSoftKey, normKod, OZTI_BRAND } from "./lib/ozti-enrich.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPT_DIR = path.join(ROOT, "public/data/dept");
const WEB_INDEX = path.join(ROOT, "scripts/data/ozti-web-index.json");
const DEFAULT_OUT = path.join(ROOT, "scripts/data/ozti-web-missing-629.xlsx");

const outArg = process.argv.find((a) => a.startsWith("--out="))?.split("=")[1]?.trim();
const OUT = outArg ? path.resolve(ROOT, outArg) : DEFAULT_OUT;

const DEPT_LABEL = {
  pisirme: "Pişirme",
  sogutma: "Soğutma",
  tezgah: "Tezgah",
  istif: "İstif & Depolama",
  dolap: "Dolap",
  davlumbaz: "Davlumbaz",
  yikama: "Yıkama",
  bulasik: "Bulaşık Yıkama",
  icecek: "İçecek",
  kahve: "Kahve",
  hazirlik: "Hazırlık",
  araba: "Servis Arabaları",
  tasima: "Taşıma",
  servis: "Servis",
  "market-reyon": "Market Reyon",
  "set-ustu-mutfak": "Set Üstü Mutfak",
};

function loadOztiRows() {
  const rows = [];
  for (const f of fs.readdirSync(DEPT_DIR).sort()) {
    if (!f.endsWith(".json")) continue;
    const dept = f.replace(/\.json$/, "");
    const list = JSON.parse(fs.readFileSync(path.join(DEPT_DIR, f), "utf8"));
    for (const row of list) {
      if (!isOztiBrand(row) && row.brand !== OZTI_BRAND) continue;
      const kod = normKod(row.urun_kodu || row.sku || row.model);
      if (!kod) continue;
      rows.push({ row, dept, file: f, kod });
    }
  }
  return rows;
}

function lookupPayload(index, kod) {
  const k = normKod(kod);
  return index.byKod?.[k] || index.bySoft?.[kodSoftKey(k)] || null;
}

function deptLabel(dept) {
  return DEPT_LABEL[dept] || dept;
}

function priceTl(row) {
  if (row.fiyat_tl != null && Number(row.fiyat_tl) > 0) {
    return Number(row.fiyat_tl);
  }
  const m = String(row.price || "").match(/₺[\d.,]+/);
  return m ? m[0] : String(row.price || "").split("\n")[0] || "";
}

function shopPath(row) {
  const dept = row.dept || "pisirme";
  const slug = row.id?.includes("__") ? row.id.split("__")[1] : row.sku?.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return slug ? `https://equsto.com/shop/${dept}/${slug}` : "";
}

function missingReason(index, kod, payload) {
  if (payload?.description) return "İndeks var, açıklama boş (parse?)";
  const k = normKod(kod);
  const soft = kodSoftKey(k);
  if (index.byKod?.[k]) return "İndeks kaydı var, açıklama yok";
  if (index.bySoft?.[soft]) return "Soft-key eşleşti, açıklama yok";
  return "oztiryakiler.com.tr indeksinde yok";
}

async function main() {
  const index = JSON.parse(fs.readFileSync(WEB_INDEX, "utf8"));
  const entries = loadOztiRows();
  const missing = [];

  for (const { row, dept, kod } of entries) {
    const hasDesc = Boolean(String(row.ozti_web_description || "").trim());
    const payload = lookupPayload(index, kod);
    if (hasDesc && payload?.description) continue;
    if (hasDesc && !payload?.description) {
      missing.push({ row, dept, kod, payload, reason: "Katalogda açıklama var, indeks lookup başarısız" });
      continue;
    }
    if (!hasDesc) {
      missing.push({
        row,
        dept,
        kod,
        payload,
        reason: missingReason(index, kod, payload),
      });
    }
  }

  const wb = new ExcelJS.Workbook();
  wb.creator = "Equsto";
  wb.created = new Date();

  const ws = wb.addWorksheet("Eşleşmeyen Öztiryakiler", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  ws.columns = [
    { header: "Sıra", key: "no", width: 6 },
    { header: "Ürün Kodu", key: "kod", width: 18 },
    { header: "Ürün Adı", key: "name", width: 52 },
    { header: "Dept", key: "dept", width: 14 },
    { header: "Kategori", key: "category", width: 28 },
    { header: "Alt Kategori", key: "altKat", width: 24 },
    { header: "Marka", key: "brand", width: 28 },
    { header: "Fiyat (TL KDV dahil)", key: "price", width: 16 },
    { header: "Equsto URL", key: "url", width: 48 },
    { header: "Web indeks slug", key: "slug", width: 32 },
    { header: "Eşleşmeme nedeni", key: "reason", width: 36 },
  ];

  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true };
  headerRow.alignment = { vertical: "middle", wrapText: true };

  missing.sort((a, b) => a.kod.localeCompare(b.kod, "tr"));

  missing.forEach((item, i) => {
    const { row, dept, kod, payload, reason } = item;
    ws.addRow({
      no: i + 1,
      kod,
      name: String(row.name || "").trim(),
      dept: deptLabel(dept),
      category: row.urun_kategori || row.category || "",
      altKat: row.urun_alt_kategori || row.alt_kategori_1 || "",
      brand: row.brand || OZTI_BRAND,
      price: priceTl(row),
      url: shopPath(row),
      slug: payload?.slug || row.ozti_web_slug || "",
      reason,
    });
  });

  ws.autoFilter = { from: "A1", to: `K${missing.length + 1}` };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  await wb.xlsx.writeFile(OUT);

  const byReason = {};
  for (const m of missing) {
    byReason[m.reason] = (byReason[m.reason] || 0) + 1;
  }

  console.log(`[ozti-missing-xlsx] toplam Öztiryakiler: ${entries.length}`);
  console.log(`[ozti-missing-xlsx] eşleşmeyen: ${missing.length}`);
  console.log("[ozti-missing-xlsx] neden dağılımı:");
  for (const [r, n] of Object.entries(byReason).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${n}\t${r}`);
  }
  console.log(`[ozti-missing-xlsx] yazıldı: ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
