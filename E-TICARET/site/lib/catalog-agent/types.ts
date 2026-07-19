export type CatalogIssueSeverity = "critical" | "high" | "medium" | "low";

export type CatalogIssueType =
  | "price_mismatch"
  | "price_update"
  | "missing_source"
  | "data_quality"
  | "competitor_gap"
  | "competitor_advantage";

export type CatalogIssue = {
  id: string;
  brand: string;
  severity: CatalogIssueSeverity;
  type: CatalogIssueType;
  sku: string;
  model: string;
  name?: string;
  message: string;
  site_tl?: number | null;
  expected_tl?: number | null;
  diff_tl?: number | null;
  liste_eur?: number | null;
  source?: string;
  competitor?: string | null;
  competitor_tl?: number | null;
  meta?: Record<string, unknown>;
};

export type CatalogCheckStatus = "ok" | "warn" | "error" | "skipped" | "info";

export type CatalogCheckResult = {
  status: CatalogCheckStatus;
  total?: number;
  ok?: number;
  bad?: number;
  missing?: number;
  reason?: string;
  formula?: string;
  [key: string]: unknown;
};

export type CatalogAgentReport = {
  generatedAt: string;
  kur: number;
  usdTry?: number;
  kurFallback: boolean;
  durationMs: number;
  status: "ok" | "info" | "warn" | "error";
  summary: {
    totalIssues: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    byBrand: Record<string, number>;
    byType: Record<string, number>;
    rowCount?: number;
    byLayer?: Record<string, number>;
  };
  checks: Record<string, CatalogCheckResult>;
  issues: CatalogIssue[];
  issueCount: number;
  aiSummary: string | null;
};

export const CATALOG_AGENT_REPORT_PATH = "scripts/data/catalog-agent/latest.json";
