import { NextRequest } from "next/server";
import {
  CATALOG_REBUILD_CMD,
  loadCatalogStats,
} from "@/lib/catalog-meta";
import { adminOk } from "@/lib/admin-response";

export async function GET(req: NextRequest) {
  const verify = req.nextUrl.searchParams.get("verify") === "1";
  const stats = await loadCatalogStats({ verifyLive: verify });

  return adminOk({
    data: stats,
    rebuild: CATALOG_REBUILD_CMD,
    canonical:
      stats.source === "catalog-meta.json"
        ? "public/data/catalog-meta.json"
        : stats.source === "ekipmanlar.json"
          ? "public/data/ekipmanlar.json (meta eksik — rebuild çalıştırın)"
          : "dept/*.json → rebuild",
  });
}
