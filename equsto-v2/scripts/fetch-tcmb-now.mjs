import { fetchTcmbEurRate } from "./fetch-tcmb-kur.mjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "scripts/data/tcmb-kur-snapshot.json");

const kur = await fetchTcmbEurRate();
const snap = { ...kur, savedAt: new Date().toISOString() };
fs.writeFileSync(OUT, JSON.stringify(snap, null, 2));
console.log(JSON.stringify(snap, null, 2));
