#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(
  fs.readFileSync(path.join(ROOT, "scripts/data/senox/mutbex-kalem-kalem.json"), "utf8"),
);

function fmt(n) {
  if (n == null || n === "") return "—";
  return typeof n === "number" ? n.toLocaleString("tr-TR") : String(n);
}

function rowLine(r) {
  return `| ${r.sira} | ${r.model} | ${r.pdf_liste_eur ?? "—"} | ${r.mutbex_liste_eur ?? "—"} | ${fmt(r.fark_eur)} | ${r.fark_yuzde != null ? r.fark_yuzde + "%" : "—"} | ${r.equsto_satis_eur} | ${fmt(r.equsto_tl)} | ${r.kaynak} | ${r.durum} |`;
}

const hdr =
  "| # | Model | PDF liste | Mutbex liste | Fark EUR | Fark % | Equsto satış | TL | Kaynak | Durum |\n|---:|---|---:|---:|---:|---:|---:|---:|---|---|";

const both = data.rows.filter((r) => r.durum === "Her iki kaynak");
const mutOnly = data.rows.filter((r) => r.durum === "Sadece Mutbex");
const pdfOnly = data.rows.filter((r) => r.durum === "Sadece PDF");

let md = `# Şenox — Kalem Kalem PDF vs Mutbex Raporu

Oluşturulma: ${data.generatedAt}  
Equsto satış = liste × **50%** · Mutbex liste = Mutbex satış × 2 · Fark = Mutbex liste − PDF liste

## Özet

| Metrik | Adet |
|---|---:|
| Toplam ürün | ${data.toplam} |
| Her iki kaynakta fiyat | ${data.her_iki_kaynak} |
| Sadece Mutbex | ${data.sadece_mutbex} |
| Sadece PDF | ${data.sadece_pdf} |

---

## A) Her iki kaynakta fiyat var (${both.length} ürün)

${hdr}
${both.map(rowLine).join("\n")}

---

## B) Sadece Mutbex — PDF eşleşmesi yok (${mutOnly.length} ürün)

| # | Model | Mutbex liste | Equsto satış | TL | Dept |
|---:|---|---:|---:|---:|---|
${mutOnly.map((r) => `| ${r.sira} | ${r.model} | ${fmt(r.mutbex_liste_eur)} | ${r.equsto_satis_eur} | ${fmt(r.equsto_tl)} | ${r.dept} |`).join("\n")}

---

## C) Sadece PDF (${pdfOnly.length} ürün)

| # | Model | PDF liste | Equsto satış | TL |
|---:|---|---:|---:|---:|
${pdfOnly.map((r) => `| ${r.sira} | ${r.model} | ${fmt(r.pdf_liste_eur)} | ${r.equsto_satis_eur} | ${fmt(r.equsto_tl)} |`).join("\n")}
`;

const html = `<!DOCTYPE html>
<html lang="tr"><head><meta charset="utf-8"><title>Senox Kalem Kalem Rapor</title>
<style>
body{font-family:system-ui,sans-serif;margin:24px;font-size:13px}
h1{font-size:20px} h2{font-size:16px;margin-top:32px}
input{width:100%;max-width:420px;padding:8px;margin:12px 0}
table{border-collapse:collapse;width:100%;margin-bottom:24px}
th,td{border:1px solid #ccc;padding:6px 8px;text-align:left}
th{background:#f4f4f4;position:sticky;top:0}
.num{text-align:right;font-variant-numeric:tabular-nums}
.mut-only{background:#fff8e6}
.pdf-win{color:#0a6}
</style></head><body>
<h1>Şenox — Kalem Kalem PDF vs Mutbex</h1>
<p>214 ürün · Equsto satış = liste × 50% · ${data.generatedAt.slice(0, 19)}</p>
<input id="q" placeholder="Model veya SKU ara..." oninput="filterRows()">
<table id="t"><thead><tr>
<th>#</th><th>Model</th><th>SKU</th><th>Dept</th><th>Durum</th><th>Kaynak</th>
<th class="num">PDF liste</th><th class="num">Mut liste</th><th class="num">Fark EUR</th><th class="num">Fark %</th>
<th class="num">Equsto satış</th><th class="num">TL</th>
</tr></thead><tbody>
${data.rows
  .map(
    (r) => `<tr class="${r.durum === "Sadece Mutbex" ? "mut-only" : ""}" data-q="${r.model} ${r.sku}">
<td>${r.sira}</td><td>${r.model}</td><td>${r.sku}</td><td>${r.dept}</td><td>${r.durum}</td><td>${r.kaynak}</td>
<td class="num">${fmt(r.pdf_liste_eur)}</td><td class="num">${fmt(r.mutbex_liste_eur)}</td>
<td class="num">${fmt(r.fark_eur)}</td><td class="num">${r.fark_yuzde != null ? r.fark_yuzde + "%" : "—"}</td>
<td class="num">${fmt(r.equsto_satis_eur)}</td><td class="num">${fmt(r.equsto_tl)}</td></tr>`,
  )
  .join("")}
</tbody></table>
<script>
function filterRows(){const q=document.getElementById('q').value.toLowerCase();
document.querySelectorAll('#t tbody tr').forEach(tr=>{tr.style.display=(!q||tr.dataset.q.toLowerCase().includes(q))?'':'none';});}
</script></body></html>`;

const outDir = path.join(ROOT, "scripts/data/senox");
fs.writeFileSync(path.join(outDir, "mutbex-kalem-kalem.md"), md, "utf8");
fs.writeFileSync(path.join(ROOT, "public/trial-senox-mutbex-rapor.html"), html, "utf8");
console.log("MD + HTML yazildi");
