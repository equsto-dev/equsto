#!/usr/bin/env node
/**
 * İngilizce sayfa ajanı — /en denetimi ve geliştirme planı
 *
 *   node scripts/en-agent-run.mjs
 *   node scripts/en-agent-run.mjs --no-live
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runEnAgentChecks } from "./lib/en-agent-core.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "scripts/data/en-agent");
const OUT_JSON = path.join(OUT_DIR, "latest.json");
const quiet = process.argv.includes("--quiet");
const skipLive = process.argv.includes("--no-live") || process.env.EN_AGENT_SKIP_LIVE === "1";

async function main() {
  const report = await runEnAgentChecks({ skipLive });
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(report, null, 2), "utf8");

  if (!quiet) {
    console.log("=== İngilizce Sayfa Ajanı ===");
    console.log(`Durum: ${report.status} | Süre: ${report.durationMs}ms`);
    console.log(`Toplam bulgu: ${report.issueCount}`);
    const cov = report.checks.product_coverage || {};
    console.log(`Ürün EN: ${cov.enCount ?? "?"}/${cov.catalogCount ?? "?"} | UI eksik: ${report.checks.ui_i18n?.missing ?? "?"}`);
    for (const [area, n] of Object.entries(report.summary.byArea || {})) {
      console.log(`  ${area}: ${n}`);
    }
    console.log("\nGeliştirme önerileri:");
    for (const a of report.improvementPlan.actions.slice(0, 5)) {
      console.log(`  [${a.priority}] ${a.action}`);
    }
    const top = report.issues.filter((i) => i.severity !== "info").slice(0, 6);
    if (top.length) {
      console.log("\nÖncelikli bulgular:");
      for (const i of top) {
        console.log(`  [${i.severity}] ${i.message}`);
      }
    }
    console.log(`\n→ ${OUT_JSON}`);
  }

  process.exit(report.status === "error" ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
