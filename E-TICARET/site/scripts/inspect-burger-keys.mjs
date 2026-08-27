import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(__dirname, "..");
const WIZARD_PATH = path.join(SITE, "public", "data", "pfos-wizard-branches.json");

const wizard = JSON.parse(fs.readFileSync(WIZARD_PATH, "utf8"));
const bulut = wizard.legacyKonsept["Bulut Mutfak"];

console.log("=== BULUT MUTFAK FIRST ITEM ===");
console.log(JSON.stringify(bulut[0], null, 2).slice(0, 1500));
