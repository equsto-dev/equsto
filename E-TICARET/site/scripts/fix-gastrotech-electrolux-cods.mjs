/**
 * Gastrotech kataloğundan yanlışlıkla Gastrotech markasıyla giren
 * Electrolux Professional COD’larını Electrolux fiyat listesiyle eşleyip düzelt.
 *
 * - Listede + sitede electrolux-professional__COD varsa → gastrotech kopyasını sil
 * - Listede var, Electrolux ürünü yoksa → satırı Electrolux’a çevir + liste fiyatı
 * - SkyLine PremiumS (s.98 / 2177xx–2178xx) listede yoksa → markayı düzelt,
 *   bilinen halef COD ile Electrolux fiyatı uygula
 *
 *   node scripts/fix-gastrotech-electrolux-cods.mjs
 *   node scripts/fix-gastrotech-electrolux-cods.mjs --dry-run
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPT_DIR = path.join(ROOT, "public/data/dept");
const FIYAT = path.join(ROOT, "scripts/data/electrolux-fiyat-2026.json");
const REPORT = path.join(ROOT, "scripts/data/gastrotech/gastrotech-electrolux-fix-report.json");
const DRY = process.argv.includes("--dry-run");

const BRAND = "Electrolux Professional";
const OEM = "Electrolux";
const BRAND_ID = "electrolux-professional";
const KAYNAK = "electrolux-professional";
const FIYAT_KAYNAK = "electrolux-fiyat-listesi-2026";
const KDV = 20;
const SATIS_ORAN = 0.55;
const ISKONTO = 45;

/** Eski SkyLine PremiumS COD → 2026 listesindeki halef (maran / EP). */
const SKYLINE_SUCCESSOR = {
  // Gaz T2 → T3G30
  "217780": "217719", // ECOG61T2G0 → ECOG61T3G30 (6GN1/1)
  "217781": "217735", // 6GN2/1
  "217782": "217737", // 10GN1/1
  "217783": "217739", // 10GN2/1
  "217784": "217744", // 20GN1/1
  "217785": "217746", // 20GN2/1
  // Elektrik T2 ailesi → yakın PremiumS elektrik (ECOE*T yok; ECOE*K3A30)
  "217720": "217635", // 6GN1/1
  "217721": "217636", // 6GN2/1
  "217722": "217637", // 10GN1/1
  "217723": "217638", // 10GN2/1
  "217724": "217639", // 20GN1/1
  "217725": "217642", // 20GN2/1
};

const SKYLINE_MODEL_HINT = {
  "217780": "ECOG61T2G0",
  "217781": "ECOG62T2G0",
  "217782": "ECOG101T2G0",
  "217783": "ECOG102T2G0",
  "217784": "ECOG201T2G0",
  "217785": "ECOG202T2G0",
  "217720": "ECOE61T2A0",
  "217721": "ECOE62T2A0",
  "217722": "ECOE101T2A0",
  "217723": "ECOE102T2A0",
  "217724": "ECOE201T2A0",
  "217725": "ECOE202T2A0",
};

function fmtTry(n) {
  return `₺${Math.round(Number(n)).toLocaleString("tr-TR")},00`;
}

function pricingFromListe(cod, liste, model, kur, { successorOf } = {}) {
  const satis = Math.round(liste * SATIS_ORAN * 100) / 100;
  const net = Math.round(satis * kur);
  const kdvDahil = Math.round(net * (1 + KDV / 100));
  const lines = [
    `Ürün kodu (COD): ${cod}`,
    `Model: ${model}`,
    successorOf ? `Halef COD (fiyat): ${successorOf}` : null,
    `Liste fiyatı (EUR): ${liste}`,
    `Bayi iskonto: %${ISKONTO}`,
    `Equsto satış (EUR): liste × ${Math.round(SATIS_ORAN * 100)}% = ${satis}`,
    `Equsto satış (TL, KDV dahil): ${fmtTry(kdvDahil)}`,
    `Kur: 1 EUR = ${kur} TRY (KDV %${KDV})`,
    `Kaynak: Electrolux Professional Fiyat Listesi 2026`,
  ].filter(Boolean);
  return {
    price: `${fmtTry(kdvDahil)} KDV dahil`,
    fiyat_tl: kdvDahil,
    fiyat_tl_net: net,
    liste_fiyati: liste,
    liste_fiyati_eur: liste,
    satis_fiyati_eur: satis,
    satis_eur_indirimli: satis,
    iskontolu_fiyat: satis,
    iskonto_oran: ISKONTO,
    iskonto_yuzde: ISKONTO,
    para_birimi: "EUR",
    kur_eur_try: kur,
    kdv_oran: KDV,
    fiyat_kaynagi: FIYAT_KAYNAK,
    kaynak_fiyat_listesi: FIYAT_KAYNAK,
    electrolux_liste_model: model,
    fiyat_bekleniyor: false,
    _specs_pricing: lines.join("\n"),
  };
}

