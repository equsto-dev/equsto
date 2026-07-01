import type { PfosFeedbackAdminRow } from "@/lib/pfos/feedback-types";

export const PFOS_FEEDBACK_PRIORITY_HIGH = 140;
export const PFOS_FEEDBACK_PRIORITY_MED = 90;

const LOW_GUVEN_THRESHOLD = 0.55;

/** Admin inceleme sırası — 👎, düşük güven, ikisi birlikte, bekleyen öneri */
export function pfosFeedbackPriorityScore(row: PfosFeedbackAdminRow): number {
  let score = 0;
  const guven = row.guven_skoru;
  const lowGuven =
    guven != null && Number.isFinite(guven) && guven < LOW_GUVEN_THRESHOLD;

  if (row.vote === "down") score += 100;
  if (row.durum === "pending_review") score += 50;
  if (lowGuven) score += 40;
  if (row.vote === "down" && lowGuven) score += 35;
  if ((row.oneri_sayisi ?? 0) > 0) score += 25;
  return score;
}

export function isHighPriorityFeedback(row: PfosFeedbackAdminRow): boolean {
  return pfosFeedbackPriorityScore(row) >= PFOS_FEEDBACK_PRIORITY_HIGH;
}

export function pfosFeedbackPriorityLabel(score: number): "yüksek" | "orta" | "düşük" | "—" {
  if (score >= PFOS_FEEDBACK_PRIORITY_HIGH) return "yüksek";
  if (score >= PFOS_FEEDBACK_PRIORITY_MED) return "orta";
  if (score > 0) return "düşük";
  return "—";
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
