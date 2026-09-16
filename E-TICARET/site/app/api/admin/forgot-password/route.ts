import { adminErr, adminOk } from "@/lib/admin-response";
import {
  sha256AdminPassword,
  verifyAdminRecoveryCode,
  writeAdminPwHash,
  adminRecoveryCode,
} from "@/lib/admin-auth";
import { checkRateLimit, clientIpFromRequest } from "@/lib/rate-limit";

export const runtime = "nodejs";

/** POST /api/admin/forgot-password — kurtarma kodu ile şifre sıfırlama */
export async function POST(req: Request) {
  const ip = clientIpFromRequest(req);
  const rl = checkRateLimit(`admin-forgot:${ip}`, 5, 15 * 60 * 1000);
  if (!rl.ok) {
    return adminErr(`Çok fazla deneme. ${rl.retryAfterSec} sn sonra tekrar deneyin.`, 429);
  }

  const recovery = adminRecoveryCode();
  if (!recovery) {
    return adminErr(
      "Kurtarma kodu sunucuda tanımlı değil (EQUSTO_ADMIN_RECOVERY_CODE)",
      503,
    );
  }

  const body = (await req.json().catch(() => ({}))) as {
    recovery_code?: string;
    password?: string;
    password_confirm?: string;
  };

  const code = String(body.recovery_code || "").trim();
  const pw = String(body.password || "").trim();
  const pw2 = String(body.password_confirm || "").trim();

  if (!verifyAdminRecoveryCode(code)) {
    return adminErr("Kurtarma kodu hatalı", 401);
  }
  if (!pw || pw.length < 8) {
    return adminErr("Yeni şifre en az 8 karakter olmalı", 400);
  }
  if (pw !== pw2) {
    return adminErr("Şifreler eşleşmiyor", 400);
  }

  const hash = sha256AdminPassword(pw);
  let persisted = true;
  try {
    await writeAdminPwHash(hash);
  } catch (err) {
    persisted = false;
    console.warn("[admin/forgot-password] admin-auth.json yazılamadı:", err);
  }

  // Bearer / hash yanıtta dönülmez — sızıntı riski
  return adminOk({
    persisted,
    message: persisted
      ? "Şifre güncellendi. Yeni şifre ile giriş yapabilirsiniz."
      : "Şifre güncellendi (geçici). Kalıcı için EQUSTO_ADMIN_PW_SHA256 env güncelleyin.",
  });
}
