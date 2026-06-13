/** Pimak pimak.com — Güç (kW/hp) çözümleme (teklif + katalog) */

export function parsePimakGucKwValue(raw: string | null | undefined): number | null {
  const s = String(raw ?? "").trim();
  if (!s || /iletisim|contact/i.test(s)) return null;
  const kwPart = s.split("/")[0].trim();
  const nums: number[] = [];
  for (const m of kwPart.matchAll(/(\d+(?:[.,]\d+)?)/g)) {
    const n = Number(m[1].replace(",", "."));
    if (Number.isFinite(n) && n > 0 && n <= 200) nums.push(n);
  }
  return nums.length ? Math.max(...nums) : null;
}

/** Tek satır metinden Pimak güç alanı */
export function parsePimakGucFromTeknikLine(line: string): number | null {
  const t = String(line ?? "").trim();
  if (!t) return null;
  const m = t.match(/^g[uü][çc](?:\s*\([^)]*\))?\s*:\s*(.+)$/i);
  if (m) {
    const fromLabel = parsePimakGucKwValue(m[1]);
    if (fromLabel != null) return fromLabel;
    const n = Number(String(m[1]).replace(/[^\d.,]/g, "").replace(",", "."));
    if (Number.isFinite(n) && n > 0 && n <= 200) return n;
  }
  if (/g[uü][çc]\s*\(/.test(t.split(":")[0] || "")) {
    return parsePimakGucKwValue(t.split(":").slice(1).join(":"));
  }
  return null;
}
