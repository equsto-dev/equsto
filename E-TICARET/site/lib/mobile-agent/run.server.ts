import { spawn } from "node:child_process";
import path from "node:path";
import type { MobileAgentReport } from "@/lib/mobile-agent/types";
import { readMobileAgentReport } from "@/lib/mobile-agent/report";

export type RunMobileAgentOptions = {
  quiet?: boolean;
  skipLive?: boolean;
};

export function runMobileAgentScript(
  opts: RunMobileAgentOptions = {},
): Promise<{ report: MobileAgentReport | null; exitCode: number; stderr: string }> {
  const cwd = process.cwd();
  const script = path.join(cwd, "scripts/mobile-agent-run.mjs");
  const args = [script];
  if (opts.quiet) args.push("--quiet");
  if (opts.skipLive) args.push("--no-live");

  const env = { ...process.env };
  if (opts.skipLive) env.MOBILE_AGENT_SKIP_LIVE = "1";

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
        report: readMobileAgentReport(),
        exitCode: code ?? 1,
        stderr: stderr.trim(),
      });
    });
    child.on("error", (err) => {
      resolve({
        report: readMobileAgentReport(),
        exitCode: 1,
        stderr: err.message,
      });
    });
  });
}
