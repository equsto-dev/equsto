/**
 * Katalog ajanı raporu — Claude özet (isteğe bağlı)
 */
import type { CatalogAgentReport } from "@/lib/catalog-agent/types";

const DEFAULT_MODEL = "claude-sonnet-4-6";

function resolveModel(): string {
  const raw = process.env.ANTHROPIC_MODEL?.trim();
  if (!raw || raw.startsWith("claude-3")) return DEFAULT_MODEL;
  return raw;
}

export async function summarizeCatalogAgentReport(
  report: CatalogAgentReport,
): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) return null;

  const topIssues = report.issues.slice(0, 15).map((i) => ({
    severity: i.severity,
    brand: i.brand,
    sku: i.sku,
    message: i.message,
    site_tl: i.site_tl,
    expected_tl: i.expected_tl,
    competitor: i.competitor,
  }));

  const userPrompt = `Aşağıdaki e-ticaret katalog denetim raporunu Türkçe, kısa ve eyleme dönük özetle.
Yönetici için 3-5 madde: en kritik sorunlar, hangi markalar etkileniyor, önerilen ilk adımlar.

Rapor özeti:
- Durum: ${report.status}
- Kur: ${report.kur} TRY/EUR
- Toplam sorun: ${report.issueCount}
- Marka dağılımı: ${JSON.stringify(report.summary.byBrand)}
- Denetimler: ${JSON.stringify(report.checks)}

Öncelikli sorunlar:
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
        max_tokens: 1024,
        system:
          "Sen bir e-ticaret katalog kalite ve fiyat denetim asistanısın. Kısa, net Türkçe yanıt ver. Markdown kullanabilirsin.",
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!res.ok) return null;
    const data = (await res.json()) as {
      content?: Array<{ type?: string; text?: string }>;
    };
    const text = (data.content || [])
      .filter((b) => b.type === "text" && b.text)
      .map((b) => b.text)
      .join("\n")
      .trim();
    return text || null;
  } catch {
    return null;
  }
}
