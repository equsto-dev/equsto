import type { GoogleAdsAgentReport } from "@/lib/google-ads-agent/types";

const DEFAULT_MODEL = "claude-sonnet-4-6";

function resolveModel(): string {
  const raw = process.env.ANTHROPIC_MODEL?.trim();
  if (!raw || raw.startsWith("claude-3")) return DEFAULT_MODEL;
  return raw;
}

export async function summarizeGoogleAdsAgentReport(
  report: GoogleAdsAgentReport,
): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) return null;

  const topIssues = report.issues
    .filter((i) => i.severity !== "info")
    .slice(0, 12)
    .map((i) => ({ area: i.area, severity: i.severity, message: i.message, fix: i.fix }));

  const userPrompt = `Equsto sitesini Google Ads'te "endüstriyel mutfak ekipmanı" işletmesi olarak konumlandırmak için denetim raporunu Türkçe özetle.

Yönetici için:
1. Google Ads hesabında işletme kategorisi / kampanya yapısı önerisi
2. Hangi landing URL'ler kullanılmalı
3. Etiket ve dönüşüm eksikleri
4. İlk 3 acil düzeltme

Durum: ${report.status}
Kategori: ${report.campaignConfig.businessCategory}
Önerilen kampanyalar: ${JSON.stringify(report.campaignConfig.suggestedCampaigns.map((c) => c.name))}
Feed: ${report.campaignConfig.merchantCenter.feedUrl}

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
          "Sen Google Ads ve B2B endüstriyel mutfak pazarlama uzmanısın. Kısa, eyleme dönük Türkçe yanıt ver.",
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
