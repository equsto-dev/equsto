import { NextRequest } from "next/server";
import { assertAdminBearer } from "@/lib/auth";
import { adminErr, adminOk } from "@/lib/admin-response";
import { readGoogleAdsAgentReport } from "@/lib/google-ads-agent/report";
import { runGoogleAdsAgentScript } from "@/lib/google-ads-agent/run.server";
import { summarizeGoogleAdsAgentReport } from "@/lib/google-ads-agent/summarize.server";
import { writeGoogleAdsAgentReport } from "@/lib/google-ads-agent/report";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET() {
  const report = readGoogleAdsAgentReport();
  if (!report) {
    return adminOk({
      report: null,
      message: "Henüz rapor yok — POST ile denetim çalıştırın",
    });
  }
  return adminOk({ report });
}

export async function POST(req: NextRequest) {
  const denied = assertAdminBearer(req);
  if (denied) return denied;

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const withAi = body.ai === true || body.aiSummary === true;
  const skipLive = body.skipLive === true || body.noLive === true;

  try {
    const { report, exitCode, stderr } = await runGoogleAdsAgentScript({
      quiet: true,
      skipLive,
    });
    if (!report) {
      return adminErr(stderr || "Rapor oluşturulamadı", 500);
    }

    if (withAi) {
      const aiSummary = await summarizeGoogleAdsAgentReport(report);
      if (aiSummary) {
        report.aiSummary = aiSummary;
        writeGoogleAdsAgentReport(report);
      }
    }

    return adminOk({
      report,
      exitCode,
      message:
        report.issueCount === 0
          ? "Google Ads denetimi tamam"
          : `${report.issueCount} bulgu — kampanya önerileri raporda`,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Denetim başarısız";
    return adminErr(msg, 500);
  }
}
