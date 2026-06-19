#!/usr/bin/env node
/**
 * Equsto vs Cafemarkt soğuk oda fiyat karşılaştırması
 * node veri/compare-soguk-oda-prices.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const EKIP = path.resolve(ROOT, "../../E-TICARET/site/public/data/ekipmanlar.json");

/** Cafemarkt soguk-oda PLP — 2 Haziran 2026 snapshot (KDV dahil TL) */
const CAFEMARKT = `
Öztiryakiler Soğuk Oda, Panel-Split Tip 0/+5 C, 150x150 cm|323011.99
Öztiryakiler Panel-Split Tip Deep Freeze, -22/-18 C, 600x600 cm|1530056.48
Öztiryakiler Panel-Split Tip Deep Freeze, -22/-18 C, 500x450 cm|952125.83
Öztiryakiler Panel Tipi Soğuk Oda, 150x175x240 cm|324172.99
Öztiryakiler Panel-Split Tip Soğuk Oda, 0/+5 C, 600x500 cm|961552.46
Öztiryakiler Panel-Split Tip Soğuk Oda, 0/+5 C, 450x150 cm|443922.76
Öztiryakiler Panel-Split Tip Deep Freeze, -22/-18 C, 450x150 cm|511187.09
Öztiryakiler Panel-Split Tip Deep Freeze, -22/-18 C, 450x250 cm|623358.32
Öztiryakiler Panel-Split Tip Deep Freeze, -22/-18 C, 600x500 cm|1317510.17
Öztiryakiler Panel-Split Tip Deep Freeze, -22/-18 C, 600x550 cm|1477239.69
Öztiryakiler Panel Tipi Soğuk Oda, 200x225x240 cm|375118.57
Öztiryakiler Panel-Split Tip Deep Freeze, -22/-18 C, 600x450 cm|1040232.79
Öztiryakiler Panel-Split Tip Deep Freeze, -22/-18 C, 500x350 cm|846894.23
Öztiryakiler Panel-Split Tip Soğuk Oda, 0/+5 C, 350x350 cm|568670.33
Öztiryakiler Deep Freezer, 150x175x240 cm|373294.89
Öztiryakiler Panel-Split Tip Deep Freeze, -22/-18 C, 250x200 cm|463462.49
Öztiryakiler Panel-Split Tip Deep Freeze, -22/-18 C, 500x250 cm|754619.12
Öztiryakiler Panel-Split Tip Soğuk Oda, 0/+5 C, 350x150 cm|397192.83
Öztiryakiler Panel-Split Tip Deep Freeze, -22/-18 C, 450x200 cm|583638.65
Öztiryakiler Panel-Split Tip Deep Freeze, -22/-18 C, 500x400 cm|881616.11
Öztiryakiler Panel-Split Tip Deep Freeze, -22/-18 C, 600x400 cm|987084.66
Öztiryakiler Panel-Split Tip Deep Freeze, -22/-18 C, 600x300 cm|852673.50
Öztiryakiler Panel-Split Tip Deep Freeze, -22/-18 C, 400x400 cm|765567.64
Öztiryakiler Panel-Split Tip Soğuk Oda, 0/+5 C, 200x200 cm|364105.20
Öztiryakiler Panel-Split Tip Deep Freeze, -22/-18 C, 450x350 cm|784461.37
Öztiryakiler Panel-Split Tip Deep Freeze, -22/-18 C, 450x400 cm|832825.55
Öztiryakiler Panel-Split Tip Deep Freeze, -22/-18 C, 150x150 cm|372110.78
Öztiryakiler Panel-Split Tip Deep Freeze, -22/-18 C, 450x300 cm|744694.82
Öztiryakiler Deep Freezer, 200x225x240 cm|450577.92
Öztiryakiler Panel-Split Tip Deep Freeze, -22/-18 C, 500x500 cm|998263.70
Öztiryakiler Panel-Split Tip Deep Freeze, -22/-18 C, 450x450 cm|861555.61
Öztiryakiler Panel-Split Tip Deep Freeze, -22/-18 C, 500x300 cm|800756.35
Öztiryakiler Panel-Split Tip Soğuk Oda, 0/+5 C, 600x600 cm|1085565.42
Öztiryakiler Panel-Split Tip Soğuk Oda, 0/+5 C, 250x200 cm|386321.38
Öztiryakiler Panel-Split Tip Soğuk Oda, 0/+5 C, 400x250 cm|514763.82
Öztiryakiler Panel-Split Tip Deep Freeze, -22/-18 C, 200x200 cm|437859.66
Öztiryakiler Panel-Split Tip Soğuk Oda, 0/+5 C, 300x200 cm|422109.21
Öztiryakiler Panel-Split Tip Deep Freeze, -22/-18 C, 400x300 cm|729110.69
Öztiryakiler Panel-Split Tip Soğuk Oda, 0/+5 C, 400x300 cm|568125.15
Öztiryakiler Panel-Split Tip Deep Freeze, -22/-18 C, 300x300 cm|584538.93
Öztiryakiler Panel-Split Tip Soğuk Oda, 0/+5 C, 300x150 cm|379381.75
Öztiryakiler Panel Tipi Soğuk Oda, 250x175x240 cm|384852.80
Öztiryakiler Deep Freezer, 300x175x240 cm|476536.49
Öztiryakiler Panel-Split Tip Soğuk Oda, 0/+5 C, 200x150 cm|334925.65
Öztiryakiler Panel-Split Tip Deep Freeze, -22/-18 C, 200x150 cm|385824.36
Öztiryakiler Panel-Split Tip Deep Freeze, -22/-18 C, 250x250 cm|504436.90
Öztiryakiler Panel-Split Tip Deep Freeze, -22/-18 C, 350x150 cm|475115.43
Öztiryakiler Deep Freezer, 250x175x240 cm|461923.28
Öztiryakiler Panel-Split Tip Deep Freeze, -22/-18 C, 400x150 cm|497402.88
Öztiryakiler Panel-Split Tip Deep Freeze, -22/-18 C, 350x300 cm|613860.40
Öztiryakiler Panel-Split Tip Deep Freeze, -22/-18 C, 300x200 cm|486792.14
Öztiryakiler Panel-Split Tip Deep Freeze, -22/-18 C, 400x350 cm|768616.53
Öztiryakiler Panel-Split Tip Deep Freeze, -22/-18 C, 300x150 cm|454770.46
Öztiryakiler Panel-Split Tip Deep Freeze, -22/-18 C, 400x200 cm|568954.15
Öztiryakiler Panel-Split Tip Soğuk Oda, 0/+5 C, 500x300 cm|673664.33
Öztiryakiler Panel-Split Tip Soğuk Oda, 0/+5 C, 600x550 cm|1007547.78
Öztiryakiler Panel-Split Tip Soğuk Oda, 0/+5 C, 350x250 cm|487691.78
Öztiryakiler Panel-Split Tip Soğuk Oda, 0/+5 C, 450x350 cm|658742.89
Öztiryakiler Panel-Split Tip Soğuk Oda, 0/+5 C, 450x300 cm|581886.24
Öztiryakiler Panel-Split Tip Soğuk Oda, 0/+5 C, 600x300 cm|720157.31
Öztiryakiler Panel-Split Tip Deep Freeze, -22/-18 C, 350x250 cm|578001.93
Öztiryakiler Panel-Split Tip Soğuk Oda, 0/+5 C, 450x450 cm|739128.74
Öztiryakiler Panel-Split Tip Deep Freeze, -22/-18 C, 400x250 cm|608436.87
Öztiryakiler Panel-Split Tip Soğuk Oda, 0/+5 C, 400x400 cm|679064.74
`.trim();

