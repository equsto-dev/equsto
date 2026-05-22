import { NextRequest } from "next/server";
import { normalizeAdminBearer } from "@/lib/auth";
import { adminErr, adminOk } from "@/lib/admin-response";

/**
 * Giriş formu — token Vercel EQUSTO_ADMIN_BEARER ile eşleşiyor mu?
 * Gizli değer döndürülmez; yalnızca uzunluk ipucu.
 */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { token?: string };
  const expected = normalizeAdminBearer(process.env.EQUSTO_ADMIN_BEARER || "");
  const got = normalizeAdminBearer(String(body.token ?? ""));

  if (!expected) {
    return adminErr(
      "Sunucuda EQUSTO_ADMIN_BEARER tanımlı değil. Vercel → Environment Variables → Production → Redeploy.",
      503,
    );
  }

  if (!got) {
    return adminOk({
      ok: false,
      reason: "empty",
      expectedLen: expected.length,
      gotLen: 0,
    });
  }

  if (got === expected) {
    return adminOk({ ok: true });
  }

  const expectedLen = expected.length;
  const gotLen = got.length;
  const expPre = expected.length > 10 ? `${expected.slice(0, 10)}…` : "…";
  const gotPre = got.length > 10 ? `${got.slice(0, 10)}…` : "…";
  return adminOk({
    ok: false,
    reason: "mismatch",
    expectedLen,
    gotLen,
    expectedPrefix: expPre,
    gotPrefix: gotPre,
    hint:
      gotLen !== expectedLen
        ? `Vercel’deki token ${expectedLen} karakter, forma ${gotLen} karakter gitti. Alanı temizleyin, Vercel’den göz ikonu ile kopyalayın.`
        : `Uzunluk aynı (${expectedLen}) ama metin farklı. Vercel’de «${expPre}» — sizde «${gotPre}». Sohbetteki örnek key ile Vercel’deki aynı değil; Vercel → EQUSTO_ADMIN_BEARER → göz → tam kopyala.`,
  });
}
