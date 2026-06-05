import fs from "node:fs/promises";
import path from "node:path";

/** Yerel yazma — yalnızca admin API / script (Turbopack trace: lib dosyalarına import etmeyin) */
export function dataPath(...parts: string[]): string {
  return path.join(process.cwd(), "public", "data", ...parts);
}

export async function writeJsonFile(file: string, data: unknown) {
  const tmp = file + ".tmp";
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await fs.rename(tmp, file);
}
