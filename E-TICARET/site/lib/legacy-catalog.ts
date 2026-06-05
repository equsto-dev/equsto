import fs from "node:fs/promises";
import { loadEkipmanlarJson } from "@/lib/catalog-json";
import { dataPath, writeJsonFile } from "@/lib/legacy-data-fs";
import { ecomRowToAdminUrun, type AdminUrunRow } from "@/lib/admin-urun";
import { readJsonFile } from "@/lib/legacy-data";

export type { AdminUrunRow };

let cache: { rows: AdminUrunRow[] } | null = null;

async function loadPfosEkKatalogItems(): Promise<unknown[]> {
  const raw = await readJsonFile<{ items?: unknown[] }>("pfos-ek-katalog.json");
  return Array.isArray(raw?.items) ? raw.items : [];
}

export async function legacyCatalogExists() {
  try {
    await loadEkipmanlarJson();
    return true;
  } catch {
    return false;
  }
}

export async function loadLegacyCatalogRows(): Promise<AdminUrunRow[]> {
  if (cache) return cache.rows;

  let raw: unknown;
  try {
    raw = await loadEkipmanlarJson();
  } catch {
    return [];
  }

  const items = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object" && Array.isArray((raw as { items?: unknown[] }).items)
      ? (raw as { items: unknown[] }).items
      : [];

  const ekItems = await loadPfosEkKatalogItems();
  const merged = [...items, ...ekItems];

  const rows = merged.map((row, i) =>
    ecomRowToAdminUrun(row as Parameters<typeof ecomRowToAdminUrun>[0], i),
  );
  cache = { rows };
  return rows;
}

export function invalidateLegacyCatalogCache() {
  cache = null;
}

export async function deleteLegacyCatalogIndex(index: number): Promise<boolean> {
  const file = dataPath("ekipmanlar.json");
  const raw = JSON.parse(await fs.readFile(file, "utf8")) as unknown;
  const items = Array.isArray(raw)
    ? [...raw]
    : raw && typeof raw === "object" && Array.isArray((raw as { items?: unknown[] }).items)
      ? [...(raw as { items: unknown[] }).items]
      : null;

  if (!items || index < 0 || index >= items.length) return false;
  items.splice(index, 1);

  const out = Array.isArray(raw) ? items : { ...(raw as object), items };
  await writeJsonFile(file, out);
  invalidateLegacyCatalogCache();
  return true;
}
