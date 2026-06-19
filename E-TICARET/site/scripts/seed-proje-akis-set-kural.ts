/**
 * proje-akis.json → eqSets + rules taslakları (konsept m² bantlarından).
 * Kullanım: npx tsx scripts/seed-proje-akis-set-kural.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { enrichShopTypesFromFile } from "../lib/pfos/proje-akis/konsept-tanimlari";
import {
  createStarterEqSets,
  createStarterRules,
} from "../lib/pfos/proje-akis/set-kural-taslak";

const jsonPath = join(process.cwd(), "public/data/proje-akis.json");
const raw = JSON.parse(readFileSync(jsonPath, "utf8")) as {
  success?: boolean;
  data?: Record<string, unknown>;
};

const data = (raw.data ?? raw) as Record<string, unknown>;
const shopTypes = enrichShopTypesFromFile(
  Array.isArray(data.shopTypes) ? (data.shopTypes as Parameters<typeof enrichShopTypesFromFile>[0]) : [],
);

const eqSets = createStarterEqSets(shopTypes);
const rules = createStarterRules(shopTypes, eqSets);

data.eqSets = eqSets;
data.rules = rules;
data.updated_at = new Date().toISOString();

const out = raw.data ? { ...raw, data } : data;
writeFileSync(jsonPath, JSON.stringify(out, null, 2) + "\n", "utf8");

const active = shopTypes.filter((t) => t.pfos.durum !== "planlanan").length;
const planlanan = shopTypes.length - active;
console.log(`Konsept: ${shopTypes.length} (aktif/motor: ${active}, planlanan: ${planlanan})`);
console.log(`Set: ${eqSets.length}, Kural: ${rules.length}`);
console.log(`Kaynak: ${jsonPath}`);
