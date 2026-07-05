import fs from "node:fs";
import path from "node:path";
import type { CatalogAgentReport } from "@/lib/catalog-agent/types";
import { CATALOG_AGENT_REPORT_PATH } from "@/lib/catalog-agent/types";

export function catalogAgentReportFile(): string {
  return path.join(process.cwd(), CATALOG_AGENT_REPORT_PATH);
}

export function readCatalogAgentReport(): CatalogAgentReport | null {
  const file = catalogAgentReportFile();
  if (!fs.existsSync(file)) return null;
  try {
    const raw = fs.readFileSync(file, "utf8");
    return JSON.parse(raw) as CatalogAgentReport;
  } catch {
    return null;
  }
}

export function writeCatalogAgentReport(report: CatalogAgentReport): string {
  const file = catalogAgentReportFile();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(report, null, 2), "utf8");
  return file;
}
