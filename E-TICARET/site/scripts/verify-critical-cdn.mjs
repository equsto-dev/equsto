/**
 * Deploy öncesi — logo + kritik statik varlıklar CDN'de mi?
 * Çıkış 0 = OK, 1 = hata
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assetCdnBase } from "./lib/asset-cdn-base.mjs";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const CRITICAL = [
  "images/equsto-logo.png",
  "images/equsto-logo-white.png",
  "images/pfos/proje-fabrikasi-mutfak-eskiz.png",
  "images/home/hero-bar-cocktailstation.png",
];

function encodeRel(rel) {
  return rel
    .split("/")
    .map((seg) => (seg ? encodeURIComponent(seg) : ""))
    .join("/");
}

const base = assetCdnBase(siteDir);
if (!base) {
  console.log("[verify-critical-cdn] CDN yok — yerel disk modu, atlanıyor");
  process.exit(0);
}

let fail = 0;
for (const rel of CRITICAL) {
  const url = `${base}/${encodeRel(rel)}`;
  try {
    const res = await fetch(url, { method: "HEAD", redirect: "follow" });
    if (res.ok) {
      console.log("[verify-critical-cdn] OK", rel);
    } else {
      console.error("[verify-critical-cdn] HATA", rel, res.status);
      fail = 1;
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[verify-critical-cdn] HATA", rel, msg);
    fail = 1;
  }
}

if (fail) process.exit(1);
console.log("[verify-critical-cdn] OK —", CRITICAL.length, "dosya");
