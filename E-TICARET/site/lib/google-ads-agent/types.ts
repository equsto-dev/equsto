export type AdsIssueSeverity = "critical" | "high" | "medium" | "low" | "info";

export type GoogleAdsIssue = {
  id: string;
  area: string;
  severity: AdsIssueSeverity;
  type: string;
  message: string;
  file?: string;
  fix?: string;
  meta?: Record<string, unknown>;
};

export type GoogleAdsCampaignConfig = {
  businessCategory: string;
  businessType: string;
  primaryConversion: string;
  secondaryConversion: string;
  suggestedCampaigns: Array<{
    name: string;
    type: string;
    finalUrl: string;
    keywords?: string[];
    feedUrl?: string;
    note?: string;
  }>;
  merchantCenter: {
    feedUrl: string;
    productCategory: string;
    returnPolicyUrl: string;
  };
  tracking: {
    ga4Property: string;
    googleAdsAccount: string;
    conversionActions: string[];
  };
  feedStats: Record<string, unknown> | null;
  landings: Array<Record<string, unknown>>;
};

export type GoogleAdsAgentReport = {
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
  campaignConfig: GoogleAdsCampaignConfig;
  issues: GoogleAdsIssue[];
  issueCount: number;
  aiSummary: string | null;
};

export const GOOGLE_ADS_AGENT_REPORT_PATH = "scripts/data/google-ads-agent/latest.json";
