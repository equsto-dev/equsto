import { NextRequest } from "next/server";
import { assertAdminBearer } from "@/lib/auth";
import { adminErr, adminOk } from "@/lib/admin-response";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const denied = assertAdminBearer(req);
  if (denied) return denied;

  try {
    const [brands, categories] = await Promise.all([
      db.brand.findMany({
        orderBy: { name: "asc" },
        select: { id: true, slug: true, name: true },
      }),
      db.category.findMany({
        orderBy: { name: "asc" },
        select: { id: true, slug: true, name: true },
      }),
    ]);
    return adminOk({ brands, categories });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Meta okunamadı";
    return adminErr(msg, 503);
  }
}
