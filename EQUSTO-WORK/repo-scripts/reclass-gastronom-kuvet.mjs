/**
 * Gastronom küvet → gastronom-kuvetler (yardimci). Bainmarie / kuvetli / taşıma hariç.
 *   node scripts/reclass-gastronom-kuvet.mjs --apply
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const CATALOG = path.join(ROOT, "public", "data", "ekipmanlar.json");
const APPLY = process.argv.includes("--apply");
const idArg = process.argv.find((a) => a.startsWith("--id="));
const ONLY_ID = idArg ? idArg.slice("--id=".length) : null;

/** Küvetler vitrini: GN küvet, küvet kapak, polikarbon/polipropilen kap. */
function isKuvetlerProduct(name) {
  const hay = String(name || "").toLocaleLowerCase("tr");
  if (!/(küvet|kuvet)/.test(hay)) return false;
  if (/bain\s*marie|bainmarie/i.test(hay)) return false;
  if (/küvetli|kuvetli|küvetsiz|kuvetsiz/i.test(hay)) return false;
  if (/küvet\s*kapasiteli|kuvet\s*kapasiteli/i.test(hay)) return false;
  if (/küvet\s*ta[sş][ıi]ma|kuvet\s*ta[sş][ıi]ma|küvet\s*taşıbasma|kuvet\s*tasima/i.test(hay)) return false;
  if (/banket\s*arab/i.test(hay) && /kapasiteli/i.test(hay)) return false;
  if (/benmari/i.test(hay) && !/gastronom\s*(küvet|kuvet)/i.test(hay)) return false;
  if (/salad\s*bar|saladbar|buzdolab|make\s*up|make-up/i.test(hay)) return false;

  if (/(küvet|kuvet)\s*kapak|kapak.*(küvet|kuvet)/i.test(hay)) return true;
  if (/gastronom/.test(hay) && /(küvet|kuvet)/.test(hay)) return true;
  if (/saplı\s*gastronom|sapli\s*gastronom/i.test(hay)) return true;
  if (/delikli\s*gnp/i.test(hay) && /(küvet|kuvet)/.test(hay)) return true;
  if (/polikarbon|polipropilen|policarbon/i.test(hay) && /(küvet|kuvet)/.test(hay)) return true;
  if (/\bgn\s*\d+\s*\/\s*\d+.*(küvet|kuvet)|(küvet|kuvet).*\bgn\s*\d/i.test(hay)) return true;
  return false;
}

/** Yanlış pozitifleri eski departmana döndür */
function revertWrong(p) {
  const hay = String(p.name || "").toLocaleLowerCase("tr");
  if (/küvetli|kuvetli|salad\s*bar|saladbar|make\s*up|make-up|buzdolab/.test(hay)) {
    return { dept: "sogutma", category: "sogutma-ekipmanlari" };
  }
  if (/küvet\s*ta[sş][ıi]ma|kuvet\s*ta[sş][ıi]ma/i.test(hay)) {
    return { dept: "araba", category: "paslanmaz-urunler" };
  }
  return null;
}

const catalog = JSON.parse(fs.readFileSync(CATALOG, "utf8"));
let hits = [];
let reverts = [];

for (const p of catalog) {
  if (ONLY_ID && p.id !== ONLY_ID) continue;

  const back = p.category === "gastronom-kuvetler" ? revertWrong(p) : null;
  if (back) {
    reverts.push({ p, ...back });
    continue;
  }

  if (ONLY_ID) {
    if (isKuvetlerProduct(p.name)) hits.push(p);
  } else if (isKuvetlerProduct(p.name)) {
    hits.push(p);
  }
}

console.log(`[reclass] ${hits.length} küvet / kapak → gastronom-kuvetler`);
console.log(`[revert] ${reverts.length} yanlış pozitif geri alınıyor`);

for (const p of hits) {
  console.log(`  + ${p.id}`);
  if (APPLY) {
    p.category = "gastronom-kuvetler";
    p.dept = "yardimci";
  }
}
for (const { p, dept, category } of reverts) {
  console.log(`  - ${p.id} → ${category} (${dept})`);
  if (APPLY) {
    p.category = category;
    p.dept = dept;
  }
}

if (APPLY && (hits.length || reverts.length)) {
  fs.writeFileSync(CATALOG, JSON.stringify(catalog, null, 2) + "\n", "utf8");
  console.log("\n[apply] ekipmanlar.json — npm run data:dept");
} else if (!APPLY) {
  console.log("\nUygulamak için: node scripts/reclass-gastronom-kuvet.mjs --apply");
}
