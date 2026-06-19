#!/usr/bin/env node
/**
 * public/pfos.html içindeki sihirbaz scriptlerini public/pfos-wizard.js (+ bootstrap) olarak çıkarır.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, "..", "public");
const HTML = path.join(PUBLIC, "pfos.html");
const OUT = path.join(PUBLIC, "pfos-wizard.js");
const BOOT_OUT = path.join(PUBLIC, "pfos-wizard-bootstrap.js");

const WIZARD_START = "function escHtml(s){";
const WIZARD_END_MARKER = "pfModalAc('Teklif gönderilemedi'";

function sliceBetween(html, startNeedle, endNeedle) {
  const start = html.indexOf(startNeedle);
  if (start < 0) return null;
  const end = html.indexOf(endNeedle, start);
  if (end < 0) return null;
  const tail = html.indexOf("\n}", end);
  return html.slice(start, tail >= 0 ? tail + 2 : end + endNeedle.length);
}

function main() {
  let html = fs.readFileSync(HTML, "utf8");
  if (html.charCodeAt(0) === 0xfeff) html = html.slice(1);

  const wizard = sliceBetween(html, WIZARD_START, WIZARD_END_MARKER);
  if (!wizard || !wizard.includes("pfosBootWizard")) {
    console.error("wizard block not found");
    process.exit(1);
  }

  const boot1 = html.match(
    /fetch\('\/data\/pfos-zone-catalog\.json'[\s\S]*?\}\)\(\);/,
  );
  const boot2 = html.match(
    /\/\* PFOS v2 Faz 1[\s\S]*?EqustoPfosRuleEngine\.init\(\);\s*\}\)\(\);/,
  );
  if (!boot1 || !boot2) {
    console.error("bootstrap blocks not found");
    process.exit(1);
  }

  const header = "/** Auto-generated — scripts/extract-pfos-wizard.mjs */\n";
  fs.writeFileSync(
    BOOT_OUT,
    header + `(function () {\n${boot1[0]}\n})();\n\n(function () {\n${boot2[0]}\n})();\n`,
    "utf8",
  );
  fs.writeFileSync(OUT, header + wizard + "\n", "utf8");
  console.log("wrote", BOOT_OUT);
  console.log("wrote", OUT, wizard.length, "chars");
}

main();
