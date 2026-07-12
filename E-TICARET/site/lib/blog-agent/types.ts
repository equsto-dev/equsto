export const BLOG_AGENT_REPORT_PATH = "scripts/data/blog-agent/latest.json";

export type TopicGap = {
  id: string;
  title: string;
  category: string;
  priority: string;
  keywords: string[];
  competitorSites: string[];
  rationale: string;
  competitorCount: number;
};

export type BlogDraft = {
  id: string;
  slug: string;
  geoKey: string;
  title: string;
  description: string;
  h1: string;
  lead?: string;
  body: string;
  profile: string;
  topicId: string;
  status: string;
  createdAt: string;
  publishedAt?: string;
  source?: string;
};

export type BlogAgentReport = {
  generatedAt: string;
  durationMs: number;
  status: "ok" | "info" | "warn" | "error";
  summary: {
    competitorTopics: number;
    equstoArticles: number;
    gapTopics: number;
    draftsTotal: number;
    draftsPending: number;
    currentWeek: string;
    weeklyDraftCreated: boolean;
  };
  checks: Record<string, Record<string, unknown>>;
  gapTopics: TopicGap[];
  latestDraft: BlogDraft | null;
  drafts: BlogDraft[];
  aiSummary: string | null;
  message?: string;
};
