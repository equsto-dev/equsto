#!/usr/bin/env node
/**
 * Katalog AI ajanı — evrensel L1–L4 + marka denetimleri, birleşik rapor
 *
 *   node scripts/catalog-agent-run.mjs
 *   node scripts/catalog-agent-run.mjs --quiet
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runCatalogAgentChecks } from "./lib/catalog-agent-core.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "scripts/data/catalog-agent");
const OUT_JSON = path.join(OUT_DIR, "latest.json");
const OUT_FULL_JSON = path.join(OUT_DIR, "full-report.json");
const OUT_MD = path.join(OUT_DIR, "full-report.md");
const quiet = process.argv.includes("--quiet");

function fmtTl(n) {
  if (n == null || !Number.isFinite(Number(n))) return "—";
  return `₺${Math.round(Number(n)).toLocaleString("tr-TR")}`;
}

function buildMarkdown(report) {
  const all = report.allIssues || report.issues || [];
  const s = report.summary || {};
  const lines = [
    "# Katalog Fiyat Denetim Raporu (Full)",
    "",
    `**Oluşturulma:** ${report.generatedAt}`,
    `**Durum:** ${report.status}`,
    `**Kur:** 1 EUR = ${report.kur} TRY` +
      (report.usdTry ? ` · 1 USD = ${report.usdTry} TRY` : ""),
    `**Süre:** ${report.durationMs} ms`,
    `**Katalog ürün:** ${s.rowCount ?? "—"}`,
    `**Toplam sorun:** ${report.issueCount}`,
    "",
    "## Severity",
    "",
    `| critical | high | medium | low |`,
    `|---------:|-----:|-------:|----:|`,
    `| ${s.critical || 0} | ${s.high || 0} | ${s.medium || 0} | ${s.low || 0} |`,
    "",
    "## Katman (L1–L4)",
    "",
    `| Katman | Sorun |`,
    `|--------|------:|`,
  ];
  for (const [k, v] of Object.entries(s.byLayer || {})) {
    lines.push(`| ${k} | ${v} |`);
  }
  lines.push("", "## Denetimler", "");
  for (const [key, chk] of Object.entries(report.checks || {})) {
    const bits = [`**${chk.status}**`];
    if (chk.checked != null) bits.push(`checked ${chk.checked}`);
    if (chk.bad != null) bits.push(`bad ${chk.bad}`);
    if (chk.total != null) bits.push(`total ${chk.total}`);
    if (chk.skipped != null) bits.push(`skip ${chk.skipped}`);
    if (chk.reason) bits.push(chk.reason);
    lines.push(`- \`${key}\`: ${bits.join(" · ")}`);
  }
  lines.push("", "## Marka dağılımı", "");
  const brands = Object.entries(s.byBrand || {}).sort((a, b) => b[1] - a[1]);
  lines.push("| Marka | Sorun |", "|-------|------:|");
  for (const [b, n] of brands) lines.push(`| ${b} | ${n} |`);

  const byLayer = { L1: [], L2: [], L3: [], L4: [], brand: [] };
  for (const i of all) {
    const layer = i.meta?.layer;
    if (layer && byLayer[layer]) byLayer[layer].push(i);
    else byLayer.brand.push(i);
  }

  for (const layer of ["L1", "L2", "L3", "L4", "brand"]) {
    const list = byLayer[layer];
    lines.push("", `## ${layer === "brand" ? "Marka özel denetimler" : layer}`, "");
    if (!list.length) {
      lines.push("_Sorun yok._", "");
      continue;
    }
    lines.push(
      `| Sev | Marka | SKU | Site | Beklenen | Mesaj |`,
      `|-----|-------|-----|-----:|---------:|-------|`,
    );
    for (const i of list) {
      const msg = String(i.message || "").replace(/\|/g, "/").slice(0, 160);
      lines.push(
        `| ${i.severity} | ${i.brand} | \`${i.sku}\` | ${fmtTl(i.site_tl)} | ${fmtTl(i.expected_tl)} | ${msg} |`,
      );
    }
  }

  lines.push("", "---", "", `_Dosya: scripts/data/catalog-agent/full-report.md_`, "");
  return lines.join("\n");
}

async function main() {
  const report = await runCatalogAgentChecks();
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const { allIssues, ...forUi } = report;
  const fullIssues = allIssues || report.issues;
  fs.writeFileSync(OUT_JSON, JSON.stringify(forUi, null, 2), "utf8");
  fs.writeFileSync(
    OUT_FULL_JSON,
    JSON.stringify({ ...forUi, issues: fullIssues, issueCount: fullIssues.length }, null, 2),
    "utf8",
  );
  fs.writeFileSync(OUT_MD, buildMarkdown({ ...report, allIssues: fullIssues }), "utf8");

  if (!quiet) {
    console.log("=== Katalog Ajanı (Evrensel L1–L4) ===");
    console.log(`Durum: ${report.status} | Kur: ${report.kur} | Süre: ${report.durationMs}ms`);
    console.log(`Ürün: ${report.summary?.rowCount} | Toplam sorun: ${report.issueCount}`);
    console.log("Katman:", report.summary?.byLayer);
    for (const [brand, n] of Object.entries(report.summary.byBrand || {}).slice(0, 12)) {
      console.log(`  ${brand}: ${n}`);
    }
    console.log("\nDenetimler:");
    for (const [key, chk] of Object.entries(report.checks)) {
      console.log(
        `  ${key}: ${chk.status}` +
          (chk.checked != null ? ` (checked ${chk.checked}, bad ${chk.bad ?? 0})` : "") +
          (chk.total != null && chk.checked == null ? ` (${chk.total})` : ""),
      );
    }
    const crit = (fullIssues || []).filter((i) => i.severity === "critical").slice(0, 10);
    if (crit.length) {
      console.log("\nKritik (ilk 10):");
      for (const i of crit) {
        console.log(`  [${i.meta?.layer || "?"}] ${i.brand} ${i.sku}: ${i.message}`);
      }
    }
    console.log(`\n→ ${OUT_MD}`);
    console.log(`→ ${OUT_FULL_JSON}`);
  }

  process.exit(report.status === "error" ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
