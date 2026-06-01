/**
 * Aktif PFOS paketlerinden public /pfos sihirbaz dalları → pfos-wizard-branches.json
 * Kullanım: npm run pfos:wizard-branches:build
 * (Önce: npx tsx scripts/seed-proje-akis-konsept.ts)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(__dirname, "..");
const PROJE_AKIS = path.join(SITE, "public", "data", "proje-akis.json");
const OUT = path.join(SITE, "public", "data", "pfos-wizard-branches.json");

const SEGMENT_DESC = {
  Restoran: "Steakhouse, balık, kebap, pizzacı, Türk restoran…",
  "Kafe / Coffee Shop": "Coffee shop, casual cafe, harvest, kahve durağı…",
  "Fast Food / QSR": "Burger, kiosk, tavukçu, döner, pizza paket…",
  "Pastane & Fırın": "Pastane, güneli fırın, artisan üretim…",
  "Bar & Lounge": "Birahane, kokteyl, wine & beer bar…",
  "Otel F&B": "Şehir oteli, resort, tatil & kayak oteli…",
  Catering: "Yemekhane, yerinde üretim, taşıma yemek…",
  "Bulut Mutfak": "Grab&Go, coffee counter, döner, pizza…",
  "Üretim / Fabrika": "Fabrika mutfak ölçekleri (m² bandı)",
};

/** pfos-rule-engine.js ile uyum — üst segment etiketi → eski konsept anahtarı */
const LEGACY_KONSEPT = {
  Restoran: "Restaurant",
  "Kafe / Coffee Shop": "Cafe",
  "Fast Food / QSR": "Restaurant",
  "Pastane & Fırın": "Pastane & Patisserie",
  "Bar & Lounge": "Bar",
  "Otel F&B": "Hotel",
  Catering: "Catering",
  "Bulut Mutfak": "Bulut Mutfak",
  "Üretim / Fabrika": "Catering",
  Bilmiyorum: "Restaurant",
};

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function main() {
  const raw = readJson(PROJE_AKIS);
  const data = raw.data ?? raw;
  const shopTypes = Array.isArray(data.shopTypes) ? data.shopTypes : [];
  const questions = Array.isArray(data.questions) ? data.questions : [];
  const qSeg = questions.find((q) => q.id === "q_ust_segment");
  const segmentOrder = Array.isArray(qSeg?.options)
    ? qSeg.options.filter((s) => s && s !== "Bilmiyorum")
    : Object.keys(SEGMENT_DESC);

  const dukkanBySegment = {};
  const m2ByDukkan = {};
  for (const t of shopTypes) {
    const pf = t.pfos || {};
    if (pf.durum !== "aktif") continue;
    const parent = String(t.parent || "Bilmiyorum").trim();
    const sel = String(pf.dukkanSecim || t.name || "").trim();
    if (!sel) continue;
    if (!dukkanBySegment[parent]) dukkanBySegment[parent] = [];
    if (!dukkanBySegment[parent].includes(sel)) dukkanBySegment[parent].push(sel);
    if (pf.m2Min > 0 || pf.m2Max > 0) {
      m2ByDukkan[sel] = { min: pf.m2Min || 20, max: pf.m2Max || 500, slug: pf.motorSlug || "" };
    }
  }
  for (const parent of Object.keys(dukkanBySegment)) {
    if (!dukkanBySegment[parent].includes("Bilmiyorum")) {
      dukkanBySegment[parent].push("Bilmiyorum");
    }
  }
  dukkanBySegment.Franchise = dukkanBySegment.Restoran
    ? [...dukkanBySegment.Restoran]
    : ["Bilmiyorum"];

  const konseptRows = segmentOrder.map((seg) => ({
    v: seg,
    label: seg,
    desc: SEGMENT_DESC[seg] || "Equsto referans paketleri",
  }));

  const payload = {
    version: 1,
    updated_at: new Date().toISOString(),
    aktifPaketSayisi: shopTypes.filter((t) => t.pfos?.durum === "aktif").length,
    segmentOrder,
    konseptRows,
    dukkanBySegment,
    legacyKonsept: LEGACY_KONSEPT,
    m2ByDukkan,
  };

  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2) + "\n", "utf8");
  console.log("OK", OUT);
  console.log(
    "Kafe paketleri:",
    (dukkanBySegment["Kafe / Coffee Shop"] || []).join(", "),
  );
}

main();
