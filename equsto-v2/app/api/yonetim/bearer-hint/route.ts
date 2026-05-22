import { normalizeAdminBearer } from "@/lib/auth";
import { adminErr, adminOk } from "@/lib/admin-response";

/** Giriş sayfası — sunucudaki token uzunluğu ve ön ek (gizli değer açılmaz). */
export async function GET() {
  const expected = normalizeAdminBearer(process.env.EQUSTO_ADMIN_BEARER || "");
  if (!expected) {
    return adminErr(
      "EQUSTO_ADMIN_BEARER Vercel’de tanımlı değil. Production env ekleyip Redeploy yapın.",
      503,
    );
  }
  const prefix = expected.length > 12 ? `${expected.slice(0, 12)}…` : "…";
  return adminOk({
    configured: true,
    length: expected.length,
    prefix,
    hint: `Vercel’deki değer ${expected.length} karakter; «${prefix}» ile başlamalı. Göz ikonundan kopyalayın — sohbetteki örnek key farklı olabilir.`,
  });
}
