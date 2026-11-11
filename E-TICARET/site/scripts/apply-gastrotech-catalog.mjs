/**
 * Gastrotech 2025-2027 katalog → Equsto dept JSON güncelle / ekle.
 *
 * Fiyat kuralları (kullanıcı):
 * - Sayfa 41–78: %45 iskonto → satış = liste × 0.55 → TL (TCMB EUR) → +KDV %20
 * - Puqpress: liste = satış EUR → TL → +KDV %20
 * - Diğer: %47 iskonto → satış = liste × 0.53 → TL → +KDV %20
 * - Rational / Electrolux: hiçbir değişiklik yok
 *
 *   node scripts/apply-gastrotech-catalog.mjs
 *   node scripts/apply-gastrotech-catalog.mjs --dry-run
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchTcmbEurUsdRates } from "./fetch-tcmb-kur.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = path.join(ROOT, "scripts/data/gastrotech/gastrotech-catalog-extracted.json");
const DEPT_DIR = path.join(ROOT, "public/data/dept");
const REPORT = path.join(ROOT, "scripts/data/gastrotech/gastrotech-apply-report.json");
const REPORT_MD = path.join(ROOT, "scripts/data/gastrotech/gastrotech-apply-report.md");

const KDV = 20;
const DRY = process.argv.includes("--dry-run");

const PROTECTED_BRAND = /^(rational|electrolux(\s+professional)?)$/i;

function norm(s) {
  return String(s || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function fmtTry(n) {
  const v = Math.round(Number(n));
  return `₺${v.toLocaleString("tr-TR")},00`;
}

function pricingRule(item) {
  if (item.pricing_rule === "list_as_sale" || /^PUQ\s*PRESS/i.test(item.model) || (item.brand_hint === "Puqpress")) {
    return { key: "puqpress_list", iskonto: 0, satisOran: 1.0, label: "Puqpress liste=satış" };
  }
  const p = Number(item.page);
  if (p >= 41 && p <= 78) {
    return { key: "p41_78", iskonto: 45, satisOran: 0.55, label: "s.41–78 %45 iskonto" };
  }
  return { key: "default", iskonto: 47, satisOran: 0.53, label: "katalog %47 iskonto" };
}

function computePrice(item, eurTry) {
  const rule = pricingRule(item);
  const liste = Number(item.liste_fiyat);
  const currency = item.currency || "EUR";
  const satisKur = round2(liste * rule.satisOran);
  let netTl;
  let kurUsed = null;
  if (currency === "TL") {
    netTl = Math.round(satisKur);
  } else {
    kurUsed = eurTry;
    netTl = Math.round(satisKur * eurTry);
  }
  const kdvDahil = Math.round(netTl * (1 + KDV / 100));
  return {
    rule,
    liste,
    currency,
    satis_eur: currency === "EUR" ? satisKur : null,
    satis_tl_net: netTl,
    fiyat_tl: kdvDahil,
    kur_eur_try: kurUsed,
    price: `${fmtTry(kdvDahil)} KDV dahil`,
  };
}

function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}

function brandFor(item) {
  if (item.brand_hint) return item.brand_hint;
  const m = item.model.toUpperCase().trim();
  // Scotsman: soğutma s.158–166 (EC 47, AC 47…) — s.226 Gtech AC-517EC ile karıştırma
  if (item.source === "scotsman" || (item.page >= 158 && item.page <= 166 && /^(EC|AC|NW|MX)\s?\d/i.test(m))) {
    return "Scotsman";
  }
  if (m.startsWith("EC ") || (m.startsWith("AC ") && !/^AC-\d/.test(m)) || m.startsWith("NW ") || m.startsWith("SB") || m.startsWith("BK")) {
    return "Scotsman";
  }
  // Gtech: s.226 ST-530ED / AC-517EC vb.
  if (/^(ST-|AC-|GT-|GDC)/.test(m) || /^ST\d|^GT-/.test(m)) return "Gtech";
  if (m.startsWith("5K")) return "KitchenAid";
  if (m.startsWith("NEVO")) return "Vital";
  return "Gastrotech";
}

function slugId(brand, model) {
  const b = brand
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const m = model
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${b}__${m}`;
}

function buildSpecs(item, px, brand) {
  const lines = [
    item.name_tr || `${brand} ${item.model}`,
    "",
    `Ürün kodu: ${item.model}`,
    item.dims ? `Ölçü: ${item.dims} mm` : null,
    `Liste fiyatı (${px.currency}): ${px.liste}`,
    px.rule.label,
    px.satis_eur != null ? `Equsto satış (${px.currency}): ${px.satis_eur}` : null,
    px.kur_eur_try != null ? `Kur: 1 EUR = ${px.kur_eur_try} TRY (KDV %${KDV})` : `KDV %${KDV}`,
    `Equsto satış (TL, KDV dahil): ${fmtTry(px.fiyat_tl)}`,
    `Kaynak: Gastrotech 2025-2027 katalog s.${item.page}`,
  ].filter(Boolean);
  return lines.join("\n");
}

function applyPriceFields(row, item, px, brand) {
  const name = row.name || item.name_tr || `${brand} ${item.model}`;
  row.price = px.price;
  row.fiyat_tl = px.fiyat_tl;
  row.fiyat_tl_net = px.satis_tl_net;
  row.liste_fiyati = px.liste;
  if (px.currency === "EUR") {
    row.liste_fiyati_eur = px.liste;
    row.satis_fiyati_eur = px.satis_eur;
    row.para_birimi = "EUR";
    row.kur_eur_try = px.kur_eur_try;
  } else {
    row.liste_fiyati_tl = px.liste;
    row.para_birimi = "TL";
  }
  row.iskonto_oran = px.rule.iskonto;
  row.bayi_iskonto = px.rule.iskonto / 100;
  row.kdv_oran = KDV;
  row.fiyat_kaynagi = "gastrotech-2025-2027";
  row.fiyat_kaynak = "gastrotech-2025-2027";
  row.kaynak_fiyat_listesi = "gastrotech-2025-2027";
  row.gastrotech_page = item.page;
  row.gastrotech_model = item.model;
  row.fiyat_bekleniyor = false;
  row.specs = buildSpecs(item, px, brand);
  return row;
}

function newProduct(item, px, brand) {
  const model = item.model;
  const nameBase = item.name_tr || model;
  const name = /gastrotech|gtech|vital|scotsman|puq|kitchen|mahlk/i.test(nameBase)
    ? nameBase
    : `${brand} ${nameBase}`;
  const id = slugId(brand, model);
  const sku = model.replace(/\s+/g, ".").toUpperCase();
  const dept = item.dept || "pisirme";
  const row = {
    id,
    dept,
    category: dept,
    brand,
    name,
    sku,
    model: sku,
    marka_urun_kodu: sku,
    equsto_kod: `EQ-${norm(brand).slice(0, 8)}.${norm(model)}`,
    images: [],
    image: "",
    keywords: [brand, model, name],
    description: name,
    aciklama: name,
    urun_kategori: dept,
  };
  return applyPriceFields(row, item, px, brand);
}

function isProtected(row) {
  const brand = String(row.brand || row.marka || "");
  const oem = String(row.oem_brand || "");
  return PROTECTED_BRAND.test(brand.trim()) || PROTECTED_BRAND.test(oem.trim());
}

function indexSiteProducts() {
  /** @type {Map<string, {dept:string, idx:number, row:any}[]>} */
  const byNorm = new Map();
  const deptFiles = {};
  for (const file of fs.readdirSync(DEPT_DIR)) {
    if (!file.endsWith(".json") || file.includes("_items")) continue;
    const full = path.join(DEPT_DIR, file);
    const rows = JSON.parse(fs.readFileSync(full, "utf8"));
    if (!Array.isArray(rows)) continue;
    deptFiles[file] = rows;
    const dept = file.replace(/\.json$/, "");
    rows.forEach((row, idx) => {
      if (!row || typeof row !== "object") return;
      const keys = [row.sku, row.model, row.marka_urun_kodu, row.gastrotech_model, row.id]
        .filter(Boolean)
        .map(norm);
      // id içinden model parçası: gtech__st-530ed → ST530ED
      if (row.id && String(row.id).includes("__")) {
        keys.push(norm(String(row.id).split("__").slice(1).join("__")));
      }
      for (const k of keys) {
        if (!k || k.length < 3) continue;
        if (!byNorm.has(k)) byNorm.set(k, []);
        byNorm.get(k).push({ dept, file, idx, row });
      }
    });
  }
  return { byNorm, deptFiles };
}

