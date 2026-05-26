/**
 * Varsayılan build de data/images kopyalamaz; bu script sadece vite + copy-data.
 * Tam dist görselleri için: EQUSTO_COPY_DATA_INCLUDE_IMAGES=1 npm run build
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const env = { ...process.env, EQUSTO_COPY_DATA_SKIP_IMAGES: "1" };
const viteCli = path.join(root, "node_modules", "vite", "bin", "vite.js");

const b = spawnSync(process.execPath, [viteCli, "build"], { cwd: root, env, stdio: "inherit" });
if (b.status !== 0) process.exit(b.status ?? 1);

const c = spawnSync(process.execPath, [path.join(root, "scripts", "copy-data-to-dist.mjs")], {
  cwd: root,
  env,
  stdio: "inherit",
});
process.exit(c.status ?? 1);
