/**
 * equsto-katalog-master.json → ekipmanlar.json + dept/*.json (EQ- kodları)
 * Kaynak: PFOS/ÜRÜN KATEGORİZASYONU-DOLU.xlsx (ana besleyici)
 *   npm run catalog:master:apply
 */
import fs from "node:fs";
import {
  DEPT_DIR,
  EKIPMANLAR_PATH,
  MASTER_JSON_PATH,
  MASTER_XLSX_FILENAME,
} from "./catalog-master-paths.mjs";

const MASTER = MASTER_JSON_PATH;
const EKIP = EKIPMANLAR_PATH;

function kategoriYolu(p) {
  return [
    p.urun_kategori,
    p.urun_alt_kategori,
    p.alt_kategori_1,
    p.alt_kategori_2,
  ].filter(Boolean);
}

function mergeFields(row, p) {
  row.equsto_kod = p.equsto_kod;
  row.marka_kodu = p.marka_kodu || row.marka_kodu;
  row.marka_urun_kodu = p.marka_urun_kodu || row.marka_urun_kodu;
  row.urun_kategori = p.urun_kategori;
  row.urun_alt_kategori = p.urun_alt_kategori;
  row.alt_kategori_1 = p.alt_kategori_1;
  row.alt_kategori_2 = p.alt_kategori_2;
  row.kategori_yolu = kategoriYolu(p);
  if (p.fiyat_eur != null && !row.liste_fiyati_eur) {
    row.liste_fiyati_eur = p.fiyat_eur;
  }
  return row;
}

function main() {
  if (!fs.existsSync(MASTER)) {
    console.error(
      `Master JSON yok. Önce: npm run catalog:master:import-xlsx (${MASTER_XLSX_FILENAME})`,
    );
    process.exit(1);
  }

  const masterMeta = JSON.parse(fs.readFileSync(MASTER, "utf8"));
  if (
    masterMeta.source &&
    !String(masterMeta.source).includes("DOLU")
  ) {
    console.warn(
      `[master:apply] uyarı: master JSON kaynağı ${MASTER_XLSX_FILENAME} değil (${masterMeta.source})`,
    );
  }
  if (!fs.existsSync(EKIP)) {
    console.error("ekipmanlar.json yok");
    process.exit(1);
  }

  const products = masterMeta.products || [];
  const byId = new Map(products.filter((p) => p.id).map((p) => [p.id, p]));
  const byEq = new Map(
    products.map((p) => [String(p.equsto_kod || "").toUpperCase(), p]),
  );

  const ekip = JSON.parse(fs.readFileSync(EKIP, "utf8"));
  let matched = 0;
  for (const row of ekip) {
    const p =
      (row.id && byId.get(row.id)) ||
      byEq.get(String(row.equsto_kod || "").toUpperCase());
    if (!p) continue;
    mergeFields(row, p);
    matched++;
  }

  const backup = `${EKIP}.backup-master-${Date.now()}.json`;
  fs.copyFileSync(EKIP, backup);
  fs.writeFileSync(EKIP, JSON.stringify(ekip), "utf8");

  let deptPatched = 0;
  if (fs.existsSync(DEPT_DIR)) {
    for (const file of fs.readdirSync(DEPT_DIR)) {
      if (!file.endsWith(".json")) continue;
      const fp = path.join(DEPT_DIR, file);
      const rows = JSON.parse(fs.readFileSync(fp, "utf8"));
      if (!Array.isArray(rows)) continue;
      let changed = false;
      for (const row of rows) {
        const p = row.id && byId.get(row.id);
        if (!p) continue;
        mergeFields(row, p);
        changed = true;
        deptPatched++;
      }
      if (changed) fs.writeFileSync(fp, JSON.stringify(rows), "utf8");
    }
  }

  console.log("[master:apply] ekipmanlar:", matched, "/", ekip.length);
  console.log("[master:apply] dept satır:", deptPatched);
  console.log("[master:apply] yedek:", path.basename(backup));
  console.log("[master:apply] sonraki: npm run catalog:master:publish");
}

main();
