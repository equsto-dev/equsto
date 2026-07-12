import { spawn } from "node:child_process";
import path from "node:path";
import type { GoogleAdsAgentReport } from "@/lib/google-ads-agent/types";
import { readGoogleAdsAgentReport } from "@/lib/google-ads-agent/report";

export type RunGoogleAdsAgentOptions = {
  quiet?: boolean;
  skipLive?: boolean;
};

export function runGoogleAdsAgentScript(
  opts: RunGoogleAdsAgentOptions = {},
): Promise<{ report: GoogleAdsAgentReport | null; exitCode: number; stderr: string }> {
  const cwd = process.cwd();
  const script = path.join(cwd, "scripts/google-ads-agent-run.mjs");
  const args = [script];
  if (opts.quiet) args.push("--quiet");
  if (opts.skipLive) args.push("--no-live");

  const env = { ...process.env };
  if (opts.skipLive) env.GOOGLE_ADS_AGENT_SKIP_LIVE = "1";

  return new Promise((resolve) => {
    let stderr = "";
    const child = spawn(process.execPath, args, {
      cwd,
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    child.stderr?.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("close", (code) => {
      resolve({
        report: readGoogleAdsAgentReport(),
        exitCode: code ?? 1,
        stderr: stderr.trim(),
      });
    });
    child.on("error", (err) => {
      resolve({
        report: readGoogleAdsAgentReport(),
        exitCode: 1,
        stderr: err.message,
      });
    });
  });
}
