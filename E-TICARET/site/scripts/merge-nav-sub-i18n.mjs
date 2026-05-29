import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const trPath = path.join(root, "public/i18n/tr.json");
const subTr = JSON.parse(fs.readFileSync(path.join(root, "scripts/nav-sub-tr.generated.json"), "utf8"));

const tr = JSON.parse(fs.readFileSync(trPath, "utf8"));
tr.nav = tr.nav || {};
tr.nav.sub = subTr;
fs.writeFileSync(trPath, JSON.stringify(tr, null, 2) + "\n", "utf8");
console.log("[merge-nav-sub-i18n] nav.sub", Object.keys(subTr).length, "→ tr.json");
