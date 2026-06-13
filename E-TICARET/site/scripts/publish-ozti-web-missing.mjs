#!/usr/bin/env node
/**
 * Öztiryakiler web açıklaması olmayan 629 ürün — kategorile + siteye ekle + rapor
 *
 *   node scripts/publish-ozti-web-missing.mjs
 *   node scripts/publish-ozti-web-missing.mjs --dry-run
 */
import ExcelJS from "exceljs";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { fetchTcmbEurRate } from "./fetch-tcmb-kur.mjs";
import {
  OZTI_BRAND,
  OZTI_BRAND_ID,
  applyOztiCatalogFallbackDescription,
  buildSpecs,
  correctOztiMisplacedDept,
  isOztiBrand,
  isOztiGnKuvetRow,
  isOztiKimyasalExcluded,
  kodSoftKey,
  loadPdfByKod,
  mapOztiDept,
  mapOztiIcecekCategory,
  mapOztiKahveCategory,
  mapOztiPisirmeCategory,
  mapOztiGnKuvetCategory,
  mapOztiHazirlikCategory,
  mapOztiSetUstuCategory,
  mapOztiSogutmaCategory,
  mapOztiTasimaCategory,
  mapOztiTezgahCategory,
  mapOztiYikamaCategory,
  normKod,
  oztiPriceLabelTl,
  oztiPricingFields,
  oztiPricingLines,
  oztiVitrinImageHref,
  slugify,
} from "./lib/ozti-enrich.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPT_DIR = path.join(ROOT, "public/data/dept");
const SRC = path.join(ROOT, "scripts/data/ozti-eslesme-2026.json");
const MAP = path.join(ROOT, "scripts/data/ozti-set-ustu-kategoriler.json");
const WEB_INDEX = path.join(ROOT, "scripts/data/ozti-web-index.json");
const REPORT_JSON = path.join(ROOT, "scripts/data/ozti-web-missing-publish-report.json");
const REPORT_XLSX = path.join(ROOT, "scripts/data/ozti-web-missing-kategori-raporu.xlsx");

const dryRun = process.argv.includes("--dry-run");
const addFromEslesme = process.argv.includes("--add-from-eslesme");

const KUVET_CATS = new Set([
  "gastronom-kuvetler",
  "kuvet",
  "standart-gastronorm-kuvetler",
  "kose-desenli-gastronorm-kuvetler",
  "gastronorm-kapaklar",
  "delikli-gastronom-kuvetler",
  "delikli-kose-desenli-gastronorm-kuvetler",
  "gn-kuvetler-yapismaz-kaplamali",
  "sapli-gastronorm-kuvetler",
  "sapli-kose-desenli-gastronorm-kuvetler",
  "polipropilen-gastronorm-kuvetler",
  "polikarbonat-gastronorm-kuvetler",
  "bain-marie-celik-saklama-kaplari",
  "karistirma-kaplari-ve-suzgecler",
  "gn-servis-tepsileri",
  "gastronorm-kuvet",
]);

const SET_USTU_ALIASES = {
  "servis-gere-leri": "servis-gerecleri",
  "gn-servis-tepsileri": "gastronorm-kuvet",
  "delikli-gastronom-kuvetler": "gastronorm-kuvet",
  "delikli-gastronom-k-vetler": "gastronorm-kuvet",
  aksesuarlar: "mutfak-aksesuar",
  "bar-aksesuarlar": "mutfak-aksesuar",
  "bar-aksesuarlari": "mutfak-aksesuar",
  arabalar: "tasima-ekipman",
  "banket-arabalar": "tasima-ekipman",
  "ta-ma-ekipmanlar": "tasima-ekipman",
  "kombi-konveksiyonlu-firin-aksesuarlar": "mutfak-aksesuar",
  "chafing-dishler": "chafing-dish",
  "cop-kovalari": "mutfak-aksesuar",
  "cop-konteynerleri": "mutfak-aksesuar",
  "teraziler": "mutfak-aksesuar",
  "tasima-ekipmanlari": "tasima-ekipman",
  "gurmeaid-profesyonel-bicaklar": "gurmeaid-bicak",
  "gurmeaid-mutfak-aksesuarlari": "gurmeaid-aksesuar",
  "polietilen-kesme-tahtalari": "kesme-tahtasi",
  "waffle-makineleri": "masaustu-ekipman",
  "krep-makineleri": "masaustu-ekipman",
  "ekmek-kizartma-makineleri": "masaustu-ekipman",
  "pres-baski-tepsiler": "pres-baski-tepsi",
  "tabak-dispenserleri": "servis-gerecleri",
  "cop-ogutme-makineleri": "mutfak-aksesuar",
  "gemi-mutfagi": "masaustu-ekipman",
  "buz-makineleri": "buz-makinesi",
};

