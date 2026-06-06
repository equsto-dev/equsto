type CatalogRow = Record<string, unknown>;

function lc(s: unknown): string {
  return String(s ?? "").toLocaleLowerCase("tr");
}

function brandKey(row: CatalogRow): string {
  return lc(row.brand ?? row.oem_brand ?? "");
}

/** PLP ile uyumlu: 500 tb/s → 1000 tb/s → diğer bulaşık → evye/tezgah */
function yikamaTabakSaatTier(row: CatalogRow): number {
  const id = lc(row.id);
  const sku = lc(row.sku ?? row.model ?? row.urun_kodu);
  const hay = `${lc(row.name)} ${lc(row.category)} ${lc(row.specs)} ${id} ${sku}`;

  if (/075t\.|oby\s*50t|500\s*tb\b/.test(hay) || /075t-/.test(id)) return 0;
  if (/071t\.|obm\s*1080|1000\s*tb\b/.test(hay) || /071t-/.test(id)) return 1;

  const caps = hay.match(/(?:^|[^\d])(\d{3,4})\s*tabak\s*[\/]?\s*saat/g);
  if (caps) {
    for (const cap of caps) {
      const m = cap.match(/(\d{3,4})\s*tabak/);
      if (!m) continue;
      const n = parseInt(m[1], 10);
      if (n >= 500 && n <= 599) return 0;
      if (n >= 950 && n <= 1200) return 1;
    }
  }

  const basket = hay.match(/(\d{2,3})\s*basket\s*[\/]?\s*saat/);
  if (basket && parseInt(basket[1], 10) >= 55 && parseInt(basket[1], 10) <= 70) return 1;

  const cat = lc(row.category);
  if (cat === "setalti-bulasik") return 2;
  if (cat === "giyotin-bulasik") return 3;
  if (/bulasik|giyotin|konveyor|flight|tirnak|bardak-yikama|9710|071t|075t|076|072|077/.test(cat + hay))
    return 4;
  if (cat === "bardak-yikama") return 5;
  return 6;
}

function interleaveByBrand<T>(items: T[], brandFn: (item: T) => string): T[] {
  if (items.length <= 1) return items.slice();
  const byBrand = new Map<string, T[]>();
  const brandOrder: string[] = [];

  for (const item of items) {
    const b = brandFn(item) || "—";
    if (!byBrand.has(b)) {
      byBrand.set(b, []);
      brandOrder.push(b);
    }
    byBrand.get(b)!.push(item);
  }

  for (const b of brandOrder) {
    byBrand.get(b)!.sort((a, b2) =>
      String((a as CatalogRow).name ?? "").localeCompare(
        String((b2 as CatalogRow).name ?? ""),
        "tr",
      ),
    );
  }

  const out: T[] = [];
  let round = 0;
  while (true) {
    let added = false;
    for (const b of brandOrder) {
      const arr = byBrand.get(b)!;
      if (arr.length > round) {
        out.push(arr[round]);
        added = true;
      }
    }
    if (!added) break;
    round++;
  }
  return out;
}

/** Yıkama departmanı — öncelik grupları içinde marka round-robin */
export function sortYikamaCatalogRows(rows: CatalogRow[]): CatalogRow[] {
  const groups = new Map<number, CatalogRow[]>();
  const keys: number[] = [];

  for (const row of rows) {
    const k = yikamaTabakSaatTier(row);
    if (!groups.has(k)) {
      groups.set(k, []);
      keys.push(k);
    }
    groups.get(k)!.push(row);
  }

  keys.sort((a, b) => a - b);
  const out: CatalogRow[] = [];
  for (const k of keys) {
    out.push(...interleaveByBrand(groups.get(k)!, brandKey));
  }
  return out;
}
