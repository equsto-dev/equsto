import { NextRequest } from "next/server";
import { assertCronSecret } from "@/lib/cron-auth";
import { adminErr, adminOk } from "@/lib/admin-response";
import { runMobileAgentScript } from "@/lib/mobile-agent/run.server";
import { summarizeMobileAgentReport } from "@/lib/mobile-agent/summarize.server";
import { writeMobileAgentReport } from "@/lib/mobile-agent/report";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Cron — Android/iOS mobil ve PWA ayarları denetimi.
 * curl -H "Authorization: Bearer $CRON_SECRET" https://equsto.com/api/cron/mobile-agent
 */
export async function GET(req: NextRequest) {
  const denied = assertCronSecret(req);
  if (denied) return denied;

  const withAi = req.nextUrl.searchParams.get("ai") === "1";
  const skipLive = req.nextUrl.searchParams.get("no-live") === "1";

  try {
    const { report, exitCode, stderr } = await runMobileAgentScript({
      quiet: true,
      skipLive,
    });
    if (!report) {
      return adminErr(stderr || "Mobil ajan raporu oluşturulamadı", 500);
    }

    if (withAi) {
      const aiSummary = await summarizeMobileAgentReport(report);
      if (aiSummary) {
        report.aiSummary = aiSummary;
        writeMobileAgentReport(report);
      }
    }

    return adminOk({
      status: report.status,
      issueCount: report.issueCount,
      generatedAt: report.generatedAt,
      durationMs: report.durationMs,
      checks: report.checks,
      summary: report.summary,
      exitCode,
      aiSummary: report.aiSummary,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Mobil ajan başarısız";
    return adminErr(msg, 500);
  }
}
