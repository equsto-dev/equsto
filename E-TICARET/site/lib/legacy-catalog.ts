import fs from "node:fs/promises";
import path from "node:path";
import { loadEkipmanlarJson } from "@/lib/catalog-json";
import { ecomRowToAdminUrun, type AdminUrunRow } from "@/lib/admin-urun";

export type { AdminUrunRow };

let cache: { mtimeMs: number; rows: AdminUrunRow[] } | null = null;

function catalogPath() {
  return path.join(process.cwd(), "public", "data", "ekipmanlar.json");
}

function pfosEkKatalogPath() {
  return path.join(process.cwd(), "public", "data", "pfos-ek-katalog.json");
}

async function loadPfosEkKatalogItems(): Promise<unknown[]> {
  try {
    const raw = JSON.parse(
      await fs.readFile(pfosEkKatalogPath(), "utf8"),
    ) as { items?: unknown[] };
    return Array.isArray(raw?.items) ? raw.items : [];
  } catch {
    return [];
  }
}

export async function legacyCatalogExists() {
  try {
    await fs.access(catalogPath());
    return true;
  } catch {
    try {
      await loadEkipmanlarJson();
      return true;
    } catch {
      return false;
    }
  }
}

export async function loadLegacyCatalogRows(): Promise<AdminUrunRow[]> {
  const file = catalogPath();
  let mtimeMs = Date.now();
  let raw: unknown;

  try {
    const stat = await fs.stat(file);
    mtimeMs = stat.mtimeMs;
    if (cache && cache.mtimeMs === mtimeMs) return cache.rows;
    raw = JSON.parse(await fs.readFile(file, "utf8")) as unknown;
  } catch {
    if (cache) return cache.rows;
    raw = await loadEkipmanlarJson();
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
  cache = { mtimeMs, rows };
  return rows;
}

export function invalidateLegacyCatalogCache() {
  cache = null;
}

export async function deleteLegacyCatalogIndex(index: number): Promise<boolean> {
  const file = catalogPath();
  const raw = JSON.parse(await fs.readFile(file, "utf8")) as unknown;
  const items = Array.isArray(raw)
    ? [...raw]
    : raw && typeof raw === "object" && Array.isArray((raw as { items?: unknown[] }).items)
      ? [...(raw as { items: unknown[] }).items]
      : null;

  if (!items || index < 0 || index >= items.length) return false;
  items.splice(index, 1);

  const out = Array.isArray(raw) ? items : { ...(raw as object), items };
  const tmp = file + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(out), "utf8");
  await fs.rename(tmp, file);
  invalidateLegacyCatalogCache();
  return true;
}
