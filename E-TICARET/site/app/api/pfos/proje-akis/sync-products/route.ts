import { NextRequest } from "next/server";
import { readFile } from "node:fs/promises";
import { assertAdminBearer } from "@/lib/auth";
import { adminErr, adminOk } from "@/lib/admin-response";
import { readJsonFile } from "@/lib/legacy-data";
import { dataPath, writeJsonFile } from "@/lib/legacy-data-fs";
import { unwrapProjeAkisPayload } from "@/lib/pfos/proje-akis/unwrap";

export const runtime = "nodejs";

const DEPT_TO_CAT: Record<string, string> = {
  pisirme: "pisirme",
  sogutma: "sogutma",
  icecek: "icecek",
  yikama: "yikama",
  hazirlik: "hazirlik",
  tezgah: "tezgah_davlumbaz",
  depolama: "depolama",
  araba: "araba",
  yardimci: "yardimci",
  sunum: "sunum",
  diger: "diger",
};

function ecomId(name: string, i: number) {
  const idSafe = name
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `ecom_${idSafe || "p"}_${i}`;
}

type EkipRow = {
  name?: string;
  brand?: string;
  model?: string;
  sku?: string;
  dept?: string;
};

function rowToProjeProduct(u: EkipRow, i: number) {
  const name = String(u?.name ?? "").trim();
  const dept = String(u?.dept ?? "").trim();
  return {
    id: ecomId(name, i),
    cat: DEPT_TO_CAT[dept] ?? "diger",
    name,
    brand: String(u?.brand ?? ""),
    model: String(u?.model ?? u?.sku ?? ""),
    tip_kodu: String(u?.sku ?? u?.model ?? ""),
  };
}

/** POST — products[] = güncel ekipmanlar.json (7530) */
export async function POST(req: NextRequest) {
  const denied = assertAdminBearer(req);
  if (denied) return denied;

  const file = dataPath("ekipmanlar.json");
  let raw: unknown;
  try {
    raw = JSON.parse(await readFile(file, "utf8"));
  } catch (e) {
    const msg = e instanceof Error ? e.message : "ekipmanlar.json okunamadı";
    return adminErr(msg, 500);
  }

  const rows = Array.isArray(raw) ? raw : [];
  if (!rows.length) return adminErr("ekipmanlar.json boş", 400);

  const products = (rows as EkipRow[]).map(rowToProjeProduct);

  const existing = await readJsonFile<unknown>("proje-akis.json");
  const unwrapped = unwrapProjeAkisPayload(existing);
  const prevCount = Array.isArray(unwrapped?.products) ? unwrapped.products.length : 0;

  const data = {
    questions: unwrapped?.questions ?? [],
    shopTypes: unwrapped?.shopTypes ?? [],
    rules: unwrapped?.rules ?? [],
    eqSets: unwrapped?.eqSets ?? [],
    products,
    updated_at: new Date().toISOString(),
  };

  try {
    await writeJsonFile(dataPath("proje-akis.json"), { success: true, data });
    return adminOk({
      data,
      meta: {
        onceki: prevCount,
        yeni: products.length,
        kaynak: "ekipmanlar.json",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Kayıt hatası";
    return adminErr(msg, 500);
  }
}