const DEPT_CAT_ALIASES = {
  sogutma: {
    "buz-makineleri": "buz-makinesi",
    "buzdolaplari-ve-derin-dondurucular": "dik-tip-buzdolap",
  },
  hazirlik: {
    "hamur-yogurma-makineleri": "hamur-hazirlik",
    "et-kiyma-makineleri": "kiyma_makinesi",
    "patates-dilimleme-makinesi": "sebze-dograma",
    "patates-soyma-makineleri": "sebze-dograma",
    "pure-makineleri-ve-dilimleyiciler": "sebze-dograma",
  },
};

function loadSiteTips() {
  const js = fs.readFileSync(path.join(ROOT, "public/eq-dept-tips.js"), "utf8");
  const tips = new Set();
  const depts = new Set(["kuvetler"]);
  const re = /\{\s*tip:\s*"([^"]+)"\s*,\s*dept:\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(js))) {
    tips.add(`${m[2]}:${m[1]}`);
    depts.add(m[2]);
  }
  for (const t of [
    "gastronorm-kuvet",
    "bain-marie-kap",
    "pp-pc-gn",
    "karistirma-suzgec",
    "servis-gerecleri",
    "chafing-dish",
    "mutfak-aksesuar",
  ]) {
    tips.add(`kuvetler:${t}`);
  }
  return { tips, depts };
}

function loadImageManifest() {
  const p = path.join(ROOT, "public/images/catalog/ozti/_manifest.json");
  if (!fs.existsSync(p)) return new Map();
  const raw = JSON.parse(fs.readFileSync(p, "utf8"));
  return new Map(Object.entries(raw).map(([k, v]) => [normKod(k), v]));
}

function loadEslesmeByKod() {
  if (!fs.existsSync(SRC)) return new Map();
  const rows = JSON.parse(fs.readFileSync(SRC, "utf8").replace(/\bNaN\b/g, "null"));
  const map = new Map();
  for (const row of rows) {
    const k = normKod(row.urun_kodu);
    if (k) map.set(k, row);
    const soft = kodSoftKey(k);
    if (soft && soft !== k && !map.has(soft)) map.set(soft, row);
  }
  return map;
}

function resolveOztiKategori(row) {
  if (row.kategori) return row.kategori;
  if (Array.isArray(row.kategori_yolu) && row.kategori_yolu.length)
    return row.kategori_yolu[row.kategori_yolu.length - 1];
  return row.urun_alt_kategori || "";
}

function mapCategory(row, dept) {
  const kod = row.urun_kodu || row.sku;
  const name = row.urun_tanimi || row.name;
  const enriched = { ...row, kategori: resolveOztiKategori(row) };
  if (dept === "kahve") return mapOztiKahveCategory(name, kod);
  if (dept === "icecek") return mapOztiIcecekCategory(name, kod);
  if (dept === "yikama") return mapOztiYikamaCategory(name, kod, enriched.kategori);
  if (dept === "pisirme") return mapOztiPisirmeCategory(enriched);
  if (dept === "set-ustu-mutfak") return mapOztiSetUstuCategory(enriched);
  if (dept === "tasima") return mapOztiTasimaCategory(enriched);
  if (dept === "hazirlik") return mapOztiHazirlikCategory(enriched);
  if (dept === "sogutma") return mapOztiSogutmaCategory(enriched);
  if (dept === "tezgah") return mapOztiTezgahCategory(enriched);
  return slugify(enriched.kategori) || "diger";
}