function norm(s) {
  return s
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/\s+/g, " ")
    .trim();
}

function matchKey(name) {
  const n = norm(name);
  const dims = [...name.matchAll(/(\d{2,4})\s*[x×*]\s*(\d{2,4})(?:\s*[x×*]\s*(\d{2,4}))?/gi)].map((m) =>
    [m[1], m[2], m[3]].filter(Boolean).join("x")
  );
  if (/deep freezer/.test(n) && dims[0]?.endsWith("x240")) {
    return `df-panel:${dims[0]}`;
  }
  if (/panel tipi soğuk|panel tipi soguk|cold room/.test(n) && dims[0]?.endsWith("x240")) {
    return `cr-panel:${dims[0]}`;
  }
  if (/deep freeze/.test(n) && dims[0] && !dims[0].includes("240")) {
    return `df-split:${dims[0]}`;
  }
  if (/panel-split tip soğuk|panel-split tip soguk|soğuk oda, panel-split|soguk oda, panel-split/.test(n)) {
    return `cr-split:${dims[0]}`;
  }
  return `other:${n.slice(0, 40)}`;
}

function equstoKey(p) {
  const sku = p.sku || "";
  const m = sku.match(/7919\.(CR|DF)(\d{2})(\d{2})/);
  if (!m) return null;
  const [, kind, w, d] = m;
  const W = +w * 10;
  const D = +d * 10;
  const name = norm(p.name);
  if (kind === "CR") {
    if (/cold room/.test(name)) {
      const h = d === "17" ? "175" : d === "22" ? "225" : String(D);
      return `cr-panel:${W}x${h}x240`;
    }
    return `cr-split:${W}x${D}`;
  }
  if (kind === "DF") {
    if (/deep freezer/.test(name)) {
      const h = d === "17" ? "175" : d === "22" ? "225" : String(D);
      return `df-panel:${W}x${h}x240`;
    }
    return `df-split:${W}x${D}`;
  }
  return null;
}

