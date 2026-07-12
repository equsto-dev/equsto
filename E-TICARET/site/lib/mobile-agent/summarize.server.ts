import type { MobileAgentReport } from "@/lib/mobile-agent/types";

const DEFAULT_MODEL = "claude-sonnet-4-6";

function resolveModel(): string {
  const raw = process.env.ANTHROPIC_MODEL?.trim();
  if (!raw || raw.startsWith("claude-3")) return DEFAULT_MODEL;
  return raw;
}

export async function summarizeMobileAgentReport(
  report: MobileAgentReport,
): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) return null;

  const topIssues = report.issues
    .filter((i) => i.severity !== "info")
    .slice(0, 15)
    .map((i) => ({
      platform: i.platform,
      severity: i.severity,
      message: i.message,
      fix: i.fix,
    }));

  const userPrompt = `Equsto e-ticaret sitesi mobil (Android/iOS) denetim raporunu Türkçe özetle.
Yönetici için: iOS Safari, Android Chrome, PWA kurulumu açısından en kritik 4-6 madde ve önerilen düzeltmeler.

Durum: ${report.status}
Toplam bulgu: ${report.issueCount}
Platform: ${JSON.stringify(report.summary.byPlatform)}
Denetimler: ${JSON.stringify(report.checks)}

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
        max_tokens: 1024,
        system:
          "Sen mobil web ve PWA uzmanısın. Kısa, net Türkçe yanıt ver. iOS ve Android'i ayrı vurgula.",
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
