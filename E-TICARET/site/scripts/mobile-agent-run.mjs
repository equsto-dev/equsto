#!/usr/bin/env node
/**
 * Mobil ajan — Android/iOS PWA ve mobil UI denetimi
 *
 *   node scripts/mobile-agent-run.mjs
 *   node scripts/mobile-agent-run.mjs --no-live
 *   MOBILE_AGENT_SKIP_LIVE=1 node scripts/mobile-agent-run.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runMobileAgentChecks } from "./lib/mobile-agent-core.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "scripts/data/mobile-agent");
const OUT_JSON = path.join(OUT_DIR, "latest.json");
const quiet = process.argv.includes("--quiet");
const skipLive = process.argv.includes("--no-live") || process.env.MOBILE_AGENT_SKIP_LIVE === "1";

async function main() {
  try {
    const report = await runMobileAgentChecks({ skipLive });
    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(OUT_JSON, JSON.stringify(report, null, 2), "utf8");

    if (!quiet) {
      console.log("=== Mobil Ajan (Android / iOS) ===");
      console.log(`Durum: ${report.status} | Süre: ${report.durationMs}ms`);
      console.log(`Toplam bulgu: ${report.issueCount}`);
      for (const [plat, n] of Object.entries(report.summary.byPlatform || {})) {
        console.log(`  ${plat}: ${n}`);
      }
      console.log("\nDenetimler:");
      for (const [key, chk] of Object.entries(report.checks)) {
        console.log(`  ${key}: ${chk.status}`);
      }
      const top = report.issues.filter((i) => i.severity !== "info").slice(0, 8);
      if (top.length) {
        console.log("\nÖncelikli bulgular:");
        for (const i of top) {
          console.log(`  [${i.severity}/${i.platform}] ${i.message}`);
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
            summary: { totalIssues: 1, critical: 1, high: 0, medium: 0, low: 0, info: 0, byPlatform: {}, byType: {} },
            checks: {},
            issues: [
              {
                id: "runtime:crash",
                platform: "pwa",
                severity: "critical",
                type: "runtime",
                area: "runtime",
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
