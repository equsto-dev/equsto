#!/usr/bin/env node
/**
 * PLP önbelleği → sınıflandır + eşleştir + (isteğe bağlı) yeni satır yaz.
 *
 *   node scripts/import-cm-brands/apply-new.mjs --brand Rational
 *   node scripts/import-cm-brands/apply-new.mjs --brand Rational --apply
 */
import fs from "node:fs";
import path from "node:path";
import { fetchProductDetail } from "../lib/cafemarkt-fetch.mjs";
import { classifyProduct } from "./classify.mjs";
import { resolveOztiryakilerOfficialImage, resolveRationalOfficialImage, resolveRobotCoupeOfficialImage } from "./images.mjs";
import { buildMatchIndex, findMatch, loadEqustoRows } from "./match.mjs";
import {
  DELAY_PAGE_MS,
  DEPT_DIR,
  REPORT_DIR,
  VITRIN_ISKONTO,
  asciiUpper,
  brandSlug,
  formatTl,
  plpCachePath,
  priceFromCm,
  sleep,
  slugify,
  stripDistributorPrefix,
  writeJson,
} from "./shared.mjs";

const dryRun = !process.argv.includes("--apply");
const keepReview = process.argv.includes("--keep-review");
const skipPdp = process.argv.includes("--no-pdp");

function arg(name, fallback = "") {
  const i = process.argv.indexOf(name);
  if (i < 0) return fallback;
  return process.argv[i + 1] || fallback;
}

function rationalSku(cm) {
  const raw = stripDistributorPrefix(cm.code || "");
  if (/^9890\./i.test(raw)) return raw;
  const m = String(cm.code || "").match(/9890\.[A-Z0-9.]+/i);
  return m ? m[0] : raw;
}

function rationalModel(sku) {
  return String(sku || "").replace(/^9890\./i, "");
}

function mapRationalDept(cm, cls) {
  if (cls.group === "ivario") {
    return {
      dept: "pisirme",
      category: "kombi-firin",
      alt: "ivario",
      altLabel: "iVario",
    };
  }
  return {
    dept: "pisirme",
    category: "kombi-firin",
    alt: cls.group || "kombi-firin",
    altLabel:
      cls.group === "icombi-pro"
        ? "iCombi Pro"
        : cls.group === "icombi-classic"
          ? "iCombi Classic"
          : cls.group === "cmp"
            ? "CombiMaster Plus"
            : cls.group === "scc"
              ? "SelfCookingCenter"
              : "Kombi Fırın",
  };
}

