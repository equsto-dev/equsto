import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function appendPower(row, lines, source = "cafemarkt.com") {
  const teknik = Array.isArray(row.teknik_ozellikler) ? [...row.teknik_ozellikler] : [];
  for (const line of lines) {
    const key = line.split(":")[0];
    if (!teknik.some((t) => String(t).startsWith(key))) teknik.push(line);
  }
  row.teknik_ozellikler = teknik;
  let specs = String(row.specs ?? "");
  if (!lines.some((l) => specs.includes(l.split(":")[0]))) {
    specs += `\n\nTeknik Özellikler (${source})\n${lines.join("\n")}`;
    row.specs = specs;
  }
}

const catalog = JSON.parse(
  readFileSync(join(root, "public/data/ekipmanlar.json"), "utf8"),
);

const patches = {
  "INO-BYM052ST": [
    "Elektrik Girişi: 220-240V 50Hz",
    "Maks. Güç Tüketimi(kW): 4,95",
  ],
  "9584.00MDX.00": ["Güç: 350 W", "Elektrik: 230 V monofaze"],
};

for (const [sku, lines] of Object.entries(patches)) {
  const row = catalog.find((r) => r.sku === sku);
  if (!row) {
    console.warn("missing", sku);
    continue;
  }
  appendPower(row, lines);
  console.log("patched", sku, lines.at(-1));
}

writeFileSync(join(root, "public/data/ekipmanlar.json"), JSON.stringify(catalog));

const ekPath = join(root, "public/data/pfos-ek-katalog.json");
const ek = JSON.parse(readFileSync(ekPath, "utf8"));
for (const item of ek.items ?? []) {
  if (item.sku === "9805.CB416.HC") {
    appendPower(item, [
      "Elektrik Girişi: 220-240V ~ 50Hz",
      "Ortalama güç tüketimi: 450 W",
      "Maks. Güç Tüketimi(kW): 0,45",
    ], "bremagroup.it");
    console.log("patched ek-katalog", item.sku);
  }
}
writeFileSync(ekPath, JSON.stringify(ek, null, 2) + "\n");
