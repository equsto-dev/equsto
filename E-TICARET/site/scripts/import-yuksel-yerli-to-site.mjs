/**
 * YÜKSEL YERLİ 2025 PDF → dept/*.json + ekipmanlar.json
 * Liste fiyatı üzerinden %55 iskonto (müşteri liste fiyatının %45'ini öder).
 *
 *   npm run catalog:yuksel:yerli:import
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { fetchTcmbEurRate } from "./fetch-tcmb-kur.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const YUKSEL_SRC = path.join(ROOT, "public/data/fiyat-listeleri/yuksel/2025-yerli/tum-urunler.json");
const IMG_MAP = path.join(ROOT, "public/data/fiyat-listeleri/yuksel/2025-yerli/_pdf-images-map.json");
const DEPT_DIR = path.join(ROOT, "public/data/dept");

const ISKONTO = Number(process.env.EQUSTO_YUKSEL_ISKONTO || "0.55");
const NET_MULT = Math.max(0, Math.min(1, 1 - ISKONTO));
const KDV = Number(process.env.EQUSTO_KDV_ORAN || "20");
const BRAND = "Yüksel Endüstriyel";
const BRAND_PORTABIANCO = "PORTABIANCO";
const BRAND_ID = "yuksel-endustriyel";
const KAYNAK = "yuksel-2025-yerli-pdf";
const LISTE = "YÜKSEL YERLİ - 2025";

const tcmb = await fetchTcmbEurRate();
const EUR_TRY =
  Number(process.env.EQUSTO_EUR_TRY) > 0 ? Number(process.env.EQUSTO_EUR_TRY) : tcmb.rate;

function normModel(s) {
  return String(s || "")
    .toUpperCase()
    .replace(/İ/g, "I")
    .replace(/Ğ/g, "G")
    .replace(/Ü/g, "U")
    .replace(/Ş/g, "S")
    .replace(/Ö/g, "O")
    .replace(/Ç/g, "C")
    .replace(/\s+/g, "")
    .replace(/[^A-Z0-9]/g, "");
}

function slugId(model) {
  return `${BRAND_ID}__${normModel(model).toLowerCase()}`;
}

function fmtTry(n) {
  const parts = n.toFixed(2).split(".");
  const int = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${int},${parts[1]}`;
}

function priceFromEuro(listEur) {
  const netEur = Math.round(listEur * NET_MULT * 100) / 100;
  const netTry = netEur * EUR_TRY;
  const kdvDahil = netTry * (1 + KDV / 100);
  return {
    netEur,
    price: `₺${fmtTry(netTry)} + KDV\nKDV Dahil ₺${fmtTry(kdvDahil)}`,
    fiyat_tl: Math.round(netTry),
  };
}

function yukselHaystack(item) {
  return String(item.name || item.alt_kategori || item.category || "")
    .toLocaleLowerCase("tr")
    .replace(/ı/g, "i")
    .replace(/İ/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");
}

function isCoolingProduct(item) {
  const model = String(item.model || item.sku || "")
    .trim()
    .replace(/\s+/g, "");
  const hay = yukselHaystack(item) + " " + model.toLowerCase();
  const folder = String(item.equsto_folder || item.category || "").toLowerCase();

  if (item.dept === "sogutma") return true;
  if (/^sogutma\//.test(folder) || /tezgah-alti|sogutma-ekipmanlari/.test(folder)) return true;
  if (
    /^(PZA|PZAD|PZAC|PZAG|TTC|TTU|TTK|TTEV|TTG|TTR|TTM|ASB|SBB|SBTM|SBH|SBHD|SBHKG|MSBH|GN|SBM|ST|DT|BAR|MSB|SLM|CAU|CAK|SBT|BARIST|TTX|TTS|CA|CAM)/i.test(
      model,
    )
  ) {
    return true;
  }
  if (/^TT[-./]?\d/i.test(model)) return true;
  if (
    /her kapi.*raf bulunmakt|tezgah tip|tezgahalti|make[- ]?up|camli make|mermer tablali make|tezgah alti|counter type|undercounter|buzdolab|so?gut|refriger|freezer|portabianco|barista|pizza|derin dondur|tek kapi|iki kapi|uc kapi|dort kapi|mix.*kapi|slim.*buzdolab/.test(
      hay,
    )
  ) {
    return true;
  }
  if (/^\d{2,3}X\d{2}X\d{2,3}/i.test(model) && /her kapi|tezgah|portabianco|make|buzdolab/.test(hay)) {
    return true;
  }
  return false;
}

function mapCategory(item) {
  const sub = String(item.alt_kategori || "").toLocaleLowerCase("tr");
  const dept = item.dept || "";
  const folder = String(item.category || "").toLowerCase();

  if (isCoolingProduct(item)) return "sogutma-ekipmanlari";

  if (dept === "yikama" || /bulaşık|bulasik|dishwash/.test(sub)) return "bulasik-makineleri";
  if (dept === "davlumbaz" || /davlumbaz|hood/.test(sub)) return "davlumbaz";
  if (dept === "tasima" || /araba|taşıma|servis|çamaşır|tabak/.test(sub)) return "tasima-arabalari";
  if (/yer süzgeç|gider/.test(sub)) return "bulasik-makineleri";

  if (dept === "istif" || /portashelf|tel raf|raf|shelf|ayak/.test(sub) || folder.includes("portashelf")) {
    return "istif-raflari";
  }

  if (
    dept === "sogutma" ||
    /buzdolab|soğut|refriger|portabianco|barista|pizza|tezgah|counter type|make up|undercounter/.test(sub)
  ) {
    return "sogutma-ekipmanlari";
  }

  if (dept === "pisirme" || /fırın|firin|ocak|izgara/.test(sub)) {
    if (/fritöz|fritoz/.test(sub)) return "fritozler";
    if (/izgara/.test(sub)) return "sanayi-tipi-izgaralar";
    return "sanayi-ocaklari";
  }

  if (dept === "diger") return "istif-raflari";

  return "istif-raflari";
}

function mapDeptFile(item, category) {
  if (category === "sogutma-ekipmanlari" || isCoolingProduct(item)) return "sogutma";
  if (category === "davlumbaz") return "davlumbaz";
  if (category === "bulasik-makineleri") return "yikama";
  if (category === "tasima-arabalari") return "araba";

  const dept = item.dept || "";
  if (dept === "sogutma") return "sogutma";
  if (dept === "yikama") return "yikama";
  if (dept === "davlumbaz") return "davlumbaz";
  if (dept === "tasima") return "araba";
  if (dept === "pisirme") return "pisirme";
  return "istif";
}

function brandFor(item, category, deptFile) {
  if (deptFile === "sogutma" || deptFile === "yikama") return BRAND_PORTABIANCO;
  return BRAND;
}

function buildName(item, brand) {
  const model = String(item.model || "").trim();
  const sub = String(item.alt_kategori || "").split("·")[0].trim().slice(0, 80);
  if (brand === BRAND_PORTABIANCO) {
    return `Portabianco ${sub} ${model}`.replace(/\s+/g, " ").trim();
  }
  return `Yüksel ${sub} ${model}`.replace(/\s+/g, " ").trim();
}

function buildSpecs(item, listEur, netEur, name) {
  return [
    name,
    "",
    `Kaynak: ${item.liste || LISTE}`,
    `Kategori: ${item.alt_kategori || ""}`,
    `Model / kod: ${item.model || ""}`,
    item.olculer_net_mm ? `Ölçü (cm): ${item.olculer_net_mm}` : "",
    item.guc_kw ? `Güç: ${item.guc_kw}` : "",
    item.voltaj ? `Voltaj: ${item.voltaj}` : "",
    listEur != null ? `Liste fiyatı (EUR): ${listEur}` : "",
    netEur != null
      ? `Equsto net (%${Math.round(ISKONTO * 100)} iskonto, EUR): ${netEur.toFixed(2)}`
      : "",
    `Kur: 1 EUR = ${EUR_TRY} TRY (KDV %${KDV})`,
  ]
    .filter(Boolean)
    .join("\n");
}

function loadImageMap() {
  try {
    return JSON.parse(fs.readFileSync(IMG_MAP, "utf8"));
  } catch {
    return { models: {}, pages: {} };
  }
}

function resolveImage(item, imgMap) {
  const key = normModel(item.sku || item.model);
  let rel = imgMap.models?.[key];
  if (!rel && item.page != null) {
    rel = imgMap.pages?.[String(item.page)] || imgMap.pages?.[item.page];
  }
  if (!rel) return [];
  rel = String(rel).replace(/\\/g, "/");
  if (/^images\/catalog\/yuksel\//i.test(rel)) return [rel];
  if (/^images\/yuksel-/i.test(rel)) {
    rel = `images/catalog/yuksel/${rel.replace(/^images\//i, "")}`;
  } else if (/^yuksel-/i.test(rel)) {
    rel = `images/catalog/yuksel/${rel}`;
  }
  return [rel];
}

function isYukselYerli(row) {
  return String(row.kaynak_fiyat_listesi || "").includes("yuksel-2025-yerli");
}

/** Vitrinde satılacak Yüksel istif — yalnızca katlı raf sistemleri. */
function isYukselIstifShopAllowed(item) {
  const hay = yukselHaystack(item);
  const model = String(item.model || item.sku || "").trim();
  if (/katli\s*raflar|tier\s*shelving/.test(hay)) return true;
  if (/^\d{2}-x-\d+-x-\d+/i.test(model.replace(/\s+/g, ""))) return true;
  return false;
}

