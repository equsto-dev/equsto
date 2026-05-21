import { NextRequest } from "next/server";
import { adminErr } from "@/lib/admin-response";

/** admin.html yerel varsayılanı */
export const DEV_ADMIN_BEARER = "equsto2025";

export function readBearer(req: NextRequest): string {
  const auth = req.headers.get("authorization") || "";
  return auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
}

export function assertAdminBearer(req: NextRequest): Response | null {
  const token = readBearer(req);
  const expected = process.env.EQUSTO_ADMIN_BEARER?.trim();

  if (expected && token === expected) return null;

  if (process.env.NODE_ENV !== "production" && (!token || token === DEV_ADMIN_BEARER)) {
    return null;
  }

  if (!expected) {
    return adminErr("EQUSTO_ADMIN_BEARER tanımlı değil (.env)", 503);
  }

  return adminErr("Yetkisiz", 401);
}
