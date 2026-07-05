import { NextRequest } from "next/server";
import { assertCronSecret } from "@/lib/cron-auth";
import { adminErr, adminOk } from "@/lib/admin-response";
import { runCatalogAgentScript } from "@/lib/catalog-agent/run.server";
import { summarizeCatalogAgentReport } from "@/lib/catalog-agent/summarize.server";
import { writeCatalogAgentReport } from "@/lib/catalog-agent/report";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Cron — katalog fiyat denetimi ve rakip karşılaştırma raporu üretir.
 * Örnek: curl -H "Authorization: Bearer $CRON_SECRET" https://equsto.com/api/cron/catalog-agent
 */
export async function GET(req: NextRequest) {
  const denied = assertCronSecret(req);
  if (denied) return denied;

  const withAi = req.nextUrl.searchParams.get("ai") === "1";

  try {
    const { report, exitCode, stderr } = await runCatalogAgentScript({ quiet: true });
    if (!report) {
      return adminErr(stderr || "Katalog ajanı raporu oluşturulamadı", 500);
    }

    if (withAi) {
      const aiSummary = await summarizeCatalogAgentReport(report);
      if (aiSummary) {
        report.aiSummary = aiSummary;
        writeCatalogAgentReport(report);
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
    const msg = e instanceof Error ? e.message : "Katalog ajanı başarısız";
    return adminErr(msg, 500);
  }
}
