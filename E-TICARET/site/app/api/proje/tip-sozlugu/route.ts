import { NextRequest } from "next/server";
import { assertAdminBearer } from "@/lib/auth";
import { adminErr, adminOk } from "@/lib/admin-response";
import { rebuildTipSozlugu } from "@/lib/tip-sozlugu/rebuild";
import { loadTipSozluguEntries, saveTipSozluguEntries } from "@/lib/tip-sozlugu/store";

export const runtime = "nodejs";

/** GET/POST /api/proje/tip-sozlugu — ?sync=1 ile katalogdan yenile */
export async function GET(req: NextRequest) {
  const denied = assertAdminBearer(req);
  if (denied) return denied;

  if (req.nextUrl.searchParams.get("sync") === "1") {
    const { entries, stats } = await rebuildTipSozlugu();
    const file = await saveTipSozluguEntries(entries);
    return adminOk({ data: entries, count: entries.length, synced: true, stats, updated: file.updated });
  }

  let entries = await loadTipSozluguEntries();
  if (!entries.length) {
    const { entries: rebuilt } = await rebuildTipSozlugu();
    await saveTipSozluguEntries(rebuilt);
    entries = rebuilt;
  }
  return adminOk({ data: entries, count: entries.length });
}

export async function POST(req: NextRequest) {
  const denied = assertAdminBearer(req);
  if (denied) return denied;

  const { entries, stats } = await rebuildTipSozlugu();
  const file = await saveTipSozluguEntries(entries);
  return adminOk({
    data: entries,
    count: entries.length,
    synced: true,
    stats,
    updated: file.updated,
  });
}
