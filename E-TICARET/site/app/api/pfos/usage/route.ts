import { NextRequest } from "next/server";
import { assertAdminBearer } from "@/lib/auth";
import { adminErr, adminOk } from "@/lib/admin-response";
import {
  listPfosUsageEvents,
  pfosUsageOzet,
  recordPfosUsageEvent,
  type PfosUsageEventKind,
  type PfosUsageSource,
} from "@/lib/pfos/usage-log";

export const dynamic = "force-dynamic";

const EVENTS = new Set<PfosUsageEventKind>(["quote_generated", "quote_sent"]);
const SOURCES = new Set<PfosUsageSource>(["wizard", "liste"]);

function parseBody(body: Record<string, unknown>) {
  const event = String(body.event ?? "").trim() as PfosUsageEventKind;
  if (!EVENTS.has(event)) return { error: "Geçersiz event" as const };

  const source = String(body.source ?? "wizard").trim() as PfosUsageSource;
  if (!SOURCES.has(source) && event === "quote_generated") {
    return { error: "Geçersiz source" as const };
  }

  return {
    data: {
      event,
      source: SOURCES.has(source) ? source : "wizard",
      konsept: String(body.konsept ?? ""),
      konseptLabel: String(body.konseptLabel ?? body.konsept_label ?? ""),
      m2: body.m2 != null ? Number(body.m2) : null,
      teklifSayi: String(body.teklifSayi ?? body.teklif_sayi ?? ""),
      teklifRef: String(body.teklifRef ?? body.teklif_ref ?? ""),
      kalemSayisi: Number(body.kalemSayisi ?? body.kalem_sayisi ?? 0),
      toplamTry: body.toplamTry != null ? Number(body.toplamTry) : body.toplam_try != null ? Number(body.toplam_try) : null,
      toplamEur: body.toplamEur != null ? Number(body.toplamEur) : body.toplam_eur != null ? Number(body.toplam_eur) : null,
      sehir: String(body.sehir ?? ""),
      memberLoggedIn: !!(body.memberLoggedIn ?? body.member_logged_in),
      memberId: body.memberId != null ? String(body.memberId) : body.member_id != null ? String(body.member_id) : null,
      gonderimKanal:
        body.gonderimKanal != null
          ? String(body.gonderimKanal)
          : body.gonderim_kanal != null
            ? String(body.gonderim_kanal)
            : null,
    },
  };
}

/** Anonim PFOS kullanım logu (teklif üretildi). */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const parsed = parseBody(body);
    if ("error" in parsed) return adminErr(parsed.error, 400);

    const row = await recordPfosUsageEvent(parsed.data);
    return adminOk({ data: row, deduped: row == null }, row ? 201 : 200);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Log kaydedilemedi";
    return adminErr(msg, 503);
  }
}

/** Admin — PFOS kullanım özeti ve son olaylar */
export async function GET(req: NextRequest) {
  const denied = assertAdminBearer(req);
  if (denied) return denied;

  const sp = req.nextUrl.searchParams;
  const days = Math.min(Math.max(Number(sp.get("days") || 30), 1), 365);
  const limit = Math.min(Math.max(Number(sp.get("limit") || 200), 1), 2000);

  try {
    const [ozet, rows] = await Promise.all([
      pfosUsageOzet(days),
      listPfosUsageEvents(limit, days),
    ]);
    return adminOk({ data: { ozet, rows, count: rows.length } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "PFOS kullanım raporu alınamadı";
    return adminErr(msg, 503);
  }
}
