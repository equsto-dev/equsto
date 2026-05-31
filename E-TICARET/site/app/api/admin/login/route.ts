import { adminErr, adminOk } from "@/lib/admin-response";
import { adminLoginToken, verifyAdminPassword } from "@/lib/admin-auth";

export const runtime = "nodejs";

/** POST /api/admin/login — Founder Decision Panel şifre kapısı */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { password?: string };
  const pw = String(body.password || "").trim();

  if (!(await verifyAdminPassword(pw))) {
    return adminErr("Şifre hatalı", 401);
  }

  return adminOk({ token: adminLoginToken() });
}
