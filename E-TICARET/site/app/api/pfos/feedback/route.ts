import { NextRequest } from "next/server";
import { assertAdminBearer } from "@/lib/auth";
import { adminErr, adminOk } from "@/lib/admin-response";
import {
  listPfosFeedbackEvents,
  pfosFeedbackOzet,
  recordPfosFeedback,
} from "@/lib/pfos/feedback-log";
import {
  PFOS_FEEDBACK_SOURCES,
  PFOS_FEEDBACK_VOTES,
  type PfosFeedbackLogInput,
  type PfosFeedbackSource,
  type PfosFeedbackVote,
  type PfosKalemDuzeltme,
} from "@/lib/pfos/feedback-types";

export const dynamic = "force-dynamic";

function parseKalemDuzeltmeleri(raw: unknown): PfosKalemDuzeltme[] {
  if (!Array.isArray(raw)) return [];
  const out: PfosKalemDuzeltme[] = [];
  for (const item of raw.slice(0, 3)) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const poz = String(o.poz ?? "").trim();
    if (!poz) continue;
    out.push({
      poz,
      referansIsim:
        o.referansIsim != null
          ? String(o.referansIsim)
          : o.referans_isim != null
            ? String(o.referans_isim)
            : undefined,
      yanlisSku:
        o.yanlisSku != null
          ? String(o.yanlisSku)
          : o.yanlis_sku != null
            ? String(o.yanlis_sku)
            : null,
      yanlisAd:
        o.yanlisAd != null
          ? String(o.yanlisAd)
          : o.yanlis_ad != null
            ? String(o.yanlis_ad)
            : null,
      dogruSku:
        o.dogruSku != null
          ? String(o.dogruSku)
          : o.dogru_sku != null
            ? String(o.dogru_sku)
            : null,
      sorunTipi: String(o.sorunTipi ?? o.sorun_tipi ?? "genel"),
      not: o.not != null ? String(o.not) : null,
    });
  }
  return out;
}

function parseBody(body: Record<string, unknown>):
  | { error: string }
  | { data: PfosFeedbackLogInput } {
  const vote = String(body.vote ?? "").trim() as PfosFeedbackVote;
  if (!PFOS_FEEDBACK_VOTES.includes(vote)) {
    return { error: "Geçersiz vote (up | down)" };
  }

  const source = String(body.source ?? "wizard").trim() as PfosFeedbackSource;
  if (!PFOS_FEEDBACK_SOURCES.includes(source)) {
    return { error: "Geçersiz source" };
  }

  const kalemRaw = body.kalemDuzeltmeleri ?? body.kalem_duzeltmeleri;

  return {
    data: {
      vote,
      source,
      teklifSayi: String(body.teklifSayi ?? body.teklif_sayi ?? ""),
      snapshotId:
        body.snapshotId != null
          ? String(body.snapshotId)
          : body.snapshot_id != null
            ? String(body.snapshot_id)
            : null,
      konsept: String(body.konsept ?? ""),
      konseptLabel: String(body.konseptLabel ?? body.konsept_label ?? body.konsept ?? ""),
      referansId:
        body.referansId != null
          ? String(body.referansId)
          : body.referans_id != null
            ? String(body.referans_id)
            : null,
      referansListeKey:
        body.referansListeKey != null
          ? String(body.referansListeKey)
          : body.referans_liste_key != null
            ? String(body.referans_liste_key)
            : null,
      m2: body.m2 != null ? Number(body.m2) : null,
      guvenSkoru:
        body.guvenSkoru != null
          ? Number(body.guvenSkoru)
          : body.guven_skoru != null
            ? Number(body.guven_skoru)
            : null,
      genelToplamEur:
        body.genelToplamEur != null
          ? Number(body.genelToplamEur)
          : body.genel_toplam_eur != null
            ? Number(body.genel_toplam_eur)
            : null,
      yorum: body.yorum != null ? String(body.yorum) : null,
      kalemDuzeltmeleri: parseKalemDuzeltmeleri(kalemRaw),
      memberLoggedIn: !!(body.memberLoggedIn ?? body.member_logged_in),
      memberId:
        body.memberId != null
          ? String(body.memberId)
          : body.member_id != null
            ? String(body.member_id)
            : null,
    },
  };
}

/** Anonim PFOS teklif geri bildirimi */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const parsed = parseBody(body);
    if ("error" in parsed) return adminErr(parsed.error, 400);

    const result = await recordPfosFeedback(parsed.data);
    return adminOk(
      {
        data: result.row,
        deduped: result.deduped,
        oneriSayisi: result.oneriSayisi,
      },
      result.deduped ? 200 : 201,
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Geri bildirim kaydedilemedi";
    return adminErr(msg, 503);
  }
}

/** Admin — PFOS geri bildirim listesi */
export async function GET(req: NextRequest) {
  const denied = assertAdminBearer(req);
  if (denied) return denied;

  const sp = req.nextUrl.searchParams;
  const days = Math.min(Math.max(Number(sp.get("days") || 30), 1), 365);
  const limit = Math.min(Math.max(Number(sp.get("limit") || 100), 1), 500);

  try {
    const [ozet, rows] = await Promise.all([
      pfosFeedbackOzet(days),
      listPfosFeedbackEvents({
        days,
        limit,
        durum: sp.get("durum") || undefined,
        vote: sp.get("vote") || undefined,
        konsept: sp.get("konsept") || undefined,
      }),
    ]);
    return adminOk({ data: { ozet, rows, count: rows.length } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "PFOS geri bildirim raporu alınamadı";
    return adminErr(msg, 503);
  }
}
