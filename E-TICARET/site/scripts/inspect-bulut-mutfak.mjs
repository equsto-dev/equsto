import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(__dirname, "..");
const WIZARD_PATH = path.join(SITE, "public", "data", "pfos-wizard-branches.json");

const wizard = JSON.parse(fs.readFileSync(WIZARD_PATH, "utf8"));

console.log("=== BULUT MUTFAK IN DUKKANBYSEGMENT ===");
console.log(wizard.dukkanBySegment["Bulut Mutfak"]);

// Let's see if there is any other property containing the actual items or prices for concepts
// For example, is there a key like "packages" or "konseptler"? Or let's see how the JSON is structured.
// Let's search for "bulut-burger" or "burger" in the entire JSON file!
const rawJson = fs.readFileSync(WIZARD_PATH, "utf8");
console.log("\nContains 'bulut-burger'?", rawJson.includes("bulut-burger"));
console.log("Contains 'bulut_burger'?", rawJson.includes("bulut_burger"));
console.log("Contains 'hamburgerci'?", rawJson.toLowerCase().includes("hamburgerci"));
console.log("Contains 'burger'?", rawJson.toLowerCase().includes("burger"));
