import fs from "node:fs";
import path from "node:path";
import { getSiteOrigin } from "@/lib/site-origin";

function localEkipmanlarPath(): string {
  return path.join(process.cwd(), "public", "data", "ekipmanlar.json");
}

function localDeptPath(dept: string): string {
  return path.join(process.cwd(), "public", "data", "dept", `${dept}.json`);
}

/** Vercel'de public/ trace dışı — canlıda CDN'den okur */
export async function loadEkipmanlarJson(): Promise<unknown> {
  const local = localEkipmanlarPath();
  if (fs.existsSync(local)) {
    const raw = await fs.promises.readFile(local, "utf8");
    return JSON.parse(raw) as unknown;
  }

  const res = await fetch(`${getSiteOrigin()}/data/ekipmanlar.json`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`ekipmanlar.json fetch ${res.status}`);
  }
  return res.json() as Promise<unknown>;
}

/** Dept JSON — Vercel'de CDN; yerelde public/data/dept */
export async function loadDeptJson(dept: string): Promise<unknown> {
  const safe = String(dept || "")
    .trim()
    .replace(/[^a-z0-9-]/gi, "");
  if (!safe) return [];

  const local = localDeptPath(safe);
  if (fs.existsSync(local)) {
    const raw = await fs.promises.readFile(local, "utf8");
    return JSON.parse(raw) as unknown;
  }

  const res = await fetch(`${getSiteOrigin()}/data/dept/${safe}.json`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`dept/${safe}.json fetch ${res.status}`);
  }
  return res.json() as Promise<unknown>;
}

export function loadEkipmanlarJsonSync(): unknown {
  const local = localEkipmanlarPath();
  if (fs.existsSync(local)) {
    return JSON.parse(fs.readFileSync(local, "utf8")) as unknown;
  }
  throw new Error(
    "ekipmanlar.json yalnızca sunucuda fetch ile yüklenir; loadEkipmanlarJson() kullanın.",
  );
}
