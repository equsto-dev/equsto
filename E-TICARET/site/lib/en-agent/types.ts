export type EnIssueSeverity = "critical" | "high" | "medium" | "low" | "info";

export type EnIssue = {
  id: string;
  area: string;
  severity: EnIssueSeverity;
  type: string;
  message: string;
  file?: string;
  fix?: string;
  meta?: Record<string, unknown>;
};

export type EnImprovementAction = {
  priority: string;
  action: string;
  reason: string;
  files?: string[];
};

export type EnImprovementPlan = {
  locale: string;
  urlPrefix: string;
  productCoverage: Record<string, unknown>;
  uiParity: Record<string, unknown>;
  recommendedCommands: string[];
  actions: EnImprovementAction[];
  priorityPages: Array<{ path: string; role: string }>;
};

export type EnAgentReport = {
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
    byArea: Record<string, number>;
  };
  checks: Record<string, Record<string, unknown>>;
  improvementPlan: EnImprovementPlan;
  issues: EnIssue[];
  issueCount: number;
  aiSummary: string | null;
};

export const EN_AGENT_REPORT_PATH = "scripts/data/en-agent/latest.json";
