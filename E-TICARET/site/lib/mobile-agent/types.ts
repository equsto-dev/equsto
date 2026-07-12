export type MobileIssueSeverity = "critical" | "high" | "medium" | "low" | "info";

export type MobileIssue = {
  id: string;
  platform: string;
  severity: MobileIssueSeverity;
  type: string;
  area: string;
  message: string;
  file?: string;
  fix?: string;
  meta?: Record<string, unknown>;
};

export type MobileCheckResult = {
  status: string;
  [key: string]: unknown;
};

export type MobileAgentReport = {
  generatedAt: string;
  durationMs: number;
  status: "ok" | "info" | "warn" | "error";
  summary: {
    totalIssues: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
    byPlatform: Record<string, number>;
    byType: Record<string, number>;
  };
  checks: Record<string, MobileCheckResult>;
  issues: MobileIssue[];
  issueCount: number;
  aiSummary: string | null;
};

export const MOBILE_AGENT_REPORT_PATH = "scripts/data/mobile-agent/latest.json";
