import { NextRequest } from "next/server";
import { adminErr } from "@/lib/admin-response";

/** Vercel Cron: Authorization: Bearer CRON_SECRET */
export function assertCronSecret(req: NextRequest): Response | null {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return adminErr("CRON_SECRET tanımlı değil", 503);
  const auth = req.headers.get("authorization") || "";
  if (auth === `Bearer ${secret}`) return null;
  return adminErr("Yetkisiz", 401);
}