function makeRationalRow(cm, cls, imgRel) {
  const sku = rationalSku(cm);
  const model = rationalModel(sku);
  const px = priceFromCm(cm.price_try_kdv_dahil);
  const map = mapRationalDept(cm, cls);
  const name = String(cm.name || "").replace(/^Rational\s+/i, "RATIONAL ");
  const priceStr = px.vitrin > 0 ? `${formatTl(px.vitrin)} KDV dahil` : "Teklif için iletişim";
  const specs = [
    name,
    "Kaynak: Cafemarkt (fiyat)",
    `Model: ${model}`,
    `Cafemarkt: ${cm.url || ""}`,
    px.cm ? `Kaynak fiyat (Cafemarkt KDV dahil): ${formatTl(px.cm)}` : "",
    px.vitrin ? `Equsto Cafemarkt −%2 (KDV dahil): ${formatTl(px.vitrin)}` : "",
    px.havale ? `Havale / EFT: %2 indirim → ${formatTl(px.havale)}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    category: map.category,
    brand: "Rational",
    name,
    price: priceStr,
    specs,
    images: imgRel ? [imgRel] : [],
    sku,
    model,
    fiyat_tl: px.vitrin || 0,
    kaynak_fiyat_listesi: "cafemarkt-plp",
    fiyat_kaynak: "cafemarkt",
    cafemarkt_fiyat_kdv_dahil: px.cm || null,
    cafemarkt_fiyat_equsto_kdv_dahil: px.vitrin || null,
    cafemarkt_indirim_oran: VITRIN_ISKONTO,
    cafemarkt_id: cm.cafemarkt_id || "",
    cafemarkt_url: cm.url || "",
    dept: map.dept,
    id: `rational__${slugify(sku)}`,
    equsto_kod: `EQ-RATIONAL-${model}`,
    marka_kodu: "RATIONAL",
    marka_urun_kodu: model,
    urun_kategori: "Pişirme",
    urun_alt_kategori: "Kombi Fırın",
    alt_kategori_1: map.alt,
    alt_kategori_2: map.altLabel,
    kategori_yolu: ["Pişirme", "Kombi Fırın", map.altLabel, map.alt],
    teknik_ozellikler: [`Seri: ${map.altLabel}`, `Model: ${model}`],
    description: name,
    image: imgRel || "",
    fiyat_bekleniyor: !(px.vitrin > 0),
  };
}

function robotCoupeSku(cm) {
  const raw = stripDistributorPrefix(cm.code || "");
  const ref = raw.replace(/^057\.?/i, "").replace(/^T1\./i, "");
  return `TM${ref}`;
}

function mapRobotCoupeDept(cls) {
  if (cls.group === "el-blender") {
    return { dept: "hazirlik", category: "robot-coupe-el-mikserleri", alt: "el-blender", altLabel: "El blender" };
  }
  if (cls.group === "sebze-dograma") {
    return { dept: "hazirlik", category: "sebze-dograma-makineleri", alt: "sebze-dograma", altLabel: "Sebze doğrama" };
  }
  if (cls.group === "sikacak") {
    return { dept: "hazirlik", category: "robot-coupe", alt: "sikacak", altLabel: "Meyve sıkacağı" };
  }
  if (cls.group === "robot-cook") {
    return { dept: "hazirlik", category: "robot-coupe", alt: "robot-cook", altLabel: "Robot Cook" };
  }
  if (cls.group === "blixer") {
    return { dept: "hazirlik", category: "robot-coupe", alt: "blixer", altLabel: "Blixer" };
  }
  return { dept: "hazirlik", category: "robot-coupe", alt: cls.group || "robot-coupe", altLabel: "Robot Coupe" };
}

function makeRobotCoupeRow(cm, cls, imgRel) {
  const sku = robotCoupeSku(cm);
  const px = priceFromCm(cm.price_try_kdv_dahil);
  const map = mapRobotCoupeDept(cls);
  const name = String(cm.name || "").toLocaleUpperCase("tr-TR");
  const priceStr = px.vitrin > 0 ? `${formatTl(px.vitrin)} KDV dahil` : "Teklif için iletişim";
  const specs = [
    name,
    "Kaynak: Cafemarkt (fiyat)",
    `Robot Coupe ref: ${stripDistributorPrefix(cm.code || "")}`,
    `Cafemarkt: ${cm.url || ""}`,
    px.cm ? `Kaynak fiyat (Cafemarkt KDV dahil): ${formatTl(px.cm)}` : "",
    px.vitrin ? `Equsto Cafemarkt −%2 (KDV dahil): ${formatTl(px.vitrin)}` : "",
    px.havale ? `Havale / EFT: %2 indirim → ${formatTl(px.havale)}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    category: map.category,
    brand: "Yüksel Endüstriyel",
    name,
    price: priceStr,
    specs,
    images: imgRel ? [imgRel] : [],
    sku,
    model: sku,
    fiyat_tl: px.vitrin || 0,
    kaynak_fiyat_listesi: "cafemarkt-plp",
    fiyat_kaynak: "cafemarkt",
    cafemarkt_fiyat_kdv_dahil: px.cm || null,
    cafemarkt_fiyat_equsto_kdv_dahil: px.vitrin || null,
    cafemarkt_indirim_oran: VITRIN_ISKONTO,
    cafemarkt_id: cm.cafemarkt_id || "",
    cafemarkt_url: cm.url || "",
    oem_brand: "Robot Coupe",
    dept: map.dept,
    id: `yukselsatis__robot-coupe-${slugify(sku)}`,
    equsto_kod: `EQ-YUKSEL.${sku}`,
    marka_kodu: "YUKSEL",
    marka_urun_kodu: sku,
    urun_kategori: "Hazırlık",
    urun_alt_kategori: map.altLabel,
    alt_kategori_1: map.alt,
    alt_kategori_2: map.altLabel,
    kategori_yolu: ["Hazırlık", map.altLabel, map.alt],
    teknik_ozellikler: [`Seri: ${map.altLabel}`, `Stok: ${sku}`],
    keywords: ["Robot Coupe", sku, cm.code, name].filter(Boolean),
    description: name,
    image: imgRel || "",
    fiyat_bekleniyor: !(px.vitrin > 0),
  };
}