function stripGastrotechPricing(specs) {
  const old = String(specs || "").trim();
  if (!old) return "";
  return old
    .split("\n")
    .filter((line) => {
      if (/^Ürün kodu:/i.test(line)) return false;
      if (/^Liste fiyatı/i.test(line)) return false;
      if (/katalog\s*%\d+\s*iskonto/i.test(line)) return false;
      if (/^Equsto satış/i.test(line)) return false;
      if (/^Kur:/i.test(line)) return false;
      if (/^Kaynak:\s*Gastrotech/i.test(line)) return false;
      if (/^Bayi iskonto/i.test(line)) return false;
      return true;
    })
    .join("\n")
    .trim();
}

function mergeSpecs(body, pricingText) {
  const b = stripGastrotechPricing(body);
  return b ? `${b}\n\n${pricingText}` : pricingText;
}

function isGastrotechMisbrand(row) {
  const id = String(row.id || "");
  const brand = String(row.brand || "");
  return id.startsWith("gastrotech__") || /^gastrotech$/i.test(brand.trim());
}

function productCod(row) {
  const candidates = [
    row.electrolux_cod,
    row.sku,
    row.model,
    row.marka_urun_kodu,
    row.gastrotech_model,
  ];
  for (const c of candidates) {
    const s = String(c || "").trim();
    if (/^\d{6}$/.test(s)) return s;
  }
  if (row.id && String(row.id).includes("__")) {
    const tail = String(row.id).split("__").pop();
    if (/^\d{6}$/.test(tail)) return tail;
  }
  return "";
}

function isElectroluxCod(cod, byCod) {
  if (!cod) return false;
  if (byCod[cod]) return true;
  if (SKYLINE_SUCCESSOR[cod]) return true;
  if (/^2177\d{2}$|^2178\d{2}$/.test(cod)) return true;
  return false;
}

function skylineDisplayName(cod, model) {
  const gas = /^21778/.test(cod);
  const size =
    {
      "217720": "6GN1/1",
      "217780": "6GN1/1",
      "217721": "6GN2/1",
      "217781": "6GN2/1",
      "217722": "10GN1/1",
      "217782": "10GN1/1",
      "217723": "10GN2/1",
      "217783": "10GN2/1",
      "217724": "20GN1/1",
      "217784": "20GN1/1",
      "217725": "20GN2/1",
      "217785": "20GN2/1",
    }[cod] || "";
  const fuel = gas ? "Gazlı" : "Elektrikli";
  const m = model ? ` ${model}` : "";
  return `SkyLine PremiumS ${fuel} Kombi Fırın${size ? ` ${size}` : ""}${m}`.trim();
}

