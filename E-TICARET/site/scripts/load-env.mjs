/** Prisma CLI / tsx öncesi .env.local veya .env yükler */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const envRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Hangi dosya yüklendi (tanılama) */
export let envLoadedFrom = "";

const preferProduction =
  process.env.EQUSTO_ENV_FILE === ".env.production" ||
  process.env.NODE_ENV === "production";

const chain = preferProduction
  ? [".env.production", ".env.local", ".env"]
  : [".env.local", ".env.production", ".env"];

for (const name of chain) {
  const file = path.join(envRoot, name);
  if (!fs.existsSync(file)) continue;
  if (!envLoadedFrom) envLoadedFrom = file;
  for (const line of fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#") || t.startsWith("$")) continue;
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
    if (val !== "") process.env[key] = val;
  }
}
