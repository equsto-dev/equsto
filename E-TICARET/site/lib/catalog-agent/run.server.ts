import { spawn } from "node:child_process";
import path from "node:path";
import type { CatalogAgentReport } from "@/lib/catalog-agent/types";
import { readCatalogAgentReport } from "@/lib/catalog-agent/report";

export type RunCatalogAgentOptions = {
  quiet?: boolean;
};

export function runCatalogAgentScript(
  opts: RunCatalogAgentOptions = {},
): Promise<{ report: CatalogAgentReport | null; exitCode: number; stderr: string }> {
  const cwd = process.cwd();
  const script = path.join(cwd, "scripts/catalog-agent-run.mjs");
  const args = [script];
  if (opts.quiet) args.push("--quiet");

  return new Promise((resolve) => {
    let stderr = "";
    const child = spawn(process.execPath, args, {
      cwd,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    child.stderr?.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("close", (code) => {
      resolve({
        report: readCatalogAgentReport(),
        exitCode: code ?? 1,
        stderr: stderr.trim(),
      });
    });
    child.on("error", (err) => {
      resolve({
        report: readCatalogAgentReport(),
        exitCode: 1,
        stderr: err.message,
      });
    });
  });
}
