#!/usr/bin/env node
/**
 * Blog ajanı — rakip blog analizi ve haftalık rehber taslağı
 *
 *   node scripts/blog-agent-run.mjs
 *   node scripts/blog-agent-run.mjs --force
 *   node scripts/blog-agent-run.mjs --no-ai
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runBlogAgentChecks } from "./lib/blog-agent-core.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "scripts/data/blog-agent");
const OUT_JSON = path.join(OUT_DIR, "latest.json");

const quiet = process.argv.includes("--quiet");
const forceDraft = process.argv.includes("--force");
const skipAi = process.argv.includes("--no-ai");
const topicId = process.env.BLOG_AGENT_TOPIC_ID?.trim() || undefined;

async function main() {
  const report = await runBlogAgentChecks({ forceDraft, skipAi, topicId });
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(report, null, 2), "utf8");

  if (!quiet) {
    console.log("=== Blog Ajanı ===");
    console.log(`Durum: ${report.status} | Süre: ${report.durationMs}ms`);
    console.log(
      `Rakip konu: ${report.summary.competitorTopics} | Equsto: ${report.summary.equstoArticles} | Boşluk: ${report.summary.gapTopics}`,
    );
    console.log(
      `Hafta: ${report.summary.currentWeek} | Yeni taslak: ${report.summary.weeklyDraftCreated ? "evet" : "hayır"}`,
    );
    if (report.latestDraft) {
      console.log(`Son taslak: ${report.latestDraft.h1} → /rehber/${report.latestDraft.slug}`);
    }
    if (report.gapTopics.length) {
      console.log("\nÖncelikli boşluklar:");
      for (const g of report.gapTopics.slice(0, 5)) {
        console.log(`  [${g.priority}] ${g.title}`);
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
