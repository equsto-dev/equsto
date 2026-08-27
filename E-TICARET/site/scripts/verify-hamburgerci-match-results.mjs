import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(__dirname, "..");
const WIZARD_PATH = path.join(SITE, "public", "data", "pfos-wizard-branches.json");
const REFERANS_PATH = path.join(SITE, "public", "data", "pfos-referans", "bulut-burger-35-100.json");

async function main() {
  if (!fs.existsSync(WIZARD_PATH)) {
    console.error("Wizard branches file not found!");
    return;
  }
  
  const wizard = JSON.parse(fs.readFileSync(WIZARD_PATH, "utf8"));
  
  // Let's find the bulut-burger branch or category in wizard
  // In the wizard JSON, categories or branches are usually keyed by category ID
  console.log("=== WIZARD BRANCHES IN KATEGORİLER ===");
  
  const refData = JSON.parse(fs.readFileSync(REFERANS_PATH, "utf8"));
  
  // Let's check how the referans-eslestirme matches each item.
  // We can import referans-eslestirme.ts or run a quick simulation using referans-eslestirme's logic.
  // Actually, we can check pfos-wizard-branches.json directly to see what was generated for bulut-burger!
  
  // Let's search for bulut-burger inside the wizard JSON structure
  const findBurger = (obj, pathStr = "") => {
    if (typeof obj !== "object" || obj === null) return;
    if (Array.isArray(obj)) {
      obj.forEach((item, idx) => findBurger(item, `${pathStr}[${idx}]`));
    } else {
      for (const [k, v] of Object.entries(obj)) {
        if (k === "id" && v === "bulut-burger") {
          console.log(`Found bulut-burger at: ${pathStr}`);
          // Print parent or children details
          console.log(JSON.stringify(obj, null, 2).slice(0, 1000));
        }
        findBurger(v, `${pathStr}.${k}`);
      }
    }
  };
  
  findBurger(wizard);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
