/**
 * Yalnızca questions[] günceller — shopTypes ve products dokunulmaz.
 * Kullanım: npx tsx scripts/seed-proje-akis-sorular.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { DEFAULT_WIZARD_QUESTIONS } from "../lib/pfos/proje-akis/wizard-questions";

const jsonPath = join(process.cwd(), "public/data/proje-akis.json");
const raw = JSON.parse(readFileSync(jsonPath, "utf8")) as {
  success?: boolean;
  data?: Record<string, unknown>;
};

const data = (raw.data ?? raw) as Record<string, unknown>;
const prevQ = Array.isArray(data.questions) ? data.questions.length : 0;
data.questions = DEFAULT_WIZARD_QUESTIONS;
data.updated_at = new Date().toISOString();

const out = raw.data ? { ...raw, data } : data;
writeFileSync(jsonPath, JSON.stringify(out, null, 2) + "\n", "utf8");

console.log(
  `Sorular: ${prevQ} → ${DEFAULT_WIZARD_QUESTIONS.length} (konsept/ürün korundu)`,
);
console.log(
  `Konsept: ${Array.isArray(data.shopTypes) ? data.shopTypes.length : 0} · Ürün: ${Array.isArray(data.products) ? data.products.length : 0}`,
);
