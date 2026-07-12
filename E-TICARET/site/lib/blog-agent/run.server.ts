import { spawn } from "node:child_process";
import path from "node:path";
import type { BlogAgentReport } from "@/lib/blog-agent/types";
import { readBlogAgentReport } from "@/lib/blog-agent/report";

export type RunBlogAgentOptions = {
  quiet?: boolean;
  forceDraft?: boolean;
  skipAi?: boolean;
  topicId?: string;
};

export function runBlogAgentScript(
  opts: RunBlogAgentOptions = {},
): Promise<{ report: BlogAgentReport | null; exitCode: number; stderr: string }> {
  const cwd = process.cwd();
  const script = path.join(cwd, "scripts/blog-agent-run.mjs");
  const args = [script];
  if (opts.quiet) args.push("--quiet");
  if (opts.forceDraft) args.push("--force");
  if (opts.skipAi) args.push("--no-ai");

  const env = { ...process.env };
  if (opts.topicId) env.BLOG_AGENT_TOPIC_ID = opts.topicId;

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
        report: readBlogAgentReport(),
        exitCode: code ?? 1,
        stderr: stderr.trim(),
      });
    });
    child.on("error", (err) => {
      resolve({
        report: readBlogAgentReport(),
        exitCode: 1,
        stderr: err.message,
      });
    });
  });
}
