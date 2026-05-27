import { NextRequest } from "next/server";
import { adminErr } from "@/lib/admin-response";

/** admin.html yerel varsayılanı */
export const DEV_ADMIN_BEARER = "equsto2025";

/** .env satırından kopyalanan "token" veya 'token' tırnaklarını kaldırır */
export function normalizeAdminBearer(raw: string): string {
  let s = String(raw ?? "")
    .replace(/^\uFEFF/, "")
    .replace(/\r?\n/g, "")
    .trim();
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

export function readBearer(req: NextRequest): string {
  const auth = req.headers.get("authorization") || "";
  const raw = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  return normalizeAdminBearer(raw);
}

export function assertAdminBearer(req: NextRequest): Response | null {
  const token = readBearer(req);
  const expected = normalizeAdminBearer(process.env.EQUSTO_ADMIN_BEARER || "");

  if (expected && token === expected) return null;

  if (process.env.NODE_ENV !== "production" && (!token || token === DEV_ADMIN_BEARER)) {
    return null;
  }

  if (!expected) {
    return adminErr("EQUSTO_ADMIN_BEARER tanımlı değil (.env)", 503);
  }

  return adminErr("Yetkisiz", 401);
}
