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

/** Vercel Turbopack: path.join(cwd, public/data, …) trace genişlemesi yok — CDN fetch */
export async function loadEkipmanlarJson(): Promise<unknown> {
  return fetchDataJson("ekipmanlar.json");
}

export async function loadDeptJson(dept: string): Promise<unknown> {
  const safe = safeDeptSlug(dept);
  if (!safe) return [];
  return fetchDataJson(`dept/${safe}.json`);
}

export function loadEkipmanlarJsonSync(): unknown {
  throw new Error(
    "ekipmanlar.json yalnızca sunucuda fetch ile yüklenir; loadEkipmanlarJson() kullanın.",
  );
}
