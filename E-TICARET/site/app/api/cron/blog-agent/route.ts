import { NextRequest } from "next/server";
import { assertCronSecret } from "@/lib/cron-auth";
import { adminErr, adminOk } from "@/lib/admin-response";
import { writeBlogAgentReport } from "@/lib/blog-agent/report";
import { runBlogAgentScript } from "@/lib/blog-agent/run.server";
import { summarizeBlogAgentReport } from "@/lib/blog-agent/summarize.server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Haftalık cron — Pazartesi 09:00 UTC önerilir */
export async function GET(req: NextRequest) {
  const denied = assertCronSecret(req);
  if (denied) return denied;

  const withAi = req.nextUrl.searchParams.get("ai") === "1";
  const force = req.nextUrl.searchParams.get("force") === "1";
  const skipAi = req.nextUrl.searchParams.get("no-ai") === "1";

  try {
    const { report, exitCode, stderr } = await runBlogAgentScript({
      quiet: true,
      forceDraft: force,
      skipAi,
    });
    if (!report) {
      return adminErr(stderr || "Blog ajan raporu oluşturulamadı", 500);
    }

    if (withAi) {
      const aiSummary = await summarizeBlogAgentReport(report);
      if (aiSummary) {
        report.aiSummary = aiSummary;
        writeBlogAgentReport(report);
      }
    }

    return adminOk({
      status: report.status,
      generatedAt: report.generatedAt,
      durationMs: report.durationMs,
      summary: report.summary,
      latestDraft: report.latestDraft
        ? { slug: report.latestDraft.slug, h1: report.latestDraft.h1, status: report.latestDraft.status }
        : null,
      exitCode,
      aiSummary: report.aiSummary,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Blog ajan başarısız";
    return adminErr(msg, 500);
  }
}
