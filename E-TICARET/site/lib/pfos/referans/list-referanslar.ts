import { readJsonFile } from "@/lib/legacy-data";
import type { Konsept } from "@/lib/pfos/schemas/pfos.schema";
import { listAllDayDiningReferanslar } from "./all-day-dining/thc-referanslar";
import { listCoffeeShopReferanslar } from "./coffee-shop-espressolab";
import { listS13Referanslar } from "./s13-388";

export type ReferansListeOzet = {
  id: string;
  label: string;
  not?: string;
  referansM2?: number;
  konsept: string;
  kaynak: "s13-388" | "all-day-dining" | "coffee-shop";
  kalemSayisi?: number;
};

type TaxonomySegment = {
  key: string;
  label: string;
  concepts: string[];
};

type TaxonomyFile = {
  segments?: TaxonomySegment[];
};

const KONSEPT_KAYNAK: Array<{
  konsept: Konsept;
  kaynak: ReferansListeOzet["kaynak"];
  list: () => Array<{
    id: string;
    label: string;
    not?: string;
    referansM2?: number;
    konsept?: Konsept;
    kalemler?: unknown[];
  }>;
}> = [
  {
    konsept: "turk-restoran",
    kaynak: "s13-388",
    list: () =>
      listS13Referanslar().map((r) => ({
        id: r.id,
        label: r.label,
        not: r.not,
        referansM2: r.referansM2,
        konsept: r.konsept,
      })),
  },
  {
    konsept: "all-day-dining-cafe",
    kaynak: "all-day-dining",
    list: () =>
      listAllDayDiningReferanslar().map((r) => ({
        ...r,
        konsept: "all-day-dining-cafe" as Konsept,
      })),
  },
  {
    konsept: "coffee-shop",
    kaynak: "coffee-shop",
    list: () =>
      listCoffeeShopReferanslar().map((r) => ({
        ...r,
        konsept: "coffee-shop" as Konsept,
      })),
  },
];

async function konseptlerForSegment(segment?: string): Promise<Set<string> | null> {
  const key = segment?.trim();
  if (!key) return null;
  const taxonomy = await readJsonFile<TaxonomyFile>("pfos-taxonomy.json");
  const seg = taxonomy?.segments?.find((s) => s.key === key);
  if (!seg) return new Set<string>();
  return new Set(seg.concepts);
}

function aggregateReferanslar(): ReferansListeOzet[] {
  const out: ReferansListeOzet[] = [];
  for (const src of KONSEPT_KAYNAK) {
    for (const row of src.list()) {
      out.push({
        id: row.id,
        label: row.label,
        not: row.not,
        referansM2: row.referansM2,
        konsept: row.konsept ?? src.konsept,
        kaynak: src.kaynak,
        kalemSayisi: Array.isArray(row.kalemler) ? row.kalemler.length : undefined,
      });
    }
  }
  return out;
}

export type ListReferanslarOpts = {
  konsept?: string;
  segment?: string;
};

/** Doğrulanmış referans proforma profilleri — konsept veya segment filtresi */
export async function listPfosReferanslar(
  opts: ListReferanslarOpts = {},
): Promise<ReferansListeOzet[]> {
  let rows = aggregateReferanslar();
  const konsept = opts.konsept?.trim();
  if (konsept) {
    rows = rows.filter((r) => r.konsept === konsept);
  }
  const segmentKonseptler = await konseptlerForSegment(opts.segment);
  if (segmentKonseptler) {
    rows = rows.filter((r) => segmentKonseptler.has(r.konsept));
  }
  return rows.sort((a, b) =>
    a.konsept.localeCompare(b.konsept, "tr") || a.label.localeCompare(b.label, "tr"),
  );
}
