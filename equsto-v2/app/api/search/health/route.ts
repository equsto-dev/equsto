import { getMeiliAdmin, getMeiliConfigStatus } from "@/lib/meilisearch";

export const runtime = "nodejs";

/** Canlı tanı — anahtar değerleri döndürmez. */
export async function GET() {
  const cfg = getMeiliConfigStatus();
  if (!cfg.ok) {
    return Response.json(
      {
        ok: false,
        missing: cfg.missing,
        index: cfg.index,
        hint: "Vercel env ekleyip Production Redeploy yapın (Root Directory: equsto-v2).",
      },
      { status: 503 }
    );
  }
  const client = getMeiliAdmin();
  if (!client) {
    return Response.json({ ok: false, error: "client" }, { status: 503 });
  }
  try {
    const index = client.index(cfg.index);
    const stats = await index.getStats();
    return Response.json({
      ok: true,
      index: cfg.index,
      documents: stats.numberOfDocuments,
      hostPreview: cfg.hostPreview,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Meilisearch bağlantı hatası";
    return Response.json({ ok: false, index: cfg.index, error: msg }, { status: 502 });
  }
}
