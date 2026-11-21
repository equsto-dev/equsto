/**
 * "Elektrik voltaj:" / "Elektrik frekans:" satırlarını ürünün kendi metninden yeniden hesaplar.
 * Geçerli değer yoksa satır silinir.
 *
 *   node scripts/repair-elektrik-voltaj-frekans.mjs --dry
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { decodeCatalogText } from "./lib/pdp-katalog-specs.mjs";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DEPT = path.join(ROOT, "public/data/dept");
const DRY = process.argv.includes("--dry");

const VOLT_NUM = "(?:110|115|120|127|208|220|230|240|380|400|415|440|480)";
const VOLT_RE = new RegExp(
  `(?<![\\d.,])(${VOLT_NUM}(?:\\s*[-–/]\\s*${VOLT_NUM})?)\\s*(?:v|volt|vac)(?![a-zçğıöşü])`,
  "i",
);
const HZ_RE = /(?<![\d.,])((?:50|60)(?:\s*[-–/]\s*(?:50|60)|\s+(?:50|60))?)\s*hz\b/i;

const stats = { voltDuzeltilen: 0, voltSilinen: 0, hzDuzeltilen: 0, hzSilinen: 0 };
const samples = [];

for (const f of fs.readdirSync(DEPT)) {
  if (!f.endsWith(".json") || f.includes("brema")) continue;
  const file = path.join(DEPT, f);
  const items = JSON.parse(fs.readFileSync(file, "utf8"));
  let dirty = false;
  for (const row of items) {
    const lines = Array.isArray(row?.teknik_ozellikler) ? row.teknik_ozellikler.map(String) : null;
    if (!lines || !lines.some((l) => /^elektrik (voltaj|frekans):/i.test(l))) continue;
    const blob = decodeCatalogText(
      [row.specs, row.aciklama, row.description, lines.filter((l) => !/^elektrik (voltaj|frekans):/i.test(l)).join("\n")]
        .filter(Boolean)
        .join("\n"),
    );
    const vm = blob.match(VOLT_RE);
    const volt = vm ? vm[1].replace(/\s+/g, "") + " V" : "";
    const hm = blob.match(HZ_RE);
    const hz = hm ? hm[1].trim().replace(/\s*[-–/]\s*|\s+/g, "-") + " Hz" : "";
    const next = [];
    let changed = false;
    for (const l of lines) {
      if (/^elektrik voltaj:/i.test(l)) {
        const cur = l.split(":").slice(1).join(":").trim();
        if (VOLT_RE.test(cur) || /monofaz|trifaz/i.test(cur)) {
          next.push(l);
          continue;
        }
        if (volt) {
          const v = "Elektrik voltaj: " + volt;
          if (v !== l) {
            stats.voltDuzeltilen++;
            changed = true;
            if (samples.length < 20) samples.push(`${row.sku} | ${l} -> ${v}`);
          }
          next.push(v);
        } else {
          stats.voltSilinen++;
          changed = true;
          if (samples.length < 20) samples.push(`${row.sku} | ${l} -> (silindi)`);
        }
        continue;
      }
      if (/^elektrik frekans:\s*(50|60) Hz$/i.test(l) && /[-–/]/.test(hz)) {
        next.push("Elektrik frekans: " + hz);
        stats.hzDuzeltilen++;
        changed = true;
        continue;
      }
      next.push(l);
    }
    if (changed) {
      row.teknik_ozellikler = next;
      dirty = true;
    }
  }
  if (dirty && !DRY) fs.writeFileSync(file, JSON.stringify(items, null, 2) + "\n");
}

console.log(JSON.stringify(stats, null, 2));
for (const s of samples) console.log(s);
if (DRY) console.log("dry — yazılmadı");