/** Parça / aksesuar — vitrinde satılmaz. */
function isYukselYerliShopExcluded(item) {
  if (isCoolingProduct(item)) return false;

  const hay = yukselHaystack(item);
  if (/perfore\s*raf\s*boyali/.test(hay)) return true;
  if (/epoxy\s*\+\s*plastic|powder\s*coated/.test(hay)) return true;
  if (/olcu\s*\/\s*size|ölçü\s*\/\s*size/.test(hay)) return true;
  if (/standart\s*tel\s*raf\s*boyali/.test(hay)) return true;
  if (/tel\s*raf\s*dikme/.test(hay)) return true;
  if (/tel\s*izgara/.test(hay)) return true;
  if (/rail\s*basket/.test(hay)) return true;
  if (/ozel\s*kalip\s*formlu|özel\s*kalıp\s*formlu/.test(hay)) return true;
  if (/^m\d{6,}$/i.test(String(item.model || item.sku || "").trim())) return true;
  if (
    String(item.dept || "") === "istif" &&
    !isCoolingProduct(item) &&
    !isYukselIstifShopAllowed(item)
  ) {
    return true;
  }
  return false;
}

function buildRow(item, imgMap) {
  const listEur = Number(item.fiyat_euro);
  const { netEur, price, fiyat_tl } = priceFromEuro(listEur);
  const category = mapCategory(item);
  const deptFile = mapDeptFile(item, category);
  const brand = brandFor(item, category, deptFile);
  const name = buildName(item, brand);
  const model = String(item.model || "").trim();

  return {
    category,
    brand,
    name,
    price,
    specs: buildSpecs(item, listEur, netEur, name),
    images: resolveImage(item, imgMap),
    sku: String(item.sku || normModel(model)),
    model,
    fiyat_tl,
    liste_fiyati_eur: listEur,
    satis_eur_net: netEur,
    iskonto_oran: Math.round(ISKONTO * 100),
    kaynak_fiyat_listesi: item.kaynak || KAYNAK,
    dept: deptFile,
    page: item.page,
    id: slugId(model),
    pdf_page: item.page,
  };
}

