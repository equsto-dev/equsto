#!/usr/bin/env node
/**
 * cafemarkt-portabianco.json → window.EQ_PB_CM_WITCDN (SKU hay → witcdn -B URL)
 *   node scripts/gen-portabianco-cafemarkt-img-map.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const CM_JSON = path.join(ROOT, "scripts/data/cafemarkt-portabianco.json");
const OUT = path.join(ROOT, "public/portabianco-cafemarkt-img-map.js");

function normHay(s) {
  return String(s || "")
    .toUpperCase()
    .replace(/İ/g, "I")
    .replace(/[^A-Z0-9]/g, "");
}

function cmModelKeys(cm) {
  const keys = new Set();
  const code = String(cm.code || "").trim();
  const m251 = code.match(/^251\.(.+)$/i);
  if (m251) {
    keys.add(normHay(m251[1].replace(/\./g, "-")));
    keys.add(normHay(m251[1].replace(/\./g, "")));
  }
  keys.add(normHay(code));
  const nameM = String(cm.name || "").match(/\bPortabianco\s+([A-Z0-9][A-Z0-9./-]{2,}?)(?:\s|,|$)/i);
  if (nameM) {
    keys.add(normHay(nameM[1]));
    keys.add(normHay(nameM[1].replace(/\./g, "-")));
  }
  return [...keys].filter((k) => k.length >= 3);
}

function witB(url) {
  const u = String(url || "").trim();
  if (!u) return "";
  return u.replace(/-O\.jpg(\?|$)/i, "-B.jpg$1").replace(/-o\.jpg(\?|$)/i, "-B.jpg$1");
}

function main() {
  if (!fs.existsSync(CM_JSON)) {
    console.error("Önce: node scripts/fetch-cafemarkt-portabianco.mjs");
    process.exit(1);
  }
  const rows = JSON.parse(fs.readFileSync(CM_JSON, "utf8"));
  const map = Object.create(null);
  for (const cm of rows) {
    const url = witB(cm.image || cm.images?.[0]);
    if (!url) continue;
    for (const key of cmModelKeys(cm)) {
      if (!map[key]) map[key] = url;
    }
  }
  const body =
    "/** Auto: scripts/gen-portabianco-cafemarkt-img-map.mjs — Portabianco SKU → Cafemarkt witcdn */\n" +
    "window.EQ_PB_CM_WITCDN=" +
    JSON.stringify(map) +
    ";\n";
  fs.writeFileSync(OUT, body, "utf8");
  console.log("[gen-pb-cm-map]", Object.keys(map).length, "keys →", OUT);
}

main();
