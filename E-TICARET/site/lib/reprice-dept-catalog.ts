import { spawn } from "node:child_process";
import { access, constants } from "node:fs/promises";
import path from "node:path";

export async function repriceDeptCatalogFromTcmb(opts?: {
  timeoutMs?: number;
}): Promise<{
  ran: boolean;
  skipped?: string;
  status?: number;
  log?: string;
}> {
  const root = process.cwd();
  const script = path.join(root, "scripts/reprice-all-from-tcmb-kur.mjs");
  const dept = path.join(root, "public/data/dept");
  try {
    await access(script, constants.R_OK);
    await access(dept, constants.W_OK);
  } catch {
    return { ran: false, skipped: "dept JSON yazılamıyor" };
  }

  const timeoutMs = opts?.timeoutMs ?? 45_000;
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    const child = spawn(process.execPath, [script], {
      cwd: root,
      env: process.env,
    });
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
    }, timeoutMs);
    child.stdout.on("data", (d: Buffer) => chunks.push(d));
    child.stderr.on("data", (d: Buffer) => chunks.push(d));
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({
        ran: true,
        status: code ?? 1,
        log: Buffer.concat(chunks).toString("utf8").slice(0, 4000),
      });
    });
  });
}