function convertToElectrolux(row, cod, byCod, kur) {
  const successor = SKYLINE_SUCCESSOR[cod] || null;
  const priceCod = byCod[cod] ? cod : successor;
  const entry = priceCod ? byCod[priceCod] : null;
  const modelHint = SKYLINE_MODEL_HINT[cod] || entry?.model || row.electrolux_liste_model || cod;

  row.id = `${BRAND_ID}__${cod}`;
  row.brand = BRAND;
  row.oem_brand = OEM;
  row.kaynak = KAYNAK;
  row.electrolux_cod = cod;
  row.sku = cod;
  row.model = modelHint;
  row.marka_urun_kodu = cod;
  row.equsto_kod = `EQ-ELECTROL.${cod}`;
  row.marka_kodu = "ELECTROLUX";
  delete row.gastrotech_model;
  delete row.gastrotech_page;
  delete row.gastrotech_image;
  delete row.fiyat_kaynak;

  if (/^217/.test(cod)) {
    row.name = skylineDisplayName(cod, modelHint);
    row.description = row.name;
    row.aciklama = row.name;
    row.keywords = [BRAND, OEM, "SkyLine", "PremiumS", "kombi", "fırın", cod, modelHint];
    if (!row.category || /pisirme|firin/i.test(String(row.category))) {
      row.category = "kombi-firinlar";
    }
    row.urun_kategori = "Pişirme";
    row.urun_alt_kategori = "Kombi Fırınlar";
  } else if (entry?.model && /^Gastrotech/i.test(String(row.name || ""))) {
    row.name = `${BRAND} ${entry.model}`;
    row.description = row.name;
    row.aciklama = row.name;
  } else if (/^Gastrotech\s+/i.test(String(row.name || ""))) {
    row.name = String(row.name).replace(/^Gastrotech\s+/i, `${BRAND} `);
  }

  if (entry) {
    const px = pricingFromListe(cod, entry.liste_fiyati_eur, entry.model || modelHint, kur, {
      successorOf: successor && successor !== cod ? successor : null,
    });
    const specsPricing = px._specs_pricing;
    delete px._specs_pricing;
    Object.assign(row, px);
    row.specs = mergeSpecs(row.specs || row.name, specsPricing);
  } else {
    row.fiyat_kaynagi = "gastrotech-dealer-list-electrolux-cod";
    row.kaynak_fiyat_listesi = FIYAT_KAYNAK;
    row.specs = mergeSpecs(
      row.specs || row.name,
      [`Ürün kodu (COD): ${cod}`, `Model: ${modelHint}`, `Marka düzeltmesi: Gastrotech → Electrolux Professional`].join(
        "\n",
      ),
    );
  }

  if (Array.isArray(row.images)) {
    row.images = row.images.filter((img) => !/gastrotech/i.test(String(img)));
    if (!row.images.length && row.image && !/gastrotech/i.test(String(row.image))) {
      row.images = [row.image];
    }
  }
  if (row.image && /gastrotech/i.test(String(row.image))) {
    row.image = row.images?.[0] || "";
  }

  return {
    action: "converted",
    cod,
    id: row.id,
    priceCod,
    model: modelHint,
    liste: entry?.liste_fiyati_eur ?? null,
  };
}

function main() {
  const fiyat = JSON.parse(fs.readFileSync(FIYAT, "utf8"));
  const byCod = fiyat.by_cod || {};
  const kur = Number(fiyat.kur_eur_try) || 53.2979;

  /** @type {Map<string, {file:string, dept:string, row:any}>} */
  const elByCod = new Map();
  const deptFiles = {};

  for (const file of fs.readdirSync(DEPT_DIR)) {
    if (!file.endsWith(".json") || file.includes("_items")) continue;
    const full = path.join(DEPT_DIR, file);
    const rows = JSON.parse(fs.readFileSync(full, "utf8"));
    if (!Array.isArray(rows)) continue;
    deptFiles[file] = rows;
    const dept = file.replace(/\.json$/, "");
    rows.forEach((row) => {
      if (!row) return;
      const brand = String(row.brand || "");
      const kaynak = String(row.kaynak || "");
      if (!/electrolux/i.test(brand + kaynak + String(row.id || ""))) return;
      const cod = String(row.electrolux_cod || row.sku || "").trim();
      if (/^\d{6}$/.test(cod) && !elByCod.has(cod)) {
        elByCod.set(cod, { file, dept, row });
      }
    });
  }

  const report = {
    generated: new Date().toISOString(),
    dry_run: DRY,
    removed: [],
    converted: [],
    skipped: [],
  };

  for (const [file, rows] of Object.entries(deptFiles)) {
    let changed = false;
    const next = [];
    for (const row of rows) {
      if (!row || !isGastrotechMisbrand(row)) {
        next.push(row);
        continue;
      }
      const cod = productCod(row);
      if (!isElectroluxCod(cod, byCod)) {
        next.push(row);
        continue;
      }

      const existing = elByCod.get(cod);
      if (existing && existing.row !== row) {
        report.removed.push({
          id: row.id,
          cod,
          keep: existing.row.id,
          dept: file.replace(/\.json$/, ""),
        });
        changed = true;
        continue; // drop gastrotech duplicate
      }

      const info = convertToElectrolux(row, cod, byCod, kur);
      report.converted.push({ ...info, from: `gastrotech__${cod}`, dept: file.replace(/\.json$/, "") });
      elByCod.set(cod, { file, dept: file.replace(/\.json$/, ""), row });
      next.push(row);
      changed = true;
    }
    if (changed) {
      deptFiles[file] = next;
      if (!DRY) {
        fs.writeFileSync(path.join(DEPT_DIR, file), JSON.stringify(next), "utf8");
      }
    }
  }

  fs.mkdirSync(path.dirname(REPORT), { recursive: true });
  fs.writeFileSync(REPORT, JSON.stringify(report, null, 2), "utf8");
  console.log(
    `[fix-gastrotech-electrolux] removed=${report.removed.length} converted=${report.converted.length}` +
      (DRY ? " (dry-run)" : ""),
  );
  console.log(`report: ${REPORT}`);
}

main();
