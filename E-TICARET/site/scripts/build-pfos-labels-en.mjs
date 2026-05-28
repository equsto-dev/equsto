/**
 * PFOS TR→EN sözlüğü → public/i18n/pfos-labels-en.json
 *   node scripts/build-pfos-labels-en.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PFOS_LABELS_EN } from "./pfos-labels-en-source.mjs";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(siteDir, "public/i18n/pfos-labels-en.json");

fs.writeFileSync(
  out,
  `${JSON.stringify({ version: 1, labels: PFOS_LABELS_EN }, null, 2)}\n`,
  "utf8"
);
console.log("[build-pfos-labels-en] wrote", out, Object.keys(PFOS_LABELS_EN).length, "labels");
