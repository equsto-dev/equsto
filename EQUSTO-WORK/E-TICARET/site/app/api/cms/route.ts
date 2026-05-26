import { NextRequest } from "next/server";
import { assertAdminBearer } from "@/lib/auth";
import { adminErr, adminOk } from "@/lib/admin-response";
import { dataPath, readJsonFile, writeJsonFile } from "@/lib/legacy-data";
import { unwrapProjeAkisPayload } from "@/lib/pfos/proje-akis/unwrap";

export const runtime = "nodejs";

const VITRIN_FILE = () => dataPath("homepage-vitrin.json");
const PROJE_FILE = () => dataPath("proje-akis.json");

const EMPTY_PROJE = {
  questions: [] as unknown[],
  shopTypes: [] as unknown[],
  rules: [] as unknown[],
  eqSets: [] as unknown[],
  products: [] as unknown[],
};

async function loadProjeAkis(req: NextRequest) {
  const fromDisk = await readJsonFile<unknown>(PROJE_FILE());
  const unwrapped = unwrapProjeAkisPayload(fromDisk);
  if (unwrapped) return unwrapped;

  try {
    const staticUrl = new URL("/data/proje-akis.json", req.url);
    const res = await fetch(staticUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    if (res.ok) {
      const remote = await res.json();
      return unwrapProjeAkisPayload(remote);
    }
  } catch {
    /* static fallback failed */
  }

  return null;
}

/** GET/POST /api/cms?kind=vitrin|proje-akis */
export async function GET(req: NextRequest) {
  const kind = req.nextUrl.searchParams.get("kind")?.trim() || "vitrin";

  if (kind === "proje-akis") {
    const stored = await loadProjeAkis(req);
    if (stored) return adminOk({ data: stored });
    return adminOk({ data: EMPTY_PROJE });
  }

  const denied = assertAdminBearer(req);
  if (denied) return denied;

  const file = await readJsonFile<Record<string, unknown>>(VITRIN_FILE());
  if (!file) return adminOk({ data: { version: "1.0", layout: {} } });
  if (file.success && file.data && typeof file.data === "object") {
    return adminOk({ data: file.data as Record<string, unknown> });
  }
  return adminOk({ data: file });
}

export async function POST(req: NextRequest) {
  const denied = assertAdminBearer(req);
  if (denied) return denied;

  const kind = req.nextUrl.searchParams.get("kind")?.trim() || "vitrin";

  if (kind === "proje-akis") {
    const payload = await req.json().catch(() => EMPTY_PROJE);
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
