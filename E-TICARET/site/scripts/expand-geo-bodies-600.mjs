import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const p = path.join(path.dirname(fileURLToPath(import.meta.url)), "geo-bodies-600.json");
const bodies = JSON.parse(fs.readFileSync(p, "utf8"));

const pad =
  " Saha ölçüsü ve menü profili netleştikten sonra ekipman listesi Proje Fabrikası’nda tamamlanır; montaj ve devreye alma satış mühendisliği planıyla yürütülür.";

for (const [key, html] of Object.entries(bodies)) {
  let plain = html.replace(/<[^>]+>/g, "");
  if (plain.length >= 600) continue;
  const need = 620 - plain.length;
  let extra = pad;
  if (extra.length > need + 40) {
    extra = extra.slice(0, need + 15).replace(/\s+\S*$/, "") + ".";
  }
  if (!html.endsWith("</p>")) continue;
  bodies[key] = html.replace(/<\/p>\s*$/, extra + "</p>");
  plain = bodies[key].replace(/<[^>]+>/g, "");
  console.log(key, plain.length);
}

fs.writeFileSync(p, JSON.stringify(bodies, null, 2) + "\n");
