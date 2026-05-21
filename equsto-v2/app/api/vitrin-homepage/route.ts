import { NextRequest } from "next/server";
import { assertAdminBearer } from "@/lib/auth";
import { adminErr, adminOk } from "@/lib/admin-response";
import { dataPath, readJsonFile, writeJsonFile } from "@/lib/legacy-data";

const VITRIN_FILE = () => dataPath("homepage-vitrin.json");

export async function GET(req: NextRequest) {
  const denied = assertAdminBearer(req);
  if (denied) return denied;

  const file = await readJsonFile<Record<string, unknown>>(VITRIN_FILE());
  if (!file) {
    return adminOk({ data: { version: "1.0", layout: {} } });
  }

  if (file.success && file.data && typeof file.data === "object") {
    return adminOk({ data: file.data as Record<string, unknown> });
  }

  return adminOk({ data: file });
}

export async function POST(req: NextRequest) {
  const denied = assertAdminBearer(req);
  if (denied) return denied;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return adminErr("Geçersiz vitrin gövdesi", 400);
  }

  const data =
    "data" in body && body.data && typeof body.data === "object"
      ? (body.data as Record<string, unknown>)
      : (body as Record<string, unknown>);

  try {
    await writeJsonFile(VITRIN_FILE(), {
      ...data,
      updated: new Date().toISOString().slice(0, 10),
    });
    return adminOk({ data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Kayıt hatası";
    return adminErr(msg, 500);
  }
}
