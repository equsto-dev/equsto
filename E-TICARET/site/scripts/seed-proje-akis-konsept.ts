/**
 * proje-akis.json içinde questions + shopTypes günceller; products korunur.
 * Kullanım: npx tsx scripts/seed-proje-akis-konsept.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PFOS_KONSEPT_SHOP_TYPES } from "../lib/pfos/proje-akis/konsept-tanimlari";
import { DEFAULT_WIZARD_QUESTIONS } from "../lib/pfos/proje-akis/wizard-questions";

const jsonPath = join(process.cwd(), "public/data/proje-akis.json");
const raw = JSON.parse(readFileSync(jsonPath, "utf8")) as {
  success?: boolean;
  data?: Record<string, unknown>;
};

const data = (raw.data ?? raw) as Record<string, unknown>;
const prevRules = Array.isArray(data.rules) ? data.rules : [];
const prevEqSets = Array.isArray(data.eqSets) ? data.eqSets : [];
data.questions = DEFAULT_WIZARD_QUESTIONS;
data.shopTypes = PFOS_KONSEPT_SHOP_TYPES;
data.rules = prevRules;
data.eqSets = prevEqSets;
data.updated_at = new Date().toISOString();

const out = raw.data ? { ...raw, data } : data;
writeFileSync(jsonPath, JSON.stringify(out, null, 2) + "\n", "utf8");

console.log(
  `Güncellendi: ${DEFAULT_WIZARD_QUESTIONS.length} soru, ${PFOS_KONSEPT_SHOP_TYPES.length} konsept`,
);
console.log(`Ürün sayısı korundu: ${Array.isArray(data.products) ? data.products.length : 0}`);
