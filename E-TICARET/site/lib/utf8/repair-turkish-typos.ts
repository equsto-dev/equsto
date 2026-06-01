/**
 * PFOS referans / teklif — FFFD onarımından sonra kalan yazım düzeltmeleri.
 */

export const TR_TYPOS_AFTER_FFFD: [string | RegExp, string][] = [
  [/\bFrn\s+stand/gi, "Fırın stand"],
  [/\bFrn\b/gi, "Fırın"],
  [/(\d{2,4})\s+ı\s+(\d{2,4})\s+ı\s+(\d{2,4})/g, "$1×$2×$3"],
  [/(\d{2,4})\s+ı\s+(\d{2,4})/g, "$1×$2"],
  [/S\s+E\s+R\s+V\s+ı\s+S/gi, "SERVIS"],
  [/B\s+U\s+L\s+A\s+ı\s+I\s+K/gi, "BULAŞIK"],
  [/B\s+A\s+R/g, "BAR"],
  [/,ıap:/g, ", çap:"],
  [/model,ıap/g, "model, çap"],
  [/konveyırlı/gi, "konveyörlü"],
  [/konveyırl/gi, "konveyörl"],
  [/ün yıkamalı/gi, "ön yıkamalı"],
  [/ün yıkama/gi, "ön yıkama"],
  [/giriş-ıçıkış/gi, "giriş-çıkış"],
  [/ıçıkış/gi, "çıkış"],
  [/polişretan/gi, "poliüretan"],
  [/poli\uFFFDretan/gi, "poliüretan"],
  [/garnitır üniteli/gi, "garnitürlü üniteli"],
  [/garnitır/gi, "garnitürlü"],
  [/Makina /g, "Makine "],
  [/Makina,/g, "Makine,"],
  [/olişretan/gi, "poliüretan"],
  [/,\s*ıap:/g, ", çap:"],
];

export function applyTurkishTypoFixes(s: string | null | undefined): string {
  if (s == null || s === "") return String(s ?? "");
  let t = String(s);
  for (const [from, to] of TR_TYPOS_AFTER_FFFD) {
    t = typeof from === "string" ? t.split(from).join(to) : t.replace(from, to);
  }
  return t;
}
