import { spawn } from "node:child_process";
import path from "node:path";
import type { EnAgentReport } from "@/lib/en-agent/types";
import { readEnAgentReport } from "@/lib/en-agent/report";

export type RunEnAgentOptions = {
  quiet?: boolean;
  skipLive?: boolean;
};

export function runEnAgentScript(
  opts: RunEnAgentOptions = {},
): Promise<{ report: EnAgentReport | null; exitCode: number; stderr: string }> {
  const cwd = process.cwd();
  const script = path.join(cwd, "scripts/en-agent-run.mjs");
  const args = [script];
  if (opts.quiet) args.push("--quiet");
  if (opts.skipLive) args.push("--no-live");

  const env = { ...process.env };
  if (opts.skipLive) env.EN_AGENT_SKIP_LIVE = "1";

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
        report: readEnAgentReport(),
        exitCode: code ?? 1,
        stderr: stderr.trim(),
      });
    });
    child.on("error", (err) => {
      resolve({
        report: readEnAgentReport(),
        exitCode: 1,
        stderr: err.message,
      });
    });
  });
}
