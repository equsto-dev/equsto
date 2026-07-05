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
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
