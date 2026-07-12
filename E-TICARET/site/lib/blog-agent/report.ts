import fs from "node:fs";
import path from "node:path";
import type { BlogAgentReport } from "@/lib/blog-agent/types";
import { BLOG_AGENT_REPORT_PATH } from "@/lib/blog-agent/types";

export function blogAgentReportFile(): string {
  return path.join(process.cwd(), BLOG_AGENT_REPORT_PATH);
}

export function readBlogAgentReport(): BlogAgentReport | null {
  const file = blogAgentReportFile();
  if (!fs.existsSync(file)) return null;
  try {
    const raw = fs.readFileSync(file, "utf8");
    return JSON.parse(raw) as BlogAgentReport;
  } catch {
    return null;
  }
}

export function writeBlogAgentReport(report: BlogAgentReport): string {
  const file = blogAgentReportFile();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(report, null, 2), "utf8");
  return file;
}