function normalizeSiteCategory(cat, dept) {
  if (!cat) return cat;
  if (SET_USTU_ALIASES[cat]) return SET_USTU_ALIASES[cat];
  const deptMap = DEPT_CAT_ALIASES[dept];
  if (deptMap?.[cat]) return deptMap[cat];
  return cat;
}

function rowToVitrin(row, dept, category, pdfByKod, manifest, kurTry) {
  const kod = row.urun_kodu;
  let cat = category || slugify(row.kategori) || "diger";
  if (dept === "yikama") {
    cat = mapOztiYikamaCategory(row.urun_tanimi || row.name, kod, row.kategori);
  }
  const pricing = oztiPricingFields(row, kurTry);
  const enriched = buildSpecs(row, pdfByKod.get(normKod(kod)), cat, oztiPricingLines(row, kurTry));
  const imgHref = oztiVitrinImageHref(kod, manifest.get(normKod(kod)));

  const vitrin = {
    category: cat,
    brand: OZTI_BRAND,
    name: row.urun_tanimi || kod,
    price: pricing.price || oztiPriceLabelTl(pricing),
    specs: enriched.specs,
    aciklama: enriched.aciklama,
    teknik_ozellikler: enriched.teknik_ozellikler,
    olculer: enriched.olculer,
    keywords: enriched.keywords,
    images: imgHref ? [imgHref] : [],
    sku: kod,
    model: kod,
    ...pricing,
    kaynak: "ozti-fiyat-listesi-2025",
    kaynak_fiyat_listesi: "ozti-fiyat-listesi-2025",
    dept,
    vitrin_arka_plan: dept === "set-ustu-mutfak",
    id: `${OZTI_BRAND_ID}__${slugify(kod)}`,
    urun_kodu: kod,
    barkod: row.barkod || null,
    pdf_eslesme: !!row.pdf_eslesme,
    pdf_sayfalar: row.pdf?.sayfalar,
    kategori: row.kategori || null,
    kategori_yolu: row.kategori_yolu || null,
  };
  applyOztiCatalogFallbackDescription(vitrin, pdfByKod.get(normKod(kod)));
  return vitrin;
}

function hasSiteCategory(row, dept, siteTips) {
  const raw = row.category || "";
  const cat = normalizeSiteCategory(raw, dept);
  if (!cat || cat === "diger") return false;
  if (dept === "set-ustu-mutfak" && (KUVET_CATS.has(raw) || KUVET_CATS.has(cat) || isOztiGnKuvetRow(row)))
    return true;
  if (SET_USTU_ALIASES[raw] && siteTips.tips.has(`set-ustu-mutfak:${SET_USTU_ALIASES[raw]}`)) return true;
  if (SET_USTU_ALIASES[raw] && siteTips.tips.has(`kuvetler:${SET_USTU_ALIASES[raw]}`)) return true;
  if (siteTips.tips.has(`${dept}:${cat}`)) return true;
  if (KUVET_CATS.has(cat) || KUVET_CATS.has(raw)) return true;
  return cat.length > 2 && dept !== "set-ustu-mutfak";
}

function loadOztiWithoutWebDesc(deptPatches) {
  const rows = [];
  for (const [file, list] of deptPatches) {
    const dept = file.replace(/\.json$/, "");
    for (const row of list) {
      if (!isOztiBrand(row)) continue;
      if (row.ozti_web_description) continue;
      rows.push({ row, dept, file });
    }
  }
  return rows;
}

function loadAllOztiKods(deptPatches) {
  const set = new Set();
  for (const [, list] of deptPatches) {
    for (const row of list) {
      if (!isOztiBrand(row)) continue;
      const k = normKod(row.sku || row.urun_kodu);
      if (k) set.add(k);
    }
  }
  return set;
}

