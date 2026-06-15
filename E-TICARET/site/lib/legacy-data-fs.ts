import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import { EKIPMANLAR_JSON, privateCatalogPath } from "@/lib/catalog-paths";

function dataRel(...parts: string[]): string {
  return parts
    .flatMap((p) => p.split(/[/\\]+/))
    .filter(Boolean)
    .join("/");
}

function siteRoot(): string {
  const cwd = process.cwd().replace(/\\/g, "/");
  if (existsSync(`${cwd}/public/data`) || existsSync(`${cwd}/var/catalog`)) {
    return cwd;
  }
  const nested = `${cwd}/E-TICARET/site`;
  if (existsSync(`${nested}/public/data`) || existsSync(`${nested}/var/catalog`)) {
    return nested;
  }
  return cwd;
}

/** Yerel yazma — yalnızca admin API (path.join dynamic trace yok) */
export function dataPath(...parts: string[]): string {
  const rel = dataRel(...parts);
  if (rel === EKIPMANLAR_JSON) {
    return privateCatalogPath(EKIPMANLAR_JSON);
  }
  return `${siteRoot()}/public/data/${rel}`;
}

export async function writeJsonFile(file: string, data: unknown) {
  const tmp = `${file}.tmp`;
  const dir = file.slice(0, file.lastIndexOf("/"));
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await fs.rename(tmp, file);
}
