#!/usr/bin/env node
/**
 * PRO-TEK Hijyen katalog → public/data/dept/yikama.json
 * Fiyat yok: fiyat_bekleniyor=true, price="Teklif iste"
 *
 *   node scripts/import-protek-to-yikama.mjs
 *   node scripts/import-protek-to-yikama.mjs --dry-run
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { MASTER_JSON_PATH } from "./catalog-master-paths.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = path.join(ROOT, "scripts/data/protek/protek-catalog.json");
const YIKAMA = path.join(ROOT, "public/data/dept/yikama.json");
const BRANDS = path.join(ROOT, "public/data/markalarimiz-brands.json");
const dryRun = process.argv.includes("--dry-run");

function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function writeJsonAtomic(filePath, data) {
  const tmp = `${filePath}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, JSON.stringify(data), "utf8");
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (_) {}
  fs.renameSync(tmp, filePath);
}

function toShopRow(p) {
  const code = String(p.code || "").toUpperCase().replace(/\s+/g, "");
  const id = `protek-hijyen__${slugify(code)}`;
  const images = p.image ? [p.image] : [];
  const teknik = [];
  if (p.dims_mm) teknik.push(`Ölçü (mm): ${p.dims_mm}`);
  for (const f of p.features || []) teknik.push(f);
  teknik.push(`Katalog sayfa: ${p.page}`);
  teknik.push(`Kaynak: PRO-TEK Hijyen Katalog`);

  return {
    id,
    dept: "yikama",
    category: p.category,
    brand: "PRO-TEK Hijyen",
    oem_brand: "PRO-TEK",
    name: p.name,
    model: code,
    sku: code,
    urun_kodu: code,
    marka_urun_kodu: code,
    price: "Teklif iste",
    fiyat_bekleniyor: true,
    fiyat_tl: null,
    liste_fiyati_eur: null,
    satis_fiyati_eur: null,
    satis_eur_indirimli: null,
    images,
    specs: p.specs,
    teknik_ozellikler: teknik,
    aciklama: `${p.name}\n\n${p.name_en || ""}\n\nKategori: ${p.category_label || p.category}\nKaynak: PRO-TEK Hijyen Katalog (sayfa ${p.page})`.trim(),
    keywords: [
      "PRO-TEK Hijyen",
      "PRO-TEK",
      "Protek",
      code,
      p.category_label || p.category,
      p.name,
      "hijyen",
      "yıkama",
      "endüstriyel hijyen",
    ].filter(Boolean),
    kaynak: "protek-katalog",
    kaynak_fiyat_listesi: "protek-katalog",
    kaynak_url: p.website || "https://www.protekhijyen.com.tr",
    olculer: p.dims_mm || null,
  };
}

function ensureBrand() {
  if (!fs.existsSync(BRANDS)) return;
  const data = JSON.parse(fs.readFileSync(BRANDS, "utf8"));
  const brands = Array.isArray(data.brands) ? data.brands : [];
  const exists = brands.some((b) => /pro-?tek/i.test(String(b.name || b.slug || "")));
  if (exists) return false;
  brands.push({
    name: "PRO-TEK Hijyen",
    slug: "protek-hijyen",
    logo: "/images/brands/protek-hijyen.png",
    description:
      "PRO-TEK Hijyen, 2000’den beri endüstriyel hijyen ekipmanları üretir: sanitasyon üniteleri, el yıkama evyeleri, çizme fırçalama ve dezenfeksiyon sistemleri.",
    website: "https://www.protekhijyen.com.tr",
  });
  data.brands = brands;
  if (!dryRun) writeJsonAtomic(BRANDS, data);
  return true;
}

function syncMaster(rows) {
  if (!fs.existsSync(MASTER_JSON_PATH)) return 0;
  const master = JSON.parse(fs.readFileSync(MASTER_JSON_PATH, "utf8"));
  const products = master.products || [];
  const byId = new Map(products.map((p) => [p.id, p]));
  let added = 0;
  for (const row of rows) {
    if (byId.has(row.id)) {
      const p = byId.get(row.id);
      p.name = row.name;
      p.brand = row.brand;
      p.dept = row.dept;
      p.category = row.category;
      p.teknik_ozellikler = row.specs;
      p.images = row.images;
      p.fiyat_bekleniyor = true;
      p.fiyat_tl = null;
      continue;
    }
    products.push({
      id: row.id,
      name: row.name,
      brand: row.brand,
      dept: row.dept,
      category: row.category,
      model: row.model,
      sku: row.sku,
      images: row.images,
      teknik_ozellikler: row.specs,
      fiyat_bekleniyor: true,
      fiyat_tl: null,
      kaynak: row.kaynak,
    });
    added++;
  }
  master.products = products;
  master.generated = new Date().toISOString();
  if (!dryRun) writeJsonAtomic(MASTER_JSON_PATH, master);
  return added;
}

function main() {
  if (!fs.existsSync(CATALOG)) {
    console.error("Katalog yok — önce: python3 scripts/extract-protek-catalog.py");
    process.exit(1);
  }
  const catalog = JSON.parse(fs.readFileSync(CATALOG, "utf8"));
  const incoming = (catalog.products || []).map(toShopRow);
  const yikama = JSON.parse(fs.readFileSync(YIKAMA, "utf8"));
  if (!Array.isArray(yikama)) {
    console.error("yikama.json dizi değil");
    process.exit(1);
  }

  const existingIds = new Set(yikama.map((r) => r.id));
  const existingSku = new Set(
    yikama.map((r) => String(r.sku || r.model || "").toUpperCase().replace(/\s+/g, "")),
  );

  let added = 0;
  let updated = 0;
  const byId = new Map(yikama.map((r, i) => [r.id, i]));

  for (const row of incoming) {
    const skuKey = String(row.sku || "").toUpperCase();
    if (byId.has(row.id)) {
      const i = byId.get(row.id);
      yikama[i] = { ...yikama[i], ...row };
      updated++;
      continue;
    }
    // aynı SKU başka id ile varsa güncelleme
    const hit = yikama.findIndex(
      (r) =>
        /protek/i.test(String(r.brand || r.kaynak || "")) &&
        String(r.sku || r.model || "").toUpperCase().replace(/\s+/g, "") === skuKey,
    );
    if (hit >= 0) {
      yikama[hit] = { ...yikama[hit], ...row, id: yikama[hit].id };
      updated++;
      continue;
    }
    if (existingSku.has(skuKey) && !/protek/i.test(String(yikama.find((r) => String(r.sku || r.model || "").toUpperCase().replace(/\s+/g, "") === skuKey)?.brand || ""))) {
      // farklı markada aynı kod — yine de protek id ile ekle
    }
    yikama.push(row);
    existingIds.add(row.id);
    existingSku.add(skuKey);
    added++;
  }

  console.log(
    `[protek→yikama] katalog ${incoming.length} | eklendi ${added} | güncellendi ${updated} | yikama toplam ${yikama.length}`,
  );

  if (!dryRun) {
    writeJsonAtomic(YIKAMA, yikama);
    const brandAdded = ensureBrand();
    if (brandAdded) console.log("[protek→yikama] markalarimiz-brands.json: PRO-TEK Hijyen eklendi");
    const masterAdded = syncMaster(incoming);
    console.log(`[protek→yikama] master: ${masterAdded} yeni`);
    execFileSync(process.execPath, ["scripts/rebuild-ekipmanlar-from-dept.mjs"], {
      cwd: ROOT,
      stdio: "inherit",
    });
  }
}

main();
