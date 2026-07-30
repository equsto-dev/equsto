import { NextRequest, NextResponse } from "next/server";
import { completeCheckoutCallback } from "@/lib/odeme/siparis-odeme";
import { odemeSonucUrl } from "@/lib/odeme/iyzico";

export const dynamic = "force-dynamic";

async function handleCallback(req: NextRequest): Promise<NextResponse> {
  let token = "";
  try {
    const ct = req.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
      token = String(body.token || "").trim();
    } else {
      const form = await req.formData().catch(() => null);
      if (form) token = String(form.get("token") || "").trim();
    }
  } catch {
    token = "";
  }

  if (!token) {
    const q = req.nextUrl.searchParams.get("token");
    token = String(q || "").trim();
  }

  if (!token) {
    return NextResponse.redirect(
      odemeSonucUrl({ ok: "0", msg: "token-yok" }),
      303,
    );
  }

  try {
    const result = await completeCheckoutCallback(token);
    return NextResponse.redirect(
      odemeSonucUrl({
        ok: result.ok ? "1" : "0",
        no: result.siparisNo,
        durum: result.odemeDurum,
        msg: result.message.slice(0, 120),
      }),
      303,
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "callback-hata";
    return NextResponse.redirect(
      odemeSonucUrl({ ok: "0", msg: msg.slice(0, 120) }),
      303,
    );
  }
}

/** iyzico Checkout Form callback (POST form) */
export async function POST(req: NextRequest) {
  return handleCallback(req);
}

export async function GET(req: NextRequest) {
  return handleCallback(req);
}
