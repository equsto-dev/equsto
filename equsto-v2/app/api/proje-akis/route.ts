import { NextRequest } from "next/server";
import { assertAdminBearer } from "@/lib/auth";
import { adminErr, adminOk } from "@/lib/admin-response";
import { dataPath, readJsonFile, writeJsonFile } from "@/lib/legacy-data";

const PROJE_FILE = () => dataPath("proje-akis.json");

const EMPTY = {
  questions: [] as unknown[],
  shopTypes: [] as unknown[],
  rules: [] as unknown[],
  eqSets: [] as unknown[],
  products: [] as unknown[],
};

export async function GET(req: NextRequest) {
  const denied = assertAdminBearer(req);
  if (denied) return denied;

  const stored = await readJsonFile<typeof EMPTY & { success?: boolean; data?: typeof EMPTY }>(
    PROJE_FILE()
  );

  if (stored?.success && stored.data) {
    return adminOk({ data: stored.data });
  }
  if (stored && "questions" in stored) {
    return adminOk({ data: stored });
  }

  return adminOk({ data: EMPTY });
}

export async function POST(req: NextRequest) {
  const denied = assertAdminBearer(req);
  if (denied) return denied;

  const payload = await req.json().catch(() => EMPTY);
  const data = {
    questions: Array.isArray(payload.questions) ? payload.questions : [],
    shopTypes: Array.isArray(payload.shopTypes) ? payload.shopTypes : [],
    rules: Array.isArray(payload.rules) ? payload.rules : [],
    eqSets: Array.isArray(payload.eqSets) ? payload.eqSets : [],
    products: Array.isArray(payload.products) ? payload.products : [],
    updated_at: new Date().toISOString(),
  };

  try {
    await writeJsonFile(PROJE_FILE(), { success: true, data });
    return adminOk({ data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Kayıt hatası";
    return adminErr(msg, 500);
  }
}