function fmt(n) {
  return Math.round(n).toLocaleString("tr-TR");
}

function pct(a, b) {
  return ((a - b) / b) * 100;
}

const cafeMap = new Map();
for (const line of CAFEMARKT.split("\n")) {
  const [name, priceStr] = line.split("|");
  const key = matchKey(name);
  cafeMap.set(key, { name: name.trim(), price: parseFloat(priceStr) });
}

const data = JSON.parse(fs.readFileSync(EKIP, "utf8"));
const equsto = data.filter((p) => /7919\.(CR|DF)/.test(p.sku || ""));

const rows = [];
const unmatchedEqusto = [];
const unmatchedCafe = new Set(cafeMap.keys());

for (const p of equsto) {
  const key = equstoKey(p);
  const cafe = key ? cafeMap.get(key) : null;
  if (!key || !cafe) {
    unmatchedEqusto.push({ sku: p.sku, name: p.name, key });
    continue;
  }
  unmatchedCafe.delete(key);
  const eq = p.fiyat_tl;
  const cm = cafe.price;
  const diff = eq - cm;
  const diffPct = pct(eq, cm);
  rows.push({
    key,
    sku: p.sku,
    name: cafe.name,
    equsto: eq,
    cafemarkt: cm,
    diff,
    diffPct,
    cheaper: diff < 0 ? "Equsto" : diff > 0 ? "Cafemarkt" : "Eşit",
  });
}

rows.sort((a, b) => a.diffPct - b.diffPct);

const avgPct = rows.reduce((s, r) => s + r.diffPct, 0) / rows.length;
const equstoCheaper = rows.filter((r) => r.diff < 0).length;
const cafeCheaper = rows.filter((r) => r.diff > 0).length;
const byType = {};
for (const r of rows) {
  const t = r.key.split(":")[0];
  if (!byType[t]) byType[t] = { n: 0, sumPct: 0 };
  byType[t].n++;
  byType[t].sumPct += r.diffPct;
}

const report = {
  date: "2026-06-02",
  equstoSource: "ekipmanlar.json (Öztiryakiler 2025, bayi net +8%, KDV dahil)",
  cafemarktSource: "cafemarkt.com/soguk-oda PLP (KDV dahil)",
  equstoTotal: equsto.length,
  cafemarktInSnapshot: cafeMap.size,
  matched: rows.length,
  unmatchedEqusto: unmatchedEqusto.length,
  unmatchedCafemarkt: unmatchedCafe.size,
  summary: {
    avgEqustoVsCafePct: avgPct,
    equstoCheaperCount: equstoCheaper,
    cafeCheaperCount: cafeCheaper,
    avgSavingsWhenEqustoCheaper:
      rows.filter((r) => r.diff < 0).reduce((s, r) => s + -r.diffPct, 0) /
        Math.max(1, equstoCheaper),
  },
  byType: Object.fromEntries(
    Object.entries(byType).map(([k, v]) => [k, { count: v.n, avgDiffPct: v.sumPct / v.n }])
  ),
  rows,
  unmatchedEqusto,
  unmatchedCafeKeys: [...unmatchedCafe],
};

const outJson = path.join(ROOT, "soguk-oda-fiyat-karsilastirma.json");
fs.writeFileSync(outJson, JSON.stringify(report, null, 2));

console.log("=== SOĞUK ODA FİYAT KARŞILAŞTIRMA ===");
console.log(`Eşleşen: ${rows.length} / Equsto ${equsto.length}, Cafemarkt ${cafeMap.size}`);
console.log(`Ort. fark (Equsto vs Cafemarkt): %${avgPct.toFixed(1)}`);
console.log(`Equsto ucuz: ${equstoCheaper} | Cafemarkt ucuz: ${cafeCheaper}`);
console.log("\n--- Tip bazında ort. fark % ---");
for (const [t, v] of Object.entries(report.byType)) {
  console.log(`  ${t}: ${v.count} ürün, ort %${v.avgDiffPct.toFixed(1)}`);
}
console.log("\n--- En ucuz 5 Equsto avantajı ---");
for (const r of rows.slice(0, 5)) {
  console.log(`  ${r.sku} ${fmt(r.equsto)} vs ${fmt(r.cafemarkt)} (${r.diffPct.toFixed(1)}%)`);
}
console.log("\n--- En pahalı 5 Equsto (Cafemarkt daha ucuz) ---");
for (const r of rows.slice(-5).reverse()) {
  console.log(`  ${r.sku} ${fmt(r.equsto)} vs ${fmt(r.cafemarkt)} (+${r.diffPct.toFixed(1)}%)`);
}
console.log(`\nJSON: ${outJson}`);
