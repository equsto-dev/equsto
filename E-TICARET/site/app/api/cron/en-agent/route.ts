import { NextRequest } from "next/server";
import { assertCronSecret } from "@/lib/cron-auth";
import { adminErr, adminOk } from "@/lib/admin-response";
import { runEnAgentScript } from "@/lib/en-agent/run.server";
import { summarizeEnAgentReport } from "@/lib/en-agent/summarize.server";
import { writeEnAgentReport } from "@/lib/en-agent/report";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const denied = assertCronSecret(req);
  if (denied) return denied;

  const withAi = req.nextUrl.searchParams.get("ai") === "1";
  const skipLive = req.nextUrl.searchParams.get("no-live") === "1";

  try {
    const { report, exitCode, stderr } = await runEnAgentScript({ quiet: true, skipLive });
    if (!report) {
      return adminErr(stderr || "EN ajan raporu oluşturulamadı", 500);
    }

    if (withAi) {
      const aiSummary = await summarizeEnAgentReport(report);
      if (aiSummary) {
        report.aiSummary = aiSummary;
        writeEnAgentReport(report);
      }
    }

    return adminOk({
      status: report.status,
      issueCount: report.issueCount,
      generatedAt: report.generatedAt,
      durationMs: report.durationMs,
      checks: report.checks,
      summary: report.summary,
      improvementPlan: report.improvementPlan,
      exitCode,
      aiSummary: report.aiSummary,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "EN ajan başarısız";
    return adminErr(msg, 500);
  }
}
