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
  return adminOk({
    ok: false,
    reason: "mismatch",
    expectedLen,
    gotLen,
    hint:
      gotLen !== expectedLen
        ? `Uzunluk uyuşmuyor (${gotLen} ≠ ${expectedLen}). Vercel panelinden değeri tekrar kopyalayın; tırnak kullanmayın.`
        : "Uzunluk aynı ama karakterler farklı. Vercel Production env ile birebir aynı token girin; yeni token ürettiyseniz eski eq_adm_… değil, Vercel’deki yeni değeri kullanın.",
  });
}
