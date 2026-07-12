import type { BlogAgentReport } from "@/lib/blog-agent/types";

const DEFAULT_MODEL = "claude-sonnet-4-6";

function resolveModel(): string {
  const raw = process.env.ANTHROPIC_MODEL?.trim();
  if (!raw || raw.startsWith("claude-3")) return DEFAULT_MODEL;
  return raw;
}

export async function summarizeBlogAgentReport(
  report: BlogAgentReport,
): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) return null;

  const userPrompt = `Equsto blog ajanı raporunu Türkçe özetle.

Yönetici için:
1. Rakip blog kapsamı vs Equsto boşlukları
2. Bu hafta üretilen taslak (varsa)
3. Yayın öncesi önerilen 3 adım

Özet veriler:
${JSON.stringify(
  {
    summary: report.summary,
    topGaps: report.gapTopics.slice(0, 6),
    latestDraft: report.latestDraft
      ? { h1: report.latestDraft.h1, slug: report.latestDraft.slug, status: report.latestDraft.status }
      : null,
  },
  null,
  2,
)}`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: resolveModel(),
        max_tokens: 900,
        system: "Sen B2B içerik stratejisti ve SEO editörüsün. Kısa Türkçe özet ver.",
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!res.ok) return null;
    const data = (await res.json()) as {
      content?: Array<{ type?: string; text?: string }>;
    };
    return (
      (data.content || [])
        .filter((b) => b.type === "text" && b.text)
        .map((b) => b.text)
        .join("\n")
        .trim() || null
    );
  } catch {
    return null;
  }
}
