import { NextRequest } from "next/server";
import { assertAdminBearer } from "@/lib/auth";
import { adminErr, adminOk } from "@/lib/admin-response";
import { readBlogAgentReport, writeBlogAgentReport } from "@/lib/blog-agent/report";
import { publishBlogDraft } from "@/lib/blog-agent/publish.server";
import { runBlogAgentScript } from "@/lib/blog-agent/run.server";
import { summarizeBlogAgentReport } from "@/lib/blog-agent/summarize.server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET() {
  const report = readBlogAgentReport();
  if (!report) {
    return adminOk({
      report: null,
      message: "Henüz rapor yok — POST ile blog ajanını çalıştırın",
    });
  }
  return adminOk({ report });
}

export async function POST(req: NextRequest) {
  const denied = assertAdminBearer(req);
  if (denied) return denied;

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const action = String(body.action || "run");

  if (action === "publish") {
    const slug = String(body.slug || "").trim();
    if (!slug) return adminErr("slug gerekli", 400);
    const result = await publishBlogDraft(slug);
    if (!result.ok) return adminErr(result.error || "Yayın başarısız", 500);
    return adminOk({
      message: `Yayınlandı: /rehber/${slug}`,
      key: result.key,
    });
  }

  const withAi = body.ai === true || body.aiSummary === true;
  const forceDraft = body.force === true || body.forceDraft === true;
  const skipAi = body.skipAi === true || body.noAi === true;
  const topicId = body.topicId ? String(body.topicId) : undefined;

  try {
    const { report, exitCode, stderr } = await runBlogAgentScript({
      quiet: true,
      forceDraft,
      skipAi,
      topicId,
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
      report,
      exitCode,
      message:
        report.message ||
        (report.summary.weeklyDraftCreated
          ? `Haftalık taslak hazır: ${report.latestDraft?.slug}`
          : `${report.summary.gapTopics} konu boşluğu tespit edildi`),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Blog ajan başarısız";
    return adminErr(msg, 500);
  }
}
