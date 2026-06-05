import { NextRequest } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { adminOk, adminErr } from "@/lib/admin-response";
import {
  applyI18nOverrides,
  loadMagazaAyarlari,
} from "@/lib/magaza-ayarlari";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ locale: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { locale } = await ctx.params;
  const lang = String(locale ?? "tr").toLowerCase().replace(/[^a-z-]/g, "");
  if (!lang || lang.length > 8) {
    return adminErr("Geçersiz locale", 400);
  }

  const filePath = path.join(process.cwd(), "public", "i18n", `${lang}.json`);
  let base: Record<string, unknown> = {};
  try {
    const raw = await fs.readFile(filePath, "utf8");
    base = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return adminErr("Locale dosyası bulunamadı", 404);
  }

  const ayar = await loadMagazaAyarlari();
  const overrides = ayar.i18n_overrides[lang] ?? {};
  const merged =
    Object.keys(overrides).length > 0
      ? applyI18nOverrides(base, overrides)
      : base;

  return adminOk({ data: merged, locale: lang });
}
