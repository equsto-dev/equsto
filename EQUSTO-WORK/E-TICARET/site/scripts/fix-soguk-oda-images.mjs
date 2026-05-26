/**
 * Soğuk oda ürünlerinde ortak vitrin fotoğrafını kullan.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPO = path.join(ROOT, "..");
const SOGUK_ODA_VITRIN = "images/catalog/soguk-oda/soguk-oda-vitrin.png";

function isSogukOdaRow(row) {
  if (row.category === "soguk-odalar") return true;
  return /soğuk oda|soguk oda/i.test(String(row.name || ""));
}

function updateRows(rows) {
  let n = 0;
  for (const row of rows) {
    if (!isSogukOdaRow(row)) continue;
    const old = (row.images || [])[0];
    if (old === SOGUK_ODA_VITRIN) continue;
    row.images = [SOGUK_ODA_VITRIN];
    n++;
  }
  return n;
}

const targets = [
  path.join(ROOT, "public/data/dept/sogutma.json"),
  path.join(REPO, "veri/public-data/dept/sogutma.json"),
  path.join(ROOT, "public/data/ekipmanlar.json"),
  path.join(REPO, "veri/public-data/ekipmanlar.json"),
];

for (const fp of targets) {
  if (!fs.existsSync(fp)) {
    console.log("skip", fp);
    continue;
  }
  const rows = JSON.parse(fs.readFileSync(fp, "utf8"));
  const n = updateRows(rows);
  if (n) {
    fs.writeFileSync(fp, JSON.stringify(rows), "utf8");
    console.log("updated", path.relative(REPO, fp), n, "rows");
  } else {
    console.log("no change", path.relative(REPO, fp));
  }
}

const manifestPath = path.join(ROOT, "public/images/catalog/ozti/_manifest.json");
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  let mn = 0;
  for (const kod of Object.keys(manifest)) {
    if (!/7919\.CR/i.test(kod)) continue;
    if (manifest[kod] !== SOGUK_ODA_VITRIN) {
      manifest[kod] = SOGUK_ODA_VITRIN;
      mn++;
    }
  }
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
  console.log("manifest updated", mn, "entries");
}
