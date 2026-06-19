/**
 * PFOS hero: dis-mutfak-gece-render.jpg → 90° saat yönü.
 * node scripts/rotate-pfos-hero-image.mjs
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const img = path.join(site, "public/images/pfos/dis-mutfak-gece-render.jpg");
const tmp = img + ".rot.tmp";

const code = `
const sharp = require('sharp');
sharp(process.argv[1]).rotate(90).jpeg({ quality: 92 }).toFile(process.argv[2])
  .then(m => { console.log(m.width + 'x' + m.height); })
  .catch(e => { console.error(e); process.exit(1); });
`;

const r = spawnSync(
  process.execPath,
  ["-e", code, img, tmp],
  {
    cwd: site,
    env: { ...process.env, NODE_PATH: path.join(site, "node_modules") },
    stdio: "inherit",
  }
);

if (r.status !== 0) {
  const npx = spawnSync(
    "npx",
    ["--yes", "-p", "sharp", "node", "-e", code, img, tmp],
    { cwd: site, stdio: "inherit", shell: true }
  );
  if (npx.status !== 0) process.exit(1);
}

fs.renameSync(tmp, img);
console.log("[rotate-pfos-hero] OK", img);
