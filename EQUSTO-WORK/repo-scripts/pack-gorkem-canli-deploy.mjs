/**
 * Görkem görsel + katalog güncellemesi SFTP dosya listesi.
 *   node scripts/pack-gorkem-canli-deploy.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = path.join(ROOT, "public", "data", "ekipmanlar.json");
const LIST = path.join(ROOT, ".tmp-gorkem-canli-files.txt");
const LOG = path.join(ROOT, "public", "data", "gorkem-image-restore-log.json");

const files = new Set([
  "data/ekipmanlar.json",
  "data/dept/pisirme.json",
  "data/dept/sogutma.json",
  "data/dept/kahve.json",
  "data/dept/yikama.json",
  "data/dept/hazirlik.json",
  "data/dept/icecek.json",
  "data/dept/tezgah.json",
  "data/dept/dolap.json",
  "data/dept/davlumbaz.json",
  "data/dept/tasima.json",
  "data/dept/araba.json",
  "data/dept/istif.json",
]);

const catalog = JSON.parse(fs.readFileSync(CATALOG, "utf8"));
for (const p of catalog) {
  if (!/^gorkem__/i.test(p.id || "")) continue;
  for (const rel of p.images || []) {
    const fn = String(rel).replace(/^images[\\/]/i, "").replace(/\\/g, "/");
    if (fn) files.add(`data/images/${fn}`);
  }
}

if (fs.existsSync(LOG)) {
  const log = JSON.parse(fs.readFileSync(LOG, "utf8"));
  for (const row of log.items || []) {
    for (const f of row.files || []) {
      if (f.new) files.add(`data/images/${f.new}`);
      if (f.old) files.add(`data/images/${f.old}`);
    }
  }
}

const lines = [...files].filter((rel) => {
  const local = path.join(ROOT, "public", rel);
  return fs.existsSync(local);
});

const missing = [...files].filter((rel) => !fs.existsSync(path.join(ROOT, "public", rel)));
if (missing.length) {
  console.warn(`[pack-gorkem] ${missing.length} dosya diskte yok (atlandı)`);
}

fs.writeFileSync(LIST, lines.join("\n") + "\n", "utf8");
console.log(`[pack-gorkem] ${lines.length} dosya → ${LIST}`);
console.log("Deploy: node scripts/deploy-cpanel-sftp.mjs --file-list .tmp-gorkem-canli-files.txt");
