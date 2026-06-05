/** Prisma CLI / tsx öncesi .env.local veya .env yükler */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const envRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Hangi dosya yüklendi (tanılama) */
export let envLoadedFrom = "";

for (const name of [".env.local", ".env"]) {
  const file = path.join(envRoot, name);
  if (!fs.existsSync(file)) continue;
  envLoadedFrom = file;
  for (const line of fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 1) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
  break;
}