function main() {
  if (!fs.existsSync(YUKSEL_SRC)) {
    console.error("[yuksel-yerli] Önce PDF çıkarımı: npm run catalog:yuksel:yerli:extract");
    process.exit(1);
  }

  const yuksel = JSON.parse(fs.readFileSync(YUKSEL_SRC, "utf8"));
  const imgMap = loadImageMap();
  const rows = [];
  let skipped = 0;
  let excluded = 0;

  for (const item of yuksel) {
    if (isYukselYerliShopExcluded(item)) {
      excluded++;
      continue;
    }
    const listEur = Number(item.fiyat_euro);
    if (!listEur || listEur <= 0) {
      skipped++;
      continue;
    }
    rows.push(buildRow(item, imgMap));
  }

  const byDept = new Map();
  for (const row of rows) {
    const d = row.dept || "istif";
    if (!byDept.has(d)) byDept.set(d, []);
    byDept.get(d).push(row);
  }

  let mergedTotal = 0;
  for (const [dept, newRows] of byDept) {
    const deptPath = path.join(DEPT_DIR, `${dept}.json`);
    const existing = fs.existsSync(deptPath)
      ? JSON.parse(fs.readFileSync(deptPath, "utf8"))
      : [];
    const kept = existing.filter((r) => !isYukselYerli(r));
    const merged = [...kept, ...newRows];
    fs.writeFileSync(deptPath, JSON.stringify(merged), "utf8");
    console.log(`[yuksel-yerli] ${dept}.json: +${newRows.length} (toplam ${merged.length})`);
    mergedTotal += newRows.length;
  }

  const withImg = rows.filter((r) => r.images.length > 0).length;
  console.log(
    `[yuksel-yerli] İskonto %${Math.round(ISKONTO * 100)} → net çarpan ${NET_MULT}, EUR→TRY ${EUR_TRY}`,
  );
  console.log(`[yuksel-yerli] ${mergedTotal} ürün, ${withImg} görsel, ${skipped} atlanan, ${excluded} vitrin dışı`);

  execSync("node scripts/rebuild-ekipmanlar-from-dept.mjs", { cwd: ROOT, stdio: "inherit" });
  console.log("[yuksel-yerli] Bitti.");
}

main();
