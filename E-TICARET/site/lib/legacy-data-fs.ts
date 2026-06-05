import "server-only";

import fs from "node:fs/promises";
import path from "node:path";

function dataRel(...parts: string[]): string {
  return parts
    .flatMap((p) => p.split(/[/\\]+/))
    .filter(Boolean)
    .join("/");
}

/** Yerel yazma — yalnızca admin API (path.join + dynamic trace yok) */
export function dataPath(...parts: string[]): string {
  const rel = dataRel(...parts);
  const root = path.join(process.cwd(), "public", "data");
  return `${root}${path.sep}${rel.replace(/\//g, path.sep)}`;
}

export async function writeJsonFile(file: string, data: unknown) {
  const tmp = `${file}.tmp`;
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await fs.rename(tmp, file);
}
