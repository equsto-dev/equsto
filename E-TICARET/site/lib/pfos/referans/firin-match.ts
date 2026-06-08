import {
  loadLegacyCatalogRows,
  type AdminUrunRow,
} from "@/lib/legacy-catalog";
import { katalogRowToEslesmis } from "../core/katalog-row-eslesmis";
import type { EslesmisUrun, FiyatStratejisi } from "../schemas/pfos.schema";

function norm(s: string): string {
  return String(s ?? "")
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/\s+/g, " ")
    .trim();
}

export function isTasFirinReferans(isim: string): boolean {
  const n = norm(isim);
  return (
    n.includes("tas firin") ||
    n.includes("taş fırın") ||
    n.includes("tas taban") ||
    n.includes("taş taban")
  );
}

function rowToEslesmis(row: AdminUrunRow): EslesmisUrun {
  return katalogRowToEslesmis(row);
}

/** Taş fırın → UNOX taş tabanlı kombi (1 veya 2 tepsi) */
export async function matchTasFirinByReferans(
  _isim: string,
  _fiyatStratejisi: FiyatStratejisi,
): Promise<EslesmisUrun | null> {
  const rows = (await loadLegacyCatalogRows()).filter(
    (r) => r.durum === "aktif" && r.fiyat_tl > 0,
  );
  const hits = rows.filter((r) => /tas taban|taş taban/i.test(r.ad));
  if (!hits.length) return null;
  hits.sort((a, b) => a.fiyat_tl - b.fiyat_tl);
  return rowToEslesmis(hits[0]);
}

/** Genel "Fırın" (pastane/Unox) — katalogda UNOX BAKERTOP */
export async function matchKonveksiyonFirinByReferans(
  isim: string,
  _fiyatStratejisi: FiyatStratejisi,
): Promise<EslesmisUrun | null> {
  const n = norm(isim);
  if (n.includes("pizza") || n.includes("tas firin") || n.includes("taş")) {
    return null;
  }
  const rows = (await loadLegacyCatalogRows()).filter(
    (r) => r.durum === "aktif" && r.fiyat_tl > 0,
  );
  const hits = rows.filter(
    (r) =>
      /unox.*bakertop|bakertop.*unox/i.test(r.ad) &&
      /kombi|combi|konveksiyon/i.test(r.ad),
  );
  if (!hits.length) return null;
  hits.sort((a, b) => a.fiyat_tl - b.fiyat_tl);
  return rowToEslesmis(hits[0]);
}
