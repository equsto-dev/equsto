import { NextRequest } from "next/server";
import { assertAdminBearer } from "@/lib/auth";
import { adminErr, adminOk } from "@/lib/admin-response";
import { dataPath, readJsonFile, writeJsonFile } from "@/lib/legacy-data";
import { PFOS_KONSEPT_SHOP_TYPES } from "@/lib/pfos/proje-akis/konsept-tanimlari";
import { DEFAULT_WIZARD_QUESTIONS } from "@/lib/pfos/proje-akis/wizard-questions";
import { unwrapProjeAkisPayload } from "@/lib/pfos/proje-akis/unwrap";

export const runtime = "nodejs";

const PROJE_FILE = () => dataPath("proje-akis.json");

/** POST — Ant Design Pro kanonik soru + konsept; legacy kural/set temizlenir; products korunur */
export async function POST(req: NextRequest) {
  const denied = assertAdminBearer(req);
  if (denied) return denied;

  const existing = await readJsonFile<unknown>(PROJE_FILE());
  const unwrapped = unwrapProjeAkisPayload(existing);
  const prevProducts = Array.isArray(unwrapped?.products) ? unwrapped.products : [];

  const data = {
    questions: DEFAULT_WIZARD_QUESTIONS,
    shopTypes: PFOS_KONSEPT_SHOP_TYPES,
    rules: [] as unknown[],
    eqSets: [] as unknown[],
    products: prevProducts,
    updated_at: new Date().toISOString(),
  };

  try {
    await writeJsonFile(PROJE_FILE(), { success: true, data });
    return adminOk({
      data,
      meta: {
        soruCount: DEFAULT_WIZARD_QUESTIONS.length,
        konseptCount: PFOS_KONSEPT_SHOP_TYPES.length,
        productCount: prevProducts.length,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Kayıt hatası";
    return adminErr(msg, 500);
  }
}
