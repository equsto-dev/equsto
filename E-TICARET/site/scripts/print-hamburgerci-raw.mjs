import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(__dirname, "..");
const WIZARD_PATH = path.join(SITE, "public", "data", "pfos-wizard-branches.json");

const wizard = JSON.parse(fs.readFileSync(WIZARD_PATH, "utf8"));
console.log("=== Hamburgerci raw ===");
console.log(JSON.stringify(wizard.m2ByDukkan["Hamburgerci"], null, 2));

console.log("\n=== all m2ByDukkan keys ===");
console.log(Object.keys(wizard.m2ByDukkan));
