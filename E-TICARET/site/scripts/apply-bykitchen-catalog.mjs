/**
 * BYKITCHEN 2027 katalog → Equsto dept güncelle / ekle.
 *
 * Fiyat: liste × 0.55 (%45 iskonto) → TCMB USD/EUR → +KDV %20
 * (Kullanıcı: "%55 iskonto var; satışa %45 iskonto + KDV yaz")
 *
 *   node scripts/apply-bykitchen-catalog.mjs --dry-run
 *   node scripts/apply-bykitchen-catalog.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchTcmbEurUsdRates } from "./fetch-tcmb-kur.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = path.join(ROOT, "scripts/data/bykitchen/bykitchen-catalog-extracted.json");
const DEPT_DIR = path.join(ROOT, "public/data/dept");
const REPORT = path.join(ROOT, "scripts/data/bykitchen/bykitchen-apply-report.json");
const REPORT_MD = path.join(ROOT, "scripts/data/bykitchen/bykitchen-apply-report.md");

const KDV = 20;
const SATIS_ORAN = 0.55; // %45 iskonto
const DRY = process.argv.includes("--dry-run");

function norm(s) {
  return String(s || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

/** Katalog modeli → sitedeki alternatif norm'lar (renk/SKU varyantları) */
const MODEL_ALIASES = {
  VORTEXS: ["VORTEX00", "VORTEX", "VORTEXS"],
  SILENCER: ["SILENCER00", "SILENCER"],
  SILENCERPRO: [
    "SILENCERPRO",
    "SILENCERPROGR",
    "SILENCERPROKHZ",
    "SILENCERPROWH",
    "SILENCERPROBHZ",
  ],
};

function fmtTry(n) {
  return `₺${Math.round(Number(n)).toLocaleString("tr-TR")},00`;
}

function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}

function slugId(model) {
  const m = String(model)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `by-kitchen__${m}`;
}

function skuFromModel(model) {
  // DBM-01 → DBM.01 (mevcut stil)
  return String(model)
    .toUpperCase()
    .replace(/-/g, ".")
    .replace(/\s+/g, ".");
}

function computePrice(item, rates) {
  const liste = Number(item.liste_fiyat);
  const currency = item.currency || "USD";
  const satisFx = round2(liste * SATIS_ORAN);
  const kur = currency === "EUR" ? rates.eurTry : rates.usdTry;
  const netTl = Math.round(satisFx * kur);
  const kdvDahil = Math.round(netTl * (1 + KDV / 100));
  return {
    liste,
    currency,
    satis_fx: satisFx,
    kur,
    satis_tl_net: netTl,
    fiyat_tl: kdvDahil,
    price: `${fmtTry(kdvDahil)} KDV dahil`,
    havale_tl: Math.round(kdvDahil * 0.98),
  };
}

function isByKitchenRow(r) {
  const brand = String(r.brand || "")
    .toLowerCase()
    .replace(/\s+/g, "");
  const mk = String(r.marka_kodu || "").toUpperCase();
  return (
    brand === "bykitchen" ||
    brand === "by-kitchen" ||
    mk === "BYKITCHEN" ||
    String(r.id || "").startsWith("by-kitchen__")
  );
}

function loadDept() {
  /** @type {Map<string, {file:string, index:number, row:any}>} */
  const byNorm = new Map();
  const files = {};
  for (const f of fs.readdirSync(DEPT_DIR).filter((x) => x.endsWith(".json"))) {
    const rows = JSON.parse(fs.readFileSync(path.join(DEPT_DIR, f), "utf8"));
    if (!Array.isArray(rows)) continue;
    files[f] = rows;
    rows.forEach((row, index) => {
      if (!isByKitchenRow(row)) return;
      for (const key of [row.sku, row.model, row.marka_urun_kodu, row.id]) {
        if (!key) continue;
        const n = norm(String(key).replace(/^by-kitchen__/, ""));
        if (n && !byNorm.has(n)) byNorm.set(n, { file: f, index, row });
      }
    });
  }
  return { files, byNorm };
}

function guessDeptFile(item) {
  const name = `${item.name_tr || ""} ${item.model || ""}`.toLowerCase();
  if (/buz|soğuk|dolap|teşhir|şarap|dondurucu|freezer|ice/.test(name)) return "sogutma.json";
  if (/bulaşık|yika|rinser|duş|hortum|djr|ddb/.test(name)) return "yikama.json";
  if (/kahve|espresso|tamper|filtre|değirmen|degirmen/.test(name)) return "kahve.json";
  if (/ocak|fırın|fritöz|ızgara|pişir|dog|roller|çikolata/.test(name)) return "pisirme.json";
  return "hazirlik.json";
}

