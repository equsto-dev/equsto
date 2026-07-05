import { NextRequest } from "next/server";
import { assertAdminBearer } from "@/lib/auth";
import { adminErr, adminOk } from "@/lib/admin-response";
import { readCatalogAgentReport } from "@/lib/catalog-agent/report";
import { runCatalogAgentScript } from "@/lib/catalog-agent/run.server";
import { summarizeCatalogAgentReport } from "@/lib/catalog-agent/summarize.server";
import { writeCatalogAgentReport } from "@/lib/catalog-agent/report";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** GET — son katalog ajanı raporu */
export async function GET() {
  const report = readCatalogAgentReport();
  if (!report) {
    return adminOk({
      report: null,
      message: "Henüz rapor yok — POST ile denetim çalıştırın",
    });
  }
  return adminOk({ report });
}

/** POST — denetimi çalıştır (isteğe bağlı AI özet) */
export async function POST(req: NextRequest) {
  const denied = assertAdminBearer(req);
  if (denied) return denied;

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const withAi = body.ai === true || body.aiSummary === true;

  try {
    const { report, exitCode, stderr } = await runCatalogAgentScript({ quiet: true });
    if (!report) {
      return adminErr(stderr || "Rapor oluşturulamadı", 500);
    }

    if (withAi) {
      const aiSummary = await summarizeCatalogAgentReport(report);
      if (aiSummary) {
        report.aiSummary = aiSummary;
        writeCatalogAgentReport(report);
      }
    }

    return adminOk({
      report,
      exitCode,
      message:
        report.issueCount === 0
          ? "Denetim tamam — sorun bulunamadı"
          : `${report.issueCount} sorun tespit edildi`,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Denetim başarısız";
    return adminErr(msg, 500);
  }
}
