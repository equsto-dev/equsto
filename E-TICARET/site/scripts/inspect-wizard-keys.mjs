import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(__dirname, "..");
const WIZARD_PATH = path.join(SITE, "public", "data", "pfos-wizard-branches.json");

const wizard = JSON.parse(fs.readFileSync(WIZARD_PATH, "utf8"));
console.log("Keys:", Object.keys(wizard));

if (wizard.branches) {
  console.log("Branches keys:", Object.keys(wizard.branches));
}
if (Array.isArray(wizard)) {
  console.log("Wizard is an array of size:", wizard.length);
  console.log("First element keys:", Object.keys(wizard[0]));
} else {
  // Print first 500 characters of the wizard JSON to see the schema
  console.log(JSON.stringify(wizard, null, 2).slice(0, 1500));
}
