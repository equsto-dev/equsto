import type { Worksheet } from "exceljs";
import type { PfosEkipmanSatir } from "./types";

const POZ_RE = /^[A-Z]\d{1,2}A?$|^\d{1,3}$/;

function isPoz(s: string) {
  return POZ_RE.test(s.trim());
}

function cellStr(v: unknown): string {
  if (v == null) return "";
  return String(v).trim();
}

function parseAdet(raw: unknown): number | string {
  if (raw == null || raw === "") return "—";
  if (typeof raw === "number" && Number.isFinite(raw)) return Math.round(raw);
  const n = parseInt(String(raw).replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) ? n : "—";
}

/** Equsto ekipman listesi Excel → satırlar (Python veri-plan ile aynı mantık) */
export function parseEkipmanWorksheet(ws: Worksheet): PfosEkipmanSatir[] {
  const rows: PfosEkipmanSatir[] = [];
  let bolum = "";
  let bolumAd = "";

  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber < 4) return;
    const cells = row.values as unknown[];
    const a = cellStr(cells[1]);
    const b = cellStr(cells[2]);
    const c = cellStr(cells[3]);
    const d = cells[4];
    const e = cells[5];

    if (!a && !b && !c) return;
    const au = a.toUpperCase();
    if (au === "TOPLAM ADET") return;
    if (au === "PNO" || au === "P.NO" || au === "BÖL.") return;

    if (a && !b && a.includes("-") && !isPoz(a)) {
      bolumAd = a;
      bolum = a.split("-")[0]?.trim() || a.charAt(0);
      return;
    }

    let poz: string | null = null;
    let ad: string | null = null;
    let olcu: unknown = null;
    let adetRaw: unknown = null;

    if (b && c && isPoz(b)) {
      poz = b;
      ad = c;
      olcu = d;
      adetRaw = e;
    } else if (a && b && isPoz(a)) {
      poz = a;
      ad = b;
      olcu = c;
      adetRaw = d;
    }

    if (!poz || !ad) return;
    rows.push({
      bolum,
      bolumAd,
      poz,
      ad,
      olcu: olcu != null && String(olcu).trim() ? String(olcu).trim() : "—",
      adet: parseAdet(adetRaw),
    });
  });

  return rows;
}

export function toplamAdet(rows: PfosEkipmanSatir[]): number {
  return rows.reduce((t, r) => (typeof r.adet === "number" ? t + r.adet : t), 0);
}
