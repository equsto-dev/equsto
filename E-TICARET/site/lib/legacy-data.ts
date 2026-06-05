import { access, readFile } from "node:fs/promises";
import { getSiteOrigin } from "@/lib/site-origin";

/** Monorepo: cwd bazen git kökü (EQUSTO-WORK) olur */
async function resolveSiteRoot(): Promise<string | null> {
  const cwd = process.cwd().replace(/\\/g, "/");
  const candidates = [cwd, `${cwd}/E-TICARET/site`];
  for (const root of candidates) {
    try {
      await access(`${root}/public/data`);
      return root;
    } catch {
      /* sonraki aday */
    }
  }
  return null;
}

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

async function readLocalDataJson<T>(rel: string): Promise<T | null> {
  // Vercel runtime: public/data trace dışı — yalnızca /data/* fetch
  if (process.env.VERCEL_ENV) return null;
  const root = await resolveSiteRoot();
  if (!root) return null;
  try {
    const raw = await readFile(`${root}/public/data/${rel}`, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** JSON okuma — canlıda /data/* fetch; yerelde build/SSR için fs yedek */
export async function readJsonFile<T>(fileOrRel: string): Promise<T | null> {
  const rel = normalizeDataRel(fileOrRel);
  try {
    const res = await fetch(`${getSiteOrigin()}/data/${rel}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (res.ok) return (await res.json()) as T;
  } catch {
    /* origin / CDN */
  }
  return readLocalDataJson<T>(rel);
}
