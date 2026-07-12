import { NextRequest } from "next/server";
import { assertAdminBearer } from "@/lib/auth";
import { adminErr, adminOk } from "@/lib/admin-response";
import { readEnAgentReport } from "@/lib/en-agent/report";
import { runEnAgentScript } from "@/lib/en-agent/run.server";
import { summarizeEnAgentReport } from "@/lib/en-agent/summarize.server";
import { writeEnAgentReport } from "@/lib/en-agent/report";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET() {
  const report = readEnAgentReport();
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
    const { report, exitCode, stderr } = await runEnAgentScript({ quiet: true, skipLive });
    if (!report) {
      return adminErr(stderr || "Rapor oluşturulamadı", 500);
    }

    if (withAi) {
      const aiSummary = await summarizeEnAgentReport(report);
      if (aiSummary) {
        report.aiSummary = aiSummary;
        writeEnAgentReport(report);
      }
    }

    return adminOk({
      report,
      exitCode,
      message:
        report.issueCount === 0
          ? "EN denetimi tamam"
          : `${report.issueCount} bulgu — geliştirme planı raporda`,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Denetim başarısız";
    return adminErr(msg, 500);
  }
}
