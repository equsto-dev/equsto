
import { access, readFile } from "node:fs/promises";

/** Monorepo + Vercel standalone — public/data konumu */
async function resolveSiteRoot(): Promise<string | null> {
  const cwd = process.cwd().replace(/\\/g, "/");
  const candidates = [
    cwd,
    `${cwd}/E-TICARET/site`,
    `${cwd}/../E-TICARET/site`,
    "/var/task",
  ];
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

/** Build / yerel SSG — API route bundle'ına statik import edilmez */
export async function readLocalDataJson<T>(rel: string): Promise<T | null> {
  const root = await resolveSiteRoot();
  if (!root) return null;
  try {
    const raw = await readFile(`${root}/public/data/${rel}`, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
