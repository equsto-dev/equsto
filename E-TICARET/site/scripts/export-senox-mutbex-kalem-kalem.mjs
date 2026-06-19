#!/usr/bin/env node
/** Kalem kalem PDF vs Mutbex raporu → CSV + JSON */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEEP = path.join(ROOT, "scripts/data/senox/mutbex-karsilastirma-deep.json");
const OUT_JSON = path.join(ROOT, "scripts/data/senox/mutbex-kalem-kalem.json");
const OUT_CSV = path.join(ROOT, "scripts/data/senox/mutbex-kalem-kalem.csv");

function escCsv(v) {
  if (v == null || v === "") return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

const deep = JSON.parse(fs.readFileSync(DEEP, "utf8"));
const rows = deep.rows.map((r) => ({
  sira: 0,
  model: r.model,
  sku: r.sku,
  ad: String(r.name || "").replace(/\s+/g, " ").trim(),
  dept: r.dept,
  kaynak: r.kaynak === "senox-pdf-2026-1" ? "PDF" : "Mutbex",
  pdf_liste_eur: r.pdf_liste,
  mutbex_liste_eur: r.mut_liste,
  fark_eur:
    r.pdf_liste && r.mut_liste ? Math.round((r.mut_liste - r.pdf_liste) * 100) / 100 : null,
  fark_yuzde: r.liste_diff_pct,
  pdf_daha_ucuz:
    r.pdf_cheaper === true ? "Evet" : r.pdf_cheaper === false ? "Hayır" : "—",
  equsto_satis_eur: r.equsto_satis,
  pdf_satis_eur: r.pdf_satis,
  mutbex_satis_eur: r.mut_satis,
  satis_fark_eur:
    r.pdf_satis && r.mut_satis
      ? Math.round((r.mut_satis - r.pdf_satis) * 100) / 100
      : null,
  equsto_tl: r.equsto_tl,
  durum:
    r.pdf_liste && r.mut_liste
      ? "Her iki kaynak"
      : r.pdf_liste
        ? "Sadece PDF"
        : r.mut_liste
          ? "Sadece Mutbex"
          : "Fiyatsız",
}));

rows.sort((a, b) => {
  const rank = (x) =>
    x.pdf_liste_eur && x.mutbex_liste_eur ? 0 : x.pdf_liste_eur ? 1 : x.mutbex_liste_eur ? 2 : 3;
  const ra = rank(a);
  const rb = rank(b);
  if (ra !== rb) return ra - rb;
  return (b.fark_yuzde ?? -1) - (a.fark_yuzde ?? -1);
});
rows.forEach((r, i) => {
  r.sira = i + 1;
});

fs.writeFileSync(
  OUT_JSON,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      aciklama: "Equsto satış = liste × 50%. Mutbex liste = Mutbex satış × 2.",
      toplam: rows.length,
      her_iki_kaynak: rows.filter((r) => r.durum === "Her iki kaynak").length,
      sadece_pdf: rows.filter((r) => r.durum === "Sadece PDF").length,
      sadece_mutbex: rows.filter((r) => r.durum === "Sadece Mutbex").length,
      rows,
    },
    null,
    2,
  ),
  "utf8",
);

const cols = [
  ["sira", "Sıra"],
  ["model", "Model"],
  ["sku", "SKU"],
  ["ad", "Ürün adı"],
  ["dept", "Dept"],
  ["durum", "Durum"],
  ["kaynak", "Equsto kaynak"],
  ["pdf_liste_eur", "PDF liste EUR"],
  ["mutbex_liste_eur", "Mutbex liste EUR"],
  ["fark_eur", "Fark EUR (Mut−PDF)"],
  ["fark_yuzde", "Fark %"],
  ["pdf_daha_ucuz", "PDF daha ucuz"],
  ["equsto_satis_eur", "Equsto satış EUR"],
  ["pdf_satis_eur", "PDF satış EUR"],
  ["mutbex_satis_eur", "Mutbex satış EUR"],
  ["satis_fark_eur", "Satış fark EUR"],
  ["equsto_tl", "Equsto TL (KDV dahil)"],
];

const csvLines = [
  cols.map(([, h]) => h).join(";"),
  ...rows.map((r) => cols.map(([k]) => escCsv(r[k])).join(";")),
];
fs.writeFileSync(OUT_CSV, "\ufeff" + csvLines.join("\n"), "utf8");

console.log(`[kalem-kalem] ${rows.length} ürün`);
console.log(`  JSON → ${OUT_JSON}`);
console.log(`  CSV  → ${OUT_CSV}`);
