import fs from "node:fs";
import path from "node:path";
import type { MobileAgentReport } from "@/lib/mobile-agent/types";
import { MOBILE_AGENT_REPORT_PATH } from "@/lib/mobile-agent/types";

export function mobileAgentReportFile(): string {
  return path.join(process.cwd(), MOBILE_AGENT_REPORT_PATH);
}

export function readMobileAgentReport(): MobileAgentReport | null {
  const file = mobileAgentReportFile();
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as MobileAgentReport;
  } catch {
    return null;
  }
}

export function writeMobileAgentReport(report: MobileAgentReport): string {
  const file = mobileAgentReportFile();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(report, null, 2), "utf8");
  return file;
}
