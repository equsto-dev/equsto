// Re-check recently scraped slugs that might fail cleanup
const slugs = [
  "bufe-icin-yumurta-isitici-gri",
  "12-litrelik-fritozler-icin-tasinabilir-akulu-kizartma-yagi-filtresi-30-lt-dakika",
  "m003r-radyanli-pilic-cevirme-makinesi",
];
import fs from "node:fs";
import path from "node:path";
const ROOT = "C:/D Disk/EQUSTO-WORK/PFOS/veri/pimak/urun-sayfalari";
for (const s of slugs) {
  const p = path.join(ROOT, s + ".json");
  console.log(s, fs.existsSync(p) ? "VAR" : "YOK");
}