async function exportUncategorizedXlsx(rows) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Kategorisiz");
  ws.columns = [
    { header: "Ürün Kodu", key: "kod", width: 18 },
    { header: "Ad", key: "name", width: 50 },
    { header: "Dept", key: "dept", width: 16 },
    { header: "Kategori (JSON)", key: "category", width: 28 },
    { header: "Excel Kategori", key: "kategori", width: 32 },
    { header: "Sebep", key: "reason", width: 40 },
    { header: "Mağaza URL", key: "url", width: 55 },
  ];
  ws.getRow(1).font = { bold: true };
  for (const r of rows) {
    const slug = r.row.id?.includes("__") ? r.row.id.split("__")[1] : slugify(r.kod);
    ws.addRow({
      kod: r.kod,
      name: r.row.name || "",
      dept: r.dept,
      category: r.row.category || "",
      kategori: r.row.kategori || r.source?.kategori || "",
      reason: r.reason,
      url: slug ? `https://equsto.com/shop/${r.dept}/${slug}` : "",
    });
  }
  await wb.xlsx.writeFile(REPORT_XLSX);
}

async function main() {
  const siteTips = loadSiteTips();
  const pdfByKod = loadPdfByKod();
  const manifest = loadImageManifest();
  const eslesmeByKod = loadEslesmeByKod();
  const cfg = JSON.parse(fs.readFileSync(MAP, "utf8"));
  const allow = cfg.kategori_leaf_allow.map((x) => String(x).toLocaleUpperCase("tr"));

  const kurInfo = await fetchTcmbEurRate();
  const kurTry = kurInfo.rate;

  const deptPatches = new Map();
  for (const f of fs.readdirSync(DEPT_DIR)) {
    if (!f.endsWith(".json")) continue;
    deptPatches.set(f, JSON.parse(fs.readFileSync(path.join(DEPT_DIR, f), "utf8")));
  }

  const targets = loadOztiWithoutWebDesc(deptPatches);
  const existingKods = loadAllOztiKods(deptPatches);

  const stats = {
    targets: targets.length,
    categoryUpdated: 0,
    fallbackDesc: 0,
    addedNew: 0,
    kuvetAssigned: 0,
    uncategorized: [],
    deptMoved: 0,
    byDept: {},
  };

  const deptMoves = [];

  for (const { row, dept, file } of targets) {
    const kod = normKod(row.sku || row.urun_kodu);
    const source = eslesmeByKod.get(kod) || eslesmeByKod.get(kodSoftKey(kod));
    const srcRow = source
      ? {
          ...source,
          urun_tanimi: source.urun_tanimi || row.name,
          kategori: source.kategori || row.kategori || row.urun_alt_kategori,
          kategori_yolu: source.kategori_yolu || row.kategori_yolu,
          urun_alt_kategori: row.urun_alt_kategori,
        }
      : {
          urun_kodu: kod,
          urun_tanimi: row.name,
          kategori: row.kategori || row.urun_alt_kategori,
          kategori_yolu: row.kategori_yolu,
          urun_alt_kategori: row.urun_alt_kategori,
        };

    let activeDept = correctOztiMisplacedDept(srcRow, dept);
    if (activeDept !== dept) {
      row.dept = activeDept;
      deptMoves.push({ row, fromFile: file, toFile: `${activeDept}.json` });
      stats.deptMoved += 1;
    }

    const newCat = normalizeSiteCategory(mapCategory(srcRow, activeDept), activeDept);
    if (newCat && newCat !== row.category) {
      row.category = newCat;
      stats.categoryUpdated += 1;
    }
    if (isOztiGnKuvetRow(srcRow) || KUVET_CATS.has(row.category)) {
      row.category = mapOztiGnKuvetCategory(srcRow);
      stats.kuvetAssigned += 1;
    }
    if (!row.kategori && source?.kategori) row.kategori = source.kategori;
    if (!row.kategori_yolu && source?.kategori_yolu) row.kategori_yolu = source.kategori_yolu;

    const pdfEntry = pdfByKod.get(kod);
    if (applyOztiCatalogFallbackDescription(row, pdfEntry)) {
      stats.fallbackDesc += 1;
    }

    if (!hasSiteCategory(row, activeDept, siteTips)) {
      stats.uncategorized.push({
        kod,
        row,
        dept: activeDept,
        source: srcRow,
        reason:
          !row.category || row.category === "diger"
            ? "Kategori eşleşmedi (diger/boş)"
            : `Sitede ?tip= karşılığı yok: ${row.category}`,
      });
    }

    stats.byDept[activeDept] = (stats.byDept[activeDept] || 0) + 1;
  }

  for (const { row, fromFile, toFile } of deptMoves) {
    const fromList = deptPatches.get(fromFile);
    if (!fromList) continue;
    const idx = fromList.indexOf(row);
    if (idx >= 0) fromList.splice(idx, 1);
    const toList = deptPatches.get(toFile) || [];
    toList.push(row);
    deptPatches.set(toFile, toList);
  }

  const newByDept = new Map();
  if (!addFromEslesme) {
    stats.addFromEslesmeSkipped = true;
  }
  const eslesmeRows =
    addFromEslesme && fs.existsSync(SRC)
      ? JSON.parse(fs.readFileSync(SRC, "utf8").replace(/\bNaN\b/g, "null"))
      : [];
  for (const source of eslesmeRows) {
    const k = normKod(source.urun_kodu);
    if (!k || existingKods.has(k)) continue;
    if (isOztiKimyasalExcluded(source)) continue;
    const dept = mapOztiDept(source, allow);
    if (!dept) continue;
    const cat = normalizeSiteCategory(mapCategory(source, dept), dept);
    const vitrin = rowToVitrin(source, dept, cat, pdfByKod, manifest, kurTry);
    if (!newByDept.has(dept)) newByDept.set(dept, []);
    newByDept.get(dept).push(vitrin);
    existingKods.add(k);
    stats.addedNew += 1;
    if (!hasSiteCategory(vitrin, dept, siteTips)) {
      stats.uncategorized.push({
        kod: k,
        row: vitrin,
        dept,
        source,
        reason: "Yeni eklendi — kategori doğrulanamadı",
      });
    }
  }

  for (const [dept, rows] of newByDept) {
    const file = `${dept}.json`;
    const list = deptPatches.get(file) || [];
    list.push(...rows);
    deptPatches.set(file, list);
  }

  if (!dryRun) {
    for (const [file, list] of deptPatches) {
      fs.writeFileSync(path.join(DEPT_DIR, file), JSON.stringify(list), "utf8");
    }
    spawnSync(process.execPath, ["scripts/rebuild-ekipmanlar-from-dept.mjs"], {
      cwd: ROOT,
      stdio: "inherit",
    });
  }

  fs.writeFileSync(
    REPORT_JSON,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        dryRun,
        stats: {
          ...stats,
          uncategorizedCount: stats.uncategorized.length,
        },
        uncategorized: stats.uncategorized.map((u) => ({
          kod: u.kod,
          name: u.row.name,
          dept: u.dept,
          category: u.row.category,
          kategori: u.source?.kategori,
          reason: u.reason,
        })),
      },
      null,
      2,
    ),
    "utf8",
  );

  await exportUncategorizedXlsx(stats.uncategorized);

  console.log("[publish-ozti-missing] hedef (web açıklaması yok):", stats.targets);
  console.log("[publish-ozti-missing] kategori güncellendi:", stats.categoryUpdated);
  console.log("[publish-ozti-missing] küvet kategorisi:", stats.kuvetAssigned);
  console.log("[publish-ozti-missing] dept taşındı:", stats.deptMoved);
  console.log("[publish-ozti-missing] katalog açıklama eklendi:", stats.fallbackDesc);
  console.log("[publish-ozti-missing] yeni eklenen (eslesme→dept):", stats.addedNew);
  console.log("[publish-ozti-missing] kategorisiz:", stats.uncategorized.length);
  console.log("[publish-ozti-missing] rapor:", path.relative(ROOT, REPORT_XLSX));
  if (dryRun) console.log("[publish-ozti-missing] --dry-run: dept dosyaları yazılmadı");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
