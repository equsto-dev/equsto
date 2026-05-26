/**
 * @deprecated ekipmanlar.json kullanılmaz. Bunun yerine:
 *   npm run catalog:atalay:pdf
 */
console.error("[atalay-merge] DEPRECATED — npm run catalog:atalay:pdf kullanın (PDF-only).");
process.exit(1);

/**
 * ekipmanlar.json içindeki Atalay satırlarını dept/*.json vitrin dosyalarına ekler.
 * Çalıştır: npm run catalog:atalay:merge
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const EKIP = path.join(ROOT, "public/data/ekipmanlar.json");
const DONER_JSON = path.join(ROOT, "public/data/atalay-doner-ocak.json");

const DEPT_MAP = {
  pisirme: "pisirme",
  kahve: "kahve",
  araba: "araba",
  yardimci: "hazirlik",
};

function rowKey(x) {
  return [x.brand, x.name, x.category].map((s) => String(s || "").trim()).join("|");
}

function isAtalay(row) {
  return /atalay/i.test(String(row.brand || ""));
}

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function priceFromDonerCatalog(modelCode, donerByModel) {
  const p = donerByModel.get(modelCode);
  if (!p) return null;
  const tl = p.priceTl;
  return `₺${Number(tl).toLocaleString("tr-TR")} + KDV`;
}

function main() {
  const catalog = loadJson(EKIP);
  const donerManifest = fs.existsSync(DONER_JSON) ? loadJson(DONER_JSON) : { products: [] };
  const donerByModel = new Map();
  for (const p of donerManifest.products || []) {
    donerByModel.set(p.modelCode, p);
    if (p.name) {
      const m = /AD[A-Z0-9+\-]+/i.exec(p.name);
      if (m) donerByModel.set(m[0].toUpperCase(), p);
    }
  }

  const summary = {};

  for (const [srcDept, fileDept] of Object.entries(DEPT_MAP)) {
    const deptPath = path.join(ROOT, "public/data/dept", `${fileDept}.json`);
    if (!fs.existsSync(deptPath)) {
      console.warn("[atalay-merge] skip missing", deptPath);
      continue;
    }
    const existing = loadJson(deptPath);
    const keys = new Set(existing.map(rowKey));
    let added = 0;
    let priced = 0;

    for (const row of catalog) {
      if (!isAtalay(row)) continue;
      const d = String(row.dept || "").trim() || srcDept;
      if (d !== srcDept) continue;
      const k = rowKey(row);
      if (keys.has(k)) {
        const code = /AD[A-Z0-9+\-]+/i.exec(row.name || "");
        if (code && donerByModel.has(code[0].toUpperCase())) {
          const idx = existing.findIndex((r) => rowKey(r) === k);
          if (idx >= 0) {
            const np = priceFromDonerCatalog(code[0].toUpperCase(), donerByModel);
            if (np && existing[idx].price !== np) {
              existing[idx].price = np;
              if (!existing[idx].fiyat_tl) existing[idx].fiyat_tl = donerByModel.get(code[0].toUpperCase()).priceTl;
              priced++;
            }
          }
        }
        continue;
      }
      const copy = { ...row };
      const code = /AD[A-Z0-9+\-]+/i.exec(copy.name || "");
      if (code && donerByModel.has(code[0].toUpperCase())) {
        const p = donerByModel.get(code[0].toUpperCase());
        copy.price = priceFromDonerCatalog(code[0].toUpperCase(), donerByModel);
        copy.fiyat_tl = p.priceTl;
        copy.liste_fiyati_eur = p.priceEuroCatalog;
        copy.satis_eur_net = p.priceEuroSite;
        copy.kaynak_fiyat_listesi = "atalay-2025-yerli-doner-pdf";
        priced++;
      }
      existing.push(copy);
      keys.add(k);
      added++;
    }

    fs.writeFileSync(deptPath, JSON.stringify(existing), "utf8");
    summary[fileDept] = { added, priced, total: existing.length };
    console.log(`[atalay-merge] ${fileDept}.json +${added} fiyat güncelleme ${priced} → toplam ${existing.length}`);
  }

  const manifestPath = path.join(ROOT, "public/data/atalay-merge-log.json");
  fs.writeFileSync(
    manifestPath,
    JSON.stringify({ at: new Date().toISOString(), summary }, null, 2),
    "utf8"
  );
}

main();