function buildSpecs(item, px) {
  const lines = [
    item.name_tr || `By Kitchen ${item.model}`,
    "",
    `Ürün kodu: ${item.model}`,
    `Liste fiyatı (${px.currency}): ${px.liste}`,
    `%45 iskonto → satış ${px.currency}: ${px.satis_fx}`,
    `Kur (${px.currency}/TRY): ${px.kur}`,
    `Equsto satış (KDV hariç): ${fmtTry(px.satis_tl_net)}`,
    `Equsto satış (KDV dahil): ${fmtTry(px.fiyat_tl)}`,
    `Havale / EFT: %2 indirim → ${fmtTry(px.havale_tl)}`,
    `Kaynak: BYKITCHEN 2027 katalog s.${item.page}`,
  ];
  return lines.join("\n");
}

function makeNewRow(item, px) {
  const sku = skuFromModel(item.model);
  const id = slugId(item.model);
  return {
    id,
    equsto_kod: `EQ-BYKITCHEN.${sku}`,
    marka_kodu: "BYKITCHEN",
    brand: "By Kitchen",
    name: item.name_tr || `By Kitchen ${item.model}`,
    sku,
    model: sku,
    marka_urun_kodu: sku,
    price: px.price,
    fiyat_tl: px.fiyat_tl,
    fiyat_havale_tl: px.havale_tl,
    images: [],
    image: "",
    specs: buildSpecs(item, px),
    fiyat_kaynak: "bykitchen-2027-catalog",
    kaynak_fiyat_listesi: "BYKITCHEN 2027",
    bykitchen_liste: px.liste,
    bykitchen_currency: px.currency,
    bykitchen_page: item.page,
    bykitchen_satis_oran: SATIS_ORAN,
  };
}