/** Katalog markasının sitede yazılabileceği brand / id önekleri */
const ALLOWED_SITE_BRANDS = {
  gastrotech: ["gastrotech", "gtech"],
  gtech: ["gtech", "gastrotech"],
  scotsman: ["scotsman"],
  vital: ["vital"],
  puqpress: ["puqpress", "puq"],
  kitchenaid: ["kitchenaid", "kitchen aid"],
  mahlkönig: ["mahlkönig", "mahlkonig"],
  mahlkonig: ["mahlkönig", "mahlkonig"],
};

function siteBrandAllowed(row, wantBrand) {
  const want = String(wantBrand || "")
    .toLowerCase()
    .split(" ")[0];
  const allowed = ALLOWED_SITE_BRANDS[want] || [want];
  const b = String(row.brand || "").toLowerCase();
  const id = String(row.id || "").toLowerCase();
  const mk = String(row.marka_kodu || "").toLowerCase();
  return allowed.some(
    (a) => b === a || b.includes(a) || id.startsWith(`${a}__`) || mk === a.replace(/\s+/g, ""),
  );
}

function pickMatch(candidates, item) {
  if (!candidates?.length) return null;
  // Rational / Electrolux asla güncellenmez; yalnızca onlar varsa eşleşme yok → yeni Gastrotech eklenir
  // (örn. Electrolux SKU 371000 ≠ Gastrotech 700 seri 371000)
  const open = candidates.filter((c) => !isProtected(c.row));
  if (!open.length) {
    return {
      blocked_site_only: true,
      reason: "site_hit_only_rational_or_electrolux",
      site_ids: candidates.map((c) => c.row.id),
    };
  }
  const want = brandFor(item);
  // Marka uyumu zorunlu — By Kitchen / Silverinox / Bezzera vb. asla ezilmez
  const brandPool = open.filter((c) => siteBrandAllowed(c.row, want));
  if (!brandPool.length) return null;
  const sameDept = brandPool.filter((c) => c.dept === (item.dept || c.dept));
  const pool = sameDept.length ? sameDept : brandPool;
  const wantHead = want.toLowerCase().split(" ")[0];
  const brandHit = pool.find((c) => String(c.row.brand || "").toLowerCase().includes(wantHead));
  return brandHit || pool[0];
}

