import fs from "node:fs/promises";
import path from "node:path";
import { getSiteOrigin } from "@/lib/site-origin";

export function dataPath(...parts: string[]) {
  return path.join(process.cwd(), "public", "data", ...parts);
}

/** public/data/… dosya yolu → /data/… CDN URL (Vercel trace dışı JSON) */
export function publicDataUrlFromPath(file: string): string | null {
  const normalized = file.replace(/\\/g, "/");
  const marker = "/public/data/";
  const idx = normalized.indexOf(marker);
  if (idx === -1) return null;
  const rel = normalized.slice(idx + marker.length);
  return `${getSiteOrigin()}/data/${rel}`;
}

export async function readJsonFile<T>(file: string): Promise<T | null> {
  try {
    return JSON.parse(await fs.readFile(file, "utf8")) as T;
  } catch {
    /* Vercel: public/data/*.json trace dışı — canlıda CDN */
  }

  const url = publicDataUrlFromPath(file);
  if (!url) return null;

  try {
    const res = await fetch(url, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function writeJsonFile(file: string, data: unknown) {
  const tmp = file + ".tmp";
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await fs.rename(tmp, file);
}
