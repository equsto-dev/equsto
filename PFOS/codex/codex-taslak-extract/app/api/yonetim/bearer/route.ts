import { NextRequest } from "next/server";
import { normalizeAdminBearer } from "@/lib/auth";
import { adminErr, adminOk } from "@/lib/admin-response";

export const runtime = "nodejs";

/** GET hint | POST check — ?action=hint|check (varsayılan POST=check) */
export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get("action")?.trim() || "hint";
  if (action !== "hint") {
    return adminErr("GET için action=hint kullanın", 400);
  }

  const expected = normalizeAdminBearer(process.env.EQUSTO_ADMIN_BEARER || "");
  if (!expected) {
    return adminErr(
      "EQUSTO_ADMIN_BEARER Vercel'de tanımlı değil. Production env ekleyip Redeploy yapın.",
      503,
    );
  }
  const prefix = expected.length > 12 ? `${expected.slice(0, 12)}…` : "…";
  return adminOk({
    configured: true,
    length: expected.length,
    prefix,
    hint: `Vercel'deki değer ${expected.length} karakter; «${prefix}» ile başlamalı.`,
  });
}

export async function POST(req: NextRequest) {
  const action = req.nextUrl.searchParams.get("action")?.trim() || "check";
  if (action === "hint") return GET(req);

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
        ? `Vercel'deki token ${expectedLen} karakter, forma ${gotLen} karakter gitti.`
        : `Uzunluk aynı (${expectedLen}) ama metin farklı.`,
  });
}
