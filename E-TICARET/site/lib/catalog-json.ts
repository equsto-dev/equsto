import { readJsonFile } from "@/lib/legacy-data";
import { EKIPMANLAR_JSON } from "@/lib/catalog-paths";
import { getSiteOrigin } from "@/lib/site-origin";

function safeDeptSlug(dept: string): string {
  return String(dept || "")
    .trim()
    .replace(/[^a-z0-9-]/gi, "");
}

async function fetchDataJson<T>(rel: string): Promise<T> {
  const res = await fetch(`${getSiteOrigin()}/data/${rel}`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`${rel} fetch ${res.status}`);
  }
  return res.json() as Promise<T>;
}

let ekipmanlarCache: Promise<unknown> | null = null;

/** Önce disk (Hetzner/Docker var/catalog), HTTP fetch yok */
export async function loadEkipmanlarJson(): Promise<unknown> {
  if (!ekipmanlarCache) {
    ekipmanlarCache = readJsonFile<unknown>(EKIPMANLAR_JSON).then((local) => {
      if (local != null) return local;
      throw new Error("ekipmanlar.json sunucuda bulunamadı (var/catalog)");
    });
  }
  return ekipmanlarCache;
}

export async function loadDeptJson(dept: string): Promise<unknown> {
  const safe = safeDeptSlug(dept);
  if (!safe) return [];
  if (safe === "tezgah") {
    const [tezgah, dolap] = await Promise.all([
      fetchDataJson<unknown[]>(`dept/tezgah.json`).catch(() => []),
      fetchDataJson<unknown[]>(`dept/dolap.json`).catch(() => []),
    ]);
    const a = Array.isArray(tezgah) ? tezgah : [];
    const b = Array.isArray(dolap) ? dolap : [];
    if (!b.length) return a;
    const seen = new Set(
      a
        .map((r) =>
          String((r as { id?: string; sku?: string })?.id || (r as { sku?: string })?.sku || "")
            .toLowerCase(),
        )
        .filter(Boolean),
    );
    const merged = [...a];
    for (const row of b) {
      const key = String(
        (row as { id?: string; sku?: string })?.id ||
          (row as { sku?: string })?.sku ||
          "",
      ).toLowerCase();
      if (key && seen.has(key)) continue;
      if (key) seen.add(key);
      merged.push(row);
    }
    return merged;
  }
  return fetchDataJson(`dept/${safe}.json`);
}

export function loadEkipmanlarJsonSync(): unknown {
  throw new Error(
    "ekipmanlar.json yalnızca sunucuda fetch ile yüklenir; loadEkipmanlarJson() kullanın.",
  );
}
