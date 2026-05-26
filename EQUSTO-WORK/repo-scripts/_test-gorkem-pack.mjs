import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normCatalogKey } from "./lib/norm-catalog-key.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, "public/data/ekipmanlar.json"), "utf8"));
const idx = JSON.parse(fs.readFileSync(path.join(ROOT, "public/data/.kariyer_product_index.json"), "utf8"));
const p = catalog.find((x) => x.id === "gorkem__gorkem-elektrikli-sos-benmari-alt-dolapli-40x71x85-cm-781");
const dp = idx[normCatalogKey(p.name)];
console.log("path", dp);

const mod = await import("./restore-gorkem-images.mjs");