function unoxSku(cm) {
  return String(cm.code || "")
    .trim()
    .replace(/^T1\./i, "")
    .replace(/^061\./i, "");
}

function mapUnoxDept(cls) {
  const group = cls.group || "firin";
  const labels = {
    cheftop: "ChefTop",
    bakertop: "BakerTop",
    konveksiyon: "Bakerlux / Cheflux",
    mayalama: "Mayalama",
    evereo: "Evereo",
    speed: "Speed.Pro",
    firin: "Fırın",
  };
  return {
    dept: "pisirme",
    category: group === "mayalama" ? "mayalama-dolaplari" : "kombi-firin",
    alt: group,
    altLabel: labels[group] || "Fırın",
  };
}

function makeUnoxRow(cm, cls, imgRel) {
  const sku = unoxSku(cm);
  const px = priceFromCm(cm.price_try_kdv_dahil);
  const map = mapUnoxDept(cls);
  const name = String(cm.name || "").replace(/^Unox\s+/i, "UNOX ");
  const priceStr = px.vitrin > 0 ? `${formatTl(px.vitrin)} KDV dahil` : "Teklif için iletişim";
  const specs = [
    name,
    "Kaynak: Cafemarkt (fiyat)",
    `Unox kod: ${sku}`,
    `Cafemarkt: ${cm.url || ""}`,
    px.cm ? `Kaynak fiyat (Cafemarkt KDV dahil): ${formatTl(px.cm)}` : "",
    px.vitrin ? `Equsto Cafemarkt −%2 (KDV dahil): ${formatTl(px.vitrin)}` : "",
    px.havale ? `Havale / EFT: %2 indirim → ${formatTl(px.havale)}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    category: map.category,
    brand: "Unox",
    name,
    price: priceStr,
    specs,
    images: imgRel ? [imgRel] : [],
    sku,
    model: sku,
    fiyat_tl: px.vitrin || 0,
    kaynak_fiyat_listesi: "cafemarkt-plp",
    fiyat_kaynak: "cafemarkt",
    cafemarkt_fiyat_kdv_dahil: px.cm || null,
    cafemarkt_fiyat_equsto_kdv_dahil: px.vitrin || null,
    cafemarkt_indirim_oran: VITRIN_ISKONTO,
    cafemarkt_id: cm.cafemarkt_id || "",
    cafemarkt_url: cm.url || "",
    oem_brand: "Unox",
    dept: map.dept,
    id: `unox__${slugify(sku)}`,
    equsto_kod: `EQ-UNOX.${sku}`,
    marka_kodu: "UNOX",
    marka_urun_kodu: sku,
    urun_kategori: "Pişirme",
    urun_alt_kategori: map.altLabel,
    alt_kategori_1: map.alt,
    alt_kategori_2: map.altLabel,
    kategori_yolu: ["Pişirme", map.altLabel, map.alt],
    teknik_ozellikler: [`Seri: ${map.altLabel}`, `Stok: ${sku}`],
    keywords: ["Unox", sku, cm.code, name].filter(Boolean),
    description: name,
    image: imgRel || "",
    fiyat_bekleniyor: !(px.vitrin > 0),
  };
}

function genericSku(cm) {
  const raw = stripDistributorPrefix(cm.code || "").replace(/^T1\./i, "");
  return raw || "";
}

function pickBrandLabel(eqRows, cmBrand) {
  const re = new RegExp(String(cmBrand).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  const hit = eqRows.find((r) => re.test(String(r.brand || "")));
  return hit?.brand || cmBrand;
}

function mapGenericDept(cls, cm) {
  const hay = `${cls.group || ""} ${cm.name || ""}`.toLocaleLowerCase("tr-TR");
  if (cls.group === "icecek" || /[cç]ay|sahlep|[cç]ikolata|su [iı]s[ıi]t|semaver|[sş]erbet|ayran|seb[iı]l|smoothie|slush|granita|s[ıi]kac|dispenser/i.test(hay)) {
    return {
      dept: "icecek",
      category: /[cç]ay/i.test(hay) ? "cay-makinasi" : "icecek",
      alt: /[cç]ay/i.test(hay) ? "cay" : "icecek",
      altLabel: /[cç]ay/i.test(hay) ? "Çay Makinesi" : "İçecek",
    };
  }
  if (/espresso|kahve|de[gğ]irmen|filtre kahve|brew/i.test(hay)) {
    return { dept: "kahve", category: "kahve-makineleri", alt: "kahve", altLabel: "Kahve" };
  }
  if (/bula[sş][ıi]k|y[ıi]kama/i.test(hay)) {
    return { dept: "yikama", category: "bulasik-makineleri", alt: "yikama", altLabel: "Yıkama" };
  }
  // soğutmalı kıyma / donuk et çekme → hazırlık (soğutma regex'ine düşmesin)
  if (/k[ıi]yma|donuk et|[cç]ekme makine|et [cç]ekme/i.test(hay)) {
    return {
      dept: "hazirlik",
      category: "et-kiyma-makineleri",
      alt: "et-kiyma",
      altLabel: "Et Kıyma",
    };
  }
  if (/buz|ice maker|so[gğ]ut|dondur|buzdolab/i.test(hay)) {
    return { dept: "sogutma", category: "sogutma", alt: "sogutma", altLabel: "Soğutma" };
  }
  if (/davlumbaz/i.test(hay)) {
    return { dept: "davlumbaz", category: "davlumbaz", alt: "davlumbaz", altLabel: "Davlumbaz" };
  }
  if (/chafing|küvet|kuvet|gastronorm|\bgn\b|servis/i.test(hay) && /servis|chafing|küvet|kuvet|gn/i.test(hay)) {
    return { dept: "servis", category: "servis", alt: "servis", altLabel: "Servis" };
  }
  if (/f[ıi]r[ıi]n|kombi|ocak|frit|[ıi]zgara|kuzine|mangal|pi[sş]ir/i.test(hay)) {
    return { dept: "pisirme", category: "pisirme", alt: cls.group || "pisirme", altLabel: "Pişirme" };
  }
  return { dept: "hazirlik", category: "hazirlik", alt: cls.group || "hazirlik", altLabel: "Hazırlık" };
}

function makeGenericRow(brand, cm, cls, imgRel, eqRows) {
  const sku = genericSku(cm);
  if (!sku) return null;
  const label = pickBrandLabel(eqRows, brand);
  const px = priceFromCm(cm.price_try_kdv_dahil);
  const map = mapGenericDept(cls, cm);
  const name = String(cm.name || "").trim();
  const priceStr = px.vitrin > 0 ? `${formatTl(px.vitrin)} KDV dahil` : "Teklif için iletişim";
  const markaKod = asciiUpper(label).replace(/[^A-Z0-9]/g, "").slice(0, 12) || "MARKA";
  const specs = [
    name,
    "Kaynak: Cafemarkt (fiyat)",
    `Stok: ${sku}`,
    `Cafemarkt: ${cm.url || ""}`,
    px.cm ? `Kaynak fiyat (Cafemarkt KDV dahil): ${formatTl(px.cm)}` : "",
    px.vitrin ? `Equsto Cafemarkt −%2 (KDV dahil): ${formatTl(px.vitrin)}` : "",
    px.havale ? `Havale / EFT: %2 indirim → ${formatTl(px.havale)}` : "",
    ...(Array.isArray(cm.pdp_specs) ? cm.pdp_specs.slice(0, 24) : []),
  ]
    .filter(Boolean)
    .join("\n");

  return {
    category: map.category,
    brand: label,
    name,
    price: priceStr,
    specs,
    images: imgRel ? [imgRel] : [],
    sku,
    model: sku,
    fiyat_tl: px.vitrin || 0,
    kaynak_fiyat_listesi: "cafemarkt-plp",
    fiyat_kaynak: "cafemarkt",
    cafemarkt_fiyat_kdv_dahil: px.cm || null,
    cafemarkt_fiyat_equsto_kdv_dahil: px.vitrin || null,
    cafemarkt_indirim_oran: VITRIN_ISKONTO,
    cafemarkt_id: cm.cafemarkt_id || "",
    cafemarkt_url: cm.url || "",
    oem_brand: brand,
    dept: map.dept,
    id: `${slugify(label)}__${slugify(sku)}`,
    equsto_kod: `EQ-${markaKod}.${sku}`,
    marka_kodu: markaKod,
    marka_urun_kodu: sku,
    urun_kategori: map.altLabel,
    urun_alt_kategori: map.altLabel,
    alt_kategori_1: map.alt,
    alt_kategori_2: map.altLabel,
    kategori_yolu: [map.altLabel, map.alt],
    teknik_ozellikler: [
      `Stok: ${sku}`,
      ...(Array.isArray(cm.pdp_specs) ? cm.pdp_specs.slice(0, 24) : []),
    ].filter(Boolean),
    keywords: [label, brand, sku, cm.code, name].filter(Boolean),
    description: cm.description || name,
    image: imgRel || "",
    fiyat_bekleniyor: !(px.vitrin > 0),
  };
}

function makeNewRow(brand, cm, cls, imgRel, eqRows) {
  if (/robot\s*coupe/i.test(brand)) return makeRobotCoupeRow(cm, cls, imgRel);
  if (/unox/i.test(brand)) return makeUnoxRow(cm, cls, imgRel);
  if (/rational/i.test(brand)) return makeRationalRow(cm, cls, imgRel);
  return makeGenericRow(brand, cm, cls, imgRel, eqRows);
}

function writeDeptAtomic(dept, rows) {
  const filePath = path.join(DEPT_DIR, `${dept}.json`);
  writeJson(filePath, rows, false);
}

async function main() {
  const brand = arg("--brand") || "Rational";
  const slug = arg("--slug") || brandSlug(brand);
  const cachePath = plpCachePath(slug);
  if (!fs.existsSync(cachePath)) {
    console.error(`Önce: node scripts/import-cm-brands/fetch-plp.mjs --brand ${brand}`);
    process.exit(1);
  }
  const cache = JSON.parse(fs.readFileSync(cachePath, "utf8"));
  const items = cache.items || [];
  const eqRows = loadEqustoRows(new RegExp(brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
  const index = buildMatchIndex(eqRows);

  const dropped = [];
  const matched = [];
  const review = [];
  const toAdd = [];

  for (const cm of items) {
    const cls = classifyProduct(cm, brand);
    const hit = findMatch(cm, index);
    if (cls.verdict === "drop") {
      dropped.push({ ...cm, reason: cls.reason, group: cls.group });
      continue;
    }
    if (hit) {
      matched.push({
        cm_code: cm.code,
        cm_name: cm.name,
        equsto_id: hit.row.id,
        equsto_sku: hit.row.sku,
        via: hit.via,
      });
      continue;
    }
    if (cls.verdict === "review") {
      const price = Number(cm.price_try_kdv_dahil);
      if (keepReview && price >= 2000 && (cm.code || cm.sku)) {
        toAdd.push({ cm, cls: { ...cls, verdict: "keep", reason: "küçük marka — fiyatlı stok" } });
        continue;
      }
      review.push({ ...cm, reason: cls.reason, group: cls.group });
      continue;
    }
    toAdd.push({ cm, cls });
  }

  const addedRows = [];
  let i = 0;
  for (const item of toAdd) {
    i += 1;
    if (!dryRun && !skipPdp && item.cm.url) {
      console.log(`[cm-apply] pdp ${i}/${toAdd.length}`);
      await sleep(DELAY_PAGE_MS);
      const pdp = await fetchProductDetail(item.cm.url);
      if (pdp) {
        item.cm = {
          ...item.cm,
          description: pdp.description || item.cm.description,
          pdp_specs: pdp.specs,
          pdp_images: pdp.images,
          price_try_kdv_dahil: item.cm.price_try_kdv_dahil || pdp.price_try_kdv_dahil,
        };
      }
    }
    let imgRel = "";
    if (!dryRun && /rational/i.test(brand)) {
      imgRel = await resolveRationalOfficialImage(item.cm, rationalSku(item.cm));
    } else if (!dryRun && /robot\s*coupe/i.test(brand)) {
      imgRel = await resolveRobotCoupeOfficialImage(item.cm, robotCoupeSku(item.cm));
    } else if (!dryRun && /[oö]ztiryakiler/i.test(brand)) {
      imgRel = await resolveOztiryakilerOfficialImage(item.cm, genericSku(item.cm));
    }
    const row = makeNewRow(brand, item.cm, item.cls, imgRel, eqRows);
    if (row) addedRows.push(row);
  }

  const report = {
    brand,
    slug,
    dryRun,
    fetchedAt: cache.fetchedAt,
    plp: items.length,
    equstoExisting: eqRows.length,
    dropped: dropped.length,
    matchedKeep: matched.length,
    review: review.length,
    newRows: addedRows.length,
    droppedSample: dropped.slice(0, 20).map((d) => ({ name: d.name, code: d.code, reason: d.reason })),
    matched,
    reviewItems: review.map((r) => ({
      name: r.name,
      code: r.code,
      reason: r.reason,
      group: r.group,
      url: r.url || "",
      price: r.price_try_kdv_dahil || 0,
    })),
    newItems: addedRows.map((r) => ({
      sku: r.sku,
      name: r.name,
      fiyat_tl: r.fiyat_tl,
      id: r.id,
      image: r.image || "",
      cafemarkt_url: r.cafemarkt_url || "",
    })),
  };
  const problems = [
    ...review.map((r) => ({
      kind: r.group === "araba" || r.group === "istif" ? r.group : "review",
      sku: r.code || "",
      name: r.name,
      reason: r.reason,
      url: r.url || "",
    })),
    ...addedRows
      .filter((r) => !r.image)
      .map((r) => ({
        kind: "no-image",
        sku: r.sku,
        name: r.name,
        reason: "resmi görsel yok — Cafemarkt kartı kullanılmadı",
        url: r.cafemarkt_url || "",
      })),
    ...addedRows
      .filter((r) => !(r.fiyat_tl > 0))
      .map((r) => ({
        kind: "no-price",
        sku: r.sku,
        name: r.name,
        reason: "fiyat yok",
        url: r.cafemarkt_url || "",
      })),
  ];
  const reportPath = path.join(REPORT_DIR, `${slug}-apply-report.json`);
  const problemsPath = path.join(REPORT_DIR, `${slug}-problems.json`);
  writeJson(reportPath, report);
  writeJson(problemsPath, { brand, slug, count: problems.length, items: problems });

  console.log(
    `[cm-apply] ${brand} PLP=${items.length} mevcut=${eqRows.length} eşleşen=${matched.length} ele=${dropped.length} belirsiz=${review.length} yeni=${addedRows.length} ${dryRun ? "DRY-RUN" : "APPLY"}`,
  );
  console.log(`[cm-apply] rapor: ${reportPath}`);
  console.log(`[cm-apply] sorun: ${problemsPath} (${problems.length})`);

  if (dryRun) {
    for (const r of addedRows) {
      console.log(`  + ${r.sku}  ${r.fiyat_tl}  ${r.name}`);
    }
    return;
  }

  const byDept = new Map();
  for (const row of addedRows) {
    if (!byDept.has(row.dept)) byDept.set(row.dept, []);
    byDept.get(row.dept).push(row);
  }
  for (const [dept, extra] of byDept) {
    const filePath = path.join(DEPT_DIR, `${dept}.json`);
    const cur = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const ids = new Set(cur.map((r) => r.id));
    const fresh = extra.filter((r) => !ids.has(r.id));
    cur.push(...fresh);
    writeDeptAtomic(dept, cur);
    console.log(`[cm-apply] ${dept}.json +${fresh.length}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
