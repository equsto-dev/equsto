/**
 * YÜKSEL İTHAL 2025 → yalnızca Robot Coupe fiyatları (%35 iskonto = satış liste×0,65)
 *
 *   node scripts/import-yuksel-ithal-2025-pdf.py "c:\D Disk\FİYAT LİSTELERİ\YÜKSEL İTHAL - 2025.pdf" --no-ocr
 *   node scripts/update-robot-coupe-yuksel.mjs
 */
import { readFileSync, writeFileSync, copyFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { fetchTcmbEurRate } from "./fetch-tcmb-kur.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const EKIPMANLAR = join(root, "public", "data", "ekipmanlar.json");
const YUKSEL_SRC = join(
  root,
  "..",
  "..",
  "EQUSTO-WORK",
  "public",
  "data",
  "fiyat-listeleri",
  "yuksel",
  "2025-ithal",
  "tum-urunler.json"
);

const ISKONTO = 0.35;
const NET_MULT = 1 - ISKONTO;
const KDV = 20;
const LISTE = "YÜKSEL İTHAL - 2025";
const KAYNAK = "yuksel-2025-ithal-pdf";

/** Öztiryakiler SKU → Yüksel PDF referans */
const SKU_TO_YUKSEL_REF = {
  "9860.MP160.VV": "34740",
  "9860.MP190.VV": "34750",
  "9860.MP190.C0": "34770",
  "9860.MP240.VV": "34760",
  "9860.MP250.C0": "34300B",
  "9810.MP350.U0": "34800L",
  "9810.MP350.CU": "34860L",
  "9810.MP450.UL": "34810L",
  "9860.MP450.C0": "34870L",
  "9860.MP550.A0": "34820LH",
  "9860.MP600.A0": "34830LH",
  "9810.MP800.UL": "34890L",
  "9840.CL50D.00": "24440",
  "9840.CL52D.00": "24490",
  "9840.CL55D.00": "2245",
  "9840.CL60D.00": "2325F",
  "9840.R201E.00": "2129D",
  "9840.R301C.00": "2525",
  "9860.000R2.00": "22100D",
  "9860.000R5.00": "24608M",
  "9860.00J80.00": "56000B",
};

/** PDF'de ref parse edilemeyen satırlar (34820LH / 34830LH) */
const MANUAL_LISTE_EUR = {
  "34820LH": 1223.3,
  "34830LH": 1533.0,
};

function fmtTry(n) {
  const parts = n.toFixed(2).split(".");
  const int = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${int},${parts[1]}`;
}

function normRef(s) {
  return String(s || "")
    .toUpperCase()
    .replace(/\s+/g, "");
}

function buildSpecs(p, listEur, netEur, yukselRef, eurTry) {
  const lines = [
    p.name,
    "",
    `Kaynak: ${LISTE}`,
    `Yüksel referans: ${yukselRef}`,
    p.sku ? `Distribütör kodu: ${p.sku}` : "",
    `Liste fiyatı (EUR): ${listEur}`,
    `Equsto satış (%${Math.round(ISKONTO * 100)} iskonto, EUR): ${netEur.toFixed(2)}`,
    `Formül: liste × ${NET_MULT} (liste fiyatının %65'i)`,
    `Kur: 1 EUR = ${eurTry} TRY (KDV %${KDV})`,
  ];
  if (p.aciklama) lines.push("", p.aciklama.split("\n")[0]);
  return lines.filter(Boolean).join("\n");
}

async function main() {
  if (!existsSync(YUKSEL_SRC)) {
    console.error("Önce PDF import:", YUKSEL_SRC);
    process.exit(1);
  }

  const yuksel = JSON.parse(readFileSync(YUKSEL_SRC, "utf8"));
  const byRef = new Map();
  for (const row of yuksel) {
    byRef.set(normRef(row.sku || row.model), row);
  }

  const kur = await fetchTcmbEurRate();
  const EUR_TRY = kur.rate;
  console.log(`[robot-coupe-yuksel] EUR/TRY=${EUR_TRY}${kur.fallback ? " (fallback)" : ""}`);

  const catalog = JSON.parse(readFileSync(EKIPMANLAR, "utf8"));
  const backup = join(root, "public", "data", `ekipmanlar.backup-robot-coupe-yuksel-${Date.now()}.json`);
  copyFileSync(EKIPMANLAR, backup);
  console.log("[robot-coupe-yuksel] Yedek:", backup);

  let updated = 0;
  const missing = [];
  const skipped = [];

  for (let i = 0; i < catalog.length; i++) {
    const p = catalog[i];
    if (!/robot coupe/i.test(`${p.brand || ""} ${p.name || ""}`)) continue;

    const sku = String(p.sku || p.model || "").trim();
    const yRef = SKU_TO_YUKSEL_REF[sku];
    if (!yRef) {
      skipped.push(sku || p.name);
      continue;
    }

    const src = byRef.get(normRef(yRef));
    let listEur = src ? Number(src.fiyat_euro) : NaN;
    if (!(listEur > 0) && MANUAL_LISTE_EUR[yRef] != null) {
      listEur = MANUAL_LISTE_EUR[yRef];
    }
    if (!(listEur > 0)) {
      missing.push(`${sku} → ref ${yRef}${src ? " (fiyat yok)" : ""}`);
      continue;
    }

    const netEur = Math.round(listEur * NET_MULT * 100) / 100;
    const netTl = Math.round(netEur * EUR_TRY);
    const kdvDahil = Math.round(netTl * (1 + KDV / 100));

    catalog[i] = {
      ...p,
      liste_fiyati_eur: listEur,
      satis_eur_indirimli: netEur,
      satis_eur_net: netEur,
      iskonto_oran: Math.round(ISKONTO * 100),
      bayi_iskonto: undefined,
      kar_marji: undefined,
      satis_fiyati_eur: undefined,
      kaynak_fiyat_listesi: KAYNAK,
      fiyat_kaynagi: KAYNAK,
      yuksel_ref: yRef,
      fiyat_tl: kdvDahil,
      fiyat_tl_net: netTl,
      price: `₺${fmtTry(kdvDahil)} KDV dahil`,
      specs: buildSpecs(p, listEur, netEur, yRef, EUR_TRY),
    };
    updated++;
    console.log(
      `[ok] ${sku} ref=${yRef} liste=${listEur} EUR → satış=${netEur} EUR (₺${kdvDahil} KDV dahil)`
    );
  }

  writeFileSync(EKIPMANLAR, JSON.stringify(catalog));

  const deptDir = join(root, "public", "data", "dept");
  const bySku = new Map(catalog.filter((p) => p.sku).map((p) => [p.sku, p]));
  let deptTotal = 0;
  for (const file of readdirSync(deptDir).filter((f) => f.endsWith(".json"))) {
    const deptPath = join(deptDir, file);
    const rows = JSON.parse(readFileSync(deptPath, "utf8"));
    let n = 0;
    const out = rows.map((p) => {
      if (!/robot coupe/i.test(p.name || "")) return p;
      const fresh = bySku.get(p.sku);
      if (fresh) {
        n++;
        return fresh;
      }
      return p;
    });
    if (n) {
      writeFileSync(deptPath, JSON.stringify(out));
      deptTotal += n;
      console.log(`[robot-coupe-yuksel] ${file}: ${n} satır`);
    }
  }
  console.log(`[robot-coupe-yuksel] dept toplam: ${deptTotal}`);

  console.log(`\n[robot-coupe-yuksel] Güncellenen: ${updated}`);
  if (skipped.length) {
    console.log("[robot-coupe-yuksel] Eşleme yok (atlandı):", skipped.join(", "));
  }
  if (missing.length) {
    console.warn("[robot-coupe-yuksel] PDF'de bulunamadı:", missing.join("; "));
  }

  console.log("[robot-coupe-yuksel] Bitti.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
