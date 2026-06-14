import { createHash, randomInt } from "node:crypto";
import { db } from "@/lib/db";
import { sendResendEmail } from "@/lib/email/resend-send";
import { hashPassword, normalizeEmail } from "@/lib/member-auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_TTL_MIN = 15;
const MAX_REQUESTS_PER_HOUR = 5;

function hashResetCode(code: string): string {
  const pepper = process.env.EQUSTO_RESET_CODE_PEPPER?.trim() || "equsto-reset";
  return createHash("sha256").update(`${pepper}:${code}`).digest("hex");
}

function generateCode(): string {
  return String(randomInt(100000, 999999));
}

const GENERIC_OK =
  "Kayıtlı bir e-posta hesabınız varsa kurtarma kodu gönderildi. Gelen kutunuzu ve spam klasörünü kontrol edin.";

export async function requestMemberPasswordReset(
  email: string,
): Promise<{ message: string }> {
  const norm = normalizeEmail(email);
  if (!EMAIL_RE.test(norm)) throw new Error("Geçerli e-posta girin");

  const member = await db.shopMember.findUnique({ where: { email: norm } });
  if (!member) {
    return { message: GENERIC_OK };
  }

  if (!member.passwordHash) {
    await sendResendEmail({
      to: norm,
      subject: "Equsto — şifre sıfırlama",
      text:
        "Equsto hesabınız Google ile oluşturulmuş.\n\n" +
        "Şifre sıfırlama yerine giriş sayfasında «Google ile devam et» seçeneğini kullanın.",
      html:
        "<p>Equsto hesabınız <strong>Google</strong> ile oluşturulmuş.</p>" +
        "<p>Şifre sıfırlama yerine giriş sayfasında <strong>Google ile devam et</strong> seçeneğini kullanın.</p>",
    }).catch(() => undefined);
    return { message: GENERIC_OK };
  }

  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentCount = await db.shopMemberPasswordReset.count({
    where: { memberId: member.id, createdAt: { gte: hourAgo } },
  });
  if (recentCount >= MAX_REQUESTS_PER_HOUR) {
    throw new Error("Çok fazla deneme. Lütfen bir saat sonra tekrar deneyin.");
  }

  await db.shopMemberPasswordReset.deleteMany({
    where: { memberId: member.id, usedAt: null },
  });

  const code = generateCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_MIN * 60 * 1000);

  await db.shopMemberPasswordReset.create({
    data: {
      memberId: member.id,
      codeHash: hashResetCode(code),
      expiresAt,
    },
  });

  const mail = await sendResendEmail({
    to: norm,
    subject: "Equsto şifre kurtarma kodu",
    text:
      `Equsto şifre kurtarma kodunuz: ${code}\n\n` +
      `Kod ${CODE_TTL_MIN} dakika geçerlidir. Bu isteği siz yapmadıysanız e-postayı yok sayın.`,
    html:
      `<p>Equsto şifre kurtarma kodunuz:</p>` +
      `<p style="font-size:26px;font-weight:700;letter-spacing:6px;margin:16px 0">${code}</p>` +
      `<p>Kod <strong>${CODE_TTL_MIN} dakika</strong> geçerlidir. Bu isteği siz yapmadıysanız e-postayı yok sayın.</p>`,
  });

  if (!mail.ok && !mail.skipped) {
    console.warn("[password-reset] email failed:", mail.error);
    throw new Error("E-posta gönderilemedi. Lütfen daha sonra tekrar deneyin.");
  }

  return { message: GENERIC_OK };
}

export async function resetMemberPasswordWithCode(
  email: string,
  code: string,
  password: string,
  passwordConfirm: string,
): Promise<void> {
  const norm = normalizeEmail(email);
  if (!EMAIL_RE.test(norm)) throw new Error("Geçerli e-posta girin");
  const codeNorm = String(code || "").trim();
  if (!/^\d{6}$/.test(codeNorm)) throw new Error("6 haneli kurtarma kodunu girin");
  if (String(password || "").length < 8) throw new Error("Şifre en az 8 karakter olmalı");
  if (password !== passwordConfirm) throw new Error("Şifreler eşleşmiyor");

  const member = await db.shopMember.findUnique({ where: { email: norm } });
  if (!member) throw new Error("Kurtarma kodu geçersiz veya süresi dolmuş");

  const row = await db.shopMemberPasswordReset.findFirst({
    where: {
      memberId: member.id,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!row || row.codeHash !== hashResetCode(codeNorm)) {
    throw new Error("Kurtarma kodu geçersiz veya süresi dolmuş");
  }

  await db.shopMember.update({
    where: { id: member.id },
    data: { passwordHash: hashPassword(password) },
  });

  await db.shopMemberPasswordReset.update({
    where: { id: row.id },
    data: { usedAt: new Date() },
  });

  await db.shopMemberSession.deleteMany({ where: { memberId: member.id } });
}
