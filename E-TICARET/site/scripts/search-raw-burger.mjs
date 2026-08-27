import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(__dirname, "..");
const WIZARD_PATH = path.join(SITE, "public", "data", "pfos-wizard-branches.json");

const wizard = JSON.parse(fs.readFileSync(WIZARD_PATH, "utf8"));

// Let's search for any key or value containing "burger" or "hamburgerci"
const occurrences = [];

function deepSearch(val, pathStr = "") {
  if (!val) return;
  if (typeof val === "string") {
    if (val.toLowerCase().includes("burger") || val.toLowerCase().includes("hamburgerci")) {
      occurrences.push({ path: pathStr, val });
    }
  } else if (typeof val === "object") {
    if (Array.isArray(val)) {
      val.forEach((item, idx) => deepSearch(item, `${pathStr}[${idx}]`));
    } else {
      for (const [k, v] of Object.entries(val)) {
        if (k.toLowerCase().includes("burger") || k.toLowerCase().includes("hamburgerci")) {
          occurrences.push({ path: `${pathStr}.${k}`, val: "[Key itself contains term]" });
        }
        deepSearch(v, pathStr ? `${pathStr}.${k}` : k);
      }
    }
  }
}

deepSearch(wizard);

console.log(`Found ${occurrences.length} occurrences.`);
occurrences.slice(0, 15).forEach(o => {
  console.log(`- Path: ${o.path} | Value: ${o.val}`);
});
