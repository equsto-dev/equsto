import { NextRequest } from "next/server";
import { assertCronSecret } from "@/lib/cron-auth";
import { adminErr, adminOk } from "@/lib/admin-response";
import { runGoogleAdsAgentScript } from "@/lib/google-ads-agent/run.server";
import { summarizeGoogleAdsAgentReport } from "@/lib/google-ads-agent/summarize.server";
import { writeGoogleAdsAgentReport } from "@/lib/google-ads-agent/report";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Cron — Google Ads endüstriyel mutfak konumlandırma denetimi */
export async function GET(req: NextRequest) {
  const denied = assertCronSecret(req);
  if (denied) return denied;

  const withAi = req.nextUrl.searchParams.get("ai") === "1";
  const skipLive = req.nextUrl.searchParams.get("no-live") === "1";

  try {
    const { report, exitCode, stderr } = await runGoogleAdsAgentScript({
      quiet: true,
      skipLive,
    });
    if (!report) {
      return adminErr(stderr || "Google Ads ajan raporu oluşturulamadı", 500);
    }

    if (withAi) {
      const aiSummary = await summarizeGoogleAdsAgentReport(report);
      if (aiSummary) {
        report.aiSummary = aiSummary;
        writeGoogleAdsAgentReport(report);
      }
    }

    return adminOk({
      status: report.status,
      issueCount: report.issueCount,
      generatedAt: report.generatedAt,
      durationMs: report.durationMs,
      checks: report.checks,
      summary: report.summary,
      campaignConfig: report.campaignConfig,
      exitCode,
      aiSummary: report.aiSummary,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Google Ads ajan başarısız";
    return adminErr(msg, 500);
  }
}
