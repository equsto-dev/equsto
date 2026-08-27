import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(__dirname, "..");
const WIZARD_PATH = path.join(SITE, "public", "data", "pfos-wizard-branches.json");

const wizard = JSON.parse(fs.readFileSync(WIZARD_PATH, "utf8"));

console.log("Type of legacyKonsept:", typeof wizard.legacyKonsept);
if (Array.isArray(wizard.legacyKonsept)) {
  console.log("legacyKonsept is an array of length:", wizard.legacyKonsept.length);
  console.log("First element:", wizard.legacyKonsept[0]);
} else {
  console.log("legacyKonsept keys:", Object.keys(wizard.legacyKonsept));
  const firstKey = Object.keys(wizard.legacyKonsept)[0];
  console.log(`Value type of '${firstKey}':`, typeof wizard.legacyKonsept[firstKey]);
  console.log(`Value of '${firstKey}':`, JSON.stringify(wizard.legacyKonsept[firstKey]).slice(0, 500));
}
