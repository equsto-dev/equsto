import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
for (const f of ["var/catalog/ekipmanlar.json", "public/data/dept/hazirlik.json"]) {
  const p = path.join(ROOT, f);
  const data = JSON.parse(fs.readFileSync(p, "utf8"));
  let n = 0;
  for (const r of data) {
    if (String(r.brand || "").toLowerCase() !== "kitchenaid") continue;
    if (!r.specs || !r.specs.includes("Satış oranı:")) continue;
    const oran = Math.round(r.satis_oran * 100);
    r.specs = r.specs.replace(
      /Satış oranı: %\d+ \(katalog listesi üzerinden %\d+ iskonto\)/,
      `Satış oranı: %${oran} (katalog listesi üzerinden %${r.iskonto_oran} iskonto)`
    );
    n++;
  }
  fs.writeFileSync(p, JSON.stringify(data));
  console.log(f, "->", n, "specs fixed");
}