import fs from "node:fs/promises";
import path from "node:path";

export function dataPath(...parts: string[]) {
  return path.join(process.cwd(), "public", "data", ...parts);
}

export async function readJsonFile<T>(file: string): Promise<T | null> {
  try {
    return JSON.parse(await fs.readFile(file, "utf8")) as T;
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
