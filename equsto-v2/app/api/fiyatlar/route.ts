import { NextRequest } from "next/server";
import { assertAdminBearer } from "@/lib/auth";
import { adminErr, adminOk } from "@/lib/admin-response";
import { dataPath, readJsonFile, writeJsonFile } from "@/lib/legacy-data";

const FIYATLAR_FILE = () => dataPath("fiyatlar.json");

export async function GET(req: NextRequest) {
  const denied = assertAdminBearer(req);
  if (denied) return denied;

  const file = await readJsonFile<{
    success?: boolean;
    data?: Record<string, number>;
  }>(FIYATLAR_FILE());

  if (file && typeof file === "object" && "data" in file) {
    const inner = (file as { data?: Record<string, number> }).data;
    if (inner && typeof inner === "object") {
      return adminOk({ data: inner });
    }
  }

  if (file?.success && file.data && typeof file.data === "object") {
    return adminOk({ data: file.data });
  }

  if (file && typeof file === "object" && !("success" in file) && !("version" in file)) {
    return adminOk({ data: file as Record<string, number> });
  }

  return adminOk({ data: {} });
}

export async function POST(req: NextRequest) {
  const denied = assertAdminBearer(req);
  if (denied) return denied;

  const body = (await req.json().catch(() => ({}))) as {
    fiyatlar?: Record<string, number>;
  };

  const fiyatlar = body.fiyatlar;
  if (!fiyatlar || typeof fiyatlar !== "object") {
    return adminErr("fiyatlar nesnesi zorunlu", 400);
  }

  try {
    await writeJsonFile(FIYATLAR_FILE(), {
      success: true,
      data: fiyatlar,
      updated_at: new Date().toISOString(),
    });
    const count = Object.keys(fiyatlar).length;
    return adminOk({ count });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Yazma hatası";
    return adminErr(msg, 500);
  }
}
