import { access, readFile } from "node:fs/promises";
import {
  EKIPMANLAR_JSON,
  ekipmanlarJsonReadPaths,
  resolveSiteRoot,
} from "@/lib/catalog-paths";

/** Build / yerel — public/data veya var/catalog konumu */
async function resolveSiteRootAsync(): Promise<string | null> {
  return resolveSiteRoot();
}

/** Build / yerel SSG — API route bundle'ına statik import edilmez */
export async function readLocalDataJson<T>(rel: string): Promise<T | null> {
  const paths =
    rel === EKIPMANLAR_JSON
      ? ekipmanlarJsonReadPaths()
      : await (async () => {
          const root = await resolveSiteRootAsync();
          return root ? [`${root}/public/data/${rel}`] : [];
        })();

  for (const file of paths) {
    try {
      const raw = await readFile(file, "utf8");
      return JSON.parse(raw) as T;
    } catch {
      /* sonraki aday */
    }
  }
  return null;
}
