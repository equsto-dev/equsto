import fs from "node:fs";
import path from "node:path";
import type { EnAgentReport } from "@/lib/en-agent/types";
import { EN_AGENT_REPORT_PATH } from "@/lib/en-agent/types";

export function enAgentReportFile(): string {
  return path.join(process.cwd(), EN_AGENT_REPORT_PATH);
}

export function readEnAgentReport(): EnAgentReport | null {
  const file = enAgentReportFile();
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as EnAgentReport;
  } catch {
    return null;
  }
}

export function writeEnAgentReport(report: EnAgentReport): string {
  const file = enAgentReportFile();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(report, null, 2), "utf8");
  return file;
}
