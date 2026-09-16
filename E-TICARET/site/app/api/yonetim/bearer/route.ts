import { NextRequest } from "next/server";
import { normalizeAdminBearer } from "@/lib/auth";
import { adminErr, adminOk } from "@/lib/admin-response";
import { safeEqualString } from "@/lib/safe-equal";

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
      "EQUSTO_ADMIN_BEARER sunucuda tanımlı değil.",
      503,
    );
  }

  // GÜVENLİK (K1 Kapatıldı): Artık uzunluk veya prefix sızdırmıyoruz.
  return adminOk({
    configured: true,
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
      "Sunucuda EQUSTO_ADMIN_BEARER tanımlı değil.",
      503,
    );
  }

  if (!got) {
    return adminOk({
      ok: false,
      reason: "empty",
    });
  }

  const isValid = safeEqualString(got, expected);

  if (isValid) {
    return adminOk({ ok: true });
  }

  // GÜVENLİK (K1 Kapatıldı): Mismatch durumunda HİÇBİR İPUCU (uzunluk/prefix) vermiyoruz.
  return adminOk({
    ok: false,
    reason: "mismatch",
  });
}
