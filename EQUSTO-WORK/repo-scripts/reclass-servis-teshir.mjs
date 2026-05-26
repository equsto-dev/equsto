/**
 * Servis & teşhir → market-reyon (Servis & Teşhir vitrini).
 *   node scripts/reclass-servis-teshir.mjs
 *   node scripts/reclass-servis-teshir.mjs --apply
 *   node scripts/reclass-servis-teshir.mjs --id=gorkem__... --apply
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

function isServisTeshir(name) {
  const hay = String(name || "").toLocaleLowerCase("tr");
  if (!hay) return false;

  if (/\bsalad\s*bar\b|\bsaladbar\b|\bsoğuk\s*büfe\b|\bsoguk\s*bufe\b/.test(hay)) {
    if (/\b(ısıt|isit|benmari|chafing)\b/.test(hay) && !/\bsoğuk\b|\bsoguk\b/.test(hay)) return false;
    return true;
  }

  if (/\byemeklik\b/.test(hay) && /\b(ısıt|isit|sıcak|sicak)\b/.test(hay)) return true;
  if (/\bself\s*servis\b/.test(hay) && /\b(sıcak|sicak|ısıt|isit)\b/.test(hay)) return true;
  if (/\bpili[cç]\b/.test(hay) && /\b(ısıt|isit|nemlendir)\b/.test(hay)) return true;
  if (/\bnemlendir(meli)?\b/.test(hay) && /\b(ısıt|isit)\b/.test(hay)) return true;
  if (/\bsıcak\s*teşhir|\bsicak\s*teshir|\bısıtmalı\s*teşhir|\bisitmali\s*teshir/.test(hay)) return true;
  if (/\bbenmari\b|\bbain\s*marie\b|\bchafing\b/.test(hay)) return true;
  if (/\bservis\s*(ünitesi|unitesi|hattı|hatti|bankosu|banko)\b/.test(hay)) return true;
  if (/\btabak\s*(ısıt|isit)|\bdish\s*warmer\b/.test(hay)) return true;

  return false;
}

const catalog = JSON.parse(fs.readFileSync(CATALOG, "utf8"));
const hits = catalog.filter((p) => {
  if (ONLY_ID) return p.id === ONLY_ID;
  return isServisTeshir(p.name);
});

console.log(`[reclass] ${hits.length} servis & teşhir (market-reyon)`);
for (const p of hits) {
  console.log(`  ${p.id}`);
  console.log(`    ${p.category} (${p.dept}) → market-reyonlari (market-reyon)`);
  if (APPLY) {
    p.category = "market-reyonlari";
    p.dept = "market-reyon";
  }
}

if (APPLY && hits.length) {
  fs.writeFileSync(CATALOG, JSON.stringify(catalog, null, 2) + "\n", "utf8");
  console.log("\n[apply] ekipmanlar.json güncellendi — npm run data:dept");
} else if (!APPLY) {
  console.log("\nUygulamak için: node scripts/reclass-servis-teshir.mjs --apply");
}