async function main() {
  if (!fs.existsSync(CATALOG)) {
    throw new Error(`Katalog yok: ${CATALOG} — önce extract-gastrotech-catalog.py çalıştır`);
  }
  const catalog = JSON.parse(fs.readFileSync(CATALOG, "utf8"));
  const tcmb = await fetchTcmbEurUsdRates();
  const eurTry =
    Number(process.env.EQUSTO_EUR_TRY) > 0 ? Number(process.env.EQUSTO_EUR_TRY) : tcmb.eurTry;
  console.log(`[gastrotech] kur 1 EUR = ${eurTry} TRY (tcmb=${tcmb.tcmbDate || "fallback"} dry=${DRY})`);
  console.log(`[gastrotech] katalog ürün: ${catalog.product_count}`);

  const { byNorm, deptFiles } = indexSiteProducts();

  const report = {
    generated_at: new Date().toISOString(),
    kur_eur_try: eurTry,
    tcmb_date: tcmb.tcmbDate,
    dry_run: DRY,
    rules: {
      pages_41_78: "liste × 0.55 + KDV",
      puqpress: "liste = satış + KDV",
      rest: "liste × 0.53 + KDV",
      skip: ["Rational", "Electrolux"],
    },
    updated: [],
    added: [],
    skipped_protected: [],
    skipped_no_price: [],
    unmatched_existing_note: "sitede eşleşmeyen katalog ürünleri eklendi (added)",
    stats: {},
  };

  const seenAdd = new Set();

  for (const item of catalog.products) {
    if (!item.liste_fiyat || item.liste_fiyat <= 0) {
      report.skipped_no_price.push(item);
      continue;
    }
    if (item.skip_import) continue;

    const px = computePrice(item, eurTry);
    const brand = brandFor(item);
    const key = norm(item.model);
    const match = pickMatch(byNorm.get(key), item);

    // Alternatif anahtarlar: EC47 ↔ EC.47 ↔ AC87
    let resolved = match;
    if (!resolved) {
      const alts = [
        key,
        key.replace(/^(EC|AC|NW|MX|SB|BK)/, "$1"),
        item.model.replace(/\s+/g, ""),
        item.model.replace(/\s+/g, "."),
      ].map(norm);
      for (const a of alts) {
        const m = pickMatch(byNorm.get(a), item);
        if (m) {
          resolved = m;
          break;
        }
      }
    }

    // Sitede yalnızca Rational/Electrolux aynı kodla var → onları elleme, Gastrotech olarak ekle
    if (resolved?.blocked_site_only) {
      report.skipped_protected.push({
        model: item.model,
        page: item.page,
        liste: item.liste_fiyat,
        reason: resolved.reason,
        site_ids: resolved.site_ids,
        action: "add_as_gastrotech_new",
      });
      resolved = null;
    }

    if (resolved) {
      const { file, idx, row } = resolved;
      if (isProtected(row)) {
        report.skipped_protected.push({
          model: item.model,
          page: item.page,
          site_id: row.id,
          brand: row.brand,
        });
        continue;
      }
      const before = row.price;
      applyPriceFields(row, item, px, row.brand || brand);
      deptFiles[file][idx] = row;
      report.updated.push({
        id: row.id,
        brand: row.brand,
        model: item.model,
        page: item.page,
        rule: px.rule.key,
        liste: px.liste,
        currency: px.currency,
        before,
        after: row.price,
        fiyat_tl: px.fiyat_tl,
        dept: resolved.dept,
      });
      continue;
    }

    // Yeni ürün
    const id = slugId(brand, item.model);
    if (seenAdd.has(id)) continue;
    seenAdd.add(id);
    const row = newProduct(item, px, brand);
    const file = `${row.dept}.json`;
    if (!deptFiles[file]) deptFiles[file] = [];
    deptFiles[file].push(row);
    // index'e ekle ki çakışma olmasın
    const nk = norm(item.model);
    if (!byNorm.has(nk)) byNorm.set(nk, []);
    byNorm.get(nk).push({ dept: row.dept, file, idx: deptFiles[file].length - 1, row });
    report.added.push({
      id: row.id,
      brand,
      model: item.model,
      page: item.page,
      rule: px.rule.key,
      liste: px.liste,
      currency: px.currency,
      price: row.price,
      fiyat_tl: px.fiyat_tl,
      dept: row.dept,
      name: row.name,
    });
  }

  report.stats = {
    catalog: catalog.product_count,
    updated: report.updated.length,
    added: report.added.length,
    skipped_protected: report.skipped_protected.length,
    by_rule: {
      p41_78: report.updated.filter((x) => x.rule === "p41_78").length + report.added.filter((x) => x.rule === "p41_78").length,
      puqpress_list:
        report.updated.filter((x) => x.rule === "puqpress_list").length +
        report.added.filter((x) => x.rule === "puqpress_list").length,
      default:
        report.updated.filter((x) => x.rule === "default").length +
        report.added.filter((x) => x.rule === "default").length,
    },
  };

  if (!DRY) {
    for (const [file, rows] of Object.entries(deptFiles)) {
      const full = path.join(DEPT_DIR, file);
      const tmp = `${full}.tmp-${process.pid}`;
      const payload = JSON.stringify(rows, null, 2) + "\n";
      fs.writeFileSync(tmp, payload, "utf8");
      try {
        fs.renameSync(tmp, full);
      } catch {
        fs.copyFileSync(tmp, full);
        fs.unlinkSync(tmp);
      }
    }
  }

  fs.writeFileSync(REPORT, JSON.stringify(report, null, 2), "utf8");
  const md = [
    `# Gastrotech 2025-2027 uygulama raporu`,
    ``,
    `- Kur: **1 EUR = ${eurTry} TRY** (TCMB ${tcmb.tcmbDate || "—"})`,
    `- Dry-run: ${DRY}`,
    `- Katalog ürün: ${report.stats.catalog}`,
    `- Güncellenen: **${report.stats.updated}**`,
    `- Eklenen: **${report.stats.added}**`,
    `- Rational/Electrolux atlanan: **${report.stats.skipped_protected}**`,
    ``,
    `## Kurallar`,
    `- s.41–78: liste × %55 + KDV`,
    `- Puqpress: liste = satış + KDV`,
    `- Diğer: liste × %53 + KDV`,
    `- Rational & Electrolux: dokunulmadı`,
    ``,
    `## Örnek güncellemeler`,
    ...report.updated.slice(0, 25).map(
      (u) => `- \`${u.id}\` s.${u.page} ${u.rule}: ${u.before} → **${u.after}** (liste ${u.liste} ${u.currency})`,
    ),
    ``,
    `## Örnek eklemeler`,
    ...report.added.slice(0, 25).map(
      (a) => `- \`${a.id}\` s.${a.page} ${a.rule}: **${a.price}** — ${a.name}`,
    ),
    ``,
    `## Puqpress`,
    ...[...report.updated, ...report.added]
      .filter((x) => x.rule === "puqpress_list")
      .map((x) => `- ${x.model}: ${x.price || x.after} (liste ${x.liste} EUR, iskontosuz)`),
    ``,
  ].join("\n");
  fs.writeFileSync(REPORT_MD, md, "utf8");

  console.log(`[gastrotech] updated=${report.stats.updated} added=${report.stats.added} protected_skip=${report.stats.skipped_protected}`);
  console.log(`[gastrotech] rapor: ${REPORT_MD}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
