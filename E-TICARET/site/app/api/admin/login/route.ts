import { adminErr, adminOk } from "@/lib/admin-response";
import { adminLoginToken, verifyAdminPassword } from "@/lib/admin-auth";
import { checkRateLimit, clientIpFromRequest } from "@/lib/rate-limit";

export const runtime = "nodejs";

/** POST /api/admin/login — Founder Decision Panel şifre kapısı */
export async function POST(req: Request) {
  const ip = clientIpFromRequest(req);
  // Y2: brute-force koruması — IP başına 10 dk / 5 deneme
  const rl = checkRateLimit(`admin-login:${ip}`, 5, 10 * 60 * 1000);
  if (!rl.ok) {
    return adminErr(`Çok fazla deneme. ${rl.retryAfterSec} sn sonra tekrar deneyin.`, 429);
  }

  const body = (await req.json().catch(() => ({}))) as { password?: string };
  const pw = String(body.password || "").trim();

  if (!(await verifyAdminPassword(pw))) {
    return adminErr("Şifre hatalı", 401);
  }

  return adminOk({ token: adminLoginToken() });
}
