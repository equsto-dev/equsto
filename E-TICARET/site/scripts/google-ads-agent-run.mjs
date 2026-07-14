#!/usr/bin/env node
/**
 * Google Ads ajan — endüstriyel mutfak konumlandırması denetimi
 *
 *   node scripts/google-ads-agent-run.mjs
 *   node scripts/google-ads-agent-run.mjs --no-live
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runGoogleAdsAgentChecks } from "./lib/google-ads-agent-core.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "scripts/data/google-ads-agent");
const OUT_JSON = path.join(OUT_DIR, "latest.json");
const quiet = process.argv.includes("--quiet");
const skipLive = process.argv.includes("--no-live") || process.env.GOOGLE_ADS_AGENT_SKIP_LIVE === "1";

async function main() {
  try {
    const report = await runGoogleAdsAgentChecks({ skipLive });
    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(OUT_JSON, JSON.stringify(report, null, 2), "utf8");

    if (!quiet) {
      console.log("=== Google Ads Ajan (Endüstriyel Mutfak) ===");
      console.log(`Durum: ${report.status} | Süre: ${report.durationMs}ms`);
      console.log(`Toplam bulgu: ${report.issueCount}`);
      console.log(`İş kategorisi: ${report.campaignConfig.businessCategory}`);
      for (const [area, n] of Object.entries(report.summary.byArea || {})) {
        console.log(`  ${area}: ${n}`);
      }
      console.log("\nÖnerilen kampanyalar:");
      for (const c of report.campaignConfig.suggestedCampaigns.slice(0, 4)) {
        console.log(`  [${c.type}] ${c.name} → ${c.finalUrl}`);
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
  } catch (e) {
    console.error(e);
    try {
      fs.mkdirSync(OUT_DIR, { recursive: true });
      fs.writeFileSync(
        OUT_JSON,
        JSON.stringify(
          {
            generatedAt: new Date().toISOString(),
            durationMs: 0,
            status: "error",
            summary: { totalIssues: 1, critical: 1, high: 0, medium: 0, low: 0, info: 0, byArea: {} },
            checks: {},
            campaignConfig: {
              businessCategory: "Commercial Kitchen Equipment",
              businessType: "B2B",
              primaryConversion: "lead",
              secondaryConversion: "quote",
              suggestedCampaigns: [],
              merchantCenter: { feedUrl: "", productCategory: "", returnPolicyUrl: "" },
              tracking: { ga4Property: "", googleAdsAccount: "", conversionActions: [] },
              feedStats: null,
              landings: [],
            },
            issues: [
              {
                id: "runtime:crash",
                area: "runtime",
                severity: "critical",
                type: "runtime",
                message: e instanceof Error ? e.message : String(e),
              },
            ],
            issueCount: 1,
            aiSummary: null,
          },
          null,
          2,
        ),
        "utf8",
      );
    } catch {
      /* ignore */
    }
    process.exit(1);
  }
}

main();
