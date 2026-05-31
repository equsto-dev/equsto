import { NextRequest } from "next/server";
import { assertAdminBearer } from "@/lib/auth";
import { adminErr } from "@/lib/admin-response";

export const runtime = "nodejs";
export const maxDuration = 300;

const PROXY_BASE = (
  process.env.CLAUDE_API_PROXY_URL ||
  process.env.EQUSTO_CLAUDE_API_BASE ||
  "http://127.0.0.1:3001/api"
).replace(/\/$/, "");

/** POST /api/import/analiz — claude-api-proxy vekili (PDF/Excel ekipman analizi) */
export async function POST(req: NextRequest) {
  const denied = assertAdminBearer(req);
  if (denied) return denied;

  let body: string;
  try {
    body = await req.text();
  } catch {
    return adminErr("Gövde okunamadı", 400);
  }

  const auth = req.headers.get("authorization") || "";

  try {
    const upstream = await fetch(`${PROXY_BASE}/import/analiz`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(auth ? { Authorization: auth } : {}),
      },
      body,
      signal: AbortSignal.timeout(20 * 60 * 1000),
    });

    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return adminErr(
      `Import proxy ulaşılamadı (${PROXY_BASE}): ${msg}. Yerelde npm run api çalıştırın.`,
      502,
    );
  }
}
