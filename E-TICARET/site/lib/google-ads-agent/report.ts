import fs from "node:fs";
import path from "node:path";
import type { GoogleAdsAgentReport } from "@/lib/google-ads-agent/types";
import { GOOGLE_ADS_AGENT_REPORT_PATH } from "@/lib/google-ads-agent/types";

export function googleAdsAgentReportFile(): string {
  return path.join(process.cwd(), GOOGLE_ADS_AGENT_REPORT_PATH);
}

export function readGoogleAdsAgentReport(): GoogleAdsAgentReport | null {
  const file = googleAdsAgentReportFile();
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as GoogleAdsAgentReport;
  } catch {
    return null;
  }
}

export function writeGoogleAdsAgentReport(report: GoogleAdsAgentReport): string {
  const file = googleAdsAgentReportFile();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(report, null, 2), "utf8");
  return file;
}
