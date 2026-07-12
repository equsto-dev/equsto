import { NextRequest } from "next/server";
import { assertAdminBearer } from "@/lib/auth";
import { adminErr, adminOk } from "@/lib/admin-response";
import { readMobileAgentReport } from "@/lib/mobile-agent/report";
import { runMobileAgentScript } from "@/lib/mobile-agent/run.server";
import { summarizeMobileAgentReport } from "@/lib/mobile-agent/summarize.server";
import { writeMobileAgentReport } from "@/lib/mobile-agent/report";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET() {
  const report = readMobileAgentReport();
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
    const { report, exitCode, stderr } = await runMobileAgentScript({
      quiet: true,
      skipLive,
    });
    if (!report) {
      return adminErr(stderr || "Rapor oluşturulamadı", 500);
    }

    if (withAi) {
      const aiSummary = await summarizeMobileAgentReport(report);
      if (aiSummary) {
        report.aiSummary = aiSummary;
        writeMobileAgentReport(report);
      }
    }

    return adminOk({
      report,
      exitCode,
      message:
        report.issueCount === 0
          ? "Mobil denetim tamam — sorun bulunamadı"
          : `${report.issueCount} bulgu tespit edildi`,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Denetim başarısız";
    return adminErr(msg, 500);
  }
}
