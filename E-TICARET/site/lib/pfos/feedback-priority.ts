import type { PfosFeedbackAdminRow } from "@/lib/pfos/feedback-types";

/** Admin inceleme sırası — 👎, düşük güven, bekleyen öneri */
export function pfosFeedbackPriorityScore(row: PfosFeedbackAdminRow): number {
  let score = 0;
  if (row.vote === "down") score += 100;
  if (row.durum === "pending_review") score += 50;
  const guven = row.guven_skoru;
  if (guven != null && Number.isFinite(guven) && guven < 0.55) score += 40;
  if ((row.oneri_sayisi ?? 0) > 0) score += 25;
  return score;
}

export function sortPfosFeedbackByPriority(
  rows: PfosFeedbackAdminRow[],
): PfosFeedbackAdminRow[] {
  return [...rows].sort((a, b) => {
    const d = pfosFeedbackPriorityScore(b) - pfosFeedbackPriorityScore(a);
    if (d !== 0) return d;
    return (
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  });
}
