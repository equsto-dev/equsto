import { getSiteOrigin } from "@/lib/site-origin";

/** public/data altında göreli yol (path.join yok — Turbopack trace güvenli) */
export function dataRel(...parts: string[]): string {
  return parts
    .flatMap((p) => p.split(/[/\\]+/))
    .filter(Boolean)
    .join("/");
}

/** Mutlak veya göreli yolu public/data altına indirger */
export function normalizeDataRel(fileOrRel: string): string {
  const n = fileOrRel.replace(/\\/g, "/");
  const marker = "/public/data/";
  const idx = n.indexOf(marker);
  if (idx >= 0) return n.slice(idx + marker.length);
  if (n.startsWith("public/data/")) return n.slice("public/data/".length);
  return n.replace(/^\/+/, "");
}

export function publicDataUrl(...parts: string[]): string {
  return `${getSiteOrigin()}/data/${dataRel(...parts)}`;
}

/** @deprecated publicDataUrl(...parts) veya normalizeDataRel kullanın */
export function publicDataUrlFromPath(file: string): string | null {
  const rel = normalizeDataRel(file);
  if (!rel) return null;
  return `${getSiteOrigin()}/data/${rel}`;
}

function canReadLocalPublicData(): boolean {
  if (process.env.NEXT_PHASE === "phase-production-build") return true;
  if (!process.env.VERCEL) return true;
  if (!process.env.NEXT_RUNTIME) return true;
  return false;
}

/** JSON okuma — build/yerel: disk; canlı lambda: /data/* fetch */
export async function readJsonFile<T>(fileOrRel: string): Promise<T | null> {
  const rel = normalizeDataRel(fileOrRel);

  if (canReadLocalPublicData()) {
    const { readLocalDataJson } = await import("@/lib/legacy-data-local");
    const local = await readLocalDataJson<T>(rel);
    if (local != null) return local;
  }

  try {
    const res = await fetch(`${getSiteOrigin()}/data/${rel}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (res.ok) return (await res.json()) as T;
  } catch {
    /* origin / CDN */
  }
  return null;
}
