import type { EnAgentReport } from "@/lib/en-agent/types";

const DEFAULT_MODEL = "claude-sonnet-4-6";

function resolveModel(): string {
  const raw = process.env.ANTHROPIC_MODEL?.trim();
  if (!raw || raw.startsWith("claude-3")) return DEFAULT_MODEL;
  return raw;
}

export async function summarizeEnAgentReport(report: EnAgentReport): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) return null;

  const topIssues = report.issues
    .filter((i) => i.severity !== "info")
    .slice(0, 12)
    .map((i) => ({ area: i.area, severity: i.severity, message: i.message, fix: i.fix }));

  const userPrompt = `Equsto sitesinin İngilizce (/en) sayfaları denetim raporunu Türkçe özetle.

Yönetici için:
1. EN kapsam durumu (ürün, UI, GEO)
2. SEO sorunları (canonical, sitemap, hreflang)
3. Çeviri kalitesi
4. İlk 4 geliştirme adımı (komut veya dosya)

Durum: ${report.status}
Ürün EN: ${JSON.stringify(report.checks.product_coverage)}
UI: ${JSON.stringify(report.checks.ui_i18n)}
Geliştirme planı: ${JSON.stringify(report.improvementPlan.actions.slice(0, 6))}

Bulgular:
${JSON.stringify(topIssues, null, 2)}`;

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
        max_tokens: 1200,
        system:
          "Sen çok dilli e-ticaret ve SEO uzmanısın. Kısa, eyleme dönük Türkçe yanıt ver.",
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
