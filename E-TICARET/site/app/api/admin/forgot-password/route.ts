import { adminErr, adminOk } from "@/lib/admin-response";
import {
  adminLoginToken,
  adminRecoveryCode,
  sha256AdminPassword,
  writeAdminPwHash,
} from "@/lib/admin-auth";

export const runtime = "nodejs";

/** POST /api/admin/forgot-password — kurtarma kodu ile şifre sıfırlama */
export async function POST(req: Request) {
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

  if (code !== recovery) {
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

  return adminOk({
    token: adminLoginToken(),
    pw_sha256: hash,
    persisted,
    message: persisted
      ? "Şifre güncellendi. Yeni şifre ile giriş yapabilirsiniz."
      : "Şifre güncellendi (bu oturum). Kalıcı kayıt için Vercel env EQUSTO_ADMIN_PW_SHA256 güncelleyin.",
  });
}