async function main() {
  if (!fs.existsSync(CATALOG)) {
    console.error("Önce extract çalıştır:", CATALOG);
    process.exit(1);
  }
  const catalog = JSON.parse(fs.readFileSync(CATALOG, "utf8"));
  const rates = await fetchTcmbEurUsdRates();
  console.log("[bykitchen-apply] kur", rates);

  const { files, byNorm } = loadDept();
  /** @type {Set<string>} */
  const dirtyFiles = new Set();
  const report = {
    at: new Date().toISOString(),
    dry: DRY,
    rates,
    pricing: "liste × 0.55 + KDV %20",
    catalog_count: catalog.products.length,
    updated: [],
    added: [],
    unchanged: [],
    locked_skip: [],
    unmatched_site: [],
    suspicious: [],
  };

  const catalogNorms = new Set();

  function findHits(key) {
    const aliases = MODEL_ALIASES[key] || [key];
    const seen = new Set();
    const hits = [];
    for (const a of aliases) {
      const h = byNorm.get(a);
      if (h && !seen.has(h.row.id)) {
        seen.add(h.row.id);
        hits.push(h);
      }
    }
    // Silencer Pro: tüm renk varyantlarını da güncelle
    if (key === "SILENCERPRO") {
      for (const [n, h] of byNorm) {
        if (n.startsWith("SILENCERPRO") && !seen.has(h.row.id)) {
          seen.add(h.row.id);
          hits.push(h);
        }
      }
    }
    return hits;
  }

  function applyToRow(row, item, px, file) {
    if (row.fiyat_kilit) {
      report.locked_skip.push({
        id: row.id,
        model: item.model,
        mevcut: row.fiyat_tl,
        katalog: px.fiyat_tl,
      });
      return;
    }
    const old = Number(row.fiyat_tl) || 0;
    const delta = px.fiyat_tl - old;
    if (Math.abs(delta) < 1) {
      report.unchanged.push({ id: row.id, model: item.model, fiyat_tl: old });
      return;
    }
    if (!DRY) {
      row.fiyat_tl = px.fiyat_tl;
      row.price = px.price;
      row.fiyat_havale_tl = px.havale_tl;
      row.fiyat_kaynak = "bykitchen-2027-catalog";
      row.kaynak_fiyat_listesi = "BYKITCHEN 2027";
      row.bykitchen_liste = px.liste;
      row.bykitchen_currency = px.currency;
      row.bykitchen_page = item.page;
      row.bykitchen_satis_oran = SATIS_ORAN;
      const head = String(row.specs || "").split("\n")[0] || row.name;
      row.specs = buildSpecs({ ...item, name_tr: head }, px);
      if (file) dirtyFiles.add(file);
    }
    report.updated.push({
      id: row.id,
      model: item.model,
      page: item.page,
      liste: px.liste,
      currency: px.currency,
      old_tl: old,
      new_tl: px.fiyat_tl,
      delta,
    });
  }

  for (const item of catalog.products) {
    if (item.liste_fiyat > 50000) {
      report.suspicious.push({ ...item, reason: "liste>50000" });
      continue;
    }
    if (/CHIPS|HRC-|GREY-BLACK|JP\.CPC/i.test(item.model)) {
      report.suspicious.push({ ...item, reason: "model-şüpheli" });
      continue;
    }

    const key = norm(item.model);
    catalogNorms.add(key);
    for (const a of MODEL_ALIASES[key] || []) catalogNorms.add(a);

    const px = computePrice(item, rates);
    const hits = findHits(key);

    if (hits.length) {
      for (const hit of hits) applyToRow(hit.row, item, px, hit.file);
    } else {
      const deptFile = guessDeptFile(item);
      const row = makeNewRow(item, px);
      if (!DRY) {
        if (!files[deptFile]) files[deptFile] = [];
        files[deptFile].push(row);
        byNorm.set(key, { file: deptFile, index: files[deptFile].length - 1, row });
        dirtyFiles.add(deptFile);
      }
      report.added.push({
        id: row.id,
        model: item.model,
        page: item.page,
        liste: px.liste,
        currency: px.currency,
        fiyat_tl: px.fiyat_tl,
        dept: deptFile,
        name: row.name,
      });
    }
  }

  // sitede olup katalogda olmayan
  for (const [n, hit] of byNorm) {
    if (!catalogNorms.has(n)) {
      report.unmatched_site.push({
        id: hit.row.id,
        sku: hit.row.sku,
        fiyat_tl: hit.row.fiyat_tl,
        kaynak: hit.row.fiyat_kaynak || hit.row.kaynak_fiyat_listesi,
      });
    }
  }

  if (!DRY) {
    for (const f of dirtyFiles) {
      const rows = files[f];
      if (!rows) continue;
      const abs = path.join(DEPT_DIR, f);
      fs.writeFileSync(abs, JSON.stringify(rows, null, 2) + "\n", "utf8");
    }
    console.log(`[bykitchen-apply] yazılan dept: ${[...dirtyFiles].join(", ")}`);
  }

  fs.mkdirSync(path.dirname(REPORT), { recursive: true });
  fs.writeFileSync(REPORT, JSON.stringify(report, null, 2), "utf8");

  const md = [];
  md.push(`# BYKITCHEN 2027 apply ${DRY ? "(DRY-RUN)" : ""}`);
  md.push("");
  md.push(`- Kur USD: **${rates.usdTry}** | EUR: **${rates.eurTry}**`);
  md.push(`- Formül: liste × **0.55** (%45 iskonto) + KDV %20`);
  md.push(`- Katalog: **${report.catalog_count}** | Güncellenen: **${report.updated.length}** | Yeni: **${report.added.length}** | Aynı: **${report.unchanged.length}**`);
  md.push(`- Kilitli atlanan: **${report.locked_skip.length}** | Sitede olup katalogda yok: **${report.unmatched_site.length}** | Şüpheli atlanan: **${report.suspicious.length}**`);
  md.push("");
  md.push("## Fiyatı değişen (ilk 40)");
  for (const u of report.updated.slice(0, 40)) {
    md.push(
      `- \`${u.id}\` ${u.model} s.${u.page}: ₺${u.old_tl.toLocaleString("tr-TR")} → **₺${u.new_tl.toLocaleString("tr-TR")}** (Δ ${u.delta >= 0 ? "+" : ""}${u.delta}, liste ${u.liste} ${u.currency})`,
    );
  }
  md.push("");
  md.push("## Yeni ürünler");
  for (const a of report.added) {
    md.push(
      `- \`${a.id}\` ${a.model} s.${a.page}: **₺${a.fiyat_tl.toLocaleString("tr-TR")}** (${a.liste} ${a.currency}) — ${a.name} → ${a.dept}`,
    );
  }
  if (report.locked_skip.length) {
    md.push("");
    md.push("## Kilitli (dokunulmadı)");
    for (const x of report.locked_skip) {
      md.push(`- \`${x.id}\` mevcut ₺${x.mevcut} / katalog ₺${x.katalog}`);
    }
  }
  fs.writeFileSync(REPORT_MD, md.join("\n") + "\n", "utf8");

  console.log(md.slice(0, 12).join("\n"));
  console.log(`\n[bykitchen-apply] report → ${REPORT_MD}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
